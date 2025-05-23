import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface AccountList {
  id: string
  name: string
  totalCookies: number
  createdAt: string
  accounts?: string[]
  total: number
  pagination?: {
    page: number
    pageSize: number
    hasMore: boolean
  }
}

interface AccountListsContextType {
  lists: AccountList[]
  setLists: (lists: AccountList[]) => void
  activeListId: string | null
  activeList: AccountList | null
  addList: (name: string, accounts: string[]) => Promise<void>
  setActiveList: (id: string | null) => Promise<void>
  removeList: (id: string) => Promise<void>
  renameList: (id: string, newName: string) => Promise<void>
  downloadList: (id: string) => Promise<void>
  loadMoreAccounts: (id: string) => Promise<string[] | undefined>
  isLoading: boolean
  error: string | null
  loadListNames: () => Promise<void>
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
      setLists(data)
    } catch (error) {
      setError("Failed to load account lists")
      console.error("Error loading lists:", error)
    }
  }

  const loadListContent = async (id: string, page: number = 1) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/lists/${id}?page=${page}&pageSize=10000`)
      if (!response.ok) {
        throw new Error("Failed to load list content")
      }
      
      const data = await response.json()
      const updatedList = {
        ...data,
        createdAt: new Date(data.createdAt)
      }
      
      if (page === 1) {
        setActiveList(updatedList)
        setLists(prev => prev.map(list => 
          list.id === id ? { ...list, accounts: updatedList.accounts, pagination: updatedList.pagination } : list
        ))
      } else {
        setActiveList(prev => prev ? {
          ...prev,
          accounts: [...(prev.accounts || []), ...(updatedList.accounts || [])],
          pagination: updatedList.pagination
        } : null)
        setLists(prev => prev.map(list => 
          list.id === id ? {
            ...list,
            accounts: [...(list.accounts || []), ...(updatedList.accounts || [])],
            pagination: updatedList.pagination
          } : list
        ))
      }
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
      const chunkSize = 1000 // Размер чанка в строках
      const chunks = []
      let newList = null
      
      // Разбиваем массив на чанки
      for (let i = 0; i < accounts.length; i += chunkSize) {
        chunks.push(accounts.slice(i, i + chunkSize))
      }
      
      try {
        // Create a list with an empty accounts array
        const response = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, accounts: [] })
        })

        if (!response.ok) {
          throw new Error("Failed to create list")
        }
        
        newList = await response.json()
        const listWithDate = { 
          ...newList, 
          createdAt: new Date(newList.createdAt),
          accounts: []
        }
        setLists(prev => [...prev, listWithDate])
      } catch (error) {
        console.error("Error creating initial list:", error)
        throw new Error("Failed to create initial list")
      }

      // Отправляем каждый чанк отдельно с повторными попытками
      for (let i = 0; i < chunks.length; i++) {
        let retries = 3
        let success = false

        while (retries > 0 && !success) {
          try {
            const chunkResponse = await fetch(`/api/lists/${newList.id}/append`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accounts: chunks[i] })
            })

            if (!chunkResponse.ok) {
              const errorData = await chunkResponse.json()
              throw new Error(errorData.error || `Failed to append chunk ${i + 1}`)
            }

            success = true
          } catch (error) {
            console.error(`Error uploading chunk ${i + 1}, attempt ${4 - retries}:`, error)
            retries--
            
            if (retries === 0) {
              // Если все попытки исчерпаны, удаляем список и выбрасываем ошибку
              await removeList(newList.id)
              throw new Error(`Failed to upload chunk ${i + 1} after multiple attempts`)
            }
            
            // Ждем перед следующей попыткой
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

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
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete list");
      }
      setLists(prev => prev.filter(list => list.id !== id));
      if (activeListId === id) {
        setActiveListId(null);
        setActiveList(null);
      }
      await loadListNames();
    } catch (error) {
      console.error("Error removing list:", error);
      throw error;
    }
  };

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
      // Обновляем id и name в списках
      setLists(prev => prev.map(list => 
        list.id === id ? { ...list, id: newName, name: newName } : list
      ))
      // Обновляем активный список если он был переименован
      if (activeList?.id === id) {
        setActiveList(prev => prev ? { ...prev, id: newName, name: newName } : null)
        setActiveListId(newName)
      }
      // Обновляем списки в сайдбаре
      await loadListNames();
    } catch (error) {
      console.error("Error renaming list:", error)
      throw error
    }
  }

  const downloadList = async (id: string) => {
    try {
      const list = lists.find(l => l.id === id)
      if (!list) throw new Error("List not found")
      
      window.location.href = `/api/lists/${id}/download`
    } catch (error) {
      console.error("Error downloading list:", error)
      throw error
    }
  }

  const loadMoreAccounts = async (id: string) => {
    const list = lists.find(l => l.id === id)
    if (!list?.pagination?.hasMore) return undefined
    
    try {
      const nextPage = activeList?.pagination?.page ? activeList.pagination.page + 1 : 1
      const response = await fetch(`/api/lists/${id}?page=${nextPage}&pageSize=10000`)
      if (!response.ok) {
        throw new Error("Failed to load more accounts")
      }
      
      const data = await response.json()
      
      // Обновляем состояние списка с новой пагинацией
      setActiveList(prev => {
        if (!prev) return data
        return {
          ...prev,
          accounts: [...(prev.accounts || []), ...(data.accounts || [])],
          pagination: data.pagination
        }
      })
      
      return data.accounts as string[]
    } catch (error) {
      console.error("Error loading more accounts:", error)
      return undefined
    }
  }

  return (
    <AccountListsContext.Provider 
      value={{ 
        lists, 
        setLists,
        activeListId,
        activeList,
        addList, 
        setActiveList: setActiveListAndLoad,
        removeList,
        renameList,
        downloadList,
        loadMoreAccounts,
        isLoading,
        error,
        loadListNames
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
