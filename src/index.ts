export { MyMcpServerAgent } from './my-mcp-server-agent';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		let sessionId = url.searchParams.get('sessionId');
		if (!sessionId) {
			sessionId = crypto.randomUUID();
			url.searchParams.set('sessionId', sessionId);
		}
		const id = env.MCP_AGENTS.idFromName(sessionId);
		const mcpServerAgent = env.MCP_AGENTS.get(id);

		const newRequest = new Request(url.toString(), request);
		return mcpServerAgent.fetch(newRequest);
	},
}; 