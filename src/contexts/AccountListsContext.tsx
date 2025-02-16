
import { createContext, useContext, useState, ReactNode } from "react"

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

const AccountListsContext = createContext<AccountListsContextType | undefined>(undefined)

export function AccountListsProvider({ children }: { children: ReactNode }) {
  const [lists, setLists] = useState<AccountList[]>([])
  const [activeListId, setActiveListId] = useState<string | null>(null)

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
