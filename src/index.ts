export { MyMcpServerAgent } from './my-mcp-server-agent';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		let sessionId = url.searchParams.get('sessionId');

		const mcpServerAgent = env.MCP_AGENTS.get(
			sessionId ? env.MCP_AGENTS.idFromString(sessionId) : env.MCP_AGENTS.newUniqueId()
		);

		return mcpServerAgent.fetch(request);
	},
}; 