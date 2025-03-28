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

// Map для хранения очередей запросов
const requestQueues = new Map<string, Promise<void>>()

async function processRequest(
  filePath: string,
  fileName: string,
  newCookie: string,
  email: string
): Promise<void> {
  const cleanFilePath = path.join(process.cwd(), "uploaded_cookies", fileName.replace(".txt", "_clean.txt"))
  const tempPath = path.join(process.cwd(), "uploaded_cookies", `${fileName}.tmp`)
  const cleanTempPath = path.join(process.cwd(), "uploaded_cookies", `${fileName}.clean.tmp`)

  console.log("Processing request:", {
    filePath,
    email,
    newCookieLength: newCookie.length
  })

  let found = false
  let lineIndex = -1
  let targetIndex = -1
  let totalLines = 0

  // Process main file
  const writeStream = createWriteStream(tempPath)
  const readStream = createReadStream(filePath)
  const rl = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
  })

  for await (const line of rl) {
    lineIndex++
    totalLines++
    if (!line.trim()) continue

    const [cookie, lineEmail] = line.split("|")
    if (!lineEmail) {
      console.log("Invalid line format:", { lineIndex })
      continue
    }

    const trimmedEmail = lineEmail.trim()
    const searchEmail = email.trim()
    
    if (trimmedEmail === searchEmail) {
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
    throw new Error(`Email "${email}" not found in file. Total lines processed: ${totalLines}`)
  }

  // Replace original file with temp file
  fs.unlinkSync(filePath)
  fs.renameSync(tempPath, filePath)

  // Process clean file
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
  if (fs.existsSync(cleanFilePath)) {
    fs.unlinkSync(cleanFilePath)
  }
  fs.renameSync(cleanTempPath, cleanFilePath)

  console.log("Request processed successfully:", {
    filePath,
    email,
    targetIndex,
    totalLines
  })
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

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" })
    }

    // Получаем текущую очередь для файла или создаем новую
    let currentQueue = requestQueues.get(filePath) || Promise.resolve()
    
    // Добавляем новый запрос в очередь
    const newQueue = currentQueue.then(async () => {
      try {
        await processRequest(filePath, fileName, newCookie, email)
      } catch (error) {
        console.error("Error processing request:", error)
        throw error
      }
    }).catch(error => {
      console.error("Error in queue:", error)
      throw error
    })

    // Обновляем очередь
    requestQueues.set(filePath, newQueue)

    // Ждем выполнения запроса
    await newQueue

    return res.status(200).json({ 
      success: true,
      message: "Cookie updated successfully in both files" 
    })
  } catch (error) {
    console.error("Error updating cookie:", error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to update cookie" 
    })
  }
}
