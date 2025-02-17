
import { useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { FileUpload } from "@/components/AccountChecker/FileUpload"
import { AccountsList } from "@/components/AccountChecker/AccountsList"
import { Sidebar } from "@/components/AccountChecker/Sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useAccountLists } from "@/contexts/AccountListsContext"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export default function Home() {
  const { isAuthenticated, logout } = useAuth()
  const { lists, activeListId, isLoading } = useAccountLists()
  const router = useRouter()

  const activeList = lists.find(list => list.id === activeListId)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      <Head>
        <title>YouTube Account Checker</title>
        <meta name="description" content="Check YouTube accounts status" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-8 px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">
                  YouTube Account Checker
                </h1>
                {activeList && (
                  <p className="text-muted-foreground mt-2">
                    Current list: {activeList.name}
                  </p>
                )}
              </div>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
            
            <FileUpload />
            
            {activeList && activeList.accounts && activeList.accounts.length > 0 && (
              <AccountsList accounts={activeList.accounts} />
            )}
          </div>
        </main>
      </div>
    </>
  )
}
