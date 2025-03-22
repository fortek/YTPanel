import { NextApiRequest, NextApiResponse } from "next"
import { HttpsProxyAgent } from "https-proxy-agent"
import fetch from "node-fetch"

async function testProxy(proxyUrl: string): Promise<boolean> {
  try {
    const agent = new HttpsProxyAgent(proxyUrl)
    const response = await fetch("https://www.youtube.com", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      agent,
      timeout: 10000 // 10 секунд таймаут
    })
    return response.ok
  } catch (error) {
    console.error("Proxy test failed:", error)
    return false
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { videoId, proxy } = req.body

    if (!videoId) {
      return res.status(400).json({ error: "Video ID is required" })
    }

    let agent = undefined
    if (proxy) {
      try {
        // Проверяем формат прокси
        const [ip, port, login, password] = proxy.split(":")
        if (!ip || !port || !login || !password) {
          return res.status(400).json({ error: "Invalid proxy format. Expected: IP:PORT:LOGIN:PASSWORD" })
        }
        
        // Создаем URL для прокси с авторизацией
        const proxyUrl = `http://${login}:${password}@${ip}:${port}`
        
        // Проверяем работоспособность прокси
        const isProxyWorking = await testProxy(proxyUrl)
        if (!isProxyWorking) {
          return res.status(400).json({ error: "Proxy is not working or not responding" })
        }
        
        agent = new HttpsProxyAgent(proxyUrl)
      } catch (error) {
        console.error("Proxy configuration error:", error)
        return res.status(400).json({ error: "Invalid proxy configuration" })
      }
    }

    const url = `https://www.youtube.com/watch?v=${videoId}`
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1"
      },
      agent,
      timeout: 30000 // 30 секунд таймаут
    })

    const html = await response.text()
    
    // Ищем continuation token в HTML
    const match = html.match(/"reloadContinuationData":{"continuation":"([^"]+)"/)
    const chatId = match ? match[1] : null

    if (!chatId) {
      return res.status(404).json({ error: "Chat ID not found" })
    }

    console.log("Chat ID found:", { 
      videoId,
      chatId,
      status: response.status,
      url,
      proxy: proxy ? "used" : "not used"
    })

    return res.status(200).json({ 
      chatId,
      proxy: {
        used: !!proxy,
        address: proxy ? proxy.split(":")[0] : null,
        port: proxy ? proxy.split(":")[1] : null
      }
    })
  } catch (error) {
    console.error("Chat ID fetch error:", error)
    return res.status(500).json({ error: "Failed to fetch chat ID" })
  }
} 