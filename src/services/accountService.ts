
interface CheckAccountResponse {
  isValid: boolean
  email: string
}

export const accountService = {
  async checkAccount(cookies: string): Promise<CheckAccountResponse> {
    try {
      const response = await fetch("/api/check-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cookies }),
      })

      if (!response.ok) {
        throw new Error("Failed to check account")
      }

      const data = await response.json()
      return {
        isValid: data.isValid,
        email: data.email
      }
    } catch (error) {
      console.error("Error checking account:", error)
      throw error
    }
  }
}
