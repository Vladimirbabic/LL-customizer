'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Customization, Template } from '@/types'
import { Spinner } from '@/components/ui/spinner'
import { formatDateTime } from '@/lib/utils'
import { Plus, Pencil, Trash2, Eye, ExternalLink } from 'lucide-react'

interface CustomizationWithTemplate extends Customization {
  template: Pick<Template, 'id' | 'name' | 'thumbnail_url'>
}

export default function MyPagesPage() {
  const [customizations, setCustomizations] = useState<CustomizationWithTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCustomizations = async () => {
    try {
      const response = await fetch('/api/customizations')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch pages')
      }

      setCustomizations(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomizations()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return

    setDeletingId(id)

    try {
      const response = await fetch(`/api/customizations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete')
      }

      setCustomizations((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">My Pages</h1>
          <p className="mt-1 text-gray-400">
            Manage your customized listing pages
          </p>
        </div>
        <Link
          href="/templates"
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Page
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {customizations.length === 0 ? (
        <div className="text-center py-16 bg-[#1e1e1e] rounded-2xl border border-white/5">
          <p className="text-gray-400 mb-4">You haven&apos;t created any pages yet</p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Browse Templates
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customizations.map((customization) => (
            <div key={customization.id} className="bg-[#1e1e1e] rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all group">
              <div className="relative aspect-video bg-[#2a2a2a]">
                {customization.template?.thumbnail_url ? (
                  <Image
                    src={customization.template.thumbnail_url}
                    alt={customization.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    <span className="text-sm">No preview</span>
                  </div>
                )}
                <span
                  className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${
                    customization.status === 'published'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}
                >
                  {customization.status}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-medium text-lg text-white mb-1 group-hover:text-[#f5d5d5] transition-colors">
                  {customization.name}
                </h3>
                <p className="text-sm text-gray-400">
                  Based on: {customization.template?.name}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {formatDateTime(customization.updated_at)}
                </p>

                <div className="flex gap-2 mt-4">
                  <Link href={`/my-pages/${customization.id}`} className="flex-1">
                    <button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors font-medium">
                      <Pencil className="w-4 h-4" />
                      Edit
                    </button>
                  </Link>

                  {customization.status === 'published' && customization.published_url && (
                    <Link href={customization.published_url}>
                      <button className="p-2 text-gray-400 hover:text-white bg-[#2a2a2a] hover:bg-[#333] rounded-lg transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </Link>
                  )}

                  <Link href={`/preview/${customization.id}`}>
                    <button className="p-2 text-gray-400 hover:text-white bg-[#2a2a2a] hover:bg-[#333] rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </Link>

                  <button
                    onClick={() => handleDelete(customization.id)}
                    disabled={deletingId === customization.id}
                    className="p-2 text-red-400 hover:text-red-300 bg-[#2a2a2a] hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deletingId === customization.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
