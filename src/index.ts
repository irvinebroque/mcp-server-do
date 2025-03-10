export { MyMcpServerAgent } from './my-mcp-server-agent';

export interface Env {
	MCP_AGENTS: DurableObjectNamespace;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	  const url = new URL(request.url);
	  const path = url.pathname;
	  
	  if (path.startsWith('/sse')) {
		const parts = path.split('/').filter(Boolean);
		const connectionId = parts[1];
		
		const id = env.MCP_AGENTS.idFromName(connectionId);
		const mcpServer = env.MCP_AGENTS.get(id);
		
		// Forward the request to the Durable Object
		return mcpServer.sse(request);
	  }

	  // /mcp-message/{connectionId}
	  if (path.startsWith('/mcp-message')) {
		const parts = path.split('/').filter(Boolean);
		const connectionId = parts[1];
		const id = env.MCP_AGENTS.idFromName(connectionId);
		const mcpAgent = env.MCP_AGENTS.get(id);
		return mcpAgent.messages(request);
	  }

	  return new Response('Welcome to the SSE API. Use /create-sse to create a new SSE connection.', {
		headers: {
		  'Content-Type': 'text/plain'
		}
	  });
	},
  }; 