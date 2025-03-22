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
    const { cookies, proxy } = req.body

    if (!cookies) {
      return res.status(400).json({ error: "Cookies are required" })
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

    const response = await fetch("https://www.youtube.com/account", {
      headers: {
        Cookie: cookies,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      agent,
      timeout: 30000 // 30 секунд таймаут для основного запроса
    })

    const html = await response.text()
    
    let email = ""
    if (response.ok && response.status === 200) {
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
      const match = html.match(emailRegex)
      
      if (match) {
        email = match[0]
      }
    }

    const isValid = response.ok && response.status === 200 && email !== ""

    console.log("Account check result:", { 
      isValid, 
      email,
      status: response.status,
      url: "https://www.youtube.com/account",
      proxy: proxy ? "used" : "not used"
    })

    return res.status(200).json({ 
      isValid, 
      email,
      proxy: {
        used: !!proxy,
        address: proxy ? proxy.split(":")[0] : null,
        port: proxy ? proxy.split(":")[1] : null
      }
    })
  } catch (error) {
    console.error("Account check error:", error)
    return res.status(500).json({ error: "Failed to check account" })
  }
}
