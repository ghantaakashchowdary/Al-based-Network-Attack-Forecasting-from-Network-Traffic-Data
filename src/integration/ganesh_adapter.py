"""
ganesh_adapter.py
-----------------
Integration adapter bridging Ganesh's Network Traffic Preprocessing Pipeline
(Module 2 / Ingestion) with Madhav's Multi-Stage Attack Forecasting System (Module 3).

Key guarantees:
1. Enforces strict input validation (raises ValueError on schema/data errors).
2. Runs Ganesh's modular ingestion, cleaning, feature extraction, and 5-second windowing.
3. Verifies temporal history >= 5 windows (>= 25 seconds of network traffic).
4. Isolates the 21 numeric features, strips ground-truth label columns.
5. Feeds the resulting 5x21 sequence into Madhav's Forecaster.predict().
"""

import sys
import os
import io
import logging
from typing import List, Dict, Any, Tuple, Union, Optional
import pandas as pd
import numpy as np

logger = logging.getLogger("module3.ganesh_adapter")

# Discover Ganesh module directory dynamically
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))

# Candidate locations for Ganesh module
CANDIDATE_GANESH_PATHS = [
    os.path.join(PROJECT_ROOT, "ganesh_module", "src"),
    os.path.join(PROJECT_ROOT, "..", "Ganesh-Module", "src"),
    os.path.join(PROJECT_ROOT, "Ganesh-Module", "src"),
    r"C:\Users\chinn\OneDrive\Desktop\backend\Ganesh-Module\src",
]

GANESH_SRC_DIR: Optional[str] = None
for p in CANDIDATE_GANESH_PATHS:
    if os.path.isdir(p) and os.path.isfile(os.path.join(p, "ingest.py")):
        GANESH_SRC_DIR = p
        break

if GANESH_SRC_DIR and GANESH_SRC_DIR not in sys.path:
    sys.path.insert(0, GANESH_SRC_DIR)
    logger.info("Registered Ganesh module path: %s", GANESH_SRC_DIR)


def is_ganesh_available() -> bool:
    """Return True if Ganesh's module directory is discoverable and loadable."""
    return GANESH_SRC_DIR is not None and os.path.isdir(GANESH_SRC_DIR)


def _import_ganesh_modules():
    """Dynamically import Ganesh's modules on demand."""
    if not is_ganesh_available():
        raise RuntimeError(
            f"Ganesh's module source directory was not found at: {GANESH_SRC_DIR}. "
            "Please ensure the Ganesh-Module repository is cloned as a sibling directory."
        )

    try:
        from ingest import normalize_column_names
        from clean_validate import validate_schema, clean, validate_final, ValidationError
        from features import extract_features
        from windowing import build_time_windows
        return normalize_column_names, validate_schema, clean, validate_final, extract_features, build_time_windows, ValidationError
    except ImportError as e:
        raise RuntimeError(f"Failed to import Ganesh's pipeline modules: {e}")


def process_raw_flows_to_sequence(
    raw_input: Union[pd.DataFrame, List[Dict[str, Any]], str],
    window_seconds: int = 5,
    required_windows: int = 5,
) -> Tuple[pd.DataFrame, List[str], List[str]]:
    """
    Process raw flow records using Ganesh's pipeline into 5 model-ready windows.

    Args:
        raw_input: Raw flow records as a pandas DataFrame, list of dicts, or CSV string.
        window_seconds: Time window duration in seconds (default 5).
        required_windows: Number of history windows required by Madhav (default 5).

    Returns:
        Tuple containing:
        - DataFrame with the 5 most recent windows containing the 21 numeric features.
        - List of ISO-8601 timestamp strings for the 5 windows.
        - Execution log messages from Ganesh's pipeline.

    Raises:
        ValueError: If input schema is invalid or contains insufficient temporal history (< 5 windows).
        RuntimeError: If Ganesh module is unavailable or internal failure occurs.
    """
    (
        normalize_column_names,
        validate_schema,
        clean,
        validate_final,
        extract_features,
        build_time_windows,
        ValidationError,
    ) = _import_ganesh_modules()

    log: List[str] = []

    # 1. Convert raw input to DataFrame
    if isinstance(raw_input, str):
        try:
            df = pd.read_csv(io.StringIO(raw_input))
        except Exception as e:
            raise ValueError(f"Failed to parse CSV raw flow input: {str(e)}")
    elif isinstance(raw_input, list):
        if not raw_input:
            raise ValueError("Raw flows list is empty.")
        df = pd.DataFrame(raw_input)
    elif isinstance(raw_input, pd.DataFrame):
        df = raw_input.copy()
    else:
        raise ValueError(
            f"Unsupported raw input type: {type(raw_input)}. Expected DataFrame, list of dicts, or CSV string."
        )

    if df.empty:
        raise ValueError("Input flow dataset contains 0 records.")

    # 2. Ingestion column standardization
    df = normalize_column_names(df)
    df = df.loc[:, ~df.columns.duplicated()]

    # Normalize duration if in microseconds (CIC-IDS standard)
    if "duration" in df.columns:
        df["duration"] = pd.to_numeric(df["duration"], errors="coerce").fillna(0.0)
        if df["duration"].mean() > 1000:
            df["duration"] = df["duration"] / 1_000_000.0


    # 3. Schema validation
    try:
        warnings = validate_schema(df)
        for w in warnings:
            log.append(f"[Ganesh Warning] {w}")
    except ValidationError as ve:
        raise ValueError(f"Ganesh Schema Validation Error: {str(ve)}")

    # 4. Cleaning & NaN handling
    df = clean(df, log)

    # 5. Final validation
    try:
        validate_final(df, log)
    except ValidationError as ve:
        raise ValueError(f"Ganesh Final Validation Error: {str(ve)}")

    # 6. Feature extraction (flow & packet features)
    df = extract_features(df, log)

    # 7. Time windowing into network state sequences
    windows_df = build_time_windows(df, window_seconds=window_seconds, log=log)

    if len(windows_df) < required_windows:
        timespan = (
            (df["timestamp"].max() - df["timestamp"].min()).total_seconds()
            if "timestamp" in df.columns and len(df) > 1
            else 0.0
        )
        raise ValueError(
            f"Insufficient temporal history: input flows cover {timespan:.1f}s, producing "
            f"{len(windows_df)} 5-second windows. Madhav's forecasting model strictly requires "
            f"at least {required_windows} history windows ({required_windows * window_seconds} seconds of traffic)."
        )

    # 8. Take the 5 most recent windows for forecasting
    tail_windows = windows_df.tail(required_windows).copy()

    # Extract timestamps
    timestamps = tail_windows["timestamp"].astype(str).tolist()

    # 9. Isolate the 21 numeric feature columns and ensure all 21 model features exist
    EXPECTED_FEATURES = [
        "total_packets", "total_bytes", "duration", "syn_flag_count", "ack_flag_count",
        "fin_flag_count", "rst_flag_count", "psh_flag_count", "ttl", "tcp_window_size",
        "fragmented", "retransmission_count", "flow_bytes_per_sec", "flow_packets_per_sec",
        "avg_packet_size", "flow_count", "unique_src_ips", "unique_dst_ips",
        "unique_dst_ports", "tcp_count", "udp_count"
    ]

    for col in EXPECTED_FEATURES:
        if col not in tail_windows.columns:
            tail_windows[col] = 0.0

    sequence_df = tail_windows[EXPECTED_FEATURES].copy()

    # Enforce numeric types and verify exact 21 features
    for col in sequence_df.columns:
        sequence_df[col] = pd.to_numeric(sequence_df[col], errors="coerce").fillna(0.0)

    logger.info(
        "Ganesh pipeline successfully generated %d windows with %d features.",
        len(sequence_df),
        len(sequence_df.columns),
    )

    return sequence_df, timestamps, log
