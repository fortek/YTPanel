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
    const tempPath = path.join(process.cwd(), "uploaded_cookies", `${fileName}.tmp`)
    const cleanTempPath = path.join(process.cwd(), "uploaded_cookies", `${fileName}.clean.tmp`)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" })
    }

    let found = false
    let lineIndex = -1
    let targetIndex = -1

    // Process main file
    const writeStream = createWriteStream(tempPath)
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
        writeStream.write(`${newCookie}|${email}\n`)
      } else {
        writeStream.write(`${line}\n`)
      }
    }

    await new Promise(resolve => writeStream.end(resolve))
    rl.close()

    if (!found) {
      fs.unlinkSync(tempPath)
      return res.status(404).json({ error: "Email not found in file" })
    }

    // Replace original file with temp file
    fs.renameSync(tempPath, filePath)

    // Create or update clean file
    const cleanWriteStream = createWriteStream(cleanTempPath)
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
        cleanWriteStream.write(`${newCookie}\n`)
      } else {
        const [cookies] = line.split("|")
        cleanWriteStream.write(`${cookies.trim()}\n`)
      }
    }

    await new Promise(resolve => cleanWriteStream.end(resolve))
    cleanRl.close()

    // Replace clean file with temp file
    fs.renameSync(cleanTempPath, cleanFilePath)

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