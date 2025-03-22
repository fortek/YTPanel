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
    // Используем полный путь к git.exe или команду через PowerShell
    const command = process.platform === 'win32' 
      ? 'powershell.exe -Command "git --version"'
      : 'git --version'
    
    console.log('Executing command:', command)
    const { stdout, stderr } = await execAsync(command)
    console.log('Git version check result:', { stdout, stderr })
    return true
  } catch (error) {
    console.log('Git check error:', error)
    // Попробуем найти git.exe в стандартных местах установки
    const commonGitPaths = [
      'C:\\Program Files\\Git\\cmd\\git.exe',
      'C:\\Program Files (x86)\\Git\\cmd\\git.exe'
    ]
    
    for (const gitPath of commonGitPaths) {
      if (fs.existsSync(gitPath)) {
        console.log('Found Git at:', gitPath)
        try {
          const { stdout, stderr } = await execAsync(`"${gitPath}" --version`)
          console.log('Git version check result with full path:', { stdout, stderr })
          return true
        } catch (e) {
          console.log('Failed to execute Git with full path:', e)
        }
      }
    }
    
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
  console.log('Current process env:', {
    PATH: process.env.PATH,
    SHELL: process.env.SHELL,
    COMSPEC: process.env.COMSPEC
  })

  try {
    updateInProgress = true

    // Проверяем, установлен ли Git
    console.log('Checking Git installation...')
    const gitInstalled = await isGitInstalled()
    
    if (!gitInstalled) {
      console.log('Git is not found in the system')
      updateInProgress = false
      return res.status(400).json({ 
        error: 'Git is not installed',
        details: 'Git is not accessible in the current environment'
      })
    }

    console.log('Git is installed and accessible')

    // Проверяем наличие .git директории
    const gitDir = path.join(projectRoot, '.git')
    const isGitRepo = fs.existsSync(gitDir)
    console.log('Git directory check:', { gitDir, exists: isGitRepo })

    if (!isGitRepo) {
      console.log('Git repository not found. Initializing...')
      try {
        // Используем PowerShell для выполнения git init
        const initCommand = process.platform === 'win32'
          ? 'powershell.exe -Command "git init"'
          : 'git init'
        
        const { stdout, stderr } = await execAsync(initCommand, { cwd: projectRoot })
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
      // Проверяем наличие удаленного репозитория через PowerShell
      const remoteCommand = process.platform === 'win32'
        ? 'powershell.exe -Command "git config --get remote.origin.url"'
        : 'git config --get remote.origin.url'
      
      const { stdout: remoteUrl } = await execAsync(remoteCommand, { cwd: projectRoot })
      console.log('Remote URL:', remoteUrl.trim())
      
      if (remoteUrl.trim()) {
        console.log('Remote repository found, performing git operations...')
        // Выполняем git операции через PowerShell
        const gitCommands = [
          'git fetch origin',
          'git reset --hard origin/main',
          'git clean -f -d'
        ]

        for (const cmd of gitCommands) {
          const command = process.platform === 'win32'
            ? `powershell.exe -Command "${cmd}"`
            : cmd
          
          console.log('Executing:', command)
          await execAsync(command, { cwd: projectRoot })
        }
      } else {
        console.log('No remote repository found')
      }

      // Устанавливаем зависимости через PowerShell
      console.log('Installing dependencies...')
      const npmCommand = process.platform === 'win32'
        ? 'powershell.exe -Command "npm install"'
        : 'npm install'
      
      await execAsync(npmCommand, { cwd: projectRoot })
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