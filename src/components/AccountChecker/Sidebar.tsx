
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAccountLists } from "@/contexts/AccountListsContext"
import { formatDistanceToNow } from "date-fns"
import { Trash2 } from "lucide-react"
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
                    "flex items-center justify-between px-4 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer group",
                    activeListId === list.id && "bg-accent"
                  )}
                  onClick={() => handleListSelect(list.id)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{list.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(list.createdAt, { addSuffix: true })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeList(list.id)
                    }}
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
