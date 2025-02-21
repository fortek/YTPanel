
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileUpload } from "./FileUpload";

interface List {
  id: string;
  name: string;
  serviceType: "youtube" | "vk";
}

interface SidebarProps {
  lists: List[];
  activeListId: string | null;
  onListSelect: (listId: string) => void;
}

export const Sidebar = ({ lists, activeListId, onListSelect }: SidebarProps) => {
  return (
    <div className="w-64 border-r h-screen p-4 flex flex-col gap-4">
      <FileUpload />
      
      <div className="flex-1">
        <h3 className="font-semibold mb-2">Your Lists</h3>
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-2">
            {lists.map((list) => (
              <Button
                key={list.id}
                variant={activeListId === list.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => onListSelect(list.id)}
              >
                <div className="flex items-center gap-2">
                  {list.name}
                  <span className="text-xs bg-primary/20 px-2 py-1 rounded">
                    {list.serviceType}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
