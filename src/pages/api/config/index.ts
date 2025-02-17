
import { NextApiRequest, NextApiResponse } from "next"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '200mb'
    },
    responseLimit: false
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: "API config endpoint" })
}
