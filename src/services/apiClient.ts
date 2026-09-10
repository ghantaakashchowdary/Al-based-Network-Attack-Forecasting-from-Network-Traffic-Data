import {
  HealthResponse, PredictionResponse, PredictSequenceRequest, PredictRawFlowsRequest,
  MessageAnalyzeRequest, MessageAnalyzeResponse, SecurityAnalyzeResponse, SecurityEventsResponse, MobileDevice,
} from "../types/api";

// Base API URL configured from environment variable
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

const COMMON_HEADERS: HeadersInit = {
  "Content-Type": "application/json",
  "bypass-tunnel-reminder": "true",
};

export class ApiError extends Error {
  public status?: number;
  public details?: any;

  constructor(message: string, status?: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Fetch health status from the Python AI backend
 */
export async function getHealth(timeoutMs = 8000): Promise<HealthResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: COMMON_HEADERS,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new ApiError(`Health probe failed with HTTP ${response.status}: ${errorText}`, response.status);
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new ApiError("Health check timed out. Backend is not responding.", 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || "Failed to connect to backend", undefined, err);
  }
}

/**
 * Send pre-windowed 5-window x 21-feature sequence to /predict
 */
export async function predictSequence(
  payload: PredictSequenceRequest,
  timeoutMs = 15000
): Promise<PredictionResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: COMMON_HEADERS,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorJson: any = null;
      try {
        errorJson = await response.json();
      } catch {
        const text = await response.text();
        throw new ApiError(`Prediction failed with HTTP ${response.status}: ${text}`, response.status);
      }

      const msg = errorJson?.detail?.message || errorJson?.detail || `Prediction error (${response.status})`;
      throw new ApiError(typeof msg === "string" ? msg : JSON.stringify(msg), response.status, errorJson);
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new ApiError("Prediction request timed out after 15 seconds.", 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || "Network error connecting to backend", undefined, err);
  }
}

/**
 * Send raw network flow records to /predict/raw-flows (Ganesh Pipeline -> Madhav LSTM)
 */
export async function predictRawFlows(
  payload: PredictRawFlowsRequest,
  timeoutMs = 30000
): Promise<PredictionResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}/predict/raw-flows`, {
      method: "POST",
      headers: COMMON_HEADERS,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorJson: any = null;
      try {
        errorJson = await response.json();
      } catch {
        const text = await response.text();
        throw new ApiError(`Raw flow prediction failed with HTTP ${response.status}: ${text}`, response.status);
      }

      const msg = errorJson?.detail?.message || errorJson?.detail || `Raw flow prediction error (${response.status})`;
      throw new ApiError(typeof msg === "string" ? msg : JSON.stringify(msg), response.status, errorJson);
    }

    return await response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new ApiError("Raw flow pipeline processing timed out after 30 seconds.", 408);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || "Network error during raw flow processing", undefined, err);
  }
}


export async function analyzeMessage(payload: MessageAnalyzeRequest, timeoutMs = 15000): Promise<MessageAnalyzeResponse> {
  return requestJson<MessageAnalyzeResponse>("/message/analyze", payload, timeoutMs);
}

export async function analyzeSecurity(payload: MessageAnalyzeRequest, timeoutMs = 20000): Promise<SecurityAnalyzeResponse> {
  return requestJson<SecurityAnalyzeResponse>("/security/analyze", payload, timeoutMs);
}

export async function getSecurityEvents(limit = 50): Promise<SecurityEventsResponse> {
  const response = await fetch(`${API_BASE_URL}/security/events?limit=${limit}`, { headers: COMMON_HEADERS });
  if (!response.ok) throw new ApiError(`Failed to load security events (${response.status})`, response.status);
  return response.json();
}

async function requestJson<T>(path: string, payload: unknown, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: COMMON_HEADERS,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      let body: any = null;
      try { body = await response.json(); } catch { /* ignore */ }
      throw new ApiError(body?.detail || `Request failed (${response.status})`, response.status, body);
    }
    return await response.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    if (err?.name === "AbortError") throw new ApiError(`Request timed out after ${timeoutMs} ms`, 408);
    throw new ApiError(err?.message || "Network error", undefined, err);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getMobileDevices(): Promise<MobileDevice[]> {
  const response = await fetch(`${API_BASE_URL}/mobile/devices`, { headers: COMMON_HEADERS });
  if (!response.ok) throw new ApiError(`Failed to load mobile devices (${response.status})`, response.status);
  return response.json();
}

export async function registerMobileDevice(payload: {
  device_id?: string;
  name: string;
  model?: string;
  os_version?: string;
}): Promise<MobileDevice> {
  return requestJson<MobileDevice>("/mobile/devices/register", payload, 10000);
}

export async function mobileHeartbeat(device_id: string): Promise<MobileDevice> {
  return requestJson<MobileDevice>("/mobile/devices/heartbeat", { device_id }, 10000);
}
