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

async function getCreateCommentParams(
  cookie: string,
  token: string,
  proxy?: string
): Promise<string> {
  let agent = undefined
  if (proxy) {
    const [ip, port, login, password] = proxy.split(":")
    const proxyUrl = `http://${login}:${password}@${ip}:${port}`
    agent = new HttpsProxyAgent(proxyUrl)
  }

  const response = await fetch(
    `https://www.youtube.com/live_chat?continuation=${token}`,
    {
      headers: {
        Cookie: cookie,
        "Content-Type": "text/plain",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      },
      agent
    }
  )

  const html = await response.text()
  const match = html.match(/"sendLiveChatMessageEndpoint":{"params":"([^"]+)"/)
  
  if (!match) {
    throw new Error("Create comment params not found")
  }

  return match[1]
}

async function sendMessage(
  cookie: string,
  sapisidhash: string,
  createCommentParams: string,
  word: string,
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
        clientName: "WEB",
        clientVersion: "2.20240430.06.00"
      }
    },
    params: createCommentParams,
    richMessage: {
      textSegments: [{ text: word }]
    }
  }

  const response = await fetch(
    "https://www.youtube.com/youtubei/v1/live_chat/send_message?prettyPrint=false",
    {
      method: "POST",
      headers: {
        Cookie: cookie,
        Authorization: sapisidhash,
        "X-Origin": ORIGIN,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
      },
      body: JSON.stringify(postData),
      agent
    }
  )

  const data = await response.json()
  
  if (!data?.responseContext?.visitorData) {
    throw new Error("Visitor data not found in response")
  }

  return data.responseContext.visitorData
}

async function getChatId(videoId: string, proxy?: string): Promise<string> {
  let agent = undefined
  if (proxy) {
    const [ip, port, login, password] = proxy.split(":")
    const proxyUrl = `http://${login}:${password}@${ip}:${port}`
    agent = new HttpsProxyAgent(proxyUrl)
  }

  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    },
    agent
  })

  const html = await response.text()
  const match = html.match(/"reloadContinuationData":{"continuation":"([^"]+)"/)
  
  if (!match) {
    throw new Error("Chat ID not found")
  }

  return match[1]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { cookie, word, token, videoId, proxy } = req.body

    if (!cookie || !word) {
      return res.status(400).json({ error: "Cookie and word are required" })
    }

    let chatToken = token
    if (!chatToken && !videoId) {
      return res.status(400).json({ error: "Either token or videoId is required" })
    }

    if (!chatToken && videoId) {
      chatToken = await getChatId(videoId, proxy)
    }

    const sapisidhash = createSapisidHash(cookie)
    if (!sapisidhash) {
      return res.status(400).json({ error: "SAPISID cookie not found" })
    }

    const createCommentParams = await getCreateCommentParams(cookie, chatToken, proxy)
    const visitorData = await sendMessage(cookie, sapisidhash, createCommentParams, word, proxy)

    console.log("Message sent successfully:", {
      word,
      visitorData,
      proxy: proxy ? "used" : "not used"
    })

    return res.status(200).json({
      visitorData,
      proxy: proxy ? {
        used: true,
        address: proxy.split(':')[0],
        port: proxy.split(':')[1]
      } : {
        used: false
      }
    })
  } catch (error) {
    console.error("Send message error:", error)
    return res.status(500).json({ error: "Failed to send message" })
  }
} 