import { TemplateField } from '@/types'

/**
 * Renders an HTML template by replacing placeholders with actual values
 * Placeholders use the format: {{field_key}}
 */
export function renderTemplate(
  htmlContent: string,
  values: Record<string, string>,
  fields: TemplateField[]
): string {
  let rendered = htmlContent

  // Create a map of field keys to their default values
  const defaultValues: Record<string, string> = {}
  fields.forEach((field) => {
    if (field.default_value) {
      defaultValues[field.field_key] = field.default_value
    }
  })

  // Find all placeholders in the template
  const placeholderRegex = /\{\{(\w+)\}\}/g
  let match

  while ((match = placeholderRegex.exec(htmlContent)) !== null) {
    const placeholder = match[0]
    const fieldKey = match[1]

    // Use provided value, fall back to default, then to empty string
    const value = values[fieldKey] ?? defaultValues[fieldKey] ?? ''

    // Escape HTML to prevent XSS (except for certain fields like colors)
    const escapedValue = shouldEscapeField(fieldKey, fields)
      ? escapeHtml(value)
      : value

    rendered = rendered.replace(new RegExp(placeholder, 'g'), escapedValue)
  }

  return rendered
}

/**
 * Determines if a field value should be HTML escaped
 * Color fields and certain safe fields don't need escaping
 */
function shouldEscapeField(fieldKey: string, fields: TemplateField[]): boolean {
  const field = fields.find((f) => f.field_key === fieldKey)
  if (!field) return true

  // Colors are used in CSS, so they shouldn't be escaped but should be validated
  if (field.field_type === 'color') {
    return false
  }

  // Image URLs need to be kept intact
  if (field.field_type === 'image') {
    return false
  }

  // URL fields
  if (field.field_type === 'url') {
    return false
  }

  return true
}

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }

  return str.replace(/[&<>"']/g, (char) => htmlEntities[char])
}

/**
 * Validates a color value (hex, rgb, or named color)
 */
export function isValidColor(color: string): boolean {
  // Hex color
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true
  }

  // RGB/RGBA
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/.test(color)) {
    return true
  }

  // Named colors (basic validation)
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
    'pink', 'gray', 'grey', 'brown', 'cyan', 'magenta', 'lime', 'navy',
    'teal', 'maroon', 'olive', 'silver', 'aqua', 'fuchsia',
  ]
  return namedColors.includes(color.toLowerCase())
}

/**
 * Validates a URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validates an email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates a phone number (basic validation)
 */
export function isValidPhone(phone: string): boolean {
  // Remove common separators and check if it's mostly digits
  const cleaned = phone.replace(/[\s\-().+]/g, '')
  return /^\d{7,15}$/.test(cleaned)
}

/**
 * Extracts all placeholders from an HTML template
 */
export function extractPlaceholders(htmlContent: string): string[] {
  const placeholders: string[] = []
  const regex = /\{\{(\w+)\}\}/g
  let match

  while ((match = regex.exec(htmlContent)) !== null) {
    if (!placeholders.includes(match[1])) {
      placeholders.push(match[1])
    }
  }

  return placeholders
}

/**
 * Validates field values based on their types
 */
export function validateFieldValue(
  value: string,
  field: TemplateField
): { valid: boolean; error?: string } {
  // Check required
  if (field.is_required && !value.trim()) {
    return { valid: false, error: `${field.label} is required` }
  }

  // If empty and not required, it's valid
  if (!value.trim()) {
    return { valid: true }
  }

  // Type-specific validation
  switch (field.field_type) {
    case 'email':
      if (!isValidEmail(value)) {
        return { valid: false, error: 'Please enter a valid email address' }
      }
      break

    case 'url':
      if (!isValidUrl(value)) {
        return { valid: false, error: 'Please enter a valid URL' }
      }
      break

    case 'phone':
      if (!isValidPhone(value)) {
        return { valid: false, error: 'Please enter a valid phone number' }
      }
      break

    case 'color':
      if (!isValidColor(value)) {
        return { valid: false, error: 'Please enter a valid color (hex, rgb, or color name)' }
      }
      break

    case 'image':
      if (value && !isValidUrl(value)) {
        return { valid: false, error: 'Please enter a valid image URL' }
      }
      break
  }

  return { valid: true }
}
