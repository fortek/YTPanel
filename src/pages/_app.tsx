
import type { AppProps } from "next/app"
import { AuthProvider } from "@/contexts/AuthContext"
import { AccountListsProvider } from "@/contexts/AccountListsContext"
import "@/styles/globals.css"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AccountListsProvider>
        <Component {...pageProps} />
      </AccountListsProvider>
    </AuthProvider>
  )
}
