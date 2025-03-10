import { Agent } from 'agents-sdk';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from './sse';

// Let's imagine that instead of a separate class from Agent
// That there is just a way to enable MCP by defining class on your own agent class
// mcp = true
// version of your MCP server
// etc.

// For now – a separate class.

export class McpServerAgent extends Agent<Env> {
	server: McpServer;
	transport: SSEServerTransport;
    
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.server = new McpServer({
			name: 'Demo',
			version: '1.0.0',
		});
        this.transport = new SSEServerTransport('/messages');
	}

	async sse(request: Request): Promise<Response> {
		await this.server.connect(this.transport);
		await this.transport.start();
		return this.transport.getResponse();
	}

	async messages(request: Request): Promise<Response> {
		return this.transport.handlePostMessage(request);
	}
}