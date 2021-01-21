export interface Imessage {
  yours?: boolean,
  value?: string,
}
export interface Iconfiguration {
  iceServers: RTCIceServer[],
  iceCandidatePoolSize?: number,
}
