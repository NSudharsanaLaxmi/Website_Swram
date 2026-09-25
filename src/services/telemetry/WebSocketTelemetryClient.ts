import { ITelemetryClient, SwarmStateListener, LogListener, ConnectionListener } from './TelemetryAdapter';
import { SwarmState, CommandAck, LogPacket } from '../../types';

export class WebSocketTelemetryClient implements ITelemetryClient {
  private ws: WebSocket | null = null;
  private url: string;
  private connected: boolean = false;
  private autoReconnect: boolean = true;
  private reconnectTimer: any = null;

  private stateListeners: Set<SwarmStateListener> = new Set();
  private logListeners: Set<LogListener> = new Set();
  private connListeners: Set<ConnectionListener> = new Set();
  private lastPacketTimestamp: number = 0;
  private pendingCommands: Map<string, (ack: CommandAck) => void> = new Map();

  constructor(url: string = 'ws://localhost:8080/ws') {
    this.url = url;
  }

  connect(url?: string): void {
    if (url) this.url = url;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.autoReconnect = true;
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.connected = true;
        this.lastPacketTimestamp = Date.now();
        this.notifyConnection(true, 0);
        
        const log: LogPacket = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          source: 'TELEMETRY_BRIDGE',
          direction: 'WEBSOCKET',
          content: `[WS CONNECTED] Real-Time Telemetry Link established -> ${this.url}`,
          level: 'SUCCESS',
        };
        this.notifyLog(log);
      };

      this.ws.onmessage = (event) => {
        this.lastPacketTimestamp = Date.now();
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'swarm_state' && message.payload) {
            this.notifyState(message.payload);
            this.notifyConnection(true, 0);
          } else if (message.type === 'command_ack' && message.payload) {
            const ack: CommandAck = message.payload;
            if (this.pendingCommands.has(ack.commandId)) {
              this.pendingCommands.get(ack.commandId)!(ack);
              this.pendingCommands.delete(ack.commandId);
            }
          } else if (message.type === 'log' && message.payload) {
            this.notifyLog(message.payload);
          }
        } catch (err) {
          console.warn('[WS Telemetry] JSON parse error:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[WS Telemetry] Error:', err);
        this.notifyConnection(false, this.getPacketAgeMs());
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.notifyConnection(false, this.getPacketAgeMs());
        
        const log: LogPacket = {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          source: 'TELEMETRY_BRIDGE',
          direction: 'WEBSOCKET',
          content: `[WS DISCONNECTED] Connection lost to ${this.url}. Retrying...`,
          level: 'WARN',
        };
        this.notifyLog(log);

        if (this.autoReconnect) {
          this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        }
      };
    } catch (e) {
      this.connected = false;
      this.notifyConnection(false, 9999);
      if (this.autoReconnect) {
        this.reconnectTimer = setTimeout(() => this.connect(), 5000);
      }
    }
  }

  disconnect(): void {
    this.autoReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.notifyConnection(false, 9999);
  }

  isConnected(): boolean {
    return this.connected;
  }

  getPacketAgeMs(): number {
    if (this.lastPacketTimestamp === 0) return 99999;
    return Date.now() - this.lastPacketTimestamp;
  }

  onStateUpdate(callback: SwarmStateListener): () => void {
    this.stateListeners.add(callback);
    return () => this.stateListeners.delete(callback);
  }

  onLogReceived(callback: LogListener): () => void {
    this.logListeners.add(callback);
    return () => this.logListeners.delete(callback);
  }

  onConnectionChange(callback: ConnectionListener): () => void {
    this.connListeners.add(callback);
    return () => this.connListeners.delete(callback);
  }

  async sendCommand(commandName: string, targetRobotId: string, payload?: any): Promise<CommandAck> {
    const commandId = `cmd-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return {
        commandId,
        commandName,
        targetRobotId,
        state: 'FAILED',
        timestamp: Date.now(),
        message: 'Backend Disconnected: WebSocket is not open',
      };
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (this.pendingCommands.has(commandId)) {
          this.pendingCommands.delete(commandId);
          resolve({
            commandId,
            commandName,
            targetRobotId,
            state: 'TIMEOUT',
            timestamp: Date.now(),
            message: 'Command response timed out after 3000ms',
          });
        }
      }, 3000);

      this.pendingCommands.set(commandId, (ack) => {
        clearTimeout(timeout);
        resolve(ack);
      });

      const message = {
        type: 'send_command',
        commandId,
        commandName,
        targetRobotId,
        payload: payload || {},
        timestamp: Date.now(),
      };

      this.ws!.send(JSON.stringify(message));
    });
  }

  async emergencyHalt(): Promise<CommandAck> {
    return this.sendCommand('EMERGENCY_STOP', 'ALL_ROBOTS');
  }

  private notifyState(state: Partial<SwarmState>) {
    this.stateListeners.forEach((l) => l(state));
  }

  private notifyLog(log: LogPacket) {
    this.logListeners.forEach((l) => l(log));
  }

  private notifyConnection(connected: boolean, ageMs: number) {
    this.connListeners.forEach((l) => l(connected, ageMs));
  }
}
