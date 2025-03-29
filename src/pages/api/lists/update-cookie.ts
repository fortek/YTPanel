import { NextApiRequest, NextApiResponse } from "next"
import { ensureConnection } from "@/lib/redis-utils"
import redisClient from "@/lib/redis"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    // Логируем данные запроса
    console.log("Update Cookie Request:", {
      method: req.method,
      url: req.url,
      body: {
        list: req.body.list,
        newCookie: req.body.newCookie ? `[length: ${req.body.newCookie.length}]` : undefined,
        email: req.body.email
      },
      headers: {
        "content-type": req.headers["content-type"],
        "user-agent": req.headers["user-agent"]
      }
    })

    const isConnected = await ensureConnection()
    if (!isConnected) {
      console.error("Redis connection failed")
      return res.status(500).json({ error: "Failed to connect to Redis" })
    }
    
    const { list, newCookie, email } = req.body

    if (!list || !newCookie || !email) {
      console.warn("Missing required fields:", { 
        list, 
        newCookie: newCookie ? `[length: ${newCookie.length}]` : undefined, 
        email 
      })
      return res.status(400).json({ 
        error: "Missing required parameters",
        details: {
          list: !list ? "List name is required" : undefined,
          newCookie: !newCookie ? "New cookie value is required" : undefined,
          email: !email ? "Email is required" : undefined
        }
      })
    }

    // Получаем информацию о списке
    const listKey = `list:${list}`
    const listInfo = await redisClient.hGetAll(listKey)
    
    if (!listInfo || !listInfo.total) {
      console.warn("List not found:", { listKey })
      return res.status(404).json({ error: "List not found" })
    }

    const total = parseInt(listInfo.total)
    let found = false

    // Ищем запись с нужным email
    for (let i = 0; i < total; i++) {
      const cookieKey = `cookies:${list}:${i}`
      const cookieData = await redisClient.hGetAll(cookieKey)
      
      if (cookieData.email === email) {
        // Обновляем cookie
        await redisClient.hSet(cookieKey, {
          cookie: newCookie,
          email: email
        })
        found = true
        console.log("Cookie updated successfully:", { 
          cookieKey, 
          email,
          cookieLength: newCookie.length
        })
        break
      }
    }

    if (!found) {
      console.warn("Email not found in list:", { list, email })
      return res.status(404).json({ error: "Email not found in list" })
    }

    // Логируем успешный ответ
    console.log("Update Cookie Response:", {
      status: 200,
      message: "Cookie updated successfully",
      data: {
        list,
        email,
        cookieLength: newCookie.length
      }
    })

    return res.status(200).json({ message: "Cookie updated successfully" })
  } catch (error) {
    console.error("Error updating cookie:", error)
    return res.status(500).json({ error: "Failed to update cookie" })
  }
}
