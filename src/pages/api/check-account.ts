
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { cookies } = req.body

    if (!cookies) {
      return res.status(400).json({ error: "Cookies are required" })
    }

    const response = await fetch("https://www.youtube.com/account", {
      headers: {
        Cookie: cookies,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    })

    const html = await response.text()
    
    const isValid = response.ok && response.status === 200
    
    let email = ""
    if (isValid) {
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
      const match = html.match(emailRegex)
      
      if (match) {
        email = match[0]
      }
    }

    // Log response for debugging
    console.log("Account check result:", { 
      isValid, 
      email,
      status: response.status,
      url: "https://www.youtube.com/account"
    })

    return res.status(200).json({ isValid, email })
  } catch (error) {
    console.error("Account check error:", error)
    return res.status(500).json({ error: "Failed to check account" })
  }
}
