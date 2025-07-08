"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { jarvisStorage, formatStorageSize, getStorageHealth } from "@/lib/storage"
import {
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  BarChart3,
  History,
  Settings,
  X,
  FileText,
  Clock,
  TrendingUp,
} from "lucide-react"

interface DataManagerProps {
  onClose: () => void
}

export function DataManager({ onClose }: DataManagerProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [analytics, setAnalytics] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [preferences, setPreferences] = useState<any>(null)
  const [storageSize, setStorageSize] = useState("")
  const [storageHealth, setStorageHealth] = useState<"good" | "warning" | "critical">("good")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    try {
      setAnalytics(jarvisStorage.getUsageAnalytics())
      setConversations(jarvisStorage.getConversations(50))
      setPreferences(jarvisStorage.getPreferences())
      setStorageSize(formatStorageSize())
      setStorageHealth(getStorageHealth())
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const handleExportData = () => {
    try {
      const data = jarvisStorage.exportData()
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `jarvis-data-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    }
  }

  const handleImportData = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = e.target?.result as string
            if (jarvisStorage.importData(data)) {
              alert("Data imported successfully!")
              loadData()
            } else {
              alert("Import failed. Please check the file format.")
            }
          } catch (error) {
            alert("Import failed. Invalid file format.")
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  const handleClearData = () => {
    if (confirm("Are you sure you want to clear all JARVIS data? This action cannot be undone.")) {
      jarvisStorage.clearAllData()
      alert("All data cleared successfully.")
      loadData()
    }
  }

  const handleResetSettings = () => {
    if (confirm("Reset all settings to default values?")) {
      jarvisStorage.resetToDefaults()
      alert("Settings reset to defaults.")
      loadData()
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "good":
        return "text-green-400 bg-green-400/20"
      case "warning":
        return "text-yellow-400 bg-yellow-400/20"
      case "critical":
        return "text-red-400 bg-red-400/20"
      default:
        return "text-gray-400 bg-gray-400/20"
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString()
  }

  return (
    <Card className="w-full max-w-4xl bg-black/80 border-cyan-500/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <Database className="w-5 h-5" />
          JARVIS Data Manager
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
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="manage">
              <Database className="w-4 h-4 mr-2" />
              Manage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Storage Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-black/40 border-cyan-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-300">Storage Health</p>
                      <Badge className={`mt-1 ${getHealthColor(storageHealth)}`}>{storageHealth.toUpperCase()}</Badge>
                    </div>
                    <Database className="w-8 h-8 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-cyan-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-300">Data Size</p>
                      <p className="text-lg font-bold text-cyan-200">{storageSize}</p>
                    </div>
                    <FileText className="w-8 h-8 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-cyan-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-300">Total Interactions</p>
                      <p className="text-lg font-bold text-cyan-200">{analytics?.totalConversations || 0}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-cyan-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-black/40 border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300 text-sm">Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-cyan-300">Success Rate</span>
                        <span className="text-cyan-200">{analytics.successRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={analytics.successRate} className="mt-1" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span className="text-cyan-300">Voice Recognition</span>
                        <span className="text-cyan-200">{analytics.voiceRecognitionAccuracy.toFixed(1)}%</span>
                      </div>
                      <Progress value={analytics.voiceRecognitionAccuracy} className="mt-1" />
                    </div>
                    <div>
                      <span className="text-sm text-cyan-300">Avg Response Time</span>
                      <p className="text-cyan-200">{analytics.averageResponseTime.toFixed(0)}ms</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300 text-sm">Usage Patterns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-cyan-300 mb-2">Most Used Categories</p>
                      {analytics.mostUsedCategories.slice(0, 3).map((category: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-cyan-200 capitalize">{category.category}</span>
                          <span className="text-cyan-400">{category.count}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm text-cyan-300 mb-2">Most Active Hours</p>
                      {analytics.mostActiveHours.slice(0, 3).map((hour: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-cyan-200">{hour.hour}:00</span>
                          <span className="text-cyan-400">{hour.count} interactions</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-cyan-300">Recent Conversations</h3>
              <Badge variant="outline" className="border-cyan-500/50 text-cyan-400">
                {conversations.length} entries
              </Badge>
            </div>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {conversations.map((conv, index) => (
                  <Card key={index} className="bg-black/40 border-cyan-500/20">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs text-cyan-300">{formatDate(conv.timestamp)}</span>
                        </div>
                        <div className="flex gap-1">
                          {conv.searchUsed && (
                            <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
                              Search
                            </Badge>
                          )}
                          {conv.phoneControlUsed && (
                            <Badge variant="outline" className="text-xs border-green-500/50 text-green-400">
                              Phone
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-cyan-200">
                          <strong>You:</strong> {conv.userInput}
                        </p>
                        <p className="text-sm text-cyan-300">
                          <strong>JARVIS:</strong> {conv.jarvisResponse.substring(0, 100)}
                          {conv.jarvisResponse.length > 100 && "..."}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-xs text-cyan-400">
                        <span>Response: {conv.responseTime}ms</span>
                        {conv.searchCategory && <span>Category: {conv.searchCategory}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {preferences && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-black/40 border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300 text-sm">Voice Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Confidence Threshold</span>
                      <span className="text-cyan-200">
                        {(preferences.voiceSettings.confidenceThreshold * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Noise Reduction</span>
                      <span className="text-cyan-200">{preferences.voiceSettings.noiseReduction ? "ON" : "OFF"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Microphone Sensitivity</span>
                      <span className="text-cyan-200">
                        {(preferences.voiceSettings.microphoneSensitivity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300 text-sm">Search Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Default Category</span>
                      <span className="text-cyan-200 capitalize">{preferences.searchPreferences.defaultCategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Max Results</span>
                      <span className="text-cyan-200">{preferences.searchPreferences.maxResults}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Auto Search</span>
                      <span className="text-cyan-200">
                        {preferences.searchPreferences.enableAutoSearch ? "ON" : "OFF"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300 text-sm">Personal Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Name</span>
                      <span className="text-cyan-200">{preferences.personalInfo.name}</span>
                    </div>
                    <div>
                      <span className="text-cyan-300">Interests</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {preferences.personalInfo.interests.map((interest: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 border-cyan-500/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-300 text-sm">UI Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Theme</span>
                      <span className="text-cyan-200 capitalize">{preferences.uiPreferences.theme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Animations</span>
                      <span className="text-cyan-200">{preferences.uiPreferences.enableAnimations ? "ON" : "OFF"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Advanced Controls</span>
                      <span className="text-cyan-200">
                        {preferences.uiPreferences.showAdvancedControls ? "ON" : "OFF"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-black/40 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-cyan-300 text-sm">Data Export/Import</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={handleExportData} className="w-full bg-cyan-600 hover:bg-cyan-700">
                    <Download className="w-4 h-4 mr-2" />
                    Export All Data
                  </Button>
                  <Button
                    onClick={handleImportData}
                    variant="outline"
                    className="w-full border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-cyan-500/20">
                <CardHeader>
                  <CardTitle className="text-cyan-300 text-sm">System Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={handleResetSettings}
                    variant="outline"
                    className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 bg-transparent"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Settings
                  </Button>
                  <Button
                    onClick={handleClearData}
                    variant="outline"
                    className="w-full border-red-500 text-red-400 hover:bg-red-500/10 bg-transparent"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-black/40 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-cyan-300 text-sm">Storage Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-cyan-300">Conversations</p>
                    <p className="text-cyan-200 font-bold">{conversations.length}</p>
                  </div>
                  <div>
                    <p className="text-cyan-300">Data Size</p>
                    <p className="text-cyan-200 font-bold">{storageSize}</p>
                  </div>
                  <div>
                    <p className="text-cyan-300">Health Status</p>
                    <Badge className={`${getHealthColor(storageHealth)}`}>{storageHealth.toUpperCase()}</Badge>
                  </div>
                  <div>
                    <p className="text-cyan-300">Last Updated</p>
                    <p className="text-cyan-200 font-bold">Now</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
