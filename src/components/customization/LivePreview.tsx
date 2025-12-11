'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react'
import { TemplateField } from '@/types'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { AiLoader } from '@/components/ui/ai-loader'
import { Camera, Maximize2, Minimize2, RefreshCw, Sparkles, ZoomIn, ZoomOut } from 'lucide-react'

// Letter size width (8.5" at 96dpi) - height will be auto based on content
const LETTER_WIDTH = 816

interface LivePreviewProps {
  htmlContent: string
  values: Record<string, string>
  fields: TemplateField[]
  fullHeight?: boolean
  isAdmin?: boolean
}

export interface LivePreviewHandle {
  getIframeDocument: () => Document | null
  getRenderedHtml: () => string
  regenerate: () => void
  takeScreenshot: () => Promise<void>
}

export const LivePreview = forwardRef<LivePreviewHandle, LivePreviewProps>(
  function LivePreview({ htmlContent, values, fields, fullHeight = false, isAdmin = false }, ref) {
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [scale, setScale] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [isTakingScreenshot, setIsTakingScreenshot] = useState(false)
    const [renderedHtml, setRenderedHtml] = useState(htmlContent)
    const [lastValues, setLastValues] = useState<string>('')
    const [userPrompt, setUserPrompt] = useState('')
    const [lastPrompt, setLastPrompt] = useState('')
    const [iframeHeight, setIframeHeight] = useState(600)
    const containerRef = useRef<HTMLDivElement>(null)
    const iframeRef = useRef<HTMLIFrameElement>(null)

    // Auto-resize iframe based on content height
    const updateIframeHeight = useCallback(() => {
      if (iframeRef.current?.contentDocument?.body) {
        const height = iframeRef.current.contentDocument.body.scrollHeight
        // Ensure minimum height of 600px
        if (height > 100) {
          setIframeHeight(Math.max(height, 600))
        }
      }
    }, [])

    // Check if any values have content
    const hasValues = Object.values(values).some(v => v && v.trim())

    // Just return the HTML as-is, let the iframe handle sizing
    const wrapHtmlForLetterSize = useCallback((html: string) => {
      return html
    }, [])

    // Generate AI-customized HTML
    const generateAiHtml = useCallback(async (promptOverride?: string) => {
      const promptToUse = promptOverride !== undefined ? promptOverride : lastPrompt

      if (!hasValues && !promptToUse) {
        setRenderedHtml(wrapHtmlForLetterSize(htmlContent))
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch('/api/ai/customize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            htmlContent,
            fields,
            values,
            userPrompt: promptToUse,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to customize')
        }

        const data = await response.json()
        setRenderedHtml(wrapHtmlForLetterSize(data.html))
      } catch (error) {
        console.error('AI customization error:', error)
        // Fallback to original HTML
        setRenderedHtml(wrapHtmlForLetterSize(htmlContent))
      } finally {
        setIsLoading(false)
      }
    }, [htmlContent, fields, values, hasValues, lastPrompt, wrapHtmlForLetterSize])

    // Track values changes without auto-regenerating
    // Users must click "Regenerate Preview" to trigger AI calls
    useEffect(() => {
      const currentValuesStr = JSON.stringify(values)
      if (currentValuesStr !== lastValues) {
        setLastValues(currentValuesStr)
      }
    }, [values, lastValues])

    // Initial render
    useEffect(() => {
      setRenderedHtml(wrapHtmlForLetterSize(htmlContent))
    }, [htmlContent, wrapHtmlForLetterSize])

    // Update iframe height when content changes
    useEffect(() => {
      // Small delay to let iframe render
      const timer = setTimeout(updateIframeHeight, 100)
      return () => clearTimeout(timer)
    }, [renderedHtml, updateIframeHeight])

    // Zoom controls
    const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]
    const MIN_ZOOM = 0.25
    const MAX_ZOOM = 2

    const handleZoomIn = () => {
      const currentIndex = ZOOM_LEVELS.findIndex(z => z >= scale)
      if (currentIndex < ZOOM_LEVELS.length - 1) {
        setScale(ZOOM_LEVELS[currentIndex + 1])
      }
    }

    const handleZoomOut = () => {
      const currentIndex = ZOOM_LEVELS.findIndex(z => z >= scale)
      if (currentIndex > 0) {
        setScale(ZOOM_LEVELS[currentIndex - 1])
      }
    }

    // Expose iframe document, rendered HTML, regenerate, and screenshot functions to parent
    useImperativeHandle(ref, () => ({
      getIframeDocument: () => {
        if (iframeRef.current) {
          return iframeRef.current.contentDocument
        }
        return null
      },
      getRenderedHtml: () => renderedHtml,
      regenerate: () => generateAiHtml(),
      takeScreenshot
    }))

    const refreshPreview = () => {
      generateAiHtml()
    }

    const takeScreenshot = useCallback(async () => {
      setIsTakingScreenshot(true)
      try {
        // Use server-side Puppeteer for high-quality screenshot
        const response = await fetch('/api/screenshot/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            html: renderedHtml,
            filename: `preview-${Date.now()}`,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to generate screenshot')
        }

        // Get the PNG blob and download
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `preview-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Screenshot error:', error)
      } finally {
        setIsTakingScreenshot(false)
      }
    }, [renderedHtml])

    const handleSubmitPrompt = () => {
      if (!userPrompt.trim() && !hasValues) return
      setLastPrompt(userPrompt)
      generateAiHtml(userPrompt)
    }

    const handlePromptKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmitPrompt()
      }
    }

    const LoadingOverlay = () => (
      <div className="absolute inset-0 bg-[#141414]/90 flex items-center justify-center z-10">
        <AiLoader text="Generating" />
      </div>
    )

    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-50 bg-[#141414]">
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <Button variant="outline" size="sm" onClick={takeScreenshot} disabled={isTakingScreenshot} title="Take Screenshot">
              {isTakingScreenshot ? <Spinner size="sm" /> : <Camera className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={refreshPreview} disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(false)}>
              <Minimize2 className="w-4 h-4 mr-1" />
              Exit Fullscreen
            </Button>
          </div>
          {isLoading && <LoadingOverlay />}
          <iframe
            ref={iframeRef}
            srcDoc={renderedHtml}
            className="w-full h-full"
            title="Live Preview"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      )
    }

    // Full height mode for the new editor layout
    if (fullHeight) {
      return (
        <div ref={containerRef} className="h-full flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a] border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-300">Live Preview</span>
              {isLoading && (
                <div className="flex items-center gap-1 text-[#f5d5d5]">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  <span className="text-xs">Customizing...</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Zoom Controls */}
              <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={scale <= MIN_ZOOM}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-gray-400 w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={scale >= MAX_ZOOM}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <Button variant="ghost" size="sm" onClick={takeScreenshot} disabled={isTakingScreenshot} title="Take Screenshot">
                {isTakingScreenshot ? <Spinner size="sm" /> : <Camera className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={refreshPreview} disabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(true)}>
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-[#1a1a1a] p-6 relative">
            {isLoading && <LoadingOverlay />}
            <div className="flex justify-center">
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                }}
              >
                <div className="bg-white shadow-lg rounded-lg overflow-hidden" style={{ width: `${LETTER_WIDTH}px`, minHeight: '600px' }}>
                  <iframe
                    ref={iframeRef}
                    srcDoc={renderedHtml}
                    style={{ width: `${LETTER_WIDTH}px`, height: `${iframeHeight}px`, minHeight: '600px', border: 'none' }}
                    title="Live Preview"
                    sandbox="allow-same-origin allow-scripts"
                    onLoad={updateIframeHeight}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* AI Prompt Input - Admin Only */}
          {isAdmin && (
            <div className="shrink-0 px-4 py-3 bg-[#1e1e1e] border-t border-white/5">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Textarea
                    placeholder="Enter additional instructions for AI customization... (e.g., 'Make the headline more compelling' or 'Add a sense of urgency')"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    onKeyDown={handlePromptKeyDown}
                    className="resize-none text-sm min-h-[44px] max-h-[120px]"
                    rows={1}
                  />
                </div>
                <Button
                  onClick={handleSubmitPrompt}
                  disabled={isLoading || (!userPrompt.trim() && !hasValues)}
                  size="sm"
                  className="h-[44px] px-4"
                >
                  {isLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Regenerate
                    </>
                  )}
                </Button>
              </div>
              {lastPrompt && (
                <p className="text-xs text-gray-500 mt-2">
                  Last prompt: &ldquo;{lastPrompt.length > 60 ? lastPrompt.slice(0, 60) + '...' : lastPrompt}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      )
    }

    return (
      <div ref={containerRef} className="bg-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-[#2a2a2a] border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-300">Live Preview</span>
            {isLoading && (
              <div className="flex items-center gap-1 text-[#f5d5d5]">
                <Sparkles className="w-3 h-3 animate-pulse" />
                <span className="text-xs">Customizing...</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={takeScreenshot} disabled={isTakingScreenshot} title="Take Screenshot">
              {isTakingScreenshot ? <Spinner size="sm" /> : <Camera className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={refreshPreview} disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(true)}>
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="p-4 overflow-auto relative" style={{ maxHeight: '70vh' }}>
          {isLoading && <LoadingOverlay />}
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${100 / scale}%`,
            }}
          >
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <iframe
                ref={iframeRef}
                srcDoc={renderedHtml}
                className="w-full"
                style={{ minHeight: '600px' }}
                title="Live Preview"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
)
