
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
    case "DELETE":
      return deleteList(id, res)
    default:
      return res.status(405).json({ error: "Method not allowed" })
  }
}

async function deleteList(id: string, res: NextApiResponse) {
  try {
    const accountsPath = path.join(LISTS_DIR, `${id}.txt`)
    
    // Delete accounts file if exists
    if (fs.existsSync(accountsPath)) {
      fs.unlinkSync(accountsPath)
    }

    // Update metadata
    const metadata = JSON.parse(fs.readFileSync(METADATA_FILE, "utf-8"))
    const updatedMetadata = metadata.filter((list: any) => list.id !== id)
    fs.writeFileSync(METADATA_FILE, JSON.stringify(updatedMetadata, null, 2))

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error deleting list:", error)
    return res.status(500).json({ error: "Failed to delete list" })
  }
}
