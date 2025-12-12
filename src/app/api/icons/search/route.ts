import { NextRequest, NextResponse } from 'next/server'
import OAuth from 'oauth-1.0a'
import crypto from 'crypto'

const NOUN_PROJECT_API_KEY = process.env.NOUN_PROJECT_API_KEY
const NOUN_PROJECT_API_SECRET = process.env.NOUN_PROJECT_API_SECRET
const NOUN_PROJECT_BASE_URL = 'https://api.thenounproject.com/v2'

// Initialize OAuth 1.0a
function getOAuth() {
  return new OAuth({
    consumer: {
      key: NOUN_PROJECT_API_KEY!,
      secret: NOUN_PROJECT_API_SECRET!,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto
        .createHmac('sha1', key)
        .update(base_string)
        .digest('base64')
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    if (!NOUN_PROJECT_API_KEY || !NOUN_PROJECT_API_SECRET) {
      return NextResponse.json(
        { error: 'Noun Project API credentials not configured' },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const limit = searchParams.get('limit') || '20'
    const styles = searchParams.get('styles') // 'solid', 'line', or 'solid,line'
    const thumbnailSize = searchParams.get('thumbnail_size') || '84'

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    // Build the request URL
    const params = new URLSearchParams({
      query,
      limit,
      thumbnail_size: thumbnailSize,
    })

    if (styles) {
      params.set('styles', styles)
    }

    const url = `${NOUN_PROJECT_BASE_URL}/icon?${params.toString()}`

    // Create OAuth authorization header
    const oauth = getOAuth()
    const requestData = {
      url,
      method: 'GET',
    }
    const authHeader = oauth.toHeader(oauth.authorize(requestData))

    // Make the request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Noun Project API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Noun Project API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error searching icons:', error)
    return NextResponse.json(
      { error: 'Failed to search icons' },
      { status: 500 }
    )
  }
}
