"use client"

import { useState, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, X, RotateCcw } from "lucide-react"

interface SearchHistoryProps {
  onSelectQuery: (query: string) => void
}

interface HistoryItem {
  id: string
  query: string
  response: string
  timestamp: Date
}

export const SearchHistory = forwardRef<any, SearchHistoryProps>(({ onSelectQuery }, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addToHistory: (query: string, response: string) => {
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        query,
        response,
        timestamp: new Date(),
      }
      setHistory((prev) => [newItem, ...prev.slice(0, 9)]) // Keep last 10 items
    },
  }))

  const clearHistory = () => {
    setHistory([])
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
      >
        <History className="w-4 h-4 mr-2" />
        History
      </Button>
    )
  }

  return (
    <Card className="w-full max-w-md bg-black/80 border-cyan-500/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <History className="w-5 h-5" />
          Search History
        </CardTitle>
        <div className="flex gap-2">
          <Button
            onClick={clearHistory}
            variant="outline"
            size="sm"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 bg-transparent"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
            size="sm"
            className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          {history.length === 0 ? (
            <p className="text-cyan-300/70 text-sm text-center py-4">
              No search history yet. Start asking JARVIS questions!
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded border border-cyan-500/20 hover:border-cyan-500/40 cursor-pointer transition-colors"
                  onClick={() => {
                    onSelectQuery(item.query)
                    setIsOpen(false)
                  }}
                >
                  <p className="text-cyan-200 text-sm font-medium mb-1">"{item.query}"</p>
                  <p className="text-cyan-300/70 text-xs">{item.timestamp.toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
})

SearchHistory.displayName = "SearchHistory"
