import { NextRequest, NextResponse } from 'next/server'
import chromium from '@sparticuz/chromium-min'
import puppeteer from 'puppeteer-core'

// Remote chromium URL for serverless environments
const CHROMIUM_URL = 'https://github.com/nicktcode/chromium-bin-aws/releases/download/v137.0.0-v138.0.0-v139.0.0-v140.0.0-v141.0.0/chromium-v141.0.0.tar'

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
      executablePath: await chromium.executablePath(CHROMIUM_URL),
      headless: true,
    })

    const page = await browser.newPage()

    // Set viewport to letter size width (8.5" at 96dpi)
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

    // Get the actual content height
    const bodyHeight = await page.evaluate(() => {
      return document.body.scrollHeight
    })

    // Resize viewport to fit content
    await page.setViewport({
      width: 816,
      height: Math.max(bodyHeight, 1056),
      deviceScaleFactor: 2,
    })

    // Take screenshot
    const screenshotBuffer = await page.screenshot({
      type: 'png',
      fullPage: true,
    })

    await browser.close()
    browser = null

    // Return the PNG as a downloadable file
    return new NextResponse(Buffer.from(screenshotBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename || 'preview'}.png"`,
      },
    })
  } catch (error) {
    console.error('Screenshot generation error:', error)

    if (browser) {
      await browser.close()
    }

    return NextResponse.json(
      { error: 'Failed to generate screenshot' },
      { status: 500 }
    )
  }
}
