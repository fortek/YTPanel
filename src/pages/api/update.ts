import { exec } from 'child_process'
import { promisify } from 'util'
import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

// Кэш для хранения статуса обновления
let updateInProgress = false

async function isGitInstalled(): Promise<boolean> {
  try {
    await execAsync('git --version')
    return true
  } catch (error) {
    return false
  }
}

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

  const projectRoot = process.cwd()
  console.log('Project root:', projectRoot)

  try {
    // Проверяем, установлен ли Git
    const gitInstalled = await isGitInstalled()
    if (!gitInstalled) {
      return res.status(400).json({ 
        error: 'Git is not installed',
        details: 'Please install Git from https://git-scm.com/downloads and restart the application'
      })
    }

    // Проверяем наличие .git директории
    const gitDir = path.join(projectRoot, '.git')
    const isGitRepo = fs.existsSync(gitDir)

    if (!isGitRepo) {
      console.log('Git repository not found. Initializing...')
      try {
        await execAsync('git init', { cwd: projectRoot })
        console.log('Git repository initialized successfully')
      } catch (error: any) {
        console.error('Error initializing git repository:', error)
        return res.status(500).json({ 
          error: 'Failed to initialize git repository',
          details: error.message
        })
      }
    }

    try {
      // Проверяем наличие удаленного репозитория
      const { stdout: remoteUrl } = await execAsync('git config --get remote.origin.url', { cwd: projectRoot })
      
      if (remoteUrl.trim()) {
        // Если есть удаленный репозиторий, выполняем git операции
        await execAsync('git fetch origin', { cwd: projectRoot })
        await execAsync('git reset --hard origin/main', { cwd: projectRoot })
        await execAsync('git clean -f -d', { cwd: projectRoot })
      }

      // В любом случае устанавливаем зависимости
      console.log('Installing dependencies...')
      await execAsync('npm install', { cwd: projectRoot })
      console.log('Dependencies installed successfully')

      return res.status(200).json({ 
        success: true,
        message: remoteUrl.trim() 
          ? 'Project updated and dependencies installed successfully'
          : 'Dependencies installed successfully (no remote repository found)'
      })

    } catch (error: any) {
      console.error('Error during update:', error)
      return res.status(500).json({ 
        error: 'Update error',
        details: error.message
      })
    }

  } catch (error: any) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ 
      error: 'Unexpected error',
      details: error.message
    })
  }
} 