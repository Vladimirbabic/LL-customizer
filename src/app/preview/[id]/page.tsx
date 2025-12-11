'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react'

interface PreviewPageProps {
  params: Promise<{ id: string }>
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [html, setHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await fetch(`/api/customizations/${id}/publish`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load preview')
        }

        setHtml(result.data.rendered_html)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPreview()
  }, [id])

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert('Failed to copy HTML')
    }
  }

  const handleOpenInNewTab = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyHtml}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1" />
                  Copy HTML
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
              <ExternalLink className="w-4 h-4 mr-1" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4">
        <div className="max-w-5xl mx-auto bg-white shadow-lg">
          <iframe
            srcDoc={html}
            className="w-full"
            style={{ minHeight: 'calc(100vh - 120px)' }}
            title="Page Preview"
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}
