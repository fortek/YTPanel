import { NextApiRequest, NextApiResponse } from "next"
import { deleteListFromMySQL, renameListInMySQL } from "@/lib/mysql-utils"
import { pool } from "@/lib/mysql-config"

export const config = {
  api: {
    responseLimit: '1024mb',
    bodyParser: {
      sizeLimit: '1024mb'
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: "List ID is required" })
  }

  if (req.method === "GET") {
    try {
      const connection = await pool.getConnection()
      try {
        const [lists] = await connection.query('SELECT id, name, created_at, total FROM cookie_lists WHERE id = ? OR name = ?', [id, id])
        if (!(lists as any[]).length) {
          return res.status(404).json({ error: "List not found" })
        }
        const list = (lists as any[])[0]
        const [cookies] = await connection.query('SELECT email, cookie FROM cookies WHERE list_id = ?', [list.id])
        return res.status(200).json({
          id: list.id,
          name: list.name,
          createdAt: list.created_at,
          total: list.total,
          accounts: (cookies as any[]).map((row: any) => row.email ? `${row.cookie}|${row.email}` : row.cookie)
        })
      } finally {
        connection.release()
      }
    } catch (error) {
      console.error("Error getting list:", error)
      return res.status(500).json({ error: "Failed to get list" })
    }
  }

  if (req.method === "DELETE") {
    try {
      const success = await deleteListFromMySQL(id)
      
      if (!success) {
        return res.status(404).json({ error: "List not found" })
      }

      return res.status(200).json({ message: "List deleted successfully" })
    } catch (error) {
      console.error("Error deleting list:", error)
      return res.status(500).json({ error: "Failed to delete list" })
    }
  }

  if (req.method === "PUT") {
    try {
      const { newName } = req.body

      if (!newName || typeof newName !== 'string') {
        return res.status(400).json({ error: "New name is required" })
      }

      const success = await renameListInMySQL(id, newName)
      
      if (!success) {
        return res.status(404).json({ error: "List not found" })
      }

      return res.status(200).json({ message: "List renamed successfully" })
    } catch (error) {
      console.error("Error renaming list:", error)
      return res.status(500).json({ error: "Failed to rename list" })
    }
  }

  if (req.method === "PATCH") {
    try {
      const { name } = req.body
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: "New name is required" })
      }
      const success = await renameListInMySQL(id, name)
      if (!success) {
        return res.status(404).json({ error: "List not found" })
      }
      return res.status(200).json({ message: "List renamed successfully" })
    } catch (error) {
      console.error("Error renaming list (PATCH):", error)
      return res.status(500).json({ error: "Failed to rename list" })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
