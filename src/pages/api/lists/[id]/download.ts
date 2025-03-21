
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { id } = req.query
    const listsDir = path.join(process.cwd(), "data", "lists")
    const filePath = path.join(listsDir, `${id}.txt`)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "List not found" })
    }

    const fileContent = fs.readFileSync(filePath, "utf-8")
    
    res.setHeader("Content-Type", "text/plain")
    res.setHeader("Content-Disposition", `attachment; filename=${id}.txt`)
    res.send(fileContent)
  } catch (error) {
    console.error("Error downloading list:", error)
    res.status(500).json({ message: "Failed to download list" })
  }
}
