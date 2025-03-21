import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { AccountsList } from "@/components/AccountChecker/AccountsList"
import { Sidebar } from "@/components/AccountChecker/Sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useAccountLists } from "@/contexts/AccountListsContext"
import { Button } from "@/components/ui/button"
import { LogOut, FileText } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { isAuthenticated, logout } = useAuth()
  const { lists, activeListId, isLoading } = useAccountLists()
  const router = useRouter()
  const [isLoading2, setIsLoading2] = useState(true)

  const activeList = lists.find(list => list.id === activeListId)

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
              <div className='flex items-center gap-2'>
                <Link href='/api-docs'>
                  <Button variant='outline'>
                    <FileText className='w-4 h-4 mr-2' />
                    API Docs
                  </Button>
                </Link>
                <Button variant='outline' onClick={logout}>
                  <LogOut className='w-4 h-4 mr-2' />
                  Logout
                </Button>
              </div>
            </div>
            
            {activeList && activeList.accounts && activeList.accounts.length > 0 && (
              <AccountsList accounts={activeList.accounts} key={activeList.id} />
            )}
          </div>
        </main>
      </div>
    </>
  )
}