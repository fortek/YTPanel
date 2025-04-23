import { NextApiRequest, NextApiResponse } from "next"
import { HttpsProxyAgent } from "https-proxy-agent"
import fetch from "node-fetch"
import crypto from "crypto"

const ORIGIN = "https://www.youtube.com"
const API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"

async function getUserId(cookie: string, proxy?: string): Promise<string> {
  let agent = undefined
  if (proxy) {
    const [ip, port, login, password] = proxy.split(":")
    const proxyUrl = `http://${login}:${password}@${ip}:${port}`
    agent = new HttpsProxyAgent(proxyUrl)
  }

  const response = await fetch("https://www.youtube.com/account", {
    headers: {
      Cookie: cookie,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    },
    agent
  })

  const html = await response.text()
  const match = html.match(/"USER_SESSION_ID":\s*"(\d+)"/)
  
  if (!match) {
    throw new Error("User ID not found")
  }

  return match[1]
}

function createSapisidHash(cookie: string, userid: string): string | null {
  const sapisidMatch = cookie.match(/SAPISID=(\S+?);/)
  if (!sapisidMatch) return null

  const sapisid = sapisidMatch[1]
  const timestamp = Math.floor(Date.now() / 1000)
  const strToHash = `${userid} ${timestamp} ${sapisid} ${ORIGIN}`
  const hash = crypto.createHash("sha1").update(strToHash).digest("hex")

  return `SAPISIDHASH ${timestamp}_${hash}_u`
}

async function getCommentParams(
  cookie: string,
  sapisidhash: string,
  token: string,
  proxy?: string
): Promise<{ createCommentParams: string }> {
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
        clientVersion: "2.20250417.01.00"
      }
    },
    continuation: token
  }

  const url = `https://www.youtube.com/youtubei/v1/next?key=${API_KEY}&prettyPrint=false`
  console.log("Request URL:", url)
  console.log("Request Headers:", {
    Cookie: cookie,
    Authorization: sapisidhash,
    "X-Origin": ORIGIN,
    "Content-Type": "text/plain"
  })
  console.log("Request Body:", JSON.stringify(postData))

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Cookie: cookie,
      Authorization: sapisidhash,
      "X-Origin": ORIGIN,
      "Content-Type": "text/plain"
    },
    body: JSON.stringify(postData),
    agent
  })

  const responseText = await response.text()
  
  // Ищем createCommentParams в тексте ответа
  const createCommentParamsMatch = responseText.match(/"createCommentParams":"([^"]+)"/)
  if (!createCommentParamsMatch) {
    throw new Error("Create comment params not found")
  }
  const createCommentParams = createCommentParamsMatch[1]

  return {
    createCommentParams
  }
}

async function sendComment(
  cookie: string,
  sapisidhash: string,
  userid: string,
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
        clientVersion: "2.20231106.07.00"
      }
    },
    createCommentParams,
    commentText: word
  }

  const response = await fetch(
    `https://www.youtube.com/youtubei/v1/comment/create_comment?key=${API_KEY}&prettyPrint=false`,
    {
      method: "POST",
      headers: {
        Cookie: cookie,
        Authorization: sapisidhash,
        "X-Origin": ORIGIN,
        "Content-Type": "text/plain"
      },
      body: JSON.stringify(postData),
      agent
    }
  )

  return `Send (${userid}) (${createCommentParams}) (${sapisidhash})`
}

async function getCommentId(videoId: string, proxy?: string): Promise<string> {
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
  const tokenMatch = html.match(/"continuationItemRenderer":\s*({.+?})\s*}\s*],\s*"trackingParams"/)
  
  if (!tokenMatch || !tokenMatch[1]) {
    throw new Error("Comment token not found")
  }

  try {
    const jsonSection = JSON.parse(tokenMatch[1])
    const commentToken = jsonSection?.continuationEndpoint?.continuationCommand?.token

    if (!commentToken) {
      throw new Error("Comment token not found in parsed data")
    }

    return commentToken
  } catch (parseError) {
    console.error("Error parsing JSON section:", parseError)
    throw new Error("Failed to parse comment token data")
  }
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

    let commentToken = token
    if (!commentToken && !videoId) {
      return res.status(400).json({ error: "Either token or videoId is required" })
    }

    if (!commentToken && videoId) {
      commentToken = await getCommentId(videoId, proxy)
    }

    const userid = await getUserId(cookie, proxy)
    const sapisidhash = createSapisidHash(cookie, userid)
    if (!sapisidhash) {
      return res.status(400).json({ error: "SAPISID cookie not found" })
    }

    const { createCommentParams } = await getCommentParams(cookie, sapisidhash, commentToken, proxy)
    const response = await sendComment(cookie, sapisidhash, userid, createCommentParams, word, proxy)

    console.log("Comment sent successfully:", {
      word,
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
    console.error("Send comment error:", error)
    return res.status(500).json({ error: "Failed to send comment" })
  }
} 