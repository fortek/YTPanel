import { NextApiRequest, NextApiResponse } from "next"
import { pool } from "@/lib/mysql-config"

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

      // Проверяем существование email
      const [existing] = await connection.query(
        'SELECT id FROM cookies WHERE list_id = ? AND email = ?',
        [listId, email]
      )

      if ((existing as any[]).length > 0) {
        // Обновляем существующую запись
        await connection.query(
          'UPDATE cookies SET cookie = ? WHERE list_id = ? AND email = ?',
          [cookie, listId, email]
        )
      } else {
        // Добавляем новую запись
        await connection.query(
          'INSERT INTO cookies (list_id, email, cookie) VALUES (?, ?, ?)',
          [listId, email, cookie]
        )

        // Обновляем счетчик в списке
        await connection.query(
          'UPDATE cookie_lists SET total = total + 1 WHERE id = ?',
          [listId]
        )
      }

      await connection.commit()
      return res.status(200).json({ message: "Cookie added successfully" })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Error adding cookie:", error)
    return res.status(500).json({ error: "Failed to add cookie" })
  }
} 