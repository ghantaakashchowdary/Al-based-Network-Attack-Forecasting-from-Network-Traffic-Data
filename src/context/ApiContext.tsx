import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { HealthResponse, PredictionResponse, PredictSequenceRequest, PredictRawFlowsRequest, MessageAnalyzeRequest, MessageAnalyzeResponse, SecurityAnalyzeResponse, SecurityEvent } from "../types/api";
import { getHealth, predictSequence, predictRawFlows, analyzeMessage, analyzeSecurity, getSecurityEvents, API_BASE_URL } from "../services/apiClient";

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
  analyzeMessageThreat: (payload: MessageAnalyzeRequest) => Promise<MessageAnalyzeResponse>;
  runSecurityAnalysis: (payload: MessageAnalyzeRequest) => Promise<SecurityAnalyzeResponse>;
  securityEvents: SecurityEvent[];
  refreshSecurityEvents: () => Promise<void>;
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
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);

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

  const refreshSecurityEvents = useCallback(async () => {
    try {
      const data = await getSecurityEvents(50);
      setSecurityEvents(data.events);
    } catch {
      // Keep the last known event timeline if the audit endpoint is temporarily unavailable.
    }
  }, []);

  const analyzeMessageThreat = async (payload: MessageAnalyzeRequest): Promise<MessageAnalyzeResponse> => {
    return analyzeMessage(payload);
  };

  const runSecurityAnalysis = async (payload: MessageAnalyzeRequest): Promise<SecurityAnalyzeResponse> => {
    const result = await analyzeSecurity(payload);
    await refreshSecurityEvents();
    return result;
  };

  // Poll health every 15 seconds and security events every 3 seconds.
  // Mobile SMS events are written by the existing backend audit endpoint,
  // so this keeps the dashboard synchronized with the phone without changing
  // the backend or requiring a manual refresh.
  useEffect(() => {
    refreshHealth();
    refreshSecurityEvents();

    const healthInterval = setInterval(() => {
      refreshHealth();
    }, 15000);

    const securityInterval = setInterval(() => {
      refreshSecurityEvents();
    }, 3000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(securityInterval);
    };
  }, [refreshHealth, refreshSecurityEvents]);

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
        analyzeMessageThreat,
        runSecurityAnalysis,
        securityEvents,
        refreshSecurityEvents,
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
