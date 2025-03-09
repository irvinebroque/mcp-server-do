# MCP Server for Cloudflare Workers

This project implements a Model Context Protocol (MCP) server using Cloudflare Workers with Server-Sent Events (SSE) for real-time communication.

## Features

- Server-Sent Events (SSE) implementation for Cloudflare Workers
- ReadableStream-based SSE transport compatible with Cloudflare Workers
- JSON-RPC message handling

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- A Cloudflare account

### Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Configure your Cloudflare account with Wrangler:

```bash
npx wrangler login
```

### Development

Run the development server:

```bash
npm run dev
```

### Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Usage

### Using the SSEServerTransport in Cloudflare Workers

The `SSEServerTransport` class has been updated to use `ReadableStream` instead of Node.js-specific response methods, making it compatible with Cloudflare Workers.

Here's how to use it in a Cloudflare Worker:

```typescript
import { SSEServerTransport } from './sse';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle SSE connection
    if (path === '/sse' && request.method === 'GET') {
      // Create a new SSE transport
      const transport = new SSEServerTransport('/message');
      
      // Set up event handlers
      transport.onclose = () => {
        console.log('SSE connection closed');
      };
      
      transport.onerror = (error) => {
        console.error('SSE error:', error);
      };
      
      transport.onmessage = (message) => {
        console.log('Received message:', message);
        transport.send(message).catch(console.error);
      };
      
      // Start the SSE connection
      await transport.start();
      
      // Return the SSE response
      return transport.getResponse();
    }
    
    // Handle client messages
    if (path === '/message' && request.method === 'POST') {
      // Extract the session ID from the query parameters
      const sessionId = url.searchParams.get('sessionId');
      if (!sessionId) {
        return new Response('Missing sessionId', { status: 400 });
      }
      
      // In a real application, you would need to retrieve the transport
      // instance based on the session ID
      
      // Handle the message
      return transport.handlePostMessage(request);
    }
    
    // Default response for other routes
    return new Response('Not found', { status: 404 });
  },
};
```

### Client Example

Here's an example of how to connect to the SSE stream from a client:

```javascript
// Connect to the SSE stream
const eventSource = new EventSource('/sse');

// Listen for messages
eventSource.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
});

// Listen for the endpoint event
eventSource.addEventListener('endpoint', (event) => {
  const endpoint = decodeURI(event.data);
  console.log('Endpoint:', endpoint);
  
  // Store the endpoint for sending messages
  window.messageEndpoint = endpoint;
});

// Send a message to the server
async function sendMessage(message) {
  if (!window.messageEndpoint) {
    console.error('No endpoint available yet');
    return;
  }
  
  await fetch(window.messageEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  });
}

// Example: Send a message
sendMessage({
  jsonrpc: '2.0',
  method: 'hello',
  params: { name: 'World' },
  id: 1
});
```

## Integration with MCP Server

You can integrate the SSEServerTransport with the MCP Server:

```typescript
import { SSEServerTransport } from './sse';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Create a new SSE transport
const transport = new SSEServerTransport('/mcp-message');

// Create an MCP server
const mcpServer = new McpServer({
  name: 'Example MCP Server',
  version: '1.0.0',
});

// Connect the transport to the MCP server
mcpServer.connect(transport);

// Start the SSE connection
await transport.start();

// Return the SSE response
return transport.getResponse();
```

## License

MIT 