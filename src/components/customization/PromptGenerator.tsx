'use client'

import { useRouter } from 'next/navigation'
import { TemplateWithFields } from '@/types'
import { StaticPreview } from './StaticPreview'
import { FieldInputSidebar } from './FieldInputSidebar'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface ProfileField {
  id: string
  field_key: string
  label: string
  field_type: string
  category?: string
}

interface PromptGeneratorProps {
  template: TemplateWithFields
  profileFields: ProfileField[]
  profileValues: Record<string, string>
}

export function PromptGenerator({ template, profileFields, profileValues }: PromptGeneratorProps) {
  const router = useRouter()

  const handleBack = () => {
    router.push('/designs')
  }

  return (
    <div className="fixed inset-0 bg-[#141414] z-50 flex flex-col">
      {/* Header */}
      <div className="bg-[#1e1e1e] border-b border-white/5 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-lg text-white">{template.name}</h1>
            <p className="text-xs text-gray-500">Fill in the template fields to generate a prompt for Claude</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview (Left) */}
        <div className="flex-1 overflow-hidden">
          <StaticPreview htmlContent={template.html_content} />
        </div>

        {/* Field Input Sidebar (Right) */}
        <div className="w-80 shrink-0 hidden md:block">
          <FieldInputSidebar
            templateId={template.id}
            templateName={template.name}
            templateSize={template.size || '8.5x11 inches'}
            htmlContent={template.html_content}
            templateFields={template.template_fields}
            profileFields={profileFields}
            profileValues={profileValues}
          />
        </div>

        {/* Mobile: Bottom sheet for fields */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e1e1e] border-t border-white/5 max-h-[60vh] overflow-y-auto">
          <FieldInputSidebar
            templateId={template.id}
            templateName={template.name}
            templateSize={template.size || '8.5x11 inches'}
            htmlContent={template.html_content}
            templateFields={template.template_fields}
            profileFields={profileFields}
            profileValues={profileValues}
          />
        </div>
      </div>
    </div>
  )
}
