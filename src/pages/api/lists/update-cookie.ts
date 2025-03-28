import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"
import { createReadStream, createWriteStream } from "fs"
import readline from "readline"

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: false
    },
  },
}

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

    let found = false
    let lineIndex = -1
    let targetIndex = -1
    let updatedContent = ""
    let cleanContent = ""

    // Process main file
    const readStream = createReadStream(filePath)
    const rl = readline.createInterface({
      input: readStream,
      crlfDelay: Infinity
    })

    for await (const line of rl) {
      lineIndex++
      const [cookie, lineEmail] = line.split("|")
      if (lineEmail?.trim() === email.trim()) {
        found = true
        targetIndex = lineIndex
        updatedContent += `${newCookie}|${email}\n`
      } else {
        updatedContent += `${line}\n`
      }
    }

    rl.close()

    if (!found) {
      return res.status(404).json({ error: "Email not found in file" })
    }

    // Write updated content directly to the file
    fs.writeFileSync(filePath, updatedContent, "utf-8")

    // Process clean file
    const cleanReadStream = fs.existsSync(cleanFilePath) 
      ? createReadStream(cleanFilePath)
      : createReadStream(filePath)

    const cleanRl = readline.createInterface({
      input: cleanReadStream,
      crlfDelay: Infinity
    })

    lineIndex = -1
    for await (const line of cleanRl) {
      lineIndex++
      if (lineIndex === targetIndex) {
        cleanContent += `${newCookie}\n`
      } else {
        const [cookies] = line.split("|")
        cleanContent += `${cookies.trim()}\n`
      }
    }

    cleanRl.close()

    // Write clean content directly to the file
    fs.writeFileSync(cleanFilePath, cleanContent, "utf-8")

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
