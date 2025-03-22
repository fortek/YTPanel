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
    const { id } = req.query
    const listsDir = path.join(process.cwd(), "uploaded_cookies")
    const filePath = path.join(listsDir, `${id}.txt`)
    const metaFilePath = path.join(listsDir, `${id}.meta.json`)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "List not found" })
    }

    let fileName = `${id}.txt`
    if (fs.existsSync(metaFilePath)) {
      const meta = JSON.parse(fs.readFileSync(metaFilePath, "utf-8"))
      fileName = `${meta.name}.txt`
    }

    const fileContent = fs.readFileSync(filePath, "utf-8")
    
    res.setHeader("Content-Type", "text/plain")
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
    res.send(fileContent)
  } catch (error) {
    console.error("Error downloading list:", error)
    res.status(500).json({ message: "Failed to download list" })
  }
}
