import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { query, searchType = "general" } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    if (!process.env.SEARCHAPI_API_KEY) {
      return NextResponse.json(
        {
          error: "SearchAPI key not configured",
          fallback: "Real-time search unavailable. Please configure SEARCHAPI_API_KEY environment variable.",
        },
        { status: 500 },
      )
    }

    console.log(`🔍 Performing ${searchType} search for:`, query)

    // Configure search parameters based on search type
    const searchParams = getSearchParams(query, searchType)

    const searchResponse = await fetch(`https://www.searchapi.io/api/v1/search?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${process.env.SEARCHAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!searchResponse.ok) {
      throw new Error(`SearchAPI error: ${searchResponse.status} ${searchResponse.statusText}`)
    }

    const searchData = await searchResponse.json()
    console.log("🔍 Search results received:", searchData.organic_results?.length || 0, "results")

    // Process and format the search results
    const processedResults = processSearchResults(searchData, searchType)

    return NextResponse.json({
      success: true,
      query: query,
      searchType: searchType,
      results: processedResults,
      rawData: searchData, // Include raw data for debugging
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json(
      {
        error: "Search temporarily unavailable",
        message: "I'm having trouble accessing real-time search data, sir. Please try again.",
      },
      { status: 500 },
    )
  }
}

function getSearchParams(query: string, searchType: string): URLSearchParams {
  const params = new URLSearchParams({
    engine: "google",
    q: query,
  })

  switch (searchType) {
    case "news":
      params.set("tbm", "nws")
      params.set("num", "10")
      params.set("tbs", "qdr:d") // Last 24 hours
      break

    case "weather":
      params.set("q", `weather ${query}`)
      params.set("num", "5")
      break

    case "stocks":
      params.set("q", `${query} stock price`)
      params.set("num", "5")
      break

    case "sports":
      params.set("q", `${query} score results`)
      params.set("num", "8")
      break

    case "shopping":
      params.set("tbm", "shop")
      params.set("num", "8")
      break

    case "images":
      params.set("tbm", "isch")
      params.set("num", "6")
      break

    case "videos":
      params.set("tbm", "vid")
      params.set("num", "6")
      break

    case "local":
      params.set("q", `${query} near me`)
      params.set("num", "8")
      break

    case "academic":
      params.set("q", `${query} research paper study`)
      params.set("num", "6")
      break

    default: // general
      params.set("num", "8")
      break
  }

  return params
}

function processSearchResults(searchData: any, searchType: string) {
  const results: any = {
    summary: "",
    items: [],
    featured: null,
    knowledge: null,
    related: [],
  }

  // Extract featured snippet or answer box
  if (searchData.answer_box) {
    results.featured = {
      type: "answer_box",
      title: searchData.answer_box.title || "",
      answer: searchData.answer_box.answer || searchData.answer_box.snippet || "",
      source: searchData.answer_box.displayed_link || "",
    }
  }

  // Extract knowledge graph
  if (searchData.knowledge_graph) {
    const kg = searchData.knowledge_graph
    results.knowledge = {
      title: kg.title || "",
      description: kg.description || "",
      type: kg.type || "",
      attributes: kg.attributes || {},
      source: kg.source?.name || "",
    }
  }

  // Process organic results
  if (searchData.organic_results && searchData.organic_results.length > 0) {
    results.items = searchData.organic_results.slice(0, 8).map((result: any) => ({
      title: result.title || "",
      snippet: result.snippet || "",
      link: result.link || "",
      displayLink: result.displayed_link || "",
      date: result.date || "",
      position: result.position || 0,
    }))
  }

  // Process news results
  if (searchData.news_results && searchData.news_results.length > 0) {
    results.news = searchData.news_results.slice(0, 5).map((news: any) => ({
      title: news.title || "",
      snippet: news.snippet || "",
      link: news.link || "",
      source: news.source || "",
      date: news.date || "",
      thumbnail: news.thumbnail || "",
    }))
  }

  // Process shopping results
  if (searchData.shopping_results && searchData.shopping_results.length > 0) {
    results.shopping = searchData.shopping_results.slice(0, 6).map((product: any) => ({
      title: product.title || "",
      price: product.price || "",
      source: product.source || "",
      link: product.link || "",
      rating: product.rating || "",
      reviews: product.reviews || "",
      thumbnail: product.thumbnail || "",
    }))
  }

  // Process local results
  if (searchData.local_results && searchData.local_results.length > 0) {
    results.local = searchData.local_results.slice(0, 6).map((place: any) => ({
      title: place.title || "",
      address: place.address || "",
      phone: place.phone || "",
      rating: place.rating || "",
      reviews: place.reviews || "",
      hours: place.hours || "",
      type: place.type || "",
    }))
  }

  // Generate summary based on search type and results
  results.summary = generateSearchSummary(results, searchType)

  return results
}

function generateSearchSummary(results: any, searchType: string): string {
  let summary = ""

  // Use featured snippet or knowledge graph as primary summary
  if (results.featured) {
    summary = results.featured.answer
  } else if (results.knowledge) {
    summary = `${results.knowledge.title}: ${results.knowledge.description}`
  } else if (results.items && results.items.length > 0) {
    // Use first organic result snippet
    summary = results.items[0].snippet
  }

  // Add context based on search type
  switch (searchType) {
    case "news":
      if (results.news && results.news.length > 0) {
        summary = `Latest news: ${results.news[0].title}. ${results.news[0].snippet}`
      }
      break

    case "weather":
      if (results.featured) {
        summary = results.featured.answer
      } else if (results.items[0]) {
        summary = results.items[0].snippet
      }
      break

    case "stocks":
      if (results.featured) {
        summary = results.featured.answer
      } else if (results.knowledge) {
        summary = `${results.knowledge.title}: ${results.knowledge.description}`
      }
      break

    case "local":
      if (results.local && results.local.length > 0) {
        const place = results.local[0]
        summary = `${place.title} - ${place.address}. Rating: ${place.rating || "N/A"}`
      }
      break

    case "shopping":
      if (results.shopping && results.shopping.length > 0) {
        const product = results.shopping[0]
        summary = `${product.title} - ${product.price} from ${product.source}`
      }
      break
  }

  return summary || "Search completed successfully."
}
