
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ApiDocsPage() {
  const endpoints = [
    {
      title: "Check Account",
      method: "POST",
      path: "/api/check-account",
      description: "Check if a YouTube account cookie is valid",
      requestBody: {
        cookies: "cookie_string_here"
      },
      responses: {
        200: {
          isValid: true,
          email: "user@example.com",
          status: 200,
          url: "https://www.youtube.com/account"
        },
        400: {
          error: "Cookies are required"
        },
        401: {
          error: "Invalid cookies"
        },
        500: {
          error: "Failed to check account"
        }
      }
    },
    {
      title: "Update Cookie",
      method: "POST",
      path: "/api/lists/update-cookie",
      description: "Update a cookie value for a specific email in a file",
      requestBody: {
        fileName: "example.txt",
        newCookie: "new_cookie_value",
        email: "user@example.com"
      },
      responses: {
        200: {
          success: true,
          message: "Cookie updated successfully in both files"
        },
        400: {
          error: "fileName, newCookie and email are required"
        },
        404: {
          error: "File not found"
        },
        405: {
          error: "Method not allowed"
        },
        500: {
          error: "Failed to update cookie"
        }
      }
    },
    {
      title: "List Files",
      method: "GET",
      path: "/api/files",
      description: "Get a list of all uploaded cookie files",
      responses: {
        200: {
          files: [
            {
              name: "example.txt",
              size: 1024,
              createdAt: "2024-03-21T09:00:00.000Z",
              url: "/uploaded_cookies/example.txt"
            }
          ]
        }
      }
    },
    {
      title: "Download File",
      method: "GET",
      path: "/uploaded_cookies/:filename",
      description: "Download a specific cookie file",
      responses: {
        200: "File content (text/plain)",
        404: {
          message: "File not found"
        }
      }
    }
  ]

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-4">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-zinc-50 mb-2">API Documentation</h1>
            <p className="text-zinc-400 text-lg">
              Complete reference for all available API endpoints
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-zinc-800 hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {endpoints.map((endpoint, index) => (
            <Card key={index} className="border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
              <CardHeader className="border-b border-zinc-800/50 pb-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${
                    endpoint.method === "GET" 
                      ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30"
                      : "bg-green-500/10 text-green-400 ring-1 ring-green-500/30"
                  }`}>
                    {endpoint.method}
                  </span>
                  <CardTitle className="text-2xl text-zinc-50">{endpoint.title}</CardTitle>
                </div>
                <code className="px-3 py-2 bg-zinc-800 rounded-lg text-zinc-300 font-mono text-sm block">
                  {endpoint.path}
                </code>
                <CardDescription className="mt-4 text-zinc-400 text-base">
                  {endpoint.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {endpoint.requestBody && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">Request Body</h3>
                    <pre className="bg-zinc-800 p-4 rounded-lg overflow-x-auto">
                      <code className="text-zinc-300 text-sm">
                        {JSON.stringify(endpoint.requestBody, null, 2)}
                      </code>
                    </pre>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-zinc-300 mb-3">Responses</h3>
                  <div className="space-y-4">
                    {Object.entries(endpoint.responses).map(([code, response]) => (
                      <div key={code}>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${
                          code.startsWith("2")
                            ? "bg-green-500/10 text-green-400 ring-1 ring-green-500/30"
                            : code.startsWith("4")
                            ? "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"
                            : "bg-red-500/10 text-red-400 ring-1 ring-red-500/30"
                        }`}>
                          {code}
                        </span>
                        <pre className="bg-zinc-800 p-4 rounded-lg overflow-x-auto">
                          <code className="text-zinc-300 text-sm">
                            {JSON.stringify(response, null, 2)}
                          </code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
