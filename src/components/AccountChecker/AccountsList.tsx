
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, Loader2, Play } from "lucide-react"
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

const ITEM_SIZE = 50 // Height of each row in pixels

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
  const listRef = useRef<List>(null)

  const checkAccount = async (id: number) => {
    setAccountsState(prev =>
      prev.map(acc =>
        acc.id === id ? { ...acc, status: "checking" } : acc
      )
    )

    try {
      const account = accountsState.find(acc => acc.id === id)
      if (!account) return

      const result = await accountService.checkAccount(account.cookies)
      
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
      setAccountsState(prev =>
        prev.map(acc =>
          acc.id === id ? { ...acc, status: "invalid" } : acc
        )
      )
    }
  }

  const checkAllAccounts = async () => {
    setIsCheckingAll(true)
    const pendingAccounts = accountsState.filter(acc => acc.status === "pending" || acc.status === "invalid")
    
    for (const account of pendingAccounts) {
      await checkAccount(account.id)
      listRef.current?.scrollToItem(account.id)
    }
    
    setIsCheckingAll(false)
  }

  const pendingCount = accountsState.filter(acc => acc.status === "pending").length
  const validCount = accountsState.filter(acc => acc.status === "valid").length
  const invalidCount = accountsState.filter(acc => acc.status === "invalid").length

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const account = accountsState[index]
    return (
      <div style={style} className="flex items-center border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex-1 min-w-0 px-4 py-2 flex items-center gap-4">
          <div className="w-[200px] min-w-[200px]">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="text-left cursor-help max-w-[180px] truncate block text-sm font-mono text-zinc-900 dark:text-zinc-300">
                  {account.cookies}
                </TooltipTrigger>
                <TooltipContent className="max-w-[500px] break-all">
                  <p className="font-mono text-xs">{account.cookies}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="w-[300px] min-w-[300px] font-mono text-sm text-zinc-900 dark:text-zinc-300">
            {account.email || "-"}
          </div>
          <div className="w-[100px] min-w-[100px]">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
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
          <div className="w-[120px] min-w-[120px] text-right">
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
    <Card className="w-full max-w-4xl mx-auto mt-8">
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
          disabled={isCheckingAll || pendingCount === 0}
          className="ml-4"
        >
          {isCheckingAll ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Check All
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col">
          <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 py-2 px-4">
            <div className="w-[200px] min-w-[200px] text-zinc-900 dark:text-zinc-300 font-semibold">Cookies</div>
            <div className="w-[300px] min-w-[300px] text-zinc-900 dark:text-zinc-300 font-semibold">Email</div>
            <div className="w-[100px] min-w-[100px] text-zinc-900 dark:text-zinc-300 font-semibold">Status</div>
            <div className="w-[120px] min-w-[120px] text-right text-zinc-900 dark:text-zinc-300 font-semibold">Action</div>
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
