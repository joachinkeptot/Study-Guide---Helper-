-- Run this SQL in your Supabase SQL Editor to add the user_stats table
-- Go to: https://supabase.com/dashboard/project/ybcrtgdzmziclaohvjaz/sql/new

-- 1. Create user_stats table
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

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- 3. Enable RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
CREATE POLICY "Users can view own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own stats" ON user_stats;
CREATE POLICY "Users can insert own stats"
    ON user_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stats" ON user_stats;
CREATE POLICY "Users can update own stats"
    ON user_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- 5. Create the trigger function
CREATE OR REPLACE FUNCTION update_user_stats_after_practice()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_today DATE := CURRENT_DATE;
BEGIN
    SELECT user_id INTO v_user_id
    FROM practice_sessions
    WHERE id = NEW.session_id;

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

-- 6. Create the trigger
DROP TRIGGER IF EXISTS trigger_update_user_stats ON problem_attempts;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT ON problem_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats_after_practice();

-- Done! The user_stats table is now ready to use.
