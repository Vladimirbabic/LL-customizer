import { TemplateGallery } from '@/components/templates'

export const metadata = {
  title: 'Templates | Listing Leads',
  description: 'Browse and select a template to customize',
}

export default function TemplatesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Templates</h1>
        <p className="mt-1 text-gray-400">
          Choose a template to create your personalized listing page
        </p>
      </div>

      <TemplateGallery />
    </div>
  )
}
