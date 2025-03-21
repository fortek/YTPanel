
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
      .filter(file => file.endsWith(".txt"))
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

    if (req.headers.accept?.includes("application/json")) {
      res.status(200).json({ files })
    } else {
      // Render HTML directory listing
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Uploaded Cookies Files</title>
            <style>
              body { font-family: system-ui; padding: 2rem; max-width: 1200px; margin: 0 auto; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
              th { font-weight: 600; }
              a { color: #2563eb; text-decoration: none; }
              a:hover { text-decoration: underline; }
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
                    <td><a href="${file.url}">Download</a></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </body>
        </html>
      `
      res.setHeader("Content-Type", "text/html")
      res.send(html)
    }
  } catch (error) {
    console.error("Error reading directory:", error)
    res.status(500).json({ message: "Failed to read directory" })
  }
}
