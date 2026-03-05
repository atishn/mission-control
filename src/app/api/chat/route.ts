import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { OPENCLAW_ROOT } from "@/lib/config";
import WebSocket from "ws";

interface GatewayRPCRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

interface GatewayRPCResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

async function callGatewayMethod(
  port: number,
  token: string,
  method: string,
  params: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const requestId = Date.now();
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Gateway request timeout"));
    }, 30000); // 30 second timeout

    ws.on("open", () => {
      const request: GatewayRPCRequest = {
        jsonrpc: "2.0",
        id: requestId,
        method,
        params,
      };
      ws.send(JSON.stringify(request));
    });

    ws.on("message", (data: WebSocket.Data) => {
      try {
        const response: GatewayRPCResponse = JSON.parse(data.toString());
        
        if (response.id === requestId) {
          clearTimeout(timeout);
          ws.close();
          
          if (response.error) {
            reject(new Error(response.error.message || "Gateway error"));
          } else {
            resolve(response.result);
          }
        }
      } catch (err) {
        clearTimeout(timeout);
        ws.close();
        reject(err);
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Read OpenClaw config to get gateway settings
    const configPath = path.join(OPENCLAW_ROOT, "openclaw.json");
    let gatewayPort = 18789;
    let gatewayToken = "";

    try {
      const configRaw = await readFile(configPath, "utf-8");
      const config = JSON.parse(configRaw);
      gatewayPort = config.gateway?.port || 18789;
      gatewayToken = config.gateway?.auth?.token || "";
    } catch (err) {
      console.error("Failed to read OpenClaw config:", err);
    }

    // Send message to Smarty via gateway WebSocket RPC
    const result = await callGatewayMethod(gatewayPort, gatewayToken, "sessions.send", {
      sessionKey: "agent:smarty:main",
      message: message,
      wait: true,
    });

    // Extract the assistant's response
    let assistantResponse = "No response from Smarty";
    
    if (result?.response) {
      assistantResponse = result.response;
    } else if (result?.messages && Array.isArray(result.messages)) {
      const lastAssistantMsg = result.messages
        .filter((m: any) => m.role === "assistant")
        .pop();
      if (lastAssistantMsg?.content) {
        if (Array.isArray(lastAssistantMsg.content)) {
          // Handle content blocks
          const textBlocks = lastAssistantMsg.content
            .filter((block: any) => block.type === "text")
            .map((block: any) => block.text);
          assistantResponse = textBlocks.join("\n");
        } else if (typeof lastAssistantMsg.content === "string") {
          assistantResponse = lastAssistantMsg.content;
        }
      }
    }

    return NextResponse.json({ response: assistantResponse });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { 
        error: "Failed to communicate with OpenClaw gateway", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
