import { ITelemetryClient, SwarmStateListener, LogListener, ConnectionListener } from './TelemetryAdapter';
import { SwarmState, CommandAck, LogPacket } from '../../types';

export class MockTelemetryClient implements ITelemetryClient {
  private connected: boolean = false;
  private timer: any = null;
  private stateListeners: Set<SwarmStateListener> = new Set();
  private logListeners: Set<LogListener> = new Set();
  private connListeners: Set<ConnectionListener> = new Set();
  private lastPacketTimestamp: number = Date.now();
  private step: number = 0;

  // Deterministic 3-Rack Waypoint Tracks through Central Maneuvering Zone
  // Robot 1: Start 1 -> Central Maneuvering Zone -> Rack 1 Approach -> Rack 1 Pickup -> Rack 1 Exit -> Central -> Delivery
  private bot0Path = [
    { x: 20.0, y: 102.0, ang: -90.0, state: 'IDLE' },
    { x: 25.0, y: 80.0, ang: -80.0, state: 'NAV_TO_PICK' },
    { x: 35.0, y: 55.0, ang: -75.0, state: 'NAV_TO_PICK' }, // Central Maneuvering Zone
    { x: 35.0, y: 45.0, ang: 90.0, state: 'NAV_TO_PICK' },  // Rack 1 Approach Pose
    { x: 35.0, y: 32.0, ang: 90.0, state: 'RACK_VERIFY' },  // Rack 1 Pickup Pose
    { x: 35.0, y: 32.0, ang: 90.0, state: 'PRECISION_DOCK' },
    { x: 35.0, y: 55.0, ang: 90.0, state: 'NAV_TO_DROP' },  // Rack 1 Exit Pose
    { x: 50.0, y: 60.0, ang: 60.0, state: 'NAV_TO_DROP' },  // Central Maneuvering Zone
    { x: 60.0, y: 88.0, ang: -90.0, state: 'NAV_TO_DROP' }, // Delivery Approach Pose
    { x: 60.0, y: 98.0, ang: -90.0, state: 'RELEASE_PAYLOAD' }, // Delivery Drop Pose
    { x: 60.0, y: 85.0, ang: -90.0, state: 'NAV_TO_PICK' }, // Delivery Exit Pose
    { x: 40.0, y: 65.0, ang: -120.0, state: 'IDLE' },
  ];

  // Robot 2: Start 2 -> Central Maneuvering Zone -> Rack 2 Approach -> Rack 2 Pickup -> Rack 2 Exit -> Central -> Delivery
  private bot1Path = [
    { x: 100.0, y: 102.0, ang: -90.0, state: 'IDLE' },
    { x: 95.0, y: 80.0, ang: -100.0, state: 'NAV_TO_PICK' },
    { x: 85.0, y: 55.0, ang: -105.0, state: 'NAV_TO_PICK' }, // Central Maneuvering Zone
    { x: 85.0, y: 45.0, ang: 90.0, state: 'NAV_TO_PICK' },  // Rack 2 Approach Pose
    { x: 85.0, y: 32.0, ang: 90.0, state: 'RACK_VERIFY' },  // Rack 2 Pickup Pose
    { x: 85.0, y: 32.0, ang: 90.0, state: 'PRECISION_DOCK' },
    { x: 85.0, y: 55.0, ang: 90.0, state: 'NAV_TO_DROP' },  // Rack 2 Exit Pose
    { x: 70.0, y: 60.0, ang: 120.0, state: 'NAV_TO_DROP' }, // Central Maneuvering Zone
    { x: 60.0, y: 88.0, ang: -90.0, state: 'NAV_TO_DROP' }, // Delivery Approach Pose
    { x: 60.0, y: 98.0, ang: -90.0, state: 'RELEASE_PAYLOAD' }, // Delivery Drop Pose
    { x: 60.0, y: 85.0, ang: -90.0, state: 'NAV_TO_PICK' }, // Delivery Exit Pose
    { x: 80.0, y: 65.0, ang: -60.0, state: 'IDLE' },
  ];

  connect(): void {
    if (this.connected) return;
    this.connected = true;
    this.lastPacketTimestamp = Date.now();
    this.notifyConnection(true, 0);

    // 5 Hz deterministic waypoint iteration
    this.timer = setInterval(() => {
      this.lastPacketTimestamp = Date.now();
      this.step = (this.step + 1) % this.bot0Path.length;

      const p0 = this.bot0Path[this.step];
      const p1 = this.bot1Path[(this.step + 3) % this.bot1Path.length];

      // Distance check for auto-yield simulation
      const dist = Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2));
      const yielding = dist < 28.0;

      const mockIncoming: any = {
        timestamp: Date.now() / 1000,
        calibrated: true,
        bots: {
          id0: {
            x: p0.x,
            y: p0.y,
            ang: p0.ang,
            out_of_bounds: false,
          },
          id1: {
            x: yielding ? p1.x : p1.x,
            y: yielding ? p1.y : p1.y,
            ang: p1.ang,
            out_of_bounds: false,
          },
        },
      };

      this.stateListeners.forEach((l) => l(mockIncoming));
      this.notifyConnection(true, 0);
    }, 1200);
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
      message: `[SIMULATION MODE] Command '${commandName}' dispatched to ${targetRobotId}`,
    };

    const log: LogPacket = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      source: 'SWARM_COORDINATOR',
      direction: 'TX',
      content: `[SIMULATION DISPATCH] ${commandName} -> ${targetRobotId} (Rack Corridor Validated)`,
      level: 'INFO',
    };
    this.logListeners.forEach((l) => l(log));

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
