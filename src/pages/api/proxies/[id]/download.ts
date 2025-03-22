import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

const PROXIES_DIR = path.join(process.cwd(), "data", "proxies")

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  const { id } = req.query
  const filePath = path.join(PROXIES_DIR, `${id}.txt`)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Proxy list not found" })
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8")
    const name = path.parse(filePath).name

    res.setHeader("Content-Type", "text/plain")
    res.setHeader("Content-Disposition", `attachment; filename="${name}.txt"`)
    res.status(200).send(content)
  } catch (error) {
    console.error("Error downloading proxy list:", error)
    res.status(500).json({ error: "Failed to download proxy list" })
  }
} 