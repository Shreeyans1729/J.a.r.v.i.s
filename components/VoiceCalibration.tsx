"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Mic, Settings } from "lucide-react"

interface VoiceCalibrationProps {
  onCalibrationChange: (settings: VoiceSettings) => void
}

interface VoiceSettings {
  confidenceThreshold: number
  noiseReduction: boolean
  microphoneSensitivity: number
}

export function VoiceCalibration({ onCalibrationChange }: VoiceCalibrationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<VoiceSettings>({
    confidenceThreshold: 0.7,
    noiseReduction: true,
    microphoneSensitivity: 0.8,
  })

  const handleSettingChange = (key: keyof VoiceSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    onCalibrationChange(newSettings)
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
      >
        <Settings className="w-4 h-4 mr-2" />
        Voice Settings
      </Button>
    )
  }

  return (
    <Card className="w-full max-w-md bg-black/80 border-cyan-500/30">
      <CardHeader>
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Calibration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm text-cyan-300 mb-2 block">
            Recognition Confidence: {Math.round(settings.confidenceThreshold * 100)}%
          </label>
          <Slider
            value={[settings.confidenceThreshold]}
            onValueChange={([value]) => handleSettingChange("confidenceThreshold", value)}
            max={1}
            min={0.3}
            step={0.1}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm text-cyan-300 mb-2 block">
            Microphone Sensitivity: {Math.round(settings.microphoneSensitivity * 100)}%
          </label>
          <Slider
            value={[settings.microphoneSensitivity]}
            onValueChange={([value]) => handleSettingChange("microphoneSensitivity", value)}
            max={1}
            min={0.3}
            step={0.1}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-cyan-300">Noise Reduction</label>
          <Button
            onClick={() => handleSettingChange("noiseReduction", !settings.noiseReduction)}
            variant={settings.noiseReduction ? "default" : "outline"}
            size="sm"
            className={settings.noiseReduction ? "bg-cyan-600" : "border-cyan-500 text-cyan-400"}
          >
            {settings.noiseReduction ? "ON" : "OFF"}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setIsOpen(false)} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
            Apply Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
