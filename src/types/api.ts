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
