import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

const PROXIES_DIR = path.join(process.cwd(), "data", "proxies")

// Создаем директорию, если она не существует
if (!fs.existsSync(PROXIES_DIR)) {
  fs.mkdirSync(PROXIES_DIR, { recursive: true })
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1gb",
    },
    responseLimit: false,
  },
}

// Функция для проверки формата прокси
function isValidProxy(proxy: string): boolean {
  const parts = proxy.split(":")
  if (parts.length !== 4) return false
  
  // Проверяем IP
  const ipParts = parts[0].split(".")
  if (ipParts.length !== 4) return false
  if (!ipParts.every(part => {
    const num = parseInt(part)
    return !isNaN(num) && num >= 0 && num <= 255
  })) return false
  
  // Проверяем порт
  const port = parseInt(parts[1])
  if (isNaN(port) || port < 1 || port > 65535) return false
  
  // Проверяем логин и пароль
  return parts[2].length > 0 && parts[3].length > 0
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const files = fs.readdirSync(PROXIES_DIR)
      const lists = files.map(file => {
        const stats = fs.statSync(path.join(PROXIES_DIR, file))
        return {
          id: path.parse(file).name,
          name: path.parse(file).name,
          createdAt: stats.mtime,
        }
      })
      res.status(200).json(lists)
    } catch (error) {
      console.error("Error reading proxy lists:", error)
      res.status(500).json({ error: "Failed to read proxy lists" })
    }
  } else if (req.method === "POST") {
    try {
      const { name, proxies } = req.body

      if (!name || !proxies || !Array.isArray(proxies)) {
        return res.status(400).json({ error: "Invalid request data" })
      }

      // Проверяем формат прокси
      const validProxies = proxies.filter(proxy => {
        const trimmedProxy = proxy.trim()
        return trimmedProxy.length > 0 && isValidProxy(trimmedProxy)
      })

      if (validProxies.length === 0) {
        return res.status(400).json({ error: "No valid proxies found" })
      }

      const id = uuidv4()
      const filePath = path.join(PROXIES_DIR, `${id}.txt`)

      // Проверяем, не существует ли уже список с таким именем
      const existingFiles = fs.readdirSync(PROXIES_DIR)
      const existingList = existingFiles.find(file => {
        try {
          const content = fs.readFileSync(path.join(PROXIES_DIR, file), "utf-8")
          const lines = content.split("\n")
          const firstLine = lines[0]
          return firstLine.startsWith(`# ${name}`)
        } catch (error) {
          console.error("Error checking existing list:", error)
          return false
        }
      })

      if (existingList) {
        return res.status(400).json({ error: "List with this name already exists" })
      }

      // Сохраняем список с именем в первой строке
      const content = `# ${name}\n${validProxies.join("\n")}`
      fs.writeFileSync(filePath, content)

      res.status(201).json({
        id,
        name,
        proxies: validProxies,
        createdAt: new Date(),
      })
    } catch (error) {
      console.error("Error creating proxy list:", error)
      res.status(500).json({ error: "Failed to create proxy list" })
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"])
    res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
} 