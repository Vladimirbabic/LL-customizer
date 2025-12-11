'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/spinner'
import { LayoutGrid, FileText, Users, Plus, ChevronDown } from 'lucide-react'

interface Stats {
  templates: number
  customizations: number
  users: number
}

// Dark theme card component
function DarkCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1e1e1e] rounded-2xl border border-white/5 ${className}`}>
      {children}
    </div>
  )
}

// Donut chart component
function DonutChart({ value, max, color = '#f5d5d5' }: { value: number; max: number; color?: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <svg width="80" height="80" viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="8"
      />
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  )
}

// Filter dropdown component
function FilterDropdown({ label, value }: { label: string; value: string }) {
  return (
    <button className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] rounded-lg text-sm text-gray-300 hover:bg-[#333] transition-colors">
      <span className="text-gray-500">{label}:</span>
      <span>{value}</span>
      <ChevronDown className="w-4 h-4 text-gray-500" />
    </button>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      try {
        const [templatesRes, customizationsRes, usersRes] = await Promise.all([
          supabase.from('listing_templates').select('id', { count: 'exact', head: true }),
          supabase.from('customizations').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ])

        setStats({
          templates: templatesRes.count || 0,
          customizations: customizationsRes.count || 0,
          users: usersRes.count || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const totalItems = (stats?.templates || 0) + (stats?.customizations || 0) + (stats?.users || 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <Link
          href="/admin/templates/new"
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <FilterDropdown label="View" value="All" />
        <FilterDropdown label="Period" value="Last 30 days" />
      </div>

      {/* Info Banner */}
      <DarkCard className="px-5 py-4 mb-6">
        <p className="text-sm text-gray-400">
          Showing system statistics. Select filters above to customize the view.
        </p>
      </DarkCard>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Templates */}
            <DarkCard className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Total templates</p>
                  <p className="text-4xl font-light text-white">{stats?.templates || 0}</p>
                </div>
                <DonutChart value={stats?.templates || 0} max={totalItems} color="#f5d5d5" />
              </div>
            </DarkCard>

            {/* Total Customizations */}
            <DarkCard className="p-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total customizations</p>
                <p className="text-xs text-gray-500 mb-3">Pages created by users</p>
                <p className="text-4xl font-light text-white">{stats?.customizations || 0}</p>
              </div>
            </DarkCard>

            {/* Total Users */}
            <DarkCard className="p-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total users</p>
                <p className="text-xs text-gray-500 mb-3">Registered accounts</p>
                <p className="text-4xl font-light text-white">{stats?.users || 0}</p>
              </div>
            </DarkCard>
          </div>

          {/* Activity Chart Placeholder */}
          <DarkCard className="p-6">
            <p className="text-sm text-gray-400 mb-6">Recent activity</p>
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {[40, 25, 60, 35, 80, 45, 90, 55, 70, 30, 85, 50].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#f5d5d5]/20 rounded-t transition-all hover:bg-[#f5d5d5]/40"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-4 px-4">
              <span className="text-xs text-gray-500">Jan</span>
              <span className="text-xs text-gray-500">Feb</span>
              <span className="text-xs text-gray-500">Mar</span>
              <span className="text-xs text-gray-500">Apr</span>
              <span className="text-xs text-gray-500">May</span>
              <span className="text-xs text-gray-500">Jun</span>
              <span className="text-xs text-gray-500">Jul</span>
              <span className="text-xs text-gray-500">Aug</span>
              <span className="text-xs text-gray-500">Sep</span>
              <span className="text-xs text-gray-500">Oct</span>
              <span className="text-xs text-gray-500">Nov</span>
              <span className="text-xs text-gray-500">Dec</span>
            </div>
          </DarkCard>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Link href="/admin/templates">
              <DarkCard className="p-5 hover:bg-[#252525] transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#f5d5d5]/10 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-[#f5d5d5]" />
                  </div>
                  <div>
                    <p className="text-white font-medium group-hover:text-[#f5d5d5] transition-colors">Manage Templates</p>
                    <p className="text-sm text-gray-500">View and edit templates</p>
                  </div>
                </div>
              </DarkCard>
            </Link>

            <Link href="/admin/templates/new">
              <DarkCard className="p-5 hover:bg-[#252525] transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#f5d5d5]/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#f5d5d5]" />
                  </div>
                  <div>
                    <p className="text-white font-medium group-hover:text-[#f5d5d5] transition-colors">Create Template</p>
                    <p className="text-sm text-gray-500">Add a new template</p>
                  </div>
                </div>
              </DarkCard>
            </Link>

            <Link href="/admin/users">
              <DarkCard className="p-5 hover:bg-[#252525] transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#f5d5d5]/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#f5d5d5]" />
                  </div>
                  <div>
                    <p className="text-white font-medium group-hover:text-[#f5d5d5] transition-colors">Manage Users</p>
                    <p className="text-sm text-gray-500">View registered users</p>
                  </div>
                </div>
              </DarkCard>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
