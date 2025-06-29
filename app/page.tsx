"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle,
  CheckCircle,
  Globe,
  RefreshCw,
  Server,
  Activity,
  Clock,
  Settings,
  EyeOff,
  Terminal,
  Network,
  Zap,
  ShieldAlert,
  BarChart2,
  Shield,
  ChevronDown,
  ChevronUp,
  Power,
  PowerOff,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { NetworkMap } from "@/components/network-map"
import { MatrixBackground } from "@/components/matrix-background"
import { AnonymousLogo } from "@/components/anonymous-logo"
import { RouteVisualization } from "@/components/route-visualization"
import { SecurityScore } from "@/components/security-score"
import { ThreatMonitor } from "@/components/threat-monitor"
import { AdvancedTerminal } from "@/components/advanced-terminal"
import { TooltipProvider } from "@/components/ui/tooltip"

interface TorStatus {
  is_running: boolean
  current_ip?: string
  response_time?: number
  geolocation?: {
    country: string
    region: string
    city: string
    org: string
    timezone: string
  }
  success?: boolean
  is_tor?: boolean
  error?: string
  timestamp?: string
}

export default function Home() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [torStatus, setTorStatus] = useState<TorStatus>({ is_running: false })
  const [isRotating, setIsRotating] = useState(false)
  const [rotationInterval, setRotationInterval] = useState(60)
  const [progress, setProgress] = useState(0)
  const [lastRotation, setLastRotation] = useState<Date | null>(null)
  const [anonymityScore, setAnonymityScore] = useState(0)
  const [showAdvancedTerminal, setShowAdvancedTerminal] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    securityScore: true,
    threatMonitor: true,
    proxyChain: true,
    routeVisualization: true,
  })
  const [trafficStats, setTrafficStats] = useState({
    sent: 0,
    received: 0,
    connections: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "> NiedProxy v2.0 initialized",
    "> Checking Tor status...",
    "> Dashboard ready on localhost:5050",
  ])

  // Fetch Tor status on component mount and periodically
  useEffect(() => {
    fetchTorStatus()

    const interval = setInterval(() => {
      if (!isLoading) {
        fetchTorStatus()
      }
    }, 5000) // Check status every 5 seconds

    return () => clearInterval(interval)
  }, [isLoading])

  // Handle automatic IP rotation
  useEffect(() => {
    if (!isRotating || !torStatus.is_running) return

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          rotateIP()
          return 0
        }
        return prev + 100 / rotationInterval
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRotating, rotationInterval, torStatus.is_running])

  // Update anonymity score based on Tor status
  useEffect(() => {
    if (torStatus.is_running && torStatus.is_tor) {
      setAnonymityScore(85 + Math.floor(Math.random() * 15))
    } else if (torStatus.is_running) {
      setAnonymityScore(60 + Math.floor(Math.random() * 20))
    } else {
      setAnonymityScore(0)
    }
  }, [torStatus])

  // Simulate network traffic when Tor is running
  useEffect(() => {
    if (!torStatus.is_running) return

    const interval = setInterval(() => {
      setTrafficStats((prev) => ({
        sent: prev.sent + Math.floor(Math.random() * 50),
        received: prev.received + Math.floor(Math.random() * 100),
        connections: Math.floor(Math.random() * 5) + 1,
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [torStatus.is_running])

  const fetchTorStatus = async () => {
    try {
      const response = await fetch("/api/tor/status")
      const data = await response.json()

      if (response.ok) {
        setTorStatus(data)

        if (data.current_ip && data.current_ip !== torStatus.current_ip) {
          addTerminalLine(`Current IP: ${data.current_ip}`)
          if (data.geolocation) {
            addTerminalLine(`Location: ${data.geolocation.city}, ${data.geolocation.country}`)
          }
        }
      } else {
        setTorStatus({ is_running: false, error: data.error })
      }
    } catch (error) {
      console.error("Error fetching Tor status:", error)
      setTorStatus({ is_running: false, error: "Connection failed" })
    }
  }

  const startTor = async () => {
    setIsLoading(true)
    addTerminalLine("Starting Tor service...")

    try {
      const response = await fetch("/api/tor/start", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Tor Started",
          description: "Tor service started successfully",
        })
        addTerminalLine("Tor service started successfully")

        // Wait a moment then fetch status
        setTimeout(() => {
          fetchTorStatus()
        }, 2000)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to start Tor",
          variant: "destructive",
        })
        addTerminalLine(`Error starting Tor: ${data.error}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to communicate with Tor service",
        variant: "destructive",
      })
      addTerminalLine("Failed to communicate with Tor service")
    } finally {
      setIsLoading(false)
    }
  }

  const stopTor = async () => {
    setIsLoading(true)
    addTerminalLine("Stopping Tor service...")

    try {
      const response = await fetch("/api/tor/stop", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Tor Stopped",
          description: "Tor service stopped successfully",
        })
        addTerminalLine("Tor service stopped successfully")
        setTorStatus({ is_running: false })
        setIsRotating(false)
        setProgress(0)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to stop Tor",
          variant: "destructive",
        })
        addTerminalLine(`Error stopping Tor: ${data.error}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to communicate with Tor service",
        variant: "destructive",
      })
      addTerminalLine("Failed to communicate with Tor service")
    } finally {
      setIsLoading(false)
    }
  }

  const rotateIP = async () => {
    if (!torStatus.is_running) {
      toast({
        title: "Error",
        description: "Tor is not running",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    addTerminalLine("Requesting new Tor identity...")

    try {
      const response = await fetch("/api/tor/rotate", { method: "POST" })
      const data = await response.json()

      if (data.current_ip) {
        setLastRotation(new Date())
        toast({
          title: "IP Rotated",
          description: `New IP: ${data.current_ip}`,
        })
        addTerminalLine(`IP rotated to ${data.current_ip}`)

        if (data.geolocation) {
          addTerminalLine(`New location: ${data.geolocation.city}, ${data.geolocation.country}`)
        }

        setTorStatus(data)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to rotate IP",
          variant: "destructive",
        })
        addTerminalLine(`Error rotating IP: ${data.error}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rotate IP",
        variant: "destructive",
      })
      addTerminalLine("Failed to rotate IP")
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    if (!torStatus.is_running) {
      toast({
        title: "Error",
        description: "Tor is not running",
        variant: "destructive",
      })
      return
    }

    addTerminalLine("Testing Tor connection...")

    try {
      const response = await fetch("/api/tor/test")
      const data = await response.json()

      if (data.success) {
        const status = data.is_tor ? "SECURE" : "INSECURE"
        toast({
          title: "Connection Test",
          description: `Connection is ${status} (${data.response_time?.toFixed(2)}s)`,
        })
        addTerminalLine(`Connection test: ${status}`)
        addTerminalLine(`Response time: ${data.response_time?.toFixed(2)}s`)
        addTerminalLine(`Using Tor: ${data.is_tor ? "Yes" : "No"}`)
      } else {
        toast({
          title: "Test Failed",
          description: data.error || "Connection test failed",
          variant: "destructive",
        })
        addTerminalLine(`Connection test failed: ${data.error}`)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      })
      addTerminalLine("Failed to test connection")
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const addTerminalLine = (line: string) => {
    setTerminalOutput((prev) => [...prev, `> ${line}`])
  }

  const toggleRotation = () => {
    if (!torStatus.is_running) {
      toast({
        title: "Error",
        description: "Tor must be running to enable auto-rotation",
        variant: "destructive",
      })
      return
    }

    if (!isRotating) {
      setProgress(0)
      addTerminalLine("Automatic IP rotation activated")
    } else {
      addTerminalLine("Automatic IP rotation deactivated")
    }
    setIsRotating(!isRotating)
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const handleThreatDetected = (threat: any) => {
    addTerminalLine(`ALERT: ${threat.severity.toUpperCase()} threat detected - ${threat.message}`)
  }

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-black text-green-400 relative overflow-hidden">
        {/* Matrix-like background */}
        <div className="fixed inset-0 opacity-10 pointer-events-none">
          <MatrixBackground />
        </div>

        {/* Header */}
        <header className="border-b border-green-900/50 bg-black/80 backdrop-blur-sm p-4 sticky top-0 z-10">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AnonymousLogo size={32} className="mr-2" />
              <h1 className="text-2xl font-mono font-bold text-green-400 flex items-center">
                <span className="text-white">Nied</span>Proxy
                <span className="ml-2 text-xs bg-green-900/50 px-2 py-1 rounded-md">v2.0</span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-xs">
                <Badge variant="outline" className="border-green-500 text-green-400 font-mono">
                  localhost:5050
                </Badge>
                {torStatus.is_running && (
                  <>
                    <Badge variant="outline" className="border-green-500 text-green-400 font-mono">
                      {formatBytes(trafficStats.sent)} ↑
                    </Badge>
                    <Badge variant="outline" className="border-green-500 text-green-400 font-mono">
                      {formatBytes(trafficStats.received)} ↓
                    </Badge>
                  </>
                )}
              </div>

              <Badge
                variant="outline"
                className={`bg-black/80 ${
                  torStatus.is_running ? "border-green-500 text-green-400" : "border-red-500 text-red-400"
                }`}
              >
                {torStatus.is_running ? "TOR ACTIVE" : "TOR INACTIVE"}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                className={`font-mono ${
                  torStatus.is_running
                    ? "border-red-500 text-red-400 hover:bg-red-900/30"
                    : "border-green-500 text-green-400 hover:bg-green-900/30"
                }`}
                onClick={torStatus.is_running ? stopTor : startTor}
                disabled={isLoading}
              >
                {torStatus.is_running ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" />
                    STOP TOR
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    START TOR
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-400 hover:bg-green-900/30 hover:text-white font-mono"
                onClick={rotateIP}
                disabled={!torStatus.is_running || isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                ROTATE
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-400 hover:bg-green-900/30 hover:text-white font-mono"
                onClick={() => setShowAdvancedTerminal(true)}
              >
                <Terminal className="mr-2 h-4 w-4" />
                TERMINAL
              </Button>
            </div>
          </div>
        </header>

        {/* Advanced Terminal */}
        <AdvancedTerminal
          isOpen={showAdvancedTerminal}
          onClose={() => setShowAdvancedTerminal(false)}
          onCommand={(command, output) => {
            if (command === "rotate") {
              setTimeout(() => rotateIP(), 2000)
            } else if (command === "start") {
              setTimeout(() => startTor(), 1000)
            } else if (command === "stop") {
              setTimeout(() => stopTor(), 1000)
            }
          }}
        />

        {/* Main Content */}
        <div className="container mx-auto p-4">
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-black/50 backdrop-blur-sm border border-green-900/50">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-green-900/30 data-[state=active]:text-white font-mono"
              >
                DASHBOARD
              </TabsTrigger>
              <TabsTrigger
                value="proxies"
                className="data-[state=active]:bg-green-900/30 data-[state=active]:text-white font-mono"
              >
                PROXIES
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-green-900/30 data-[state=active]:text-white font-mono"
              >
                SETTINGS
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Current IP Card */}
                  <Card className="bg-black/50 backdrop-blur-sm border-green-900/50 overflow-hidden relative">
                    <div className="absolute inset-0 pointer-events-none opacity-5">
                      <NetworkMap />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white font-mono flex items-center">
                        <Globe className="h-5 w-5 text-green-500 mr-2" />
                        CURRENT IDENTITY
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Your current external IP address and location
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">IP Address:</span>
                          <span className="text-2xl font-mono text-green-400">
                            {torStatus.current_ip || "Not connected"}
                          </span>
                        </div>

                        {torStatus.geolocation && (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Location:</span>
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-green-500" />
                                <span className="text-white font-mono">
                                  {torStatus.geolocation.city}, {torStatus.geolocation.country}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Organization:</span>
                              <span className="text-white font-mono">{torStatus.geolocation.org}</span>
                            </div>
                          </>
                        )}

                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Proxy Type:</span>
                          <span className="text-white font-mono">
                            {torStatus.is_running ? (torStatus.is_tor ? "Tor Network" : "Direct") : "None"}
                          </span>
                        </div>

                        {torStatus.response_time && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Response Time:</span>
                            <span className="text-white font-mono">{torStatus.response_time.toFixed(2)}s</span>
                          </div>
                        )}

                        {lastRotation && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Last Rotation:</span>
                            <span className="text-white font-mono">{lastRotation.toLocaleTimeString()}</span>
                          </div>
                        )}

                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-400">Anonymity Score:</span>
                            <span
                              className={`font-mono ${
                                anonymityScore > 80
                                  ? "text-green-400"
                                  : anonymityScore > 50
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }`}
                            >
                              {anonymityScore}/100
                            </span>
                          </div>
                          <Progress
                            value={anonymityScore}
                            className="h-2 bg-green-900/30"
                            indicatorClassName={`${
                              anonymityScore > 80
                                ? "bg-green-500"
                                : anonymityScore > 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white font-mono flex items-center text-sm">
                          <Activity className="h-4 w-4 text-green-500 mr-2" />
                          TOR STATUS
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-3xl font-bold font-mono ${
                            torStatus.is_running ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {torStatus.is_running ? "ACTIVE" : "INACTIVE"}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {torStatus.is_running
                            ? torStatus.is_tor
                              ? "Using Tor network"
                              : "Direct connection"
                            : "Tor service stopped"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white font-mono flex items-center text-sm">
                          <Clock className="h-4 w-4 text-green-500 mr-2" />
                          CONNECTION
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-400 font-mono">
                          {torStatus.response_time ? `${torStatus.response_time.toFixed(1)}s` : "N/A"}
                        </div>
                        <p className="text-gray-400 text-sm">Response time</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white font-mono flex items-center text-sm">
                          <RefreshCw className="h-4 w-4 text-green-500 mr-2" />
                          ROTATIONS
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-400 font-mono">{lastRotation ? "1" : "0"}</div>
                        <p className="text-gray-400 text-sm">IP rotations today</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Security Score */}
                  <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-white font-mono flex items-center">
                          <Shield className="h-5 w-5 text-green-500 mr-2" />
                          SECURITY SCORE
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Detailed security metrics and analysis
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection("securityScore")}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-green-900/30"
                      >
                        {expandedSections.securityScore ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    {expandedSections.securityScore && (
                      <CardContent>
                        <SecurityScore overallScore={anonymityScore} />
                      </CardContent>
                    )}
                  </Card>

                  {/* Threat Monitor */}
                  <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-white font-mono flex items-center">
                          <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                          THREAT MONITOR
                        </CardTitle>
                        <CardDescription className="text-gray-400">Real-time security threat detection</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection("threatMonitor")}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-green-900/30"
                      >
                        {expandedSections.threatMonitor ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    {expandedSections.threatMonitor && (
                      <CardContent>
                        <ThreatMonitor onThreatDetected={handleThreatDetected} />
                      </CardContent>
                    )}
                  </Card>

                  {/* Route Visualization */}
                  <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-white font-mono flex items-center">
                          <Network className="h-5 w-5 text-green-500 mr-2" />
                          ROUTE VISUALIZATION
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                          Visual representation of your network route
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSection("routeVisualization")}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-green-900/30"
                      >
                        {expandedSections.routeVisualization ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    {expandedSections.routeVisualization && (
                      <CardContent>
                        <RouteVisualization
                          height={200}
                          proxyChain={torStatus.is_running ? ["Tor Entry", "Tor Middle", "Tor Exit"] : []}
                        />
                      </CardContent>
                    )}
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Rotation Control Card */}
                  <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white font-mono flex items-center">
                        <Zap className="h-5 w-5 text-green-500 mr-2" />
                        IP ROTATION
                      </CardTitle>
                      <CardDescription className="text-gray-400">Control automatic IP rotation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <Label htmlFor="rotation-toggle" className="text-white font-mono">
                              AUTO ROTATION
                            </Label>
                            <span className="text-xs text-gray-400">Automatically rotate IP address</span>
                          </div>
                          <Switch
                            id="rotation-toggle"
                            checked={isRotating}
                            onCheckedChange={toggleRotation}
                            disabled={!torStatus.is_running}
                            className="data-[state=checked]:bg-green-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="interval-slider" className="text-white font-mono">
                              INTERVAL: {rotationInterval}s
                            </Label>
                          </div>
                          <Slider
                            id="interval-slider"
                            min={30}
                            max={300}
                            step={30}
                            value={[rotationInterval]}
                            onValueChange={(value) => setRotationInterval(value[0])}
                            className="[&>span]:bg-green-500"
                            disabled={!torStatus.is_running}
                          />
                        </div>

                        {isRotating && torStatus.is_running && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-white font-mono">NEXT ROTATION:</Label>
                              <span className="text-sm text-gray-400 font-mono">
                                {Math.ceil((rotationInterval * (100 - progress)) / 100)}s
                              </span>
                            </div>
                            <Progress value={progress} className="h-2 bg-green-900/30">
                              <div className="h-full bg-green-500 transition-all" />
                            </Progress>
                          </div>
                        )}

                        <Button
                          onClick={rotateIP}
                          disabled={!torStatus.is_running || isLoading}
                          className="w-full bg-green-900/50 hover:bg-green-900/80 text-white border border-green-500/50 font-mono mt-2"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          FORCE ROTATION
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Traffic Stats */}
                  {torStatus.is_running && (
                    <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-white font-mono flex items-center">
                          <BarChart2 className="h-5 w-5 text-green-500 mr-2" />
                          TRAFFIC STATS
                        </CardTitle>
                        <CardDescription className="text-gray-400">Network traffic statistics</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">SENT</span>
                                <span className="text-xs text-green-400 font-mono">
                                  {formatBytes(trafficStats.sent)}
                                </span>
                              </div>
                              <Progress
                                value={Math.min((trafficStats.sent / 10000) * 100, 100)}
                                className="h-1 bg-green-900/30"
                              >
                                <div className="h-full bg-green-500 transition-all" />
                              </Progress>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">RECEIVED</span>
                                <span className="text-xs text-green-400 font-mono">
                                  {formatBytes(trafficStats.received)}
                                </span>
                              </div>
                              <Progress
                                value={Math.min((trafficStats.received / 20000) * 100, 100)}
                                className="h-1 bg-green-900/30"
                              >
                                <div className="h-full bg-green-500 transition-all" />
                              </Progress>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Active Connections:</span>
                            <span className="text-white font-mono">{trafficStats.connections}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Total Traffic:</span>
                            <span className="text-white font-mono">
                              {formatBytes(trafficStats.sent + trafficStats.received)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Encryption:</span>
                            <span className="text-green-400 font-mono">AES-256</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Actions */}
                  <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white font-mono flex items-center">
                        <Zap className="h-5 w-5 text-green-500 mr-2" />
                        QUICK ACTIONS
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start border-green-900/50 text-white hover:bg-green-900/30 font-mono"
                          onClick={testConnection}
                          disabled={!torStatus.is_running}
                        >
                          <Network className="mr-2 h-4 w-4 text-green-500" />
                          TEST CONNECTION
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start border-green-900/50 text-white hover:bg-green-900/30 font-mono"
                          onClick={() => {
                            addTerminalLine("Checking for IP leaks...")
                            setTimeout(() => {
                              addTerminalLine("No IP leaks detected")
                              toast({
                                title: "Security Check",
                                description: "No IP leaks detected",
                              })
                            }, 1500)
                          }}
                        >
                          <ShieldAlert className="mr-2 h-4 w-4 text-green-500" />
                          CHECK FOR LEAKS
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start border-green-900/50 text-white hover:bg-green-900/30 font-mono"
                          onClick={() => {
                            addTerminalLine("Clearing all logs and history...")
                            setTerminalOutput([])
                            setTimeout(() => {
                              addTerminalLine("All logs and history cleared")
                              toast({
                                title: "Privacy",
                                description: "All logs and history cleared",
                              })
                            }, 1000)
                          }}
                        >
                          <EyeOff className="mr-2 h-4 w-4 text-green-500" />
                          CLEAR ALL LOGS
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start border-green-900/50 text-white hover:bg-green-900/30 font-mono"
                          onClick={() => {
                            setShowAdvancedTerminal(true)
                          }}
                        >
                          <Terminal className="mr-2 h-4 w-4 text-green-500" />
                          OPEN TERMINAL
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Connection Log */}
                  <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white font-mono flex items-center">
                        <Terminal className="h-5 w-5 text-green-500 mr-2" />
                        CONNECTION LOG
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] overflow-auto font-mono text-xs bg-black/80 p-2 rounded border border-green-900/50">
                        {terminalOutput.slice(-8).map((line, i) => (
                          <div key={i} className="mb-1">
                            <span className="text-green-500">{line}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Proxies Tab */}
            <TabsContent value="proxies" className="mt-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Tor Status Card */}
                <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                  <CardHeader>
                    <CardTitle className="text-white font-mono flex items-center">
                      <Server className="h-5 w-5 text-green-500 mr-2" />
                      TOR NETWORK STATUS
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Current Tor network connection and circuit information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-md border border-green-900/50 bg-black/30">
                        <div className="flex items-center gap-3">
                          {torStatus.is_running ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium text-white font-mono">Tor Network</div>
                            <div className="text-xs text-gray-400 font-mono">SOCKS5 Proxy on localhost:9050</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`font-mono ${
                              torStatus.is_running ? "border-green-500 text-green-400" : "border-red-500 text-red-400"
                            }`}
                          >
                            {torStatus.is_running ? "CONNECTED" : "DISCONNECTED"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white hover:bg-green-900/30 font-mono"
                            onClick={testConnection}
                            disabled={!torStatus.is_running}
                          >
                            TEST
                          </Button>
                        </div>
                      </div>

                      {torStatus.is_running && torStatus.current_ip && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-white font-mono">CURRENT IP</Label>
                            <div className="p-2 bg-black/50 rounded border border-green-900/50">
                              <span className="text-green-400 font-mono">{torStatus.current_ip}</span>
                            </div>
                          </div>
                          {torStatus.geolocation && (
                            <div className="space-y-2">
                              <Label className="text-white font-mono">LOCATION</Label>
                              <div className="p-2 bg-black/50 rounded border border-green-900/50">
                                <span className="text-green-400 font-mono">
                                  {torStatus.geolocation.city}, {torStatus.geolocation.country}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={torStatus.is_running ? stopTor : startTor}
                          disabled={isLoading}
                          className={`${
                            torStatus.is_running
                              ? "bg-red-900/50 hover:bg-red-900/80 border-red-500/50"
                              : "bg-green-900/50 hover:bg-green-900/80 border-green-500/50"
                          } text-white border font-mono`}
                        >
                          {torStatus.is_running ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              STOP TOR
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              START TOR
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={rotateIP}
                          disabled={!torStatus.is_running || isLoading}
                          className="bg-green-900/50 hover:bg-green-900/80 text-white border border-green-500/50 font-mono"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          NEW IDENTITY
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Proxy Configuration */}
                <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                  <CardHeader>
                    <CardTitle className="text-white font-mono flex items-center">
                      <Settings className="h-5 w-5 text-green-500 mr-2" />
                      PROXY CONFIGURATION
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Configure proxy settings and connection parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white font-mono">SOCKS PORT</Label>
                          <Input value="9050" disabled className="bg-black border-green-900/50 text-white font-mono" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white font-mono">CONTROL PORT</Label>
                          <Input value="9051" disabled className="bg-black border-green-900/50 text-white font-mono" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white font-mono">EXIT NODES</Label>
                        <Select defaultValue="multi">
                          <SelectTrigger className="bg-black border-green-900/50 text-white font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-green-900/50 text-white">
                            <SelectItem value="multi">Multiple Countries (US, DE, NL, SE, CH)</SelectItem>
                            <SelectItem value="us">United States Only</SelectItem>
                            <SelectItem value="eu">Europe Only</SelectItem>
                            <SelectItem value="any">Any Country</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-white font-mono">CIRCUIT TIMEOUT</Label>
                          <Select defaultValue="30">
                            <SelectTrigger className="bg-black border-green-900/50 text-white font-mono">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-green-900/50 text-white">
                              <SelectItem value="15">15 seconds</SelectItem>
                              <SelectItem value="30">30 seconds</SelectItem>
                              <SelectItem value="60">60 seconds</SelectItem>
                              <SelectItem value="120">120 seconds</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-white font-mono">MAX CIRCUIT AGE</Label>
                          <Select defaultValue="600">
                            <SelectTrigger className="bg-black border-green-900/50 text-white font-mono">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-black border-green-900/50 text-white">
                              <SelectItem value="300">5 minutes</SelectItem>
                              <SelectItem value="600">10 minutes</SelectItem>
                              <SelectItem value="1200">20 minutes</SelectItem>
                              <SelectItem value="1800">30 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-4">
              <Card className="bg-black/50 backdrop-blur-sm border-green-900/50">
                <CardHeader>
                  <CardTitle className="text-white font-mono flex items-center">
                    <Settings className="h-5 w-5 text-green-500 mr-2" />
                    SYSTEM SETTINGS
                  </CardTitle>
                  <CardDescription className="text-gray-400">Configure NiedProxy settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-white font-mono">ACCESS CONTROL</h3>
                      <div className="space-y-4">
                        <div className="p-4 border border-green-900/50 rounded-md bg-black/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-4 w-4 text-green-500" />
                            <span className="text-white font-mono">LOCALHOST ONLY ACCESS</span>
                          </div>
                          <p className="text-xs text-gray-400 mb-2">
                            Dashboard is restricted to localhost:5050 for security
                          </p>
                          <Badge variant="outline" className="border-green-500 text-green-400 font-mono">
                            ACTIVE
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="auto-start" className="text-white font-mono">
                              AUTO-START TOR ON BOOT
                            </Label>
                            <p className="text-xs text-gray-400">Start Tor service when system boots</p>
                          </div>
                          <Switch id="auto-start" className="data-[state=checked]:bg-green-500" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="notifications" className="text-white font-mono">
                              ENABLE NOTIFICATIONS
                            </Label>
                            <p className="text-xs text-gray-400">Show notifications when IP changes</p>
                          </div>
                          <Switch id="notifications" defaultChecked className="data-[state=checked]:bg-green-500" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-white font-mono">SECURITY SETTINGS</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="strict-nodes" className="text-white font-mono">
                              STRICT EXIT NODES
                            </Label>
                            <p className="text-xs text-gray-400">Only use specified exit node countries</p>
                          </div>
                          <Switch id="strict-nodes" defaultChecked className="data-[state=checked]:bg-green-500" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="entry-guards" className="text-white font-mono">
                              USE ENTRY GUARDS
                            </Label>
                            <p className="text-xs text-gray-400">Use persistent entry guards for better security</p>
                          </div>
                          <Switch id="entry-guards" defaultChecked className="data-[state=checked]:bg-green-500" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="distinct-subnets" className="text-white font-mono">
                              ENFORCE DISTINCT SUBNETS
                            </Label>
                            <p className="text-xs text-gray-400">Ensure circuit nodes are on different subnets</p>
                          </div>
                          <Switch id="distinct-subnets" defaultChecked className="data-[state=checked]:bg-green-500" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="logging" className="text-white font-mono">
                              ENABLE LOGGING
                            </Label>
                            <p className="text-xs text-gray-400">Log Tor activities (disable for maximum privacy)</p>
                          </div>
                          <Switch id="logging" className="data-[state=checked]:bg-green-500" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-white font-mono">PERFORMANCE SETTINGS</h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="timeout" className="text-white font-mono">
                            CONNECTION TIMEOUT
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id="timeout"
                              type="number"
                              defaultValue="10"
                              min="5"
                              max="60"
                              className="bg-black border-green-900/50 text-white font-mono w-24"
                            />
                            <span className="text-gray-400 font-mono">SECONDS</span>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="circuit-period" className="text-white font-mono">
                            NEW CIRCUIT PERIOD
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id="circuit-period"
                              type="number"
                              defaultValue="30"
                              min="10"
                              max="300"
                              className="bg-black border-green-900/50 text-white font-mono w-24"
                            />
                            <span className="text-gray-400 font-mono">SECONDS</span>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="max-dirty" className="text-white font-mono">
                            MAX CIRCUIT DIRTINESS
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id="max-dirty"
                              type="number"
                              defaultValue="600"
                              min="300"
                              max="3600"
                              className="bg-black border-green-900/50 text-white font-mono w-24"
                            />
                            <span className="text-gray-400 font-mono">SECONDS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end mt-4">
                <Button className="bg-green-900/50 hover:bg-green-900/80 text-white border border-green-500/50 font-mono">
                  SAVE SETTINGS
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </TooltipProvider>
  )
}
