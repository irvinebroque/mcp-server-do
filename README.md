# SSE + MCP Server + Durable Objects

1. A SSE Transport layer that works with `@modelcontextprotocol/typescript-sdk` (`/src/sse.ts`)
2. A MCP Server as a Durable Object (`/src/mcp-server-do.ts`)
3. Steps to run it end-to-end

## Run it

1. Clone this repo
2. `npm install`
3. `npm start` to start the DO (at `http://localhost:8787`)
4. `npx @modelcontextprotocol/inspector` to run the MCP inspector
5. Open the inspector, enter `http://localhost:8787/sse`

You should see:

<img width="853" alt="Screenshot 2025-03-09 at 5 21 24 PM" src="https://github.com/user-attachments/assets/04e0436c-a621-41a5-9809-4a3bd637a9f2" />


## Details

I took [this example](https://github.com/modelcontextprotocol/typescript-sdk/tree/main?tab=readme-ov-file#http-with-sse) from `@modelcontextprotocol/typescript-sdk`:

```ts
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0"
});

// ... set up server resources, tools, and prompts ...

const app = express();

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  // Note: to support multiple simultaneous connections, these messages will
  // need to be routed to a specific matching transport. (This logic isn't
  // implemented here, for simplicity.)
  await transport.handlePostMessage(req, res);
});

app.listen(3001);
```

...and implemented the same thing in Durable Objects. But first needed a transport layer
