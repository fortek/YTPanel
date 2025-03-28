import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { FileUpload } from './FileUpload'

interface List {
  id: string
  name: string
  totalCookies: string
  createdAt: string
}

export function Sidebar() {
  const [lists, setLists] = useState<List[]>([])
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/lists')
      const data = await response.json()
      setLists(data)
    } catch (error) {
      console.error('Ошибка получения списков:', error)
    }
  }

  const handleListClick = (id: string) => {
    setSelectedList(id)
    router.push(`/list/${id}`)
  }

  const handleUploadSuccess = () => {
    fetchLists()
  }

  return (
    <div className="w-64 bg-gray-800 text-white h-screen p-4">
      <h2 className="text-xl font-bold mb-4">Cookie Lists</h2>
      
      <FileUpload onSuccess={handleUploadSuccess} />

      <div className="mt-4 space-y-2">
        {lists.map((list) => (
          <div
            key={list.id}
            className={`p-3 cursor-pointer rounded transition-colors ${
              selectedList === list.id ? 'bg-gray-600' : 'hover:bg-gray-700'
            }`}
            onClick={() => handleListClick(list.id)}
          >
            <div className="font-medium truncate">{list.name}</div>
            <div className="text-sm text-gray-400">
              {list.totalCookies} cookies
            </div>
            <div className="text-xs text-gray-500">
              {new Date(list.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 