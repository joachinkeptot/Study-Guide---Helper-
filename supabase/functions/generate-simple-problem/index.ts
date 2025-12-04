import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { topic, recentProblems = [] } = await req.json()

    if (!topic) {
      throw new Error('Topic is required')
    }

    // Build the prompt with recent problems to avoid
    let prompt = `Generate a multiple choice practice item about: ${topic}

Return ONLY a JSON object with one of the following structures (no markdown around it):

// Single-part question
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "Option A",
  "explanation": "Brief explanation of why this is correct"
}

// Multi-part question (2-3 parts max)
{
  "question": "Overall stem or introduction (optional)",
  "parts": [
    {
      "prompt": "Part A prompt",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Brief explanation for Part A"
    },
    {
      "prompt": "Part B prompt",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "Brief explanation for Part B"
    }
  ]
}

Guidelines:
- College-level difficulty. Options must be distinct and plausible.
- If multi-part is used, keep parts logically related but independently answerable.
- Do not include any text outside the JSON.`

    // If preferMultiPart is set, bias the prompt
    if (typeof req.json === 'function') {
      // Deno deploy compatibility: req.json is a function
      const body = await req.json();
      if (body.preferMultiPart) {
        prompt += `\n\nIMPORTANT: Prefer the multi-part format unless the topic is unsuitable. If possible, generate a question with 2-3 related parts.`;
      }
    } else if (req.body && req.body.preferMultiPart) {
      prompt += `\n\nIMPORTANT: Prefer the multi-part format unless the topic is unsuitable. If possible, generate a question with 2-3 related parts.`;
    }

    // Add context about recent problems to avoid duplicates
    if (recentProblems.length > 0) {
      prompt += `\n\nIMPORTANT: Generate a DIFFERENT question than these recent ones:\n`
      recentProblems.forEach((/** @type {string} */ problem, /** @type {number} */ i) => {
        prompt += `${i + 1}. ${problem}\n`
      })
      prompt += '\nMake sure your question covers a different aspect or concept within the topic.'
    }

    // Call Claude API to generate a problem
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-4-haiku-20250905',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Claude API error: ${errorText}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse the JSON response from Claude
    let problemData
    try {
      // Try to extract JSON if Claude wrapped it in markdown
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        problemData = JSON.parse(jsonMatch[0])
      } else {
        problemData = JSON.parse(content)
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content)
      throw new Error('Failed to parse AI response')
    }

    // Validate the structure (support single or multi-part)
    const isSingle = problemData && problemData.question && problemData.options && problemData.correct_answer && problemData.explanation;
    const isMulti = problemData && Array.isArray(problemData.parts) && problemData.parts.length > 0 && problemData.parts.every((p: any) => p && p.prompt && Array.isArray(p.options) && typeof p.correct_answer === 'string' && typeof p.explanation === 'string');

    if (!isSingle && !isMulti) {
      throw new Error('Invalid problem structure from AI')
    }

    return new Response(JSON.stringify(problemData), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})
