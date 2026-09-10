// TypeScript interfaces matching the real FastAPI backend API contracts

export interface HealthArtifacts {
  "model.pt": boolean;
  "preprocessor.joblib": boolean;
  "feature_schema.json": boolean;
  "label_mapping.json": boolean;
  "model_config.json": boolean;
}

export interface HealthResponse {
  status: "healthy" | "unhealthy" | string;
  service: string;
  artifacts_ready: boolean;
  artifacts: HealthArtifacts;
  model_version: string;
  feature_count: number;
  sequence_length: number;
  forecast_horizon: number;
  ganesh_pipeline_available: boolean;
  message_model_ready: boolean;
  message_model_version: string;
  policy_version: string;
}

export interface PredictedState {
  total_packets: number;
  total_bytes: number;
  duration: number;
  syn_flag_count: number;
  ack_flag_count: number;
  fin_flag_count: number;
  rst_flag_count: number;
  psh_flag_count: number;
  ttl: number;
  tcp_window_size: number;
  fragmented: number;
  retransmission_count: number;
  flow_bytes_per_sec: number;
  flow_packets_per_sec: number;
  avg_packet_size: number;
  flow_count: number;
  unique_src_ips: number;
  unique_dst_ips: number;
  unique_dst_ports: number;
  tcp_count: number;
  udp_count: number;
}

export interface FuturePrediction {
  step: number;
  time_window: string;
  attack_probability: number;
  predicted_stage: string;
  stage_confidence: number;
  predicted_state: PredictedState;
}

export interface PredictionResponse {
  model_version: string;
  feature_schema_version: string;
  attack_probability: number;
  predicted_stage: string;
  forecast_horizon: number;
  future_predictions: FuturePrediction[];
  ingestion_metadata?: {
    total_raw_flows?: number;
    generated_windows?: number;
    window_seconds?: number;
    processing_time_ms?: number;
  };
}

export interface PredictSequenceRequest {
  sequence: number[][] | Record<string, number>[];
  timestamps?: string[];
}

export interface PredictRawFlowsRequest {
  flows: Record<string, any>[];
  window_seconds?: number;
}

export interface RawFlowRecord {
  timestamp: string;
  src_ip: string;
  dst_ip: string;
  protocol: string;
  src_port?: number;
  dst_port?: number;
  duration?: number;
  total_fwd_packets?: number;
  total_bwd_packets?: number;
  total_fwd_bytes?: number;
  total_bwd_bytes?: number;
  syn_flag_count?: number;
  ack_flag_count?: number;
  fin_flag_count?: number;
  rst_flag_count?: number;
  psh_flag_count?: number;
  urg_flag_count?: number;
  ttl?: number;
  tcp_window_size?: number;
  fragmented?: number;
  retransmission_count?: number;
  [key: string]: any;
}

export type ThreatCategory = "SAFE" | "SPAM" | "PHISHING" | "SCAM" | "MALICIOUS";
export type PolicySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type PolicyAction = "ALLOW" | "WARN" | "QUARANTINE" | "BLOCK";

export interface MessageAnalyzeRequest {
  text: string;
  url?: string;
  sender?: string;
  network_risk?: number;
}

export interface MessageAnalyzeResponse {
  threat_probability: number;
  category: ThreatCategory;
  confidence: number;
  class_probabilities: Record<string, number>;
  evidence: string[];
  url_analysis: {
    present: boolean;
    host?: string;
    risk_score: number;
    signals: string[];
  };
  model_version: string;
}

export interface SecurityDecision {
  severity: PolicySeverity;
  action: PolicyAction;
  reason: string;
  network_risk?: number | null;
  message_risk: number;
  composite_risk: number;
  policy_version: string;
  audit_id: string;
}

export interface SecurityAnalyzeResponse {
  message: MessageAnalyzeResponse;
  decision: SecurityDecision;
  event_id: string;
}

export interface SecurityEvent {
  event_id: string;
  timestamp: string;
  type: string;
  category: ThreatCategory;
  action: PolicyAction;
  severity: PolicySeverity;
  scores: {
    message?: number;
    network?: number | null;
    composite?: number;
  };
  evidence?: string[];
  reason: string;
  model_versions?: Record<string, string>;
  sender?: string | null;
}

export interface SecurityEventsResponse {
  events: SecurityEvent[];
}

\nexport interface MobileDevice {
  device_id: string;
  name: string;
  model: string;
  os_version: string;
  status: "ONLINE" | "OFFLINE" | string;
  registered_at?: string | null;
  last_seen: string;
}
