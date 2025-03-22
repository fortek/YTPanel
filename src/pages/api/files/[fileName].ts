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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const { fileName } = req.query
    if (!fileName || typeof fileName !== "string") {
      return res.status(400).json({ message: "File name is required" })
    }

    const cookiesDir = path.join(process.cwd(), "uploaded_cookies")
    const filePath = path.join(cookiesDir, fileName)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" })
    }

    const fileContent = fs.readFileSync(filePath, "utf-8")
    
    res.setHeader("Content-Type", "text/plain")
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`)
    res.send(fileContent)
  } catch (error) {
    console.error("Error downloading file:", error)
    res.status(500).json({ message: "Failed to download file" })
  }
} 