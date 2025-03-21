
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { fileName, newCookie, email } = req.body

    if (!fileName || !newCookie || !email) {
      return res.status(400).json({ 
        error: "fileName, newCookie and email are required" 
      })
    }

    const filePath = path.join(process.cwd(), "uploaded_cookies", fileName)
    const cleanFilePath = path.join(process.cwd(), "uploaded_cookies", fileName.replace(".txt", "_clean.txt"))

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" })
    }

    let content = fs.readFileSync(filePath, "utf-8")
    const lines = content.split("\n")
    let found = false
    let updatedCookieOnly = ""

    const updatedLines = lines.map(line => {
      const [cookie, lineEmail] = line.split("|")
      if (lineEmail?.trim() === email.trim()) {
        found = true
        updatedCookieOnly = newCookie
        return `${newCookie}|${email}`
      }
      return line
    })

    if (!found) {
      return res.status(404).json({ error: "Email not found in file" })
    }

    // Update original file with emails
    fs.writeFileSync(filePath, updatedLines.join("\n"))

    // Update clean file without emails
    if (fs.existsSync(cleanFilePath)) {
      let cleanContent = fs.readFileSync(cleanFilePath, "utf-8")
      const cleanLines = cleanContent.split("\n")
      const updatedCleanLines = cleanLines.map((line, index) => {
        if (index === lines.findIndex(l => l.split("|")[1]?.trim() === email.trim())) {
          return updatedCookieOnly
        }
        return line
      })
      fs.writeFileSync(cleanFilePath, updatedCleanLines.join("\n"))
    }

    return res.status(200).json({ 
      success: true,
      message: "Cookie updated successfully in both files" 
    })
  } catch (error) {
    console.error("Error updating cookie:", error)
    return res.status(500).json({ 
      error: "Failed to update cookie" 
    })
  }
}
