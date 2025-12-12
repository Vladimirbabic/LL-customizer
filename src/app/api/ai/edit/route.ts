import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'

// Noun Project API configuration
const NOUN_PROJECT_API_KEY = process.env.NOUN_PROJECT_API_KEY
const NOUN_PROJECT_API_SECRET = process.env.NOUN_PROJECT_API_SECRET
const NOUN_PROJECT_BASE_URL = 'https://api.thenounproject.com/v2'

function getNounProjectOAuth() {
  return new OAuth({
    consumer: {
      key: NOUN_PROJECT_API_KEY!,
      secret: NOUN_PROJECT_API_SECRET!,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64')
    },
  })
}

// Search for icons from Noun Project
async function searchIcons(query: string, limit: number = 5): Promise<Array<{ id: number; term: string; preview_url: string }>> {
  if (!NOUN_PROJECT_API_KEY || !NOUN_PROJECT_API_SECRET) {
    console.warn('Noun Project API not configured')
    return []
  }

  try {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
      thumbnail_size: '84',
    })

    const url = `${NOUN_PROJECT_BASE_URL}/icon?${params.toString()}`
    const oauth = getNounProjectOAuth()
    const authHeader = oauth.toHeader(oauth.authorize({ url, method: 'GET' }))

    const response = await fetch(url, {
      method: 'GET',
      headers: { ...authHeader, Accept: 'application/json' },
    })

    if (!response.ok) return []

    const data = await response.json()
    return (data.icons || []).map((icon: { id: number; term: string; thumbnail_url: string }) => ({
      id: icon.id,
      term: icon.term,
      preview_url: icon.thumbnail_url,
    }))
  } catch (error) {
    console.error('Error searching icons:', error)
    return []
  }
}

// Download icon SVG from Noun Project
async function downloadIconSvg(iconId: number, color: string = '000000'): Promise<string | null> {
  if (!NOUN_PROJECT_API_KEY || !NOUN_PROJECT_API_SECRET) {
    return null
  }

  try {
    const params = new URLSearchParams({
      color: color.replace('#', ''),
      filetype: 'svg',
    })

    const url = `${NOUN_PROJECT_BASE_URL}/icon/${iconId}/download?${params.toString()}`
    const oauth = getNounProjectOAuth()
    const authHeader = oauth.toHeader(oauth.authorize({ url, method: 'GET' }))

    const response = await fetch(url, {
      method: 'GET',
      headers: { ...authHeader, Accept: 'application/json' },
    })

    if (!response.ok) return null

    const data = await response.json()
    // The API returns base64-encoded SVG
    if (data.base64_encoded_file) {
      return Buffer.from(data.base64_encoded_file, 'base64').toString('utf-8')
    }
    return null
  } catch (error) {
    console.error('Error downloading icon:', error)
    return null
  }
}

// Lazy initialization
let anthropicClient: Anthropic | null = null
let openaiClient: OpenAI | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropicClient
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

type AIProvider = 'anthropic' | 'openai'

interface AISettings {
  provider: AIProvider
  systemPrompt: string
}

async function getAISettings(): Promise<AISettings> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'ai_provider')
      .single()
    return {
      provider: data?.value?.provider || 'anthropic',
      systemPrompt: data?.value?.systemPrompt || ''
    }
  } catch {
    return { provider: 'anthropic', systemPrompt: '' }
  }
}

// Tool definitions
const tools = [
  {
    name: 'replace_text',
    description: 'Replace text content in the HTML. Use this to change names, phone numbers, emails, addresses, headings, paragraphs, or any visible text.',
    input_schema: {
      type: 'object' as const,
      properties: {
        find: { type: 'string', description: 'The exact text to find (case-sensitive)' },
        replace: { type: 'string', description: 'The text to replace it with' },
        all: { type: 'boolean', description: 'Replace all occurrences (default: true)' }
      },
      required: ['find', 'replace']
    }
  },
  {
    name: 'change_color',
    description: 'Change a color in the CSS styles. Use this to modify background colors, text colors, border colors, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        target: { type: 'string', description: 'Description of what color to change (e.g., "background", "header background", "primary text color", "button color")' },
        old_color: { type: 'string', description: 'The current color value (hex, rgb, or color name) - look for it in the HTML/CSS' },
        new_color: { type: 'string', description: 'The new color value (hex format preferred, e.g., #ff5500)' }
      },
      required: ['target', 'new_color']
    }
  },
  {
    name: 'change_style',
    description: 'Change a CSS style property value. Use for font sizes, margins, padding, widths, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        selector_hint: { type: 'string', description: 'Description of the element (e.g., "main heading", "body text", "container")' },
        property: { type: 'string', description: 'CSS property name (e.g., font-size, margin, padding, width)' },
        old_value: { type: 'string', description: 'Current value to find' },
        new_value: { type: 'string', description: 'New value to set' }
      },
      required: ['property', 'new_value']
    }
  },
  {
    name: 'change_image',
    description: 'Change or replace an image in the HTML. Look for existing image src URLs to replace. When user says "add image in the header", find the header section\'s existing image and replace its URL. Only use when user explicitly requests an image change.',
    input_schema: {
      type: 'object' as const,
      properties: {
        old_src: { type: 'string', description: 'Current image URL or filename to find in the HTML' },
        new_src: { type: 'string', description: 'New image URL to replace it with' }
      },
      required: ['old_src', 'new_src']
    }
  },
  {
    name: 'change_link',
    description: 'Change a link URL (href) in the HTML.',
    input_schema: {
      type: 'object' as const,
      properties: {
        old_href: { type: 'string', description: 'Current link URL to find' },
        new_href: { type: 'string', description: 'New link URL' }
      },
      required: ['old_href', 'new_href']
    }
  },
  {
    name: 'insert_icon',
    description: 'Search for and insert an icon from Noun Project. ONLY use when user explicitly asks for an icon. Do NOT proactively add icons. Good for: contact info icons (phone, email, location), feature icons (checkmarks, stars), decorative icons when requested.',
    input_schema: {
      type: 'object' as const,
      properties: {
        search_query: { type: 'string', description: 'Search term for the icon (e.g., "phone", "email", "house", "checkmark")' },
        color: { type: 'string', description: 'Icon color in hex format without # (e.g., "000000" for black, "ffffff" for white, "ff5500" for orange). Default is black.' },
        replace_text: { type: 'string', description: 'A small piece of text near where the icon should appear. For example, to add icon next to "555-1234", use "555" as replace_text.' },
        size: { type: 'string', description: 'Icon size (width and height). Default is "24px".' }
      },
      required: ['search_query', 'replace_text']
    }
  }
]

// OpenAI tool format
const openaiTools: OpenAI.ChatCompletionTool[] = tools.map(tool => ({
  type: 'function' as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.input_schema
  }
}))

// Execute tool calls on HTML
interface ToolCall {
  name: string
  input: Record<string, unknown>
}

async function executeTools(html: string, toolCalls: ToolCall[]): Promise<string> {
  let result = html

  for (const call of toolCalls) {
    switch (call.name) {
      case 'replace_text': {
        const { find, replace, all = true } = call.input as { find: string; replace: string; all?: boolean }
        if (find && replace !== undefined) {
          if (all) {
            result = result.split(find).join(replace)
          } else {
            result = result.replace(find, replace)
          }
        }
        break
      }
      case 'change_color': {
        const { old_color, new_color } = call.input as { old_color?: string; new_color: string; target: string }
        if (old_color && new_color) {
          // Replace the old color with new color
          result = result.split(old_color).join(new_color)
        }
        break
      }
      case 'change_style': {
        const { property, old_value, new_value } = call.input as { property: string; old_value?: string; new_value: string; selector_hint?: string }
        if (property && old_value && new_value) {
          // Find and replace the style value
          const pattern = new RegExp(`(${property}\\s*:\\s*)${old_value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
          result = result.replace(pattern, `$1${new_value}`)
        }
        break
      }
      case 'change_image': {
        const { old_src, new_src } = call.input as { old_src: string; new_src: string }
        if (old_src && new_src) {
          result = result.split(old_src).join(new_src)
        }
        break
      }
      case 'change_link': {
        const { old_href, new_href } = call.input as { old_href: string; new_href: string }
        if (old_href && new_href) {
          result = result.split(old_href).join(new_href)
        }
        break
      }
      case 'insert_icon': {
        const { search_query, color = '000000', replace_text, size = '24px' } = call.input as {
          search_query: string
          color?: string
          replace_text: string
          size?: string
        }
        if (search_query && replace_text) {
          // Search for icons
          const icons = await searchIcons(search_query, 3)
          if (icons.length > 0) {
            // Download the first matching icon
            const svg = await downloadIconSvg(icons[0].id, color.replace('#', ''))
            if (svg) {
              // Add size styling to the SVG
              const styledSvg = svg.replace(
                '<svg',
                `<svg style="width: ${size}; height: ${size}; display: inline-block; vertical-align: middle;"`
              )
              // Replace the text with the icon
              result = result.split(replace_text).join(styledSvg)
            }
          }
        }
        break
      }
    }
  }

  return result
}

// Call Anthropic with tools
async function callAnthropicWithTools(prompt: string, html: string, customSystemPrompt: string): Promise<ToolCall[]> {
  const additionalGuidelines = customSystemPrompt
    ? `\n\nADDITIONAL GUIDELINES:\n${customSystemPrompt}`
    : ''

  const systemPrompt = `You are an AI assistant that helps real estate agents customize their marketing materials (letters, postcards, reports). Users will ask you to make changes using natural language.

CAPABILITIES - You can:
- Replace any text (names, phone numbers, emails, addresses, headings, paragraphs)
- Change colors (backgrounds, text colors, accent colors, borders)
- Modify styles (font sizes, spacing, widths)
- Replace images with new image URLs
- Update links/URLs
- Insert icons from Noun Project (phone, email, home, checkmark, etc.)

HOW TO HANDLE REQUESTS:

1. **Text Changes**: Find the EXACT text in the HTML (case-sensitive) and replace it
   - "Change the name to John Smith" → find existing name, replace with "John Smith"
   - "Update the phone number" → find the phone number pattern, replace it

2. **Adding Icons**: Use insert_icon when user wants visual elements
   - "Add a phone icon next to the number" → search "phone", replace text before/after number
   - "Put an email icon" → search "email", find appropriate placement text

3. **Image Placement**: For "add image at [location]", look for:
   - Comments like <!-- HERO IMAGE --> or <!-- PROFILE -->
   - Placeholder text like "[IMAGE]" or "YOUR PHOTO HERE"
   - Existing image URLs that should be replaced
   - If unclear, use change_image on the most relevant existing image

4. **Color Changes**: Identify the color in the HTML/CSS first
   - "Make the header blue" → find header's background-color, change it
   - "Change accent color to gold" → identify accent color hex, replace globally

5. **Style Adjustments**: Find the exact CSS value to change
   - "Make the title bigger" → find title's font-size, increase it
   - "Add more spacing" → find relevant margin/padding values

IMPORTANT RULES:
- Always look at the HTML to find EXACT values before replacing
- For replace_text, match text EXACTLY (case-sensitive)
- You can call multiple tools for complex requests
- Only make changes the user explicitly requested
- When uncertain about placement, prefer the most prominent/visible location
- DO NOT add new content (images, phone numbers, icons, etc.) unless explicitly asked - only replace existing placeholders${additionalGuidelines}

HTML to edit:
${html}`

  const response = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    tools: tools,
    messages: [{ role: 'user', content: prompt }]
  })

  const toolCalls: ToolCall[] = []

  for (const block of response.content) {
    if (block.type === 'tool_use') {
      toolCalls.push({
        name: block.name,
        input: block.input as Record<string, unknown>
      })
    }
  }

  return toolCalls
}

// Call OpenAI with tools
async function callOpenAIWithTools(prompt: string, html: string, customSystemPrompt: string): Promise<ToolCall[]> {
  const additionalGuidelines = customSystemPrompt
    ? `\n\nADDITIONAL GUIDELINES:\n${customSystemPrompt}`
    : ''

  const systemPrompt = `You are an AI assistant that helps real estate agents customize their marketing materials (letters, postcards, reports). Users will ask you to make changes using natural language.

CAPABILITIES - You can:
- Replace any text (names, phone numbers, emails, addresses, headings, paragraphs)
- Change colors (backgrounds, text colors, accent colors, borders)
- Modify styles (font sizes, spacing, widths)
- Replace images with new image URLs
- Update links/URLs
- Insert icons from Noun Project (phone, email, home, checkmark, etc.)

HOW TO HANDLE REQUESTS:

1. **Text Changes**: Find the EXACT text in the HTML (case-sensitive) and replace it
   - "Change the name to John Smith" → find existing name, replace with "John Smith"
   - "Update the phone number" → find the phone number pattern, replace it

2. **Adding Icons**: Use insert_icon when user wants visual elements
   - "Add a phone icon next to the number" → search "phone", replace text before/after number
   - "Put an email icon" → search "email", find appropriate placement text

3. **Image Placement**: For "add image at [location]", look for:
   - Comments like <!-- HERO IMAGE --> or <!-- PROFILE -->
   - Placeholder text like "[IMAGE]" or "YOUR PHOTO HERE"
   - Existing image URLs that should be replaced
   - If unclear, use change_image on the most relevant existing image

4. **Color Changes**: Identify the color in the HTML/CSS first
   - "Make the header blue" → find header's background-color, change it
   - "Change accent color to gold" → identify accent color hex, replace globally

5. **Style Adjustments**: Find the exact CSS value to change
   - "Make the title bigger" → find title's font-size, increase it
   - "Add more spacing" → find relevant margin/padding values

IMPORTANT RULES:
- Always look at the HTML to find EXACT values before replacing
- For replace_text, match text EXACTLY (case-sensitive)
- You can call multiple tools for complex requests
- Only make changes the user explicitly requested
- When uncertain about placement, prefer the most prominent/visible location
- DO NOT add new content (images, phone numbers, icons, etc.) unless explicitly asked - only replace existing placeholders${additionalGuidelines}

HTML to edit:
${html}`

  const response = await getOpenAIClient().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    tools: openaiTools,
    tool_choice: 'auto'
  })

  const toolCalls: ToolCall[] = []
  const message = response.choices[0]?.message

  if (message?.tool_calls) {
    for (const tc of message.tool_calls) {
      if (tc.type === 'function' && 'function' in tc) {
        try {
          const func = tc.function as { name: string; arguments: string }
          toolCalls.push({
            name: func.name,
            input: JSON.parse(func.arguments)
          })
        } catch {
          // Skip malformed tool calls
        }
      }
    }
  }

  return toolCalls
}

export async function POST(request: NextRequest) {
  try {
    const { htmlContent, userPrompt } = await request.json()

    if (!htmlContent || !userPrompt) {
      return NextResponse.json({ error: 'HTML content and prompt are required' }, { status: 400 })
    }

    const { provider, systemPrompt } = await getAISettings()

    // Get tool calls from AI
    const toolCalls = provider === 'openai'
      ? await callOpenAIWithTools(userPrompt, htmlContent, systemPrompt)
      : await callAnthropicWithTools(userPrompt, htmlContent, systemPrompt)

    if (toolCalls.length === 0) {
      // No tools called, return original HTML
      return NextResponse.json({
        html: htmlContent,
        changes: [],
        message: 'No changes detected'
      })
    }

    // Execute the tool calls
    const modifiedHtml = await executeTools(htmlContent, toolCalls)

    // Return result with info about what changed
    return NextResponse.json({
      html: modifiedHtml,
      changes: toolCalls.map(tc => ({
        tool: tc.name,
        params: tc.input
      }))
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('AI edit error:', errorMessage)
    return NextResponse.json({ error: `Failed to edit: ${errorMessage}` }, { status: 500 })
  }
}
