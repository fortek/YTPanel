import { exec } from 'child_process'
import { promisify } from 'util'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'

const execAsync = promisify(exec)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const projectRoot = path.resolve(process.cwd())

    // Выполняем git pull
    const { stdout, stderr } = await execAsync('git pull origin main', {
      cwd: projectRoot
    })

    if (stderr && !stderr.includes('Already up to date')) {
      throw new Error(stderr)
    }

    // Устанавливаем зависимости
    await execAsync('npm install', {
      cwd: projectRoot
    })

    // Останавливаем текущий процесс next.js если он запущен
    try {
      if (process.platform === 'win32') {
        await execAsync('taskkill /F /IM node.exe')
      } else {
        await execAsync('pkill -f "next dev"')
      }
    } catch (error) {
      // Игнорируем ошибку если процесс не был найден
      console.log('No existing process found')
    }

    // Запускаем next.js в режиме разработки в фоновом режиме
    if (process.platform === 'win32') {
      await execAsync('start /B npm run dev', {
        cwd: projectRoot,
        shell: 'cmd.exe'
      })
    } else {
      await execAsync('npm run dev &', {
        cwd: projectRoot
      })
    }

    return res.status(200).json({ message: 'Update successful' })
  } catch (error) {
    console.error('Update error:', error)
    return res.status(500).json({ error: 'Failed to update' })
  }
} 