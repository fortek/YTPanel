
import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface AccountList {
  id: string
  name: string
  accounts: string[]
  createdAt: Date
}

interface AccountListsContextType {
  lists: AccountList[]
  activeListId: string | null
  activeList: AccountList | null
  addList: (name: string, accounts: string[]) => Promise<void>
  setActiveList: (id: string | null) => Promise<void>
  removeList: (id: string) => Promise<void>
  renameList: (id: string, newName: string) => Promise<void>
  downloadList: (id: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

const AccountListsContext = createContext<AccountListsContextType | undefined>(undefined)

export function AccountListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<AccountList[]>([])
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [activeList, setActiveList] = useState<AccountList | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadListNames()
  }, [])

  const loadListNames = async () => {
    try {
      const response = await fetch("/api/lists")
      if (!response.ok) {
        throw new Error("Failed to load lists")
      }
      
      const data = await response.json()
      const listsWithoutAccounts = data.map((list: any) => ({
        ...list,
        createdAt: new Date(list.createdAt),
        accounts: []
      }))
      setLists(listsWithoutAccounts)
    } catch (error) {
      setError("Failed to load account lists")
      console.error("Error loading lists:", error)
    }
  }

  const loadListContent = async (id: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/lists/${id}`, {
        method: "GET"
      })
      if (!response.ok) {
        throw new Error("Failed to load list content")
      }
      
      const data = await response.json()
      const updatedList = {
        ...data,
        createdAt: new Date(data.createdAt)
      }
      
      setActiveList(updatedList)
      setLists(prev => prev.map(list => 
        list.id === id ? { ...list, accounts: updatedList.accounts } : list
      ))
    } catch (error) {
      console.error("Error loading list content:", error)
      setError("Failed to load list content")
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

  const addList = async (name: string, accounts: string[]) => {
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, accounts })
      })

      if (!response.ok) {
        throw new Error("Failed to create list")
      }
      
      const newList = await response.json()
      const listWithDate = { 
        ...newList, 
        createdAt: new Date(newList.createdAt),
        accounts: []
      }
      setLists(prev => [...prev, listWithDate])
      await setActiveListAndLoad(newList.id)
    } catch (error) {
      console.error("Error adding list:", error)
      throw error
    }
  }

  const removeList = async (id: string) => {
    try {
      const response = await fetch(`/api/lists/${id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Failed to delete list")
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
      const response = await fetch(`/api/lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName })
      })

      if (!response.ok) {
        throw new Error("Failed to rename list")
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

      const response = await fetch(`/api/lists/${id}/download`)
      if (!response.ok) throw new Error("Failed to download list")

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
    <AccountListsContext.Provider 
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
    </AccountListsContext.Provider>
  )
}

export function useAccountLists() {
  const context = useContext(AccountListsContext)
  if (context === undefined) {
    throw new Error("useAccountLists must be used within an AccountListsProvider")
  }
  return context
}
