
import { ChangeEvent, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
      // Read file in chunks to show progress
      const chunkSize = 1024 * 1024 // 1MB chunks
      const fileSize = file.size
      let offset = 0
      let text = ""

      while (offset < fileSize) {
        const chunk = file.slice(offset, offset + chunkSize)
        const chunkText = await chunk.text()
        text += chunkText
        offset += chunkSize
        setUploadProgress(Math.min((offset / fileSize) * 100, 100))
      }

      const accounts = text
        .split("\n")
        .filter(line => line.trim().length > 0)
        .map(line => line.trim())

      if (accounts.length === 0) {
        setError("The file appears to be empty. Please check the file content.")
        return
      }

      await addList(listName, accounts)
      setListName("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      setError("Failed to process the file. Please try again.")
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
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
        onClick={handleButtonClick}
        disabled={isLoading}
        className="w-full"
      >
        <Upload className="w-4 h-4 mr-2" />
        {isLoading ? "Processing..." : "Upload Cookies File"}
      </Button>

      {isLoading && uploadProgress > 0 && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Uploading... {Math.round(uploadProgress)}%
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
