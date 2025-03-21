
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"
import formidable from "formidable"

export const config = {
  api: {
    bodyParser: false
  }
}

const LISTS_DIR = path.join(process.cwd(), "data", "lists")
const METADATA_FILE = path.join(LISTS_DIR, "metadata.json")

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return getLists(req, res)
  }
  
  if (req.method === "POST") {
    const form = formidable({
      maxFileSize: 200 * 1024 * 1024, // 200MB
    })

    return new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Form parsing error:", err)
          res.status(500).json({ error: "Failed to process upload" })
          return resolve(undefined)
        }

        try {
          const name = fields.name?.[0]
          const accountsFile = files.accountsFile?.[0]

          if (!name || !accountsFile) {
            res.status(400).json({ error: "Name and file are required" })
            return resolve(undefined)
          }

          const accounts = fs.readFileSync(accountsFile.filepath, "utf-8")
            .split("\n")
            .filter(line => line.trim().length > 0)

          const result = await createList({ name, accounts }, res)
          resolve(result)
        } catch (error) {
          console.error("Error processing request:", error)
          res.status(500).json({ error: "Failed to process request" })
          resolve(undefined)
        }
      })
    })
  }

  return res.status(405).json({ error: "Method not allowed" })
}

async function getLists(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!fs.existsSync(LISTS_DIR)) {
      fs.mkdirSync(LISTS_DIR, { recursive: true })
      fs.writeFileSync(METADATA_FILE, JSON.stringify([]), "utf-8")
    }

    if (!fs.existsSync(METADATA_FILE)) {
      fs.writeFileSync(METADATA_FILE, JSON.stringify([]), "utf-8")
    }

    const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"))
    const lists = await Promise.all(metadata.map(async (list: any) => {
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
    }))
    
    return res.status(200).json(lists)
  } catch (error) {
    console.error("Error reading lists:", error)
    return res.status(500).json({ error: "Failed to read lists" })
  }
}

async function createList(data: any, res: NextApiResponse) {
  try {
    const { name, accounts } = data
    
    if (!name || !accounts || !Array.isArray(accounts)) {
      return res.status(400).json({ error: "Valid name and accounts array are required" })
    }

    if (!fs.existsSync(LISTS_DIR)) {
      fs.mkdirSync(LISTS_DIR, { recursive: true })
    }

    const listId = Date.now().toString()
    const accountsPath = path.join(LISTS_DIR, `${listId}.txt`)
    
    const list = {
      id: listId,
      name,
      createdAt: new Date().toISOString()
    }

    try {
      fs.writeFileSync(accountsPath, accounts.join("\n"), "utf-8")

      const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"))
      metadata.push(list)
      fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2))

      return res.status(201).json({ ...list, accounts })
    } catch (fsError) {
      console.error("File system error:", fsError)
      if (fs.existsSync(accountsPath)) {
        try {
          fs.unlinkSync(accountsPath)
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError)
        }
      }
      throw new Error("Failed to save list data")
    }
  } catch (error) {
    console.error("Error creating list:", error)
    return res.status(500).json({ 
      error: "Failed to create list",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}
