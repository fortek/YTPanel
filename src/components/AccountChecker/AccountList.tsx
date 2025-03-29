import { useEffect, useState, useRef, useCallback } from "react"
import { useAccountLists } from "@/contexts/AccountListsContext"

interface AccountListProps {
  id: string
}

export function AccountList({ id }: AccountListProps) {
  const [accounts, setAccounts] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const observer = useRef<IntersectionObserver>()
  const lastAccountRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;

    if (observer.current) {
      observer.current.disconnect()
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadPage(page + 1)
      }
    })

    if (node) {
      observer.current.observe(node)
    }
  }, [loading, hasMore, page])

  const loadPage = async (pageNum: number) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/lists/${id}?page=${pageNum}&pageSize=10000`)
      if (!response.ok) {
        throw new Error("Failed to load accounts")
      }

      const data = await response.json()
      
      if (pageNum === 1) {
        setAccounts(data.accounts)
        setTotal(data.total)
      } else {
        setAccounts(prev => [...prev, ...data.accounts])
      }
      
      setHasMore(data.pagination.hasMore)
      setPage(pageNum)
    } catch (err) {
      console.error("Error loading accounts:", err)
      setError(err instanceof Error ? err.message : "Failed to load accounts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setAccounts([])
    setPage(1)
    setHasMore(true)
    loadPage(1)
  }, [id])

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        Loaded {accounts.length} of {total} accounts
      </div>
      
      <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {accounts.map((account, index) => (
          <div 
            key={index} 
            ref={index === accounts.length - 1 ? lastAccountRef : undefined}
            className="p-2 bg-gray-800 rounded"
          >
            {account}
          </div>
        ))}

        {loading && (
          <div className="text-center py-4">
            Loading...
          </div>
        )}
      </div>
    </div>
  )
} 