import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader2, Play, Square } from "lucide-react"
import { accountService } from "@/services/accountService"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FixedSizeList as List } from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"
import { useProxy } from "@/contexts/ProxyContext"
import { useAccountLists } from "@/contexts/AccountListsContext"

interface Account {
  id: number
  cookies: string
  email: string
  status: "pending" | "checking" | "valid" | "invalid"
  proxy?: {
    used: boolean
    address: string | null
    port: string | null
  }
}

interface AccountsListProps {
  accounts: string[]
}

const ITEM_SIZE = 56

export function AccountsList({ accounts }: AccountsListProps) {
  const { proxy } = useProxy()
  const { loadMoreAccounts, activeListId, activeList, isLoading } = useAccountLists()
  const [accountsState, setAccountsState] = useState<Account[]>(
    accounts.map((line, index) => {
      const [cookies, email] = line.split("|")
      return {
        id: index,
        cookies: cookies.trim(),
        email: email ? email.trim() : "",
        status: "pending" as const
      }
    })
  )
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isCheckingAll, setIsCheckingAll] = useState(false)
  const stopCheckingRef = useRef(false)
  const listRef = useRef<List>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (!activeList?.accounts) return
    
    if (!accountsState.length) {
      setAccountsState(activeList.accounts.map((line, index) => {
        const [cookies, email] = line.split("|")
        return {
          id: index,
          cookies: cookies.trim(),
          email: email ? email.trim() : "",
          status: "pending" as const
        }
      }))
      return
    }

    // Добавляем только новые аккаунты, сохраняя состояние существующих
    const currentIds = new Set(accountsState.map(acc => acc.cookies))
    const newAccounts = activeList.accounts
      .filter(line => {
        const [cookies] = line.split("|")
        return !currentIds.has(cookies.trim())
      })
      .map((line, index) => {
        const [cookies, email] = line.split("|")
        return {
          id: accountsState.length + index,
          cookies: cookies.trim(),
          email: email ? email.trim() : "",
          status: "pending" as const
        }
      })

    if (newAccounts.length) {
      setAccountsState(prev => [...prev, ...newAccounts])
    }
  }, [activeList?.accounts])

  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: { scrollOffset: number, scrollUpdateWasRequested: boolean }) => {
    if (scrollUpdateWasRequested || isLoadingMore) return
    
    const { height, itemCount, itemSize } = listRef.current?.props || {}
    if (!height || !itemCount || !itemSize) return
    
    const threshold = 100
    const isNearBottom = scrollOffset + Number(height) >= Number(itemCount) * Number(itemSize) - threshold
    
    if (isNearBottom && !loadingRef.current && activeListId && activeList?.pagination?.hasMore) {
      loadingRef.current = true
      setIsLoadingMore(true)
      
      loadMoreAccounts(activeListId)
        .then((newAccounts) => {
          if (!newAccounts?.length) return
          
          setAccountsState(prev => {
            const startIndex = prev.length
            return [
              ...prev,
              ...newAccounts.map((line: string, index: number) => {
                const [cookies, email] = line.split("|")
                return {
                  id: startIndex + index,
                  cookies: cookies.trim(),
                  email: email ? email.trim() : "",
                  status: "pending" as const
                }
              })
            ]
          })
        })
        .finally(() => {
          loadingRef.current = false
          setIsLoadingMore(false)
        })
    }
  }, [activeListId, loadMoreAccounts, isLoadingMore, activeList?.pagination?.hasMore])

  const checkAccount = async (id: number) => {
    if (stopCheckingRef.current) return false

    setAccountsState(prev =>
      prev.map(acc =>
        acc.id === id ? { ...acc, status: "checking" } : acc
      )
    )

    try {
      const account = accountsState.find(acc => acc.id === id)
      if (!account) return false

      const result = await accountService.checkAccount(account.cookies, proxy)
      
      if (stopCheckingRef.current) {
        setAccountsState(prev =>
          prev.map(acc =>
            acc.id === id ? { ...acc, status: "pending" } : acc
          )
        )
        return false
      }

      setAccountsState(prev =>
        prev.map(acc =>
          acc.id === id ? {
            ...acc,
            status: result.isValid ? "valid" : "invalid",
            email: acc.email || result.email || "",
            proxy: result.proxy
          } : acc
        )
      )
      return true
    } catch (error) {
      if (!stopCheckingRef.current) {
        setAccountsState(prev =>
          prev.map(acc =>
            acc.id === id ? { ...acc, status: "invalid" } : acc
          )
        )
      }
      return false
    }
  }

  const checkAllAccounts = async () => {
    if (isCheckingAll) {
      stopCheckingRef.current = true
      setIsCheckingAll(false)
      setAccountsState(prev =>
        prev.map(acc =>
          acc.status === "checking" ? { ...acc, status: "pending" } : acc
        )
      )
      return
    }

    setIsCheckingAll(true)
    stopCheckingRef.current = false
    const pendingAccounts = accountsState.filter(acc => acc.status === "pending" || acc.status === "invalid")
    
    for (const account of pendingAccounts) {
      if (stopCheckingRef.current) break
      
      const success = await checkAccount(account.id)
      if (success && !stopCheckingRef.current) {
        listRef.current?.scrollToItem(account.id)
      }
    }
    
    setIsCheckingAll(false)
    stopCheckingRef.current = false
  }

  const pendingCount = accountsState.filter(acc => acc.status === "pending").length
  const validCount = accountsState.filter(acc => acc.status === "valid").length
  const invalidCount = accountsState.filter(acc => acc.status === "invalid").length

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const account = accountsState[index]
    return (
      <div style={style} className="flex items-center px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
        <div className="grid grid-cols-[2fr,2fr,1fr,1fr,1fr] gap-4 w-full items-center">
          <div className="overflow-hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-left cursor-help truncate font-mono text-sm text-zinc-900 dark:text-zinc-300">
                    {account.cookies}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[500px]">
                  <p className="font-mono text-xs break-all whitespace-pre-wrap">
                    {account.cookies}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="overflow-hidden">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="truncate font-mono text-sm text-zinc-900 dark:text-zinc-300">
                    {account.email || "-"}
                  </div>
                </TooltipTrigger>
                {account.email && (
                  <TooltipContent side="bottom">
                    <p className="font-mono text-xs">{account.email}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
          <div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              account.status === "valid" 
                ? "bg-green-500/10 text-green-700 dark:text-green-400 ring-1 ring-green-500/30" 
                : account.status === "invalid"
                ? "bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-red-500/30"
                : account.status === "checking"
                ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500/30"
                : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 ring-1 ring-zinc-500/30"
            }`}>
              {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
            </span>
          </div>
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {account.proxy?.used ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      {account.proxy.address}:{account.proxy.port}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Прокси использован для проверки</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              "Without proxy"
            )}
          </div>
          <div className="text-right">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => checkAccount(account.id)}
              disabled={account.status === "checking" || isCheckingAll}
              className="w-[100px]"
            >
              {account.status === "checking" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Check
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-[1200px] mx-auto mt-8">
      <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Accounts List ({activeList?.total || 0})
          </CardTitle>
          <div className="mt-2 text-sm flex gap-4">
            <span className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-300 font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Valid: {validCount}
            </span>
            <span className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-300 font-medium">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              Invalid: {invalidCount}
            </span>
            <span className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-300 font-medium">
              <div className="w-2 h-2 rounded-full bg-zinc-500"></div>
              Pending: {pendingCount}
            </span>
          </div>
        </div>
        <Button
          onClick={checkAllAccounts}
          disabled={(!isCheckingAll && pendingCount === 0)}
          className="ml-4"
          variant={isCheckingAll ? "destructive" : "default"}
        >
          {isCheckingAll ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop All
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Check All
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
            <div className="grid grid-cols-[2fr,2fr,1fr,1fr,1fr] gap-4">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Cookies</div>
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Email</div>
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Status</div>
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Proxy</div>
              <div className="text-sm font-medium text-right text-zinc-900 dark:text-zinc-300">Action</div>
            </div>
          </div>
          <div className="h-[600px]">
            <AutoSizer>
              {({ height, width }) => (
                <div className="ReactWindow__ScrollContainer">
                  <List
                    ref={listRef}
                    height={height}
                    itemCount={accountsState.length}
                    itemSize={ITEM_SIZE}
                    width={width}
                    onScroll={handleScroll}
                  >
                    {({ index, style }) => <Row index={index} style={style} />}
                  </List>
                  {isLoadingMore && (
                    <div className="absolute bottom-2 right-4 flex items-center justify-center">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 bg-white dark:bg-zinc-900 px-2 py-1 rounded-md shadow-sm">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </AutoSizer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
