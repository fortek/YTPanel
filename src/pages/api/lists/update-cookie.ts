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
    throw new Error("Email not found in file")
  }

  // Проверяем, что временный файл создан и не пустой
  if (!fs.existsSync(tempPath) || fs.statSync(tempPath).size === 0) {
    throw new Error("Failed to create temporary file")
  }

  // Replace original file with temp file
  try {
    // Сначала копируем временный файл
    fs.copyFileSync(tempPath, filePath)
    // Затем удаляем временный файл
    fs.unlinkSync(tempPath)
  } catch (error) {
    // Если что-то пошло не так, пытаемся восстановить из временного файла
    if (fs.existsSync(tempPath)) {
      fs.copyFileSync(tempPath, filePath)
      fs.unlinkSync(tempPath)
    }
    throw error
  }

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
  try {
    if (fs.existsSync(cleanFilePath)) {
      fs.unlinkSync(cleanFilePath)
    }
    fs.renameSync(cleanTempPath, cleanFilePath)
  } catch (error) {
    // Если не удалось переименовать, пробуем скопировать и удалить
    fs.copyFileSync(cleanTempPath, cleanFilePath)
    fs.unlinkSync(cleanTempPath)
  }
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
        throw error
      }
    }).catch(error => {
      throw error
    }).finally(() => {
      // Очищаем очередь после завершения запроса
      requestQueues.delete(filePath)
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
    const { email } = req.body
    const errorMessage = error instanceof Error && error.message === "Email not found in file" 
      ? `Email "${email}" not found in file` 
      : "Failed to update cookie"
    
    console.log("Failed request:", {
      fileName: req.body.fileName,
      email: req.body.email,
      newCookieLength: req.body.newCookie?.length || 0,
      response: errorMessage
    })
    
    return res.status(500).json({ error: errorMessage })
  }
}