
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

const LISTS_DIR = path.join(process.cwd(), "uploaded_cookies")

// Ensure directory exists
if (!fs.existsSync(LISTS_DIR)) {
  fs.mkdirSync(LISTS_DIR, { recursive: true })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      return getLists(res)
    case "POST":
      return createList(req, res)
    default:
      return res.status(405).json({ error: "Method not allowed" })
  }
}

async function getLists(res: NextApiResponse) {
  try {
    if (!fs.existsSync(LISTS_DIR)) {
      return res.status(200).json([])
    }

    const files = fs.readdirSync(LISTS_DIR)
      .filter(file => file.endsWith(".txt"))
      .map(file => {
        const filePath = path.join(LISTS_DIR, file)
        const stats = fs.statSync(filePath)
        const content = fs.readFileSync(filePath, "utf-8")
        const accounts = content.split("\n").filter(Boolean)
        const id = path.parse(file).name
        
        return {
          id,
          name: id,
          createdAt: stats.birthtime,
          accounts
        }
      })

    return res.status(200).json(files)
  } catch (error) {
    console.error("Error reading lists:", error)
    return res.status(500).json({ error: "Failed to read lists" })
  }
}

async function createList(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, accounts } = req.body
    if (!name || !accounts || !Array.isArray(accounts)) {
      return res.status(400).json({ error: "Name and accounts array are required" })
    }

    const id = Date.now().toString()
    const fileName = `${id}.txt`
    const filePath = path.join(LISTS_DIR, fileName)

    // Save accounts to file
    fs.writeFileSync(filePath, accounts.join("\n"), "utf-8")

    const stats = fs.statSync(filePath)
    const newList = {
      id,
      name: id,
      createdAt: stats.birthtime,
      accounts
    }

    return res.status(201).json(newList)
  } catch (error) {
    console.error("Error creating list:", error)
    return res.status(500).json({ error: "Failed to create list" })
  }
}
