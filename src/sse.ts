import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage, JSONRPCMessageSchema } from "@modelcontextprotocol/sdk/types.js";

/**
 * Server transport for SSE: this will send messages over an SSE connection and receive messages from HTTP POST requests.
 */
export class SSEServerTransport implements Transport {
  private _sseResponse?: Response;
  private _sessionId: string;
  private _controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  private _stream: ReadableStream<Uint8Array>;
  private _connected: boolean = false;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  /**
   * Creates a new SSE server transport, which will direct the client to POST messages to the relative or absolute URL identified by `_endpoint`.
   */
  constructor(
    private _endpoint: string,
  ) {
    this._sessionId = crypto.randomUUID();
    
    // Create a readable stream for SSE
    this._stream = new ReadableStream({
      start: (controller) => {
        this._controller = controller;
      },
      cancel: () => {
        this._controller = null;
        this._connected = false;
        this.onclose?.();
      }
    });
  }

  /**
   * Handles the initial SSE connection request.
   * 
   * This method prepares the SSE connection but doesn't return the Response directly.
   * Use getResponse() to get the Response object for the client.
   */
  async start(): Promise<void> {
    // if (this._connected) {
    //   throw new Error(
    //     "SSEServerTransport already started! If using Server class, note that connect() calls start() automatically.",
    //   );
    // }

    // Create headers for SSE
    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    // Create the response with the stream
    this._sseResponse = new Response(this._stream, { headers });
    this._connected = true;

    // Send the endpoint event
    this._writeToStream(
      `event: endpoint\ndata: ${encodeURI(this._endpoint)}?sessionId=${this._sessionId}\n\n`
    );
  }
  
  /**
   * Returns the Response object for the SSE connection.
   * This should be called after start() to get the Response to return to the client.
   */
  getResponse(): Response {
    if (!this._sseResponse) {
      throw new Error("SSE connection not started. Call start() first.");
    }
    return this._sseResponse;
  }

  /**
   * Handles incoming POST messages.
   *
   * This should be called when a POST request is made to send a message to the server.
   */
  async handlePostMessage(
    request: Request,
  ): Promise<Response> {
    if (!this._connected) {
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

  async close(): Promise<void> {
    if (this._controller) {
      this._controller.close();
      this._controller = null;
    }
    this._connected = false;
    this._sseResponse = undefined;
    this.onclose?.();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this._connected || !this._controller) {
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
   */
  get sessionId(): string {
    return this._sessionId;
  }
}