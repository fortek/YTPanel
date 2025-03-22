import { GetServerSideProps } from 'next'
import fs from 'fs'
import path from 'path'

export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const filename = params?.filename as string
  if (!filename) {
    return { notFound: true }
  }

  const cookiesDir = path.join(process.cwd(), "uploaded_cookies")
  const filePath = path.join(cookiesDir, filename)

  if (!fs.existsSync(filePath)) {
    return { notFound: true }
  }

  const fileContent = fs.readFileSync(filePath, "utf-8")
  
  res.setHeader("Content-Type", "text/plain")
  res.setHeader("Content-Disposition", `inline; filename=${filename}`)
  res.write(fileContent)
  res.end()

  return {
    props: {},
  }
}

export default function FilePage() {
  return null
} 