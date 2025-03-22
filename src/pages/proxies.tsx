import { useEffect } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/contexts/AuthContext"
import { ProxyLists } from "@/components/ProxyLists/ProxyLists"

export default function ProxiesPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Управление списками прокси</h1>
      <ProxyLists />
    </div>
  )
} 