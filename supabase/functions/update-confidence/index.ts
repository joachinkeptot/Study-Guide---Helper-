import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  userId: string;
  topicId: number;
  wasCorrect: boolean;
  userConfidence?: number;
  hintsUsedCount?: number;
}

// Configuration Constants
const MASTERY_THRESHOLD = 0.75;
const EMA_ALPHA = 0.3;
const CONFIDENCE_BOOST_CORRECT = 0.15;
const CONFIDENCE_PENALTY_INCORRECT = 0.1;
const USER_CONFIDENCE_WEIGHTS: Record<number, number> = {
  1: 0.7, // Not confident
  2: 1.0, // Neutral
  3: 1.3, // Very confident
};

serve(async (req: Request) => {
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
      topicId,
      wasCorrect,
      userConfidence,
      hintsUsedCount = 0,
    } = (await req.json()) as RequestBody;

    if (!userId || !topicId || wasCorrect === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get or create progress record
    const { data: existingProgress } = await supabaseClient
      .from("topic_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("topic_id", topicId)
      .single();

    let currentConfidence = existingProgress?.current_confidence ?? 0.0;
    let problemsAttempted = existingProgress?.problems_attempted ?? 0;
    let problemsCorrect = existingProgress?.problems_correct ?? 0;

    // Update attempt counts
    problemsAttempted += 1;
    if (wasCorrect) {
      problemsCorrect += 1;
    }

    // Calculate confidence change
    let confidenceChange = wasCorrect
      ? CONFIDENCE_BOOST_CORRECT
      : -CONFIDENCE_PENALTY_INCORRECT;

    // Apply user confidence weight
    if (userConfidence && USER_CONFIDENCE_WEIGHTS[userConfidence]) {
      confidenceChange *= USER_CONFIDENCE_WEIGHTS[userConfidence];
    }

    // Reduce confidence boost based on hints used
    if (hintsUsedCount > 0 && wasCorrect) {
      const hintPenalty = Math.max(0.25, 1.0 - hintsUsedCount * 0.25);
      confidenceChange *= hintPenalty;
    }

    // Apply exponential moving average
    const newConfidence = Math.max(
      0.0,
      Math.min(1.0, currentConfidence + EMA_ALPHA * confidenceChange)
    );

    // Determine mastery status
    const mastered = newConfidence >= MASTERY_THRESHOLD;

    // Upsert progress record
    const { data: updatedProgress, error } = await supabaseClient
      .from("topic_progress")
      .upsert(
        {
          user_id: userId,
          topic_id: topicId,
          problems_attempted: problemsAttempted,
          problems_correct: problemsCorrect,
          current_confidence: newConfidence,
          mastered: mastered,
          last_practiced: new Date().toISOString(),
        },
        {
          onConflict: "user_id,topic_id",
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        progress: updatedProgress,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
