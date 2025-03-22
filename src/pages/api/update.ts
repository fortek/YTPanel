import { exec } from 'child_process'
import { promisify } from 'util'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

// Кэш для хранения статуса обновления
let updateInProgress = false

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Проверяем, не выполняется ли уже обновление
  if (updateInProgress) {
    return res.status(429).json({ 
      error: 'Update already in progress',
      message: 'Please wait for the current update to complete'
    })
  }

  try {
    updateInProgress = true

    // Получаем путь к проекту
    const projectRoot = process.cwd()
    console.log('Project root:', projectRoot)

    // Проверяем наличие Git репозитория
    const gitDir = path.join(projectRoot, '.git')
    if (!fs.existsSync(gitDir)) {
      console.log('Git repository not found. Initializing...')
      
      // Инициализируем Git репозиторий
      await execAsync('git init', {
        cwd: projectRoot,
        maxBuffer: 10 * 1024 * 1024 // Увеличиваем буфер для больших репозиториев
      })

      // Добавляем все файлы в Git
      await execAsync('git add .', {
        cwd: projectRoot,
        maxBuffer: 10 * 1024 * 1024
      })

      // Создаем первый коммит
      await execAsync('git commit -m "Initial commit"', {
        cwd: projectRoot,
        maxBuffer: 10 * 1024 * 1024
      })

      console.log('Git repository initialized successfully')
    }

    // Проверяем наличие удаленного репозитория
    let hasRemote = false
    try {
      const { stdout } = await execAsync('git remote -v', {
        cwd: projectRoot,
        maxBuffer: 10 * 1024 * 1024
      })
      hasRemote = stdout.trim().length > 0
    } catch (error) {
      console.log('No remote repository found')
    }

    if (!hasRemote) {
      // Если удаленного репозитория нет, пропускаем Git операции
      console.log('Skipping Git operations. Installing dependencies...')
      await execAsync('npm install', {
        cwd: projectRoot,
        maxBuffer: 10 * 1024 * 1024
      })

      updateInProgress = false
      return res.status(200).json({ 
        message: 'Update successful (local repository)',
        details: {
          projectRoot
        }
      })
    }

    // Принудительно получаем изменения из Git
    console.log('Fetching changes from Git...')
    await execAsync('git fetch origin', {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024
    })

    // Сбрасываем все локальные изменения
    console.log('Resetting local changes...')
    await execAsync('git reset --hard origin/main', {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024
    })

    // Очищаем неотслеживаемые файлы
    console.log('Cleaning untracked files...')
    await execAsync('git clean -fd', {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024
    })

    // Устанавливаем зависимости с оптимизацией для многоядерных процессоров
    console.log('Installing dependencies...')
    await execAsync('npm install --prefer-offline --no-audit --no-fund', {
      cwd: projectRoot,
      maxBuffer: 10 * 1024 * 1024,
      env: {
        ...process.env,
        NODE_OPTIONS: '--max-old-space-size=4096' // Увеличиваем лимит памяти для npm
      }
    })

    updateInProgress = false
    return res.status(200).json({ 
      message: 'Update successful',
      details: {
        projectRoot
      }
    })
  } catch (error) {
    updateInProgress = false
    console.error('Update error:', error)
    return res.status(500).json({ 
      error: 'Failed to update',
      details: error instanceof Error ? error.message : String(error)
    })
  }
} 