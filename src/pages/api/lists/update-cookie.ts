import { NextApiRequest, NextApiResponse } from "next"
import connectDB from "@/lib/mongodb"
import { CookieList } from "@/models/CookieList"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: false
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { fileName, email, newCookie } = req.body

  if (!fileName || !email || !newCookie) {
    return res.status(400).json({ error: "Missing required parameters" })
  }

  try {
    await connectDB()

    // Находим список по имени файла
    const list = await CookieList.findOne({ name: fileName })
    if (!list) {
      return res.status(404).json({ error: "List not found" })
    }

    // Находим индекс cookie для обновления
    const cookieIndex = list.cookies.findIndex((c: { email: string }) => c.email === email)
    if (cookieIndex === -1) {
      return res.status(404).json({ error: "Email not found in list" })
    }

    // Обновляем cookie
    list.cookies[cookieIndex].cookie = newCookie
    list.cookies[cookieIndex].updatedAt = new Date()
    
    // Обновляем чистый список
    list.cleanCookies[cookieIndex] = newCookie
    list.updatedAt = new Date()

    // Сохраняем изменения
    await list.save()

    return res.status(200).json({ message: "Cookie updated successfully" })
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error processing request:`, error)
    return res.status(500).json({ error: "Failed to update cookie" })
  }
}