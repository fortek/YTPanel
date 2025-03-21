
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Cpu, HardDrive, Network } from "lucide-react"

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
    <div className="grid grid-cols-3 gap-3 mb-6">
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-200">CPU</span>
            <Cpu className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-xl font-bold text-zinc-50">{metrics.cpu.toFixed(1)}%</div>
          <div className="mt-1 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${metrics.cpu}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-200">Memory</span>
            <HardDrive className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-xl font-bold text-zinc-50">
            {(metrics.memory.used / 1024).toFixed(1)}
            <span className="text-sm font-normal text-zinc-400 ml-1">
              / {(metrics.memory.total / 1024).toFixed(1)} GB
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${(metrics.memory.used / metrics.memory.total) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-200">Connections</span>
            <Network className="h-4 w-4 text-zinc-400" />
          </div>
          <div className="text-xl font-bold text-zinc-50">{metrics.connections}</div>
          <div className="text-xs text-zinc-400 mt-1">Active sessions</div>
        </CardContent>
      </Card>
    </div>
  )
}
