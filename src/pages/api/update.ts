import { exec } from 'child_process'
import { promisify } from 'util'
import type { NextApiRequest, NextApiResponse } from 'next'

const execAsync = promisify(exec)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Получаем изменения из Git
    console.log('Pulling changes from Git...')
    const { stdout, stderr } = await execAsync('git pull origin main')
    console.log('Git pull output:', stdout)
    console.log('Git pull stderr:', stderr)

    // Устанавливаем зависимости
    console.log('Installing dependencies...')
    await execAsync('npm install')

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