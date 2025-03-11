import { Agent } from 'agents-sdk';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEEdgeTransport } from './sse-edge';

export class McpServerAgent extends Agent<Env> {
	server: McpServer;
	private transport: SSEEdgeTransport | undefined;
    
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.server = new McpServer({
			name: 'Demo',
			version: '1.0.0',
		});
	}

	override async fetch(request: Request) {
        const url = new URL(request.url);
		const sessionId = this.ctx.id.toString();

        if (!this.transport) {
            this.transport = new SSEEdgeTransport(`/message?${sessionId}`, sessionId);
        }

        if (request.method === 'GET' && url.pathname.endsWith('/sse')) {
            console.log('sessionId', sessionId);
            await this.server.connect(this.transport);
            return this.transport.sseResponse;
        }

        if (request.method === 'POST' && url.pathname.endsWith('/message')) {
            console.log('sessionId', sessionId);
            const response = await this.transport.handlePostMessage(request);
            console.log('response', response);
            return response;
        }

        return new Response('Not found', { status: 404 });
    }
}