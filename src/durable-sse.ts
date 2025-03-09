import { CloudflareSSETransport } from './cloudflare-sse';

/**
 * SSE Durable Object to maintain state across requests
 */
export class SSEConnection implements DurableObject {
  private sseTransport: CloudflareSSETransport | null = null;
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle SSE connection
    if (request.method === 'GET' && path.endsWith('/connect')) {
      // Create a new SSE transport if it doesn't exist
      if (!this.sseTransport) {
        const messageEndpoint = new URL(request.url);
        messageEndpoint.pathname = messageEndpoint.pathname.replace('/connect', '/message');
        
        this.sseTransport = new CloudflareSSETransport(messageEndpoint.toString());
        
        // Set up event handlers
        this.sseTransport.onclose = () => {
          console.log('SSE connection closed');
          this.sseTransport = null;
        };
        
        this.sseTransport.onerror = (error) => {
          console.error('SSE error:', error);
        };
        
        this.sseTransport.onmessage = (message) => {
          console.log('Received message:', message);
          // Process the message as needed
        };
      }
      
      // Return the SSE response
      return this.sseTransport.createResponse();
    }
    
    // Handle client messages
    if (request.method === 'POST' && path.endsWith('/message')) {
      if (!this.sseTransport) {
        return new Response('SSE connection not established', { status: 500 });
      }
      
      return this.sseTransport.handlePostMessage(request);
    }
    
    // Handle sending a message from the server to the client
    if (request.method === 'POST' && path.endsWith('/send')) {
      if (!this.sseTransport) {
        return new Response('SSE connection not established', { status: 500 });
      }
      
      try {
        const message = await request.json();
        await this.sseTransport.send(message);
        return new Response('Message sent', { status: 200 });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(errorMessage, { status: 400 });
      }
    }
    
    return new Response('Not found', { status: 404 });
  }
}

/**
 * SSE Durable Object Factory
 */
export class SSEConnectionFactory {
  constructor(private state: DurableObjectState, private env: Env) {}
  
  newSSEConnection(id: string): DurableObjectStub {
    return this.env.SSE_CONNECTION.get(this.env.SSE_CONNECTION.idFromName(id));
  }
}

/**
 * Environment interface with Durable Object bindings
 */
export interface Env {
  SSE_CONNECTION: DurableObjectNamespace;
} 