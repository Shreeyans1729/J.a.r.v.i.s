"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhoneActions } from "@/lib/phone-bridge"
import {
  Phone,
  MessageSquare,
  Music,
  Video,
  Camera,
  Flashlight,
  Wifi,
  Bluetooth,
  Bell,
  Map,
  Settings,
  X,
  Smartphone,
} from "lucide-react"

interface PhoneControlPanelProps {
  onClose: () => void
}

export function PhoneControlPanel({ onClose }: PhoneControlPanelProps) {
  const [activeTab, setActiveTab] = useState("communication")
  const [status, setStatus] = useState<string | null>(null)

  const handleAction = async (action: string, params: any = {}) => {
    setStatus(`Executing: ${action}...`)

    try {
      // Get the appropriate action function
      const actionFunction = getActionFunction(action, params)
      if (actionFunction) {
        await actionFunction()
        setStatus(`${action} executed successfully!`)
      } else {
        setStatus(`Unknown action: ${action}`)
      }
    } catch (error) {
      console.error("Error executing action:", error)
      setStatus(`Error: ${(error as Error).message}`)
    }

    // Clear status after 3 seconds
    setTimeout(() => {
      setStatus(null)
    }, 3000)
  }

  const getActionFunction = (action: string, params: any) => {
    switch (action) {
      case "call":
        return () => PhoneActions.call(params.contact || "Contact")
      case "message":
        return () => PhoneActions.sendMessage(params.contact || "Contact", params.text || "Hello")
      case "playMusic":
        return () => PhoneActions.playMusic(params.query)
      case "openApp":
        return () => PhoneActions.openApp(params.appName)
      case "toggleFlashlight":
        return () => PhoneActions.toggleFlashlight(params.state || "on")
      case "toggleWifi":
        return () => PhoneActions.toggleSetting("wifi", params.state || "on")
      case "toggleBluetooth":
        return () => PhoneActions.toggleSetting("bluetooth", params.state || "on")
      case "toggleSilent":
        return () => PhoneActions.toggleSetting("silentMode", params.state || "on")
      case "screenshot":
        return () => PhoneActions.takeScreenshot()
      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-md bg-black/80 border-cyan-500/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Phone Control Panel
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
      <CardContent>
        <Tabs defaultValue="communication" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="communication">
              <Phone className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="media">
              <Music className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="system">
              <Settings className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="utilities">
              <Flashlight className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="communication" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleAction("call", { contact: "Contact" })}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Phone className="w-6 h-6 mb-1 text-cyan-400" />
                <span>Call</span>
              </Button>
              <Button
                onClick={() => handleAction("message", { contact: "Contact", text: "Hello" })}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <MessageSquare className="w-6 h-6 mb-1 text-cyan-400" />
                <span>Message</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleAction("playMusic")}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Music className="w-6 h-6 mb-1 text-cyan-400" />
                <span>Play Music</span>
              </Button>
              <Button
                onClick={() => handleAction("openApp", { appName: "camera" })}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Camera className="w-6 h-6 mb-1 text-cyan-400" />
                <span>Camera</span>
              </Button>
              <Button
                onClick={() => handleAction("openApp", { appName: "video" })}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Video className="w-6 h-6 mb-1 text-cyan-400" />
                <span>Video</span>
              </Button>
              <Button
                onClick={() => handleAction("openApp", { appName: "maps" })}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Map className="w-6 h-6 mb-1 text-cyan-400" />
                <span>Maps</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleAction("toggleWifi", { state: "on" })}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Wifi className="w-6 h-6 mb-1 text-cyan-400" />
                <span>WiFi On</span>
              </Button>
              <Button
                onClick={() => handleAction("toggleWifi", { state: "off" })}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Wifi className="w-6 h-6 mb-1 text-red-400" />
                <span>WiFi Off</span>
              </Button>
              <Button
                onClick={() => handleAction("toggleBluetooth", { state: "on" })}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Bluetooth className="w-6 h-6 mb-1 text-cyan-400" />
                <span>BT On</span>
              </Button>
              <Button
                onClick={() => handleAction("toggleBluetooth", { state: "off" })}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Bluetooth className="w-6 h-6 mb-1 text-red-400" />
                <span>BT Off</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="utilities" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleAction("toggleFlashlight", { state: "on" })}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Flashlight className="w-6 h-6 mb-1 text-cyan-400" />
                <span>Flashlight On</span>
              </Button>
              <Button
                onClick={() => handleAction("toggleFlashlight", { state: "off" })}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Flashlight className="w-6 h-6 mb-1 text-red-400" />
                <span>Flashlight Off</span>
              </Button>
              <Button
                onClick={() => handleAction("toggleSilent", { state: "on" })}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Bell className="w-6 h-6 mb-1 text-cyan-400" />
                <span>Silent Mode</span>
              </Button>
              <Button
                onClick={() => handleAction("screenshot")}
                variant="outline"
                className="flex flex-col items-center justify-center h-20 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                <Smartphone className="w-6 h-6 mb-1 text-cyan-400" />
                <span>Screenshot</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {status && (
          <div className="mt-4 p-2 bg-cyan-900/20 border border-cyan-500/30 rounded text-center">
            <p className="text-cyan-300 text-sm">{status}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
