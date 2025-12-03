-- Row Level Security Policies
-- Ensures users can only access their own data

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Study Guides Policies
CREATE POLICY "Users can view own study guides"
    ON public.study_guides FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study guides"
    ON public.study_guides FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study guides"
    ON public.study_guides FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study guides"
    ON public.study_guides FOR DELETE
    USING (auth.uid() = user_id);

-- Topics Policies
CREATE POLICY "Users can view topics from own study guides"
    ON public.topics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.study_guides
            WHERE study_guides.id = topics.study_guide_id
            AND study_guides.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create topics in own study guides"
    ON public.topics FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.study_guides
            WHERE study_guides.id = topics.study_guide_id
            AND study_guides.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update topics in own study guides"
    ON public.topics FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.study_guides
            WHERE study_guides.id = topics.study_guide_id
            AND study_guides.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete topics from own study guides"
    ON public.topics FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.study_guides
            WHERE study_guides.id = topics.study_guide_id
            AND study_guides.user_id = auth.uid()
        )
    );

-- Problems Policies
CREATE POLICY "Users can view problems from own topics"
    ON public.problems FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.topics
            JOIN public.study_guides ON study_guides.id = topics.study_guide_id
            WHERE topics.id = problems.topic_id
            AND study_guides.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create problems in own topics"
    ON public.problems FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.topics
            JOIN public.study_guides ON study_guides.id = topics.study_guide_id
            WHERE topics.id = problems.topic_id
            AND study_guides.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update problems in own topics"
    ON public.problems FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.topics
            JOIN public.study_guides ON study_guides.id = topics.study_guide_id
            WHERE topics.id = problems.topic_id
            AND study_guides.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete problems from own topics"
    ON public.problems FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.topics
            JOIN public.study_guides ON study_guides.id = topics.study_guide_id
            WHERE topics.id = problems.topic_id
            AND study_guides.user_id = auth.uid()
        )
    );

-- Practice Sessions Policies
CREATE POLICY "Users can view own practice sessions"
    ON public.practice_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own practice sessions"
    ON public.practice_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice sessions"
    ON public.practice_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice sessions"
    ON public.practice_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Problem Attempts Policies
CREATE POLICY "Users can view own problem attempts"
    ON public.problem_attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.practice_sessions
            WHERE practice_sessions.id = problem_attempts.session_id
            AND practice_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create problem attempts in own sessions"
    ON public.problem_attempts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.practice_sessions
            WHERE practice_sessions.id = problem_attempts.session_id
            AND practice_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own problem attempts"
    ON public.problem_attempts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.practice_sessions
            WHERE practice_sessions.id = problem_attempts.session_id
            AND practice_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own problem attempts"
    ON public.problem_attempts FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.practice_sessions
            WHERE practice_sessions.id = problem_attempts.session_id
            AND practice_sessions.user_id = auth.uid()
        )
    );

-- Topic Progress Policies
CREATE POLICY "Users can view own topic progress"
    ON public.topic_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own topic progress"
    ON public.topic_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic progress"
    ON public.topic_progress FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topic progress"
    ON public.topic_progress FOR DELETE
    USING (auth.uid() = user_id);
