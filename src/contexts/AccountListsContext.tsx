
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
  addList: (name: string, accounts: string[]) => void
  setActiveList: (id: string | null) => void
  removeList: (id: string) => void
}

const STORAGE_KEY = "youtube_account_lists"
const ACTIVE_LIST_KEY = "youtube_active_list"

const AccountListsContext = createContext<AccountListsContextType | undefined>(undefined)

function loadLists(): AccountList[] {
  try {
    const savedLists = localStorage.getItem(STORAGE_KEY)
    if (!savedLists) return []
    
    const parsedLists = JSON.parse(savedLists)
    return parsedLists.map((list: any) => ({
      ...list,
      createdAt: new Date(list.createdAt)
    }))
  } catch (error) {
    console.error("Error loading lists:", error)
    return []
  }
}

function loadActiveListId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_LIST_KEY)
  } catch {
    return null
  }
}

export function AccountListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<AccountList[]>(() => loadLists())
  const [activeListId, setActiveListId] = useState<string | null>(() => loadActiveListId())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
    } catch (error) {
      console.error("Error saving lists:", error)
    }
  }, [lists])

  useEffect(() => {
    try {
      if (activeListId) {
        localStorage.setItem(ACTIVE_LIST_KEY, activeListId)
      } else {
        localStorage.removeItem(ACTIVE_LIST_KEY)
      }
    } catch (error) {
      console.error("Error saving active list:", error)
    }
  }, [activeListId])

  const addList = (name: string, accounts: string[]) => {
    const newList = {
      id: Date.now().toString(),
      name,
      accounts,
      createdAt: new Date()
    }
    setLists(prev => [...prev, newList])
    setActiveListId(newList.id)
  }

  const removeList = (id: string) => {
    setLists(prev => prev.filter(list => list.id !== id))
    if (activeListId === id) {
      setActiveListId(null)
    }
  }

  return (
    <AccountListsContext.Provider 
      value={{ 
        lists, 
        activeListId, 
        addList, 
        setActiveList: setActiveListId,
        removeList 
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
