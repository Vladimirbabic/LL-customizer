'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { TemplateWithFields } from '@/types'
import { CustomizationForm } from '@/components/customization'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CustomizePageProps {
  params: Promise<{ id: string }>
}

export default function CustomizePage({ params }: CustomizePageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [template, setTemplate] = useState<TemplateWithFields | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/templates/${id}`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load template')
        }

        if (!result.data.is_active) {
          throw new Error('This template is not available')
        }

        setTemplate(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplate()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <button
          onClick={() => router.push('/templates')}
          className="mt-4 text-[#f5d5d5] hover:text-white transition-colors"
        >
          Back to templates
        </button>
      </div>
    )
  }

  if (!template) {
    return null
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">
          Customize: {template.name}
        </h1>
        <p className="mt-1 text-gray-400">
          Fill in the fields below to personalize your page
        </p>
      </div>

      <CustomizationForm template={template} />
    </div>
  )
}
