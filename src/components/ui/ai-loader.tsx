'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import './ai-loader.css'

interface AiLoaderProps {
  text?: string
  texts?: string[]
  showSubtitle?: boolean
}

const DEFAULT_TEXTS = [
  'Personalizing',
  'Adding your details',
  'Applying brand colors',
  'Updating contact info',
  'Customizing layout',
  'Finalizing design',
]

export function AiLoader({ text, texts = DEFAULT_TEXTS, showSubtitle = true }: AiLoaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Rotate through texts every 3 seconds
  useEffect(() => {
    if (text) return // Don't rotate if single text is provided

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [text, texts.length])

  const displayText = text || texts[currentIndex]
  const letters = displayText.split('')

  return (
    <div className="loader-wrapper">
      <div className="loader-logo">
        <Image
          src="/claude-loading-animation.svg"
          alt="Claude"
          width={60}
          height={60}
          className="claude-logo"
        />
      </div>
      <div className="loader-text-container">
        <div className="loader-text" key={displayText}>
          {letters.map((letter, index) => (
            <span
              key={index}
              className="loader-letter"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {letter}
            </span>
          ))}
        </div>
        {showSubtitle && (
          <div className="loader-subtitle">
            This can take up to 60 seconds
          </div>
        )}
      </div>
    </div>
  )
}
