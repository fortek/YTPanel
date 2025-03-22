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
    const { stdout, stderr } = await execAsync('git --version')
    console.log('Git version check:', { stdout, stderr })
    return true
  } catch (error) {
    console.log('Git not found:', error)
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
    updateInProgress = true

    // Проверяем, установлен ли Git
    console.log('Checking Git installation...')
    const gitInstalled = await isGitInstalled()
    
    if (!gitInstalled) {
      console.log('Git is not installed')
      updateInProgress = false
      return res.status(400).json({ 
        error: 'Git is not installed',
        details: 'Please install Git from https://git-scm.com/downloads and restart the application'
      })
    }

    console.log('Git is installed')

    // Проверяем наличие .git директории
    const gitDir = path.join(projectRoot, '.git')
    const isGitRepo = fs.existsSync(gitDir)
    console.log('Git directory check:', { gitDir, exists: isGitRepo })

    if (!isGitRepo) {
      console.log('Git repository not found. Initializing...')
      try {
        const { stdout, stderr } = await execAsync('git init', { cwd: projectRoot })
        console.log('Git init result:', { stdout, stderr })
      } catch (error: any) {
        console.error('Error initializing git repository:', error)
        updateInProgress = false
        return res.status(500).json({ 
          error: 'Failed to initialize git repository',
          details: error.message
        })
      }
    }

    try {
      // Проверяем наличие удаленного репозитория
      console.log('Checking remote repository...')
      const { stdout: remoteUrl } = await execAsync('git config --get remote.origin.url', { cwd: projectRoot })
      console.log('Remote URL:', remoteUrl.trim())
      
      if (remoteUrl.trim()) {
        console.log('Remote repository found, performing git operations...')
        // Если есть удаленный репозиторий, выполняем git операции
        await execAsync('git fetch origin', { cwd: projectRoot })
        await execAsync('git reset --hard origin/main', { cwd: projectRoot })
        await execAsync('git clean -f -d', { cwd: projectRoot })
      } else {
        console.log('No remote repository found')
      }

      // В любом случае устанавливаем зависимости
      console.log('Installing dependencies...')
      await execAsync('npm install', { cwd: projectRoot })
      console.log('Dependencies installed successfully')

      updateInProgress = false
      return res.status(200).json({ 
        success: true,
        message: remoteUrl.trim() 
          ? 'Project updated and dependencies installed successfully'
          : 'Dependencies installed successfully (no remote repository found)'
      })

    } catch (error: any) {
      console.error('Error during update:', error)
      updateInProgress = false
      return res.status(500).json({ 
        error: 'Update error',
        details: error.message
      })
    }

  } catch (error: any) {
    console.error('Unexpected error:', error)
    updateInProgress = false
    return res.status(500).json({ 
      error: 'Unexpected error',
      details: error.message
    })
  }
} 