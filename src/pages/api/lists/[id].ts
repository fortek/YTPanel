
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

const LISTS_DIR = path.join(process.cwd(), "data", "lists")

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid list ID" })
  }

  switch (req.method) {
    case "DELETE":
      return deleteList(id, res)
    default:
      return res.status(405).json({ error: "Method not allowed" })
  }
}

async function deleteList(id: string, res: NextApiResponse) {
  try {
    const filePath = path.join(LISTS_DIR, `${id}.json`)
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "List not found" })
    }

    fs.unlinkSync(filePath)
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error deleting list:", error)
    return res.status(500).json({ error: "Failed to delete list" })
  }
}
