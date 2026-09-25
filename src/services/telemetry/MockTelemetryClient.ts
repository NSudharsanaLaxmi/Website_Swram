import { ITelemetryClient, SwarmStateListener, LogListener, ConnectionListener } from './TelemetryAdapter';
import { SwarmState, CommandAck, LogPacket } from '../../types';

export class MockTelemetryClient implements ITelemetryClient {
  private connected: boolean = false;
  private timer: any = null;
  private stateListeners: Set<SwarmStateListener> = new Set();
  private logListeners: Set<LogListener> = new Set();
  private connListeners: Set<ConnectionListener> = new Set();
  private lastPacketTimestamp: number = Date.now();

  connect(): void {
    if (this.connected) return;
    this.connected = true;
    this.lastPacketTimestamp = Date.now();
    this.notifyConnection(true, 0);

    // Start 10 Hz simulation update loop
    this.timer = setInterval(() => {
      this.lastPacketTimestamp = Date.now();
      this.notifyConnection(true, 0);
    }, 100);
  }

  disconnect(): void {
    if (!this.connected) return;
    this.connected = false;
    if (this.timer) clearInterval(this.timer);
    this.notifyConnection(false, 9999);
  }

  isConnected(): boolean {
    return this.connected;
  }

  getPacketAgeMs(): number {
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
    const ack: CommandAck = {
      commandId: `cmd-${Date.now()}`,
      commandName,
      targetRobotId,
      state: 'ACKNOWLEDGED',
      timestamp: Date.now(),
      ackTimestamp: Date.now() + 50,
      message: `[DEMO MODE] Command '${commandName}' acknowledged for ${targetRobotId}`,
    };

    const log: LogPacket = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'SWARM_COORDINATOR',
      direction: 'TX',
      content: `[COMMAND DISPATCH] ${commandName} -> ${targetRobotId} (Demo Mock Ack)`,
      level: 'INFO',
    };
    this.logListeners.forEach((l) => l(log));

    // Simulate completion
    setTimeout(() => {
      ack.state = 'COMPLETED';
      ack.completedTimestamp = Date.now();
    }, 500);

    return ack;
  }

  async emergencyHalt(): Promise<CommandAck> {
    return this.sendCommand('EMERGENCY_STOP', 'ALL_ROBOTS');
  }

  private notifyConnection(connected: boolean, ageMs: number) {
    this.connListeners.forEach((l) => l(connected, ageMs));
  }
}
