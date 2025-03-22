import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1gb'
    },
  },
}

const LISTS_DIR = path.join(process.cwd(), "uploaded_cookies")

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { id } = req.query
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "List ID is required" })
  }

  const { accounts } = req.body
  if (!accounts || !Array.isArray(accounts)) {
    return res.status(400).json({ error: "Accounts array is required" })
  }

  try {
    const fileName = `${id}.txt`
    const filePath = path.join(LISTS_DIR, fileName)
    const cleanFileName = `${id}_clean.txt`
    const cleanFilePath = path.join(LISTS_DIR, cleanFileName)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "List not found" })
    }

    // Читаем существующие аккаунты
    const existingContent = fs.readFileSync(filePath, "utf-8")
    const existingAccounts = existingContent.split("\n").filter(line => line.trim())

    // Добавляем новые аккаунты
    const updatedAccounts = [...existingAccounts, ...accounts]
    fs.writeFileSync(filePath, updatedAccounts.join("\n"), "utf-8")

    // Обновляем чистый файл
    const cleanAccounts = updatedAccounts.map(account => {
      const [cookies] = account.split("|")
      return cookies.trim()
    })
    fs.writeFileSync(cleanFilePath, cleanAccounts.join("\n"), "utf-8")

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error("Error appending to list:", error)
    return res.status(500).json({ error: "Failed to append to list" })
  }
} 