import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { 
  checkRateLimit, 
  createRateLimitHeaders, 
  getRateLimitErrorResponse 
} from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  // Text-only mode
  prompt?: string;
  systemPrompt?: string;
  maxTokens?: number;
  // File mode
  filePath?: string; // path in Supabase Storage bucket
  fileName?: string;
  bucket?: string; // defaults to 'study-materials'
  task?: "extract_topics" | "generic"; // optional task hint
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Rate limiting - 10 requests per minute per user
    const authHeader = req.headers.get("Authorization");
    const identifier = authHeader || req.headers.get("x-client-info") || "anonymous";
    
    const rateLimit = checkRateLimit(identifier, {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
    });

    if (!rateLimit.allowed) {
      return getRateLimitErrorResponse(rateLimit.resetTime, corsHeaders);
    }

    const rateLimitHeaders = createRateLimitHeaders(
      rateLimit.remaining,
      rateLimit.resetTime,
      10
    );
    const body = (await req.json()) as RequestBody;
    const { prompt, systemPrompt, maxTokens = 1024 } = body;

    // Support both env var names to avoid config mismatches
    const claudeApiKey =
      Deno.env.get("CLAUDE_API_KEY") || Deno.env.get("ANTHROPIC_API_KEY");
    if (!claudeApiKey) {
      return new Response(
        JSON.stringify({ error: "Claude API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // If filePath provided, fetch file from storage and attach to Claude request
    let anthropicPayload: any;
    if (body.filePath) {
      const bucket = body.bucket || "study-materials";
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(
          JSON.stringify({ error: "Supabase server env not configured" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Create client with service role key (no user auth override for storage)
      const sb = createClient(supabaseUrl, supabaseServiceKey);

      const { data: blob, error: dlErr } = await sb.storage
        .from(bucket)
        .download(body.filePath);

      if (dlErr) {
        return new Response(
          JSON.stringify({ 
            error: `Failed to download file from bucket '${bucket}' at path '${body.filePath}'`,
            details: dlErr,
            message: dlErr.message || "No error message provided",
            statusCode: dlErr.statusCode || "unknown"
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const b64 = encodeBase64(bytes);

      // Infer media type
      const fileName = body.fileName || "document.pdf";
      const lower = fileName.toLowerCase();
      const mediaType = lower.endsWith(".pdf")
        ? "application/pdf"
        : blob.type || "application/octet-stream";

      const defaultSystem =
        systemPrompt ||
        "You are an expert educational content creator. Analyze the attached document to extract topics and generate clear, accurate study questions. Return ONLY valid JSON.";
      const defaultUser =
        body.task === "extract_topics" || true
          ? `Please analyze the attached document and:
1. Identify ALL major topics covered in the document (typically 5-15 topics, but extract as many as are present)
2. For each topic, create 3-5 practice questions similar to college-level exam questions

CRITICAL REQUIREMENTS:
- Questions should be challenging and test deep understanding, not just memorization
- For math/statistics problems: Include multi-step problems that require calculations
- For conceptual problems: Test application, analysis, and evaluation (Bloom's Taxonomy higher levels)
- Each explanation should include step-by-step solutions with detailed reasoning
- For math problems: Show ALL calculation steps, intermediate values, and formulas used
- Include 3 progressive hints that guide without giving away the answer

PROBLEM TYPES:
- multiple_choice: 4 options with one correct answer (include plausible distractors)
- short_answer: Concise answer (1-3 words or a number)
- free_response: Detailed explanation or multi-step solution required

Return strictly valid JSON with this shape:
{
  "topics": [
    {
      "name": "string",
      "description": "string",
      "problems": [
        {
          "question": "string (college-level, exam-style question)",
          "type": "multiple_choice" | "short_answer" | "free_response",
          "options": ["string", "string", "string", "string"] (only for multiple_choice),
          "correct_answer": "string",
          "explanation": "string (detailed step-by-step solution with reasoning)",
          "hints": [
            "string (hint 1: conceptual nudge)",
            "string (hint 2: formula or approach)",
            "string (hint 3: first step of solution)"
          ],
          "difficulty": "medium" | "hard",
          "tags": ["concept1", "concept2"] (key concepts tested)
        }
      ]
    }
  ]
}

EXAMPLES OF GOOD COLLEGE-LEVEL QUESTIONS:

Math/Statistics:
"A researcher collects a sample of 25 observations with a mean of 50 and standard deviation of 10. Calculate the 95% confidence interval for the population mean. (Use t-distribution, t₀.₀₂₅,₂₄ = 2.064)"

Computer Science:
"Given an unsorted array of n elements, analyze the time complexity of the following algorithm in Big-O notation and explain your reasoning: [algorithm description]"

Physics:
"A 2kg block slides down a 30° incline with a coefficient of kinetic friction of 0.3. Calculate the acceleration of the block and the time it takes to travel 5 meters."

Chemistry:
"Calculate the pH of a buffer solution containing 0.1M acetic acid (Ka = 1.8 × 10⁻⁵) and 0.15M sodium acetate."

Generate problems at this level of rigor and complexity.`
          : prompt || "Analyze the attached document.";

      anthropicPayload = {
        model: "claude-3-5-haiku-20241022",
        max_tokens: maxTokens,
        system: defaultSystem,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: b64,
                },
              },
              {
                type: "text",
                text: defaultUser,
              },
            ],
          },
        ],
      };
    } else {
      if (!prompt) {
        return new Response(JSON.stringify({ error: "Prompt is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const messages: any[] = [{ role: "user", content: prompt }];
      anthropicPayload = {
        model: "claude-3-5-haiku-20241022",
        max_tokens: maxTokens,
        messages,
      };
      if (systemPrompt) anthropicPayload.system = systemPrompt;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": claudeApiKey,
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders, 
        ...rateLimitHeaders,
        "Content-Type": "application/json" 
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
