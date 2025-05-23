import { NextApiRequest, NextApiResponse } from "next"
import { pool } from "@/lib/mysql-config"

export const config = {
  api: {
    responseLimit: false
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
    const includeEmail = req.query.includeEmail !== "false"
    const connection = await pool.getConnection()
    try {
      // Получаем id списка
      const [lists] = await connection.query('SELECT id, name FROM cookie_lists WHERE id = ? OR name = ?', [id, id])
      if (!(lists as any[]).length) {
        return res.status(404).json({ message: "List not found" })
      }
      const list = (lists as any[])[0]
      // Получаем все cookies
      const [cookies] = await connection.query('SELECT cookie, email FROM cookies WHERE list_id = ?', [list.id])
      // Формируем строки
      const lines = (cookies as any[]).map(row =>
        includeEmail
          ? `${row.cookie}${row.email ? `|${row.email}` : ''}`
          : row.cookie
      ).join('\n')
      // Заголовки для скачивания
      res.setHeader("Content-Type", "text/plain")
      res.setHeader("Content-Disposition", `attachment; filename=\"${list.name}${includeEmail ? '_with_email' : ''}.txt\"`)
      res.status(200).send(lines)
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error downloading list:", error)
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to download list" })
    }
    res.end()
  }
}
