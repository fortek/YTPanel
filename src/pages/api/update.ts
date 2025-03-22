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
    // Получаем абсолютный путь к проекту
    const projectRoot = process.cwd()
    console.log('Project root:', projectRoot)

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

    // Устанавливаем PM2 глобально, если еще не установлен
    console.log('Checking PM2 installation...')
    try {
      await execAsync('pm2 -v')
    } catch {
      console.log('Installing PM2 globally...')
      await execAsync('npm install -g pm2')
    }

    // Останавливаем текущий процесс через PM2
    console.log('Stopping current process...')
    try {
      await execAsync('pm2 stop ytpanel')
    } catch (error) {
      console.log('No existing process found or failed to stop:', error)
    }

    // Запускаем приложение через PM2
    console.log('Starting application with PM2...')
    await execAsync('pm2 start ecosystem.config.js', {
      cwd: projectRoot
    })

    console.log('Update process completed successfully')
    return res.status(200).json({ 
      message: 'Update successful',
      details: {
        projectRoot,
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