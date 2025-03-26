import { NextApiRequest, NextApiResponse } from "next"
import { HttpsProxyAgent } from "https-proxy-agent"
import fetch from "node-fetch"
import crypto from "crypto"

const ORIGIN = "https://www.youtube.com"

function createSapisidHash(cookie: string): string | null {
  const sapisidMatch = cookie.match(/SAPISID=(\S+?);/)
  if (!sapisidMatch) return null

  const sapisid = sapisidMatch[1]
  const timestamp = Math.floor(Date.now() / 1000)
  const strToHash = `${timestamp} ${sapisid} ${ORIGIN}`
  const hash = crypto.createHash("sha1").update(strToHash).digest("hex")

  return `SAPISIDHASH ${timestamp}_${hash}`
}

async function getFeedbackTokens(
  cookie: string,
  channel: string,
  proxy?: string
): Promise<string[]> {
  let agent = undefined
  if (proxy) {
    const [ip, port, login, password] = proxy.split(":")
    const proxyUrl = `http://${login}:${password}@${ip}:${port}`
    agent = new HttpsProxyAgent(proxyUrl)
  }

  const response = await fetch(
    `https://www.youtube.com/live_chat?is_popout=1&v=${channel}`,
    {
      headers: {
        Cookie: cookie,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      agent
    }
  )

  const html = await response.text()
  const matches = html.match(/"feedbackToken":\s*"([^"]*)"/g)
  
  if (!matches) {
    throw new Error("No feedback tokens found")
  }

  return matches.map(match => {
    const tokenMatch = match.match(/"feedbackToken":\s*"([^"]*)"/)
    return tokenMatch ? tokenMatch[1] : ""
  }).filter(Boolean)
}

async function sendReact(
  cookie: string,
  sapisidhash: string,
  feedbackToken: string,
  proxy?: string
): Promise<string> {
  let agent = undefined
  if (proxy) {
    const [ip, port, login, password] = proxy.split(":")
    const proxyUrl = `http://${login}:${password}@${ip}:${port}`
    agent = new HttpsProxyAgent(proxyUrl)
  }

  const postData = {
    context: {
      client: {
        hl: "en",
        gl: "RU",
        clientName: "WEB",
        clientVersion: "2.20240228.06.00"
      }
    },
    feedbackTokens: [feedbackToken],
    isFeedbackTokenUnencrypted: false,
    shouldMerge: false
  }

  const response = await fetch(
    "https://www.youtube.com/youtubei/v1/feedback?prettyPrint=false",
    {
      method: "POST",
      headers: {
        Cookie: cookie,
        Authorization: sapisidhash,
        "X-Origin": ORIGIN,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html"
      },
      body: JSON.stringify(postData),
      agent
    }
  )

  const responseText = await response.text()
  return `${responseText} || Send`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { cookie, channel, react, proxy } = req.body

    if (!cookie || !channel || !react) {
      return res.status(400).json({ error: "Cookie, channel and react are required" })
    }

    if (typeof react !== "number" || react < 1 || react > 5) {
      return res.status(400).json({ error: "React must be a number between 1 and 5" })
    }

    const tokens = await getFeedbackTokens(cookie, channel, proxy)
    if (tokens.length === 0) {
      return res.status(404).json({ error: "No feedback tokens found" })
    }

    const sapisidhash = createSapisidHash(cookie)
    if (!sapisidhash) {
      return res.status(400).json({ error: "SAPISID cookie not found" })
    }

    // Выбираем токен на основе значения react
    const tokenToUse = tokens[react - 1] || tokens[Math.floor(Math.random() * tokens.length)]
    const response = await sendReact(cookie, sapisidhash, tokenToUse, proxy)

    console.log("React sent successfully:", {
      channel,
      react,
      proxy: proxy ? "used" : "not used"
    })

    return res.status(200).json({
      response,
      proxy: proxy ? {
        used: true,
        address: proxy.split(':')[0],
        port: proxy.split(':')[1]
      } : {
        used: false
      }
    })
  } catch (error) {
    console.error("Send react error:", error)
    return res.status(500).json({ error: "Failed to send react" })
  }
} 