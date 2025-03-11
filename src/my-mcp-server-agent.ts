import { McpServerAgent } from './mcp-server-agent';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

export class MyMcpServerAgent extends McpServerAgent {
    
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		
		// All of this gets replaced by RPC methods
		// cloudflare/workers-mcp
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
}