
import { NextApiRequest, NextApiResponse } from "next"
import fs from "fs"
import path from "path"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    const cookiesDir = path.join(process.cwd(), "uploaded_cookies")
    
    if (!fs.existsSync(cookiesDir)) {
      fs.mkdirSync(cookiesDir, { recursive: true })
    }

    const files = fs.readdirSync(cookiesDir)
      .filter(file => file.endsWith(".txt") && file !== "metadata.json")
      .map(file => {
        const filePath = path.join(cookiesDir, file)
        const stats = fs.statSync(filePath)
        return {
          name: file,
          size: stats.size,
          createdAt: stats.birthtime,
          url: `/uploaded_cookies/${file}`
        }
      })

    // Always return HTML for directory listing
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Uploaded Cookies Files</title>
          <style>
            body { font-family: system-ui; padding: 2rem; max-width: 1200px; margin: 0 auto; background: #1a1a1a; color: #fff; }
            table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
            th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #333; }
            th { font-weight: 600; color: #fff; background: #2a2a2a; }
            a { color: #3b82f6; text-decoration: none; }
            a:hover { text-decoration: underline; }
            h1 { color: #fff; font-size: 2rem; margin-bottom: 2rem; }
          </style>
        </head>
        <body>
          <h1>Uploaded Cookies Files</h1>
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Size</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${files.map(file => `
                <tr>
                  <td><a href="${file.url}">${file.name}</a></td>
                  <td>${(file.size / 1024).toFixed(2)} KB</td>
                  <td>${new Date(file.createdAt).toLocaleString()}</td>
                  <td><a href="${file.url}" download>Download</a></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `
    res.setHeader("Content-Type", "text/html")
    res.send(html)
  } catch (error) {
    console.error("Error reading directory:", error)
    res.status(500).json({ message: "Failed to read directory" })
  }
}
