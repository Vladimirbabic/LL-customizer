'use client'

import { useState, useEffect } from 'react'
import { Template, TemplateField } from '@/types'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { renderTemplate } from '@/lib/template-renderer'

interface TemplatePreviewModalProps {
  template: Template
  onClose: () => void
}

export function TemplatePreviewModal({
  template,
  onClose,
}: TemplatePreviewModalProps) {
  const [fields, setFields] = useState<TemplateField[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const fetchTemplateWithFields = async () => {
      try {
        const response = await fetch(`/api/templates/${template.id}`)
        const result = await response.json()

        if (response.ok && result.data) {
          setFields(result.data.template_fields || [])
        }
      } catch (error) {
        console.error('Error fetching template fields:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplateWithFields()
  }, [template.id])

  // Generate preview with default values
  const previewHtml = renderTemplate(template.html_content, {}, fields)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-lg shadow-xl flex flex-col ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl h-[80vh] m-4'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">{template.name} - Preview</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="bg-white shadow-lg mx-auto max-w-4xl">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-full min-h-[600px]"
                title="Template Preview"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
