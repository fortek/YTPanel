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

    // Проверяем статус репозитория
    console.log('Checking git status...')
    await execAsync('git fetch origin main', {
      cwd: projectRoot
    })

    // Выполняем git pull
    console.log('Pulling changes...')
    const { stdout, stderr } = await execAsync('git pull origin main', {
      cwd: projectRoot
    })

    console.log('Git pull output:', stdout)
    console.log('Git pull stderr:', stderr)

    // Проверяем наличие изменений
    if (stderr && stderr.includes('Already up to date')) {
      console.log('No updates found')
    }

    // Устанавливаем зависимости
    console.log('Installing dependencies...')
    await execAsync('npm install', {
      cwd: projectRoot
    })

    // Останавливаем текущий процесс next.js если он запущен
    console.log('Stopping current Next.js process...')
    try {
      if (process.platform === 'win32') {
        await execAsync('taskkill /F /IM node.exe', { windowsHide: true })
      } else {
        await execAsync('pkill -f "next dev"')
      }
    } catch (error) {
      console.log('No existing process found or failed to stop:', error)
    }

    // Запускаем next.js в режиме разработки в фоновом режиме
    console.log('Starting Next.js in development mode...')
    if (process.platform === 'win32') {
      await execAsync('start /B npm run dev', {
        cwd: projectRoot,
        shell: 'cmd.exe',
        windowsHide: true
      })
    } else {
      await execAsync('npm run dev &', {
        cwd: projectRoot
      })
    }

    console.log('Update process completed successfully')
    return res.status(200).json({ 
      message: 'Update successful',
      details: {
        stdout,
        stderr
      }
    })
  } catch (error) {
    console.error('Update error:', error)
    return res.status(500).json({ 
      error: 'Failed to update',
      details: error instanceof Error ? error.message : String(error)
    })
  }
} 