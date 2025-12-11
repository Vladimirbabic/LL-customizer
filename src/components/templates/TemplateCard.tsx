'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Template } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Eye, Pencil } from 'lucide-react'

interface TemplateCardProps {
  template: Template
  showAdminActions?: boolean
  onPreview?: () => void
}

export function TemplateCard({
  template,
  showAdminActions = false,
  onPreview,
}: TemplateCardProps) {
  return (
    <div className="bg-[#1e1e1e] rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all group">
      <div className="relative aspect-video bg-[#2a2a2a]">
        {template.thumbnail_url ? (
          <Image
            src={template.thumbnail_url}
            alt={template.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <span className="text-sm">No preview</span>
          </div>
        )}
        {!template.is_active && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
          >
            Inactive
          </Badge>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-medium text-lg text-white mb-1 group-hover:text-[#f5d5d5] transition-colors">
          {template.name}
        </h3>
        {template.description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">
            {template.description}
          </p>
        )}

        <div className="flex gap-2">
          {onPreview && (
            <button
              onClick={onPreview}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white bg-[#2a2a2a] hover:bg-[#333] rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
          )}

          {showAdminActions ? (
            <Link href={`/admin/templates/${template.id}/edit`} className="flex-1">
              <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-white bg-[#2a2a2a] hover:bg-[#333] rounded-lg transition-colors">
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            </Link>
          ) : (
            <Link href={`/templates/${template.id}/customize`} className="flex-1">
              <button className="w-full px-3 py-2 text-sm font-medium text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors">
                Use Template
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
