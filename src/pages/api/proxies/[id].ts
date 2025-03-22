import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

const PROXIES_DIR = path.join(process.cwd(), "data", "proxies")

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const filePath = path.join(PROXIES_DIR, `${id}.txt`)

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Proxy list not found" })
  }

  switch (req.method) {
    case "GET":
      try {
        const content = fs.readFileSync(filePath, "utf-8")
        const proxies = content.split("\n").filter(Boolean)
        const stats = fs.statSync(filePath)

        res.status(200).json({
          id,
          name: path.parse(filePath).name,
          proxies,
          createdAt: stats.mtime,
        })
      } catch (error) {
        console.error("Error reading proxy list:", error)
        res.status(500).json({ error: "Failed to read proxy list" })
      }
      break

    case "PATCH":
      try {
        const { name } = req.body

        if (!name) {
          return res.status(400).json({ error: "Name is required" })
        }

        const newFilePath = path.join(PROXIES_DIR, `${name}.txt`)

        // Проверяем, не существует ли уже список с таким именем
        if (fs.existsSync(newFilePath) && newFilePath !== filePath) {
          return res.status(400).json({ error: "List with this name already exists" })
        }

        // Переименовываем файл
        fs.renameSync(filePath, newFilePath)

        const content = fs.readFileSync(newFilePath, "utf-8")
        const proxies = content.split("\n").filter(Boolean)
        const stats = fs.statSync(newFilePath)

        res.status(200).json({
          id: name,
          name,
          proxies,
          createdAt: stats.mtime,
        })
      } catch (error) {
        console.error("Error updating proxy list:", error)
        res.status(500).json({ error: "Failed to update proxy list" })
      }
      break

    case "DELETE":
      try {
        fs.unlinkSync(filePath)
        res.status(204).end()
      } catch (error) {
        console.error("Error deleting proxy list:", error)
        res.status(500).json({ error: "Failed to delete proxy list" })
      }
      break

    default:
      res.setHeader("Allow", ["GET", "PATCH", "DELETE"])
      res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }
} 