
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { AccountsList } from "@/components/AccountChecker/AccountsList"
import { Sidebar } from "@/components/AccountChecker/Sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useAccountLists } from "@/contexts/AccountListsContext"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface Account {
  id: string;
  login?: string;
  password?: string;
  cookies?: string;
  status: "pending" | "valid" | "invalid";
  serviceType: "youtube" | "vk";
}

interface List {
  id: string;
  name: string;
  serviceType: "youtube" | "vk";
  accounts: Account[];
}

export default function Home() {
  const { isAuthenticated, logout } = useAuth()
  const { lists, activeListId, setActiveListId, isLoading } = useAccountLists()
  const router = useRouter()
  const [isLoading2, setIsLoading2] = useState(true)

  const activeList = lists.find(list => list.id === activeListId) as List | undefined

  useEffect(() => {
    const checkAuth = async () => {
      const authStatus = localStorage.getItem("youtube_checker_auth")
      if (authStatus !== "true") {
        router.push("/auth/login")
      } else {
        setIsLoading2(false)
      }
    }
    checkAuth()
  }, [router])

  const handleListSelect = (listId: string) => {
    setActiveListId(listId)
  }

  const handleCheckAccount = async (accountId: string) => {
    // Implement account checking logic
    console.log("Checking account:", accountId)
  }

  const handleCheckAll = async () => {
    // Implement check all logic
    console.log("Checking all accounts")
  }

  if (isLoading2) {
    return null
  }

  return (
    <>
      <Head>
        <title>Account Checker</title>
        <meta name="description" content="Check account status for various services" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="flex h-screen">
        <Sidebar 
          lists={lists}
          activeListId={activeListId}
          onListSelect={handleListSelect}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-8 px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">
                  Account Checker
                </h1>
                {activeList && (
                  <p className="text-muted-foreground mt-2">
                    Current list: {activeList.name} ({activeList.serviceType})
                  </p>
                )}
              </div>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
            
            {activeList && activeList.accounts && activeList.accounts.length > 0 && (
              <AccountsList 
                accounts={activeList.accounts}
                onCheckAccount={handleCheckAccount}
                onCheckAll={handleCheckAll}
                title={`${activeList.serviceType.toUpperCase()} Accounts`}
                serviceType={activeList.serviceType}
              />
            )}
          </div>
        </main>
      </div>
    </>
  )
}
