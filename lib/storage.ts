/**
 * JARVIS Data Storage System
 * Comprehensive storage for conversation history, preferences, and performance data
 */

// Storage interfaces
export interface ConversationEntry {
  id: string
  timestamp: Date
  userInput: string
  jarvisResponse: string
  searchUsed: boolean
  phoneControlUsed: boolean
  searchCategory?: string
  responseTime: number
  confidence?: number
}

export interface UserPreferences {
  voiceSettings: {
    confidenceThreshold: number
    noiseReduction: boolean
    microphoneSensitivity: number
    preferredVoice?: string
    speechRate: number
    speechPitch: number
  }
  searchPreferences: {
    defaultCategory: string
    maxResults: number
    enableAutoSearch: boolean
    preferredSources: string[]
  }
  phoneSettings: {
    enablePhoneControl: boolean
    defaultApps: Record<string, string>
    quickActions: string[]
  }
  personalInfo: {
    name: string
    location?: string
    timezone?: string
    interests: string[]
    frequentCommands: string[]
  }
  uiPreferences: {
    theme: "dark" | "light" | "auto"
    showAdvancedControls: boolean
    enableAnimations: boolean
    compactMode: boolean
  }
}

export interface PerformanceData {
  totalInteractions: number
  successfulCommands: number
  failedCommands: number
  averageResponseTime: number
  mostUsedFeatures: Record<string, number>
  errorLog: Array<{
    timestamp: Date
    error: string
    context: string
  }>
  voiceRecognitionStats: {
    totalAttempts: number
    successfulRecognitions: number
    averageConfidence: number
  }
}

export interface JarvisData {
  conversations: ConversationEntry[]
  preferences: UserPreferences
  performance: PerformanceData
  lastUpdated: Date
  version: string
}

// Default data structure
const defaultPreferences: UserPreferences = {
  voiceSettings: {
    confidenceThreshold: 0.7,
    noiseReduction: true,
    microphoneSensitivity: 0.8,
    speechRate: 0.9,
    speechPitch: 1.0,
  },
  searchPreferences: {
    defaultCategory: "general",
    maxResults: 8,
    enableAutoSearch: true,
    preferredSources: [],
  },
  phoneSettings: {
    enablePhoneControl: true,
    defaultApps: {
      music: "Spotify",
      maps: "Google Maps",
      camera: "Camera",
      browser: "Chrome",
    },
    quickActions: ["flashlight", "wifi", "bluetooth"],
  },
  personalInfo: {
    name: "Sir Shreeyans Raj",
    interests: ["coding", "AI", "technology", "JEE preparation"],
    frequentCommands: [],
  },
  uiPreferences: {
    theme: "dark",
    showAdvancedControls: false,
    enableAnimations: true,
    compactMode: false,
  },
}

const defaultPerformance: PerformanceData = {
  totalInteractions: 0,
  successfulCommands: 0,
  failedCommands: 0,
  averageResponseTime: 0,
  mostUsedFeatures: {},
  errorLog: [],
  voiceRecognitionStats: {
    totalAttempts: 0,
    successfulRecognitions: 0,
    averageConfidence: 0,
  },
}

// Storage keys
const STORAGE_KEYS = {
  CONVERSATIONS: "jarvis_conversations",
  PREFERENCES: "jarvis_preferences",
  PERFORMANCE: "jarvis_performance",
  BACKUP: "jarvis_backup",
} as const

// Storage class
export class JarvisStorage {
  private static instance: JarvisStorage
  private conversations: ConversationEntry[] = []
  private preferences: UserPreferences = defaultPreferences
  private performance: PerformanceData = defaultPerformance

  private constructor() {
    this.loadFromStorage()
  }

  static getInstance(): JarvisStorage {
    if (!JarvisStorage.instance) {
      JarvisStorage.instance = new JarvisStorage()
    }
    return JarvisStorage.instance
  }

  // Load data from localStorage
  private loadFromStorage(): void {
    try {
      // Load conversations
      const conversationsData = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)
      if (conversationsData) {
        const parsed = JSON.parse(conversationsData)
        this.conversations = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
        }))
      }

      // Load preferences
      const preferencesData = localStorage.getItem(STORAGE_KEYS.PREFERENCES)
      if (preferencesData) {
        this.preferences = { ...defaultPreferences, ...JSON.parse(preferencesData) }
      }

      // Load performance data
      const performanceData = localStorage.getItem(STORAGE_KEYS.PERFORMANCE)
      if (performanceData) {
        const parsed = JSON.parse(performanceData)
        this.performance = {
          ...defaultPerformance,
          ...parsed,
          errorLog:
            parsed.errorLog?.map((error: any) => ({
              ...error,
              timestamp: new Date(error.timestamp),
            })) || [],
        }
      }

      console.log("✅ JARVIS data loaded from storage")
    } catch (error) {
      console.error("❌ Error loading JARVIS data:", error)
      this.resetToDefaults()
    }
  }

  // Save data to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(this.conversations))
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(this.preferences))
      localStorage.setItem(STORAGE_KEYS.PERFORMANCE, JSON.stringify(this.performance))

      // Create backup
      const backup = {
        conversations: this.conversations,
        preferences: this.preferences,
        performance: this.performance,
        timestamp: new Date(),
      }
      localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(backup))

      console.log("💾 JARVIS data saved to storage")
    } catch (error) {
      console.error("❌ Error saving JARVIS data:", error)
    }
  }

  // Conversation management
  addConversation(entry: Omit<ConversationEntry, "id" | "timestamp">): void {
    const conversation: ConversationEntry = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry,
    }

    this.conversations.unshift(conversation)

    // Keep only last 1000 conversations
    if (this.conversations.length > 1000) {
      this.conversations = this.conversations.slice(0, 1000)
    }

    // Update performance stats
    this.performance.totalInteractions++
    if (entry.jarvisResponse && !entry.jarvisResponse.includes("error")) {
      this.performance.successfulCommands++
    } else {
      this.performance.failedCommands++
    }

    // Update average response time
    const totalTime =
      this.performance.averageResponseTime * (this.performance.totalInteractions - 1) + entry.responseTime
    this.performance.averageResponseTime = totalTime / this.performance.totalInteractions

    // Track feature usage
    if (entry.searchUsed) {
      this.performance.mostUsedFeatures.search = (this.performance.mostUsedFeatures.search || 0) + 1
    }
    if (entry.phoneControlUsed) {
      this.performance.mostUsedFeatures.phoneControl = (this.performance.mostUsedFeatures.phoneControl || 0) + 1
    }

    // Update frequent commands
    const command = entry.userInput.toLowerCase()
    if (!this.preferences.personalInfo.frequentCommands.includes(command)) {
      this.preferences.personalInfo.frequentCommands.push(command)
      // Keep only top 50 frequent commands
      if (this.preferences.personalInfo.frequentCommands.length > 50) {
        this.preferences.personalInfo.frequentCommands = this.preferences.personalInfo.frequentCommands.slice(0, 50)
      }
    }

    this.saveToStorage()
  }

  getConversations(limit?: number): ConversationEntry[] {
    return limit ? this.conversations.slice(0, limit) : this.conversations
  }

  getConversationsByCategory(category: string, limit = 20): ConversationEntry[] {
    return this.conversations.filter((conv) => conv.searchCategory === category).slice(0, limit)
  }

  searchConversations(query: string, limit = 20): ConversationEntry[] {
    const lowerQuery = query.toLowerCase()
    return this.conversations
      .filter(
        (conv) =>
          conv.userInput.toLowerCase().includes(lowerQuery) || conv.jarvisResponse.toLowerCase().includes(lowerQuery),
      )
      .slice(0, limit)
  }

  // Preferences management
  getPreferences(): UserPreferences {
    return { ...this.preferences }
  }

  updatePreferences(updates: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...updates }
    this.saveToStorage()
  }

  updateVoiceSettings(settings: Partial<UserPreferences["voiceSettings"]>): void {
    this.preferences.voiceSettings = { ...this.preferences.voiceSettings, ...settings }
    this.saveToStorage()
  }

  updateSearchPreferences(settings: Partial<UserPreferences["searchPreferences"]>): void {
    this.preferences.searchPreferences = { ...this.preferences.searchPreferences, ...settings }
    this.saveToStorage()
  }

  // Performance tracking
  getPerformanceData(): PerformanceData {
    return { ...this.performance }
  }

  logError(error: string, context: string): void {
    this.performance.errorLog.unshift({
      timestamp: new Date(),
      error,
      context,
    })

    // Keep only last 100 errors
    if (this.performance.errorLog.length > 100) {
      this.performance.errorLog = this.performance.errorLog.slice(0, 100)
    }

    this.saveToStorage()
  }

  updateVoiceRecognitionStats(success: boolean, confidence?: number): void {
    this.performance.voiceRecognitionStats.totalAttempts++

    if (success) {
      this.performance.voiceRecognitionStats.successfulRecognitions++

      if (confidence !== undefined) {
        const currentAvg = this.performance.voiceRecognitionStats.averageConfidence
        const totalSuccessful = this.performance.voiceRecognitionStats.successfulRecognitions
        this.performance.voiceRecognitionStats.averageConfidence =
          (currentAvg * (totalSuccessful - 1) + confidence) / totalSuccessful
      }
    }

    this.saveToStorage()
  }

  // Analytics and insights
  getUsageAnalytics() {
    const conversations = this.conversations
    const totalConversations = conversations.length

    if (totalConversations === 0) {
      return {
        totalConversations: 0,
        averageResponseTime: 0,
        mostUsedCategories: [],
        mostActiveHours: [],
        successRate: 0,
      }
    }

    // Category usage
    const categoryCount: Record<string, number> = {}
    conversations.forEach((conv) => {
      if (conv.searchCategory) {
        categoryCount[conv.searchCategory] = (categoryCount[conv.searchCategory] || 0) + 1
      }
    })

    const mostUsedCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }))

    // Active hours
    const hourCount: Record<number, number> = {}
    conversations.forEach((conv) => {
      const hour = conv.timestamp.getHours()
      hourCount[hour] = (hourCount[hour] || 0) + 1
    })

    const mostActiveHours = Object.entries(hourCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: Number.parseInt(hour), count }))

    // Success rate
    const successfulCommands = this.performance.successfulCommands
    const successRate = totalConversations > 0 ? (successfulCommands / totalConversations) * 100 : 0

    return {
      totalConversations,
      averageResponseTime: this.performance.averageResponseTime,
      mostUsedCategories,
      mostActiveHours,
      successRate,
      voiceRecognitionAccuracy:
        this.performance.voiceRecognitionStats.totalAttempts > 0
          ? (this.performance.voiceRecognitionStats.successfulRecognitions /
              this.performance.voiceRecognitionStats.totalAttempts) *
            100
          : 0,
    }
  }

  // Context-aware suggestions
  getContextualSuggestions(currentInput?: string): string[] {
    const suggestions: string[] = []

    // Recent successful commands
    const recentSuccessful = this.conversations
      .filter((conv) => conv.jarvisResponse && !conv.jarvisResponse.includes("error"))
      .slice(0, 10)
      .map((conv) => conv.userInput)

    suggestions.push(...recentSuccessful)

    // Frequent commands
    suggestions.push(...this.preferences.personalInfo.frequentCommands.slice(0, 5))

    // Time-based suggestions
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) {
      suggestions.push("Good morning JARVIS", "What's the weather today?", "Check my schedule")
    } else if (hour >= 12 && hour < 18) {
      suggestions.push("What's the latest news?", "Set a reminder", "Play some music")
    } else {
      suggestions.push("Good evening JARVIS", "How was my day?", "Set an alarm for tomorrow")
    }

    // Remove duplicates and filter by current input
    const uniqueSuggestions = [...new Set(suggestions)]

    if (currentInput) {
      const filtered = uniqueSuggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(currentInput.toLowerCase()),
      )
      return filtered.slice(0, 5)
    }

    return uniqueSuggestions.slice(0, 8)
  }

  // Data management
  exportData(): string {
    const data: JarvisData = {
      conversations: this.conversations,
      preferences: this.preferences,
      performance: this.performance,
      lastUpdated: new Date(),
      version: "1.0.0",
    }
    return JSON.stringify(data, null, 2)
  }

  importData(jsonData: string): boolean {
    try {
      const data: JarvisData = JSON.parse(jsonData)

      if (data.conversations) {
        this.conversations = data.conversations.map((conv) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
        }))
      }

      if (data.preferences) {
        this.preferences = { ...defaultPreferences, ...data.preferences }
      }

      if (data.performance) {
        this.performance = { ...defaultPerformance, ...data.performance }
      }

      this.saveToStorage()
      console.log("✅ JARVIS data imported successfully")
      return true
    } catch (error) {
      console.error("❌ Error importing JARVIS data:", error)
      return false
    }
  }

  clearAllData(): void {
    this.conversations = []
    this.preferences = { ...defaultPreferences }
    this.performance = { ...defaultPerformance }

    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key)
    })

    console.log("🗑️ All JARVIS data cleared")
  }

  resetToDefaults(): void {
    this.preferences = { ...defaultPreferences }
    this.performance = { ...defaultPerformance }
    this.saveToStorage()
    console.log("🔄 JARVIS settings reset to defaults")
  }

  // Backup and restore
  createBackup(): string {
    return this.exportData()
  }

  restoreFromBackup(): boolean {
    try {
      const backupData = localStorage.getItem(STORAGE_KEYS.BACKUP)
      if (backupData) {
        const backup = JSON.parse(backupData)
        return this.importData(JSON.stringify(backup))
      }
      return false
    } catch (error) {
      console.error("❌ Error restoring from backup:", error)
      return false
    }
  }
}

// Export singleton instance
export const jarvisStorage = JarvisStorage.getInstance()

// Utility functions
export function formatStorageSize(): string {
  try {
    const data = jarvisStorage.exportData()
    const sizeInBytes = new Blob([data]).size
    const sizeInKB = (sizeInBytes / 1024).toFixed(2)
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2)

    if (sizeInBytes < 1024) {
      return `${sizeInBytes} bytes`
    } else if (sizeInBytes < 1024 * 1024) {
      return `${sizeInKB} KB`
    } else {
      return `${sizeInMB} MB`
    }
  } catch (error) {
    return "Unknown"
  }
}

export function getStorageHealth(): "good" | "warning" | "critical" {
  try {
    const conversations = jarvisStorage.getConversations()
    const performance = jarvisStorage.getPerformanceData()

    // Check for critical issues
    if (performance.errorLog.length > 50) return "critical"
    if (conversations.length > 800) return "warning"
    if (performance.totalInteractions > 0 && performance.successfulCommands / performance.totalInteractions < 0.7)
      return "warning"

    return "good"
  } catch (error) {
    return "critical"
  }
}
