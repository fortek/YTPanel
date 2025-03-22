import { useState } from "react"
import { useProxyLists } from "../../contexts/ProxyListsContext"
import { FileUpload } from "../AccountChecker/FileUpload"
import { toast } from "sonner"

// Функция для проверки формата прокси
function isValidProxy(proxy: string): boolean {
  const parts = proxy.split(":")
  if (parts.length !== 4) return false
  
  // Проверяем IP
  const ipParts = parts[0].split(".")
  if (ipParts.length !== 4) return false
  if (!ipParts.every(part => {
    const num = parseInt(part)
    return !isNaN(num) && num >= 0 && num <= 255
  })) return false
  
  // Проверяем порт
  const port = parseInt(parts[1])
  if (isNaN(port) || port < 1 || port > 65535) return false
  
  // Проверяем логин и пароль
  return parts[2].length > 0 && parts[3].length > 0
}

export function ProxyLists() {
  const { lists, activeListId, activeList, setActiveList, removeList, renameList, downloadList, addList, isLoading, error } = useProxyLists()
  const [editingName, setEditingName] = useState<string | null>(null)
  const [newName, setNewName] = useState("")

  const handleRename = async (id: string) => {
    if (!newName.trim()) return
    try {
      await renameList(id, newName.trim())
      setEditingName(null)
      setNewName("")
      toast.success("Список успешно переименован")
    } catch (error) {
      toast.error("Ошибка при переименовании списка")
    }
  }

  const handleFileUpload = async (file: File, name: string) => {
    try {
      const text = await file.text()
      const lines = text.split("\n").map(line => line.trim()).filter(Boolean)
      
      // Проверяем формат прокси
      const validProxies = lines.filter(isValidProxy)
      
      if (validProxies.length === 0) {
        toast.error("Не найдено валидных прокси в файле")
        return
      }
      
      if (validProxies.length < lines.length) {
        toast.warning(`Пропущено ${lines.length - validProxies.length} невалидных прокси`)
      }
      
      await addList(name, validProxies)
      toast.success("Список прокси успешно загружен")
    } catch (error) {
      console.error("Error uploading proxies:", error)
      toast.error("Ошибка при загрузке списка прокси")
    }
  }

  const handleRemoveList = async (id: string) => {
    try {
      await removeList(id)
      toast.success("Список успешно удален")
    } catch (error) {
      toast.error("Ошибка при удалении списка")
    }
  }

  const handleDownloadList = async (id: string) => {
    try {
      await downloadList(id)
      toast.success("Список успешно скачан")
    } catch (error) {
      toast.error("Ошибка при скачивании списка")
    }
  }

  return (
    <div className="flex h-full">
      {/* Боковая панель со списками */}
      <div className="w-64 bg-gray-800 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Списки прокси</h2>
        <div className="space-y-2">
          {lists.map(list => (
            <div
              key={list.id}
              className={`p-2 rounded cursor-pointer ${
                activeListId === list.id ? "bg-blue-600" : "hover:bg-gray-700"
              }`}
            >
              {editingName === list.id ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 bg-gray-700 rounded px-2 py-1"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(list.id)}
                    className="text-green-400 hover:text-green-300"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingName(null)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span
                    onClick={() => setActiveList(list.id)}
                    className="flex-1 truncate"
                  >
                    {list.name}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingName(list.id)
                        setNewName(list.name)
                      }}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDownloadList(list.id)}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      ⬇
                    </button>
                    <button
                      onClick={() => handleRemoveList(list.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Основная область */}
      <div className="flex-1 p-4 overflow-y-auto">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded mb-4">
            {error}
          </div>
        )}

        {activeList ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">{activeList.name}</h2>
            <div className="bg-gray-800 rounded p-4">
              <div className="space-y-2">
                {activeList.proxies.map((proxy, index) => (
                  <div
                    key={index}
                    className="p-2 bg-gray-700 rounded flex items-center justify-between"
                  >
                    <span className="font-mono">{proxy}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(proxy)
                          toast.success("Прокси скопирован в буфер обмена")
                        }}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Загрузите список прокси</h2>
            <p className="text-gray-400 mb-4">
              Формат: IP:PORT:LOGIN:PASSWORD (по одной прокси на строку)
            </p>
            <FileUpload
              onFileSelect={handleFileUpload}
              accept=".txt"
              maxSize={10 * 1024 * 1024} // 10MB
              showNameInput={true}
            />
          </div>
        )}
      </div>
    </div>
  )
} 