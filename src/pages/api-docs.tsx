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
      title: "Send Message Chat",
      method: "POST",
      path: "/api/send-message-chat",
      description: "Send a message to YouTube live chat",
      requestBody: {
        cookie: "YOUR_COOKIE_STRING",
        word: "Message to send",
        token: "CHAT_TOKEN (optional)",
        videoId: "VIDEO_ID (optional, required if token is not provided)",
        proxy: "IP:PORT:LOGIN:PASSWORD (optional)"
      },
      responses: {
        200: {
          visitorData: "VISITOR_DATA_HERE",
          proxy: {
            used: false
          }
        },
        400: [
          {
            error: "Cookie and word are required"
          },
          {
            error: "Either token or videoId is required"
          },
          {
            error: "SAPISID cookie not found"
          }
        ],
        500: {
          error: "Failed to send message"
        }
      }
    },
    {
      title: "Send Message Comment",
      method: "POST",
      path: "/api/send-message-comment",
      description: "Send a comment to YouTube video",
      requestBody: {
        cookie: "YOUR_COOKIE_STRING",
        word: "Comment text",
        token: "COMMENT_TOKEN (optional)",
        videoId: "VIDEO_ID (optional, required if token is not provided)",
        proxy: "IP:PORT:LOGIN:PASSWORD (optional)"
      },
      responses: {
        200: {
          response: "Send (pageId) (createCommentParams) (sapisidhash)",
          proxy: {
            used: false
          }
        },
        400: [
          {
            error: "Cookie and word are required"
          },
          {
            error: "Either token or videoId is required"
          },
          {
            error: "SAPISID cookie not found"
          }
        ],
        500: {
          error: "Failed to send comment"
        }
      }
    },
    {
      title: "Send Vote Chat",
      method: "POST",
      path: "/api/send-vote-chat",
      description: "Send a vote in YouTube live chat poll",
      requestBody: {
        cookie: "YOUR_COOKIE_STRING",
        videoId: "VIDEO_ID",
        vote: 1, // Номер варианта ответа (начиная с 1)
        proxy: "IP:PORT:LOGIN:PASSWORD (optional)"
      },
      responses: {
        200: {
          response: " || Send",
          proxy: {
            used: false
          }
        },
        400: [
          {
            error: "Cookie, videoId and vote are required"
          },
          {
            error: "Vote must be a number"
          },
          {
            error: "SAPISID cookie not found"
          }
        ],
        500: {
          error: "Failed to send vote"
        }
      }
    },
    {
      title: "Send React Chat",
      method: "POST",
      path: "/api/send-react-chat",
      description: "Send a reaction in YouTube live chat",
      requestBody: {
        cookie: "YOUR_COOKIE_STRING",
        videoId: "VIDEO_ID",
        react: 1, // Номер реакции (от 1 до 5)
        proxy: "IP:PORT:LOGIN:PASSWORD (optional)"
      },
      responses: {
        200: {
          response: "RESPONSE_TEXT || Send",
          proxy: {
            used: false
          }
        },
        400: [
          {
            error: "Cookie, videoId and react are required"
          },
          {
            error: "React must be a number between 1 and 5"
          },
          {
            error: "SAPISID cookie not found"
          }
        ],
        404: {
          error: "No feedback tokens found"
        },
        500: {
          error: "Failed to send react"
        }
      }
    },
    {
      title: "Send Like",
      method: "POST",
      path: "/api/send-like",
      description: "Send a like to YouTube video",
      requestBody: {
        cookie: "YOUR_COOKIE_STRING",
        videoId: "VIDEO_ID",
        proxy: "IP:PORT:LOGIN:PASSWORD (optional)"
      },
      responses: {
        200: {
          response: "Like complete",
          proxy: {
            used: false
          }
        },
        400: [
          {
            error: "Cookie and video ID are required"
          },
          {
            error: "SAPISID cookie not found"
          }
        ],
        500: {
          error: "Failed to send like"
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
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 py-8">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between mb-8 bg-zinc-900/50 p-6 rounded-lg backdrop-blur-sm border border-zinc-800/50">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50 mb-1">API Documentation</h1>
            <p className="text-zinc-400">Complete reference for all available API endpoints</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800/50 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to App
            </Button>
          </Link>
        </div>

        <div className="space-y-8">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-lg p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                      endpoint.method === "GET" 
                        ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20"
                        : "bg-green-500/10 text-green-400 ring-1 ring-green-500/20"
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="px-2.5 py-1 bg-zinc-800/50 rounded-md text-zinc-300 font-mono text-sm">
                      {endpoint.path}
                    </code>
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-100 mb-2">{endpoint.title}</h2>
                  <p className="text-zinc-400">{endpoint.description}</p>
                </div>
                {endpoint.requestBody && (
                  <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-lg p-6 backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      Request Body
                    </h3>
                    <pre className="bg-zinc-800/50 p-3 rounded-md overflow-x-auto text-sm">
                      <code className="text-zinc-300">
                        {JSON.stringify(endpoint.requestBody, null, 2)}
                      </code>
                    </pre>
                  </div>
                )}
              </div>
              <div className="bg-zinc-900/30 border border-zinc-800/30 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  Responses
                </h3>
                <div className="space-y-4">
                  {Object.entries(endpoint.responses).map(([code, response]) => (
                    <div key={code} className="relative group">
                      <span className={`absolute -left-2 top-3 w-1.5 h-1.5 rounded-full ${
                        code.startsWith("2")
                          ? "bg-green-400"
                          : code.startsWith("4")
                          ? "bg-amber-400"
                          : "bg-red-400"
                      }`}></span>
                      <div className="pl-3">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-md mb-2 ${
                          code.startsWith("2")
                            ? "bg-green-500/10 text-green-400"
                            : code.startsWith("4")
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-red-500/10 text-red-400"
                        }`}>
                          {code}
                        </span>
                        <pre className="bg-zinc-800/50 p-3 rounded-md overflow-x-auto text-sm">
                          <code className="text-zinc-300">
                            {JSON.stringify(response, null, 2)}
                          </code>
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
