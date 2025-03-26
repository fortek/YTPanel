import { NextApiRequest, NextApiResponse } from "next"
import { HttpsProxyAgent } from "https-proxy-agent"
import fetch from "node-fetch"
import crypto from "crypto"

const ORIGIN = "https://www.youtube.com"
const API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"

function createSapisidHash(cookie: string): string | null {
  const sapisidMatch = cookie.match(/SAPISID=(\S+?);/)
  if (!sapisidMatch) return null

  const sapisid = sapisidMatch[1]
  const timestamp = Math.floor(Date.now() / 1000)
  const strToHash = `${timestamp} ${sapisid} ${ORIGIN}`
  const hash = crypto.createHash("sha1").update(strToHash).digest("hex")

  return `SAPISIDHASH ${timestamp}_${hash}`
}

async function getVoteParams(
  cookie: string,
  sapisidhash: string,
  token: string,
  vote: number,
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
        clientVersion: "2.20240122.00.00"
      }
    },
    continuation: token
  }

  const response = await fetch(
    `https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?key=${API_KEY}&prettyPrint=false`,
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

  const data = await response.json()

  if (!data?.continuationContents?.liveChatContinuation?.actions) {
    throw new Error("No actions found in response")
  }

  const actions = data.continuationContents.liveChatContinuation.actions
  const pollAction = actions.find((action: any) => action?.updateLiveChatPollAction)
  
  if (!pollAction?.updateLiveChatPollAction?.pollToUpdate?.pollRenderer?.choices) {
    throw new Error("No poll choices found")
  }

  const choices = pollAction.updateLiveChatPollAction.pollToUpdate.pollRenderer.choices
  const selectedChoice = choices[vote - 1]

  if (!selectedChoice?.selectServiceEndpoint?.sendLiveChatVoteEndpoint?.params) {
    throw new Error("Selected vote choice not found")
  }

  return selectedChoice.selectServiceEndpoint.sendLiveChatVoteEndpoint.params
}

async function sendVote(
  cookie: string,
  videoId: string,
  vote: number,
  sapisidhash: string,
  proxy?: string
): Promise<string> {
  let agent = undefined
  if (proxy) {
    const [ip, port, login, password] = proxy.split(":")
    const proxyUrl = `http://${login}:${password}@${ip}:${port}`
    agent = new HttpsProxyAgent(proxyUrl)
  }

  const voteParams = await getVoteParams(cookie, sapisidhash, videoId, vote, proxy)

  const response = await fetch(
    `https://www.youtube.com/youtubei/v1/live_chat/send_live_chat_vote?key=${API_KEY}&prettyPrint=false`,
    {
      method: "POST",
      headers: {
        Cookie: cookie,
        Authorization: sapisidhash,
        "X-Origin": ORIGIN,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html"
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240122.00.00"
          }
        },
        params: voteParams
      }),
      agent
    }
  )

  return " || Send"
}

async function getVoteId(channel: string, proxy?: string): Promise<string> {
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
      },
      agent
    }
  )

  const html = await response.text()
  const liveChatRendererMatch = html.match(/"liveChatRenderer":\{[\s\S]*?\}\],/)
  
  if (!liveChatRendererMatch) {
    throw new Error("Live chat renderer not found")
  }

  const liveChatRenderer = liveChatRendererMatch[0]
  const continuationMatch = liveChatRenderer.match(/"continuation":"([^"]+)"/)
  
  if (!continuationMatch) {
    throw new Error("Continuation not found")
  }

  return continuationMatch[1]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { cookie, videoId, vote, proxy } = req.body

    if (!cookie || !videoId || !vote) {
      return res.status(400).json({ error: "Cookie, videoId and vote are required" })
    }

    if (typeof vote !== "number") {
      return res.status(400).json({ error: "Vote must be a number" })
    }

    const sapisidhash = createSapisidHash(cookie)
    if (!sapisidhash) {
      return res.status(400).json({ error: "SAPISID cookie not found" })
    }

    const response = await sendVote(cookie, videoId, vote, sapisidhash, proxy)

    console.log("Vote sent successfully:", {
      videoId,
      vote,
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
    console.error("Send vote error:", error)
    return res.status(500).json({ error: "Failed to send vote" })
  }
} 