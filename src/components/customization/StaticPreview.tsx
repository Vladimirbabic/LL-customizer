'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut } from 'lucide-react'

// Letter size width (8.5" at 96dpi)
const LETTER_WIDTH = 816

interface StaticPreviewProps {
  htmlContent: string
}

export function StaticPreview({ htmlContent }: StaticPreviewProps) {
  const [scale, setScale] = useState(1)
  const [iframeHeight, setIframeHeight] = useState(600)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]
  const MIN_ZOOM = 0.25
  const MAX_ZOOM = 2

  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.findIndex((z) => z >= scale)
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setScale(ZOOM_LEVELS[currentIndex + 1])
    }
  }

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.findIndex((z) => z >= scale)
    if (currentIndex > 0) {
      setScale(ZOOM_LEVELS[currentIndex - 1])
    }
  }

  const updateIframeHeight = useCallback(() => {
    if (iframeRef.current?.contentDocument?.body) {
      const height = iframeRef.current.contentDocument.body.scrollHeight
      if (height > 100) {
        setIframeHeight(Math.max(height, 600))
      }
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(updateIframeHeight, 100)
    return () => clearTimeout(timer)
  }, [htmlContent, updateIframeHeight])

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] relative">
      {/* Zoom Controls - floating with shadow */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-[#2a2a2a] rounded-lg px-2 py-1 shadow-lg border border-white/10">
        <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={scale <= MIN_ZOOM} className="h-8 w-8 p-0">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs text-gray-400 w-12 text-center">{Math.round(scale * 100)}%</span>
        <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={scale >= MAX_ZOOM} className="h-8 w-8 p-0">
          <ZoomIn className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto bg-[#1a1a1a] p-6 dark-scrollbar">
        <div className="flex justify-center">
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
            }}
          >
            <div
              className="bg-white shadow-2xl overflow-hidden"
              style={{ width: `${LETTER_WIDTH}px`, minHeight: '600px', borderRadius: '20px' }}
            >
              <iframe
                ref={iframeRef}
                srcDoc={htmlContent}
                style={{
                  width: `${LETTER_WIDTH}px`,
                  height: `${iframeHeight}px`,
                  minHeight: '600px',
                  border: 'none',
                }}
                title="Template Preview"
                sandbox="allow-same-origin"
                onLoad={updateIframeHeight}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
