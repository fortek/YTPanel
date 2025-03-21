
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { path: pathSegments } = req.query
    const filePath = path.join(process.cwd(), "uploaded_cookies", ...(pathSegments as string[]))

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" })
    }

    const fileContent = fs.readFileSync(filePath, "utf-8")
    res.setHeader("Content-Type", "text/plain")
    res.setHeader("Content-Disposition", "inline")
    res.send(fileContent)
  } catch (error) {
    console.error("Error serving file:", error)
    res.status(500).json({ message: "Failed to serve file" })
  }
}
