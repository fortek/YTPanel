
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileText, Type } from "lucide-react"
import { useAccountLists } from "@/contexts/AccountListsContext"

type AccountStatus = "pending" | "valid" | "invalid"

interface Account {
  id: string
  login?: string
  password?: string
  cookies?: string
  status: AccountStatus
  serviceType: "youtube" | "vk"
}

export const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null)
  const [listName, setListName] = useState("")
  const [serviceType, setServiceType] = useState<"youtube" | "vk">("youtube")
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const { addList } = useAccountLists()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      if (!listName) {
        const fileName = e.target.files[0].name.replace(".txt", "")
        setListName(fileName)
      }
    }
  }

  const parseAccounts = (content: string, type: "youtube" | "vk"): Account[] => {
    const lines = content.split("\n").filter(line => line.trim())
    
    if (type === "vk") {
      return lines.map((line, index) => {
        const [login, password] = line.split(":")
        return {
          id: `vk-${index}`,
          login: login?.trim(),
          password: password?.trim(),
          status: "pending" as AccountStatus,
          serviceType: "vk"
        }
      })
    } else {
      return lines.map((line, index) => ({
        id: `yt-${index}`,
        cookies: line.trim(),
        status: "pending" as AccountStatus,
        serviceType: "youtube"
      }))
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file first",
        variant: "destructive",
      })
      return
    }

    if (!listName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your list",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const content = await file.text()
      const accounts = parseAccounts(content, serviceType)
      
      await addList(listName.trim(), accounts, serviceType)

      toast({
        title: "Success",
        description: "Accounts uploaded successfully",
      })
      setFile(null)
      setListName("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload accounts",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-primary/10">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Accounts
        </CardTitle>
        <CardDescription>
          Add new accounts to check their status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select 
          value={serviceType} 
          onValueChange={(value: "youtube" | "vk") => setServiceType(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vk">VK</SelectItem>
          </SelectContent>
        </Select>

        <div className="space-y-2">
          <div className="relative">
            <Input
              placeholder="Enter list name"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              className="pl-9"
            />
            <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="relative">
            <Input
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              className="cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4 hover:file:bg-primary/20 transition-all"
            />
            <FileText className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground">
            {serviceType === "vk" 
              ? "Upload a text file with VK accounts (format: login:password)"
              : "Upload a text file with YouTube cookies (one per line)"
            }
          </p>
        </div>
        
        <Button 
          onClick={handleUpload}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
          disabled={!file || isUploading || !listName.trim()}
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4 animate-pulse" />
              Uploading...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload {serviceType === "vk" ? "VK" : "YouTube"} Accounts
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
