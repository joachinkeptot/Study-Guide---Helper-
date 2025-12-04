-- Add progress tracking fields to practice_sessions
ALTER TABLE public.practice_sessions
    ADD COLUMN IF NOT EXISTS current_problem_index INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_problem_id BIGINT;

COMMENT ON COLUMN public.practice_sessions.current_problem_index IS 'Index of the current/last problem in the session (for resuming)';
COMMENT ON COLUMN public.practice_sessions.last_problem_id IS 'ID of the last problem shown (to avoid duplicates)';
