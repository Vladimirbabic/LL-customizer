import { TemplateField } from '@/types/database'

interface ProfileField {
  id: string
  field_key: string
  label: string
  field_type: string
  category?: string
}

interface PromptInput {
  htmlContent: string
  templateName: string
  templateSize: string
  templateFields: TemplateField[]
  templateFieldValues: Record<string, string>
  profileFields: ProfileField[]
  profileValues: Record<string, string>
  systemPrompt?: string
}

const PROFILE_CATEGORY_LABELS: Record<string, string> = {
  contact: 'Contact Details',
  business: 'Business Details',
  branding: 'Branding',
  social: 'Social & Web Links',
  general: 'Other Information',
}

const PROFILE_CATEGORY_ORDER = ['contact', 'business', 'branding', 'social', 'general']

// Transform ImageKit URLs to use smaller thumbnails
function getOptimizedImageUrl(url: string): string {
  if (!url) return url

  // Check if it's an ImageKit URL
  if (url.includes('ik.imagekit.io')) {
    // Add transformation for 300px width thumbnail
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}tr=w-300`
  }

  return url
}

export function generateClaudePrompt(input: PromptInput): string {
  const {
    htmlContent,
    templateName,
    templateSize,
    templateFields,
    templateFieldValues,
    profileFields,
    profileValues,
    systemPrompt,
  } = input

  // Collect image URLs from template fields
  const imageUrls: Array<{ label: string; url: string }> = []

  // Build prompt
  let prompt = ''

  // Add system prompt if provided
  if (systemPrompt && systemPrompt.trim()) {
    prompt += `${systemPrompt.trim()}

---

`
  }

  prompt += `# Template Customization Request

Create an HTML artifact with the customized template that I can preview directly in this chat.

## CRITICAL: Output Format
**You MUST create a previewable HTML artifact** using Claude's artifact feature:
- The artifact MUST be visible and renderable in the Claude UI
- I need to see a live preview of the HTML, not just code
- Use artifact type "text/html" so it renders as a webpage preview
- Do NOT just paste HTML code in the chat message

## Print Size Requirements
**This template is designed for: ${templateSize}**

You MUST ensure the output:
- Fits exactly within ${templateSize} when printed
- Does NOT exceed the boundaries of ${templateSize}
- Maintains proper margins for printing (at least 0.25" / 6mm on all sides)
- All content, images, and text must be contained within the printable area
- Do NOT add content that would cause the document to overflow onto additional pages

## Instructions
You are helping customize an HTML marketing template called "${templateName}" for print size: ${templateSize}. Please modify the HTML below by:
1. Replacing placeholder variables (like {{variable_name}}) with the provided information
2. Applying the brand accent color to appropriate accent elements (buttons, highlights, borders)
3. Inserting images at appropriate locations using the provided URLs
4. Maintaining the exact layout and structure of the template
5. **IMPORTANT: Ensuring ALL content fits within ${templateSize} - do not exceed this size**

`

  // Add user profile information (grouped by category)
  const profileByCategory: Record<string, Array<{ label: string; value: string; type: string }>> = {}

  profileFields.forEach((field) => {
    const value = profileValues[field.field_key]
    if (value && value.trim()) {
      const cat = field.category || 'general'
      if (!profileByCategory[cat]) profileByCategory[cat] = []
      profileByCategory[cat].push({
        label: field.label,
        value: value,
        type: field.field_type,
      })
    }
  })

  const hasProfileData = Object.keys(profileByCategory).length > 0

  if (hasProfileData) {
    prompt += `## User Profile Information
`
    for (const cat of PROFILE_CATEGORY_ORDER) {
      if (profileByCategory[cat] && profileByCategory[cat].length > 0) {
        prompt += `\n### ${PROFILE_CATEGORY_LABELS[cat] || cat}\n`

        profileByCategory[cat].forEach((field) => {
          if (field.type === 'image') {
            imageUrls.push({ label: field.label, url: field.value })
          } else if (field.type === 'color') {
            prompt += `- ${field.label}: ${field.value} (apply to accent elements)\n`
          } else {
            prompt += `- ${field.label}: ${field.value}\n`
          }
        })
      }
    }
  }

  // Add template-specific field values
  const filledTemplateFields = templateFields.filter((f) => {
    const val = templateFieldValues[f.field_key]
    return val && val.trim()
  })

  if (filledTemplateFields.length > 0) {
    prompt += `\n## Template-Specific Fields
`
    filledTemplateFields.forEach((field) => {
      const value = templateFieldValues[field.field_key]
      if (field.field_type === 'image') {
        imageUrls.push({ label: field.label, url: value })
      } else if (field.field_type === 'color') {
        prompt += `- ${field.label}: ${value} (apply to relevant elements)\n`
      } else {
        prompt += `- ${field.label}: ${value}\n`
      }
    })
  }

  // Add images section with optimized thumbnail URLs
  if (imageUrls.length > 0) {
    prompt += `\n## Image URLs
Use these image URLs directly in the HTML output. Insert them as \`<img src="URL">\` tags at the appropriate locations:
`
    imageUrls.forEach((img) => {
      const optimizedUrl = getOptimizedImageUrl(img.url)
      prompt += `- ${img.label}: ${optimizedUrl}\n`
    })
  }

  // Add HTML template
  prompt += `
## HTML Template Code

\`\`\`html
${htmlContent}
\`\`\`

## Output Requirements
- **CREATE A PREVIEWABLE HTML ARTIFACT** - Use the artifact feature with type "text/html"
- The artifact MUST render as a visual preview in the Claude UI (not just code)
- The artifact should contain the complete, modified HTML document starting with <!DOCTYPE html>
- Preserve all existing styles and structure
- Keep the same responsive layout
- Replace all {{placeholder}} variables with the appropriate values from above
- **CRITICAL: Output MUST fit within ${templateSize} when printed - do not exceed this print size**

⚠️ IMPORTANT: I need to SEE the rendered HTML preview in the artifact panel, not read code. Make sure the artifact is previewable.
`

  return prompt
}
