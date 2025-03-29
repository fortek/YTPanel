import { NextApiRequest, NextApiResponse } from "next"
import { getCookiesFromRedis } from "@/lib/redis-utils"

export const config = {
  api: {
    responseLimit: '1024mb'
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { id } = req.query
    if (typeof id !== "string") {
      return res.status(400).json({ message: "Invalid list ID" })
    }

    const list = await getCookiesFromRedis(id)
    if (!list) {
      return res.status(404).json({ message: "List not found" })
    }

    // Формируем содержимое файла
    const fileContent = list.cookies.map(cookie => 
      `${cookie.cookie}${cookie.email ? `|${cookie.email}` : ''}`
    ).join('\n')

    res.setHeader("Content-Type", "text/plain")
    res.setHeader("Content-Disposition", `attachment; filename="${list.name}.txt"`)
    res.send(fileContent)
  } catch (error) {
    console.error("Error downloading list:", error)
    res.status(500).json({ message: "Failed to download list" })
  }
}
