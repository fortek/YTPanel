
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cpu, Memory, Network } from "lucide-react"

interface ServerMetrics {
  cpu: number
  memory: {
    used: number
    total: number
  }
  connections: number
}

export function ServerMetrics() {
  const [metrics, setMetrics] = useState<ServerMetrics>({
    cpu: 0,
    memory: {
      used: 0,
      total: 0
    },
    connections: 0
  })

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/metrics")
        if (response.ok) {
          const data = await response.json()
          setMetrics(data)
        }
      } catch (error) {
        console.error("Failed to fetch server metrics:", error)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">CPU Usage</CardTitle>
          <Cpu className="h-4 w-4 text-zinc-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-50">{metrics.cpu.toFixed(1)}%</div>
          <div className="mt-1 h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${metrics.cpu}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">Memory Usage</CardTitle>
          <Memory className="h-4 w-4 text-zinc-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-50">
            {(metrics.memory.used / 1024).toFixed(1)} GB
            <span className="text-sm font-normal text-zinc-400 ml-1">
              / {(metrics.memory.total / 1024).toFixed(1)} GB
            </span>
          </div>
          <div className="mt-1 h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${(metrics.memory.used / metrics.memory.total) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-zinc-200">Active Connections</CardTitle>
          <Network className="h-4 w-4 text-zinc-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-zinc-50">{metrics.connections}</div>
          <div className="text-sm text-zinc-400 mt-1">Current active sessions</div>
        </CardContent>
      </Card>
    </div>
  )
}
