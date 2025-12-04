-- Add fields used by frontend to practice_sessions
ALTER TABLE public.practice_sessions
    ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'normal' NOT NULL,
    ADD COLUMN IF NOT EXISTS questions_count INTEGER,
    ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS is_timed BOOLEAN DEFAULT FALSE NOT NULL;

-- Optional comment
COMMENT ON COLUMN public.practice_sessions.session_type IS 'Mode: normal, weak_areas, exam_mode, quick_practice';
COMMENT ON COLUMN public.practice_sessions.questions_count IS 'Requested number of questions for the session';
COMMENT ON COLUMN public.practice_sessions.time_limit_minutes IS 'Time limit in minutes for timed sessions';
COMMENT ON COLUMN public.practice_sessions.is_timed IS 'Whether the session is timed (exam mode)';
