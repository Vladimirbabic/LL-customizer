import { NextRequest, NextResponse } from 'next/server'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

export async function POST(request: NextRequest) {
  let browser = null

  try {
    const { html, filename } = await request.json()

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 })
    }

    // Launch headless browser with serverless-compatible Chrome
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    })

    const page = await browser.newPage()

    // Set viewport to letter size (8.5" x 11" at 96dpi)
    await page.setViewport({
      width: 816,
      height: 1056,
      deviceScaleFactor: 2,
    })

    // Set the HTML content
    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0'],
    })

    // Wait for fonts to load
    await page.evaluate(() => {
      return document.fonts.ready
    })

    // Additional wait for rendering
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'letter',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
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
