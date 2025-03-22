interface CheckAccountResponse {
  isValid: boolean
  email: string
  proxy: {
    used: boolean
    address: string | null
    port: string | null
  }
}

export const accountService = {
  async checkAccount(cookies: string, proxy?: string): Promise<CheckAccountResponse> {
    try {
      const response = await fetch("/api/check-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cookies, proxy }),
      })

      if (!response.ok) {
        throw new Error("Failed to check account")
      }

      const data = await response.json()
      return {
        isValid: data.isValid,
        email: data.email,
        proxy: data.proxy
      }
    } catch (error) {
      console.error("Error checking account:", error)
      throw error
    }
  }
}
