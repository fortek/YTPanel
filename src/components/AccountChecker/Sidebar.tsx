
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAccountLists } from "@/contexts/AccountListsContext"
import { formatDistanceToNow } from "date-fns"
import { Pencil, Trash2, Upload } from "lucide-react"
import { FileUpload } from "@/components/AccountChecker/FileUpload"

export function Sidebar() {
  const { lists, activeListId, setActiveList, removeList } = useAccountLists()

  const handleListSelect = (id: string) => {
    setActiveList(id)
  }

  return (
    <div className="pb-12 w-80 border-r flex flex-col h-screen">
      <div className="p-4 border-b">
        <FileUpload />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Account Lists</h2>
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
                        // Handle rename action
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
                        // Handle upload action
                      }}
                      className="h-8 w-8"
                    >
                      <Upload className="h-4 w-4" />
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
    </div>
  )
}
