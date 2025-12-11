import { TemplateEditor } from '@/components/admin'

export const metadata = {
  title: 'New Template | Admin | Listing Leads',
}

export default function NewTemplatePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Create New Template</h1>
        <p className="mt-1 text-gray-400">
          Design a new template with customizable fields
        </p>
      </div>

      <TemplateEditor isNew />
    </div>
  )
}
