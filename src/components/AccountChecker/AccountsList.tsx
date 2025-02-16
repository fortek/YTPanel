
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

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Accounts List ({accountsState.length})</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Account ID</TableHead>
              <TableHead className="w-[300px]">Email</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[120px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountsState.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-mono text-sm truncate max-w-[200px]">
                  {account.displayId}
                </TableCell>
                <TableCell className="font-mono text-sm truncate max-w-[300px]">
                  {account.email || "-"}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    account.status === "valid" 
                      ? "bg-green-100 text-green-700" 
                      : account.status === "invalid"
                      ? "bg-red-100 text-red-700"
                      : account.status === "checking"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={account.status === "valid" ? "outline" : "default"}
                    onClick={() => checkAccount(account.id)}
                    disabled={account.status === "checking"}
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
