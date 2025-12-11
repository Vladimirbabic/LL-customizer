'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { TemplateWithFields, TemplateField } from '@/types'
import { FieldRenderer } from './FieldRenderer'
import { LivePreview, LivePreviewHandle } from './LivePreview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { validateFieldValue } from '@/lib/template-renderer'
import { createClient } from '@/lib/supabase/client'
import { Save, Download, X, FileText, Sparkles } from 'lucide-react'

interface CustomizationFormProps {
  template: TemplateWithFields
  customizationId?: string
  initialValues?: Record<string, string>
  initialName?: string
}

export function CustomizationForm({
  template,
  customizationId,
  initialValues = {},
  initialName = '',
}: CustomizationFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName || `My ${template.name}`)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    template.template_fields?.forEach((field) => {
      defaults[field.field_key] = initialValues[field.field_key] ?? field.default_value ?? ''
    })
    return defaults
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const previewRef = useRef<LivePreviewHandle>(null)

  const handleRegenerate = () => {
    if (previewRef.current) {
      setIsRegenerating(true)
      previewRef.current.regenerate()
      // Reset after a short delay (the preview handles its own loading state)
      setTimeout(() => setIsRegenerating(false), 500)
    }
  }

  // Fetch user role to check admin status
  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        setIsAdmin(data?.role === 'admin')
      }
    }

    fetchUserRole()
  }, [])

  useEffect(() => {
    if (hasUnsavedChanges && customizationId) {
      const timer = setTimeout(() => {
        handleSave(true)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [hasUnsavedChanges, customizationId, values, name])

  const handleFieldChange = useCallback((fieldKey: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldKey]: value }))
    setHasUnsavedChanges(true)
    setSaveSuccess(false)
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[fieldKey]
      return newErrors
    })
  }, [])

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) {
      newErrors._name = 'Name is required'
    }
    template.template_fields?.forEach((field) => {
      const value = values[field.field_key] || ''
      const validation = validateFieldValue(value, field)
      if (!validation.valid && validation.error) {
        newErrors[field.field_key] = validation.error
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, values, template.template_fields])

  const handleSave = async (isAutoSave = false) => {
    if (!isAutoSave && !validateForm()) return
    setIsSaving(true)
    setSaveError(null)

    try {
      const url = customizationId
        ? `/api/customizations/${customizationId}`
        : '/api/customizations'

      const response = await fetch(url, {
        method: customizationId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template.id,
          name,
          values,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save')
      }

      setHasUnsavedChanges(false)
      setSaveSuccess(true)

      if (!customizationId && result.data?.id) {
        router.replace(`/my-pages/${result.data.id}`)
      }
    } catch (error) {
      if (!isAutoSave) {
        setSaveError(error instanceof Error ? error.message : 'Failed to save')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadHtml = () => {
    // Get the AI-rendered HTML from the preview
    const renderedHtml = previewRef.current?.getRenderedHtml() || template.html_content

    const blob = new Blob([renderedHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true)

    try {
      // Get the AI-rendered HTML from the preview
      const renderedHtml = previewRef.current?.getRenderedHtml() || template.html_content

      // Send to server for PDF generation
      const response = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: renderedHtml,
          filename: name.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Get the PDF blob
      const blob = await response.blob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('PDF generation error:', error)
      setSaveError('Failed to generate PDF. Please try again.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleClose = () => {
    router.push('/templates')
  }

  const fields = template.template_fields || []

  return (
    <div className="fixed inset-0 bg-[#141414] z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e1e1e] border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg text-white">{template.name}</h1>
            {hasUnsavedChanges && (
              <p className="text-xs text-gray-500">Unsaved changes</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-sm text-green-400 mr-2">Saved!</span>
          )}
          <Button
            variant="outline"
            onClick={() => handleSave()}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadHtml}
          >
            <Download className="w-4 h-4 mr-2" />
            HTML
          </Button>
          <Button
            variant="primary"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
          <p className="text-sm text-red-400">{saveError}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Form Fields */}
        <div className="w-80 bg-[#1e1e1e] border-r border-white/5 overflow-y-auto shrink-0">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" required>
                Page Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setHasUnsavedChanges(true)
                  setSaveSuccess(false)
                }}
                placeholder="Enter a name for your page"
                error={!!errors._name}
              />
              {errors._name && (
                <p className="text-sm text-red-400">{errors._name}</p>
              )}
            </div>

            <div className="border-t border-white/10 pt-4">
              <h2 className="text-sm font-semibold text-gray-300 mb-3">Customize Content</h2>
              <div className="space-y-4">
                {fields.map((field: TemplateField) => (
                  <FieldRenderer
                    key={field.id}
                    field={field}
                    value={values[field.field_key] || ''}
                    onChange={(value) => handleFieldChange(field.field_key, value)}
                    error={errors[field.field_key]}
                  />
                ))}
              </div>
            </div>

            {/* Regenerate Button */}
            <div className="border-t border-white/10 pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Regenerate Preview
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                AI will update the preview with your changes
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Preview (takes remaining space) */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden">
            <LivePreview
              ref={previewRef}
              htmlContent={template.html_content}
              values={values}
              fields={fields}
              fullHeight
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
