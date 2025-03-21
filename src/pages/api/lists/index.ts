
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

export const config = {
  api: {
    bodyParser: false,
  },
}

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
        const name = path.parse(file).name
        
        return {
          id: name,
          name,
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
    let body = ""
    req.on("data", (chunk) => {
      body += chunk.toString()
    })

    req.on("end", () => {
      try {
        const { name, accounts } = JSON.parse(body)
        if (!name || !accounts || !Array.isArray(accounts)) {
          return res.status(400).json({ error: "Name and accounts array are required" })
        }

        const fileName = `${name}.txt`
        const filePath = path.join(LISTS_DIR, fileName)

        // Check if file already exists
        if (fs.existsSync(filePath)) {
          return res.status(400).json({ error: "A list with this name already exists" })
        }

        // Save accounts to file
        fs.writeFileSync(filePath, accounts.join("\n"), "utf-8")

        const stats = fs.statSync(filePath)
        const newList = {
          id: name,
          name,
          createdAt: stats.birthtime,
          accounts
        }

        return res.status(201).json(newList)
      } catch (error) {
        console.error("Error parsing request body:", error)
        return res.status(400).json({ error: "Invalid request body" })
      }
    })
  } catch (error) {
    console.error("Error creating list:", error)
    return res.status(500).json({ error: "Failed to create list" })
  }
}
