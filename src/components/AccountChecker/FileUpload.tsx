
import { ChangeEvent, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useAccountLists } from "@/contexts/AccountListsContext"

export function FileUpload() {
  const { addList } = useAccountLists()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listName, setListName] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setUploadProgress(0)
    
    if (!e.target.files?.length) return
    if (!listName.trim()) {
      setError("Please enter a name for the list")
      return
    }

    setIsLoading(true)
    const file = e.target.files[0]
    
    try {
      // Optimize chunk size for better performance
      const chunkSize = 5 * 1024 * 1024 // 5MB chunks
      const fileSize = file.size
      let offset = 0
      let text = ""

      while (offset < fileSize) {
        const chunk = file.slice(offset, offset + chunkSize)
        const chunkText = await chunk.text()
        text += chunkText
        offset += chunkSize
        
        // Update progress more frequently
        const progress = (offset / fileSize) * 100
        setUploadProgress(Math.min(progress, 99)) // Keep at 99% until fully processed
      }

      const accounts = text
        .split("\n")
        .filter(line => line.trim())
        .map(line => line.trim())

      if (accounts.length === 0) {
        throw new Error("The file appears to be empty")
      }

      await addList(listName, accounts)
      setUploadProgress(100) // Show 100% when complete
      setListName("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to process the file")
    } finally {
      setIsLoading(false)
      setTimeout(() => setUploadProgress(0), 1000) // Reset progress after a delay
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="listName">List Name</Label>
        <Input
          id="listName"
          value={listName}
          onChange={(e) => setListName(e.target.value)}
          placeholder="Enter a name for this list"
          disabled={isLoading}
          required
        />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".txt"
        className="hidden"
      />
      
      <Button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading || !listName.trim()}
        className="w-full relative"
      >
        <Upload className="w-4 h-4 mr-2" />
        {isLoading ? "Uploading..." : "Upload Cookies File"}
      </Button>

      {uploadProgress > 0 && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full h-2" />
          <p className="text-sm text-muted-foreground text-center">
            {uploadProgress < 100 
              ? `Uploading... ${Math.round(uploadProgress)}%`
              : "Upload complete!"}
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
