
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

const LISTS_DIR = path.join(process.cwd(), "data", "lists")
const METADATA_FILE = path.join(LISTS_DIR, "metadata.json")

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid list ID" })
  }

  switch (req.method) {
    case "PATCH":
      return renameList(id, req, res)
    case "DELETE":
      return deleteList(id, res)
    default:
      return res.status(405).json({ error: "Method not allowed" })
  }
}

async function renameList(id: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name } = req.body
    if (!name) {
      return res.status(400).json({ error: "Name is required" })
    }

    const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"))
    const listIndex = metadata.findIndex((list: any) => list.id === id)

    if (listIndex === -1) {
      return res.status(404).json({ error: "List not found" })
    }

    metadata[listIndex].name = name
    fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2))

    return res.status(200).json(metadata[listIndex])
  } catch (error) {
    console.error("Error renaming list:", error)
    return res.status(500).json({ error: "Failed to rename list" })
  }
}

async function deleteList(id: string, res: NextApiResponse) {
  try {
    const accountsPath = path.join(LISTS_DIR, `${id}.txt`)
    
    if (fs.existsSync(accountsPath)) {
      fs.unlinkSync(accountsPath)
    }

    const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"))
    const updatedMetadata = metadata.filter((list: any) => list.id !== id)
    fs.writeFileSync(METADATA_FILE, JSON.stringify(updatedMetadata, null, 2))

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error deleting list:", error)
    return res.status(500).json({ error: "Failed to delete list" })
  }
}
