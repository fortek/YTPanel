
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, Loader2, Play } from "lucide-react"
import { accountService } from "@/services/accountService"

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
    <Card className="w-full max-w-4xl mx-auto mt-8 border border-zinc-800/50">
      <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/50 pb-6">
        <div>
          <CardTitle className="text-2xl font-bold">
            Accounts List ({accountsState.length})
          </CardTitle>
          <div className="mt-2 text-sm text-zinc-400 flex gap-4">
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Valid: {validCount}
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              Invalid: {invalidCount}
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-zinc-500"></div>
              Pending: {pendingCount}
            </span>
          </div>
        </div>
        <Button
          onClick={checkAllAccounts}
          disabled={isCheckingAll || pendingCount === 0}
          className="ml-4 bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          {isCheckingAll ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Check All
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto p-6">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800/50">
              <TableHead className="w-[200px] text-zinc-400">Account ID</TableHead>
              <TableHead className="w-[300px] text-zinc-400">Email</TableHead>
              <TableHead className="w-[100px] text-zinc-400">Status</TableHead>
              <TableHead className="w-[120px] text-right text-zinc-400">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountsState.map((account) => (
              <TableRow key={account.id} className="border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                <TableCell className="font-mono text-sm truncate max-w-[200px] text-zinc-300">
                  {account.displayId}
                </TableCell>
                <TableCell className="font-mono text-sm truncate max-w-[300px] text-zinc-300">
                  {account.email || "-"}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    account.status === "valid" 
                      ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/30" 
                      : account.status === "invalid"
                      ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/30"
                      : account.status === "checking"
                      ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                      : "bg-zinc-500/20 text-zinc-400 ring-1 ring-zinc-500/30"
                  }`}>
                    {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={account.status === "valid" ? "outline" : "default"}
                    onClick={() => checkAccount(account.id)}
                    disabled={account.status === "checking" || isCheckingAll}
                    className={`w-[100px] transition-colors ${
                      account.status === "valid" 
                        ? "border-green-500/30 hover:bg-green-500/20" 
                        : "bg-zinc-800 hover:bg-zinc-700"
                    }`}
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
