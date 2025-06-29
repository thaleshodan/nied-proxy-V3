"use client"

import { useEffect, useRef, useState } from "react"

interface Node {
  id: string
  x: number
  y: number
  type: "source" | "proxy" | "destination"
  name: string
}

interface Connection {
  source: string
  target: string
  active: boolean
}

interface RouteVisualizationProps {
  className?: string
  height?: number
  proxyChain?: string[]
  destination?: string
}

export function RouteVisualization({
  className = "",
  height = 200,
  proxyChain = ["Tor Entry", "Tor Middle", "Tor Exit"],
  destination = "Target Server",
}: RouteVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [activePathIndex, setActivePathIndex] = useState(0)
  const animationRef = useRef<number>(0)

  // Initialize nodes and connections
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const width = canvas.offsetWidth

    // Create nodes
    const newNodes: Node[] = []

    // Source node (your computer)
    newNodes.push({
      id: "source",
      x: 40,
      y: height / 2,
      type: "source",
      name: "Your Device",
    })

    // Proxy nodes
    const proxyCount = proxyChain.length
    const proxySpacing = (width - 120) / (proxyCount + 1)

    proxyChain.forEach((proxy, index) => {
      newNodes.push({
        id: `proxy-${index}`,
        x: 80 + proxySpacing * (index + 1),
        y: height / 2,
        type: "proxy",
        name: proxy,
      })
    })

    // Destination node
    newNodes.push({
      id: "destination",
      x: width - 40,
      y: height / 2,
      type: "destination",
      name: destination,
    })

    setNodes(newNodes)

    // Create connections
    const newConnections: Connection[] = []

    // Connect source to first proxy
    newConnections.push({
      source: "source",
      target: "proxy-0",
      active: true,
    })

    // Connect proxies
    for (let i = 0; i < proxyCount - 1; i++) {
      newConnections.push({
        source: `proxy-${i}`,
        target: `proxy-${i + 1}`,
        active: i < 1, // Only the first connection is active initially
      })
    }

    // Connect last proxy to destination
    newConnections.push({
      source: `proxy-${proxyCount - 1}`,
      target: "destination",
      active: false,
    })

    setConnections(newConnections)
  }, [height, proxyChain, destination])

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0 || connections.length === 0) return

    let lastTime = 0
    const interval = 1000 // 1 second between path segments activating

    const animate = (time: number) => {
      if (time - lastTime > interval) {
        lastTime = time

        // Advance the active path
        setActivePathIndex((prev) => {
          const newIndex = prev + 1
          if (newIndex >= connections.length) {
            // Reset all connections after a delay
            setTimeout(() => {
              setConnections((prev) => prev.map((conn) => ({ ...conn, active: false })))
              setActivePathIndex(0)

              // Activate the first connection again
              setTimeout(() => {
                setConnections((prev) => prev.map((conn, i) => (i === 0 ? { ...conn, active: true } : conn)))
              }, 500)
            }, 1000)

            return prev
          }

          // Activate the next connection
          setConnections((prev) => prev.map((conn, i) => (i === newIndex ? { ...conn, active: true } : conn)))

          return newIndex
        })
      }

      draw()
      animationRef.current = requestAnimationFrame(animate)
    }

    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      connections.forEach((conn) => {
        const source = nodes.find((n) => n.id === conn.source)
        const target = nodes.find((n) => n.id === conn.target)

        if (!source || !target) return

        ctx.beginPath()
        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)

        if (conn.active) {
          ctx.strokeStyle = "#00ff00"
          ctx.lineWidth = 2

          // Draw data packets moving along the connection
          const dx = target.x - source.x
          const dy = target.y - source.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          const packetCount = Math.floor(dist / 30)
          const now = Date.now() / 1000

          for (let i = 0; i < packetCount; i++) {
            const offset = (now * 2 + i / packetCount) % 1
            const x = source.x + dx * offset
            const y = source.y + dy * offset

            ctx.fillStyle = "#00ff00"
            ctx.beginPath()
            ctx.arc(x, y, 3, 0, Math.PI * 2)
            ctx.fill()
          }
        } else {
          ctx.strokeStyle = "#1a3a1a"
          ctx.lineWidth = 1
        }

        ctx.stroke()
      })

      // Draw nodes
      nodes.forEach((node) => {
        ctx.beginPath()

        if (node.type === "source") {
          // Computer icon
          ctx.fillStyle = "#1a3a1a"
          ctx.fillRect(node.x - 10, node.y - 10, 20, 20)
          ctx.strokeStyle = "#00ff00"
          ctx.strokeRect(node.x - 10, node.y - 10, 20, 20)

          // Screen
          ctx.fillStyle = "#00ff00"
          ctx.fillRect(node.x - 6, node.y - 6, 12, 8)
        } else if (node.type === "proxy") {
          // Server icon
          ctx.fillStyle = "#1a3a1a"
          ctx.fillRect(node.x - 8, node.y - 12, 16, 24)
          ctx.strokeStyle = "#00ff00"
          ctx.strokeRect(node.x - 8, node.y - 12, 16, 24)

          // Server lines
          ctx.beginPath()
          ctx.moveTo(node.x - 4, node.y - 8)
          ctx.lineTo(node.x + 4, node.y - 8)
          ctx.moveTo(node.x - 4, node.y - 4)
          ctx.lineTo(node.x + 4, node.y - 4)
          ctx.moveTo(node.x - 4, node.y)
          ctx.lineTo(node.x + 4, node.y)
          ctx.moveTo(node.x - 4, node.y + 4)
          ctx.lineTo(node.x + 4, node.y + 4)
          ctx.strokeStyle = "#00ff00"
          ctx.stroke()
        } else if (node.type === "destination") {
          // Globe icon
          ctx.beginPath()
          ctx.arc(node.x, node.y, 10, 0, Math.PI * 2)
          ctx.fillStyle = "#1a3a1a"
          ctx.fill()
          ctx.strokeStyle = "#00ff00"
          ctx.stroke()

          // Latitude lines
          ctx.beginPath()
          ctx.ellipse(node.x, node.y, 10, 4, 0, 0, Math.PI * 2)
          ctx.moveTo(node.x - 10, node.y)
          ctx.lineTo(node.x + 10, node.y)
          ctx.strokeStyle = "#00ff00"
          ctx.stroke()
        }

        // Node label
        ctx.font = "8px monospace"
        ctx.fillStyle = "#00ff00"
        ctx.textAlign = "center"
        ctx.fillText(node.name, node.x, node.y + 20)
      })
    }

    // Set canvas dimensions
    const resizeCanvas = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Start animation
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [nodes, connections])

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
