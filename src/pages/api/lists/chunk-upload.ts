import { NextApiRequest, NextApiResponse } from "next"
import { pool } from "@/lib/mysql-config"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    },
    responseLimit: '50mb'
  },
}

const ensureTablesExist = async () => {
  const connection = await pool.getConnection()
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cookie_lists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE,
        total INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cookies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        list_id INT,
        email VARCHAR(255),
        cookie TEXT,
        FOREIGN KEY (list_id) REFERENCES cookie_lists(id)
      )
    `)
  } finally {
    connection.release()
  }
}

// Сохраняем строки чанка сразу в основную таблицу
const saveChunkToMySQL = async (name: string, chunk: string, chunkIndex: number, isFirst: boolean) => {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // Если это первый чанк — удаляем старый список и создаём новый
    if (isFirst) {
      const [lists] = await connection.query('SELECT id FROM cookie_lists WHERE name = ?', [name])
      if ((lists as any[]).length) {
        const listId = (lists as any[])[0].id
        await connection.query('DELETE FROM cookies WHERE list_id = ?', [listId])
        await connection.query('DELETE FROM cookie_lists WHERE id = ?', [listId])
      }
      await connection.query('INSERT INTO cookie_lists (name, total) VALUES (?, ?)', [name, 0])
    }

    // Получаем id списка
    const [lists2] = await connection.query('SELECT id FROM cookie_lists WHERE name = ?', [name])
    if (!(lists2 as any[]).length) throw new Error('List not found after insert')
    const listId = (lists2 as any[])[0].id

    // Парсим строки чанка
    const cookies: string[] = []
    const emailsArr: (string|null)[] = []
    const lines = chunk.split('\n').filter((line: string) => line.trim())
    for (const line of lines) {
      const [cookie, email] = line.split('|')
      cookies.push(cookie.trim())
      emailsArr.push(email ? email.trim() : null)
    }
    if (cookies.length) {
      const values = cookies.map((cookie, i) => [listId, emailsArr[i], cookie])
      await connection.query('INSERT INTO cookies (list_id, email, cookie) VALUES ?', [values])
    }

    await connection.commit()
    return cookies.length
  } catch (e) {
    await connection.rollback()
    throw e
  } finally {
    connection.release()
  }
}

const updateTotal = async (name: string) => {
  const connection = await pool.getConnection()
  try {
    const [lists] = await connection.query('SELECT id FROM cookie_lists WHERE name = ?', [name])
    if (!(lists as any[]).length) return
    const listId = (lists as any[])[0].id
    const [rows] = await connection.query('SELECT COUNT(*) as cnt FROM cookies WHERE list_id = ?', [listId])
    const total = (rows as any[])[0].cnt
    await connection.query('UPDATE cookie_lists SET total = ? WHERE id = ?', [total, listId])
  } finally {
    connection.release()
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Метод не разрешен" })
  }

  try {
    await ensureTablesExist()
    const { name, chunk, chunkIndex, isLast } = req.body

    if (!name || chunk === undefined || chunkIndex === undefined) {
      return res.status(400).json({ error: "Не хватает обязательных параметров" })
    }

    if (chunk.length > 50 * 1024 * 1024) {
      return res.status(413).json({ error: "Размер чанка слишком большой" })
    }

    const isFirst = chunkIndex === 0
    await saveChunkToMySQL(name, chunk, chunkIndex, isFirst)

    if (isLast) {
      await updateTotal(name)
      return res.status(200).json({ message: "Список успешно сохранён" })
    }

    return res.status(200).json({ message: "Чанк успешно сохранён" })
  } catch (error) {
    console.error("Ошибка загрузки чанка:", error)
    return res.status(500).json({ error: "Ошибка загрузки чанка" })
  }
} 