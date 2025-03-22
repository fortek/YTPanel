import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: false
    },
  },
}

const LISTS_DIR = path.join(process.cwd(), "uploaded_cookies")

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid list ID" })
  }

  switch (req.method) {
    case "GET":
      return getList(id, res)
    case "PATCH":
      return renameList(id, req, res)
    case "DELETE":
      return deleteList(id, res)
    default:
      return res.status(405).json({ error: "Method not allowed" })
  }
}

async function getList(id: string, res: NextApiResponse) {
  try {
    const filePath = path.join(LISTS_DIR, `${id}.txt`)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "List not found" })
    }

    const stats = fs.statSync(filePath)
    const content = fs.readFileSync(filePath, "utf-8")
    const accounts = content.split("\n").filter(Boolean)

    return res.status(200).json({
      id,
      name: id,
      createdAt: stats.birthtime,
      accounts
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
