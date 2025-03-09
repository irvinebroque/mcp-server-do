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
	  
	  // /sse/{connectionId}
	  if (path.startsWith('/sse/')) {
		const parts = path.split('/').filter(Boolean);
		const connectionId = parts[1];
		
		const id = env.MCP_DO.idFromName(connectionId);
		const mcpServer = env.MCP_DO.get(id);
		
		// Forward the request to the Durable Object
		return mcpServer.sse(request);
	  }

	  // /mcp-message/{connectionId}
	  if (path.startsWith('/mcp-message')) {
		const parts = path.split('/').filter(Boolean);
		const connectionId = parts[1];
		const id = env.MCP_DO.idFromName(connectionId);
		const mcpServer = env.MCP_DO.get(id);
		return mcpServer.messages(request);
	  }

	  return new Response('Welcome to the SSE API. Use /create-sse to create a new SSE connection.', {
		headers: {
		  'Content-Type': 'text/plain'
		}
	  });
	},
  }; 