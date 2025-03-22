import { createContext, useContext, useState, ReactNode } from 'react'

type ProxyContextType = {
  proxy: string
  setProxy: (proxy: string) => void
}

const ProxyContext = createContext<ProxyContextType | undefined>(undefined)

export function ProxyProvider({ children }: { children: ReactNode }) {
  const [proxy, setProxy] = useState("")

  return (
    <ProxyContext.Provider value={{ proxy, setProxy }}>
      {children}
    </ProxyContext.Provider>
  )
}

export function useProxy() {
  const context = useContext(ProxyContext)
  if (context === undefined) {
    throw new Error('useProxy must be used within a ProxyProvider')
  }
  return context
} 