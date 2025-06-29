"use client"

import { useState } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Server, Plus, X, ArrowRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Proxy {
  id: string
  name: string
  type: "tor" | "http" | "socks"
  location?: string
  status: "active" | "inactive"
}

interface ProxyChainProps {
  className?: string
  availableProxies?: Proxy[]
  onChainChange?: (chain: Proxy[]) => void
}

export function ProxyChain({
  className = "",
  availableProxies = [
    { id: "tor1", name: "Tor Circuit", type: "tor", location: "Global", status: "active" },
    { id: "http1", name: "HTTP Proxy 1", type: "http", location: "Netherlands", status: "active" },
    { id: "socks1", name: "SOCKS Proxy 1", type: "socks", location: "Germany", status: "active" },
    { id: "http2", name: "HTTP Proxy 2", type: "http", location: "Sweden", status: "inactive" },
    { id: "socks2", name: "SOCKS Proxy 2", type: "socks", location: "Romania", status: "active" },
  ],
  onChainChange,
}: ProxyChainProps) {
  const [chain, setChain] = useState<Proxy[]>([availableProxies.find((p) => p.id === "tor1")!])
  const [selectedProxy, setSelectedProxy] = useState<string>("")

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(chain)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setChain(items)

    if (onChainChange) {
      onChainChange(items)
    }
  }

  const handleAddProxy = () => {
    if (!selectedProxy) return

    const proxyToAdd = availableProxies.find((p) => p.id === selectedProxy)
    if (!proxyToAdd) return

    const newChain = [...chain, proxyToAdd]
    setChain(newChain)
    setSelectedProxy("")

    if (onChainChange) {
      onChainChange(newChain)
    }
  }

  const handleRemoveProxy = (index: number) => {
    const newChain = [...chain]
    newChain.splice(index, 1)
    setChain(newChain)

    if (onChainChange) {
      onChainChange(newChain)
    }
  }

  const getProxyTypeColor = (type: Proxy["type"]) => {
    switch (type) {
      case "tor":
        return "border-purple-500 text-purple-400"
      case "http":
        return "border-blue-500 text-blue-400"
      case "socks":
        return "border-green-500 text-green-400"
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-green-500" />
          <span className="text-white font-mono">PROXY CHAIN</span>
        </div>
        <Badge variant="outline" className="border-green-500 text-green-400 font-mono">
          {chain.length} HOPS
        </Badge>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="proxies" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex items-center gap-2 overflow-x-auto pb-2"
            >
              <div className="min-w-[80px] text-center px-2 py-1 bg-green-900/20 rounded-md border border-green-900/50">
                <span className="text-xs text-green-400 font-mono">YOU</span>
              </div>

              {chain.map((proxy, index) => (
                <div key={proxy.id} className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-green-500 mx-1" />
                  <Draggable draggableId={proxy.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="relative group"
                      >
                        <div
                          className={`min-w-[120px] px-3 py-2 rounded-md border bg-black/50 ${getProxyTypeColor(proxy.type)}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-mono">{proxy.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProxy(index)}
                              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white hover:bg-green-900/30 absolute -top-2 -right-2"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          {proxy.location && <span className="text-[10px] text-gray-500">{proxy.location}</span>}
                        </div>
                      </div>
                    )}
                  </Draggable>
                </div>
              ))}

              <ArrowRight className="h-4 w-4 text-green-500 mx-1" />
              <div className="min-w-[80px] text-center px-2 py-1 bg-green-900/20 rounded-md border border-green-900/50">
                <span className="text-xs text-green-400 font-mono">TARGET</span>
              </div>

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex items-center gap-2">
        <Select value={selectedProxy} onValueChange={setSelectedProxy}>
          <SelectTrigger className="bg-black border-green-900/50 text-white font-mono flex-1">
            <SelectValue placeholder="Add proxy to chain" />
          </SelectTrigger>
          <SelectContent className="bg-black border-green-900/50 text-white">
            {availableProxies
              .filter((p) => !chain.some((cp) => cp.id === p.id) && p.status === "active")
              .map((proxy) => (
                <SelectItem key={proxy.id} value={proxy.id}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${getProxyTypeColor(proxy.type)} text-xs`}>
                      {proxy.type.toUpperCase()}
                    </Badge>
                    <span>{proxy.name}</span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleAddProxy}
          disabled={!selectedProxy}
          className="bg-green-900/50 hover:bg-green-900/80 text-white border border-green-500/50 font-mono"
        >
          <Plus className="h-4 w-4" />
          ADD
        </Button>
      </div>
    </div>
  )
}
