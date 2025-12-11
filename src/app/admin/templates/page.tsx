'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Template } from '@/types'
import { Spinner } from '@/components/ui/spinner'
import { Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates?includeInactive=true')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch templates')
      }

      setTemplates(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }

    setDeletingId(id)

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to delete template')
      }

      setTemplates((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
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
          <h1 className="text-2xl font-semibold text-white">Manage Templates</h1>
          <p className="mt-1 text-gray-400">
            Create, edit, and manage your page templates
          </p>
        </div>
        <Link
          href="/admin/templates/new"
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="text-center py-16 bg-[#1e1e1e] rounded-2xl border border-white/5">
          <p className="text-gray-400 mb-4">No templates yet</p>
          <Link
            href="/admin/templates/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Create your first template
          </Link>
        </div>
      ) : (
        <div className="bg-[#1e1e1e] rounded-2xl border border-white/5 overflow-hidden">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-[#2a2a2a]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {template.thumbnail_url && (
                        <div className="flex-shrink-0 h-10 w-16 mr-4">
                          <img
                            className="h-10 w-16 rounded-lg object-cover"
                            src={template.thumbnail_url}
                            alt=""
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-white">
                          {template.name}
                        </div>
                        {template.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        template.is_active
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatDateTime(template.updated_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/templates/${template.id}/customize`}>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      <Link href={`/admin/templates/${template.id}/edit`}>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(template.id)}
                        disabled={deletingId === template.id}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === template.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
