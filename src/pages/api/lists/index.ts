
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

const LISTS_DIR = path.join(process.cwd(), "data", "lists")
const METADATA_FILE = path.join(LISTS_DIR, "metadata.json")

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!fs.existsSync(LISTS_DIR)) {
      fs.mkdirSync(LISTS_DIR, { recursive: true })
    }

    if (!fs.existsSync(METADATA_FILE)) {
      fs.writeFileSync(METADATA_FILE, JSON.stringify([]), "utf-8")
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
    console.error("Error in lists handler:", error)
    return res.status(500).json({ 
      error: "Server configuration error",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

async function getLists(req: NextApiRequest, res: NextApiResponse) {
  try {
    const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"))
    const lists = metadata.map((list: any) => {
      try {
        const accountsPath = path.join(LISTS_DIR, `${list.id}.txt`)
        const accounts = fs.existsSync(accountsPath) 
          ? fs.readFileSync(accountsPath, "utf-8").split("\n").filter(Boolean)
          : []
        return { ...list, accounts }
      } catch (error) {
        console.error(`Error reading list ${list.id}:`, error)
        return { ...list, accounts: [] }
      }
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
      createdAt: new Date().toISOString()
    }

    // Save accounts to txt file
    const accountsPath = path.join(LISTS_DIR, `${listId}.txt`)
    fs.writeFileSync(accountsPath, accounts.join("\n"), "utf-8")

    // Update metadata
    const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"))
    metadata.push(list)
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2))

    return res.status(201).json({ ...list, accounts })
  } catch (error) {
    console.error("Error creating list:", error)
    return res.status(500).json({ 
      error: "Failed to create list",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}
