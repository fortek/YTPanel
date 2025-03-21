
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { AccountsList } from "@/components/AccountChecker/AccountsList"
import { Sidebar } from "@/components/AccountChecker/Sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useAccountLists } from "@/contexts/AccountListsContext"
import { Button } from "@/components/ui/button"
import { LogOut, FileText, FolderOpen } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const { isAuthenticated, logout } = useAuth()
  const { activeList, isLoading } = useAccountLists()
  const router = useRouter()
  const [isLoading2, setIsLoading2] = useState(true)

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

  if (isLoading2) {
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
              <div className="flex items-center gap-2">
                <Link href="/uploaded_cookies">
                  <Button variant="outline">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Cookies Files
                  </Button>
                </Link>
                <Link href="/api-docs">
                  <Button variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    API Docs
                  </Button>
                </Link>
                <Button variant="outline" onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading list content...</p>
                </div>
              </div>
            ) : (
              activeList && activeList.accounts && activeList.accounts.length > 0 && (
                <AccountsList accounts={activeList.accounts} key={activeList.id} />
              )
            )}
          </div>
        </main>
      </div>
    </>
  )
}
