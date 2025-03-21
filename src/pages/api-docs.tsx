
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ApiDocsPage() {
  const endpoints = [
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
          message: "Cookie updated successfully"
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
    <div className="container py-8 max-w-[1200px]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">API Documentation</h1>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to App
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        {endpoints.map((endpoint, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 text-sm font-medium rounded ${
                  endpoint.method === "GET" 
                    ? "bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/30"
                    : "bg-green-500/10 text-green-500 ring-1 ring-green-500/30"
                }`}>
                  {endpoint.method}
                </span>
                <CardTitle className="text-xl">{endpoint.title}</CardTitle>
              </div>
              <CardDescription className="text-base mt-2">
                <code className="px-2 py-1 bg-zinc-800 rounded">{endpoint.path}</code>
              </CardDescription>
              <CardDescription className="mt-2">
                {endpoint.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {endpoint.requestBody && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Request Body:</h3>
                  <pre className="bg-zinc-800 p-4 rounded-md overflow-x-auto">
                    <code>{JSON.stringify(endpoint.requestBody, null, 2)}</code>
                  </pre>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium mb-2">Responses:</h3>
                <div className="space-y-4">
                  {Object.entries(endpoint.responses).map(([code, response]) => (
                    <div key={code}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-sm font-medium rounded ${
                          code.startsWith("2")
                            ? "bg-green-500/10 text-green-500 ring-1 ring-green-500/30"
                            : "bg-red-500/10 text-red-500 ring-1 ring-red-500/30"
                        }`}>
                          {code}
                        </span>
                      </div>
                      <pre className="bg-zinc-800 p-4 rounded-md overflow-x-auto">
                        <code>{JSON.stringify(response, null, 2)}</code>
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
  )
}
