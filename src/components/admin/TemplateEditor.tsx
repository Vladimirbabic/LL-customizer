'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { TemplateWithFields, Campaign } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Save,
  FolderPlus,
  X,
  Upload,
  Link as LinkIcon,
  Wand2,
} from 'lucide-react'
import { TemplateFieldsEditor, TemplateFieldData } from './TemplateFieldsEditor'

interface SystemPrompt {
  id: string
  name: string
  description: string | null
  prompt_content: string
  is_active: boolean
}

interface TemplateEditorProps {
  template?: TemplateWithFields
  isNew?: boolean
}

export function TemplateEditor({ template, isNew = false }: TemplateEditorProps) {
  const router = useRouter()

  // Form state
  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [size, setSize] = useState(template?.size || '8.5x11 inches')
  const [htmlContent, setHtmlContent] = useState(template?.html_content || '')
  const [thumbnailUrl, setThumbnailUrl] = useState(template?.thumbnail_url || '')
  const [isActive, setIsActive] = useState(template?.is_active ?? true)
  const [campaignId, setCampaignId] = useState<string | null>((template as TemplateWithFields & { campaign_id?: string })?.campaign_id || null)
  const [systemPromptId, setSystemPromptId] = useState<string | null>((template as TemplateWithFields & { system_prompt_id?: string })?.system_prompt_id || null)
  const [templatePrompt, setTemplatePrompt] = useState((template as TemplateWithFields & { template_prompt?: string })?.template_prompt || '')
  const [templateFields, setTemplateFields] = useState<TemplateFieldData[]>(() => {
    return (template?.template_fields || []).map((f, i) => ({
      id: f.id,
      field_key: f.field_key,
      field_type: f.field_type as 'text' | 'textarea' | 'select',
      label: f.label,
      placeholder: f.placeholder,
      default_value: f.default_value,
      options: f.options as { label: string; value: string }[] | null,
      is_required: f.is_required,
      display_order: f.display_order ?? i,
    }))
  })

  // Campaign state
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false)

  // System prompts state
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([])
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false)
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false)
  const [newCampaignName, setNewCampaignName] = useState('')
  const [newCampaignColor, setNewCampaignColor] = useState('#f5d5d5')
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [editCampaignName, setEditCampaignName] = useState('')
  const [editCampaignColor, setEditCampaignColor] = useState('')
  const [isSavingCampaign, setIsSavingCampaign] = useState(false)

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Thumbnail upload state
  const [thumbnailInputMode, setThumbnailInputMode] = useState<'generate' | 'upload' | 'url'>(thumbnailUrl ? 'url' : 'generate')
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  // Fetch campaigns and system prompts on mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoadingCampaigns(true)
      try {
        const response = await fetch('/api/campaigns')
        const result = await response.json()
        if (response.ok) {
          setCampaigns(result.data || [])
        }
      } catch (err) {
        console.error('Error fetching campaigns:', err)
      } finally {
        setIsLoadingCampaigns(false)
      }
    }

    const fetchSystemPrompts = async () => {
      setIsLoadingPrompts(true)
      try {
        const response = await fetch('/api/prompts')
        const result = await response.json()
        if (response.ok) {
          setSystemPrompts(result.data || [])
        }
      } catch (err) {
        console.error('Error fetching system prompts:', err)
      } finally {
        setIsLoadingPrompts(false)
      }
    }

    fetchCampaigns()
    fetchSystemPrompts()
  }, [])

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return

    setIsCreatingCampaign(true)
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCampaignName,
          color: newCampaignColor,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        setCampaigns([result.data, ...campaigns])
        setCampaignId(result.data.id)
        setNewCampaignName('')
        setNewCampaignColor('#f5d5d5')
        setShowNewCampaignForm(false)
      }
    } catch (err) {
      console.error('Error creating campaign:', err)
    } finally {
      setIsCreatingCampaign(false)
    }
  }

  const handleStartEditCampaign = (campaign: Campaign) => {
    setEditingCampaignId(campaign.id)
    setEditCampaignName(campaign.name)
    setEditCampaignColor(campaign.color)
    setShowNewCampaignForm(false)
  }

  const handleSaveCampaign = async () => {
    if (!editingCampaignId || !editCampaignName.trim()) return

    setIsSavingCampaign(true)
    try {
      const response = await fetch(`/api/campaigns/${editingCampaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCampaignName,
          color: editCampaignColor,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        setCampaigns(campaigns.map(c =>
          c.id === editingCampaignId
            ? { ...c, name: editCampaignName, color: editCampaignColor }
            : c
        ))
        setEditingCampaignId(null)
      } else {
        setError(result.error || 'Failed to update campaign')
      }
    } catch (err) {
      console.error('Error updating campaign:', err)
      setError('Failed to update campaign')
    } finally {
      setIsSavingCampaign(false)
    }
  }

  const handleCancelEditCampaign = () => {
    setEditingCampaignId(null)
    setEditCampaignName('')
    setEditCampaignColor('')
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setIsUploadingThumbnail(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', '/_personalization')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setThumbnailUrl(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setIsUploadingThumbnail(false)
      // Reset input
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = ''
      }
    }
  }

  const handleGenerateThumbnail = async () => {
    console.log('handleGenerateThumbnail called, htmlContent length:', htmlContent.length)

    if (!htmlContent.trim()) {
      setError('Add HTML content first to generate a thumbnail')
      return
    }

    setIsGeneratingThumbnail(true)
    setError(null)

    try {
      console.log('Sending thumbnail generation request...')
      const response = await fetch('/api/thumbnail/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: htmlContent,
          name: name || 'template',
        }),
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response result:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate thumbnail')
      }

      setThumbnailUrl(result.url)
      console.log('Thumbnail URL set:', result.url)
    } catch (err) {
      console.error('Thumbnail generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate thumbnail')
    } finally {
      setIsGeneratingThumbnail(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required')
      return
    }
    if (!htmlContent.trim()) {
      setError('HTML content is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const url = isNew ? '/api/templates' : `/api/templates/${template?.id}`
      const method = isNew ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          size: size || '8.5x11 inches',
          html_content: htmlContent,
          thumbnail_url: thumbnailUrl || null,
          is_active: isActive,
          campaign_id: campaignId,
          system_prompt_id: systemPromptId,
          template_prompt: templatePrompt || null,
          fields: templateFields.map((f) => ({
            field_key: f.field_key,
            field_type: f.field_type,
            label: f.label,
            placeholder: f.placeholder || null,
            default_value: f.default_value || null,
            options: f.options,
            is_required: f.is_required,
            display_order: f.display_order,
          })),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save template')
      }

      router.push('/admin/templates')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/admin/templates')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" required>
                Template Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Real Estate Listing - Modern"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this template..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size" required>Print Size</Label>
              <Select
                id="size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              >
                <option value="8.5x11 inches">8.5 x 11 inches (Letter)</option>
                <option value="8.5x14 inches">8.5 x 14 inches (Legal)</option>
                <option value="11x17 inches">11 x 17 inches (Tabloid)</option>
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="A5">A5 (148 x 210 mm)</option>
                <option value="5x7 inches">5 x 7 inches</option>
                <option value="4x6 inches">4 x 6 inches (Postcard)</option>
                <option value="6x9 inches">6 x 9 inches</option>
                <option value="9x12 inches">9 x 12 inches</option>
                <option value="custom">Custom (specify in description)</option>
              </Select>
              <p className="text-xs text-gray-500">
                This size will be included in the generated prompt to ensure Claude creates content that fits this printable size.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Thumbnail</Label>
              {/* Toggle between generate, upload, and URL */}
              <div className="flex gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => setThumbnailInputMode('generate')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    thumbnailInputMode === 'generate'
                      ? 'bg-[#f5d5d5] text-gray-900'
                      : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Generate
                </button>
                <button
                  type="button"
                  onClick={() => setThumbnailInputMode('upload')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    thumbnailInputMode === 'upload'
                      ? 'bg-[#f5d5d5] text-gray-900'
                      : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setThumbnailInputMode('url')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    thumbnailInputMode === 'url'
                      ? 'bg-[#f5d5d5] text-gray-900'
                      : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  URL
                </button>
              </div>

              {thumbnailInputMode === 'generate' ? (
                <button
                  type="button"
                  onClick={handleGenerateThumbnail}
                  disabled={isGeneratingThumbnail || !htmlContent.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/10 rounded-xl hover:border-[#f5d5d5]/50 hover:bg-white/5 transition-colors text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingThumbnail ? (
                    <>
                      <Spinner size="sm" />
                      Generating preview...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate from HTML
                    </>
                  )}
                </button>
              ) : thumbnailInputMode === 'upload' ? (
                <div className="space-y-2">
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                    id="thumbnailUpload"
                  />
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={isUploadingThumbnail}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/10 rounded-xl hover:border-[#f5d5d5]/50 hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                  >
                    {isUploadingThumbnail ? (
                      <>
                        <Spinner size="sm" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        Click to upload image
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <Input
                  id="thumbnailUrl"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://example.com/thumbnail.jpg"
                />
              )}

              {/* Thumbnail Preview */}
              {thumbnailUrl && (
                <div className="relative mt-2">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#2a2a2a]">
                    <Image
                      src={thumbnailUrl}
                      alt="Thumbnail preview"
                      fill
                      className="object-cover"
                      onError={() => setError('Failed to load image preview')}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setThumbnailUrl('')}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-white/10 bg-[#2a2a2a] text-[#f5d5d5] focus:ring-[#f5d5d5]/50"
              />
              <Label htmlFor="isActive">Active (visible to users)</Label>
            </div>

            {/* Campaign Selection */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between">
                <Label>Campaign</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewCampaignForm(!showNewCampaignForm)}
                  className="h-7 px-2 text-xs"
                >
                  {showNewCampaignForm ? (
                    <>
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-3 h-3 mr-1" />
                      New Campaign
                    </>
                  )}
                </Button>
              </div>

              {showNewCampaignForm && (
                <div className="p-3 bg-[#2a2a2a] rounded-lg border border-white/5 space-y-3">
                  <div className="space-y-2">
                    <Label>Campaign Name</Label>
                    <Input
                      value={newCampaignName}
                      onChange={(e) => setNewCampaignName(e.target.value)}
                      placeholder="e.g., Spring 2025 Listings"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newCampaignColor}
                        onChange={(e) => setNewCampaignColor(e.target.value)}
                        className="w-10 h-10 rounded border border-white/10 bg-transparent cursor-pointer"
                      />
                      <Input
                        value={newCampaignColor}
                        onChange={(e) => setNewCampaignColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateCampaign}
                    disabled={!newCampaignName.trim() || isCreatingCampaign}
                    className="w-full"
                  >
                    {isCreatingCampaign ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Campaign'
                    )}
                  </Button>
                </div>
              )}

              {isLoadingCampaigns ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : (
                <Select
                  value={campaignId || ''}
                  onChange={(e) => setCampaignId(e.target.value || null)}
                >
                  <option value="">No campaign</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </Select>
              )}

              {campaignId && campaigns.find((c) => c.id === campaignId) && (
                editingCampaignId === campaignId ? (
                  <div className="p-3 bg-[#2a2a2a] rounded-lg border border-white/5 space-y-3">
                    <div className="space-y-2">
                      <Label>Campaign Name</Label>
                      <Input
                        value={editCampaignName}
                        onChange={(e) => setEditCampaignName(e.target.value)}
                        placeholder="Campaign name"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editCampaignColor}
                          onChange={(e) => setEditCampaignColor(e.target.value)}
                          className="w-10 h-10 rounded border border-white/10 bg-transparent cursor-pointer"
                        />
                        <Input
                          value={editCampaignColor}
                          onChange={(e) => setEditCampaignColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveCampaign}
                        disabled={!editCampaignName.trim() || isSavingCampaign}
                        className="flex-1"
                      >
                        {isSavingCampaign ? (
                          <>
                            <Spinner size="sm" className="mr-2" />
                            Saving...
                          </>
                        ) : (
                          'Save'
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEditCampaign}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const campaign = campaigns.find((c) => c.id === campaignId)
                      if (campaign) handleStartEditCampaign(campaign)
                    }}
                    className="flex items-center gap-2 text-sm group hover:bg-white/5 -mx-2 px-2 py-1 rounded-lg transition-colors"
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: campaigns.find((c) => c.id === campaignId)?.color }}
                    />
                    <span className="text-gray-400 group-hover:text-white transition-colors">
                      {campaigns.find((c) => c.id === campaignId)?.name}
                    </span>
                    <span className="text-gray-600 text-xs group-hover:text-gray-400 transition-colors">
                      (click to edit)
                    </span>
                  </button>
                )
              )}
            </div>

            {/* System Prompt Selection */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <Label>System Prompt</Label>
              <p className="text-xs text-gray-500 -mt-1">
                Select a system prompt to customize how Claude generates content for this template
              </p>
              {isLoadingPrompts ? (
                <div className="flex items-center justify-center py-4">
                  <Spinner size="sm" />
                </div>
              ) : (
                <Select
                  value={systemPromptId || ''}
                  onChange={(e) => setSystemPromptId(e.target.value || null)}
                >
                  <option value="">No system prompt (use default)</option>
                  {systemPrompts.map((prompt) => (
                    <option key={prompt.id} value={prompt.id}>
                      {prompt.name}
                    </option>
                  ))}
                </Select>
              )}
              {systemPromptId && systemPrompts.find((p) => p.id === systemPromptId) && (
                <div className="p-3 bg-[#2a2a2a] rounded-lg border border-white/5">
                  <p className="text-xs text-gray-400 mb-2">
                    {systemPrompts.find((p) => p.id === systemPromptId)?.description || 'No description'}
                  </p>
                  <details className="group">
                    <summary className="text-xs text-[#f5d5d5] cursor-pointer hover:text-white">
                      View prompt content
                    </summary>
                    <pre className="mt-2 p-2 bg-[#1e1e1e] rounded text-xs text-gray-400 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto dark-scrollbar">
                      {systemPrompts.find((p) => p.id === systemPromptId)?.prompt_content}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* HTML Content */}
        <Card>
          <CardHeader>
            <CardTitle>HTML Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="htmlContent" required>
                Template HTML
              </Label>
              <Textarea
                id="htmlContent"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<!DOCTYPE html>..."
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>Template Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="templatePrompt">
              Custom Instructions for This Template
            </Label>
            <p className="text-xs text-gray-500">
              Add specific instructions that will be included in the generated prompt for Claude.
              This is useful for template-specific guidance like tone, style, or special formatting requirements.
            </p>
            <Textarea
              id="templatePrompt"
              value={templatePrompt}
              onChange={(e) => setTemplatePrompt(e.target.value)}
              placeholder="e.g., Use a professional and warm tone. Emphasize the property's unique features. Keep the text concise and impactful..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Template Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Template Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateFieldsEditor fields={templateFields} onChange={setTemplateFields} />
        </CardContent>
      </Card>
    </div>
  )
}
