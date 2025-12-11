import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for updating a profile field
const updateProfileFieldSchema = z.object({
  field_key: z.string().min(1).optional(),
  field_type: z.enum(['text', 'textarea', 'select', 'image', 'color', 'url', 'email', 'phone']).optional(),
  label: z.string().min(1).optional(),
  placeholder: z.string().optional().nullable(),
  default_value: z.string().optional().nullable(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional().nullable(),
  is_required: z.boolean().optional(),
  display_order: z.number().optional(),
  category: z.string().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT /api/profile-fields/[id] - Update a profile field (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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
    const validationResult = updateProfileFieldSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { data: field, error } = await supabase
      .from('profile_fields')
      .update(validationResult.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile field:', error)
      return NextResponse.json(
        { error: 'Failed to update profile field' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: field })
  } catch (error) {
    console.error('Error in PUT /api/profile-fields/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/profile-fields/[id] - Delete a profile field (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    const { error } = await supabase
      .from('profile_fields')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting profile field:', error)
      return NextResponse.json(
        { error: 'Failed to delete profile field' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Profile field deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/profile-fields/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
