type WebSocketStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

type EventHandler = (event: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Set<EventHandler> = new Set();
  private statusListeners: Set<(status: WebSocketStatus) => void> = new Set();
  private reconnectTimer: any = null;
  public status: WebSocketStatus = 'DISCONNECTED';

  constructor() {
    const wsHost = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
    this.url = wsHost;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('CONNECTING');
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (messageEvent) => {
        try {
          const data = JSON.parse(messageEvent.data);
          this.listeners.forEach((handler) => handler(data));
        } catch (e) {
          console.warn('Failed to parse WebSocket message', e);
        }
      };

      this.ws.onclose = () => {
        this.setStatus('DISCONNECTED');
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.setStatus('DISCONNECTED');
      };
    } catch (e) {
      this.setStatus('DISCONNECTED');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connect();
      }, 3000);
    }
  }

  private setStatus(newStatus: WebSocketStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((listener) => listener(newStatus));
  }

  public subscribe(handler: EventHandler): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  public subscribeStatus(listener: (status: WebSocketStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  public disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
  }
}

export const wsService = new WebSocketService();
