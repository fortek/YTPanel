
import { ChangeEvent, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAccountLists } from "@/contexts/AccountListsContext"

export function FileUpload() {
  const { addList } = useAccountLists()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listName, setListName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (!e.target.files?.length) return
    if (!listName.trim()) {
      setError("Please enter a name for the list")
      return
    }

    setIsLoading(true)
    try {
      const file = e.target.files[0]
      const text = await file.text()
      
      const accounts = text
        .split("\n")
        .filter(line => line.trim().length > 0)
        .map(line => {
          try {
            const cookies = line.split(";")
            const relevantCookies = cookies.filter(cookie => 
              cookie.includes("SID") || 
              cookie.includes("HSID") || 
              cookie.includes("SSID") ||
              cookie.includes("LOGIN_INFO")
            )
            
            if (relevantCookies.length < 2) return null

            return line.trim()
          } catch {
            return null
          }
        })
        .filter((account): account is string => account !== null)

      if (accounts.length === 0) {
        setError("No valid YouTube cookies found in the file. Please check the format.")
        return
      }

      addList(listName, accounts)
      setListName("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      setError("Failed to process the file. Please make sure it's a valid cookies file.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Upload YouTube Accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
