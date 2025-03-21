
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const cookiesDir = path.join(process.cwd(), "uploaded_cookies")
    
    if (!fs.existsSync(cookiesDir)) {
      fs.mkdirSync(cookiesDir, { recursive: true })
    }

    const files = fs.readdirSync(cookiesDir)
      .filter(file => file.endsWith(".txt"))
      .map(file => {
        const filePath = path.join(cookiesDir, file)
        const stats = fs.statSync(filePath)
        return {
          name: file,
          size: stats.size,
          createdAt: stats.birthtime
        }
      })

    res.status(200).json({ files })
  } catch (error) {
    console.error("Error reading directory:", error)
    res.status(500).json({ message: "Failed to read directory" })
  }
}
