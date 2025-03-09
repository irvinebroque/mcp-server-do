import { Transport } from "@modelcontextprotocol/sdk";
import { JSONRPCMessage, JSONRPCMessageSchema } from "@modelcontextprotocol/sdk";

/**
 * Server transport for SSE in Cloudflare Workers: this will send messages over an SSE connection 
 * and receive messages from HTTP POST requests.
 */
export class CloudflareSSETransport implements Transport {
  private _sessionId: string;
  private _controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  private _stream: ReadableStream<Uint8Array>;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  /**
   * Creates a new SSE server transport for Cloudflare Workers, which will direct the client 
   * to POST messages to the relative or absolute URL identified by `endpoint`.
   */
  constructor(private endpoint: string) {
    // Generate a random session ID
    this._sessionId = crypto.randomUUID();
    
    // Create a readable stream for SSE
    this._stream = new ReadableStream({
      start: (controller) => {
        this._controller = controller;
      },
      cancel: () => {
        this._controller = null;
        this.onclose?.();
      }
    });
  }

  /**
   * Creates and returns a Response object for the SSE stream.
   */
  createResponse(): Response {
    // Write the SSE headers
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    // Create a new response with the stream
    const response = new Response(this._stream, { headers });

    // Send the initial endpoint event
    this._writeToStream(
      `event: endpoint\ndata: ${encodeURI(this.endpoint)}?sessionId=${this._sessionId}\n\n`
    );

    return response;
  }

  /**
   * Handles incoming POST messages from clients.
   */
  async handlePostMessage(request: Request): Promise<Response> {
    if (!this._controller) {
      const message = "SSE connection not established";
      return new Response(message, { status: 500 });
    }

    try {
      // Check content type
      const contentType = request.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Unsupported content-type: ${contentType}`);
      }

      // Parse the request body
      const body = await request.json();
      
      // Handle the message
      await this.handleMessage(body);
      
      // Return a success response
      return new Response("Accepted", { status: 202 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.onerror?.(error instanceof Error ? error : new Error(errorMessage));
      return new Response(errorMessage, { status: 400 });
    }
  }

  /**
   * Handle a client message, regardless of how it arrived.
   */
  async handleMessage(message: unknown): Promise<void> {
    let parsedMessage: JSONRPCMessage;
    try {
      parsedMessage = JSONRPCMessageSchema.parse(message);
    } catch (error) {
      this.onerror?.(error as Error);
      throw error;
    }

    this.onmessage?.(parsedMessage);
  }

  /**
   * Closes the SSE connection.
   */
  async close(): Promise<void> {
    if (this._controller) {
      this._controller.close();
      this._controller = null;
    }
    this.onclose?.();
  }

  /**
   * Sends a message to the client over the SSE connection.
   */
  async send(message: JSONRPCMessage): Promise<void> {
    if (!this._controller) {
      throw new Error("Not connected");
    }

    this._writeToStream(
      `event: message\ndata: ${JSON.stringify(message)}\n\n`
    );
  }

  /**
   * Helper method to write data to the stream.
   */
  private _writeToStream(data: string): void {
    if (!this._controller) {
      throw new Error("Stream controller not initialized");
    }
    
    const encoder = new TextEncoder();
    this._controller.enqueue(encoder.encode(data));
  }

  /**
   * Returns the session ID for this transport.
   * This can be used to route incoming POST requests.
   */
  get sessionId(): string {
    return this._sessionId;
  }
} 