import { exec } from 'child_process'
import { promisify } from 'util'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const projectRoot = process.cwd()
    console.log('Project root:', projectRoot)

    // Создаем директорию для логов если её нет
    const logsDir = path.join(projectRoot, 'logs')
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir)
    }

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

    // Проверяем текущие процессы PM2
    console.log('Checking current PM2 processes...')
    const { stdout: pm2List } = await execAsync('pm2 list')
    console.log('Current PM2 processes:', pm2List)

    // Удаляем все процессы PM2
    console.log('Removing all PM2 processes...')
    try {
      await execAsync('pm2 delete all')
    } catch (error) {
      console.log('No processes to delete or error:', error)
    }

    // Очищаем логи PM2
    console.log('Clearing PM2 logs...')
    try {
      await execAsync('pm2 flush')
    } catch (error) {
      console.log('Error clearing logs:', error)
    }

    // Запускаем приложение через PM2
    console.log('Starting application with PM2...')
    const { stdout: pm2Start } = await execAsync('pm2 start ecosystem.config.js', {
      cwd: projectRoot
    })
    console.log('PM2 start output:', pm2Start)

    // Ждем немного, чтобы процесс успел запуститься
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Проверяем статус процесса
    console.log('Checking process status...')
    const { stdout: pm2Status } = await execAsync('pm2 list')
    console.log('Process status:', pm2Status)

    // Проверяем логи процесса
    console.log('Checking process logs...')
    const { stdout: pm2Logs } = await execAsync('pm2 logs ytpanel --lines 50')
    console.log('Process logs:', pm2Logs)

    // Проверяем файлы логов
    console.log('Checking log files...')
    const errorLog = fs.existsSync(path.join(logsDir, 'err.log')) 
      ? fs.readFileSync(path.join(logsDir, 'err.log'), 'utf-8')
      : 'Error log file not found'
    const outLog = fs.existsSync(path.join(logsDir, 'out.log'))
      ? fs.readFileSync(path.join(logsDir, 'out.log'), 'utf-8')
      : 'Output log file not found'

    console.log('Error log:', errorLog)
    console.log('Output log:', outLog)

    console.log('Update process completed successfully')
    return res.status(200).json({ 
      message: 'Update successful',
      details: {
        projectRoot,
        stdout,
        stderr,
        pm2Status,
        pm2Logs,
        errorLog,
        outLog
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