-- Initial database schema for Study Guide Helper
-- Migrated from SQLAlchemy models

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth handles this, but we add a profile table)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Study guides table
CREATE TABLE IF NOT EXISTS public.study_guides (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    parsed_content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_study_guides_user_id ON public.study_guides(user_id);

-- Topics table
CREATE TABLE IF NOT EXISTS public.topics (
    id BIGSERIAL PRIMARY KEY,
    study_guide_id BIGINT NOT NULL REFERENCES public.study_guides(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_topics_study_guide_id ON public.topics(study_guide_id);
CREATE INDEX idx_topics_study_guide_order ON public.topics(study_guide_id, order_index);

-- Problem type enum
CREATE TYPE problem_type AS ENUM ('multiple_choice', 'short_answer', 'free_response');

-- Problems table
CREATE TABLE IF NOT EXISTS public.problems (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    problem_type problem_type NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    hints JSONB,
    hint_penalty REAL DEFAULT 0.1 NOT NULL
);

CREATE INDEX idx_problems_topic_id ON public.problems(topic_id);

-- Practice sessions table
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    study_guide_id BIGINT NOT NULL REFERENCES public.study_guides(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ
);

CREATE INDEX idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_study_guide_id ON public.practice_sessions(study_guide_id);
CREATE INDEX idx_practice_sessions_user_started ON public.practice_sessions(user_id, started_at);

-- Problem attempts table
CREATE TABLE IF NOT EXISTS public.problem_attempts (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
    problem_id BIGINT NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    confidence_rating INTEGER CHECK (confidence_rating >= 1 AND confidence_rating <= 3),
    feedback TEXT,
    attempted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    hints_used JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_problem_attempts_session_id ON public.problem_attempts(session_id);
CREATE INDEX idx_problem_attempts_problem_id ON public.problem_attempts(problem_id);
CREATE INDEX idx_problem_attempts_session_attempted ON public.problem_attempts(session_id, attempted_at);
CREATE INDEX idx_problem_attempts_problem_attempted ON public.problem_attempts(problem_id, attempted_at);

-- Topic progress table
CREATE TABLE IF NOT EXISTS public.topic_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    problems_attempted INTEGER DEFAULT 0 NOT NULL,
    problems_correct INTEGER DEFAULT 0 NOT NULL,
    current_confidence REAL DEFAULT 0.0 NOT NULL,
    mastered BOOLEAN DEFAULT FALSE NOT NULL,
    last_practiced TIMESTAMPTZ,
    UNIQUE(user_id, topic_id)
);

CREATE INDEX idx_topic_progress_user_id ON public.topic_progress(user_id);
CREATE INDEX idx_topic_progress_topic_id ON public.topic_progress(topic_id);
CREATE INDEX idx_topic_progress_user_mastered ON public.topic_progress(user_id, mastered);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Comments for documentation
COMMENT ON TABLE public.study_guides IS 'User-uploaded study guides with parsed content';
COMMENT ON TABLE public.topics IS 'Topics within study guides';
COMMENT ON TABLE public.problems IS 'Practice problems for each topic';
COMMENT ON TABLE public.practice_sessions IS 'User practice sessions';
COMMENT ON TABLE public.problem_attempts IS 'Individual problem attempts within sessions';
COMMENT ON TABLE public.topic_progress IS 'User progress tracking per topic';
