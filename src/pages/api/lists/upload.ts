import { NextApiRequest, NextApiResponse } from "next"
import connectDB from "@/lib/mongodb"
import { CookieList } from "@/models/CookieList"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: false
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { name, accounts } = req.body

    if (!name || !accounts || !Array.isArray(accounts)) {
      return res.status(400).json({ error: "Name and accounts array are required" })
    }

    await connectDB()

    // Преобразуем аккаунты в формат для MongoDB
    const cookies = accounts.map(account => {
      const [cookie, email] = account.split("|")
      return {
        email: email?.trim() || "",
        cookie: cookie.trim()
      }
    }).filter(acc => acc.email && acc.cookie)

    const cleanCookies = cookies.map(c => c.cookie)

    // Создаем новый список
    const cookieList = await CookieList.create({
      name,
      cookies,
      cleanCookies
    })

    return res.status(200).json(cookieList)
  } catch (error) {
    console.error("Error uploading list:", error)
    return res.status(500).json({ error: "Failed to upload list" })
  }
} 