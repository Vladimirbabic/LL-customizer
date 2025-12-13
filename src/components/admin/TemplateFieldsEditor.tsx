'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, X } from 'lucide-react'

interface FieldOption {
  label: string
  value: string
}

export interface TemplateFieldData {
  id?: string
  field_key: string
  field_type: 'text' | 'textarea' | 'select' | 'url'
  label: string
  placeholder?: string | null
  default_value?: string | null
  options?: FieldOption[] | null
  is_required: boolean
  display_order: number
}

interface TemplateFieldsEditorProps {
  fields: TemplateFieldData[]
  onChange: (fields: TemplateFieldData[]) => void
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Dropdown' },
  { value: 'url', label: 'Link/URL' },
]

// Generate a unique ID
const generateUniqueId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export function TemplateFieldsEditor({ fields, onChange }: TemplateFieldsEditorProps) {
  const [expandedField, setExpandedField] = useState<number | null>(null)

  const addField = () => {
    const uniqueId = generateUniqueId()
    const newField: TemplateFieldData = {
      id: `temp_${uniqueId}`, // Temporary ID for new fields
      field_key: `field_${uniqueId}`,
      field_type: 'text',
      label: '',
      placeholder: '',
      default_value: '',
      options: null,
      is_required: false,
      display_order: fields.length,
    }
    onChange([...fields, newField])
    setExpandedField(fields.length)
  }

  const updateField = (index: number, updates: Partial<TemplateFieldData>) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    onChange(newFields)
  }

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index)
    // Update display_order
    newFields.forEach((f, i) => (f.display_order = i))
    onChange(newFields)
    if (expandedField === index) {
      setExpandedField(null)
    }
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= fields.length) return

    const newFields = [...fields]
    const temp = newFields[index]
    newFields[index] = newFields[newIndex]
    newFields[newIndex] = temp

    // Update display_order
    newFields.forEach((f, i) => (f.display_order = i))
    onChange(newFields)

    // Update expanded field
    if (expandedField === index) {
      setExpandedField(newIndex)
    } else if (expandedField === newIndex) {
      setExpandedField(index)
    }
  }

  const addOption = (fieldIndex: number) => {
    const field = fields[fieldIndex]
    const options = field.options || []
    updateField(fieldIndex, {
      options: [...options, { label: '', value: '' }],
    })
  }

  const updateOption = (fieldIndex: number, optionIndex: number, updates: Partial<FieldOption>) => {
    const field = fields[fieldIndex]
    const options = [...(field.options || [])]
    options[optionIndex] = { ...options[optionIndex], ...updates }
    updateField(fieldIndex, { options })
  }

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex]
    const options = (field.options || []).filter((_, i) => i !== optionIndex)
    updateField(fieldIndex, { options: options.length > 0 ? options : null })
  }

  const generateFieldKey = (label: string, currentIndex: number) => {
    const baseKey = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

    if (!baseKey) return ''

    // Check if this key already exists in other fields
    const existingKeys = fields
      .filter((_, i) => i !== currentIndex)
      .map(f => f.field_key)

    if (!existingKeys.includes(baseKey)) {
      return baseKey
    }

    // Add a number suffix to make it unique
    let counter = 2
    while (existingKeys.includes(`${baseKey}_${counter}`)) {
      counter++
    }
    return `${baseKey}_${counter}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Template Fields</h3>
          <p className="text-xs text-gray-500 mt-0.5">Fields users will fill in when using this template</p>
        </div>
        <Button variant="outline" size="sm" onClick={addField}>
          <Plus className="w-4 h-4 mr-1" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-lg">
          <p>No fields added yet</p>
          <p className="text-xs mt-1">Click "Add Field" to create template fields</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id || index}
              className="bg-[#2a2a2a] rounded-lg border border-white/5 overflow-hidden"
            >
              {/* Field Header */}
              <div
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpandedField(expandedField === index ? null : index)}
              >
                <GripVertical className="w-4 h-4 text-gray-600" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">
                      {field.label || 'Untitled Field'}
                    </span>
                    <span className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                      {FIELD_TYPES.find((t) => t.value === field.field_type)?.label}
                    </span>
                    {field.is_required && (
                      <span className="text-xs text-[#f5d5d5]">Required</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveField(index, 'up')
                    }}
                    disabled={index === 0}
                    className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      moveField(index, 'down')
                    }}
                    disabled={index === fields.length - 1}
                    className="p-1 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeField(index)
                    }}
                    className="p-1 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Field Details (Expanded) */}
              {expandedField === index && (
                <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => {
                          const label = e.target.value
                          updateField(index, {
                            label,
                            field_key: field.field_key.startsWith('field_') || field.field_key.startsWith('temp_')
                              ? generateFieldKey(label, index) || field.field_key
                              : field.field_key,
                          })
                        }}
                        placeholder="e.g., Property Address"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Field Type</Label>
                      <Select
                        value={field.field_type}
                        onChange={(e) =>
                          updateField(index, {
                            field_type: e.target.value as TemplateFieldData['field_type'],
                            options: e.target.value === 'select' ? [] : null,
                          })
                        }
                        className="h-8 text-sm"
                      >
                        {FIELD_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Field Key</Label>
                      <Input
                        value={field.field_key}
                        onChange={(e) => updateField(index, { field_key: e.target.value })}
                        placeholder="e.g., property_address"
                        className="h-8 text-sm font-mono"
                      />
                      <p className="text-[10px] text-gray-500">Used in HTML as {'{{field_key}}'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Placeholder</Label>
                      <Input
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(index, { placeholder: e.target.value || null })}
                        placeholder="Hint text..."
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Default Value</Label>
                    <Input
                      value={field.default_value || ''}
                      onChange={(e) => updateField(index, { default_value: e.target.value || null })}
                      placeholder="Optional default value"
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* Dropdown Options */}
                  {field.field_type === 'select' && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Dropdown Options</Label>
                        <button
                          type="button"
                          onClick={() => addOption(index)}
                          className="text-xs text-[#f5d5d5] hover:text-white flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Option
                        </button>
                      </div>
                      {(!field.options || field.options.length === 0) ? (
                        <p className="text-xs text-gray-500 text-center py-2">
                          No options added. Click "Add Option" to create dropdown choices.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {field.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <Input
                                value={option.label}
                                onChange={(e) => {
                                  const label = e.target.value
                                  updateOption(index, optionIndex, {
                                    label,
                                    value: label, // Value equals label
                                  })
                                }}
                                placeholder="Option text"
                                className="h-7 text-sm flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => removeOption(index, optionIndex)}
                                className="p-1 text-gray-500 hover:text-red-400"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={field.is_required}
                      onChange={(e) => updateField(index, { is_required: e.target.checked })}
                      className="rounded border-white/10 bg-[#1e1e1e] text-[#f5d5d5] focus:ring-[#f5d5d5]/50"
                    />
                    <Label htmlFor={`required-${index}`} className="text-xs">
                      Required field
                    </Label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
