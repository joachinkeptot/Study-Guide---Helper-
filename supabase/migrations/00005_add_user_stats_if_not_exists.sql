-- Migration: Add user_stats table if it doesn't exist
-- This is a safe migration that won't fail if tables already exist

-- Create user_stats table only if it doesn't exist
CREATE TABLE IF NOT EXISTS user_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_practice_date DATE,
    daily_goal INTEGER DEFAULT 10,
    questions_today INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create guide_tags table only if it doesn't exist
CREATE TABLE IF NOT EXISTS guide_tags (
    id BIGSERIAL PRIMARY KEY,
    study_guide_id BIGINT NOT NULL REFERENCES study_guides(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(study_guide_id, tag)
);

-- Create session_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE session_type AS ENUM ('normal', 'weak_areas', 'exam_mode', 'quick_practice');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add session type columns to practice_sessions if they don't exist
DO $$ 
BEGIN
    -- Add session_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='practice_sessions' AND column_name='session_type') THEN
        ALTER TABLE practice_sessions ADD COLUMN session_type session_type DEFAULT 'normal';
    END IF;
    
    -- Add time_limit_minutes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='practice_sessions' AND column_name='time_limit_minutes') THEN
        ALTER TABLE practice_sessions ADD COLUMN time_limit_minutes INTEGER;
    END IF;
    
    -- Add is_timed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='practice_sessions' AND column_name='is_timed') THEN
        ALTER TABLE practice_sessions ADD COLUMN is_timed BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add questions_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='practice_sessions' AND column_name='questions_count') THEN
        ALTER TABLE practice_sessions ADD COLUMN questions_count INTEGER;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_guide_tags_study_guide_id ON guide_tags(study_guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_tags_tag ON guide_tags(tag);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_session_type ON practice_sessions(session_type);

-- Enable RLS on user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;

CREATE POLICY "Users can view own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
    ON user_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
    ON user_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- Enable RLS on guide_tags
ALTER TABLE guide_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view tags for their guides" ON guide_tags;
DROP POLICY IF EXISTS "Users can insert tags for their guides" ON guide_tags;
DROP POLICY IF EXISTS "Users can delete tags from their guides" ON guide_tags;

CREATE POLICY "Users can view tags for their guides"
    ON guide_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM study_guides
            WHERE study_guides.id = guide_tags.study_guide_id
            AND study_guides.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert tags for their guides"
    ON guide_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM study_guides
            WHERE study_guides.id = guide_tags.study_guide_id
            AND study_guides.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tags from their guides"
    ON guide_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM study_guides
            WHERE study_guides.id = guide_tags.study_guide_id
            AND study_guides.user_id = auth.uid()
        )
    );

-- Function to update user stats after practice
CREATE OR REPLACE FUNCTION update_user_stats_after_practice()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Get user_id from the session
    SELECT user_id INTO v_user_id
    FROM practice_sessions
    WHERE id = NEW.session_id;

    -- Insert or update user_stats
    INSERT INTO user_stats (user_id, last_practice_date, questions_today, current_streak, longest_streak)
    VALUES (v_user_id, v_today, 1, 1, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        questions_today = CASE
            WHEN user_stats.last_practice_date = v_today THEN user_stats.questions_today + 1
            ELSE 1
        END,
        current_streak = CASE
            WHEN user_stats.last_practice_date = v_today THEN user_stats.current_streak
            WHEN user_stats.last_practice_date = v_today - INTERVAL '1 day' THEN user_stats.current_streak + 1
            ELSE 1
        END,
        longest_streak = GREATEST(
            user_stats.longest_streak,
            CASE
                WHEN user_stats.last_practice_date = v_today THEN user_stats.current_streak
                WHEN user_stats.last_practice_date = v_today - INTERVAL '1 day' THEN user_stats.current_streak + 1
                ELSE 1
            END
        ),
        last_practice_date = v_today,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_user_stats ON problem_attempts;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT ON problem_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_after_practice();

-- Function to get weak topics for a user
CREATE OR REPLACE FUNCTION get_weak_topics(p_user_id UUID, p_study_guide_id BIGINT DEFAULT NULL)
RETURNS TABLE (
    topic_id BIGINT,
    topic_name VARCHAR,
    confidence_level DECIMAL,
    problems_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        COALESCE(tp.confidence_level, 0) as confidence,
        COUNT(p.id) as problem_count
    FROM topics t
    LEFT JOIN topic_progress tp ON t.id = tp.topic_id AND tp.user_id = p_user_id
    LEFT JOIN problems p ON t.id = p.topic_id
    WHERE (p_study_guide_id IS NULL OR t.study_guide_id = p_study_guide_id)
    AND t.study_guide_id IN (
        SELECT id FROM study_guides WHERE user_id = p_user_id
    )
    GROUP BY t.id, t.name, tp.confidence_level
    HAVING COALESCE(tp.confidence_level, 0) < 70
    ORDER BY COALESCE(tp.confidence_level, 0) ASC, COUNT(p.id) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE user_stats IS 'Tracks user streaks, daily goals, and gamification metrics';
COMMENT ON TABLE guide_tags IS 'Tags/categories for organizing study guides';
