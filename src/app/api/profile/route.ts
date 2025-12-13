import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// GET /api/profile - Get current user's profile with all field values
export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role, profile_completed, profile_completed_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    // Get all profile fields
    const { data: fields, error: fieldsError } = await supabase
      .from('profile_fields')
      .select('*')
      .order('display_order', { ascending: true })

    if (fieldsError) {
      console.error('Error fetching profile fields:', fieldsError)
      return NextResponse.json(
        { error: 'Failed to fetch profile fields' },
        { status: 500 }
      )
    }

    // Get user's profile values
    const { data: values, error: valuesError } = await supabase
      .from('profile_values')
      .select('field_id, value')
      .eq('user_id', user.id)

    if (valuesError) {
      console.error('Error fetching profile values:', valuesError)
      return NextResponse.json(
        { error: 'Failed to fetch profile values' },
        { status: 500 }
      )
    }

    // Create a map of field_id -> value
    const valuesMap: Record<string, string> = {}
    values?.forEach((v) => {
      valuesMap[v.field_id] = v.value || ''
    })

    // Also create a map by field_key for easier consumption
    const valuesByKey: Record<string, string> = {}
    fields?.forEach((field) => {
      valuesByKey[field.field_key] = valuesMap[field.id] || ''
    })

    return NextResponse.json({
      data: {
        profile,
        fields,
        values: valuesMap,
        valuesByKey,
      }
    })
  } catch (error) {
    console.error('Error in GET /api/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Validation schema for updating profile values
const updateProfileSchema = z.object({
  values: z.record(z.string(), z.string()), // field_key -> value
  markComplete: z.boolean().optional().default(false),
})

// PUT /api/profile - Update current user's profile values
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateProfileSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { values, markComplete } = validationResult.data

    // Get all profile fields to map field_key -> field_id
    const { data: fields, error: fieldsError } = await supabase
      .from('profile_fields')
      .select('id, field_key')

    if (fieldsError || !fields) {
      console.error('Error fetching profile fields:', fieldsError)
      return NextResponse.json(
        { error: 'Failed to fetch profile fields' },
        { status: 500 }
      )
    }

    const fieldKeyToId: Record<string, string> = {}
    fields.forEach((f) => {
      fieldKeyToId[f.field_key] = f.id
    })

    // Upsert each value
    for (const [fieldKey, value] of Object.entries(values)) {
      const fieldId = fieldKeyToId[fieldKey]
      if (!fieldId) continue

      // Check if value exists
      const { data: existing } = await supabase
        .from('profile_values')
        .select('id')
        .eq('user_id', user.id)
        .eq('field_id', fieldId)
        .single()

      if (existing) {
        // Update
        await supabase
          .from('profile_values')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        // Insert
        await supabase
          .from('profile_values')
          .insert({
            user_id: user.id,
            field_id: fieldId,
            value,
          })
      }
    }

    // Mark profile as complete if requested
    if (markComplete) {
      await supabase
        .from('profiles')
        .update({
          profile_completed: true,
          profile_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    return NextResponse.json({ message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Error in PUT /api/profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
