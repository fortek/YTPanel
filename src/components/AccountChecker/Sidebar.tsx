import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAccountLists } from "@/contexts/AccountListsContext"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, Download, Loader2, Network, RefreshCw, FileText, FileDown } from "lucide-react"
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
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [newName, setNewName] = useState("")
  const { proxy, setProxy } = useProxy()
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState<boolean | null>(null)
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const [renamingListId, setRenamingListId] = useState<string | null>(null)
  const [downloadingListId, setDownloadingListId] = useState<string | null>(null)

  const handleListSelect = (id: string) => {
    setActiveList(id)
  }

  const handleRename = async () => {
    if (!selectedListId || !newName.trim()) return

    try {
      setRenamingListId(selectedListId)
      await renameList(selectedListId, newName.trim())
      
      if (selectedListId === activeListId) {
        setActiveList(newName.trim())
      }
      
      setIsRenameDialogOpen(false)
      setNewName("")
      setSelectedListId(newName.trim())
      toast.success("Список успешно переименован")
    } catch (error) {
      toast.error("Не удалось переименовать список")
    } finally {
      setRenamingListId(null)
    }
  }

  const handleDownload = async (id: string) => {
    try {
      setDownloadingListId(id)
      await downloadList(id)
      toast.success("Список успешно скачан")
    } catch (error) {
      toast.error("Не удалось скачать список")
    } finally {
      setDownloadingListId(null)
    }
  }

  const handleDownloadWithoutEmail = (id: string) => {
    window.location.href = `/api/lists/${id}/download?includeEmail=false`
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

  const handleUpdateClick = () => {
    setIsUpdateDialogOpen(true)
  }

  const handleUpdateConfirm = async () => {
    setIsUpdateDialogOpen(false)
    try {
      setUpdateLoading(true)
      toast.info("Starting update process...")

      const response = await fetch('/api/update', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Update failed')
      }

      const data = await response.json()
      toast.success(data.message || 'Update completed successfully')

      // Delay before reload
      setTimeout(() => {
        toast.info("Page will reload in 15 seconds...")
        setTimeout(() => {
          window.location.reload()
        }, 15000)
      }, 3000)
    } catch (error) {
      toast.error(`Update error: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setUpdateLoading(false)
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
                      <div className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {list.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(list.createdAt, { addSuffix: true })}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          openRenameDialog(list.id, list.name)
                        }}
                        disabled={renamingListId === list.id}
                        className="h-8 w-8"
                        title="Rename list"
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
                        disabled={downloadingListId === list.id}
                        className="h-8 w-8"
                        title="Download list"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadWithoutEmail(list.id)
                        }}
                        className="h-8 w-8"
                        title="Download without email"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeList(list.id)
                        }}
                        className="h-8 w-8"
                        title="Remove list"
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
            <Label htmlFor="proxy">Proxy (optional):</Label>
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
            onClick={handleUpdateClick}
            disabled={updateLoading}
          >
            {updateLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </div>
            ) : (
              <div className="flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Panel
              </div>
            )}
          </Button>
        </div>
      </div>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 shadow-lg sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-zinc-50">Переименовать список</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Введите новое имя для списка.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Введите новое имя"
              className="w-full bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              autoFocus
              disabled={renamingListId !== null}
            />
          </div>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsRenameDialogOpen(false)
                setNewName("")
                setSelectedListId(null)
                setRenamingListId(null)
              }}
              className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
              disabled={renamingListId !== null}
            >
              Отмена
            </Button>
            <Button 
              onClick={handleRename}
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={renamingListId !== null || !newName.trim() || newName.trim() === selectedListId}
            >
              {renamingListId !== null ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Переименование...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="bg-zinc-900 border border-zinc-800 shadow-lg sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-zinc-50">Panel Update</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to update the panel? This action will reload the page in 15 seconds.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
              className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateConfirm}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
