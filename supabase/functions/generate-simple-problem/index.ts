// supabase/functions/generate-simple-problem/index.ts
// Deploy with: supabase functions deploy generate-simple-problem

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Type definitions
interface VisualContent {
  type: 'diagram' | 'chart' | 'equation' | 'table' | 'code'
  content: string
  description?: string
}

interface ProblemPart {
  prompt: string
  options: string[]
  correct_answer: string
  explanation: string
  visual?: VisualContent
}

interface RequestBody {
  topic: string
  recentProblems?: string[]
  preferMultiPart?: boolean
  difficulty?: 'easy' | 'medium' | 'hard' | 'college'
  numOptions?: number
  includeVisuals?: boolean
  conceptualDepth?: 'surface' | 'intermediate' | 'deep'
  problemStyle?: 'theoretical' | 'applied' | 'mixed'
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// JSON response helper
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

// Validate and normalize problem structure
function validateAndNormalizeProblem(data: any, numOptions: number): { valid: boolean; problem?: any; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Response is not an object' }
  }

  // Check for single-part problem
  const isSinglePart = data.question && Array.isArray(data.options)
  
  // Check for multi-part problem
  const isMultiPart = Array.isArray(data.parts) && data.parts.length > 0

  if (!isSinglePart && !isMultiPart) {
    return { valid: false, error: 'Missing question/options or parts array' }
  }

  try {
    if (isSinglePart && !isMultiPart) {
      // Validate single-part
      const normalized = normalizeSinglePart(data, numOptions)
      return { valid: true, problem: normalized }
    } else if (isMultiPart) {
      // Validate multi-part
      const normalized = normalizeMultiPart(data, numOptions)
      return { valid: true, problem: normalized }
    }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Validation failed' }
  }

  return { valid: false, error: 'Unknown problem structure' }
}

function normalizeSinglePart(data: any, numOptions: number): any {
  let options = Array.isArray(data.options) 
    ? data.options.map((o: any) => String(o).trim()).filter((o: string) => o.length > 0)
    : []

  if (options.length < 2) {
    throw new Error('Must have at least 2 options')
  }

  // Ensure we have exactly numOptions options
  if (options.length > numOptions) {
    // Trim excess options (keep first numOptions)
    options = options.slice(0, numOptions)
  } else if (options.length < numOptions) {
    // This shouldn't happen often, but pad if needed
    console.warn(`Only ${options.length} options provided, expected ${numOptions}`)
  }

  // Find the correct answer in options (case-insensitive match, then use exact option text)
  let correctAnswer = String(data.correct_answer || '').trim()
  const matchedOption = options.find((opt: string) => 
    opt.toLowerCase() === correctAnswer.toLowerCase()
  )
  
  if (!matchedOption) {
    // Try partial match - correct_answer might be contained in an option
    const partialMatch = options.find((opt: string) => 
      opt.toLowerCase().includes(correctAnswer.toLowerCase()) ||
      correctAnswer.toLowerCase().includes(opt.toLowerCase())
    )
    if (partialMatch) {
      correctAnswer = partialMatch
    } else {
      // Default to first option if no match found
      console.warn('correct_answer not found in options, defaulting to first option')
      correctAnswer = options[0]
    }
  } else {
    correctAnswer = matchedOption
  }

  return {
    question: String(data.question || '').trim(),
    options,
    correct_answer: correctAnswer,
    explanation: String(data.explanation || 'No explanation provided.').trim(),
    tags: Array.isArray(data.tags) ? data.tags.map((t: any) => String(t)) : [],
    visual: data.visual || undefined
  }
}

function normalizeMultiPart(data: any, numOptions: number): any {
  const parts = data.parts.map((part: any, index: number) => {
    let options = Array.isArray(part.options)
      ? part.options.map((o: any) => String(o).trim()).filter((o: string) => o.length > 0)
      : []

    if (options.length < 2) {
      throw new Error(`Part ${index + 1} must have at least 2 options`)
    }

    // Ensure we have exactly numOptions options
    if (options.length > numOptions) {
      options = options.slice(0, numOptions)
    } else if (options.length < numOptions) {
      console.warn(`Part ${index + 1}: Only ${options.length} options, expected ${numOptions}`)
    }

    // Find correct answer in options
    let correctAnswer = String(part.correct_answer || '').trim()
    const matchedOption = options.find((opt: string) => 
      opt.toLowerCase() === correctAnswer.toLowerCase()
    )
    
    if (!matchedOption) {
      const partialMatch = options.find((opt: string) => 
        opt.toLowerCase().includes(correctAnswer.toLowerCase()) ||
        correctAnswer.toLowerCase().includes(opt.toLowerCase())
      )
      correctAnswer = partialMatch || options[0]
    } else {
      correctAnswer = matchedOption
    }

    return {
      prompt: String(part.prompt || '').trim(),
      options,
      correct_answer: correctAnswer,
      explanation: String(part.explanation || 'No explanation provided.').trim(),
      visual: part.visual || undefined
    }
  })

  return {
    question: data.question ? String(data.question).trim() : undefined,
    parts,
    tags: Array.isArray(data.tags) ? data.tags.map((t: any) => String(t)) : []
  }
}

// Build the prompt for Claude
function buildPrompt(body: RequestBody): string {
  const { 
    topic, 
    recentProblems = [], 
    preferMultiPart = false, 
    difficulty = 'college', 
    numOptions = 4,
    includeVisuals = false,
    conceptualDepth = 'intermediate',
    problemStyle = 'mixed'
  } = body

  const difficultyGuide: Record<string, string> = {
    easy: 'High school level. Clear language, straightforward concepts, obvious wrong answers.',
    medium: 'Undergraduate level. Standard terminology, plausible distractors.',
    hard: 'Graduate level. Technical terminology, subtle distractors, deep understanding required.',
    college: 'College level. Academic language, tests conceptual understanding.'
  }

  const depthGuide: Record<string, string> = {
    surface: 'Focus on definitions and basic recall.',
    intermediate: 'Focus on understanding relationships and applying knowledge.',
    deep: 'Focus on analysis, synthesis, and complex problem-solving.'
  }

  const styleGuide: Record<string, string> = {
    theoretical: 'Focus on conceptual understanding and theoretical principles.',
    applied: 'Focus on real-world applications and practical scenarios.',
    mixed: 'Balance theoretical understanding with practical applications.'
  }

  let visualInstructions = ''
  if (includeVisuals) {
    visualInstructions = `
VISUALS: Include a "visual" field with relevant content:
{
  "visual": {
    "type": "equation|code|table|diagram",
    "content": "LaTeX, code, markdown table, or ASCII diagram",
    "description": "Brief description"
  }
}
For math topics, ALWAYS include equations in LaTeX format.`
  }

  // Generate option placeholders
  const optionPlaceholders = Array.from({ length: numOptions }, (_, i) => 
    `"Option ${String.fromCharCode(65 + i)}"`
  ).join(', ')

  let prompt: string

  if (preferMultiPart) {
    // MULTI-PART QUESTION - be very explicit
    prompt = `Create a MULTI-PART question (2-3 connected parts) about: ${topic}

STRICT REQUIREMENTS:
- Difficulty: ${difficultyGuide[difficulty]}
- Depth: ${depthGuide[conceptualDepth]}  
- Style: ${styleGuide[problemStyle]}
- Each part MUST have EXACTLY ${numOptions} options (not more, not less)
- correct_answer MUST be copied EXACTLY from the options array
${visualInstructions}

You MUST return a multi-part question with this EXACT structure:

{
  "question": "A scenario or stem that connects the parts",
  "parts": [
    {
      "prompt": "Part A question",
      "options": [${optionPlaceholders}],
      "correct_answer": "EXACT copy of correct option",
      "explanation": "Why this is correct"
    },
    {
      "prompt": "Part B question (related to Part A)",
      "options": [${optionPlaceholders}],
      "correct_answer": "EXACT copy of correct option",
      "explanation": "Why this is correct"
    }
  ],
  "tags": ["concept1", "concept2"]
}

CRITICAL RULES:
1. You MUST create 2-3 parts in the "parts" array
2. Each part MUST have exactly ${numOptions} options
3. Parts should be related but independently answerable
4. Do NOT create a single-question format - use the parts array

Return ONLY the JSON, no other text.`
  } else {
    // SINGLE-PART QUESTION
    prompt = `Create a single multiple-choice question about: ${topic}

STRICT REQUIREMENTS:
- Difficulty: ${difficultyGuide[difficulty]}
- Depth: ${depthGuide[conceptualDepth]}
- Style: ${styleGuide[problemStyle]}
- EXACTLY ${numOptions} options (not more, not less)
- correct_answer MUST be copied EXACTLY from the options array
${visualInstructions}

Return this EXACT JSON structure:

{
  "question": "Your question here",
  "options": [${optionPlaceholders}],
  "correct_answer": "EXACT copy of the correct option from above",
  "explanation": "2-3 sentences explaining why",
  "tags": ["concept1", "concept2"]
}

CRITICAL: The options array must have exactly ${numOptions} items. Count them!

Return ONLY the JSON, no other text.`
  }

  if (recentProblems.length > 0) {
    prompt += `\n\nAVOID similar questions to these recent ones:\n`
    recentProblems.slice(0, 5).forEach((p, i) => {
      prompt += `- ${p.substring(0, 150)}...\n`
    })
    prompt += `\nTest a DIFFERENT concept or approach.`
  }

  return prompt
}

// Extract JSON from response
function extractJSON(content: string): any {
  let cleaned = content.trim()
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '')
  cleaned = cleaned.replace(/\s*```$/i, '')
  cleaned = cleaned.trim()

  // Find JSON object
  const startIndex = cleaned.indexOf('{')
  const endIndex = cleaned.lastIndexOf('}')
  
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    cleaned = cleaned.substring(startIndex, endIndex + 1)
  }

  return JSON.parse(cleaned)
}

// Main handler
serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }

    const body: RequestBody = await req.json()

    // Validate topic
    if (!body.topic?.trim()) {
      return jsonResponse({ error: 'Topic is required' }, 400)
    }

    const numOptions = Math.min(6, Math.max(2, body.numOptions || 4))
    const prompt = buildPrompt({ ...body, numOptions })

    console.log('Generating problem for topic:', body.topic)

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        temperature: 0.7, // Lower temperature for more consistent JSON
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Claude API error:', response.status, errorText)
      throw new Error(`Claude API error: ${response.status}`)
    }

    const apiResponse = await response.json()
    
    if (apiResponse.error) {
      throw new Error(apiResponse.error.message || 'Claude API error')
    }

    const content = apiResponse.content?.[0]?.text
    if (!content) {
      throw new Error('Empty response from Claude')
    }

    console.log('Raw Claude response:', content.substring(0, 500))

    // Parse JSON
    let problemData
    try {
      problemData = extractJSON(content)
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr)
      console.error('Content was:', content)
      throw new Error('Failed to parse response as JSON')
    }

    // Validate and normalize
    const validation = validateAndNormalizeProblem(problemData, numOptions)
    
    if (!validation.valid) {
      console.error('Validation failed:', validation.error)
      console.error('Problem data:', JSON.stringify(problemData, null, 2))
      throw new Error(`Invalid problem structure: ${validation.error}`)
    }

    // Add metadata
    const result = {
      ...validation.problem,
      metadata: {
        difficulty: body.difficulty || 'college',
        conceptualDepth: body.conceptualDepth || 'intermediate',
        problemStyle: body.problemStyle || 'mixed',
        hasVisual: !!(validation.problem.visual || validation.problem.parts?.some((p: any) => p.visual)),
        generatedAt: new Date().toISOString()
      }
    }

    console.log('Successfully generated problem')
    return jsonResponse(result)

  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return jsonResponse({ error: message }, 500)
  }
})