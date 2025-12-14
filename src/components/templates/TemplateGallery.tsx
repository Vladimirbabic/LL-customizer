'use client'

import { useState, useEffect } from 'react'
import { Template } from '@/types'
import { TemplateCard } from './TemplateCard'
import { TemplatePreviewModal } from './TemplatePreviewModal'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TemplateGalleryProps {
  templates?: Template[]
  isLoading?: boolean
  error?: string | null
  showAdminActions?: boolean
}

export function TemplateGallery({
  templates: initialTemplates,
  isLoading: externalLoading,
  error: externalError,
  showAdminActions = false,
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates || [])
  const [isLoading, setIsLoading] = useState(!initialTemplates)
  const [error, setError] = useState<string | null>(externalError || null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  useEffect(() => {
    if (initialTemplates) {
      setTemplates(initialTemplates)
      return
    }

    const fetchTemplates = async () => {
      try {
        const url = showAdminActions
          ? '/api/templates?includeInactive=true'
          : '/api/templates'
        const response = await fetch(url)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch templates')
        }

        setTemplates(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [initialTemplates, showAdminActions])

  const loading = externalLoading ?? isLoading
  const displayError = externalError ?? error

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (displayError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{displayError}</AlertDescription>
      </Alert>
    )
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No templates available</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            showAdminActions={showAdminActions}
            onPreview={() => setPreviewTemplate(template)}
          />
        ))}
      </div>

      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </>
  )
}
