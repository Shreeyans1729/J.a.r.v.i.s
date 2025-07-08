"use client"

interface StatusIndicatorProps {
  isOnline: boolean
  isListening: boolean
  isSpeaking: boolean
  wakeWordDetected: boolean
}

export function StatusIndicator({ isOnline, isListening, isSpeaking, wakeWordDetected }: StatusIndicatorProps) {
  const getStatus = () => {
    if (isSpeaking) return { text: "SPEAKING", color: "text-green-400", bg: "bg-green-400/20" }
    if (isListening) return { text: "LISTENING", color: "text-yellow-400", bg: "bg-yellow-400/20" }
    if (wakeWordDetected) return { text: "ACTIVATED", color: "text-cyan-400", bg: "bg-cyan-400/20" }
    if (isOnline) return { text: "ONLINE", color: "text-blue-400", bg: "bg-blue-400/20" }
    return { text: "OFFLINE", color: "text-red-400", bg: "bg-red-400/20" }
  }

  const status = getStatus()

  return (
    <div className={`px-4 py-2 rounded-full border ${status.bg} ${status.color} border-current`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status.color.replace("text-", "bg-")} animate-pulse`} />
        <span className="text-sm font-mono font-bold">{status.text}</span>
      </div>
    </div>
  )
}
