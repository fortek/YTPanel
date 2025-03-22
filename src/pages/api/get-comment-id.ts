import { NextApiRequest, NextApiResponse } from 'next'
import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'

async function testProxy(proxyString: string): Promise<boolean> {
  try {
    const [host, port, username, password] = proxyString.split(':')
    const proxyUrl = `http://${username}:${password}@${host}:${port}`
    const agent = new HttpsProxyAgent(proxyUrl)

    const response = await fetch('https://www.youtube.com', {
      agent,
      timeout: 10000
    })

    return response.status === 200
  } catch (error) {
    return false
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { videoId, proxy } = req.body

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' })
  }

  let agent
  if (proxy) {
    const proxyValid = /^([^:]+):(\d+):([^:]+):([^:]+)$/.test(proxy)
    if (!proxyValid) {
      return res.status(400).json({ error: 'Invalid proxy format. Expected: IP:PORT:LOGIN:PASSWORD' })
    }

    const proxyWorks = await testProxy(proxy)
    if (!proxyWorks) {
      return res.status(400).json({ error: 'Proxy is not working or not responding' })
    }

    const [host, port, username, password] = proxy.split(':')
    const proxyUrl = `http://${username}:${password}@${host}:${port}`
    agent = new HttpsProxyAgent(proxyUrl)
  }

  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    const url = `https://www.youtube.com/watch?v=${videoId}`

    const response = await fetch(url, {
      agent,
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch video page: ${response.status}`)
    }

    const html = await response.text()
    
    // Ищем токен комментариев в HTML
    const tokenMatch = html.match(/"continuationItemRenderer":\s*({.+?})\s*}\s*],\s*"trackingParams"/)
    
    if (!tokenMatch || !tokenMatch[1]) {
      return res.status(404).json({ error: 'Comment token not found' })
    }

    try {
      const jsonSection = JSON.parse(tokenMatch[1])
      const commentToken = jsonSection?.continuationEndpoint?.continuationCommand?.token

      if (!commentToken) {
        return res.status(404).json({ error: 'Comment token not found in parsed data' })
      }

      return res.status(200).json({
        commentToken,
        proxy: proxy ? {
          used: true,
          address: proxy.split(':')[0],
          port: proxy.split(':')[1]
        } : {
          used: false
        }
      })

    } catch (parseError) {
      console.error('Error parsing JSON section:', parseError)
      return res.status(500).json({ error: 'Failed to parse comment token data' })
    }

  } catch (error) {
    console.error('Error fetching comment token:', error)
    return res.status(500).json({ error: 'Failed to fetch comment token' })
  }
} 