import { NextApiRequest, NextApiResponse } from 'next'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)
const REPO_URL = 'https://github.com/fortek/YTPanel.git'

// Возможные пути установки Git
const GIT_PATHS = [
  'C:\\Program Files\\Git\\cmd\\git.exe',
  'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
  'C:\\Program Files\\Git\\bin\\git.exe',
  'C:\\Program Files (x86)\\Git\\bin\\git.exe'
]

let gitExecutablePath: string | null = null

async function findGitPath(): Promise<string | null> {
  // Если путь уже найден, возвращаем его
  if (gitExecutablePath) {
    return gitExecutablePath
  }

  // Проверяем все возможные пути
  for (const gitPath of GIT_PATHS) {
    if (fs.existsSync(gitPath)) {
      try {
        const { stdout } = await execAsync(`"${gitPath}" --version`)
        console.log('Found Git at:', gitPath)
        console.log('Git version:', stdout.trim())
        gitExecutablePath = gitPath
        return gitPath
      } catch (error) {
        console.log('Failed to execute Git at:', gitPath)
      }
    }
  }

  return null
}

async function execGitCommand(command: string, cwd: string) {
  const gitPath = await findGitPath()
  if (!gitPath) {
    throw new Error('Git executable not found in any of the standard locations')
  }
  const fullCommand = `"${gitPath}" ${command}`
  console.log('Executing git command:', fullCommand)
  return execAsync(fullCommand, { cwd })
}

async function isGitInstalled(): Promise<boolean> {
  try {
    const gitPath = await findGitPath()
    if (!gitPath) {
      console.log('Git not found in any standard location')
      return false
    }
    return true
  } catch (error) {
    console.log('Git check error:', error)
    return false
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const projectRoot = process.cwd()
  console.log('Project root:', projectRoot)

  try {
    // Проверяем установку Git
    const gitInstalled = await isGitInstalled()
    if (!gitInstalled) {
      return res.status(400).json({ 
        error: 'Git is not installed',
        details: 'Git executable not found in any of these locations:\n' + GIT_PATHS.join('\n')
      })
    }

    // Проверяем наличие .git директории
    const gitDir = path.join(projectRoot, '.git')
    const isGitRepo = fs.existsSync(gitDir)
    console.log('Git directory check:', { gitDir, exists: isGitRepo })

    if (!isGitRepo) {
      console.log('Git repository not found. Initializing...')
      try {
        await execGitCommand('init', projectRoot)
        console.log('Git repository initialized')
      } catch (error: any) {
        console.error('Error initializing git repository:', error)
        return res.status(500).json({ 
          error: 'Failed to initialize git repository',
          details: error.message
        })
      }
    }

    try {
      // Проверяем наличие remote origin
      const { stdout: remoteUrl } = await execGitCommand('remote get-url origin', projectRoot).catch(() => ({ stdout: '' }))
      
      if (!remoteUrl.trim()) {
        console.log('Remote origin not found. Adding...')
        await execGitCommand(`remote add origin ${REPO_URL}`, projectRoot)
        console.log('Remote origin added successfully')
      } else if (remoteUrl.trim() !== REPO_URL) {
        console.log('Updating remote origin URL...')
        await execGitCommand(`remote set-url origin ${REPO_URL}`, projectRoot)
        console.log('Remote origin URL updated')
      }

      // Выполняем git операции
      console.log('Fetching updates...')
      await execGitCommand('fetch origin', projectRoot)
      await execGitCommand('reset --hard origin/main', projectRoot)
      await execGitCommand('clean -f -d', projectRoot)
      
      // Устанавливаем зависимости
      console.log('Installing dependencies...')
      await execAsync('npm install', { cwd: projectRoot })
      console.log('Dependencies installed successfully')

      return res.status(200).json({ 
        success: true,
        message: 'Project updated and dependencies installed successfully'
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