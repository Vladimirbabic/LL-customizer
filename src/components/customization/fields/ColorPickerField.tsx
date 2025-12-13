'use client'

import { TemplateField } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ColorPickerFieldProps {
  field: TemplateField
  value: string
  onChange: (value: string) => void
  error?: string
}

export function ColorPickerField({ field, value, onChange, error }: ColorPickerFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.field_key} required={field.is_required}>
        {field.label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          id={field.field_key}
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 rounded-xl cursor-pointer appearance-none overflow-hidden"
          style={{ padding: 0 }}
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || '#000000'}
          className="flex-1"
          error={!!error}
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
