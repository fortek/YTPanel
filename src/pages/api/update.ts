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
    // Получаем путь к проекту
    const projectRoot = process.cwd()
    console.log('Project root:', projectRoot)

    // Принудительно получаем изменения из Git
    console.log('Fetching changes from Git...')
    await execAsync('git fetch origin', {
      cwd: projectRoot
    })

    // Сбрасываем все локальные изменения
    console.log('Resetting local changes...')
    await execAsync('git reset --hard origin/main', {
      cwd: projectRoot
    })

    // Очищаем неотслеживаемые файлы
    console.log('Cleaning untracked files...')
    await execAsync('git clean -fd', {
      cwd: projectRoot
    })

    // Устанавливаем зависимости
    console.log('Installing dependencies...')
    await execAsync('npm install', {
      cwd: projectRoot
    })

    return res.status(200).json({ 
      message: 'Update successful',
      details: {
        projectRoot
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