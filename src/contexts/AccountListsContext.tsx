
import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface Account {
  id: string;
  login?: string;
  password?: string;
  cookies?: string;
  status: "pending" | "valid" | "invalid";
  serviceType: "youtube" | "vk";
}

interface AccountList {
  id: string;
  name: string;
  serviceType: "youtube" | "vk";
  accounts: Account[];
  createdAt: Date;
}

interface AccountListsContextType {
  lists: AccountList[];
  activeListId: string | null;
  setActiveListId: (id: string | null) => void;
  addList: (name: string, accounts: Account[], serviceType: "youtube" | "vk") => Promise<void>;
  removeList: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AccountListsContext = createContext<AccountListsContextType | undefined>(undefined)

const ACTIVE_LIST_KEY = "account_checker_active_list"

export function AccountListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<AccountList[]>([])
  const [activeListId, setActiveListId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(ACTIVE_LIST_KEY)
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLists()
  }, [])

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
      setLists(data.map((list: any) => ({
        ...list,
        createdAt: new Date(list.createdAt)
      })))
    } catch (error) {
      setError("Failed to load account lists")
      console.error("Error loading lists:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addList = async (name: string, accounts: Account[], serviceType: "youtube" | "vk") => {
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, accounts, serviceType })
      })

      if (!response.ok) throw new Error("Failed to create list")
      
      const newList = await response.json()
      setLists(prev => [...prev, { ...newList, createdAt: new Date(newList.createdAt) }])
      setActiveListId(newList.id)
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
        setActiveListId(null)
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
        setActiveListId,
        addList,
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
