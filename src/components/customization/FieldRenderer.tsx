'use client'

import { TemplateField } from '@/types'
import {
  TextField,
  TextareaField,
  SelectField,
  ColorPickerField,
  ImageUploadField,
} from './fields'

interface FieldRendererProps {
  field: TemplateField
  value: string
  onChange: (value: string) => void
  error?: string
}

export function FieldRenderer({ field, value, onChange, error }: FieldRendererProps) {
  switch (field.field_type) {
    case 'text':
    case 'email':
    case 'url':
    case 'phone':
      return (
        <TextField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      )

    case 'textarea':
      return (
        <TextareaField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      )

    case 'select':
      return (
        <SelectField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      )

    case 'color':
      return (
        <ColorPickerField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      )

    case 'image':
      return (
        <ImageUploadField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      )

    default:
      return (
        <TextField
          field={field}
          value={value}
          onChange={onChange}
          error={error}
        />
      )
  }
}
