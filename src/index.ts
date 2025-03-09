import { DurableObject } from 'cloudflare:workers';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { SSEConnection } from './durable-sse';
import worker from './worker';

// Export the SSEConnection Durable Object
export { SSEConnection };

// Export the worker as the default export
export default worker;

// Keep the existing MyDurableObject for backward compatibility
export class MyDurableObject extends DurableObject<Env> {
	server: McpServer;

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
	}

	async sayHello(name: string): Promise<string> {
		return `Hello, ${name}!`;
	}

	async sse(request: Request): Promise<Response> {
		// This method is now deprecated - use the SSEConnection Durable Object instead
		return new Response('This method is deprecated. Use the SSEConnection Durable Object instead.', { status: 410 });
	}
}

export interface Env {
	MY_DURABLE_OBJECT: DurableObjectNamespace;
	SSE_CONNECTION: DurableObjectNamespace;
}
