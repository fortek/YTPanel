
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

const LISTS_DIR = path.join(process.cwd(), "uploaded_cookies")
const METADATA_FILE = path.join(LISTS_DIR, "metadata.json")

// Ensure directories exist
try {
  if (!fs.existsSync(LISTS_DIR)) {
    fs.mkdirSync(LISTS_DIR, { recursive: true })
  }

  if (!fs.existsSync(METADATA_FILE)) {
    fs.writeFileSync(METADATA_FILE, JSON.stringify([]))
  }
} catch (error) {
  console.error("Error creating directories:", error)
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
    if (!fs.existsSync(METADATA_FILE)) {
      return res.status(200).json([])
    }
    const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"))
    return res.status(200).json(metadata)
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

    // Ensure directory exists before writing
    if (!fs.existsSync(LISTS_DIR)) {
      fs.mkdirSync(LISTS_DIR, { recursive: true })
    }

    const id = Date.now().toString()
    const newList = {
      id,
      name,
      createdAt: new Date(),
      accounts
    }

    try {
      // Save accounts to a file
      const accountsPath = path.join(LISTS_DIR, `${id}.txt`)
      fs.writeFileSync(accountsPath, accounts.join("\n"), "utf-8")

      // Update metadata
      const metadata = fs.existsSync(METADATA_FILE) 
        ? JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"))
        : []
      
      metadata.push(newList)
      fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2))

      return res.status(201).json(newList)
    } catch (writeError) {
      console.error("Error writing files:", writeError)
      return res.status(500).json({ error: "Failed to save list files" })
    }
  } catch (error) {
    console.error("Error creating list:", error)
    return res.status(500).json({ error: "Failed to create list" })
  }
}
