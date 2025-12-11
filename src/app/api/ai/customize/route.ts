import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

// Lazy initialization to avoid build errors when env vars are missing
let anthropicClient: Anthropic | null = null
let openaiClient: OpenAI | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicClient
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

type AIProvider = 'anthropic' | 'openai'

async function getAIProvider(): Promise<AIProvider> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'ai_provider')
      .single()

    return data?.value?.provider || 'anthropic'
  } catch {
    return 'anthropic'
  }
}

// Call Anthropic API
async function callAnthropic(prompt: string): Promise<string> {
  const message = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseContent = message.content[0]
  if (responseContent.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic')
  }

  return responseContent.text.trim()
}

// Call OpenAI API
async function callOpenAI(prompt: string): Promise<string> {
  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  return content.trim()
}

// Generic AI call that routes to the selected provider
async function callAI(prompt: string, provider: AIProvider): Promise<string> {
  if (provider === 'openai') {
    return callOpenAI(prompt)
  }
  return callAnthropic(prompt)
}

// Clean up markdown code blocks from response
function cleanHtmlResponse(html: string): string {
  let cleaned = html.trim()

  if (cleaned.startsWith('```html')) {
    cleaned = cleaned.slice(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3)
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3)
  }

  return cleaned.trim()
}

// For prompt-only changes
async function applyPromptChanges(htmlContent: string, userPrompt: string, provider: AIProvider): Promise<string> {
  const prompt = `Apply this change to the HTML: "${userPrompt}"

${htmlContent}

Return ONLY the modified HTML. No explanations, no markdown code blocks.`

  const response = await callAI(prompt, provider)
  return cleanHtmlResponse(response)
}

// For initial personalization with field values
async function applyFieldValues(
  htmlContent: string,
  fields: Array<{field_key: string; label: string; field_type: string}>,
  values: Record<string, string>,
  userPrompt: string | undefined,
  provider: AIProvider
): Promise<string> {
  const fieldDescriptions = fields
    .map((f) => {
      const value = values[f.field_key]
      if (!value) return null
      return `- ${f.label} (${f.field_key}, type: ${f.field_type}): "${value}"`
    })
    .filter(Boolean)
    .join('\n')

  let prompt = `You are an HTML template customization expert. Modify this template with the provided values.

HTML:
${htmlContent}

Field values:
${fieldDescriptions}`

  if (userPrompt) {
    prompt += `

Additional instruction: "${userPrompt}"`
  }

  prompt += `

Rules:
1. Replace appropriate content with the field values
2. Names go in name/contact sections, phones replace phones, emails replace emails
3. For COLOR fields, apply to appropriate CSS styles
4. Maintain HTML structure

Return ONLY the modified HTML. No explanations, no markdown code blocks.`

  const response = await callAI(prompt, provider)
  return cleanHtmlResponse(response)
}

export async function POST(request: NextRequest) {
  try {
    const { htmlContent, fields, values, userPrompt } = await request.json()

    if (!htmlContent) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 })
    }

    // Get the configured AI provider
    const provider = await getAIProvider()

    const safeFields = fields || []
    const safeValues = values || {}

    // Build the field descriptions
    const fieldDescriptions = safeFields
      .map((f: { field_key: string; label: string; field_type: string }) => {
        const value = safeValues[f.field_key]
        if (!value) return null
        return `- ${f.label}: "${value}"`
      })
      .filter(Boolean)

    const hasFieldValues = fieldDescriptions.length > 0

    if (!hasFieldValues && !userPrompt) {
      return NextResponse.json({ html: htmlContent })
    }

    let modifiedHtml: string

    if (userPrompt && !hasFieldValues) {
      modifiedHtml = await applyPromptChanges(htmlContent, userPrompt, provider)
    } else {
      modifiedHtml = await applyFieldValues(htmlContent, safeFields, safeValues, userPrompt, provider)
    }

    if (!modifiedHtml || modifiedHtml.length < 50) {
      console.warn('AI returned empty or too short response, using original HTML')
      return NextResponse.json({ html: htmlContent })
    }

    return NextResponse.json({ html: modifiedHtml })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('AI customization error:', errorMessage)
    return NextResponse.json(
      { error: `Failed to customize template: ${errorMessage}` },
      { status: 500 }
    )
  }
}
