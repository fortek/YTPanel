
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

    const response = await fetch("https://www.youtube.com/feed/subscriptions", {
      headers: {
        Cookie: cookies
      }
    })

    const html = await response.text()
    
    const isValid = response.ok && response.status === 200
    
    // Extract email from the response
    let email = ""
    if (isValid) {
      const emailMatch = html.match(/"email":"([^"]+)"/)
      if (emailMatch && emailMatch[1]) {
        email = emailMatch[1]
      }
    }

    return res.status(200).json({ isValid, email })
  } catch (error) {
    return res.status(500).json({ error: "Failed to check account" })
  }
}
