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

    // Запускаем next.js в режиме разработки
    console.log('Starting Next.js in development mode...')
    if (process.platform === 'win32') {
      // Создаем bat-файл для запуска Next.js
      const batContent = `
@echo off
cd /d "${projectRoot}"
npm run dev
`.trim()

      const batPath = path.join(projectRoot, 'start-dev.bat')
      fs.writeFileSync(batPath, batContent)

      // Создаем PowerShell скрипт для запуска bat-файла
      const psContent = `
$Host.UI.RawUI.WindowTitle = 'Next.js Dev Server'
Start-Process -FilePath "${batPath}" -WindowStyle Minimized
`.trim()

      const psPath = path.join(projectRoot, 'run-dev.ps1')
      fs.writeFileSync(psPath, psContent)

      // Запускаем PowerShell скрипт
      console.log('Executing PowerShell script...')
      await execAsync('powershell -ExecutionPolicy Bypass -NoProfile -File "' + psPath + '"', {
        cwd: projectRoot,
        windowsHide: true
      })

      // Удаляем временные файлы
      fs.unlinkSync(psPath)
      fs.unlinkSync(batPath)
      console.log('PowerShell script executed')
    } else {
      await execAsync('npm run dev &', {
        cwd: projectRoot
      })
    }

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