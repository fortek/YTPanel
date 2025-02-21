
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileUpload } from "./FileUpload"
import { Youtube, Users } from "lucide-react"

interface List {
  id: string
  name: string
  serviceType: "youtube" | "vk"
}

interface SidebarProps {
  lists: List[]
  activeListId: string | null
  onListSelect: (listId: string) => void
}

export const Sidebar = ({ lists, activeListId, onListSelect }: SidebarProps) => {
  return (
    <div className="w-72 border-r border-primary/10 h-screen p-4 flex flex-col gap-6 bg-background/50 backdrop-blur-sm">
      <FileUpload />
      
      <div className="flex-1">
        <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Your Lists
        </h3>
        <ScrollArea className="h-[calc(100vh-380px)]">
          <div className="space-y-2 pr-4">
            {lists.map((list) => (
              <Button
                key={list.id}
                variant={activeListId === list.id ? "default" : "ghost"}
                className="w-full justify-start group transition-all duration-200"
                onClick={() => onListSelect(list.id)}
              >
                <div className="flex items-center gap-2 w-full">
                  {list.serviceType === "youtube" ? (
                    <Youtube className="w-4 h-4 text-red-500" />
                  ) : (
                    <Users className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="flex-1 truncate">{list.name}</span>
                  <span className="text-xs bg-primary/10 px-2 py-1 rounded-full group-hover:bg-primary/20 transition-colors">
                    {list.serviceType}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
