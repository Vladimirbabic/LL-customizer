export * from './database'

// API Request/Response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// Form types
export interface FieldOption {
  label: string
  value: string
}

export interface TemplateFieldConfig {
  field_key: string
  field_type: string
  label: string
  placeholder?: string
  default_value?: string
  options?: FieldOption[]
  is_required: boolean
  display_order: number
}

// Customization form state
export interface CustomizationFormState {
  name: string
  values: Record<string, string>
  isDirty: boolean
  isSubmitting: boolean
  errors: Record<string, string>
}

// Template editor state
export interface TemplateEditorState {
  name: string
  description: string
  html_content: string
  thumbnail_url: string
  is_active: boolean
  fields: TemplateFieldConfig[]
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'admin'
}

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
