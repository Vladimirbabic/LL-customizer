import { NextRequest, NextResponse } from 'next/server'
import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'

// Remote chromium URL for serverless environments (must match @sparticuz/chromium-min version)
const CHROMIUM_URL = 'https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.x64.tar'

// Local Chrome paths for development
const LOCAL_CHROME_PATHS = {
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  linux: '/usr/bin/google-chrome',
}

async function getBrowser() {
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    // Use local Chrome for development
    const platform = process.platform as keyof typeof LOCAL_CHROME_PATHS
    const executablePath = LOCAL_CHROME_PATHS[platform] || LOCAL_CHROME_PATHS.linux

    return puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath,
      headless: true,
    })
  } else {
    // Use serverless chromium for production
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(CHROMIUM_URL),
      headless: true,
    })
  }
}

export async function POST(request: NextRequest) {
  let browser = null

  try {
    const { html, filename } = await request.json()

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 })
    }

    // Launch headless browser
    browser = await getBrowser()

    const page = await browser.newPage()

    // Set viewport to letter size (8.5" x 11" at 96dpi)
    await page.setViewport({
      width: 816,
      height: 1056,
      deviceScaleFactor: 2,
    })

    // Inject CSS to ensure single page and prevent overflow
    const singlePageCss = `
      <style>
        @page {
          size: letter;
          margin: 0.25in 0.5in;
        }
        html, body {
          max-height: 10.5in !important;
          overflow: hidden !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          page-break-inside: avoid !important;
        }
        * {
          page-break-inside: avoid !important;
        }
      </style>
    `

    // Inject single-page CSS into HTML
    const htmlWithConstraints = html.includes('</head>')
      ? html.replace('</head>', `${singlePageCss}</head>`)
      : `${singlePageCss}${html}`

    // Set the HTML content
    await page.setContent(htmlWithConstraints, {
      waitUntil: ['load', 'networkidle0'],
    })

    // Wait for fonts to load
    await page.evaluate(() => {
      return document.fonts.ready
    })

    // Wait for all images to load
    await page.evaluate(async () => {
      const images = document.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.addEventListener('load', resolve)
            img.addEventListener('error', resolve) // Resolve even on error to not block
          })
        })
      )
    })

    // Additional wait for rendering
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: { top: '0.25in', right: '0.5in', bottom: '0.25in', left: '0.5in' },
      preferCSSPageSize: false,
    })

    await browser.close()
    browser = null

    // Return the PDF as a downloadable file
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename || 'document'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)

    if (browser) {
      await browser.close()
    }

    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
