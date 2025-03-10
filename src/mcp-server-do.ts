import { DurableObject } from 'cloudflare:workers';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from './sse';

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

	async sse(request: Request): Promise<Response> {
		console.log('Handling SSE request');
		await this.server.connect(this.transport);
		await this.transport.start();
		return this.transport.getResponse();
	}

	async messages(request: Request): Promise<Response> {
		console.log('Handling message request');
		return this.transport.handlePostMessage(request);
	}
}