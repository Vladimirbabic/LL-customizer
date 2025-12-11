import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for creating/updating a profile field
const profileFieldSchema = z.object({
  field_key: z.string().min(1, 'Field key is required'),
  field_type: z.enum(['text', 'textarea', 'select', 'image', 'color', 'url', 'email', 'phone']),
  label: z.string().min(1, 'Label is required'),
  placeholder: z.string().optional().nullable(),
  default_value: z.string().optional().nullable(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional().nullable(),
  is_required: z.boolean().optional().default(false),
  display_order: z.number().optional().default(0),
  category: z.string().optional().default('general'),
})

// GET /api/profile-fields - List all profile fields
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: fields, error } = await supabase
      .from('profile_fields')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching profile fields:', error)
      return NextResponse.json(
        { error: 'Failed to fetch profile fields' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: fields })
  } catch (error) {
    console.error('Error in GET /api/profile-fields:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/profile-fields - Create a new profile field (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = profileFieldSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { data: field, error } = await supabase
      .from('profile_fields')
      .insert(validationResult.data)
      .select()
      .single()

    if (error) {
      console.error('Error creating profile field:', error)
      return NextResponse.json(
        { error: 'Failed to create profile field' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: field }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/profile-fields:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
