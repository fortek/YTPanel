
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
  addList: (name: string, accounts: string[]) => Promise<void>
  setActiveList: (id: string | null) => void
  removeList: (id: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

const AccountListsContext = createContext<AccountListsContextType | undefined>(undefined)

const ACTIVE_LIST_KEY = "youtube_active_list"

export function AccountListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<AccountList[]>([])
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLists()
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedActiveListId = localStorage.getItem(ACTIVE_LIST_KEY)
      if (savedActiveListId && lists.some(list => list.id === savedActiveListId)) {
        setActiveListId(savedActiveListId)
      } else if (lists.length > 0 && !activeListId) {
        setActiveListId(lists[0].id)
      }
    }
  }, [lists, activeListId])

  useEffect(() => {
    if (activeListId) {
      localStorage.setItem(ACTIVE_LIST_KEY, activeListId)
    } else {
      localStorage.removeItem(ACTIVE_LIST_KEY)
    }
  }, [activeListId])

  const loadLists = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/lists")
      if (!response.ok) throw new Error("Failed to load lists")
      
      const data = await response.json()
      const loadedLists = data.map((list: any) => ({
        ...list,
        createdAt: new Date(list.createdAt)
      }))
      setLists(loadedLists)
    } catch (error) {
      setError("Failed to load account lists")
      console.error("Error loading lists:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addList = async (name: string, accounts: string[]) => {
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, accounts })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create list")
      }
      
      const newList = await response.json()
      const listWithDate = { ...newList, createdAt: new Date(newList.createdAt) }
      setLists(prev => [...prev, listWithDate])
      setActiveListId(listWithDate.id)
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

      if (!response.ok) throw new Error("Failed to delete list")

      setLists(prev => prev.filter(list => list.id !== id))
      if (activeListId === id) {
        const remainingLists = lists.filter(list => list.id !== id)
        setActiveListId(remainingLists.length > 0 ? remainingLists[0].id : null)
      }
    } catch (error) {
      console.error("Error removing list:", error)
      throw error
    }
  }

  return (
    <AccountListsContext.Provider 
      value={{ 
        lists, 
        activeListId, 
        addList, 
        setActiveList: setActiveListId,
        removeList,
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
