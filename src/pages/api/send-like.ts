import { NextApiRequest, NextApiResponse } from "next"
import { HttpsProxyAgent } from "https-proxy-agent"
import fetch from "node-fetch"
import crypto from "crypto"

const ORIGIN = "https://www.youtube.com"
const API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"

function createSapisidHash(cookie: string): string | null {
  const sapisidMatch = cookie.match(/3PAPISID=(.*?);/u)
  if (!sapisidMatch) return null

  const sapisid = sapisidMatch[1]
  const timestamp = Math.floor(Date.now() / 1000)
  const strToHash = `${timestamp} ${sapisid} ${ORIGIN}`
  const hash = crypto.createHash("sha1").update(strToHash).digest("hex")

  return `SAPISIDHASH ${timestamp}_${hash}`
}

async function sendLike(
  cookie: string,
  channelId: string,
  sapisidhash: string,
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
        clientVersion: "2.20220325.00.00"
      }
    },
    target: {
      videoId: channelId
    }
  }

  const response = await fetch(
    `https://www.youtube.com/youtubei/v1/like/like?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "accept": "*/*",
        "accept-language": "ru",
        "authorization": sapisidhash,
        "content-type": "application/json",
        "cookie": cookie,
        "host": "www.youtube.com",
        "x-goog-authuser": "0",
        "x-goog-visitor-id": "CgtjZXRTRmRmM203USikjOKPBg%3D%3D",
        "x-origin": ORIGIN,
        "x-youtube-client-name": "1",
        "x-youtube-client-version": "2.20220127.09.00",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36 Edg/97.0.1072.76"
      },
      body: JSON.stringify(postData),
      agent
    }
  )

  const responseText = await response.text()
  return responseText.includes("Like_rid") ? "Like complete" : "FAIL"
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { cookie, channelId, proxy } = req.body

    if (!cookie || !channelId) {
      return res.status(400).json({ error: "Cookie and channel ID are required" })
    }

    const sapisidhash = createSapisidHash(cookie)
    if (!sapisidhash) {
      return res.status(400).json({ error: "SAPISID cookie not found" })
    }

    const response = await sendLike(cookie, channelId, sapisidhash, proxy)

    console.log("Like sent successfully:", {
      channelId,
      response,
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
    console.error("Send like error:", error)
    return res.status(500).json({ error: "Failed to send like" })
  }
} 