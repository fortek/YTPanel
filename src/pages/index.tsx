
import { useState } from "react"
import Head from "next/head"
import { FileUpload } from "@/components/AccountChecker/FileUpload"
import { AccountsList } from "@/components/AccountChecker/AccountsList"

export default function Home() {
  const [accounts, setAccounts] = useState<string[]>([])

  return (
    <>
      <Head>
        <title>YouTube Account Checker</title>
        <meta name="description" content="Check YouTube accounts status" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          YouTube Account Checker
        </h1>
        
        <FileUpload onAccountsLoad={setAccounts} />
        
        {accounts.length > 0 && <AccountsList accounts={accounts} />}
      </main>
    </>
  )
}
