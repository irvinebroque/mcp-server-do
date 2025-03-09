# MCP Server for Cloudflare Workers

This project implements a Model Context Protocol (MCP) server using Cloudflare Workers with Server-Sent Events (SSE) for real-time communication.

## Features

- Server-Sent Events (SSE) implementation for Cloudflare Workers
- Durable Objects for maintaining connection state
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

### Creating an SSE Connection

To create a new SSE connection, make a GET request to the `/create-sse` endpoint:

```
GET /create-sse
```

This will return a JSON response with the connection details:

```json
{
  "connectionId": "unique-id",
  "sseUrl": "https://your-worker.your-subdomain.workers.dev/sse/unique-id/connect",
  "messageUrl": "https://your-worker.your-subdomain.workers.dev/sse/unique-id/message",
  "sendUrl": "https://your-worker.your-subdomain.workers.dev/sse/unique-id/send"
}
```

### Establishing an SSE Connection

Connect to the SSE stream by making a GET request to the `sseUrl`:

```
GET /sse/{connectionId}/connect
```

### Sending Messages to the Server

Send messages to the server by making a POST request to the `messageUrl`:

```
POST /sse/{connectionId}/message
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "your-method",
  "params": {},
  "id": 1
}
```

### Sending Messages from the Server to the Client

Send messages from the server to the client by making a POST request to the `sendUrl`:

```
POST /sse/{connectionId}/send
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "your-method",
  "params": {},
  "id": 1
}
```

## Client Example

Here's an example of how to connect to the SSE stream from a client:

```javascript
// Create a new SSE connection
const response = await fetch('https://your-worker.your-subdomain.workers.dev/create-sse');
const { sseUrl, messageUrl } = await response.json();

// Connect to the SSE stream
const eventSource = new EventSource(sseUrl);

// Listen for messages
eventSource.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  console.log('Received message:', message);
});

// Listen for the endpoint event
eventSource.addEventListener('endpoint', (event) => {
  console.log('Endpoint:', decodeURI(event.data));
});

// Send a message to the server
async function sendMessage(message) {
  await fetch(messageUrl, {
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

## License

MIT 