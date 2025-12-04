// @ts-nocheck
// Supabase API wrapper - replaces the old Flask API
import { supabase } from "./supabase";

/**
 * Study Guides API
 */
export const studyGuidesAPI = {
  /**
   * Get all study guides for current user
   */
  getAll: async () => {
    const { data, error } = await supabase
      .from("study_guides")
      .select(
        `
        *,
        topics:topics(id)
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Count topics for each guide
    return data.map((guide) => ({
      ...guide,
      topic_count: guide.topics?.length || 0,
    }));
  },

  /**
   * Get a single study guide with topics
   */
  getById: async (id) => {
    const { data, error } = await supabase
      .from("study_guides")
      .select(
        `
        *,
        topics:topics(
          *,
          problems:problems(count)
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;

    // Transform problem count from nested structure to flat property
    if (data && data.topics) {
      data.topics = data.topics.map((topic) => ({
        ...topic,
        problem_count: topic.problems?.[0]?.count || 0,
      }));
    }

    return data;
  },

  /**
   * Create a new study guide
   * @param {string} title
   * @param {string|null} originalFilename
   * @param {any} parsedContent
   */
  create: async (title, originalFilename = null, parsedContent = null) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("study_guides")
      .insert({
        user_id: user.id,
        title,
        original_filename: originalFilename,
        parsed_content: parsedContent,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a study guide
   */
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from("study_guides")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a study guide
   */
  delete: async (id) => {
    const { error } = await supabase.from("study_guides").delete().eq("id", id);

    if (error) throw error;
  },
};

/**
 * Topics API
 */
export const topicsAPI = {
  /**
   * Get topics for a study guide
   */
  getByStudyGuide: async (studyGuideId) => {
    const { data, error } = await supabase
      .from("topics")
      .select(
        `
        *,
        problems:problems(count)
      `
      )
      .eq("study_guide_id", studyGuideId)
      .order("order_index", { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Create a new topic
   */
  create: async (studyGuideId, name, description = null, orderIndex = 0) => {
    const { data, error } = await supabase
      .from("topics")
      .insert({
        study_guide_id: studyGuideId,
        name,
        description,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a topic
   */
  update: async (id, updates) => {
    const { data, error } = await supabase
      .from("topics")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a topic
   */
  delete: async (id) => {
    const { error } = await supabase.from("topics").delete().eq("id", id);

    if (error) throw error;
  },
};

/**
 * Problems API
 */
export const problemsAPI = {
  /**
   * Get problems for a topic
   */
  getByTopic: async (topicId) => {
    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .eq("topic_id", topicId);

    if (error) throw error;
    return data;
  },

  /**
   * Get a single problem (without answer)
   */
  getById: async (id, includeAnswer = false) => {
    const { data, error } = await supabase
      .from("problems")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    // Optionally hide answer
    if (!includeAnswer) {
      delete data.correct_answer;
    }

    return data;
  },

  /**
   * Get hint for a problem
   */
  getHint: async (problemId, hintIndex) => {
    const { data, error } = await supabase
      .from("problems")
      .select("hints, hint_penalty")
      .eq("id", problemId)
      .single();

    if (error) throw error;

    const hints = data.hints || [];
    if (hintIndex >= hints.length) {
      throw new Error("Hint index out of range");
    }

    return {
      hint: hints[hintIndex],
      penalty: data.hint_penalty,
      totalHints: hints.length,
    };
  },

  /**
   * Create a new problem
   */
  create: async (problemData) => {
    const { data, error } = await supabase
      .from("problems")
      .insert(problemData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Bulk create problems
   */
  createBulk: async (problems) => {
    const { data, error } = await supabase
      .from("problems")
      .insert(problems)
      .select();

    if (error) throw error;
    return data;
  },
};

/**
 * Practice API
 */
export const practiceAPI = {
  /**
   * Start a new practice session
   * @param {number} studyGuideId
   * @param {object} options - Session options
   * @param {string} options.sessionType - 'normal', 'weak_areas', 'exam_mode', 'quick_practice'
   * @param {number} options.questionsCount - Number of questions (optional)
   * @param {number} options.timeLimitMinutes - Time limit for exam mode (optional)
   */
  startSession: async (studyGuideId, options = {}) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const {
      sessionType = "normal",
      questionsCount = null,
      timeLimitMinutes = null,
    } = options;

    // Check if guide has any topics/problems
    const { data: topics } = await supabase
      .from("topics")
      .select("id, problems:problems(count)")
      .eq("study_guide_id", studyGuideId);

    if (!topics || topics.length === 0) {
      throw new Error(
        "This study guide has no topics. Please generate topics first by clicking the 'Generate Topics' button."
      );
    }

    const totalProblems = topics.reduce(
      (sum, t) => sum + (t.problems?.[0]?.count || 0),
      0
    );
    if (totalProblems === 0) {
      throw new Error(
        "This study guide has no practice problems. Please generate topics and problems first."
      );
    }

    // For weak areas mode, verify weak topics exist
    if (sessionType === "weak_areas") {
      const weakTopics = await weakAreasAPI.getWeakTopics(studyGuideId);
      if (!weakTopics || weakTopics.length === 0) {
        throw new Error(
          "No weak areas found! You're doing great. Try another practice mode."
        );
      }
    }

    const { data, error } = await supabase
      .from("practice_sessions")
      .insert({
        user_id: user.id,
        study_guide_id: studyGuideId,
        session_type: sessionType,
        questions_count: questionsCount,
        time_limit_minutes: timeLimitMinutes,
        is_timed: sessionType === "exam_mode",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * End a practice session
   */
  endSession: async (sessionId) => {
    // Update session end time
    const { error: updateError } = await supabase
      .from("practice_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (updateError) throw updateError;

    // Get session statistics
    const { data: attempts, error: attemptsError } = await supabase
      .from("problem_attempts")
      .select("is_correct")
      .eq("session_id", sessionId);

    if (attemptsError) throw attemptsError;

    const totalProblems = attempts?.length || 0;
    const correctAnswers = attempts?.filter((a) => a.is_correct).length || 0;
    const accuracy =
      totalProblems > 0 ? (correctAnswers / totalProblems) * 100 : 0;

    return {
      id: sessionId,
      total_problems: totalProblems,
      correct_answers: correctAnswers,
      accuracy: Math.round(accuracy),
      ended_at: new Date().toISOString(),
    };
  },

  /**
   * Get next problem using Edge Function
   */
  getNextProblem: async (sessionId, topicIds, excludeProblemIds = []) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke("select-problem", {
      body: {
        userId: user.id,
        sessionId,
        topicIds,
        excludeProblemIds,
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Submit an answer
   */
  submitAnswer: async (sessionId, problemId, userAnswer, hintsUsed = 0) => {
    // Get the problem to check the answer
    const { data: problem, error: problemError } = await supabase
      .from("problems")
      .select("correct_answer, explanation, problem_type")
      .eq("id", problemId)
      .single();

    if (problemError) throw problemError;

    // Helper: normalize for short answers (remove punctuation, collapse spaces, lowercase)
    const normalizeText = (text) =>
      String(text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    let isCorrect = false;
    const userAns = String(userAnswer || "");
    const correctAns = problem.correct_answer;

    if ((problem.problem_type || "").toLowerCase() === "multiple_choice") {
      // For MCQ, do a direct (case-insensitive, trimmed) comparison
      isCorrect =
        userAns.trim().toLowerCase() ===
        String(correctAns || "")
          .trim()
          .toLowerCase();
    } else {
      // For short/free responses, be more lenient
      // - Support multiple acceptable answers separated by | , ;
      // - Normalize punctuation and spacing
      const candidates = String(correctAns || "")
        .split(/\||,|;/)
        .map((s) => s.trim())
        .filter(Boolean);

      const normUser = normalizeText(userAns);
      isCorrect = candidates.some((c) => normalizeText(c) === normUser);
    }

    // Record the attempt
    const { data, error } = await supabase
      .from("problem_attempts")
      .insert({
        session_id: sessionId,
        problem_id: problemId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        hints_used: hintsUsed > 0 ? Array(hintsUsed).fill(true) : [],
      })
      .select()
      .single();

    if (error) throw error;

    // Return feedback
    return {
      is_correct: isCorrect,
      correct_answer: problem.correct_answer,
      explanation: problem.explanation,
      user_answer: userAnswer,
      attempt_id: data.id,
    };
  },

  /**
   * Update topic confidence using Edge Function
   */
  updateConfidence: async (
    topicId,
    wasCorrect,
    userConfidence = null,
    hintsUsedCount = 0
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.functions.invoke(
      "update-confidence",
      {
        body: {
          userId: user.id,
          topicId,
          wasCorrect,
          userConfidence,
          hintsUsedCount,
        },
      }
    );

    if (error) throw error;
    return data;
  },
};

/**
 * Progress API
 */
export const progressAPI = {
  /**
   * Get user's progress for all topics in a study guide
   */
  getByStudyGuide: async (studyGuideId) => {
    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("id")
      .eq("study_guide_id", studyGuideId);

    if (topicsError) throw topicsError;

    const topicIds = topics.map((t) => t.id);

    const { data, error } = await supabase
      .from("topic_progress")
      .select(
        `
        *,
        topic:topics(*)
      `
      )
      .in("topic_id", topicIds);

    if (error) throw error;
    return data;
  },

  /**
   * Get progress for a specific topic
   */
  getByTopic: async (topicId) => {
    const { data, error } = await supabase
      .from("topic_progress")
      .select("*")
      .eq("topic_id", topicId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // Ignore "not found" errors
    return data || null;
  },

  /**
   * Get all user's practice sessions
   */
  getSessions: async (studyGuideId = null) => {
    let query = supabase
      .from("practice_sessions")
      .select(
        `
        *,
        study_guide:study_guides(*),
        attempts:problem_attempts(count)
      `
      )
      .order("started_at", { ascending: false });

    if (studyGuideId) {
      query = query.eq("study_guide_id", studyGuideId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },
};

/**
 * Claude API (via Edge Function)
 */
export const claudeAPI = {
  /**
   * Call Claude API
   * @param {string} prompt
   * @param {string|null} systemPrompt
   * @param {number} maxTokens
   */
  call: async (prompt, systemPrompt = null, maxTokens = 1024) => {
    const { data, error } = await supabase.functions.invoke("call-claude", {
      body: {
        prompt,
        systemPrompt,
        maxTokens,
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Ask Claude to analyze a file stored in Supabase Storage.
   * @param {string} filePath - path in 'study-materials' bucket
   * @param {string} fileName - original filename (for MIME inference)
   * @param {number} maxTokens
   */
  analyzeFile: async (filePath, fileName, maxTokens = 2048) => {
    const { data, error } = await supabase.functions.invoke("call-claude", {
      body: {
        filePath,
        fileName,
        bucket: "study-materials",
        task: "extract_topics",
        maxTokens,
      },
    });
    if (error) throw error;
    return data;
  },
};

/**
 * Math Solver API (via Edge Function)
 */
export const mathSolverAPI = {
  /**
   * Solve a math problem with step-by-step solution
   * @param {string} problem - The math problem to solve
   * @param {boolean} showSteps - Whether to show detailed steps
   */
  solve: async (problem, showSteps = true) => {
    const { data, error } = await supabase.functions.invoke("solve-math", {
      body: {
        problem,
        showSteps,
      },
    });

    if (error) throw error;
    return data;
  },
};

/**
 * User Stats API (streaks, daily goals)
 */
export const userStatsAPI = {
  /**
   * Get user's streak and daily goal stats
   */
  get: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 results gracefully

    // Don't throw on 404/PGRST116 - it's expected for new users
    // Just silently return defaults without logging
    if (error && error.code !== "PGRST116") {
      // Log unexpected errors only
      console.warn("Unexpected error fetching user stats:", error.message);
    }

    // If no record exists, create one with defaults to avoid future 404s
    if (!data) {
      const { data: newStats, error: insertError } = await supabase
        .from("user_stats")
        .insert({
          user_id: user.id,
          current_streak: 0,
          longest_streak: 0,
          questions_today: 0,
          daily_goal: 10,
        })
        .select()
        .maybeSingle();

      // If insert succeeds, return the new record
      if (newStats && !insertError) {
        return {
          currentStreak: newStats.current_streak || 0,
          longestStreak: newStats.longest_streak || 0,
          questionsToday: newStats.questions_today || 0,
          dailyGoal: newStats.daily_goal || 10,
        };
      }

      // If insert fails (e.g., race condition), just return defaults
      return {
        currentStreak: 0,
        longestStreak: 0,
        questionsToday: 0,
        dailyGoal: 10,
      };
    }

    return {
      currentStreak: data.current_streak || 0,
      longestStreak: data.longest_streak || 0,
      questionsToday: data.questions_today || 0,
      dailyGoal: data.daily_goal || 10,
    };
  },

  /**
   * Update user's daily goal
   */
  updateDailyGoal: async (newGoal) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("user_stats")
      .upsert({
        user_id: user.id,
        daily_goal: newGoal,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

/**
 * Guide Tags API
 */
export const guideTagsAPI = {
  /**
   * Add a tag to a guide
   */
  add: async (studyGuideId, tag) => {
    const { data, error } = await supabase
      .from("guide_tags")
      .insert({
        study_guide_id: studyGuideId,
        tag: tag.toLowerCase().trim(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get all tags for a guide
   */
  getByGuide: async (studyGuideId) => {
    const { data, error } = await supabase
      .from("guide_tags")
      .select("*")
      .eq("study_guide_id", studyGuideId);

    if (error) throw error;
    return data;
  },

  /**
   * Get all unique tags for current user
   */
  getAllUserTags: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Step 1: get user's study guide IDs
    const { data: guides, error: guidesError } = await supabase
      .from("study_guides")
      .select("id")
      .eq("user_id", user.id);

    if (guidesError) throw guidesError;

    const guideIds = Array.isArray(guides) ? guides.map((g) => g.id) : [];
    if (guideIds.length === 0) {
      return [];
    }

    // Step 2: fetch tags for those guides
    const { data: tagsData, error: tagsError } = await supabase
      .from("guide_tags")
      .select("tag, study_guide_id")
      .in("study_guide_id", guideIds);

    if (tagsError) throw tagsError;

    const rows = Array.isArray(tagsData) ? tagsData : [];
    const uniqueTags = [...new Set(rows.map((t) => t.tag))];
    return uniqueTags;
  },

  /**
   * Remove a tag from a guide
   */
  remove: async (studyGuideId, tag) => {
    const { error } = await supabase
      .from("guide_tags")
      .delete()
      .eq("study_guide_id", studyGuideId)
      .eq("tag", tag.toLowerCase().trim());

    if (error) throw error;
  },
};

/**
 * Weak Areas API
 */
export const weakAreasAPI = {
  /**
   * Get topics with low confidence for review
   */
  getWeakTopics: async (studyGuideId = null) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("get_weak_topics", {
      p_user_id: user.id,
      p_study_guide_id: studyGuideId,
    });

    if (error) throw error;
    return data;
  },
};

// Export all APIs as default
const supabaseAPI = {
  studyGuides: studyGuidesAPI,
  topics: topicsAPI,
  problems: problemsAPI,
  practice: practiceAPI,
  progress: progressAPI,
  claude: claudeAPI,
  mathSolver: mathSolverAPI,
  userStats: userStatsAPI,
  guideTags: guideTagsAPI,
  weakAreas: weakAreasAPI,
  getUserStats: userStatsAPI.get,
  supabase: supabase,
};

export default supabaseAPI;
