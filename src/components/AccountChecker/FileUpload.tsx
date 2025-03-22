import { ChangeEvent, useRef, useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, X, Loader2, FileCode, FileCheck } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useAccountLists } from "@/contexts/AccountListsContext"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface FilePreview {
  lines: number
  content: string[]
  size: string
}

interface FileUploadProps {
  onFileSelect: (file: File, name: string) => Promise<void>
  accept?: string
  showNameInput?: boolean
}

export function FileUpload({ onFileSelect, accept = ".txt", showNameInput = true }: FileUploadProps) {
  const { addList } = useAccountLists()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listName, setListName] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith(accept)) {
      setError(`Please select a file with extension ${accept}`)
      return
    }

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      setFilePreview({
        lines: lines.length,
        content: lines.slice(0, 5), // Show only first 5 lines
        size: formatFileSize(file.size)
      })
      setSelectedFile(file)
      setError(null)
    } catch (err) {
      setError("Error reading file")
      console.error("File reading error:", err)
    }
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    handleFileSelect(e.target.files[0])
  }

  const handleSubmit = async () => {
    if (!selectedFile || (showNameInput && !listName.trim())) {
      setError(showNameInput ? "Please enter a list name and select a file" : "Please select a file")
      return
    }

    setIsLoading(true)
    setUploadProgress(0)
    
    try {
      // Start reading file
      setUploadProgress(10)
      const text = await selectedFile.text()
      
      // Process lines
      setUploadProgress(30)
      const lines = text.split("\n").filter(line => line.trim())
      
      if (lines.length === 0) {
        throw new Error("File is empty")
      }

      // Prepare data
      setUploadProgress(50)

      // Upload to server
      setUploadProgress(70)
      await onFileSelect(selectedFile, showNameInput ? listName : selectedFile.name)
      
      // Complete
      setUploadProgress(100)
      setListName("")
      setSelectedFile(null)
      setFilePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Error processing file")
    } finally {
      setIsLoading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {showNameInput && (
        <div className="space-y-2">
          <Label htmlFor="listName">List Name</Label>
          <Input
            id="listName"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="Enter a name for this list"
            disabled={isLoading}
            required
            className="w-full"
          />
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept={accept}
        className="hidden"
      />
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          "hover:border-primary hover:bg-primary/5 cursor-pointer"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center space-x-2">
                <FileText className="w-8 h-8 text-primary" />
                <span className="font-medium">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                    setFilePreview(null)
                    setError(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <FileCheck className="w-4 h-4" />
                  <span>{filePreview?.size}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileCode className="w-4 h-4" />
                  <span>{filePreview?.lines} lines</span>
                </div>
              </div>

              {filePreview && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg text-left">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <div className="space-y-1">
                    {filePreview.content.map((line, index) => (
                      <p key={index} className="text-xs font-mono truncate">
                        {line}
                      </p>
                    ))}
                    {filePreview.lines > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ... and {filePreview.lines - 5} more lines
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  handleSubmit()
                }}
                disabled={isLoading || (showNameInput && !listName.trim())}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-2"
            >
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Drag and drop a file here or click to select
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Only {accept} files are supported
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {uploadProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <Progress value={uploadProgress} className="w-full h-2" />
            <p className="text-sm text-muted-foreground text-center">
              {uploadProgress < 100 
                ? `Uploading... ${Math.round(uploadProgress)}%`
                : "Upload completed!"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
