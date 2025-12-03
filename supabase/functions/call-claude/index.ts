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
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
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
    const {
      prompt,
      systemPrompt,
      maxTokens = 1024,
    } = (await req.json()) as RequestBody;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const claudeApiKey = Deno.env.get("CLAUDE_API_KEY");
    if (!claudeApiKey) {
      return new Response(
        JSON.stringify({ error: "Claude API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const messages: any[] = [{ role: "user", content: prompt }];

    const payload: any = {
      model: "claude-3-5-haiku-20241022",
      max_tokens: maxTokens,
      messages: messages,
    };

    if (systemPrompt) {
      payload.system = systemPrompt;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": claudeApiKey,
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
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
