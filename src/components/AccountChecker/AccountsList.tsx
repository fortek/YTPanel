
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, Loader2, Play } from "lucide-react"
import { accountService } from "@/services/accountService"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Account {
  id: number
  cookies: string
  displayId: string
  email: string
  status: "pending" | "checking" | "valid" | "invalid"
}

interface AccountsListProps {
  accounts: string[]
}

export function AccountsList({ accounts }: AccountsListProps) {
  const [accountsState, setAccountsState] = useState<Account[]>(
    accounts.map((cookies, index) => {
      const sidCookie = cookies.split(";").find(c => c.includes("SID="))
      const displayId = sidCookie 
        ? sidCookie.split("=")[1].substring(0, 15) + "..."
        : `Account ${index + 1}`

      return {
        id: index,
        cookies,
        displayId,
        email: "",
        status: "pending"
      }
    })
  )
  const [isCheckingAll, setIsCheckingAll] = useState(false)

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
            status: result.isValid && result.email ? "valid" : "invalid",
            email: result.email
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
    }
    
    setIsCheckingAll(false)
  }

  const pendingCount = accountsState.filter(acc => acc.status === "pending").length
  const validCount = accountsState.filter(acc => acc.status === "valid").length
  const invalidCount = accountsState.filter(acc => acc.status === "invalid").length

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
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-200 dark:border-zinc-800">
              <TableHead className="w-[200px] text-zinc-900 dark:text-zinc-300 font-semibold">Cookies</TableHead>
              <TableHead className="w-[300px] text-zinc-900 dark:text-zinc-300 font-semibold">Email</TableHead>
              <TableHead className="w-[100px] text-zinc-900 dark:text-zinc-300 font-semibold">Status</TableHead>
              <TableHead className="w-[120px] text-right text-zinc-900 dark:text-zinc-300 font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountsState.map((account) => (
              <TableRow key={account.id} className="border-zinc-200 dark:border-zinc-800">
                <TableCell className="font-mono text-sm text-zinc-900 dark:text-zinc-300">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="text-left cursor-help">
                        {account.displayId}
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[500px] break-all">
                        <p className="font-mono text-xs">{account.cookies}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="font-mono text-sm text-zinc-900 dark:text-zinc-300">
                  {account.email || "-"}
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
