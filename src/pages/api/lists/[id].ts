import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"
import { getCookiesFromRedis, deleteListFromRedis, renameListInRedis } from "@/lib/redis-utils"

export const config = {
  api: {
    responseLimit: '1024mb',
    bodyParser: {
      sizeLimit: '1024mb'
    },
  },
}

const LISTS_DIR = path.join(process.cwd(), "uploaded_cookies")

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 10000

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid list ID" })
  }

  switch (req.method) {
    case "GET":
      try {
        const list = await getCookiesFromRedis(id)
        
        if (!list) {
          return res.status(404).json({ error: "List not found" })
        }

        // Вычисляем диапазон для текущей страницы
        const start = (page - 1) * pageSize
        const end = Math.min(start + pageSize, list.cookies.length)
        const pageData = list.cookies.slice(start, end)

        // Форматируем данные для фронтенда
        const formattedList = {
          id,
          name: list.name,
          createdAt: list.createdAt,
          total: list.total,
          pagination: {
            page,
            pageSize,
            totalPages: Math.ceil(list.total / pageSize),
            hasMore: end < list.total
          },
          accounts: pageData.map(cookie => 
            `${cookie.cookie}${cookie.email ? `|${cookie.email}` : ''}`
          )
        }

        return res.status(200).json(formattedList)
      } catch (error) {
        console.error("Error getting list:", error)
        return res.status(500).json({ error: "Failed to get list" })
      }

    case "PATCH":
      try {
        const { name } = req.body
        if (!name) {
          return res.status(400).json({ error: "New name is required" })
        }

        const success = await renameListInRedis(id, name)
        if (!success) {
          return res.status(404).json({ error: "List not found or rename failed" })
        }

        return res.status(200).json({ id: name, name })
      } catch (error) {
        console.error("Error renaming list:", error)
        return res.status(500).json({ error: "Failed to rename list" })
      }

    case "DELETE":
      try {
        const success = await deleteListFromRedis(id)
        if (!success) {
          return res.status(404).json({ error: "List not found or delete failed" })
        }

        return res.status(200).json({ success: true })
      } catch (error) {
        console.error("Error deleting list:", error)
        return res.status(500).json({ error: "Failed to delete list" })
      }

    default:
      return res.status(405).json({ error: "Method not allowed" })
  }
}

async function getList(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const filePath = path.join(LISTS_DIR, `${id}.txt`)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "List not found" })
    }

    const stats = fs.statSync(filePath)
    const content = fs.readFileSync(filePath, "utf-8")
    const allAccounts = content.split("\n").filter(Boolean)
    
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10000
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const accounts = allAccounts.slice(start, end)
    
    return res.status(200).json({
      id,
      name: id,
      createdAt: stats.birthtime,
      accounts,
      pagination: {
        total: allAccounts.length,
        page,
        pageSize,
        hasMore: end < allAccounts.length
      }
    })
  } catch (error) {
    console.error("Error reading list:", error)
    return res.status(500).json({ error: "Failed to read list" })
  }
}

async function renameList(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name } = req.body
    if (!name) {
      return res.status(400).json({ error: "Name is required" })
    }

    const oldPath = path.join(LISTS_DIR, `${id}.txt`)
    const newPath = path.join(LISTS_DIR, `${name}.txt`)
    const oldCleanPath = path.join(LISTS_DIR, `${id}_clean.txt`)
    const newCleanPath = path.join(LISTS_DIR, `${name}_clean.txt`)

    if (!fs.existsSync(oldPath)) {
      return res.status(404).json({ error: "List not found" })
    }

    // Rename main file
    fs.renameSync(oldPath, newPath)

    // Rename clean file if it exists
    if (fs.existsSync(oldCleanPath)) {
      fs.renameSync(oldCleanPath, newCleanPath)
    }

    const stats = fs.statSync(newPath)
    const content = fs.readFileSync(newPath, "utf-8")
    const accounts = content.split("\n").filter(Boolean)

    return res.status(200).json({
      id: name,
      name,
      createdAt: stats.birthtime,
      accounts
    })
  } catch (error) {
    console.error("Error renaming list:", error)
    return res.status(500).json({ error: "Failed to rename list" })
  }
}

async function deleteList(id: string, res: NextApiResponse) {
  try {
    const filePath = path.join(LISTS_DIR, `${id}.txt`)
    const cleanFilePath = path.join(LISTS_DIR, `${id}_clean.txt`)
    
    // Delete main file if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Delete clean file if exists
    if (fs.existsSync(cleanFilePath)) {
      fs.unlinkSync(cleanFilePath)
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error deleting list:", error)
    return res.status(500).json({ error: "Failed to delete list" })
  }
}
