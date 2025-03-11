import {
	getAgentByName
  } from "agents-sdk";

export interface Env {
  MCP_AGENTS: AgentNamespace<MyMcpServerAgent>;
}

export async function routeMcpAgentRequest(request: Request, env: Env) {
    const url = new URL(request.url);
    let sessionId = url.searchParams.get('sessionId');
    if (!sessionId) {
        sessionId = crypto.randomUUID();
    }

    const mcpServerAgent = await getAgentByName<Env, MyMcpServerAgent>(env.MCP_AGENTS, sessionId);
    return await mcpServerAgent.fetch(request);
}