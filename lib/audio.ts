interface AudioOptions {
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

// Global state to track speech synthesis
let currentUtterance: SpeechSynthesisUtterance | null = null
let isCurrentlySpeaking = false

export async function playAudioResponse(text: string, options: AudioOptions = {}) {
  try {
    // Stop any existing speech first
    stopAudio()

    options.onStart?.()

    // Try ElevenLabs first
    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        return new Promise<void>((resolve, reject) => {
          const audio = new Audio(audioUrl)
          let hasCompleted = false

          const cleanup = () => {
            if (!hasCompleted) {
              hasCompleted = true
              URL.revokeObjectURL(audioUrl)
              isCurrentlySpeaking = false
              options.onEnd?.()
            }
          }

          audio.onended = () => {
            cleanup()
            resolve()
          }

          audio.onerror = (event) => {
            cleanup()
            console.warn("ElevenLabs audio playback failed, falling back to browser TTS:", event)
            // Fall back to browser TTS instead of rejecting
            fallbackToSpeechSynthesis(text, options).then(resolve).catch(reject)
          }

          // Set a timeout to prevent hanging
          const timeout = setTimeout(() => {
            if (!hasCompleted) {
              console.warn("ElevenLabs audio timeout, falling back to browser TTS")
              audio.pause()
              cleanup()
              fallbackToSpeechSynthesis(text, options).then(resolve).catch(reject)
            }
          }, 30000)

          audio.onended = () => {
            clearTimeout(timeout)
            cleanup()
            resolve()
          }

          isCurrentlySpeaking = true
          audio.play().catch((playError) => {
            clearTimeout(timeout)
            console.warn("ElevenLabs audio play failed:", playError)
            cleanup()
            fallbackToSpeechSynthesis(text, options).then(resolve).catch(reject)
          })
        })
      }
    } catch (elevenlabsError) {
      console.warn("ElevenLabs failed, using browser TTS:", elevenlabsError)
    }

    // Fallback to browser Speech Synthesis
    return fallbackToSpeechSynthesis(text, options)
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Unknown audio error")
    options.onError?.(err)
    throw err
  }
}

// Enhanced browser speech synthesis with better interruption handling
async function fallbackToSpeechSynthesis(text: string, options: AudioOptions = {}): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error("Speech synthesis not supported"))
      return
    }

    // Cancel any existing speech
    if (currentUtterance) {
      speechSynthesis.cancel()
      currentUtterance = null
    }

    // Wait a moment for cleanup
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text)
      currentUtterance = utterance
      let hasCompleted = false

      const cleanup = (wasSuccessful = true) => {
        if (!hasCompleted) {
          hasCompleted = true
          currentUtterance = null
          isCurrentlySpeaking = false
          if (wasSuccessful) {
            options.onEnd?.()
          }
        }
      }

      // Configure voice settings
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0

      // Try to use a more natural voice
      const voices = speechSynthesis.getVoices()
      const preferredVoice = voices.find(
        (voice) =>
          voice.name.includes("Google") ||
          voice.name.includes("Microsoft") ||
          voice.name.includes("Samantha") ||
          voice.name.includes("Daniel") ||
          voice.lang.startsWith("en"),
      )

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      // Enhanced event handlers
      utterance.onstart = () => {
        console.log("🔊 Speech synthesis started")
        isCurrentlySpeaking = true
      }

      utterance.onend = () => {
        console.log("🔇 Speech synthesis ended normally")
        cleanup(true)
        resolve()
      }

      utterance.onerror = (event) => {
        console.log(`🔊 Speech synthesis event: ${event.error}`)

        // Handle different error types gracefully
        switch (event.error) {
          case "interrupted":
          case "canceled":
            // These are normal user actions, not errors
            console.log("Speech was interrupted/canceled - this is normal")
            cleanup(true)
            resolve() // Resolve successfully
            break

          case "network":
            console.warn("Network error in speech synthesis")
            cleanup(false)
            reject(new Error("Network error during speech synthesis"))
            break

          case "synthesis-failed":
          case "synthesis-unavailable":
            console.warn("Speech synthesis failed")
            cleanup(false)
            reject(new Error("Speech synthesis failed"))
            break

          case "audio-busy":
            console.warn("Audio system busy")
            cleanup(false)
            // Retry after a short delay
            setTimeout(() => {
              fallbackToSpeechSynthesis(text, options).then(resolve).catch(reject)
            }, 500)
            break

          case "not-allowed":
            console.warn("Speech synthesis not allowed")
            cleanup(false)
            reject(new Error("Speech synthesis not allowed"))
            break

          default:
            // For unknown errors, log but don't fail the entire operation
            console.warn(`Unknown speech synthesis error: ${event.error}`)
            cleanup(true)
            resolve() // Still resolve to prevent breaking the flow
            break
        }
      }

      // Set a reasonable timeout
      const timeout = setTimeout(() => {
        if (!hasCompleted && currentUtterance === utterance) {
          console.warn("Speech synthesis timeout")
          speechSynthesis.cancel()
          cleanup(true)
          resolve() // Don't treat timeout as an error
        }
      }, 15000)

      utterance.onend = () => {
        clearTimeout(timeout)
        cleanup(true)
        resolve()
      }

      utterance.onerror = (event) => {
        clearTimeout(timeout)

        // Handle errors as described above
        switch (event.error) {
          case "interrupted":
          case "canceled":
            cleanup(true)
            resolve()
            break
          default:
            console.warn(`Speech error: ${event.error}`)
            cleanup(true)
            resolve() // Don't propagate most errors
            break
        }
      }

      try {
        isCurrentlySpeaking = true
        speechSynthesis.speak(utterance)
      } catch (speakError) {
        clearTimeout(timeout)
        console.error("Failed to start speech synthesis:", speakError)
        cleanup(false)
        reject(new Error("Failed to start speech synthesis"))
      }
    }, 100) // Small delay to ensure cleanup
  })
}

// Enhanced stop function
export function stopAudio() {
  try {
    // Stop speech synthesis
    if (window.speechSynthesis) {
      speechSynthesis.cancel()
    }

    // Clear current utterance
    if (currentUtterance) {
      currentUtterance = null
    }

    // Reset state
    isCurrentlySpeaking = false

    // Stop any HTML5 audio elements
    const audioElements = document.querySelectorAll("audio")
    audioElements.forEach((audio) => {
      try {
        if (!audio.paused) {
          audio.pause()
          audio.currentTime = 0
        }
      } catch (error) {
        console.warn("Error stopping audio element:", error)
      }
    })
  } catch (error) {
    console.warn("Error in stopAudio:", error)
  }
}

// Check if currently speaking
export function isSpeaking(): boolean {
  return isCurrentlySpeaking || (window.speechSynthesis && speechSynthesis.speaking)
}

// Force stop with cleanup
export function forceStopAudio() {
  try {
    stopAudio()

    // Additional cleanup for stubborn browsers
    if (window.speechSynthesis) {
      speechSynthesis.cancel()

      // Some browsers need multiple cancel calls
      setTimeout(() => {
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel()
        }
      }, 100)
    }
  } catch (error) {
    console.warn("Error in forceStopAudio:", error)
  }
}
