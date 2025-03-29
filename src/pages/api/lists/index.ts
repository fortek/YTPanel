import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"
import { getCookiesFromRedis } from "@/lib/redis-utils"
import redisClient, { ensureConnection } from "@/lib/redis"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1024mb'
    },
    responseLimit: '1024mb'
  },
}

const LISTS_DIR = path.join(process.cwd(), "uploaded_cookies")

if (!fs.existsSync(LISTS_DIR)) {
  fs.mkdirSync(LISTS_DIR, { recursive: true })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    await ensureConnection()
    
    // Получаем все ключи списков
    const keys = await redisClient.keys("list:*")
    const lists = []

    // Получаем информацию о каждом списке
    for (const key of keys) {
      const listInfo = await redisClient.hGetAll(key)
      if (listInfo.total) {
        const name = key.split(":")[1]
        lists.push({
          id: name,
          name: name,
          totalCookies: parseInt(listInfo.total),
          createdAt: listInfo.createdAt
        })
      }
    }

    // Сортируем по дате создания (новые сверху)
    lists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return res.status(200).json(lists)
  } catch (error) {
    console.error("Error getting lists:", error)
    return res.status(500).json({ error: "Failed to get lists" })
  }
}

async function getLists(res: NextApiResponse) {
  try {
    if (!fs.existsSync(LISTS_DIR)) {
      return res.status(200).json([])
    }

    const files = fs.readdirSync(LISTS_DIR)
      .filter(file => file.endsWith(".txt") && !file.endsWith("_clean.txt"))
      .map(file => {
        const filePath = path.join(LISTS_DIR, file)
        const stats = fs.statSync(filePath)
        const name = path.parse(file).name
        
        return {
          id: name,
          name,
          createdAt: stats.birthtime
        }
      })

    return res.status(200).json(files)
  } catch (error) {
    console.error("Error reading lists:", error)
    return res.status(500).json({ error: "Failed to read lists" })
  }
}

async function createList(req: NextApiRequest, res: NextApiResponse) {
  if (!req.body) {
    return res.status(400).json({ error: "Request body is required" })
  }

  try {
    const { name, accounts } = req.body

    if (!name || !accounts || !Array.isArray(accounts)) {
      return res.status(400).json({ error: "Name and accounts array are required" })
    }

    const fileName = `${name}.txt`
    const filePath = path.join(LISTS_DIR, fileName)
    const cleanFileName = `${name}_clean.txt`
    const cleanFilePath = path.join(LISTS_DIR, cleanFileName)

    if (fs.existsSync(filePath)) {
      return res.status(400).json({ error: "A list with this name already exists" })
    }

    // Write original file with emails
    fs.writeFileSync(filePath, accounts.join("\n"), "utf-8")

    // Write clean file without emails
    const cleanAccounts = accounts.map(account => {
      const [cookies] = account.split("|")
      return cookies.trim()
    })
    fs.writeFileSync(cleanFilePath, cleanAccounts.join("\n"), "utf-8")

    const stats = fs.statSync(filePath)

    return res.status(201).json({
      id: name,
      name,
      createdAt: stats.birthtime
    })
  } catch (error) {
    console.error("Error creating list:", error)
    return res.status(500).json({ error: "Failed to create list" })
  }
}
