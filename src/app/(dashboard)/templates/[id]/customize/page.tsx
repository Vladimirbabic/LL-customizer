'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { TemplateWithFields } from '@/types'
import { CustomizationForm } from '@/components/customization'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'

interface CustomizePageProps {
  params: Promise<{ id: string }>
}

interface ProfileData {
  profile: {
    profile_completed: boolean
  }
  valuesByKey: Record<string, string>
}

export default function CustomizePage({ params }: CustomizePageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [template, setTemplate] = useState<TemplateWithFields | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsProfile, setNeedsProfile] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both template and profile in parallel
        const [templateResponse, profileResponse] = await Promise.all([
          fetch(`/api/templates/${id}`),
          fetch('/api/profile'),
        ])

        const templateResult = await templateResponse.json()
        const profileResult = await profileResponse.json()

        if (!templateResponse.ok) {
          throw new Error(templateResult.error || 'Failed to load template')
        }

        if (!templateResult.data.is_active) {
          throw new Error('This template is not available')
        }

        setTemplate(templateResult.data)

        // Check if profile is completed
        if (profileResponse.ok && profileResult.data) {
          setProfileData(profileResult.data)

          if (!profileResult.data.profile?.profile_completed) {
            setNeedsProfile(true)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
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

  // Show profile setup prompt if user hasn't completed their profile
  if (needsProfile) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-16 h-16 rounded-full bg-[#f5d5d5]/20 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-[#f5d5d5]" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          Complete Your Profile First
        </h1>
        <p className="text-gray-400 mb-6">
          Before you can create personalized templates, we need some information about you.
          This will be used to automatically customize all your templates.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={() => router.push('/profile')}
          >
            <User className="w-4 h-4 mr-2" />
            Set Up My Profile
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/templates')}
          >
            Back to Templates
          </Button>
        </div>
      </div>
    )
  }

  if (!template) {
    return null
  }

  // Pass profile values as initial values for the customization form
  const initialValues = profileData?.valuesByKey || {}

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">
          Customize: {template.name}
        </h1>
        <p className="mt-1 text-gray-400">
          Your profile information has been applied. Make any additional changes below.
        </p>
      </div>

      <CustomizationForm
        template={template}
        initialValues={initialValues}
        autoGenerate={true}
      />
    </div>
  )
}
