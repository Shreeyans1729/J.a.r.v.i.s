"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Newspaper,
  Cloud,
  TrendingUp,
  Trophy,
  ShoppingCart,
  MapPin,
  GraduationCap,
  X,
  ExternalLink,
} from "lucide-react"

interface SearchPanelProps {
  onClose: () => void
  onSearch: (query: string, category: string) => void
}

export function SearchPanel({ onClose, onSearch }: SearchPanelProps) {
  const [activeTab, setActiveTab] = useState("general")

  const searchCategories = [
    {
      id: "general",
      label: "General",
      icon: Search,
      examples: ["What is AI?", "How to cook pasta", "History of Rome"],
    },
    {
      id: "news",
      label: "News",
      icon: Newspaper,
      examples: ["Latest tech news", "Breaking news today", "Current events"],
    },
    {
      id: "weather",
      label: "Weather",
      icon: Cloud,
      examples: ["Weather in New York", "Tomorrow's forecast", "Is it raining?"],
    },
    {
      id: "stocks",
      label: "Stocks",
      icon: TrendingUp,
      examples: ["Apple stock price", "Bitcoin price", "Market news"],
    },
    { id: "sports", label: "Sports", icon: Trophy, examples: ["Lakers score", "Football results", "Olympics news"] },
    {
      id: "shopping",
      label: "Shopping",
      icon: ShoppingCart,
      examples: ["Best laptops 2024", "iPhone 15 price", "Gaming headsets"],
    },
    {
      id: "local",
      label: "Local",
      icon: MapPin,
      examples: ["Restaurants near me", "Gas stations nearby", "Hotels in Paris"],
    },
    {
      id: "academic",
      label: "Research",
      icon: GraduationCap,
      examples: ["Climate change research", "AI studies", "Medical papers"],
    },
  ]

  const handleExampleClick = (example: string, category: string) => {
    onSearch(example, category)
    onClose()
  }

  return (
    <Card className="w-full max-w-2xl bg-black/80 border-cyan-500/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Real-Time Search Categories
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
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="general">
              <Search className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="news">
              <Newspaper className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="weather">
              <Cloud className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="stocks">
              <TrendingUp className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <TabsTrigger value="sports" className="col-span-1">
              <Trophy className="w-4 h-4 mr-2" />
              Sports
            </TabsTrigger>
            <TabsTrigger value="shopping" className="col-span-1">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Shopping
            </TabsTrigger>
            <TabsTrigger value="local" className="col-span-1">
              <MapPin className="w-4 h-4 mr-2" />
              Local
            </TabsTrigger>
            <TabsTrigger value="academic" className="col-span-1">
              <GraduationCap className="w-4 h-4 mr-2" />
              Research
            </TabsTrigger>
          </div>

          {searchCategories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <category.icon className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-cyan-300">{category.label} Search</h3>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-cyan-200 mb-3">Try these example searches:</p>
                <div className="flex flex-wrap gap-2">
                  {category.examples.map((example, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-colors"
                      onClick={() => handleExampleClick(example, category.id)}
                    >
                      {example}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded">
                <p className="text-xs text-cyan-300">
                  <strong>Tip:</strong> You can also use voice commands like "Hey JARVIS,{" "}
                  {category.examples[0].toLowerCase()}" or type directly in the main input field.
                </p>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
