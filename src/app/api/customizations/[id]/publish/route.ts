import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderTemplate } from '@/lib/template-renderer'
import { TemplateField, Customization, Template } from '@/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface CustomizationWithRelations extends Customization {
  template: Template & { listing_template_fields: TemplateField[] }
  field_values: { id: string; field_id: string; value: string | null }[]
}

// POST /api/customizations/[id]/publish - Generate and publish the customization
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch customization with all related data
    const { data, error: fetchError } = await supabase
      .from('customizations')
      .select(`
        *,
        template:listing_templates (
          *,
          listing_template_fields (*)
        ),
        field_values (
          id,
          field_id,
          value
        )
      `)
      .eq('id', id)
      .single()

    const customization = data as unknown as CustomizationWithRelations | null

    if (fetchError || !customization) {
      return NextResponse.json(
        { error: 'Customization not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (customization.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to publish this customization' },
        { status: 403 }
      )
    }

    if (!customization.template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Build values map from field_values
    const valuesMap: Record<string, string> = {}
    if (customization.field_values && customization.template.listing_template_fields) {
      customization.field_values.forEach((fv: { field_id: string; value: string | null }) => {
        const field = customization.template.listing_template_fields.find(
          (tf: { id: string }) => tf.id === fv.field_id
        )
        if (field) {
          valuesMap[field.field_key] = fv.value || ''
        }
      })
    }

    // Render the template with values
    const renderedHtml = renderTemplate(
      customization.template.html_content,
      valuesMap,
      customization.template.listing_template_fields as TemplateField[]
    )

    // Generate a unique published URL (in a real app, you'd store this in storage)
    const publishedUrl = `/preview/${id}`

    // Update customization status
    const { error: updateError } = await supabase
      .from('customizations')
      .update({
        status: 'published' as const,
        published_at: new Date().toISOString(),
        published_url: publishedUrl,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating customization status:', updateError)
      return NextResponse.json(
        { error: 'Failed to publish customization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        published_url: publishedUrl,
        rendered_html: renderedHtml,
        published_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error in POST /api/customizations/[id]/publish:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/customizations/[id]/publish - Get the rendered HTML for preview
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch customization with all related data (public access for published pages)
    const { data, error: fetchError } = await supabase
      .from('customizations')
      .select(`
        *,
        template:listing_templates (
          *,
          listing_template_fields (*)
        ),
        field_values (
          id,
          field_id,
          value
        )
      `)
      .eq('id', id)
      .single()

    const customization = data as unknown as CustomizationWithRelations | null

    if (fetchError || !customization) {
      return NextResponse.json(
        { error: 'Customization not found' },
        { status: 404 }
      )
    }

    if (!customization.template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Build values map from field_values
    const valuesMap: Record<string, string> = {}
    if (customization.field_values && customization.template.listing_template_fields) {
      customization.field_values.forEach((fv: { field_id: string; value: string | null }) => {
        const field = customization.template.listing_template_fields.find(
          (tf: { id: string }) => tf.id === fv.field_id
        )
        if (field) {
          valuesMap[field.field_key] = fv.value || ''
        }
      })
    }

    // Render the template with values
    const renderedHtml = renderTemplate(
      customization.template.html_content,
      valuesMap,
      customization.template.listing_template_fields as TemplateField[]
    )

    return NextResponse.json({
      data: {
        rendered_html: renderedHtml,
        status: customization.status,
        published_at: customization.published_at,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/customizations/[id]/publish:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
