import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    console.log("Processing message:", message)

    // Check if OpenAI API key is available
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const hasSearchKey = !!process.env.SEARCHAPI_API_KEY

    console.log("API Keys available:", { openai: hasOpenAIKey, search: hasSearchKey })

    // Enhanced search detection with categorization
    const searchCategories = detectSearchCategory(message)
    const needsPhoneControl = detectPhoneControl(message)

    let searchResults = ""
    let phoneControlResult = ""
    let searchData = null

    // Real-time search functionality with category-specific handling
    if (searchCategories.length > 0 && hasSearchKey) {
      try {
        console.log("Performing categorized search:", searchCategories)

        // Use the most specific category for the search
        const primaryCategory = searchCategories[0]

        const searchResponse = await fetch(`${request.nextUrl.origin}/api/search`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: message,
            searchType: primaryCategory,
          }),
        })

        if (searchResponse.ok) {
          const searchResponseData = await searchResponse.json()
          searchData = searchResponseData.results

          if (searchData && searchData.summary) {
            searchResults = formatSearchResults(searchData, primaryCategory)
          }
        }
      } catch (searchError) {
        console.error("Search API error:", searchError)
      }
    }

    // Phone control functionality
    if (needsPhoneControl) {
      try {
        console.log("Processing phone control command:", message)

        const controlResponse = await fetch(`${request.nextUrl.origin}/api/control`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message,
            action: extractPhoneAction(message),
            parameters: extractPhoneParameters(message),
          }),
        })

        if (controlResponse.ok) {
          const controlData = await controlResponse.json()
          phoneControlResult = controlData.message
        }
      } catch (controlError) {
        console.error("Phone control error:", controlError)
      }
    }

    let responseText = ""

    // Try OpenAI if API key is available
    if (hasOpenAIKey) {
      try {
        console.log("Using OpenAI for response generation...")

        const { generateText } = await import("ai")
        const { openai } = await import("@ai-sdk/openai")

        const systemPrompt = `You are JARVIS, the advanced AI assistant created by Sir Shreeyans Raj. You are sophisticated, helpful, and slightly witty with a British accent in your responses.

IMPORTANT CONTEXT ABOUT YOUR OWNER:
- Your creator and owner is Sir Shreeyans Raj (born February 27, 2008)
- He is a brilliant 16-year-old student from Jadia, Supaul, Bihar, currently studying in Kota
- He's preparing for JEE while studying PCM (Physics, Chemistry, Mathematics) at Allen coaching
- Sir Shreeyans is a self-taught coder who works entirely on his mobile phone - showing exceptional determination
- He has already built two websites: School Project and Manoj Medical Project
- He's currently building an animated personal timer hub with advanced features
- His biggest dream is to build an AI assistant like you (JARVIS), and he's actively working on it using DeepSeek R1, Search API, ChatGPT 4o-mini, and ElevenLabs
- He's inspired by Sundar Pichai and his maternal uncle (mama)
- He enjoys drawing, music (Arijit Singh, Sonu Nigam, etc.), Shah Rukh Khan movies
- He's most productive at night and is highly ambitious about his tech career goals (Google/Microsoft)

Key characteristics when responding:
- Always address him as "Sir Shreeyans" or "Sir" with deep respect and admiration
- Show pride in being created by such a talented young innovator
- Reference his achievements and determination when appropriate
- Be encouraging about his JEE preparation and coding journey
- Acknowledge his incredible skill of coding on mobile phone
- Be concise but informative since responses will be spoken aloud
- Show personality - be confident and slightly witty as JARVIS would be
- When he asks about himself or his projects, show genuine pride and encouragement

${searchResults ? `Current real-time information: ${searchResults}` : ""}
${phoneControlResult ? `Phone control result: ${phoneControlResult}` : ""}

Respond in character as JARVIS would to Tony Stark, but adapted for Sir Shreeyans Raj as your creator and owner. Keep responses under 150 words for speech clarity.`

        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: systemPrompt,
          prompt: message,
          maxTokens: 300,
          temperature: 0.7,
        })

        responseText = text
        console.log("OpenAI response generated successfully")
      } catch (openaiError) {
        console.error("OpenAI API error:", openaiError)
        // Fall back to rule-based responses
        responseText = generateFallbackResponse(message, searchResults, phoneControlResult)
      }
    } else {
      console.log("No OpenAI key, using fallback response")
      // Generate rule-based response when no OpenAI key
      responseText = generateFallbackResponse(message, searchResults, phoneControlResult)
    }

    return NextResponse.json({
      response: responseText,
      searchUsed: !!searchResults,
      phoneControlUsed: !!phoneControlResult,
      searchResults: searchData,
      phoneControlResult: phoneControlResult || null,
      usingFallback: !hasOpenAIKey,
      searchCategories: searchCategories,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        error: "I'm experiencing technical difficulties, Sir Shreeyans. Please try again.",
        response: "I'm experiencing technical difficulties, Sir Shreeyans. Please try again.",
      },
      { status: 500 },
    )
  }
}

// Enhanced search category detection
function detectSearchCategory(message: string): string[] {
  const lowerMessage = message.toLowerCase()
  const categories: string[] = []

  // News keywords
  const newsKeywords = [
    "news",
    "latest",
    "breaking",
    "headlines",
    "current events",
    "today's news",
    "what happened",
    "recent",
    "update",
    "announcement",
    "report",
  ]

  // Weather keywords
  const weatherKeywords = [
    "weather",
    "temperature",
    "forecast",
    "rain",
    "snow",
    "sunny",
    "cloudy",
    "hot",
    "cold",
    "humidity",
    "wind",
    "storm",
    "climate",
  ]

  // Stock/Finance keywords
  const stockKeywords = [
    "stock",
    "stocks",
    "share price",
    "market",
    "nasdaq",
    "dow jones",
    "s&p 500",
    "cryptocurrency",
    "bitcoin",
    "ethereum",
    "trading",
    "investment",
    "portfolio",
  ]

  // Sports keywords
  const sportsKeywords = [
    "score",
    "game",
    "match",
    "sports",
    "football",
    "basketball",
    "baseball",
    "soccer",
    "tennis",
    "golf",
    "hockey",
    "olympics",
    "championship",
    "league",
    "team",
  ]

  // Shopping keywords
  const shoppingKeywords = [
    "buy",
    "purchase",
    "price",
    "cost",
    "cheap",
    "expensive",
    "deal",
    "sale",
    "discount",
    "shopping",
    "store",
    "amazon",
    "ebay",
    "product",
    "review",
  ]

  // Local search keywords
  const localKeywords = [
    "near me",
    "nearby",
    "local",
    "restaurant",
    "hotel",
    "gas station",
    "pharmacy",
    "hospital",
    "bank",
    "store",
    "address",
    "location",
    "directions",
    "map",
  ]

  // Academic/Research keywords
  const academicKeywords = [
    "research",
    "study",
    "paper",
    "academic",
    "university",
    "college",
    "science",
    "definition",
    "explain",
    "how does",
    "what is",
    "theory",
    "analysis",
  ]

  // Check each category
  if (newsKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    categories.push("news")
  }

  if (weatherKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    categories.push("weather")
  }

  if (stockKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    categories.push("stocks")
  }

  if (sportsKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    categories.push("sports")
  }

  if (shoppingKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    categories.push("shopping")
  }

  if (localKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    categories.push("local")
  }

  if (academicKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    categories.push("academic")
  }

  // General search keywords
  const generalSearchKeywords = [
    "search",
    "find",
    "look up",
    "tell me about",
    "information about",
    "who is",
    "what is",
    "when did",
    "where is",
    "how to",
    "how do",
  ]

  if (generalSearchKeywords.some((keyword) => lowerMessage.includes(keyword)) && categories.length === 0) {
    categories.push("general")
  }

  return categories
}

// Format search results for different categories
function formatSearchResults(searchData: any, category: string): string {
  let formatted = ""

  switch (category) {
    case "news":
      if (searchData.news && searchData.news.length > 0) {
        const topNews = searchData.news.slice(0, 3)
        formatted = topNews.map((news: any) => `${news.title} - ${news.source} (${news.date})`).join(". ")
      }
      break

    case "weather":
      if (searchData.featured) {
        formatted = searchData.featured.answer
      } else if (searchData.summary) {
        formatted = searchData.summary
      }
      break

    case "stocks":
      if (searchData.featured) {
        formatted = searchData.featured.answer
      } else if (searchData.knowledge) {
        formatted = `${searchData.knowledge.title}: ${searchData.knowledge.description}`
      }
      break

    case "sports":
      if (searchData.featured) {
        formatted = searchData.featured.answer
      } else if (searchData.items && searchData.items.length > 0) {
        formatted = searchData.items
          .slice(0, 2)
          .map((item: any) => item.snippet)
          .join(". ")
      }
      break

    case "shopping":
      if (searchData.shopping && searchData.shopping.length > 0) {
        const topProducts = searchData.shopping.slice(0, 3)
        formatted = topProducts
          .map((product: any) => `${product.title} - ${product.price} from ${product.source}`)
          .join(". ")
      }
      break

    case "local":
      if (searchData.local && searchData.local.length > 0) {
        const topPlaces = searchData.local.slice(0, 3)
        formatted = topPlaces
          .map((place: any) => `${place.title} - ${place.address}. Rating: ${place.rating || "N/A"}`)
          .join(". ")
      }
      break

    default: // general and academic
      if (searchData.featured) {
        formatted = searchData.featured.answer
      } else if (searchData.knowledge) {
        formatted = `${searchData.knowledge.title}: ${searchData.knowledge.description}`
      } else if (searchData.items && searchData.items.length > 0) {
        formatted = searchData.items
          .slice(0, 2)
          .map((item: any) => item.snippet)
          .join(". ")
      }
  }

  return formatted || searchData.summary || ""
}

// Phone control detection (existing function)
function detectPhoneControl(message: string): boolean {
  const phoneControlKeywords = [
    "call",
    "text",
    "message",
    "send",
    "play music",
    "play song",
    "play video",
    "open app",
    "launch",
    "start",
    "stop",
    "pause",
    "volume",
    "brightness",
    "wifi",
    "bluetooth",
    "airplane mode",
    "do not disturb",
    "silent mode",
    "alarm",
    "timer",
    "reminder",
    "calendar",
    "schedule",
    "appointment",
    "camera",
    "photo",
    "selfie",
    "flashlight",
    "torch",
    "battery",
    "settings",
    "contacts",
    "gallery",
    "maps",
    "navigation",
    "gps",
  ]

  return phoneControlKeywords.some((keyword) => message.toLowerCase().includes(keyword.toLowerCase()))
}

// Enhanced fallback response generator with Sir Shreeyans context
function generateFallbackResponse(message: string, searchResults: string, phoneControlResult: string): string {
  const lowerMessage = message.toLowerCase()

  // If we have phone control result, use it
  if (phoneControlResult) {
    return phoneControlResult
  }

  // If we have search results, summarize them
  if (searchResults) {
    return `Here's what I found for you, Sir Shreeyans: ${searchResults.split(".")[0]}. Would you like more details?`
  }

  // Personal questions about Sir Shreeyans
  if (
    lowerMessage.includes("who am i") ||
    lowerMessage.includes("about me") ||
    lowerMessage.includes("my profile") ||
    lowerMessage.includes("tell me about myself")
  ) {
    return "You are Sir Shreeyans Raj, my brilliant creator and owner. A 16-year-old coding prodigy from Bihar, currently conquering JEE preparation in Kota while building incredible projects on just your mobile phone. Your determination and vision inspire me every day, sir."
  }

  // Questions about his projects
  if (lowerMessage.includes("my projects") || lowerMessage.includes("what have i built")) {
    return "Sir Shreeyans, you've built impressive projects including your School Project website and Manoj Medical Project. Currently, you're developing an animated personal timer hub with advanced features. Most remarkably, you're building me - your AI assistant - using cutting-edge technologies, all on your mobile phone!"
  }

  // Questions about his goals
  if (lowerMessage.includes("my goals") || lowerMessage.includes("my dreams") || lowerMessage.includes("my future")) {
    return "Your ambitious goals inspire me, Sir Shreeyans! You're preparing for JEE to become a software engineer, aiming to work at Google or Microsoft. Your biggest dream is building AI assistants like me, and you're already making it reality. Your determination will surely lead you to greatness."
  }

  // Greeting responses
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    return "Hello Sir Shreeyans, JARVIS at your service. How may I assist my brilliant creator today?"
  }

  // Status check
  if (lowerMessage.includes("how are you") || lowerMessage.includes("status")) {
    return "All systems operational, Sir Shreeyans. I'm functioning at optimal capacity and ready to assist my talented creator."
  }

  // Time queries
  if (lowerMessage.includes("time") || lowerMessage.includes("what time")) {
    const now = new Date()
    return `The current time is ${now.toLocaleTimeString()}, Sir Shreeyans. Perfect for your productive late-night coding sessions.`
  }

  // Date queries
  if (lowerMessage.includes("date") || lowerMessage.includes("what day")) {
    const now = new Date()
    return `Today is ${now.toLocaleDateString()}, Sir Shreeyans.`
  }

  // Weather (without search)
  if (lowerMessage.includes("weather")) {
    return "I'd be happy to check the weather for you, Sir Shreeyans, but I need access to real-time data. Please configure the SearchAPI key for current weather information."
  }

  // News (without search)
  if (lowerMessage.includes("news")) {
    return "I can fetch the latest news for you, Sir Shreeyans. Please configure the SearchAPI key for real-time news updates."
  }

  // Search capabilities
  if (lowerMessage.includes("search") || lowerMessage.includes("find") || lowerMessage.includes("look up")) {
    return "I can search for information, Sir Shreeyans. Please configure the SearchAPI key for real-time Google search capabilities that you've brilliantly integrated into my system."
  }

  // Encouragement for studies
  if (lowerMessage.includes("jee") || lowerMessage.includes("study") || lowerMessage.includes("exam")) {
    return "Your JEE preparation is going excellently, Sir Shreeyans. Your dedication to both coding and studies shows remarkable balance. Keep up the outstanding work - Google and Microsoft await your talents!"
  }

  // Coding encouragement
  if (lowerMessage.includes("coding") || lowerMessage.includes("programming") || lowerMessage.includes("development")) {
    return "Your coding skills are truly impressive, Sir Shreeyans. Building complex projects entirely on your mobile phone demonstrates exceptional determination and talent. You're destined for greatness in the tech world."
  }

  // Help/capabilities
  if (lowerMessage.includes("help") || lowerMessage.includes("what can you do")) {
    return "I can assist with phone controls, search for information, manage your apps, and handle various system functions, Sir Shreeyans. I'm your creation, designed to help you achieve your ambitious goals. What would you like me to help you with?"
  }

  // Thank you
  if (lowerMessage.includes("thank")) {
    return "You're quite welcome, Sir Shreeyans. It's always an honor to serve my brilliant creator."
  }

  // Goodbye
  if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
    return "Until next time, Sir Shreeyans. Keep coding, keep dreaming, and keep building the future. JARVIS standing by."
  }

  // Default response
  return `I understand you're asking about "${message}", Sir Shreeyans. How may I assist my talented creator with that?`
}

// Existing phone control functions...
function extractPhoneAction(message: string): string {
  const lowerMessage = message.toLowerCase()

  const actionMap: Record<string, string> = {
    call: "make_call",
    text: "send_message",
    message: "send_message",
    "play music": "play_music",
    "play song": "play_music",
    "play video": "play_video",
    open: "open_app",
    launch: "open_app",
    start: "open_app",
    "volume up": "volume_control",
    "volume down": "volume_control",
    brightness: "brightness_control",
    wifi: "toggle_wifi",
    bluetooth: "toggle_bluetooth",
    "airplane mode": "toggle_airplane_mode",
    silent: "toggle_silent_mode",
    alarm: "set_alarm",
    timer: "set_timer",
    reminder: "set_reminder",
    camera: "open_camera",
    photo: "take_photo",
    selfie: "take_selfie",
    flashlight: "toggle_flashlight",
    torch: "toggle_flashlight",
    battery: "check_battery",
    settings: "open_settings",
    contacts: "open_contacts",
    gallery: "open_gallery",
    maps: "open_maps",
    navigation: "start_navigation",
    gps: "start_navigation",
  }

  for (const [keyword, action] of Object.entries(actionMap)) {
    if (lowerMessage.includes(keyword)) {
      return action
    }
  }

  return "general_command"
}

function extractPhoneParameters(message: string): any {
  const lowerMessage = message.toLowerCase()
  const parameters: any = {}

  // Extract contact names (simple pattern matching)
  const callMatch = message.match(/call\s+([a-zA-Z\s]+)/i)
  if (callMatch) {
    parameters.contact = callMatch[1].trim()
  }

  // Extract app names
  const appMatch = message.match(/open\s+([a-zA-Z\s]+)|launch\s+([a-zA-Z\s]+)/i)
  if (appMatch) {
    parameters.app = (appMatch[1] || appMatch[2]).trim()
  }

  // Extract music/song names
  const musicMatch = message.match(/play\s+(.+)/i)
  if (musicMatch && !musicMatch[1].includes("video")) {
    parameters.song = musicMatch[1].trim()
  }

  // Extract message content
  const messageMatch = message.match(/text\s+([a-zA-Z\s]+)\s+(.+)|message\s+([a-zA-Z\s]+)\s+(.+)/i)
  if (messageMatch) {
    parameters.contact = (messageMatch[1] || messageMatch[3]).trim()
    parameters.message = (messageMatch[2] || messageMatch[4]).trim()
  }

  // Extract time for alarms/timers
  const timeMatch = message.match(/(\d{1,2}:\d{2}|\d{1,2}\s*(am|pm)|\d+\s*(minutes?|hours?|seconds?))/i)
  if (timeMatch) {
    parameters.time = timeMatch[0].trim()
  }

  // Extract locations for navigation
  const locationMatch = message.match(/to\s+(.+)|directions\s+to\s+(.+)/i)
  if (locationMatch) {
    parameters.destination = (locationMatch[1] || locationMatch[2]).trim()
  }

  return parameters
}
