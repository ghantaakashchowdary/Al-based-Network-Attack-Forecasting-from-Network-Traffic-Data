from __future__ import annotations

import json
import logging
import math
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from src.forecasting.inference import Forecaster
from message_ai.inference import MessageThreatModel
from security.policy import decide as policy_decide
from security.audit import record_event, list_events
from security.mobile import register_device, heartbeat, list_devices

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger("module3.api")

ROOT = Path(__file__).resolve().parent
DEFAULT_ARTIFACTS_DIR = ROOT / "artifacts"
DEFAULT_MESSAGE_MODEL = ROOT / "message_ai" / "artifacts" / "message_model.joblib"


class ModelManager:
    """Manages lazy or startup loading and health checking for Forecaster."""

    def __init__(self, artifact_dir: Path = DEFAULT_ARTIFACTS_DIR):
        self.artifact_dir = artifact_dir
        self.forecaster: Optional[Forecaster] = None
        self.feature_columns: List[str] = []
        self.sequence_length: int = 5
        self.forecast_horizon: int = 2
        self.model_version: str = "unknown"
        self.feature_schema_version: str = "unknown"
        self.load_metadata()

    def load_metadata(self) -> None:
        """Load feature schema and model configuration metadata."""
        schema_path = self.artifact_dir / "feature_schema.json"
        if schema_path.exists():
            try:
                with open(schema_path, "r", encoding="utf-8") as f:
                    schema = json.load(f)
                self.feature_columns = schema.get("feature_columns", [])
            except Exception as e:
                logger.warning("Could not read feature_schema.json: %s", e)

        config_path = self.artifact_dir / "model_config.json"
        if config_path.exists():
            try:
                with open(config_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                self.sequence_length = cfg.get("sequence_length", 5)
                self.forecast_horizon = cfg.get("forecast_horizon", 2)
                self.model_version = cfg.get("model_version", "1.0.0")
                self.feature_schema_version = cfg.get("feature_schema_version", "1.0.0")
            except Exception as e:
                logger.warning("Could not read model_config.json: %s", e)

    def check_artifacts(self) -> Dict[str, bool]:
        """Check presence of required artifact files."""
        required = [
            "model.pt",
            "preprocessor.joblib",
            "feature_schema.json",
            "label_mapping.json",
            "model_config.json",
        ]
        return {name: (self.artifact_dir / name).exists() for name in required}

    def is_healthy(self) -> bool:
        """Return True if all required artifacts are present and Forecaster can be loaded."""
        artifacts = self.check_artifacts()
        if not all(artifacts.values()):
            return False
        try:
            if self.forecaster is None:
                self.load_forecaster()
            return self.forecaster is not None
        except Exception as e:
            logger.error("Health check model load failed: %s", e)
            return False

    def load_forecaster(self) -> Forecaster:
        """Load and cache the Forecaster instance once."""
        if self.forecaster is None:
            logger.info("Loading Forecaster from %s", self.artifact_dir)
            self.forecaster = Forecaster(self.artifact_dir)
            self.feature_columns = self.forecaster.feature_columns
            self.sequence_length = self.forecaster.config.get("sequence_length", 5)
            self.forecast_horizon = self.forecaster.config.get("forecast_horizon", 2)
            self.model_version = self.forecaster.config.get("model_version", "1.0.0")
            self.feature_schema_version = self.forecaster.config.get("feature_schema_version", "1.0.0")
            logger.info(
                "Forecaster loaded successfully (version=%s, features=%d, sequence_len=%d)",
                self.model_version,
                len(self.feature_columns),
                self.sequence_length,
            )
        return self.forecaster


model_manager = ModelManager()


class MessageModelManager:
    def __init__(self, artifact_path: Path = DEFAULT_MESSAGE_MODEL):
        self.artifact_path = artifact_path
        self.model: Optional[MessageThreatModel] = None
        self.model_version = "unknown"

    def ready(self) -> bool:
        return self.artifact_path.exists()

    def load(self) -> MessageThreatModel:
        if self.model is None:
            if not self.ready():
                raise FileNotFoundError(f"Message model artifact not found: {self.artifact_path}")
            self.model = MessageThreatModel(self.artifact_path)
            self.model_version = self.model.model_version
        return self.model


message_model_manager = MessageModelManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model once at application startup if artifacts exist."""
    try:
        if all(model_manager.check_artifacts().values()):
            model_manager.load_forecaster()
            logger.info("AI service startup complete with loaded model.")
        else:
            logger.warning("Artifacts missing at startup. Model will load on demand when available.")
    except Exception as e:
        logger.error("Failed to initialize model at startup: %s", e)
    yield


app = FastAPI(
    title="Module 3 AI Attack Forecasting API",
    description="SentinelAI API: existing SIH26153 network forecasting plus message threat detection, context fusion, policy and audit services.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PYDANTIC SCHEMAS
# ============================================================

class PredictRequest(BaseModel):
    sequence: List[Union[List[Union[float, int]], Dict[str, Union[float, int]]]] = Field(
        ...,
        description="5 history windows containing 21 features each (either 2D array or list of feature dicts)",
    )
    timestamps: Optional[List[str]] = Field(
        None,
        description="Optional list of 5 ISO-8601 timestamps for the history windows",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "sequence": [
                    [100.0, 5000.0, 5.0, 10.0, 12.0, 0.0, 0.0, 5.0, 64.0, 65535.0, 0.0, 0.0, 1000.0, 20.0, 50.0, 15.0, 3.0, 4.0, 2.0, 15.0, 0.0],
                    [110.0, 5200.0, 5.0, 12.0, 14.0, 0.0, 0.0, 6.0, 64.0, 65535.0, 0.0, 0.0, 1040.0, 22.0, 47.0, 16.0, 3.0, 4.0, 2.0, 16.0, 0.0],
                    [120.0, 5400.0, 5.0, 15.0, 16.0, 0.0, 0.0, 7.0, 64.0, 65535.0, 0.0, 0.0, 1080.0, 24.0, 45.0, 17.0, 4.0, 5.0, 3.0, 17.0, 0.0],
                    [130.0, 5600.0, 5.0, 18.0, 18.0, 0.0, 0.0, 8.0, 64.0, 65535.0, 0.0, 0.0, 1120.0, 26.0, 43.0, 18.0, 4.0, 5.0, 3.0, 18.0, 0.0],
                    [140.0, 5800.0, 5.0, 20.0, 20.0, 0.0, 0.0, 9.0, 64.0, 65535.0, 0.0, 0.0, 1160.0, 28.0, 41.0, 19.0, 5.0, 6.0, 4.0, 19.0, 0.0],
                ],
                "timestamps": [
                    "2026-08-27T09:00:00",
                    "2026-08-27T09:00:05",
                    "2026-08-27T09:00:10",
                    "2026-08-27T09:00:15",
                    "2026-08-27T09:00:20",
                ],
            }
        }
    }


class FuturePrediction(BaseModel):
    step: int
    time_window: str
    attack_probability: float
    predicted_stage: str
    stage_confidence: float
    predicted_state: Dict[str, float]


class PredictResponse(BaseModel):
    model_version: str
    feature_schema_version: str
    attack_probability: float
    predicted_stage: str
    forecast_horizon: int
    future_predictions: List[FuturePrediction]


class HealthResponse(BaseModel):
    status: str
    service: str
    artifacts_ready: bool
    artifacts: Dict[str, bool]
    model_version: str
    feature_count: int
    sequence_length: int
    forecast_horizon: int
    ganesh_pipeline_available: bool = Field(
        default=True,
        description="Whether Ganesh's network data & feature extraction pipeline is available"
    )
    message_model_ready: bool = Field(default=False)
    message_model_version: str = Field(default="unknown")
    policy_version: str = Field(default="policy-1.0.0")
    mobile_gateway_ready: bool = Field(default=True, description="Mobile device event gateway is available")
    connected_mobile_devices: int = Field(default=0, description="Number of mobile devices seen online recently")


class RawFlowsRequest(BaseModel):
    flows: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="List of raw network flow records (must cover >= 25 seconds to generate 5 windows)"
    )
    csv_data: Optional[str] = Field(
        None,
        description="Raw CSV text of network flow records"
    )
    window_seconds: Optional[int] = Field(
        5,
        description="Time window duration in seconds (default 5)"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "flows": [
                    {
                        "timestamp": "2026-08-27 09:00:00.100",
                        "src_ip": "192.168.1.5",
                        "dst_ip": "10.0.0.1",
                        "protocol": "TCP",
                        "src_port": 54321,
                        "dst_port": 80,
                        "duration": 0.05,
                        "total_fwd_packets": 5,
                        "total_bwd_packets": 4,
                        "total_fwd_bytes": 450,
                        "total_bwd_bytes": 520,
                        "syn_flag_count": 1,
                        "ack_flag_count": 8,
                        "fin_flag_count": 0,
                        "rst_flag_count": 0,
                        "psh_flag_count": 2,
                        "urg_flag_count": 0,
                        "ttl": 64,
                        "tcp_window_size": 65535,
                        "fragmented": 0,
                        "retransmission_count": 0
                    }
                ]
            }
        }
    }



# ============================================================
# NEXT-LEVEL SECURITY SCHEMAS
# ============================================================

class MessageAnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    url: Optional[str] = Field(None, max_length=4096)
    sender: Optional[str] = Field(None, max_length=320)
    network_risk: Optional[float] = Field(None, ge=0.0, le=1.0)


class MessageAnalyzeResponse(BaseModel):
    threat_probability: float
    category: str
    confidence: float
    class_probabilities: Dict[str, float]
    evidence: List[str]
    url_analysis: Dict[str, Any]
    model_version: str


class SecurityDecisionResponse(BaseModel):
    severity: str
    action: str
    reason: str
    network_risk: Optional[float]
    message_risk: float
    composite_risk: float
    policy_version: str
    audit_id: str


class SecurityAnalyzeResponse(BaseModel):
    message: MessageAnalyzeResponse
    decision: SecurityDecisionResponse
    event_id: str


class AuditEventsResponse(BaseModel):
    events: List[Dict[str, Any]]


class MobileDeviceRegisterRequest(BaseModel):
    device_id: Optional[str] = Field(None, max_length=128)
    name: str = Field(..., min_length=1, max_length=120)
    model: str = Field(default="Android device", max_length=160)
    os_version: str = Field(default="unknown", max_length=80)


class MobileDeviceHeartbeatRequest(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=128)


class MobileMessageEventRequest(MessageAnalyzeRequest):
    device_id: str = Field(..., min_length=1, max_length=128)
    source: str = Field(default="android-sms", max_length=80)


class MobileDeviceResponse(BaseModel):
    device_id: str
    name: str
    model: str
    os_version: str
    status: str
    registered_at: Optional[str] = None
    last_seen: str


# ============================================================
# EXCEPTION HANDLERS
# ============================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        errors.append(f"{loc}: {err.get('msg', 'Invalid value')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "; ".join(errors) if errors else "Invalid request payload format",
            "details": exc.errors(),
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP Error",
            "message": exc.detail,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred during prediction",
        },
    )


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint.
    Verifies service status, artifact presence, model readiness, and Ganesh adapter availability.
    Does NOT execute training.
    """
    from src.integration.ganesh_adapter import is_ganesh_available

    artifacts_status = model_manager.check_artifacts()
    all_ready = all(artifacts_status.values())
    ganesh_ready = is_ganesh_available()
    
    return HealthResponse(
        status="healthy" if all_ready else "degraded",
        service="module3-ai-forecasting",
        artifacts_ready=all_ready,
        artifacts=artifacts_status,
        model_version=model_manager.model_version,
        feature_count=len(model_manager.feature_columns),
        sequence_length=model_manager.sequence_length,
        forecast_horizon=model_manager.forecast_horizon,
        ganesh_pipeline_available=ganesh_ready,
        message_model_ready=message_model_manager.ready(),
        message_model_version=message_model_manager.model_version if message_model_manager.model is not None else ("message-baseline-1.0.0" if message_model_manager.ready() else "unknown"),
        policy_version="policy-1.0.0",
        mobile_gateway_ready=True,
        connected_mobile_devices=sum(1 for d in list_devices() if d.get("status") == "ONLINE"),
    )


@app.post("/predict", response_model=PredictResponse)
def predict(request_data: PredictRequest):
    """
    Run multi-stage attack forecasting inference.
    
    Validates:
    - Exactly 5 history windows
    - Exactly 21 features matching canonical feature schema
    - Numeric validity (no NaN/Inf)
    
    Calls Forecaster.predict() without retraining.
    """
    # 1. Check artifacts readiness
    artifacts_status = model_manager.check_artifacts()
    if not all(artifacts_status.values()):
        missing = [k for k, v in artifacts_status.items() if not v]
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model artifacts not available. Missing: {missing}",
        )

    # 2. Ensure Forecaster is loaded
    try:
        forecaster = model_manager.load_forecaster()
    except Exception as e:
        logger.error("Failed to load Forecaster: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load forecasting model: {str(e)}",
        )

    expected_len = forecaster.config.get("sequence_length", 5)
    feature_cols = forecaster.feature_columns
    expected_num_features = len(feature_cols)

    # 3. Validate history length
    seq = request_data.sequence
    if len(seq) != expected_len:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Expected exactly {expected_len} history windows, received {len(seq)}.",
        )

    # 4. Validate and convert features
    matrix: List[List[float]] = []

    for i, window in enumerate(seq):
        if isinstance(window, list):
            if len(window) != expected_num_features:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=(
                        f"Window {i + 1} has {len(window)} features. "
                        f"Expected exactly {expected_num_features} features in order: {feature_cols}"
                    ),
                )
            row_floats: List[float] = []
            for j, val in enumerate(window):
                if not isinstance(val, (int, float)) or math.isnan(val) or math.isinf(val):
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=f"Window {i + 1}, feature '{feature_cols[j]}' has non-numeric/invalid value: {val}",
                    )
                row_floats.append(float(val))
            matrix.append(row_floats)

        elif isinstance(window, dict):
            missing_keys = [col for col in feature_cols if col not in window]
            if missing_keys:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Window {i + 1} is missing required features: {missing_keys}",
                )
            row_floats: List[float] = []
            for col in feature_cols:
                val = window[col]
                if not isinstance(val, (int, float)) or math.isnan(val) or math.isinf(val):
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=f"Window {i + 1}, feature '{col}' has non-numeric/invalid value: {val}",
                    )
                row_floats.append(float(val))
            matrix.append(row_floats)
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Window {i + 1} must be an array of {expected_num_features} numbers or an object keyed by feature names.",
            )

    # 5. Validate timestamps if provided
    timestamps = request_data.timestamps
    if timestamps is not None:
        if len(timestamps) != expected_len:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Expected {expected_len} timestamps, received {len(timestamps)}.",
            )
        for t in timestamps:
            if not isinstance(t, str) or not t.strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Timestamps must be non-empty strings (e.g. ISO-8601 format).",
                )

    # 6. Convert to DataFrame and call Madhav's existing Forecaster.predict()
    try:
        input_df = pd.DataFrame(matrix, columns=feature_cols)
        prediction_result = forecaster.predict(input_df, timestamps)
        return prediction_result
    except ValueError as ve:
        logger.warning("Forecaster input error: %s", ve)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Prediction validation error: {str(ve)}",
        )
    except Exception as e:
        logger.error("Inference failure: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model inference execution failed.",
        )


@app.post("/predict/raw-flows", response_model=PredictResponse)
def predict_raw_flows(request_data: RawFlowsRequest):
    """
    Run multi-stage attack forecasting starting from RAW network flows.
    
    1. Passes raw flow records into Ganesh's pipeline (cleaning, feature extraction, 5s windowing).
    2. Enforces the 5-window requirement (>= 25 seconds of network activity).
    3. Strips ground-truth label columns.
    4. Passes the resulting 5 windows (21 numerical features) to Madhav's Forecaster.predict().
    5. Returns Module 4 compatible multi-step forecast.
    """
    from src.integration.ganesh_adapter import process_raw_flows_to_sequence, is_ganesh_available

    # 1. Check Ganesh module availability
    if not is_ganesh_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ganesh Network Data Pipeline module is not available on this server.",
        )

    # 2. Check artifacts readiness
    artifacts_status = model_manager.check_artifacts()
    if not all(artifacts_status.values()):
        missing = [k for k, v in artifacts_status.items() if not v]
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Model artifacts not available. Missing: {missing}",
        )

    # 3. Ensure Forecaster is loaded
    try:
        forecaster = model_manager.load_forecaster()
    except Exception as e:
        logger.error("Failed to load Forecaster: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load forecasting model: {str(e)}",
        )

    # 4. Extract raw data from request
    raw_payload: Union[List[Dict[str, Any]], str, None] = None
    if request_data.flows is not None:
        raw_payload = request_data.flows
    elif request_data.csv_data is not None:
        raw_payload = request_data.csv_data
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Must provide either 'flows' (list of flow objects) or 'csv_data' (CSV text).",
        )

    # 5. Process through Ganesh's pipeline into 5 windows
    try:
        sequence_df, timestamps, ganesh_log = process_raw_flows_to_sequence(
            raw_input=raw_payload,
            window_seconds=request_data.window_seconds or 5,
            required_windows=forecaster.config.get("sequence_length", 5),
        )
    except ValueError as ve:
        logger.warning("Ganesh pipeline validation error: %s", ve)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve),
        )
    except Exception as e:
        logger.error("Ganesh pipeline processing error: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process raw network flows: {str(e)}",
        )

    # 6. Run Madhav Forecaster inference
    try:
        prediction_result = forecaster.predict(sequence_df, timestamps)
        return prediction_result
    except ValueError as ve:
        logger.warning("Forecaster input error: %s", ve)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Prediction validation error: {str(ve)}",
        )
    except Exception as e:
        logger.error("Inference failure: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Model inference execution failed.",
        )



@app.post("/message/analyze", response_model=MessageAnalyzeResponse)
def analyze_message(request_data: MessageAnalyzeRequest):
    """Analyze a message with the offline message-threat model and URL evidence layer."""
    try:
        model = message_model_manager.load()
        result = model.predict(request_data.text, request_data.url)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error("Message analysis failure: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Message threat analysis failed")


@app.post("/policy/decision", response_model=SecurityDecisionResponse)
def policy_decision(request_data: MessageAnalyzeRequest):
    """Return a deterministic policy decision from message and optional network risk."""
    try:
        model = message_model_manager.load()
        threat = model.predict(request_data.text, request_data.url)
        decision = policy_decide(
            threat["threat_probability"],
            request_data.network_risk,
            threat["category"],
        )
        event = record_event({
            "type": "policy_decision",
            "category": threat["category"],
            "action": decision["action"],
            "severity": decision["severity"],
            "scores": {
                "message": threat["threat_probability"],
                "network": request_data.network_risk,
                "composite": decision["composite_risk"],
            },
            "reason": decision["reason"],
            "model_versions": {"message": threat["model_version"], "policy": decision["policy_version"]},
            "sender": request_data.sender,
        })
        return {**decision, "audit_id": event["event_id"]}
    except Exception as e:
        logger.error("Policy decision failure: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Policy decision failed")


@app.post("/security/analyze", response_model=SecurityAnalyzeResponse)
def analyze_security(request_data: MessageAnalyzeRequest):
    """Full next-level flow: message AI -> context fusion -> policy -> audit."""
    try:
        model = message_model_manager.load()
        threat = model.predict(request_data.text, request_data.url)
        decision = policy_decide(
            threat["threat_probability"],
            request_data.network_risk,
            threat["category"],
        )
        event = record_event({
            "type": "security_analysis",
            "category": threat["category"],
            "action": decision["action"],
            "severity": decision["severity"],
            "scores": {
                "message": threat["threat_probability"],
                "network": request_data.network_risk,
                "composite": decision["composite_risk"],
            },
            "evidence": threat["evidence"],
            "reason": decision["reason"],
            "model_versions": {"message": threat["model_version"], "policy": decision["policy_version"]},
            "sender": request_data.sender,
        })
        return {
            "message": threat,
            "decision": {**decision, "audit_id": event["event_id"]},
            "event_id": event["event_id"],
        }
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error("Security analysis failure: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="End-to-end security analysis failed")


@app.get("/security/events", response_model=AuditEventsResponse)
def security_events(limit: int = 50):
    """Return recent security decision events for the SOC timeline."""
    return {"events": list_events(limit)}



@app.post("/mobile/devices/register", response_model=MobileDeviceResponse)
def mobile_register(request_data: MobileDeviceRegisterRequest):
    """Register or refresh an Android device used by the SentinelAI mobile gateway."""
    return register_device(
        request_data.device_id,
        request_data.name,
        request_data.model,
        request_data.os_version,
    )


@app.post("/mobile/devices/heartbeat", response_model=MobileDeviceResponse)
def mobile_heartbeat(request_data: MobileDeviceHeartbeatRequest):
    """Keep a connected Android device marked online."""
    device = heartbeat(request_data.device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Mobile device is not registered")
    return device


@app.get("/mobile/devices", response_model=List[MobileDeviceResponse])
def mobile_devices():
    """Return registered mobile devices and their current connection state."""
    return list_devices()


@app.post("/mobile/events", response_model=SecurityAnalyzeResponse)
def mobile_message_event(request_data: MobileMessageEventRequest):
    """
    Ingest a message event from a connected Android device.

    The server performs the same message AI -> URL evidence -> context fusion ->
    deterministic policy -> audit flow used by the web console.
    """
    try:
        device = heartbeat(request_data.device_id)
        if not device:
            device = register_device(request_data.device_id, "Android Device", "Android", "unknown")

        model = message_model_manager.load()
        threat = model.predict(request_data.text, request_data.url)
        decision = policy_decide(
            threat["threat_probability"],
            request_data.network_risk,
            threat["category"],
        )
        event = record_event({
            "type": "mobile_message",
            "source": request_data.source,
            "device_id": request_data.device_id,
            "device_name": device.get("name"),
            "category": threat["category"],
            "action": decision["action"],
            "severity": decision["severity"],
            "scores": {
                "message": threat["threat_probability"],
                "network": request_data.network_risk,
                "composite": decision["composite_risk"],
            },
            "evidence": threat["evidence"],
            "reason": decision["reason"],
            "model_versions": {"message": threat["model_version"], "policy": decision["policy_version"]},
            "sender": request_data.sender,
        })
        return {
            "message": threat,
            "decision": {**decision, "audit_id": event["event_id"]},
            "event_id": event["event_id"],
        }
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.error("Mobile message event failure: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Mobile security event processing failed")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("api:app", host=host, port=port, reload=True)
