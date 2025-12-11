'use client'

import { TemplateField } from '@/types'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface SelectFieldProps {
  field: TemplateField
  value: string
  onChange: (value: string) => void
  error?: string
}

interface FieldOption {
  label: string
  value: string
}

export function SelectField({ field, value, onChange, error }: SelectFieldProps) {
  const options = (field.options as FieldOption[] | null) || []

  return (
    <div className="space-y-2">
      <Label htmlFor={field.field_key} required={field.is_required}>
        {field.label}
      </Label>
      <Select
        id={field.field_key}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
