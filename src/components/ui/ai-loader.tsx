'use client'

import Image from 'next/image'
import './ai-loader.css'

interface AiLoaderProps {
  text?: string
}

export function AiLoader({ text = 'Generating' }: AiLoaderProps) {
  const letters = text.split('')

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
      <div className="loader-text">
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
    </div>
  )
}
