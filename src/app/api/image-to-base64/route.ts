import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

const MAX_SIZE = 300 // Max width/height in pixels

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    // Fetch the image
    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 400 })
    }

    const arrayBuffer = await response.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    // Resize image to max 300x300 while maintaining aspect ratio
    const resizedBuffer = await sharp(inputBuffer)
      .resize(MAX_SIZE, MAX_SIZE, {
        fit: 'inside', // Maintain aspect ratio, fit within bounds
        withoutEnlargement: true, // Don't upscale small images
      })
      .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
      .toBuffer()

    const base64 = resizedBuffer.toString('base64')

    // Return as data URL (always JPEG after resize)
    const dataUrl = `data:image/jpeg;base64,${base64}`

    return NextResponse.json({ base64: dataUrl })
  } catch (error) {
    console.error('Error converting image to base64:', error)
    return NextResponse.json({ error: 'Failed to convert image' }, { status: 500 })
  }
}
