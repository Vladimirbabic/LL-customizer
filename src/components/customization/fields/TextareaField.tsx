'use client'

import { TemplateField } from '@/types'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface TextareaFieldProps {
  field: TemplateField
  value: string
  onChange: (value: string) => void
  error?: string
}

export function TextareaField({ field, value, onChange, error }: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.field_key} required={field.is_required}>
        {field.label}
      </Label>
      <Textarea
        id={field.field_key}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder || undefined}
        rows={4}
        error={!!error}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
