"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, Square, TestTube, Send, AlertTriangle } from "lucide-react"
import { forceStopAudio } from "@/lib/audio"

interface ControlsPanelProps {
  onActivate: () => void
  onStop: () => void
  onTest: () => void
  onTextSearch: (query: string) => void
  isActive: boolean
  isListening: boolean
  isSpeaking: boolean
  microphoneStatus: "unknown" | "granted" | "denied" | "checking"
  onRequestMicrophone: () => void
}

export function ControlsPanel({
  onActivate,
  onStop,
  onTest,
  onTextSearch,
  isActive,
  isListening,
  isSpeaking,
  microphoneStatus,
  onRequestMicrophone,
}: ControlsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleTextSearch = () => {
    if (searchQuery.trim()) {
      // Stop any ongoing speech before starting new command
      forceStopAudio()

      onTextSearch(searchQuery.trim())
      setSearchQuery("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTextSearch()
    }
  }

  const getActivateButtonText = () => {
    if (microphoneStatus === "denied") return "Enable Voice"
    if (microphoneStatus === "checking") return "Checking..."
    if (isListening) return "Listening..."
    if (isActive) return "Active"
    return "Activate"
  }

  const getActivateButtonClass = () => {
    if (microphoneStatus === "denied") {
      return "bg-yellow-600 hover:bg-yellow-700"
    }
    if (isListening) {
      return "bg-yellow-600 hover:bg-yellow-700 animate-pulse"
    }
    return "bg-cyan-600 hover:bg-cyan-700"
  }

  return (
    <div className="flex flex-col gap-4 items-center">
      {/* Text Search Input */}
      <div className="flex gap-2 w-full max-w-md">
        <Input
          type="text"
          placeholder="Type your command or question..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSpeaking}
          className="bg-black/50 border-cyan-500/50 text-cyan-100 placeholder-cyan-400/70 focus:border-cyan-400"
        />
        <Button
          onClick={handleTextSearch}
          disabled={!searchQuery.trim() || isSpeaking}
          className="bg-cyan-600 hover:bg-cyan-700 px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Voice Controls */}
      <div className="flex gap-4 items-center flex-wrap justify-center">
        <Button
          onClick={microphoneStatus === "denied" ? onRequestMicrophone : onActivate}
          disabled={(isActive && microphoneStatus === "granted") || isSpeaking || microphoneStatus === "checking"}
          className={`px-6 py-3 ${getActivateButtonClass()}`}
        >
          {microphoneStatus === "denied" ? (
            <AlertTriangle className="w-5 h-5 mr-2" />
          ) : (
            <Mic className="w-5 h-5 mr-2" />
          )}
          {getActivateButtonText()}
        </Button>

        <Button
          onClick={onStop}
          disabled={!isActive && !isSpeaking && !isListening}
          variant="destructive"
          className="px-6 py-3"
        >
          <Square className="w-5 h-5 mr-2" />
          Stop
        </Button>

        <Button
          onClick={onTest}
          disabled={isActive || isSpeaking}
          variant="outline"
          className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 px-6 py-3 bg-transparent"
        >
          <TestTube className="w-5 h-5 mr-2" />
          Test Voice
        </Button>

        {/* Browser Settings Help */}
        <Button
          onClick={() => {
            const instructions = `To enable microphone access:

Chrome/Edge:
1. Click the 🔒 or 🎤 icon in the address bar
2. Select "Allow" for microphone
3. Refresh the page

Firefox:
1. Click the 🎤 icon in the address bar
2. Select "Allow" 
3. Refresh the page

Safari:
1. Go to Safari > Settings > Websites > Microphone
2. Set this site to "Allow"
3. Refresh the page`

            alert(instructions)
          }}
          variant="outline"
          size="sm"
          className="border-orange-500 text-orange-400 hover:bg-orange-500/10 bg-transparent"
        >
          🔧 Browser Help
        </Button>

        <Button
          onClick={() => {
            window.location.reload()
          }}
          variant="outline"
          size="sm"
          className="border-orange-500 text-orange-400 hover:bg-orange-500/10 bg-transparent"
        >
          🔄 Refresh Page
        </Button>
      </div>
    </div>
  )
}
