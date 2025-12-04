import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
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
  problem: string;
  showSteps?: boolean;
}

interface SolutionStep {
  description: string;
  calculation?: string;
  result?: string;
}

interface SolutionResponse {
  answer: string;
  steps?: SolutionStep[];
  explanation?: string;
  concepts?: string[];
  formulas?: string[];
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Rate limiting - 20 requests per minute
    const authHeader = req.headers.get("Authorization");
    const identifier = authHeader || req.headers.get("x-client-info") || "anonymous";
    
    const rateLimit = checkRateLimit(identifier, {
      maxRequests: 20,
      windowMs: 60000,
    });

    if (!rateLimit.allowed) {
      return getRateLimitErrorResponse(rateLimit.resetTime, corsHeaders);
    }

    const rateLimitHeaders = createRateLimitHeaders(
      rateLimit.remaining,
      rateLimit.resetTime,
      20
    );

    const body = (await req.json()) as RequestBody;
    const { problem, showSteps = true } = body;

    if (!problem || !problem.trim()) {
      return new Response(
        JSON.stringify({ error: "Problem statement is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    const systemPrompt = `You are an expert mathematics tutor specializing in step-by-step problem solving. 
Your goal is to help students understand mathematical concepts by providing clear, detailed solutions.

When solving a problem:
1. Break down the solution into clear, logical steps
2. Show all calculations and intermediate values
3. Explain the reasoning behind each step
4. Identify formulas and concepts used
5. Present the final answer clearly

Return your response as valid JSON with this structure:
{
  "answer": "The final answer (concise)",
  "steps": [
    {
      "description": "What we're doing in this step",
      "calculation": "The actual calculation or formula application",
      "result": "The result of this step"
    }
  ],
  "explanation": "Why this approach works and key insights",
  "concepts": ["concept1", "concept2"],
  "formulas": ["formula1", "formula2"]
}`;

    const userPrompt = `Solve this problem step-by-step:

${problem}

${showSteps ? "Provide detailed steps showing all work." : "Provide the answer with a brief explanation."}

Return ONLY valid JSON following the specified format.`;

    const anthropicPayload = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    };

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
    
    // Extract the text content from Claude's response
    const textContent = data.content?.[0]?.text;
    if (!textContent) {
      throw new Error("No response from Claude API");
    }

    // Parse the JSON response from Claude
    let solution: SolutionResponse;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = textContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : textContent;
      solution = JSON.parse(jsonText);
    } catch (parseError) {
      // If parsing fails, create a structured response from the text
      solution = {
        answer: "See explanation",
        explanation: textContent,
        steps: [],
        concepts: [],
        formulas: []
      };
    }

    return new Response(JSON.stringify(solution), {
      headers: { 
        ...corsHeaders, 
        ...rateLimitHeaders,
        "Content-Type": "application/json" 
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Math solver error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
