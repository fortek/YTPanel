import { NextApiRequest, NextApiResponse } from "next"
import { ensureConnection } from "@/lib/redis-utils"
import redisClient from "@/lib/redis"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { list, cookie, email } = req.body

    if (!list || !cookie || !email) {
      return res.status(400).json({
        error: "Missing required parameters",
        details: {
          list: !list ? "List name is required" : undefined,
          cookie: !cookie ? "Cookie value is required" : undefined,
          email: !email ? "Email is required" : undefined
        }
      })
    }

    const isConnected = await ensureConnection()
    if (!isConnected) {
      return res.status(500).json({ error: "Failed to connect to Redis" })
    }

    const listKey = `list:${list}`
    const listInfo = await redisClient.hGetAll(listKey)

    if (!listInfo || !listInfo.total) {
      return res.status(404).json({ error: "List not found" })
    }

    const total = parseInt(listInfo.total)
    let found = false

    for (let i = 0; i < total; i++) {
      const cookieKey = `cookies:${list}:${i}`
      const cookieData = await redisClient.hGetAll(cookieKey)
      if (cookieData.email === email) {
        await redisClient.hSet(cookieKey, {
          cookie: cookie,
          email: email
        })
        found = true
        break
      }
    }

    if (found) {
      return res.status(200).json({ message: "Cookie updated for existing email" })
    }

    const newCookieKey = `cookies:${list}:${total}`
    await redisClient.hSet(newCookieKey, {
      cookie: cookie,
      email: email
    })
    await redisClient.hSet(listKey, { total: total + 1 })

    return res.status(200).json({ message: "Cookie added successfully" })
  } catch (error) {
    console.error("Error adding/updating cookie:", error)
    return res.status(500).json({ error: "Failed to add or update cookie" })
  }
} 