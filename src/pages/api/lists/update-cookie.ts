import { NextApiRequest, NextApiResponse } from "next"
import { pool } from "@/lib/mysql-config"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { list, newCookie, email } = req.body

    if (!list || !newCookie || !email) {
      return res.status(400).json({ 
        error: "Missing required parameters",
        details: {
          list: !list ? "List name is required" : undefined,
          newCookie: !newCookie ? "New cookie value is required" : undefined,
          email: !email ? "Email is required" : undefined
        }
      })
    }

    const connection = await pool.getConnection()
    
    try {
      await connection.beginTransaction()

      // Получаем ID списка
      const [lists] = await connection.query(
        'SELECT id FROM cookie_lists WHERE name = ?',
        [list]
      )

      if (!(lists as any[]).length) {
        return res.status(404).json({ error: "List not found" })
      }

      const listId = (lists as any[])[0].id

      // Обновляем куки
      const [result] = await connection.query(
        'UPDATE cookies SET cookie = ? WHERE list_id = ? AND email = ?',
        [newCookie, listId, email]
      )

      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ error: "Cookie not found" })
      }

      await connection.commit()
      return res.status(200).json({ message: "Cookie updated successfully" })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error updating cookie:", error)
    return res.status(500).json({ error: "Failed to update cookie" })
  }
}
