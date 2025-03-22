import type { AppProps } from "next/app"
import { AuthProvider } from "@/contexts/AuthContext"
import { AccountListsProvider } from "@/contexts/AccountListsContext"
import { ProxyProvider } from "@/contexts/ProxyContext"
import { Toaster } from "sonner"
import "@/styles/globals.css"
import { useTheme } from '@/lib/theme'

export default function App({ Component, pageProps }: AppProps) {
  useTheme()
  return (
    <AuthProvider>
      <AccountListsProvider>
        <ProxyProvider>
          <Component {...pageProps} />
          <Toaster />
        </ProxyProvider>
      </AccountListsProvider>
    </AuthProvider>
  )
}