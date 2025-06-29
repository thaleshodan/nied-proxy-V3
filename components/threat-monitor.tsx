"use client"

import { useState, useEffect, useRef } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface Threat {
  id: string
  type: "scan" | "tracking" | "mitm" | "fingerprinting"
  severity: "low" | "medium" | "high"
  source: string
  timestamp: Date
  message: string
  active: boolean
}

interface ThreatMonitorProps {
  className?: string
  onThreatDetected?: (threat: Threat) => void
}

export function ThreatMonitor({ className = "", onThreatDetected }: ThreatMonitorProps) {
  const [threats, setThreats] = useState<Threat[]>([])
  const [activeThreatCount, setActiveThreatCount] = useState(0)
  const { toast } = useToast()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate a random threat
  const generateRandomThreat = (): Threat => {
    const threatTypes = ["scan", "tracking", "mitm", "fingerprinting"]
    const severities = ["low", "medium", "high"]
    const sources = ["103.45.67.89", "185.212.47.56", "91.243.85.12", "45.89.174.23", "209.58.128.45"]

    const threatMessages = {
      scan: ["Port scan detected", "Service enumeration attempt", "Vulnerability scan detected"],
      tracking: ["Tracking cookie detected", "Browser canvas fingerprinting attempt", "WebRTC IP leak attempt"],
      mitm: ["SSL stripping attempt", "Potential ARP spoofing", "DNS poisoning attempt"],
      fingerprinting: ["Browser fingerprinting detected", "Device identification attempt", "User agent analysis"],
    }

    const type = threatTypes[Math.floor(Math.random() * threatTypes.length)] as Threat["type"]
    const severity = severities[Math.floor(Math.random() * severities.length)] as Threat["severity"]
    const source = sources[Math.floor(Math.random() * sources.length)]
    const message = threatMessages[type][Math.floor(Math.random() * threatMessages[type].length)]

    return {
      id: Math.random().toString(36).substring(2, 11),
      type,
      severity,
      source,
      timestamp: new Date(),
      message,
      active: true,
    }
  }

  // Simulate threat detection
  useEffect(() => {
    // Initial delay before first threat
    const initialDelay = Math.random() * 10000 + 5000

    const timeout = setTimeout(() => {
      // Start generating threats at random intervals
      intervalRef.current = setInterval(() => {
        // 30% chance of generating a threat
        if (Math.random() < 0.3) {
          const newThreat = generateRandomThreat()

          setThreats((prev) => {
            // Keep only the 5 most recent threats
            const updated = [newThreat, ...prev].slice(0, 5)
            return updated
          })

          setActiveThreatCount((prev) => prev + 1)

          // Notify parent component
          if (onThreatDetected) {
            onThreatDetected(newThreat)
          }

          // Show toast notification for high severity threats
          if (newThreat.severity === "high") {
            toast({
              title: "High Severity Threat Detected",
              description: newThreat.message,
              variant: "destructive",
            })
          }
        }
      }, 15000) // Check for new threats every 15 seconds
    }, initialDelay)

    return () => {
      clearTimeout(timeout)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [onThreatDetected, toast])

  const handleDismissThreat = (id: string) => {
    setThreats((prev) => prev.map((threat) => (threat.id === id ? { ...threat, active: false } : threat)))

    setActiveThreatCount((prev) => prev - 1)
  }

  const handleDismissAll = () => {
    setThreats((prev) => prev.map((threat) => ({ ...threat, active: false })))

    setActiveThreatCount(0)
  }

  const getSeverityColor = (severity: Threat["severity"]) => {
    switch (severity) {
      case "high":
        return "text-red-500 border-red-500"
      case "medium":
        return "text-yellow-500 border-yellow-500"
      case "low":
        return "text-green-500 border-green-500"
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <span className="text-white font-mono">THREAT MONITOR</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`font-mono ${
              activeThreatCount > 0 ? "border-yellow-500 text-yellow-500" : "border-green-500 text-green-500"
            }`}
          >
            {activeThreatCount > 0 ? `${activeThreatCount} ACTIVE` : "SECURE"}
          </Badge>
          {activeThreatCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissAll}
              className="h-6 text-xs text-gray-400 hover:text-white hover:bg-green-900/30"
            >
              DISMISS ALL
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
        {threats.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm font-mono">No threats detected</div>
        ) : (
          threats.map((threat) => (
            <div
              key={threat.id}
              className={`p-2 border rounded-md flex justify-between items-start ${
                threat.active
                  ? `border-${threat.severity === "high" ? "red" : threat.severity === "medium" ? "yellow" : "green"}-500/50 bg-black/50`
                  : "border-gray-800 bg-black/30 opacity-60"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`font-mono text-xs ${getSeverityColor(threat.severity)}`}>
                    {threat.severity.toUpperCase()}
                  </Badge>
                  <span className="text-white font-mono text-xs">{threat.type.toUpperCase()}</span>
                </div>
                <p className="text-gray-400 text-xs">{threat.message}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Source: {threat.source}</span>
                  <span>•</span>
                  <span>{threat.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
              {threat.active && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismissThreat(threat.id)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-green-900/30"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
