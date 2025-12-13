import { Navigation } from '@/components/Navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#141414]">
      <Navigation variant="dark" />
      <main className="w-full py-8 px-6">
        {children}
      </main>
    </div>
  )
}
