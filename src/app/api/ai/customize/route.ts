import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { htmlContent, fields, values, userPrompt } = await request.json()

    if (!htmlContent) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 })
    }

    // Build the field descriptions for the AI, including field type
    const fieldDescriptions = fields
      .map((f: { field_key: string; label: string; field_type: string }) => {
        const value = values[f.field_key]
        if (!value) return null
        return `- ${f.label} (${f.field_key}, type: ${f.field_type}): "${value}"`
      })
      .filter(Boolean)
      .join('\n')

    if (!fieldDescriptions && !userPrompt) {
      // No values to replace and no prompt, return original
      return NextResponse.json({ html: htmlContent })
    }

    let prompt = `You are an HTML template customization expert. Your task is to intelligently modify an HTML template by replacing appropriate content with the provided field values.

Here is the HTML template:
<template>
${htmlContent}
</template>`

    if (fieldDescriptions) {
      prompt += `

Here are the field values to incorporate:
${fieldDescriptions}`
    }

    if (userPrompt) {
      prompt += `

IMPORTANT - User's additional instructions:
"${userPrompt}"

You MUST follow these additional instructions while making the modifications.`
    }

    prompt += `

Instructions:
1. Analyze the HTML template and identify where each field value should be placed
2. Replace appropriate text content with the provided values
3. Be intelligent about placement - for example:
   - Agent/company names should replace existing names or go in contact sections
   - Phone numbers should replace existing phone numbers
   - Emails should replace existing emails
   - Headlines/titles should replace existing headlines
   - Descriptions should replace appropriate descriptive text
4. For COLOR type fields: Apply the color value to appropriate CSS styles in the HTML. Look for:
   - Accent colors, borders, backgrounds, or text colors that should use this color
   - Replace existing color values in inline styles or style blocks
   - The field_key name often hints at what should be colored (e.g., "accent_color", "primary_color", "header_color")
5. Maintain the HTML structure and styling
6. Only replace content that makes sense for each field type
7. If a field doesn't have an obvious place, find the most appropriate location or add it to a contact/footer section
${userPrompt ? '8. CRITICALLY IMPORTANT: Apply the user\'s additional instructions to enhance or modify the content as they requested' : ''}

Return ONLY the modified HTML, nothing else. No explanations, no markdown code blocks, just the raw HTML.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const responseContent = message.content[0]
    if (responseContent.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let modifiedHtml = responseContent.text.trim()

    // Clean up any markdown code blocks if present
    if (modifiedHtml.startsWith('```html')) {
      modifiedHtml = modifiedHtml.slice(7)
    } else if (modifiedHtml.startsWith('```')) {
      modifiedHtml = modifiedHtml.slice(3)
    }
    if (modifiedHtml.endsWith('```')) {
      modifiedHtml = modifiedHtml.slice(0, -3)
    }
    modifiedHtml = modifiedHtml.trim()

    // If AI returned empty or very short response, return original HTML
    if (!modifiedHtml || modifiedHtml.length < 50) {
      console.warn('AI returned empty or too short response, using original HTML')
      return NextResponse.json({ html: htmlContent })
    }

    return NextResponse.json({ html: modifiedHtml })
  } catch (error) {
    console.error('AI customization error:', error)
    return NextResponse.json(
      { error: 'Failed to customize template' },
      { status: 500 }
    )
  }
}
