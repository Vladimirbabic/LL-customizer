'use client'

import { TemplateField } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TextFieldProps {
  field: TemplateField
  value: string
  onChange: (value: string) => void
  error?: string
}

export function TextField({ field, value, onChange, error }: TextFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.field_key} required={field.is_required}>
        {field.label}
      </Label>
      <Input
        id={field.field_key}
        type={field.field_type === 'email' ? 'email' : field.field_type === 'url' ? 'url' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || undefined}
        error={!!error}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
