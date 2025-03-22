import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface ProxyList {
  id: string
  name: string
  proxies: string[]
  createdAt: Date
}

interface ProxyListsContextType {
  lists: ProxyList[]
  activeListId: string | null
  activeList: ProxyList | null
  addList: (name: string, proxies: string[]) => Promise<void>
  setActiveList: (id: string | null) => Promise<void>
  removeList: (id: string) => Promise<void>
  renameList: (id: string, newName: string) => Promise<void>
  downloadList: (id: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

const ProxyListsContext = createContext<ProxyListsContextType | undefined>(undefined)

export function ProxyListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<ProxyList[]>([])
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [activeList, setActiveList] = useState<ProxyList | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadListNames()
  }, [])

  const loadListNames = async () => {
    try {
      const response = await fetch("/api/proxies")
      if (!response.ok) {
        throw new Error("Failed to load proxy lists")
      }
      
      const data = await response.json()
      const listsWithoutProxies = data.map((list: any) => ({
        ...list,
        createdAt: new Date(list.createdAt),
        proxies: []
      }))
      setLists(listsWithoutProxies)
    } catch (error) {
      setError("Failed to load proxy lists")
      console.error("Error loading lists:", error)
    }
  }

  const loadListContent = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/proxies/${id}`)
      if (!response.ok) {
        throw new Error("Failed to load proxy list content")
      }
      
      const data = await response.json()
      const updatedList = {
        ...data,
        createdAt: new Date(data.createdAt)
      }
      
      setActiveList(updatedList)
      setLists(prev => prev.map(list => 
        list.id === id ? { ...list, proxies: updatedList.proxies } : list
      ))
    } catch (error) {
      console.error("Error loading list content:", error)
      setError("Failed to load proxy list content")
    } finally {
      setIsLoading(false)
    }
  }

  const setActiveListAndLoad = async (id: string | null) => {
    setActiveListId(id)
    if (id === null) {
      setActiveList(null)
      return
    }
    await loadListContent(id)
  }

  const addList = async (name: string, proxies: string[]) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/proxies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, proxies })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create proxy list")
      }
      
      const newList = {
        ...data,
        createdAt: new Date(data.createdAt),
        proxies: []
      }
      setLists(prev => [...prev, newList])
      await setActiveListAndLoad(newList.id)
    } catch (error) {
      console.error("Error adding list:", error)
      setError(error instanceof Error ? error.message : "Failed to create proxy list")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const removeList = async (id: string) => {
    try {
      const response = await fetch(`/api/proxies/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to delete proxy list")
      }

      setLists(prev => prev.filter(list => list.id !== id))
      if (activeListId === id) {
        setActiveListId(null)
        setActiveList(null)
      }
    } catch (error) {
      console.error("Error removing list:", error)
      throw error
    }
  }

  const renameList = async (id: string, newName: string) => {
    try {
      const response = await fetch(`/api/proxies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
      })

      if (!response.ok) {
        throw new Error("Failed to rename proxy list")
      }

      const updatedList = await response.json()
      setLists(prev => prev.map(list => 
        list.id === id ? { ...list, name: updatedList.name } : list
      ))
      if (activeList?.id === id) {
        setActiveList(prev => prev ? { ...prev, name: updatedList.name } : null)
      }
    } catch (error) {
      console.error("Error renaming list:", error)
      throw error
    }
  }

  const downloadList = async (id: string) => {
    try {
      const list = lists.find(l => l.id === id)
      if (!list) throw new Error("List not found")

      const response = await fetch(`/api/proxies/${id}/download`)
      if (!response.ok) throw new Error("Failed to download proxy list")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${list.name}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading list:", error)
      throw error
    }
  }

  return (
    <ProxyListsContext.Provider 
      value={{ 
        lists, 
        activeListId,
        activeList,
        addList, 
        setActiveList: setActiveListAndLoad,
        removeList,
        renameList,
        downloadList,
        isLoading,
        error
      }}
    >
      {children}
    </ProxyListsContext.Provider>
  )
}

export function useProxyLists() {
  const context = useContext(ProxyListsContext)
  if (context === undefined) {
    throw new Error("useProxyLists must be used within a ProxyListsProvider")
  }
  return context
} 