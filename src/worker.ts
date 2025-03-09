import { Env as SSEEnv } from './durable-sse';

export interface Env extends SSEEnv {
  // Add any additional environment variables here
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle SSE connections and messages through the Durable Object
    if (path.startsWith('/sse/')) {
      // Extract the connection ID from the URL
      // Format: /sse/{connectionId}/{action}
      const parts = path.split('/').filter(Boolean);
      
      if (parts.length < 3) {
        return new Response('Invalid SSE URL format', { status: 400 });
      }
      
      const connectionId = parts[1];
      
      // Get the Durable Object for this connection
      const sseObject = env.SSE_CONNECTION.get(
        env.SSE_CONNECTION.idFromName(connectionId)
      );
      
      // Forward the request to the Durable Object
      return sseObject.fetch(request);
    }
    
    // Example: Create a new SSE connection
    if (path === '/create-sse') {
      // Generate a unique connection ID
      const connectionId = crypto.randomUUID();
      
      // Redirect to the SSE connection URL
      const sseUrl = new URL(url);
      sseUrl.pathname = `/sse/${connectionId}/connect`;
      
      return new Response(JSON.stringify({
        connectionId,
        sseUrl: sseUrl.toString(),
        messageUrl: `${url.origin}/sse/${connectionId}/message`,
        sendUrl: `${url.origin}/sse/${connectionId}/send`
      }), {
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Default response for other routes
    return new Response('Welcome to the SSE API. Use /create-sse to create a new SSE connection.', {
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  },
}; 