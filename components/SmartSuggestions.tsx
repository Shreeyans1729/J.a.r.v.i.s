"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { jarvisStorage } from "@/lib/storage"
import { Lightbulb, Clock, TrendingUp, X, Zap } from "lucide-react"

interface SmartSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void
  currentInput?: string
  isVisible: boolean
  onClose: () => void
}

export function SmartSuggestions({ onSuggestionClick, currentInput, isVisible, onClose }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [contextualSuggestions, setContextualSuggestions] = useState<{
    recent: string[]
    frequent: string[]
    timeBased: string[]
  }>({
    recent: [],
    frequent: [],
    timeBased: [],
  })

  useEffect(() => {
    if (isVisible) {
      loadSuggestions()
    }
  }, [isVisible, currentInput])

  const loadSuggestions = () => {
    try {
      // Get contextual suggestions
      const allSuggestions = jarvisStorage.getContextualSuggestions(currentInput)
      setSuggestions(allSuggestions)

      // Get categorized suggestions
      const conversations = jarvisStorage.getConversations(20)
      const preferences = jarvisStorage.getPreferences()

      // Recent successful commands
      const recent = conversations
        .filter((conv) => conv.jarvisResponse && !conv.jarvisResponse.includes("error"))
        .slice(0, 5)
        .map((conv) => conv.userInput)

      // Frequent commands
      const frequent = preferences.personalInfo.frequentCommands.slice(0, 5)

      // Time-based suggestions
      const hour = new Date().getHours()
      let timeBased: string[] = []

      if (hour >= 6 && hour < 12) {
        timeBased = [
          "Good morning JARVIS",
          "What's the weather today?",
          "Check my schedule",
          "Latest news headlines",
          "Set a reminder for today",
        ]
      } else if (hour >= 12 && hour < 18) {
        timeBased = [
          "What's the latest news?",
          "Set a reminder",
          "Play some music",
          "Check my messages",
          "Search for restaurants near me",
        ]
      } else {
        timeBased = [
          "Good evening JARVIS",
          "How was my day?",
          "Set an alarm for tomorrow",
          "Play relaxing music",
          "Check tomorrow's weather",
        ]
      }

      setContextualSuggestions({
        recent: [...new Set(recent)],
        frequent: [...new Set(frequent)],
        timeBased,
      })
    } catch (error) {
      console.error("Error loading suggestions:", error)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionClick(suggestion)
    onClose()
  }

  if (!isVisible) return null

  return (
    <Card className="w-full max-w-2xl bg-black/80 border-cyan-500/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Smart Suggestions for Sir Shreeyans
        </CardTitle>
        <Button
          onClick={onClose}
          variant="outline"
          size="sm"
          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
        >
          <X className="w-3 h-3" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time-based suggestions */}
        {contextualSuggestions.timeBased.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-cyan-300">Right Now</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {contextualSuggestions.timeBased.slice(0, 4).map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                  <Zap className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recent successful commands */}
        {contextualSuggestions.recent.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-green-300">Recent Successes</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {contextualSuggestions.recent.slice(0, 4).map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer border-green-500/30 text-green-300 hover:bg-green-500/10 hover:border-green-400 transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.length > 30 ? `${suggestion.substring(0, 30)}...` : suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Frequent commands */}
        {contextualSuggestions.frequent.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-yellow-300">Your Favorites</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {contextualSuggestions.frequent.slice(0, 4).map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10 hover:border-yellow-400 transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.length > 30 ? `${suggestion.substring(0, 30)}...` : suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-purple-300">Quick Actions</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              "Turn on flashlight",
              "Play music",
              "Check weather",
              "Set 5 minute timer",
              "Take a screenshot",
              "Open camera",
            ].map((suggestion, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400 transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>

        {/* Filtered suggestions based on current input */}
        {currentInput && currentInput.length > 2 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-cyan-300">Matching Commands</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions
                .filter((s) => s.toLowerCase().includes(currentInput.toLowerCase()))
                .slice(0, 6)
                .map((suggestion, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-colors"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion.length > 40 ? `${suggestion.substring(0, 40)}...` : suggestion}
                  </Badge>
                ))}
            </div>
          </div>
        )}

        <div className="text-xs text-cyan-400 text-center pt-2 border-t border-cyan-500/20">
          💡 Suggestions are personalized based on your usage patterns and current time
        </div>
      </CardContent>
    </Card>
  )
}
