'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Spinner } from '@/components/ui/spinner'
import { formatDateTime } from '@/lib/utils'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = createClient()

      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        setUsers(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">User Management</h1>
        <p className="mt-1 text-gray-400">View and manage user accounts</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4 mb-6">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-16 bg-[#1e1e1e] rounded-2xl border border-white/5">
          <p className="text-gray-400">No users found</p>
        </div>
      ) : (
        <div className="bg-[#1e1e1e] rounded-2xl border border-white/5 overflow-hidden">
          <table className="min-w-full divide-y divide-white/5">
            <thead className="bg-[#2a2a2a]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {user.full_name || 'No name'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin'
                          ? 'bg-[#f5d5d5]/20 text-[#f5d5d5] border border-[#f5d5d5]/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatDateTime(user.created_at)}
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
