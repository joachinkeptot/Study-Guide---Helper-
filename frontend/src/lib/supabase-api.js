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
   */
  startSession: async (studyGuideId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

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

    const { data, error } = await supabase
      .from("practice_sessions")
      .insert({
        user_id: user.id,
        study_guide_id: studyGuideId,
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
    const { data, error } = await supabase
      .from("practice_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
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
  submitAnswer: async (
    sessionId,
    problemId,
    userAnswer,
    isCorrect,
    confidenceRating = null,
    hintsUsed = []
  ) => {
    const { data, error } = await supabase
      .from("problem_attempts")
      .insert({
        session_id: sessionId,
        problem_id: problemId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        confidence_rating: confidenceRating,
        hints_used: hintsUsed,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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

// Export all APIs as default
const supabaseAPI = {
  studyGuides: studyGuidesAPI,
  topics: topicsAPI,
  problems: problemsAPI,
  practice: practiceAPI,
  progress: progressAPI,
  claude: claudeAPI,
  supabase: supabase,
};

export default supabaseAPI;
