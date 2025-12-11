'use client'

import './ai-loader.css'

interface AiLoaderProps {
  text?: string
}

export function AiLoader({ text = 'Generating' }: AiLoaderProps) {
  const letters = text.split('')

  return (
    <div className="loader-wrapper">
      <div className="loader" />
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
  )
}
