import { MyMcpServerAgent } from './my-mcp-server-agent';
export { MyMcpServerAgent } from './my-mcp-server-agent';
import {
	AgentNamespace,
	routeAgentRequest,
	getAgentByName
  } from "agents-sdk";

export interface Env {
	MCP_AGENTS: AgentNamespace<MyMcpServerAgent>;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		//return (await routeAgentRequest(request, env)) || Response.json({ msg: 'no agent here' }, { status: 404 });

		const url = new URL(request.url);
		let sessionId = url.searchParams.get('sessionId');
		if (!sessionId) {
			sessionId = crypto.randomUUID();
		}

		const mcpServerAgent = getAgentByName<Env, MyMcpServerAgent>(env.MCP_AGENTS, sessionId);
		return (await mcpServerAgent).fetch(request);
	},
  }; 