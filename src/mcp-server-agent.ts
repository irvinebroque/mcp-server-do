import { Agent } from 'agents-sdk';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEEdgeTransport } from './sse-edge';

export class McpServerAgent extends Agent<Env> {
	server: McpServer;
	protected transport: SSEEdgeTransport | undefined;
    
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.server = new McpServer({
			name: 'Demo',
			version: '1.0.0',
		});
	}

	override async fetch(request: Request) {
        const url = new URL(request.url);
        console.log('url', url.searchParams.get('sessionId'));
        let sessionId = url.searchParams.get('sessionId');
        if (!sessionId) {
            throw new Error('Session ID not found');
        }
            
        if (!this.transport) {
            this.transport = new SSEEdgeTransport(`/message?${sessionId}`, sessionId);
        }

        if (request.method === 'GET' && url.pathname.endsWith('/sse')) {
            console.log('GET /sse');
            await this.server.connect(this.transport);
            return this.transport.sseResponse;
        }

        if (request.method === 'POST' && url.pathname.endsWith('/message')) {
            console.log('POST /message');
            const response = await this.transport.handlePostMessage(request);
            return response;
        }

        return new Response('Not found', { status: 404 });
    }
}