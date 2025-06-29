"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { TerminalIcon, X, Minimize, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface Command {
  name: string
  description: string
  execute: (args: string[]) => string | string[]
}

interface AdvancedTerminalProps {
  className?: string
  isOpen: boolean
  onClose: () => void
  initialOutput?: string[]
  onCommand?: (command: string, output: string | string[]) => void
}

export function AdvancedTerminal({
  className = "",
  isOpen,
  onClose,
  initialOutput = ["NiedProxy Terminal v2.0", "Type 'help' to see available commands", ""],
  onCommand,
}: AdvancedTerminalProps) {
  const [output, setOutput] = useState<string[]>(initialOutput)
  const [input, setInput] = useState("")
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isMinimized, setIsMinimized] = useState(false)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [output])

  // Focus input when terminal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const commands: Command[] = [
    {
      name: "help",
      description: "Show available commands",
      execute: () => {
        return ["Available commands:", ...commands.map((cmd) => `  ${cmd.name.padEnd(15)} - ${cmd.description}`), ""]
      },
    },
    {
      name: "clear",
      description: "Clear the terminal",
      execute: () => {
        setOutput([])
        return ""
      },
    },
    {
      name: "status",
      description: "Show current proxy status",
      execute: () => {
        return [
          "Proxy Status:",
          "  Current IP: 185.220.101.34",
          "  Location: Amsterdam, Netherlands",
          "  Active Proxy: Tor Circuit",
          "  Chain Length: 3 hops",
          "  Encryption: AES-256-GCM",
          "  Connection: Established",
          "",
        ]
      },
    },
    {
      name: "rotate",
      description: "Rotate to a new IP address",
      execute: () => {
        // Simulate IP rotation
        setTimeout(() => {
          toast({
            title: "IP Rotated",
            description: "New IP: 176.10.99.200 (Germany)",
          })
        }, 1500)

        return ["Initiating IP rotation...", "Establishing new Tor circuit...", "This may take a few seconds.", ""]
      },
    },
    {
      name: "scan",
      description: "Scan for security vulnerabilities",
      execute: () => {
        return [
          "Scanning system for vulnerabilities...",
          "WebRTC leak protection: ACTIVE",
          "DNS leak protection: ACTIVE",
          "Browser fingerprinting protection: ACTIVE",
          "JavaScript tracking protection: PARTIAL",
          "Canvas fingerprinting protection: ACTIVE",
          "No critical vulnerabilities detected.",
          "",
        ]
      },
    },
    {
      name: "trace",
      description: "Trace route to a domain",
      execute: (args) => {
        const domain = args[0] || "example.com"
        return [
          `Tracing route to ${domain}...`,
          "Hop 1: Local Router (192.168.1.1) - 1ms",
          "Hop 2: ISP Gateway (10.0.0.1) - 5ms",
          "Hop 3: Tor Entry Node (ENCRYPTED) - 45ms",
          "Hop 4: Tor Middle Node (ENCRYPTED) - 78ms",
          "Hop 5: Tor Exit Node (ENCRYPTED) - 120ms",
          "Hop 6: Destination Server - 145ms",
          "Route trace complete. All traffic encrypted through Tor network.",
          "",
        ]
      },
    },
    {
      name: "chain",
      description: "Configure proxy chain",
      execute: (args) => {
        const action = args[0]

        if (action === "list") {
          return ["Current Proxy Chain:", "1. Tor Entry Node", "2. Tor Middle Node", "3. Tor Exit Node", ""]
        } else if (action === "add" && args[1]) {
          return [
            `Adding proxy ${args[1]} to chain...`,
            "Proxy added successfully.",
            "New chain: Tor Entry → Tor Middle → Tor Exit → HTTP Proxy",
            "",
          ]
        } else if (action === "remove" && args[1]) {
          return [
            `Removing proxy at position ${args[1]}...`,
            "Proxy removed successfully.",
            "New chain: Tor Entry → Tor Exit",
            "",
          ]
        } else {
          return [
            "Usage: chain [list|add|remove] [proxy_name|position]",
            "Examples:",
            "  chain list",
            "  chain add http-proxy",
            "  chain remove 2",
            "",
          ]
        }
      },
    },
    {
      name: "ping",
      description: "Ping a host through the proxy",
      execute: (args) => {
        const host = args[0] || "example.com"
        return [
          `Pinging ${host} through proxy chain...`,
          "Request routed through Tor network",
          "PING 1: 145ms",
          "PING 2: 132ms",
          "PING 3: 158ms",
          "PING 4: 140ms",
          "Average: 143.75ms",
          "",
        ]
      },
    },
    {
      name: "exit",
      description: "Close the terminal",
      execute: () => {
        onClose()
        return ""
      },
    },
  ]

  const handleCommand = () => {
    if (!input.trim()) return

    // Add command to history
    setHistory((prev) => [input, ...prev])
    setHistoryIndex(-1)

    // Add command to output
    setOutput((prev) => [...prev, `> ${input}`])

    // Parse command
    const args = input.trim().split(/\s+/)
    const commandName = args.shift()?.toLowerCase() || ""

    // Find command
    const command = commands.find((cmd) => cmd.name === commandName)

    if (command) {
      // Execute command
      const result = command.execute(args)

      // Add result to output
      if (result) {
        if (typeof result === "string") {
          if (result) setOutput((prev) => [...prev, result])
        } else {
          setOutput((prev) => [...prev, ...result])
        }
      }

      // Notify parent
      if (onCommand) {
        onCommand(input, result)
      }
    } else {
      // Command not found
      setOutput((prev) => [...prev, `Command not found: ${commandName}`, "Type 'help' to see available commands", ""])
    }

    // Clear input
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand()
    } else if (e.key === "ArrowUp") {
      // Navigate history up
      if (history.length > 0 && historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
      }
    } else if (e.key === "ArrowDown") {
      // Navigate history down
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput("")
      }
    } else if (e.key === "Tab") {
      e.preventDefault()

      // Simple command completion
      if (input) {
        const partialCommand = input.trim().split(/\s+/)[0].toLowerCase()
        const matches = commands.filter((cmd) => cmd.name.startsWith(partialCommand)).map((cmd) => cmd.name)

        if (matches.length === 1) {
          setInput(matches[0])
        } else if (matches.length > 1) {
          setOutput((prev) => [...prev, `> ${input}`, ...matches, ""])
        }
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 bg-black/90 z-20 flex flex-col p-4 ${isMinimized ? "h-auto bottom-0 top-auto" : ""} ${className}`}
    >
      <div className="flex justify-between items-center mb-2 border-b border-green-900/50 pb-2">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-5 w-5 text-green-500" />
          <h2 className="text-green-400 font-mono">NiedProxy Terminal</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-green-900/30"
          >
            {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-green-900/30"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div
            ref={terminalRef}
            className="flex-1 font-mono text-sm overflow-auto bg-black/80 p-4 rounded-md border border-green-900/50"
          >
            {output.map((line, i) => (
              <div key={i} className="mb-1">
                <span className={line.startsWith(">") ? "text-blue-400" : "text-green-500"}>{line}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center">
            <span className="text-green-500 font-mono mr-2">{">"}</span>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-black border-green-900/50 text-green-400 font-mono"
              placeholder="Enter command..."
              autoComplete="off"
              spellCheck="false"
            />
          </div>
        </>
      )}
    </div>
  )
}
