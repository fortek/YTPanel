import { NextApiRequest, NextApiResponse } from "next"
import { pool } from "@/lib/mysql-config"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1024mb'
    },
    responseLimit: '1024mb'
  },
}

function normalizeDate(val: any): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') {
    // Преобразуем 'YYYY-MM-DD HH:mm:ss' в 'YYYY-MM-DDTHH:mm:ss'
    const iso = val.includes(' ') ? val.replace(' ', 'T') : val;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  return new Date().toISOString();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const connection = await pool.getConnection()
      try {
        const [lists] = await connection.query(
          'SELECT id, name, total, created_at FROM cookie_lists ORDER BY created_at DESC'
        )
        const result = (lists as any[]).map(list => {
          const { created_at, ...rest } = list;
          return {
            ...rest,
            createdAt: normalizeDate(created_at)
          }
        })
        return res.status(200).json(result)
      } finally {
        connection.release()
      }
    } catch (error) {
      console.error("Error in GET /api/lists:", error)
      return res.status(500).json({ error: "Internal server error" })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
