import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ApiDocsPage() {
  const endpoints = [
    {
      title: "Get Comment ID",
      method: "POST",
      path: "/api/get-comment-id",
      description: "Get YouTube video comment token ID",
      requestBody: {
        videoId: "VIDEO_ID_HERE",
        proxy: "IP:PORT:LOGIN:PASSWORD (optional)"
      },
      responses: {
        200: {
          commentToken: "COMMENT_TOKEN_HERE",
          proxy: {
            used: true,
            address: "192.168.1.1",
            port: "8080"
          }
        },
        400: [
          {
            error: "Video ID is required"
          },
          {
            error: "Invalid proxy format. Expected: IP:PORT:LOGIN:PASSWORD"
          },
          {
            error: "Proxy is not working or not responding"
          }
        ],
        404: {
          error: "Comment token not found"
        },
        500: {
          error: "Failed to fetch comment token"
        }
      }
    },
    {
      title: "Get Chat ID",
      method: "POST",
      path: "/api/get-chat-id",
      description: "Get YouTube live chat ID from video ID",
      requestBody: {
        videoId: "VIDEO_ID_HERE",
        proxy: "IP:PORT:LOGIN:PASSWORD (optional)"
      },
      responses: {
        200: {
          chatId: "0ofMyAOAARpeQ2lrcUp3b1lWVU5VYW1veU9FczBSM2ROZFZGTVYwUjRaV2cyTm1wbkVndFBRMTlOU0dOS2RYUmhkeG9UNnFqZHVRRU5DZ3RQUTE5TlNHTktkWFJoZHlBQk1BQSUzRDABggEICAQYAiAAKACIAQGgAYGY9YeRnowDqAEAsgEA",
          proxy: {
            used: false
          }
        },
        400: [
          {
            error: "Video ID is required"
          },
          {
            error: "Invalid proxy format. Expected: IP:PORT:LOGIN:PASSWORD"
          },
          {
            error: "Proxy is not working or not responding"
          }
        ],
        404: {
          error: "Chat ID not found"
        },
        500: {
          error: "Failed to fetch chat ID"
        }
      }
    },
    {
      title: "Check Account",
      method: "POST",
      path: "/api/check-account",
      description: "Check if a YouTube account cookie is valid",
      requestBody: {
        cookies: "cookie_string_here",
        proxy: "IP:PORT:LOGIN:PASSWORD (optional)"
      },
      responses: {
        200: {
          isValid: true,
          email: "user@example.com",
          status: 200,
          url: "https://www.youtube.com/account",
          proxy: {
            used: true,
            address: "192.168.1.1",
            port: "8080"
          }
        },
        400: [
          {
            error: "Cookies are required"
          },
          {
            error: "Proxy is not working or not responding"
          }
        ],
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
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">API Documentation</h1>
            <p className="text-sm text-zinc-400">Complete reference for all available API endpoints</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="border-zinc-800 hover:bg-zinc-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {endpoints.map((endpoint, index) => (
            <Card key={index} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-8">
                  {/* Левая колонка: Описание эндпоинта */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        endpoint.method === "GET" 
                          ? "bg-blue-500/10 text-blue-400"
                          : "bg-green-500/10 text-green-400"
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm text-zinc-300">{endpoint.path}</code>
                    </div>
                    <h2 className="text-lg font-semibold text-zinc-100 mb-2">{endpoint.title}</h2>
                    <p className="text-sm text-zinc-400 mb-4">{endpoint.description}</p>
                    
                    {endpoint.requestBody && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-zinc-300 mb-2">Request Body</h3>
                        <pre className="bg-zinc-950 p-3 rounded text-sm overflow-x-auto">
                          <code className="text-zinc-300">
                            {JSON.stringify(endpoint.requestBody, null, 2)}
                          </code>
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Правая колонка: Ответы */}
                  <div>
                    <h3 className="text-sm font-medium text-zinc-300 mb-3">Responses</h3>
                    <div className="space-y-3">
                      {Object.entries(endpoint.responses).map(([code, response]) => (
                        <div key={code} className="bg-zinc-950 rounded p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              code.startsWith("2") 
                                ? "bg-green-500/10 text-green-400"
                                : code.startsWith("4")
                                ? "bg-amber-500/10 text-amber-400"
                                : "bg-red-500/10 text-red-400"
                            }`}>
                              {code}
                            </span>
                          </div>
                          <pre className="text-sm overflow-x-auto">
                            <code className="text-zinc-300">
                              {JSON.stringify(response, null, 2)}
                            </code>
                          </pre>
                        </div>
                      ))}
                    </div>
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
