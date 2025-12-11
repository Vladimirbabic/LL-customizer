'use client'

import { useState } from 'react'
import Image from 'next/image'
import { TemplateField } from '@/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Upload, X, Link as LinkIcon } from 'lucide-react'

interface ImageUploadFieldProps {
  field: TemplateField
  value: string
  onChange: (value: string) => void
  error?: string
}

export function ImageUploadField({ field, value, onChange, error }: ImageUploadFieldProps) {
  const [inputMode, setInputMode] = useState<'url' | 'upload'>('url')
  const [previewError, setPreviewError] = useState(false)

  const handleUrlChange = (url: string) => {
    setPreviewError(false)
    onChange(url)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // For now, convert to base64 data URL
    // In production, you'd upload to Supabase Storage
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setPreviewError(false)
      onChange(result)
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    onChange('')
    setPreviewError(false)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={field.field_key} required={field.is_required}>
        {field.label}
      </Label>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-2">
        <Button
          type="button"
          variant={inputMode === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputMode('url')}
        >
          <LinkIcon className="w-4 h-4 mr-1" />
          URL
        </Button>
        <Button
          type="button"
          variant={inputMode === 'upload' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setInputMode('upload')}
        >
          <Upload className="w-4 h-4 mr-1" />
          Upload
        </Button>
      </div>

      {inputMode === 'url' ? (
        <Input
          id={field.field_key}
          type="url"
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={field.placeholder || 'https://example.com/image.jpg'}
          error={!!error}
        />
      ) : (
        <Input
          id={field.field_key}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="cursor-pointer"
          error={!!error}
        />
      )}

      {/* Preview */}
      {value && (
        <div className="relative mt-2">
          <div className="relative aspect-video w-full max-w-xs bg-[#2a2a2a] rounded-xl overflow-hidden">
            {previewError ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                Failed to load image
              </div>
            ) : (
              <Image
                src={value}
                alt="Preview"
                fill
                className="object-cover"
                onError={() => setPreviewError(true)}
              />
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={clearImage}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
