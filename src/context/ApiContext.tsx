import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { HealthResponse, PredictionResponse, PredictSequenceRequest, PredictRawFlowsRequest } from "../types/api";
import { getHealth, predictSequence, predictRawFlows, API_BASE_URL, ApiError } from "../services/apiClient";

export interface PredictionHistoryItem {
  id: string;
  timestamp: string;
  inputType: "pre-windowed" | "raw-flows";
  result: PredictionResponse;
}

export interface UploadedTrafficData {
  fileName: string;
  fileSize: number;
  rawRows: any[];
  normalizedRows: any[];
  columnsFound: string[];
  mappedColumns: Record<string, string>;
  timestampRange: { start: string; end: string } | null;
}

interface ApiContextType {
  apiBaseUrl: string;
  health: HealthResponse | null;
  isBackendOnline: boolean;
  healthError: string | null;
  lastHealthCheck: Date | null;
  isHealthLoading: boolean;

  latestPrediction: PredictionResponse | null;
  lastPredictionTime: Date | null;
  lastPredictionType: "pre-windowed" | "raw-flows" | null;
  predictionHistory: PredictionHistoryItem[];
  isPredicting: boolean;
  loadingMessage: string;
  predictionError: string | null;

  uploadedTraffic: UploadedTrafficData | null;
  setUploadedTraffic: (data: UploadedTrafficData | null) => void;

  refreshHealth: () => Promise<void>;
  runSequencePrediction: (payload: PredictSequenceRequest) => Promise<PredictionResponse>;
  runRawFlowsPrediction: (payload: PredictRawFlowsRequest) => Promise<PredictionResponse>;
  clearPredictionError: () => void;
  clearPrediction: () => void;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState<boolean>(false);

  const [latestPrediction, setLatestPrediction] = useState<PredictionResponse | null>(null);
  const [lastPredictionTime, setLastPredictionTime] = useState<Date | null>(null);
  const [lastPredictionType, setLastPredictionType] = useState<"pre-windowed" | "raw-flows" | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistoryItem[]>([]);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const [uploadedTraffic, setUploadedTraffic] = useState<UploadedTrafficData | null>(null);

  const refreshHealth = useCallback(async () => {
    setIsHealthLoading(true);
    try {
      const data = await getHealth(6000);
      setHealth(data);
      setIsBackendOnline(data.status === "healthy");
      setHealthError(null);
      setLastHealthCheck(new Date());
    } catch (err: any) {
      setHealth(null);
      setIsBackendOnline(false);
      setHealthError(err.message || "Backend unavailable");
      setLastHealthCheck(new Date());
    } finally {
      setIsHealthLoading(false);
    }
  }, []);

  // Poll health on mount and periodically every 15 seconds
  useEffect(() => {
    refreshHealth();
    const interval = setInterval(() => {
      refreshHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, [refreshHealth]);

  const runSequencePrediction = async (payload: PredictSequenceRequest): Promise<PredictionResponse> => {
    setIsPredicting(true);
    setPredictionError(null);
    setLoadingMessage("Madhav LSTM generating forecast...");

    try {
      const result = await predictSequence(payload);
      setLatestPrediction(result);
      setLastPredictionTime(new Date());
      setLastPredictionType("pre-windowed");

      const historyItem: PredictionHistoryItem = {
        id: `pred-${Date.now()}`,
        timestamp: new Date().toISOString(),
        inputType: "pre-windowed",
        result,
      };
      setPredictionHistory((prev) => [historyItem, ...prev.slice(0, 19)]);
      return result;
    } catch (err: any) {
      setPredictionError(err.message || "Failed to generate prediction");
      throw err;
    } finally {
      setIsPredicting(false);
      setLoadingMessage("");
    }
  };

  const runRawFlowsPrediction = async (payload: PredictRawFlowsRequest): Promise<PredictionResponse> => {
    setIsPredicting(true);
    setPredictionError(null);
    setLoadingMessage("Ganesh Ingestion Pipeline cleaning and aggregating raw network flows...");

    try {
      // Simulate sub-stage message update for user visibility
      const subTimer = setTimeout(() => {
        setLoadingMessage("Madhav LSTM generating multi-stage attack forecast...");
      }, 1200);

      const result = await predictRawFlows(payload);
      clearTimeout(subTimer);

      setLatestPrediction(result);
      setLastPredictionTime(new Date());
      setLastPredictionType("raw-flows");

      const historyItem: PredictionHistoryItem = {
        id: `pred-${Date.now()}`,
        timestamp: new Date().toISOString(),
        inputType: "raw-flows",
        result,
      };
      setPredictionHistory((prev) => [historyItem, ...prev.slice(0, 19)]);
      return result;
    } catch (err: any) {
      setPredictionError(err.message || "Failed to process raw flows");
      throw err;
    } finally {
      setIsPredicting(false);
      setLoadingMessage("");
    }
  };

  const clearPredictionError = () => setPredictionError(null);
  const clearPrediction = () => {
    setLatestPrediction(null);
    setLastPredictionTime(null);
    setLastPredictionType(null);
    setPredictionError(null);
  };

  return (
    <ApiContext.Provider
      value={{
        apiBaseUrl: API_BASE_URL,
        health,
        isBackendOnline,
        healthError,
        lastHealthCheck,
        isHealthLoading,
        latestPrediction,
        lastPredictionTime,
        lastPredictionType,
        predictionHistory,
        isPredicting,
        loadingMessage,
        predictionError,
        uploadedTraffic,
        setUploadedTraffic,
        refreshHealth,
        runSequencePrediction,
        runRawFlowsPrediction,
        clearPredictionError,
        clearPrediction,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context;
};
