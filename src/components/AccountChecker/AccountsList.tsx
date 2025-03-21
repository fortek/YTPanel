
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader2, Play, Square } from "lucide-react"
import { accountService } from "@/services/accountService"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FixedSizeList as List } from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"

interface Account {
  id: number
  cookies: string
  email: string
  status: "pending" | "checking" | "valid" | "invalid"
}

interface AccountsListProps {
  accounts: string[]
}

const ITEM_SIZE = 56

export function AccountsList({ accounts }: AccountsListProps) {
  const [accountsState, setAccountsState] = useState<Account[]>(
    accounts.map((line, index) => {
      const [cookies, email] = line.split("|")
      return {
        id: index,
        cookies: cookies.trim(),
        email: email ? email.trim() : "",
        status: "pending"
      }
    })
  )
  const [isCheckingAll, setIsCheckingAll] = useState(false)
  const [shouldStop, setShouldStop] = useState(false)
  const listRef = useRef<List>(null)

  const checkAccount = async (id: number) => {
    if (shouldStop) {
      return
    }

    setAccountsState(prev =>
      prev.map(acc =>
        acc.id === id ? { ...acc, status: "checking" } : acc
      )
    )

    try {
      const account = accountsState.find(acc => acc.id === id)
      if (!account) return

      const result = await accountService.checkAccount(account.cookies)
      
      if (shouldStop) {
        setAccountsState(prev =>
          prev.map(acc =>
            acc.id === id ? { ...acc, status: "pending" } : acc
          )
        )
        return
      }

      setAccountsState(prev =>
        prev.map(acc =>
          acc.id === id ? {
            ...acc,
            status: result.isValid ? "valid" : "invalid",
            email: acc.email || result.email || ""
          } : acc
        )
      )
    } catch (error) {
      if (!shouldStop) {
        setAccountsState(prev =>
          prev.map(acc =>
            acc.id === id ? { ...acc, status: "invalid" } : acc
          )
        )
      }
    }
  }

  const checkAllAccounts = async () => {
    if (isCheckingAll) {
      setShouldStop(true)
      setIsCheckingAll(false)
      setAccountsState(prev =>
        prev.map(acc =>
          acc.status === "checking" ? { ...acc, status: "pending" } : acc
        )
      )
      return
    }

    setIsCheckingAll(true)
    setShouldStop(false)
    const pendingAccounts = accountsState.filter(acc => acc.status === "pending" || acc.status === "invalid")
    
    for (const account of pendingAccounts) {
      if (shouldStop) {
        break
      }
      await checkAccount(account.id)
      listRef.current?.scrollToItem(account.id)
    }
    
    setIsCheckingAll(false)
    setShouldStop(false)
  }

  const pendingCount = accountsState.filter(acc => acc.status === "pending").length
  const validCount = accountsState.filter(acc => acc.status === "valid").length
  const invalidCount = accountsState.filter(acc => acc.status === "invalid").length

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const account = accountsState[index]
    return (
      <div style={style} className="flex items-center px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
        <div className="grid grid-cols-[2fr,2fr,1fr,1fr] gap-4 w-full items-center">
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
            Accounts List ({accountsState.length})
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
      <CardContent className="p-0">
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
            <div className="grid grid-cols-[2fr,2fr,1fr,1fr] gap-4">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Cookies</div>
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Email</div>
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-300">Status</div>
              <div className="text-sm font-medium text-right text-zinc-900 dark:text-zinc-300">Action</div>
            </div>
          </div>
          <div className="h-[600px]">
            <AutoSizer>
              {({ height, width }) => (
                <List
                  ref={listRef}
                  height={height}
                  itemCount={accountsState.length}
                  itemSize={ITEM_SIZE}
                  width={width}
                >
                  {Row}
                </List>
              )}
            </AutoSizer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
