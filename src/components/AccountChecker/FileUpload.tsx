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
      setError(`Пожалуйста, выберите файл с расширением ${accept}`)
      return
    }

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      setFilePreview({
        lines: lines.length,
        content: lines.slice(0, 5), // Показываем только первые 5 строк
        size: formatFileSize(file.size)
      })
      setSelectedFile(file)
      setError(null)
    } catch (err) {
      setError("Ошибка при чтении файла")
      console.error("File reading error:", err)
    }
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    handleFileSelect(e.target.files[0])
  }

  const handleSubmit = async () => {
    if (!selectedFile || (showNameInput && !listName.trim())) {
      setError(showNameInput ? "Пожалуйста, введите имя списка и выберите файл" : "Пожалуйста, выберите файл")
      return
    }

    setIsLoading(true)
    setUploadProgress(0)
    
    try {
      // Начало чтения файла
      setUploadProgress(10)
      const text = await selectedFile.text()
      
      // Обработка строк
      setUploadProgress(30)
      const lines = text.split("\n").filter(line => line.trim())
      
      if (lines.length === 0) {
        throw new Error("Файл пуст")
      }

      // Подготовка данных
      setUploadProgress(50)

      // Загрузка на сервер
      setUploadProgress(70)
      await onFileSelect(selectedFile, showNameInput ? listName : selectedFile.name)
      
      // Завершение
      setUploadProgress(100)
      setListName("")
      setSelectedFile(null)
      setFilePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Ошибка при обработке файла")
    } finally {
      setIsLoading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {showNameInput && (
        <div className="space-y-2">
          <Label htmlFor="listName">Название списка</Label>
          <Input
            id="listName"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            placeholder="Введите название для этого списка"
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
                  <span>{filePreview?.lines} строк</span>
                </div>
              </div>

              {filePreview && (
                <div className="mt-4 p-4 bg-muted/50 rounded-lg text-left">
                  <p className="text-sm font-medium mb-2">Предпросмотр:</p>
                  <div className="space-y-1">
                    {filePreview.content.map((line, index) => (
                      <p key={index} className="text-xs font-mono truncate">
                        {line}
                      </p>
                    ))}
                    {filePreview.lines > 5 && (
                      <p className="text-xs text-muted-foreground">
                        ... и еще {filePreview.lines - 5} строк
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
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Загрузить файл
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
                  Перетащите файл сюда или нажмите для выбора
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Поддерживаются только {accept} файлы
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
                ? `Загрузка... ${Math.round(uploadProgress)}%`
                : "Загрузка завершена!"}
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
