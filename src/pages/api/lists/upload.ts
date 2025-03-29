import { NextApiRequest, NextApiResponse } from "next"
import { saveCookiesToRedis } from "@/lib/redis-utils"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1024mb'
    },
    responseLimit: '1024mb'
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" })
  }

  try {
    const { name, content } = req.body

    if (!name || !content) {
      return res.status(400).json({ error: "Нужно имя списка и содержимое файла" })
    }

    // Разбиваем содержимое на строки и обрабатываем каждую строку
    const lines = content.split("\n").filter((line: string) => line.trim())
    const cookies: string[] = []
    const emails: (string | null)[] = []

    for (const line of lines) {
      const [cookie, email] = line.split("|")
      cookies.push(cookie.trim())
      emails.push(email ? email.trim() : null)
    }

    // Сохраняем в Redis
    const success = await saveCookiesToRedis({
      name,
      cookies,
      emails
    })

    if (!success) {
      throw new Error("Не удалось сохранить cookies в Redis")
    }

    return res.status(200).json({ 
      success: true,
      message: `Список ${name} создан с ${cookies.length} cookies`,
      total: cookies.length,
      id: name
    })
  } catch (error) {
    console.error("Ошибка загрузки:", error)
    return res.status(500).json({ error: "Не удалось загрузить cookies" })
  }
} 