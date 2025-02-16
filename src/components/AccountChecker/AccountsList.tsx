
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, Loader2 } from "lucide-react"
import { accountService } from "@/services/accountService"

interface Account {
  id: number
  cookies: string
  displayId: string
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
        status: "pending"
      }
    })
  )

  const checkAccount = async (id: number) => {
    setAccountsState(prev =>
      prev.map(acc =>
        acc.id === id ? { ...acc, status: "checking" } : acc
      )
    )

    try {
      const account = accountsState.find(acc => acc.id === id)
      if (!account) return

      const isValid = await accountService.checkAccount(account.cookies)

      setAccountsState(prev =>
        prev.map(acc =>
          acc.id === id ? { ...acc, status: isValid ? "valid" : "invalid" } : acc
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

  const getStatusColor = (status: Account["status"]) => {
    switch (status) {
      case "valid":
        return "text-green-500"
      case "invalid":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Accounts List ({accountsState.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountsState.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-mono text-sm">{account.displayId}</TableCell>
                <TableCell className={getStatusColor(account.status)}>
                  {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={account.status === "valid" ? "outline" : "default"}
                    onClick={() => checkAccount(account.id)}
                    disabled={account.status === "checking"}
                  >
                    {account.status === "checking" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span className="ml-2">Check</span>
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
