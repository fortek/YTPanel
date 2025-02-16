
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

const LISTS_DIR = path.join(process.cwd(), "data", "lists")

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!fs.existsSync(LISTS_DIR)) {
      fs.mkdirSync(LISTS_DIR, { recursive: true })
    }

    switch (req.method) {
      case "GET":
        return getLists(req, res)
      case "POST":
        return createList(req, res)
      default:
        return res.status(405).json({ error: "Method not allowed" })
    }
  } catch (error) {
    console.error("Error accessing lists directory:", error)
    return res.status(500).json({ error: "Server configuration error" })
  }
}

async function getLists(req: NextApiRequest, res: NextApiResponse) {
  try {
    const files = fs.readdirSync(LISTS_DIR)
    const lists = files
      .filter(file => file.endsWith(".json"))
      .map(file => {
        const content = fs.readFileSync(path.join(LISTS_DIR, file), "utf-8")
        return JSON.parse(content)
      })
    
    return res.status(200).json(lists)
  } catch (error) {
    console.error("Error reading lists:", error)
    return res.status(500).json({ error: "Failed to read lists" })
  }
}

async function createList(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, accounts } = req.body
    
    if (!name || !accounts) {
      return res.status(400).json({ error: "Name and accounts are required" })
    }

    const listId = Date.now().toString()
    const list = {
      id: listId,
      name,
      accounts,
      createdAt: new Date().toISOString()
    }

    const filePath = path.join(LISTS_DIR, `${listId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2))

    return res.status(201).json(list)
  } catch (error) {
    console.error("Error creating list:", error)
    return res.status(500).json({ error: "Failed to create list" })
  }
}
