'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Template } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:border-border/80 hover:shadow-md transition-all group">
      <div className="relative aspect-video bg-muted">
        {template.thumbnail_url ? (
          <Image
            src={template.thumbnail_url}
            alt={template.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <span className="text-sm">No preview</span>
          </div>
        )}
        {!template.is_active && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 border-yellow-200"
          >
            Inactive
          </Badge>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-medium text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
          {template.name}
        </h3>
        {template.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {template.description}
          </p>
        )}

        <div className="flex gap-2">
          {onPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPreview}
              className="gap-1.5"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          )}

          {showAdminActions ? (
            <Link href={`/admin/templates/${template.id}/edit`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full gap-1.5">
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            </Link>
          ) : (
            <Link href={`/templates/${template.id}/customize`} className="flex-1">
              <Button size="sm" className="w-full">
                Use Template
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
