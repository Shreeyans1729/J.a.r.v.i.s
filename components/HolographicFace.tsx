"use client"

import { useEffect, useRef } from "react"

interface HolographicFaceProps {
  isActive: boolean
  isListening: boolean
  isSpeaking: boolean
}

export function HolographicFace({ isActive, isListening, isSpeaking }: HolographicFaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    let time = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Set glow effect
      ctx.shadowBlur = 20
      ctx.shadowColor = isActive ? "#00ffff" : "#004444"

      // Draw outer ring
      ctx.beginPath()
      ctx.arc(centerX, centerY, 120 + Math.sin(time * 0.02) * 5, 0, Math.PI * 2)
      ctx.strokeStyle = isActive ? "#00ffff" : "#004444"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw middle ring
      ctx.beginPath()
      ctx.arc(centerX, centerY, 80 + Math.sin(time * 0.03) * 3, 0, Math.PI * 2)
      ctx.strokeStyle = isActive ? "#0088ff" : "#002244"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw inner ring
      ctx.beginPath()
      ctx.arc(centerX, centerY, 40 + Math.sin(time * 0.04) * 2, 0, Math.PI * 2)
      ctx.strokeStyle = isActive ? "#00aaff" : "#001122"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw connecting lines
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8 + time * 0.01
        const x1 = centerX + Math.cos(angle) * 40
        const y1 = centerY + Math.sin(angle) * 40
        const x2 = centerX + Math.cos(angle) * 120
        const y2 = centerY + Math.sin(angle) * 120

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = isActive ? "#00ffff44" : "#00444444"
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Draw eyes
      const eyeGlow = isSpeaking ? Math.sin(time * 0.1) * 0.5 + 0.5 : 0.3
      ctx.shadowBlur = 15
      ctx.shadowColor = `rgba(0, 255, 255, ${eyeGlow})`

      // Left eye
      ctx.beginPath()
      ctx.arc(centerX - 25, centerY - 15, 8, 0, Math.PI * 2)
      ctx.fillStyle = isActive ? "#00ffff" : "#004444"
      ctx.fill()

      // Right eye
      ctx.beginPath()
      ctx.arc(centerX + 25, centerY - 15, 8, 0, Math.PI * 2)
      ctx.fillStyle = isActive ? "#00ffff" : "#004444"
      ctx.fill()

      // Draw mouth (animated when speaking)
      if (isSpeaking) {
        const mouthHeight = Math.sin(time * 0.2) * 10 + 15
        ctx.beginPath()
        ctx.ellipse(centerX, centerY + 20, 20, mouthHeight, 0, 0, Math.PI * 2)
        ctx.strokeStyle = "#00ffff"
        ctx.lineWidth = 2
        ctx.stroke()
      } else if (isListening) {
        // Listening indicator - pulsing line
        const pulseWidth = Math.sin(time * 0.15) * 10 + 20
        ctx.beginPath()
        ctx.moveTo(centerX - pulseWidth, centerY + 20)
        ctx.lineTo(centerX + pulseWidth, centerY + 20)
        ctx.strokeStyle = "#00ffff"
        ctx.lineWidth = 3
        ctx.stroke()
      } else {
        // Neutral mouth
        ctx.beginPath()
        ctx.moveTo(centerX - 15, centerY + 20)
        ctx.lineTo(centerX + 15, centerY + 20)
        ctx.strokeStyle = isActive ? "#00ffff" : "#004444"
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Draw particles
      if (isActive) {
        for (let i = 0; i < 20; i++) {
          const particleAngle = (i * Math.PI * 2) / 20 + time * 0.02
          const distance = 150 + Math.sin(time * 0.03 + i) * 20
          const x = centerX + Math.cos(particleAngle) * distance
          const y = centerY + Math.sin(particleAngle) * distance

          ctx.beginPath()
          ctx.arc(x, y, 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0, 255, 255, ${Math.sin(time * 0.05 + i) * 0.5 + 0.5})`
          ctx.fill()
        }
      }

      time++
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, isListening, isSpeaking])

  return (
    <div className="relative">
      <canvas ref={canvasRef} width={400} height={400} className="border border-cyan-500/30 rounded-full bg-black/50" />
      {isActive && <div className="absolute inset-0 rounded-full bg-cyan-500/10 animate-pulse" />}
    </div>
  )
}
