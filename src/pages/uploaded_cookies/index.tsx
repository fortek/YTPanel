import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Download, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import "@/lib/utils"

interface FileInfo {
  name: string
  size: number
  createdAt: string
  downloadUrl: string
}

export default function UploadedCookiesPage() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files")
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 py-12 px-4">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-zinc-50">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-zinc-50 mb-2">Uploaded Cookies</h1>
            <p className="text-zinc-400 text-lg">
              List of all uploaded cookie files
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-zinc-800 hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Uploaded Cookies Files</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Download URL</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.name}>
                    <TableCell className="font-medium">{file.name}</TableCell>
                    <TableCell>{(file.size / 1024).toFixed(2)} KB</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <a 
                        href={file.downloadUrl} 
                        className="text-blue-500 hover:text-blue-400 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {file.downloadUrl}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <a 
                        href={file.downloadUrl}
                        download
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
