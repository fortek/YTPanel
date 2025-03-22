import type { AppProps } from "next/app"
import { AuthProvider } from "@/contexts/AuthContext"
import { AccountListsProvider } from "@/contexts/AccountListsContext"
import { ProxyListsProvider } from "@/contexts/ProxyListsContext"
import "@/styles/globals.css"
import { useTheme } from '@/lib/theme'

export default function App({ Component, pageProps }: AppProps) {
  useTheme()
  return (
    <AuthProvider>
      <AccountListsProvider>
        <ProxyListsProvider>
          <Component {...pageProps} />
        </ProxyListsProvider>
      </AccountListsProvider>
    </AuthProvider>
  )
}