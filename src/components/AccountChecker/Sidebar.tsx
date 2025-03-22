import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAccountLists } from "@/contexts/AccountListsContext"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Download, Loader2, Network, RefreshCw } from "lucide-react"
import { FileUpload } from "@/components/AccountChecker/FileUpload"
import { useState } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/router"
import { Label } from "@/components/ui/label"
import { useProxy } from "@/contexts/ProxyContext"

export function Sidebar() {
  const { lists, activeListId, setActiveList, removeList, renameList, downloadList, addList, isLoading } = useAccountLists()
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const { proxy, setProxy } = useProxy()
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleListSelect = (id: string) => {
    setActiveList(id)
  }

  const handleRename = async () => {
    if (!selectedListId || !newName.trim()) return

    try {
      await renameList(selectedListId, newName.trim())
      setIsRenameDialogOpen(false)
      setNewName("")
      setSelectedListId(null)
      toast.success("List renamed successfully")
    } catch (error) {
      toast.error("Failed to rename list")
    }
  }

  const handleDownload = async (id: string) => {
    try {
      await downloadList(id)
      toast.success("List downloaded successfully")
    } catch (error) {
      toast.error("Failed to download list")
    }
  }

  const openRenameDialog = (id: string, currentName: string) => {
    setSelectedListId(id)
    setNewName(currentName)
    setIsRenameDialogOpen(true)
  }

  const handleFileUpload = async (file: File, name: string) => {
    const text = await file.text()
    const accounts = text.split("\n").map(line => {
      const [cookies, email] = line.split("|")
      return email ? `${cookies.trim()}|${email.trim()}` : cookies.trim()
    }).filter(Boolean)
    await addList(name, accounts)
  }

  const handleUpdate = async () => {
    try {
      setIsUpdating(true)
      toast.info("Начало процесса обновления...")
      
      const response = await fetch('/api/update', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to update')
      }

      toast.success(`Обновление успешно завершено. Путь проекта: ${data.details.projectRoot}`)
      toast.info("Перезагрузка страницы через 15 секунд...")
      
      // Даем больше времени процессу Next.js запуститься
      setTimeout(() => {
        window.location.reload()
      }, 15000)
    } catch (error) {
      console.error('Update error:', error)
      toast.error(`Ошибка при обновлении: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <div className="pb-12 w-80 border-r flex flex-col h-screen">
        <div className="p-4 border-b">
          <FileUpload onFileSelect={handleFileUpload} />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2 px-4">
              <h2 className="text-lg font-semibold">Account Lists</h2>
            </div>
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <div className="space-y-1">
                {lists.map((list) => (
                  <div
                    key={list.id}
                    className={cn(
                      "flex items-center justify-between px-4 py-2 rounded-md transition-colors hover:bg-zinc-800/50 cursor-pointer group",
                      activeListId === list.id && "bg-zinc-800/30 ring-1 ring-zinc-700/50"
                    )}
                    onClick={() => handleListSelect(list.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{list.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(list.createdAt, { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          openRenameDialog(list.id, list.name)
                        }}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(list.id)
                        }}
                        className="h-8 w-8"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeList(list.id)
                        }}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <div className="p-4 border-t">
          <div className="space-y-2">
            <Label htmlFor="proxy">Прокси (необязательно):</Label>
            <Input
              id="proxy"
              placeholder="IP:PORT:LOGIN:PASS"
              value={proxy}
              onChange={(e) => setProxy(e.target.value)}
              className="w-full bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
          </div>
        </div>
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isUpdating && "animate-spin")} />
            {isUpdating ? "Обновление..." : "Обновить панель"}
          </Button>
        </div>
      </div>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 shadow-lg sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-zinc-50">Rename List</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Enter a new name for your list below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              className="w-full bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              autoFocus
            />
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
              className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRename}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
