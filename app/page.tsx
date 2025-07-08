"use client"

import { useState, useEffect, useRef } from "react"
import { HolographicFace } from "@/components/HolographicFace"
import { ControlsPanel } from "@/components/ControlsPanel"
import { StatusIndicator } from "@/components/StatusIndicator"
import { initializeSpeechRecognition, startListening, stopListening } from "@/lib/speech"
import { playAudioResponse, forceStopAudio } from "@/lib/audio"
import { VoiceCalibration } from "@/components/VoiceCalibration"
import { SearchHistory } from "@/components/SearchHistory"
import { PhoneControlPanel } from "@/components/PhoneControlPanel"
import { SearchPanel } from "@/components/SearchPanel"
import { DataManager } from "@/components/DataManager"
import { SmartSuggestions } from "@/components/SmartSuggestions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { jarvisStorage } from "@/lib/storage"
import { Smartphone, Mic, AlertTriangle, CheckCircle, Search, User, Database, Lightbulb } from "lucide-react"

export default function JarvisPage() {
  const [isActive, setIsActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [wakeWordDetected, setWakeWordDetected] = useState(false)
  const [currentMessage, setCurrentMessage] = useState("")
  const [isOnline, setIsOnline] = useState(true)
  const [showPhoneControls, setShowPhoneControls] = useState(false)
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [showDataManager, setShowDataManager] = useState(false)
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false)
  const [microphoneStatus, setMicrophoneStatus] = useState<"unknown" | "granted" | "denied" | "checking">("unknown")
  const [showMicrophoneHelp, setShowMicrophoneHelp] = useState(false)
  const [currentInput, setCurrentInput] = useState("")

  const [voiceSettings, setVoiceSettings] = useState({
    confidenceThreshold: 0.7,
    noiseReduction: true,
    microphoneSensitivity: 0.8,
  })

  const recognitionRef = useRef<any | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isInitializedRef = useRef(false)
  const searchHistoryRef = useRef<any>(null)

  // Load user preferences on startup
  useEffect(() => {
    const preferences = jarvisStorage.getPreferences()
    setVoiceSettings(preferences.voiceSettings)
  }, [])

  // Check microphone permissions
  const checkMicrophonePermissions = async () => {
    try {
      setMicrophoneStatus("checking")

      // First check if navigator.permissions is available
      if (navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: "microphone" as PermissionName })

        if (permissionStatus.state === "granted") {
          setMicrophoneStatus("granted")
          return true
        } else if (permissionStatus.state === "denied") {
          setMicrophoneStatus("denied")
          return false
        }
      }

      // Fallback: Try to access microphone directly
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // If we get here, permission was granted
      setMicrophoneStatus("granted")

      // Stop the stream immediately as we just needed to check permission
      stream.getTracks().forEach((track) => track.stop())

      return true
    } catch (error) {
      console.error("Microphone permission check failed:", error)
      setMicrophoneStatus("denied")
      return false
    }
  }

  // Request microphone permissions
  const requestMicrophonePermission = async () => {
    try {
      setMicrophoneStatus("checking")
      setCurrentMessage("Requesting microphone access...")

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      console.log("✅ Microphone permission granted")
      setMicrophoneStatus("granted")
      setCurrentMessage("Microphone access granted. Initializing voice recognition...")

      // Stop the stream as we just needed permission
      stream.getTracks().forEach((track) => track.stop())

      // Initialize recognition after permission is granted
      setTimeout(() => {
        initializeRecognition()
      }, 500)

      return true
    } catch (error) {
      console.error("❌ Microphone permission denied:", error)
      setMicrophoneStatus("denied")
      setCurrentMessage("Microphone access denied. Please grant permission to use voice commands.")
      setShowMicrophoneHelp(true)
      return false
    }
  }

  const initializeRecognition = () => {
    // Initialize speech recognition
    const recognition = initializeSpeechRecognition({
      onWakeWord: () => {
        console.log("🎯 Wake word callback triggered")
        setWakeWordDetected(true)
        setIsActive(true)
        setIsListening(true)
        setCurrentMessage("Wake word detected. Listening for your command, Sir Shreeyans...")

        // Track voice recognition attempt
        jarvisStorage.updateVoiceRecognitionStats(true)
      },
      onSpeechResult: async (transcript: string) => {
        console.log("📝 Speech result callback:", transcript)
        await processCommand(transcript)
      },
      onError: (error: string) => {
        console.error("❌ Speech recognition error callback:", error)

        // Log error for analytics
        jarvisStorage.logError(error, "speech_recognition")
        jarvisStorage.updateVoiceRecognitionStats(false)

        // Handle specific permission errors
        if (error.includes("not-allowed") || error.includes("denied")) {
          setMicrophoneStatus("denied")
          setShowMicrophoneHelp(true)
          setCurrentMessage("Microphone access was denied. Please enable it to use voice commands.")
        } else if (error) {
          setCurrentMessage(error)
        }

        setIsActive(false)
        setIsListening(false)

        // Auto-recovery after error (shorter timeout for better UX)
        setTimeout(() => {
          if (microphoneStatus === "granted") {
            setCurrentMessage('Ready to serve you, Sir Shreeyans. Say "Hey JARVIS" or type your command.')
          } else {
            setCurrentMessage(
              "JARVIS is ready to serve you, Sir Shreeyans. Text input and real-time search are available.",
            )
          }
        }, 3000)
      },
    })

    recognitionRef.current = recognition

    if (recognition) {
      setCurrentMessage('Ready to serve you, Sir Shreeyans. Say "Hey JARVIS" or type your command.')
    } else {
      setCurrentMessage(
        "Voice recognition not supported. Text input and real-time search are ready for you, Sir Shreeyans.",
      )
    }
  }

  useEffect(() => {
    // Prevent double initialization
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    console.log("🚀 Initializing JARVIS for Sir Shreeyans...")
    setCurrentMessage("Initializing JARVIS systems for Sir Shreeyans...")
    setIsOnline(true) // Always online for text functionality

    // Check if we're in a supported browser
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log("⚠️ getUserMedia not available")
      setCurrentMessage(
        "Voice commands not available in this browser. Text input and real-time search are ready for you, Sir Shreeyans.",
      )
      setMicrophoneStatus("denied")
      return
    }

    // Check microphone permissions first
    checkMicrophonePermissions().then((hasPermission) => {
      if (hasPermission) {
        setCurrentMessage("Microphone access confirmed. Initializing voice recognition for Sir Shreeyans...")
        initializeRecognition()
      } else {
        setCurrentMessage("JARVIS is ready to serve you, Sir Shreeyans. Text input and real-time search are available.")
      }
    })

    return () => {
      console.log("🧹 Cleaning up recognition...")
      if (recognitionRef.current) {
        recognitionRef.current.forceStop()
      }
      forceStopAudio()
    }
  }, []) // Keep empty dependency array

  const processCommand = async (command: string, searchCategory = "general") => {
    if (!command.trim()) return

    const startTime = Date.now()
    setCurrentMessage(`Processing your request, Sir Shreeyans: "${command}"`)
    setIsListening(false)

    // Stop any ongoing speech before processing new command
    forceStopAudio()

    try {
      console.log("🤖 Sending to AI...")
      // Send to chat API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: command }),
      })

      const data = await response.json()
      console.log("🤖 AI response received:", data)

      const responseTime = Date.now() - startTime

      if (data.response) {
        setCurrentMessage(data.response)

        // Store conversation in history with enhanced data
        jarvisStorage.addConversation({
          userInput: command,
          jarvisResponse: data.response,
          searchUsed: data.searchUsed || false,
          phoneControlUsed: data.phoneControlUsed || false,
          searchCategory: data.searchCategories?.[0] || searchCategory,
          responseTime,
          confidence: data.confidence,
        })

        // Add to search history (legacy support)
        if (searchHistoryRef.current) {
          searchHistoryRef.current.addToHistory(command, data.response)
        }

        setIsSpeaking(true)

        try {
          // Generate and play speech with enhanced error handling
          await playAudioResponse(data.response, {
            onStart: () => {
              console.log("🔊 Starting speech playback")
              setIsSpeaking(true)
            },
            onEnd: () => {
              console.log("🔇 Speech playback completed")
              setIsSpeaking(false)
              setIsActive(false)
              setWakeWordDetected(false)
              if (microphoneStatus === "granted") {
                setCurrentMessage('Ready to serve you, Sir Shreeyans. Say "Hey JARVIS" or type your command.')
              } else {
                setCurrentMessage(
                  "JARVIS is ready to serve you, Sir Shreeyans. Type your next command or explore real-time search.",
                )
              }
            },
            onError: (error) => {
              console.warn("🔊 Speech playback issue:", error.message)
              jarvisStorage.logError(error.message, "speech_synthesis")
              setIsSpeaking(false)

              // Only show error for serious issues, not interruptions
              if (
                !error.message.includes("interrupted") &&
                !error.message.includes("canceled") &&
                !error.message.includes("synthesis")
              ) {
                setCurrentMessage(
                  "Speech playback encountered an issue, but I've processed your request successfully, Sir Shreeyans.",
                )
              }

              // Continue with normal flow
              setIsActive(false)
              setWakeWordDetected(false)
              setTimeout(() => {
                if (microphoneStatus === "granted") {
                  setCurrentMessage('Ready to serve you, Sir Shreeyans. Say "Hey JARVIS" or type your command.')
                } else {
                  setCurrentMessage(
                    "JARVIS is ready to serve you, Sir Shreeyans. Type your next command or explore real-time search.",
                  )
                }
              }, 2000)
            },
          })
        } catch (speechError: any) {
          console.warn("🔊 Speech synthesis issue:", speechError.message)
          jarvisStorage.logError(speechError.message, "speech_synthesis")
          setIsSpeaking(false)

          // Don't treat speech errors as critical - the command was processed successfully
          if (!speechError.message.includes("interrupted") && !speechError.message.includes("canceled")) {
            setCurrentMessage(`${data.response} (Note: Speech playback unavailable)`)
          }

          setIsActive(false)
          setWakeWordDetected(false)

          setTimeout(() => {
            if (microphoneStatus === "granted") {
              setCurrentMessage('Ready to serve you, Sir Shreeyans. Say "Hey JARVIS" or type your command.')
            } else {
              setCurrentMessage(
                "JARVIS is ready to serve you, Sir Shreeyans. Type your next command or explore real-time search.",
              )
            }
          }, 3000)
        }
      }
    } catch (error) {
      console.error("❌ Error processing request:", error)
      jarvisStorage.logError(error.toString(), "command_processing")
      setCurrentMessage("I'm having trouble processing that request, Sir Shreeyans. Please try again.")
      setIsActive(false)
      setIsSpeaking(false)

      // Auto-recovery after error
      setTimeout(() => {
        if (microphoneStatus === "granted") {
          setCurrentMessage('Ready to serve you, Sir Shreeyans. Say "Hey JARVIS" or type your command.')
        } else {
          setCurrentMessage("JARVIS is ready to serve you, Sir Shreeyans. Type your next command.")
        }
      }, 3000)
    }
  }

  const handleManualActivate = () => {
    if (microphoneStatus !== "granted") {
      requestMicrophonePermission()
      return
    }

    if (!recognitionRef.current) {
      setCurrentMessage("Voice recognition not available. Please use text input, Sir Shreeyans.")
      return
    }

    if (!isActive && !isListening) {
      console.log("🎤 Manual activation requested")

      // Stop any ongoing speech first
      forceStopAudio()

      // Reset the system state first
      if (recognitionRef.current.resetSystem) {
        recognitionRef.current.resetSystem()
      }

      // Wait a moment for cleanup, then start
      setTimeout(() => {
        setIsActive(true)
        setIsListening(true)
        setCurrentMessage("Listening for your command, Sir Shreeyans...")

        // Reset abort count and start listening
        if (recognitionRef.current.resetAbortCount) {
          recognitionRef.current.resetAbortCount()
        }

        recognitionRef.current.setManualStart(true)

        if (!recognitionRef.current.isActive()) {
          startListening(recognitionRef.current)
        }
      }, 100)
    }
  }

  const handleStop = () => {
    console.log("🛑 Manual stop requested")

    // Force stop all audio
    forceStopAudio()

    setIsActive(false)
    setIsListening(false)
    setIsSpeaking(false)
    setWakeWordDetected(false)

    if (microphoneStatus === "granted") {
      setCurrentMessage('Stopped. Ready to serve you, Sir Shreeyans. Say "Hey JARVIS" or type your command.')
    } else {
      setCurrentMessage("Stopped. Ready to serve you, Sir Shreeyans. Type your command.")
    }

    if (recognitionRef.current) {
      // Reset the entire system
      if (recognitionRef.current.resetSystem) {
        recognitionRef.current.resetSystem()
      }
      stopListening(recognitionRef.current)
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch (error) {
        console.warn("Error stopping HTML audio:", error)
      }
    }
  }

  const handleTest = async () => {
    setCurrentMessage("Testing voice synthesis for Sir Shreeyans...")
    setIsSpeaking(true)

    try {
      await playAudioResponse(
        "Hello Sir Shreeyans, I am JARVIS, your AI assistant. All systems are operational, including real-time search capabilities and data storage. Ready to serve my brilliant creator.",
        {
          onStart: () => setIsSpeaking(true),
          onEnd: () => {
            setIsSpeaking(false)
            setCurrentMessage("Test complete. Ready to serve you, Sir Shreeyans.")
          },
          onError: (error) => {
            console.warn("Test speech error:", error)
            setIsSpeaking(false)
            setCurrentMessage("Test completed with minor audio issues. System is ready, Sir Shreeyans.")
          },
        },
      )
    } catch (error) {
      console.warn("Test failed:", error)
      setCurrentMessage("Test completed. Audio system may have limitations, Sir Shreeyans.")
      setIsSpeaking(false)
    }
  }

  const handleVoiceCalibration = (settings: any) => {
    setVoiceSettings(settings)

    // Update stored preferences
    jarvisStorage.updateVoiceSettings(settings)

    if (recognitionRef.current && recognitionRef.current.setConfidenceThreshold) {
      recognitionRef.current.setConfidenceThreshold(settings.confidenceThreshold)
    }
  }

  const handleTextSearch = async (query: string) => {
    setCurrentInput(query)
    await processCommand(query)
  }

  const handleCategorizedSearch = async (query: string, category: string) => {
    setCurrentInput(query)
    await processCommand(query, category)
  }

  const handleSelectFromHistory = (query: string) => {
    handleTextSearch(query)
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleTextSearch(suggestion)
  }

  const togglePhoneControls = () => {
    setShowPhoneControls(!showPhoneControls)
  }

  const toggleSearchPanel = () => {
    setShowSearchPanel(!showSearchPanel)
  }

  const toggleDataManager = () => {
    setShowDataManager(!showDataManager)
  }

  const toggleSmartSuggestions = () => {
    setShowSmartSuggestions(!showSmartSuggestions)
  }

  const handleEnableVoice = async () => {
    setShowMicrophoneHelp(false)
    await requestMicrophonePermission()
  }

  const getMicrophoneStatusIcon = () => {
    switch (microphoneStatus) {
      case "granted":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "denied":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case "checking":
        return <Mic className="w-4 h-4 text-yellow-400 animate-pulse" />
      default:
        return <Mic className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4">
            JARVIS
          </h1>
          <p className="text-xl text-cyan-300">Just A Rather Very Intelligent System</p>
          <p className="text-sm text-cyan-400 mt-2">
            Created by Sir Shreeyans Raj • Real-Time Search & Data Storage Enabled
          </p>

          {/* Owner Badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-full">
            <User className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300">Owner: Sir Shreeyans Raj</span>
          </div>
        </div>

        {/* Microphone Status */}
        <div className="mb-4 flex items-center gap-2">
          {getMicrophoneStatusIcon()}
          <span className="text-sm text-cyan-300">
            {microphoneStatus === "granted" && "Voice Ready for Sir Shreeyans"}
            {microphoneStatus === "denied" && "Voice Disabled"}
            {microphoneStatus === "checking" && "Checking Voice..."}
            {microphoneStatus === "unknown" && "Voice Unknown"}
          </span>
        </div>

        {/* Microphone Help Card */}
        {showMicrophoneHelp && (
          <Card className="mb-6 max-w-md bg-black/80 border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Enable Voice Commands for Sir Shreeyans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-yellow-200 text-sm">
                To use voice commands with JARVIS, please allow microphone access:
              </p>
              <ol className="text-cyan-200 text-sm space-y-2 list-decimal list-inside">
                <li>Click the microphone icon in your browser's address bar</li>
                <li>Select "Allow" for microphone access</li>
                <li>Click "Enable Voice" below to activate voice commands</li>
              </ol>
              <div className="flex gap-2">
                <Button onClick={handleEnableVoice} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                  <Mic className="w-4 h-4 mr-2" />
                  Enable Voice
                </Button>
                <Button
                  onClick={() => setShowMicrophoneHelp(false)}
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                >
                  Later
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Indicator */}
        <StatusIndicator
          isOnline={isOnline}
          isListening={isListening}
          isSpeaking={isSpeaking}
          wakeWordDetected={wakeWordDetected}
        />

        {/* Holographic Face */}
        <div className="my-12">
          <HolographicFace isActive={isActive} isListening={isListening} isSpeaking={isSpeaking} />
        </div>

        {/* Current Message */}
        <div className="text-center mb-8 max-w-2xl">
          <p className="text-lg text-cyan-200 min-h-[2rem]">{currentMessage}</p>
        </div>

        {/* Control Buttons Row */}
        <div className="flex gap-4 mb-4 flex-wrap justify-center">
          <Button
            onClick={toggleSmartSuggestions}
            variant="outline"
            size="sm"
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Smart Suggestions
          </Button>

          <Button
            onClick={toggleSearchPanel}
            variant="outline"
            size="sm"
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
          >
            <Search className="w-4 h-4 mr-2" />
            Real-Time Search
          </Button>

          <Button
            onClick={togglePhoneControls}
            variant="outline"
            size="sm"
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Phone Controls
          </Button>

          <Button
            onClick={toggleDataManager}
            variant="outline"
            size="sm"
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
          >
            <Database className="w-4 h-4 mr-2" />
            Data Manager
          </Button>
        </div>

        {/* Smart Suggestions Panel */}
        {showSmartSuggestions && (
          <div className="mb-4">
            <SmartSuggestions
              onSuggestionClick={handleSuggestionClick}
              currentInput={currentInput}
              isVisible={showSmartSuggestions}
              onClose={toggleSmartSuggestions}
            />
          </div>
        )}

        {/* Search Panel (conditionally rendered) */}
        {showSearchPanel && (
          <div className="mb-4">
            <SearchPanel onClose={toggleSearchPanel} onSearch={handleCategorizedSearch} />
          </div>
        )}

        {/* Phone Control Panel (conditionally rendered) */}
        {showPhoneControls && (
          <div className="mb-4">
            <PhoneControlPanel onClose={togglePhoneControls} />
          </div>
        )}

        {/* Data Manager Panel */}
        {showDataManager && (
          <div className="mb-4">
            <DataManager onClose={toggleDataManager} />
          </div>
        )}

        {/* Voice Calibration - only show if microphone is granted */}
        {microphoneStatus === "granted" && (
          <div className="mb-4">
            <VoiceCalibration onCalibrationChange={handleVoiceCalibration} />
          </div>
        )}

        {/* Search History */}
        <div className="mb-4">
          <SearchHistory ref={searchHistoryRef} onSelectQuery={handleSelectFromHistory} />
        </div>

        {/* Controls Panel */}
        <ControlsPanel
          onActivate={handleManualActivate}
          onStop={handleStop}
          onTest={handleTest}
          onTextSearch={handleTextSearch}
          isActive={isActive}
          isListening={isListening}
          isSpeaking={isSpeaking}
          microphoneStatus={microphoneStatus}
          onRequestMicrophone={requestMicrophonePermission}
        />

        {/* Footer */}
        <div className="absolute bottom-4 text-center text-sm text-cyan-400">
          <p>
            {microphoneStatus === "granted"
              ? 'Say "Hey JARVIS" to activate voice commands or type your question above, Sir Shreeyans'
              : "Type your questions above, explore real-time search, or enable voice commands, Sir Shreeyans"}
          </p>
        </div>
      </div>

      {/* Audio element for playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
