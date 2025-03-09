import { DurableObject } from 'cloudflare:workers';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from './sse';

export interface Env {
	MCP_DO: DurableObjectNamespace;
}

// Keep the existing MyDurableObject for backward compatibility
export class MyMcpServerDurableObject extends DurableObject<Env> {
	server: McpServer;
	transport: SSEServerTransport;
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.server = new McpServer({
			name: 'Demo',
			version: '1.0.0',
		});
		
		// Define the add tool with proper typing
		this.server.tool('add', 'Add two numbers', async (extra: any) => {
			const { a, b } = extra.params as { a: number, b: number };
			return {
				content: [{ type: 'text', text: String(a + b) }],
			};
		});

		this.server.resource('greeting', new ResourceTemplate('greeting://{name}', { list: undefined }), async (uri, { name }) => ({
			contents: [
				{
					uri: uri.href,
					text: `Hello, ${name}!`,
				},
			],
		}));

		this.transport = new SSEServerTransport('/mcp-message');
	}

	async sse(request: Request): Promise<void> {
		await this.server.connect(this.transport);
	}

	async messages(request: Request): Promise<Response> {
		return this.transport.handlePostMessage(request);
	}
}


export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	  const url = new URL(request.url);
	  const path = url.pathname;
	  
	  // Handle SSE connections and messages through the Durable Object
	  if (path.startsWith('/sse/')) {
		// Extract the connection ID from the URL
		// Format: /sse/{connectionId}/{action}
		const parts = path.split('/').filter(Boolean);
		
		if (parts.length < 3) {
		  return new Response('Invalid SSE URL format', { status: 400 });
		}
		
		const connectionId = parts[1];
		
		// Get the Durable Object for this connection
		const sseObject = env.MCP_DO.get(
		  env.MCP_DO.idFromName(connectionId)
		);
		
		// Forward the request to the Durable Object
		return sseObject.fetch(request);
	  }
	  
	  // Example: Create a new SSE connection
	  if (path === '/create-sse') {
		// Generate a unique connection ID
		const connectionId = crypto.randomUUID();
		
		// Redirect to the SSE connection URL
		const sseUrl = new URL(url);
		sseUrl.pathname = `/sse/${connectionId}/connect`;
		
		return new Response(JSON.stringify({
		  connectionId,
		  sseUrl: sseUrl.toString(),
		  messageUrl: `${url.origin}/sse/${connectionId}/message`,
		  sendUrl: `${url.origin}/sse/${connectionId}/send`
		}), {
		  headers: {
			'Content-Type': 'application/json'
		  }
		});
	  }
	  
	  // Default response for other routes
	  return new Response('Welcome to the SSE API. Use /create-sse to create a new SSE connection.', {
		headers: {
		  'Content-Type': 'text/plain'
		}
	  });
	},
  }; 