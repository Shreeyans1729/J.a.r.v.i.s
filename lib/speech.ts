interface SpeechRecognitionOptions {
  onWakeWord: () => void
  onSpeechResult: (transcript: string) => void
  onError: (error: string) => void
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function initializeSpeechRecognition(options: SpeechRecognitionOptions): any | null {
  if (typeof window === "undefined") {
    console.error("Speech recognition not available - not in browser environment")
    return null
  }

  // Check for speech recognition support
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    console.error("Speech recognition not supported in this browser")
    options.onError("Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.")
    return null
  }

  console.log("Initializing speech recognition...")

  const recognition = new SpeechRecognition()

  // Enhanced configuration for better stability
  recognition.continuous = false
  recognition.interimResults = false
  recognition.lang = "en-US"
  recognition.maxAlternatives = 1

  let isWakeWordMode = true
  let speechTimeout: any
  let isRecognitionActive = false
  let restartTimeout: any
  let isManuallyStarted = false
  let abortCount = 0
  let lastStartTime = 0

  // State management methods
  recognition.isActive = () => isRecognitionActive
  recognition.setManualStart = (manual: boolean) => {
    isManuallyStarted = manual
  }

  recognition.onstart = () => {
    isRecognitionActive = true
    lastStartTime = Date.now()
    abortCount = 0 // Reset abort count on successful start
    console.log("✅ Speech recognition started successfully")
  }

  recognition.onresult = (event: any) => {
    console.log("🎤 Speech result received")

    if (event.results && event.results.length > 0) {
      const result = event.results[0]
      if (result && result[0]) {
        const transcript = result[0].transcript.toLowerCase().trim()
        const confidence = result[0].confidence || 1

        console.log(`📝 Transcript: "${transcript}" (confidence: ${confidence})`)

        if (transcript.length === 0) {
          console.log("Empty transcript, ignoring...")
          return
        }

        if (isWakeWordMode) {
          // Check for wake word with multiple variations
          const wakeWords = [
            "hey jarvis",
            "jarvis",
            "hey javis",
            "jarvis wake up",
            "ok jarvis",
            "hello jarvis",
            "hi jarvis",
            "wake up jarvis",
          ]

          const hasWakeWord = wakeWords.some(
            (word) => transcript.includes(word) || transcript.replace(/[^a-z\s]/g, "").includes(word),
          )

          if (hasWakeWord) {
            console.log("🎯 Wake word detected!")
            isWakeWordMode = false
            options.onWakeWord()

            // Clear any existing timeout
            if (speechTimeout) clearTimeout(speechTimeout)

            // Set timeout to return to wake word mode
            speechTimeout = setTimeout(() => {
              console.log("⏰ Returning to wake word mode")
              isWakeWordMode = true
            }, 15000)
          } else {
            console.log("❌ No wake word detected, continuing to listen...")
          }
        } else {
          // Process command
          console.log("🎯 Processing command:", transcript)
          options.onSpeechResult(transcript)
          isWakeWordMode = true
          if (speechTimeout) clearTimeout(speechTimeout)
        }
      }
    }
  }

  recognition.onerror = (event: any) => {
    console.error("❌ Speech recognition error:", event.error)
    isRecognitionActive = false

    let errorMessage = ""
    let shouldRestart = false
    let restartDelay = 1000

    switch (event.error) {
      case "network":
        errorMessage = "Network error. Please check your internet connection."
        shouldRestart = true
        restartDelay = 3000
        break
      case "not-allowed":
        errorMessage = "Microphone access denied. Please allow microphone permissions to use voice commands."
        shouldRestart = false
        break
      case "no-speech":
        console.log("No speech detected, will restart...")
        errorMessage = "" // Don't show error for no speech
        shouldRestart = true
        restartDelay = 500
        break
      case "audio-capture":
        errorMessage = "Audio capture error. Please check your microphone connection."
        shouldRestart = false // Don't auto-restart on hardware issues
        break
      case "service-not-allowed":
        errorMessage = "Speech service not allowed. Please check your browser settings and allow microphone access."
        shouldRestart = false
        break
      case "aborted":
        console.log("Speech recognition was aborted")
        abortCount++

        // Handle different abort scenarios
        if (abortCount === 1) {
          console.log("First abort - likely browser optimization, restarting immediately...")
          errorMessage = ""
          shouldRestart = true
          restartDelay = 100
        } else if (abortCount === 2) {
          console.log("Second abort - trying with longer delay...")
          errorMessage = ""
          shouldRestart = true
          restartDelay = 1000
        } else if (abortCount === 3) {
          console.log("Third abort - trying with much longer delay...")
          errorMessage = ""
          shouldRestart = true
          restartDelay = 3000
        } else if (abortCount < 6) {
          console.log(`Abort #${abortCount} - continuing with exponential backoff...`)
          errorMessage = ""
          shouldRestart = true
          restartDelay = Math.min(5000, 1000 * Math.pow(2, abortCount - 3))
        } else {
          console.log("Too many aborts - switching to manual mode")
          errorMessage = "Voice recognition keeps getting interrupted. Please use manual activation or text input."
          shouldRestart = false
          abortCount = 0 // Reset for next manual attempt
        }
        break
      case "language-not-supported":
        errorMessage = "Language not supported. Switching to default settings."
        shouldRestart = true
        restartDelay = 1000
        break
      default:
        console.log(`Unknown error: ${event.error}`)
        errorMessage = `Recognition error: ${event.error}. Please try manual activation.`
        shouldRestart = false // Don't auto-restart on unknown errors
    }

    // Only show error message if it's not empty and not too many aborts
    if (errorMessage && abortCount < 6) {
      options.onError(errorMessage)
    }

    isWakeWordMode = true

    // Clear any existing restart timeout
    if (restartTimeout) {
      clearTimeout(restartTimeout)
      restartTimeout = null
    }

    // Attempt restart if appropriate
    if (shouldRestart && !isManuallyStarted && abortCount < 10) {
      const timeSinceStart = Date.now() - lastStartTime

      // Use longer delay if recognition failed very quickly
      if (timeSinceStart < 500) {
        restartDelay = Math.max(restartDelay, 2000)
      }

      console.log(`Scheduling restart in ${restartDelay}ms (abort count: ${abortCount})`)

      restartTimeout = setTimeout(() => {
        if (!isRecognitionActive && isWakeWordMode) {
          console.log(`🔄 Auto-restarting after ${event.error} (attempt ${abortCount})...`)
          try {
            recognition.start()
          } catch (startError) {
            console.error("Failed to restart after error:", startError)
            // Don't try again automatically on permission errors
            if (startError.toString().includes("not-allowed")) {
              options.onError("Microphone permission was revoked. Please refresh the page and allow microphone access.")
            }
          }
        }
      }, restartDelay)
    }
  }

  recognition.onend = () => {
    console.log("🔄 Speech recognition ended")
    isRecognitionActive = false

    // Auto-restart for continuous listening (only in wake word mode and not manually stopped)
    if (isWakeWordMode && !isManuallyStarted && abortCount < 6) {
      if (restartTimeout) {
        clearTimeout(restartTimeout)
        restartTimeout = null
      }

      const timeSinceStart = Date.now() - lastStartTime
      let delay = 1000

      // Use longer delay if it ended very quickly (likely an error)
      if (timeSinceStart < 1000) {
        delay = 2000
        console.log("Recognition ended quickly, using longer restart delay")
      }

      // Exponential backoff for multiple quick restarts
      if (abortCount > 0) {
        delay = Math.min(5000, delay * Math.pow(1.5, abortCount))
      }

      console.log(`Scheduling restart in ${delay}ms`)

      restartTimeout = setTimeout(() => {
        if (!isRecognitionActive && isWakeWordMode && abortCount < 6) {
          console.log("🔄 Auto-restarting recognition...")
          try {
            recognition.start()
          } catch (error) {
            console.error("Failed to auto-restart:", error)
            // Don't show error for permission issues during auto-restart
            if (!error.toString().includes("not-allowed")) {
              abortCount++
            }
          }
        }
      }, delay)
    }
  }

  // Enhanced control methods
  recognition.forceStart = () => {
    if (!isRecognitionActive) {
      try {
        console.log("🚀 Force starting recognition...")
        abortCount = 0 // Reset abort count on manual start
        recognition.start()
      } catch (error) {
        console.error("Failed to force start:", error)
        if (error.toString().includes("not-allowed")) {
          options.onError("Microphone access denied. Please allow microphone permissions and try again.")
        } else {
          options.onError("Failed to start speech recognition. Please try again.")
        }
      }
    } else {
      console.log("Recognition already active")
    }
  }

  recognition.forceStop = () => {
    console.log("🛑 Force stopping recognition...")
    if (restartTimeout) clearTimeout(restartTimeout)
    if (speechTimeout) clearTimeout(speechTimeout)

    isManuallyStarted = false
    abortCount = 0

    try {
      if (isRecognitionActive) {
        recognition.stop()
      }
    } catch (error) {
      console.error("Error stopping recognition:", error)
    }

    isRecognitionActive = false
    isWakeWordMode = true
  }

  // Reset abort count method
  recognition.resetAbortCount = () => {
    abortCount = 0
  }

  // Reset system state method
  recognition.resetSystem = () => {
    console.log("🔄 Resetting speech recognition system...")

    // Clear all timeouts
    if (restartTimeout) {
      clearTimeout(restartTimeout)
      restartTimeout = null
    }
    if (speechTimeout) {
      clearTimeout(speechTimeout)
      speechTimeout = null
    }

    // Reset all state variables
    abortCount = 0
    isManuallyStarted = false
    isWakeWordMode = true
    isRecognitionActive = false

    // Stop current recognition if active
    try {
      if (recognition) {
        recognition.stop()
      }
    } catch (error) {
      console.log("Error stopping recognition during reset:", error)
    }

    console.log("✅ Speech recognition system reset complete")
  }

  // Don't auto-start recognition - wait for explicit permission
  console.log("🎬 Speech recognition initialized, waiting for permission...")

  return recognition
}

export function startListening(recognition: any | null) {
  if (!recognition) {
    console.error("No recognition instance available")
    return
  }

  console.log("🎤 Manual start listening requested")
  recognition.setManualStart(true)
  recognition.resetAbortCount() // Reset abort count on manual start

  if (!recognition.isActive()) {
    recognition.forceStart()
  } else {
    console.log("Recognition already active")
  }
}

export function stopListening(recognition: any | null) {
  if (!recognition) {
    console.error("No recognition instance available")
    return
  }

  console.log("🛑 Manual stop listening requested")
  recognition.setManualStart(false)
  recognition.forceStop()
}
