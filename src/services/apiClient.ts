import { HealthResponse, PredictionResponse, PredictSequenceRequest, PredictRawFlowsRequest } from "../types/api";

// Base API URL configured from environment variable
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://metal-months-fold.loca.lt").replace(/\/$/, "");

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
