
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, Loader2 } from "lucide-react"

interface Account {
  id: number
  username: string
  status: "pending" | "checking" | "valid" | "invalid"
}

interface AccountsListProps {
  accounts: string[]
}

export function AccountsList({ accounts }: AccountsListProps) {
  const [accountsState, setAccountsState] = useState<Account[]>(
    accounts.map((acc, index) => ({
      id: index,
      username: acc,
      status: "pending"
    }))
  )

  const checkAccount = async (id: number) => {
    setAccountsState(prev =>
      prev.map(acc =>
        acc.id === id ? { ...acc, status: "checking" } : acc
      )
    )

    // Simulate checking (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 2000))

    setAccountsState(prev =>
      prev.map(acc =>
        acc.id === id ? { ...acc, status: Math.random() > 0.5 ? "valid" : "invalid" } : acc
      )
    )
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
        <CardTitle>Accounts List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountsState.map((account) => (
              <TableRow key={account.id}>
                <TableCell>{account.username}</TableCell>
                <TableCell className={getStatusColor(account.status)}>
                  {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
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
