import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema
const createPromptSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  prompt_content: z.string().min(1, 'Prompt content is required'),
  is_active: z.boolean().optional().default(true),
})

// GET /api/prompts - List all system prompts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    let query = supabase
      .from('system_prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: prompts, error } = await query

    if (error) {
      console.error('Error fetching prompts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch prompts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: prompts })
  } catch (error) {
    console.error('Error in GET /api/prompts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/prompts - Create a new system prompt (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createPromptSchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(issue =>
        `${issue.path.join('.')}: ${issue.message}`
      ).join(', ')
      return NextResponse.json(
        { error: `Validation failed: ${errorMessages}` },
        { status: 400 }
      )
    }

    const { data: prompt, error: promptError } = await supabase
      .from('system_prompts')
      .insert(validationResult.data)
      .select()
      .single()

    if (promptError) {
      console.error('Error creating prompt:', promptError)
      return NextResponse.json(
        { error: 'Failed to create prompt' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: prompt }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/prompts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
