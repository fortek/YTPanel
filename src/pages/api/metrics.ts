
import { NextApiRequest, NextApiResponse } from "next"
import os from "os"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Get CPU usage
    const cpus = os.cpus()
    const cpuCount = cpus.length
    const totalCpu = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b)
      const idle = cpu.times.idle
      return acc + ((total - idle) / total) * 100
    }, 0)
    const averageCpu = totalCpu / cpuCount

    // Get memory usage
    const totalMemory = os.totalmem() / (1024 * 1024) // Convert to MB
    const freeMemory = os.freemem() / (1024 * 1024) // Convert to MB
    const usedMemory = totalMemory - freeMemory

    // Get active connections (this is a placeholder - implement actual connection tracking)
    const activeConnections = Math.floor(Math.random() * 100) // Replace with actual connection count

    res.status(200).json({
      cpu: averageCpu,
      memory: {
        used: usedMemory,
        total: totalMemory
      },
      connections: activeConnections
    })
  } catch (error) {
    console.error("Error fetching metrics:", error)
    res.status(500).json({ error: "Failed to fetch server metrics" })
  }
}
