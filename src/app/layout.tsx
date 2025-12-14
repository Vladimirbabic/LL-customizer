import type { Metadata } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { MemberstackAuthProvider } from '@/components/MemberstackAuthProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Listing Leads - Page Personalizer',
  description: 'Create beautiful, personalized listing pages in minutes',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash - apply theme before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Memberstack SDK */}
        <Script
          src="https://static.memberstack.com/scripts/v1/memberstack.js"
          data-memberstack-app={process.env.NEXT_PUBLIC_MEMBERSTACK_APP_ID}
          strategy="afterInteractive"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <MemberstackAuthProvider>
            {children}
          </MemberstackAuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              classNames: {
                toast: 'bg-card border-border text-card-foreground',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
