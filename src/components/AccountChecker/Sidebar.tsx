
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAccountLists } from "@/contexts/AccountListsContext"
import { formatDistanceToNow } from "date-fns"
import { Trash2 } from "lucide-react"

export function Sidebar() {
  const { lists, activeListId, setActiveList, removeList } = useAccountLists()

  if (lists.length === 0) {
    return null
  }

  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Account Lists</h2>
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="space-y-1">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className={cn(
                    "flex items-center justify-between px-4 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                    activeListId === list.id && "bg-accent"
                  )}
                >
                  <button
                    onClick={() => setActiveList(list.id)}
                    className="flex-1 text-left"
                  >
                    <div className="font-medium">{list.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(list.createdAt, { addSuffix: true })}
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeList(list.id)}
                    className="h-8 w-8"
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
