-- Migration: Add streaks, daily goals, and guide tags
-- Description: Enhances user engagement with streak tracking and better guide organization

-- Drop existing objects if they exist (for clean migration)
DROP TABLE IF EXISTS guide_tags CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TYPE IF EXISTS session_type CASCADE;

-- User statistics for streaks and daily goals
CREATE TABLE user_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_practice_date DATE,
    daily_goal INTEGER DEFAULT 10, -- default goal: 10 questions per day
    questions_today INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Guide tags for organization
CREATE TABLE IF NOT EXISTS guide_tags (
    id BIGSERIAL PRIMARY KEY,
    study_guide_id BIGINT NOT NULL REFERENCES study_guides(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(study_guide_id, tag)
);

-- Practice session types enum
DO $$ BEGIN
    CREATE TYPE session_type AS ENUM ('normal', 'weak_areas', 'exam_mode', 'quick_practice');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add session_type to practice_sessions
ALTER TABLE practice_sessions 
ADD COLUMN IF NOT EXISTS session_type session_type DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER,
ADD COLUMN IF NOT EXISTS is_timed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS questions_count INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_guide_tags_study_guide_id ON guide_tags(study_guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_tags_tag ON guide_tags(tag);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_session_type ON practice_sessions(session_type);

-- RLS Policies for user_stats
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
    ON user_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
    ON user_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for guide_tags
ALTER TABLE guide_tags ENABLE ROW LEVEL SECURITY;

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
    v_last_date DATE;
    v_current_streak INTEGER;
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

-- Trigger to update stats when problem is attempted
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
COMMENT ON COLUMN practice_sessions.session_type IS 'Type of practice session: normal, weak_areas, exam_mode, quick_practice';
COMMENT ON FUNCTION get_weak_topics IS 'Returns topics with confidence < 70% for focused review';
