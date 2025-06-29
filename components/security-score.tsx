"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Shield, Lock, Fingerprint, Wifi, Globe, Eye } from "lucide-react"

interface SecurityMetric {
  name: string
  score: number
  maxScore: number
  icon: React.ReactNode
  description: string
}

interface SecurityScoreProps {
  className?: string
  overallScore?: number
}

export function SecurityScore({ className = "", overallScore = 85 }: SecurityScoreProps) {
  const [metrics, setMetrics] = useState<SecurityMetric[]>([
    {
      name: "ENCRYPTION",
      score: 25,
      maxScore: 25,
      icon: <Lock className="h-4 w-4 text-green-500" />,
      description: "End-to-end encryption status",
    },
    {
      name: "ANONYMITY",
      score: 20,
      maxScore: 25,
      icon: <Eye className="h-4 w-4 text-green-500" />,
      description: "Identity protection level",
    },
    {
      name: "FINGERPRINT",
      score: 15,
      maxScore: 20,
      icon: <Fingerprint className="h-4 w-4 text-green-500" />,
      description: "Browser fingerprint randomization",
    },
    {
      name: "NETWORK",
      score: 15,
      maxScore: 20,
      icon: <Wifi className="h-4 w-4 text-green-500" />,
      description: "Network traffic protection",
    },
    {
      name: "GEOLOCATION",
      score: 10,
      maxScore: 10,
      icon: <Globe className="h-4 w-4 text-green-500" />,
      description: "Location masking effectiveness",
    },
  ])

  // Simulate real-time security monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => {
        return prev.map((metric) => {
          // Randomly fluctuate scores slightly to simulate real-time monitoring
          const fluctuation = Math.random() > 0.7 ? Math.floor(Math.random() * 3) - 1 : 0
          const newScore = Math.max(0, Math.min(metric.maxScore, metric.score + fluctuation))
          return { ...metric, score: newScore }
        })
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Calculate total score
  const totalMaxScore = metrics.reduce((sum, metric) => sum + metric.maxScore, 0)
  const totalScore = metrics.reduce((sum, metric) => sum + metric.score, 0)
  const scorePercentage = Math.round((totalScore / totalMaxScore) * 100)

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500" />
          <span className="text-white font-mono">SECURITY SCORE</span>
        </div>
        <span
          className={`text-xl font-bold font-mono ${
            scorePercentage > 80 ? "text-green-400" : scorePercentage > 60 ? "text-yellow-400" : "text-red-400"
          }`}
        >
          {scorePercentage}/100
        </span>
      </div>

      <Progress
        value={scorePercentage}
        className="h-2 bg-green-900/30"
        indicatorClassName={`${
          scorePercentage > 80 ? "bg-green-500" : scorePercentage > 60 ? "bg-yellow-500" : "bg-red-500"
        }`}
      />

      <div className="space-y-3 mt-4">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {metric.icon}
                <span className="text-white font-mono text-xs">{metric.name}</span>
              </div>
              <span className="text-xs font-mono text-gray-400">
                {metric.score}/{metric.maxScore}
              </span>
            </div>
            <Progress
              value={(metric.score / metric.maxScore) * 100}
              className="h-1 bg-green-900/30"
              indicatorClassName="bg-green-500"
            />
            <p className="text-xs text-gray-500">{metric.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
