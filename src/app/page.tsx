import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#141414] flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="mb-12">
          <Image
            src="/logo-white.svg"
            alt="Listing Leads"
            width={280}
            height={40}
            priority
            className="mx-auto"
          />
        </div>

        <div className="flex items-center justify-center gap-6">
          <Link
            href="/login"
            className="text-gray-400 hover:text-white transition-colors text-lg"
          >
            Log in
          </Link>
          <span className="text-gray-600">|</span>
          <Link
            href="/register"
            className="text-gray-400 hover:text-white transition-colors text-lg"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
