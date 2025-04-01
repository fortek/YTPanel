import { useEffect, useState } from "react"
import { useAccountLists } from "@/contexts/AccountListsContext"
import { Button } from "@/components/ui/button"
import { FileText, Download, FileDown, Copy } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { enUS } from "date-fns/locale"
import { toast } from "sonner"

export default function UploadedCookies() {
  const { lists, isLoading } = useAccountLists()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopyUrl = async (url: string) => {
    try {
      if (typeof window === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API not available')
      }
      
      await navigator.clipboard.writeText(url)
      toast.success("URL copied to clipboard")
    } catch (error) {
      console.error('Failed to copy:', error)
      // Fallback для старых браузеров
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        toast.success("URL copied to clipboard")
      } catch (err) {
        toast.error("Failed to copy URL")
      }
      document.body.removeChild(textarea)
    }
  }

  if (!mounted) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Uploaded Lists</h1>
      <div className="grid gap-4">
        {lists.map((list) => {
          const fullUrl = `${window.location.origin}/api/lists/${list.id}/download`
          const fullUrlWithoutEmail = `${window.location.origin}/api/lists/${list.id}/download?includeEmail=false`

          return (
            <div
              key={list.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{list.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(list.createdAt, { addSuffix: true, locale: enUS })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.location.href = fullUrl}
                  >
                    <Download className="h-4 w-4" />
                    With email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.location.href = fullUrlWithoutEmail}
                  >
                    <FileDown className="h-4 w-4" />
                    Without email
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">URL with email:</span>
                  <code className="bg-zinc-800 px-2 py-1 rounded flex-1">{fullUrl}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopyUrl(fullUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">URL without email:</span>
                  <code className="bg-zinc-800 px-2 py-1 rounded flex-1">{fullUrlWithoutEmail}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopyUrl(fullUrlWithoutEmail)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
