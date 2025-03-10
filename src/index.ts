export { MyMcpServerDurableObject } from './mcp-server-do';

export interface Env {
	MCP_DO: DurableObjectNamespace;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	  const url = new URL(request.url);
	  const path = url.pathname;
	  
	  if (path.startsWith('/sse')) {
		const parts = path.split('/').filter(Boolean);
		const connectionId = parts[1];
		
		const id = env.MCP_DO.idFromName(connectionId);
		const mcpServer = env.MCP_DO.get(id);
		
		// Forward the request to the Durable Object
		return mcpServer.sse(request);
	  }

	  // /mcp-message/{connectionId}
	  if (path.startsWith('/mcp-message')) {
		const parts = path.split('/').filter(Boolean);
		const connectionId = parts[1];
		const id = env.MCP_DO.idFromName(connectionId);
		const mcpServer = env.MCP_DO.get(id);
		return mcpServer.messages(request);
	  }

	  return new Response('Welcome to the SSE API. Use /create-sse to create a new SSE connection.', {
		headers: {
		  'Content-Type': 'text/plain'
		}
	  });
	},
  }; 