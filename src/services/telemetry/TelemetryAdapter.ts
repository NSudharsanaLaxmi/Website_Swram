import { SwarmState, LogPacket, CommandAck } from '../../types';

export type SwarmStateListener = (state: Partial<SwarmState>) => void;
export type LogListener = (log: LogPacket) => void;
export type ConnectionListener = (connected: boolean, packetAgeMs: number) => void;

export interface ITelemetryClient {
  connect(url?: string): void;
  disconnect(): void;
  isConnected(): boolean;
  getPacketAgeMs(): number;
  onStateUpdate(callback: SwarmStateListener): () => void;
  onLogReceived(callback: LogListener): () => void;
  onConnectionChange(callback: ConnectionListener): () => void;
  sendCommand(commandName: string, targetRobotId: string, payload?: any): Promise<CommandAck>;
  emergencyHalt(): Promise<CommandAck>;
}
