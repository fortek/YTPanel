
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Download } from "lucide-react"

interface FileInfo {
  name: string
  size: number
  createdAt: Date
}

export default function UploadedCookiesPage() {
  const [files, setFiles] = useState<FileInfo[]>([])

  useEffect(() => {
    const fetchFiles = async () => {
      const response = await fetch("/api/files")
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files)
      }
    }
    fetchFiles()
  }, [])

  return (
    <div className="container py-8">
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
                  <TableCell className="text-right">
                    <Link 
                      href={`/uploaded_cookies/${file.name}`}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
