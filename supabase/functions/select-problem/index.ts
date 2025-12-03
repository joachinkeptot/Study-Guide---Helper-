import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  userId: string;
  sessionId: number;
  topicIds: number[];
  excludeProblemIds?: number[];
}

interface Problem {
  id: number;
  topic_id: number;
  question_text: string;
  problem_type: string;
  options: any;
  explanation: string;
  hint_count: number;
}

interface Topic {
  id: number;
  name: string;
}

interface TopicProgress {
  topic_id: number;
  current_confidence: number;
  last_practiced: string | null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      userId,
      sessionId,
      topicIds,
      excludeProblemIds = [],
    } = (await req.json()) as RequestBody;

    if (!userId || !sessionId || !topicIds || topicIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get problems already attempted in this session
    const { data: sessionAttempts } = await supabaseClient
      .from("problem_attempts")
      .select("problem_id")
      .eq("session_id", sessionId);

    const sessionProblemIds = sessionAttempts?.map((a) => a.problem_id) || [];
    const allExcluded = [...excludeProblemIds, ...sessionProblemIds];

    // Get topic progress for weighted selection
    const { data: progressData } = await supabaseClient
      .from("topic_progress")
      .select("topic_id, current_confidence, last_practiced")
      .eq("user_id", userId)
      .in("topic_id", topicIds);

    const progressMap = new Map<number, TopicProgress>();
    progressData?.forEach((p) => progressMap.set(p.topic_id, p));

    // Select topic based on confidence (lower confidence = higher priority)
    const selectedTopicId = selectTopicByConfidence(topicIds, progressMap);

    if (!selectedTopicId) {
      return new Response(
        JSON.stringify({ error: "No suitable topic found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get topic details
    const { data: topic } = await supabaseClient
      .from("topics")
      .select("id, name")
      .eq("id", selectedTopicId)
      .single();

    if (!topic) {
      return new Response(JSON.stringify({ error: "Topic not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to get a new problem (not yet attempted by user)
    const { data: allUserAttempts } = await supabaseClient
      .from("problem_attempts")
      .select("problem_id")
      .eq("session_id", sessionId);

    const attemptedProblemIds = allUserAttempts?.map((a) => a.problem_id) || [];

    // Build query for problems
    let problemQuery = supabaseClient
      .from("problems")
      .select(
        "id, topic_id, question_text, problem_type, options, explanation, hints"
      )
      .eq("topic_id", selectedTopicId);

    if (allExcluded.length > 0) {
      problemQuery = problemQuery.not("id", "in", `(${allExcluded.join(",")})`);
    }

    const { data: problems } = await problemQuery;

    if (!problems || problems.length === 0) {
      return new Response(JSON.stringify({ error: "No problems available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prefer new problems (30% chance) or review problems
    const newProblems = problems.filter(
      (p) => !attemptedProblemIds.includes(p.id)
    );
    const shouldPickNew = Math.random() < 0.3;

    let selectedProblem: any;
    if (shouldPickNew && newProblems.length > 0) {
      selectedProblem =
        newProblems[Math.floor(Math.random() * newProblems.length)];
    } else {
      selectedProblem = problems[Math.floor(Math.random() * problems.length)];
    }

    // Format response (don't include correct answer or hints in initial response)
    const response = {
      problem: {
        id: selectedProblem.id,
        topic_id: selectedProblem.topic_id,
        question_text: selectedProblem.question_text,
        problem_type: selectedProblem.problem_type,
        options: selectedProblem.options,
        explanation: selectedProblem.explanation,
        hint_count: Array.isArray(selectedProblem.hints)
          ? selectedProblem.hints.length
          : 0,
      },
      topic: {
        id: topic.id,
        name: topic.name,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function selectTopicByConfidence(
  topicIds: number[],
  progressMap: Map<number, TopicProgress>
): number | null {
  if (topicIds.length === 0) return null;

  const weights: number[] = [];

  for (const topicId of topicIds) {
    const progress = progressMap.get(topicId);

    let weight = 1.0;
    if (progress) {
      // Inverse confidence: lower confidence = higher weight
      const confidence = progress.current_confidence;
      weight = 1.0 - confidence + 0.1;

      // Boost weight for topics not practiced recently
      if (progress.last_practiced) {
        const daysSince =
          (Date.now() - new Date(progress.last_practiced).getTime()) /
          (1000 * 60 * 60 * 24);
        const timeBoost = Math.min(daysSince / 7, 1.0);
        weight *= 1.0 + timeBoost;
      }
    }

    // Amplify differences to favor low-confidence topics more
    weights.push(progress ? weight * 5.0 : weight);
  }

  // Weighted random selection
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < topicIds.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return topicIds[i];
    }
  }

  return topicIds[topicIds.length - 1];
}
