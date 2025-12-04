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
    const { topic } = await req.json()

    if (!topic) {
      throw new Error('Topic is required')
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
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Generate a multiple choice question about: ${topic}

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "Option A",
  "explanation": "Brief explanation of why this is correct"
}

Make it college-level difficulty. Ensure options are distinct and plausible.`
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

    // Validate the structure
    if (!problemData.question || !problemData.options || !problemData.correct_answer || !problemData.explanation) {
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
