from __future__ import annotations


def severity_for(score: float) -> str:
    score = max(0.0, min(1.0, float(score)))
    if score >= 0.85:
        return "CRITICAL"
    if score >= 0.65:
        return "HIGH"
    if score >= 0.35:
        return "MEDIUM"
    return "LOW"


def action_for(severity: str, category: str) -> str:
    if severity == "CRITICAL":
        return "BLOCK"
    if severity == "HIGH":
        return "QUARANTINE"
    if severity == "MEDIUM":
        return "WARN"
    return "ALLOW"


def decide(
    message_risk: float | None,
    network_risk: float | None,
    category: str | None,
) -> dict:
    mr = max(0.0, min(1.0, float(message_risk or 0.0)))
    nr = (
        max(0.0, min(1.0, float(network_risk)))
        if network_risk is not None
        else None
    )

    if nr is None:
        composite = mr
        fusion = "message-only"
    else:
        composite = 0.70 * mr + 0.30 * nr
        fusion = "message 70% + network 30%"

    # Small category-aware policy adjustment. The main risk signal still
    # comes from the model + URL/text evidence.
    if category in {"PHISHING", "SCAM", "MALICIOUS"}:
        composite = min(1.0, composite + 0.02)

    severity = severity_for(composite)
    action = action_for(severity, category or "SAFE")

    if category == "SAFE" and composite < 0.35:
        action = "ALLOW"

    reason = (
        f"Composite risk {composite:.2f} using {fusion}; "
        f"policy action is {action.lower()}."
    )

    return {
        "severity": severity,
        "action": action,
        "reason": reason,
        "network_risk": round(nr, 4) if nr is not None else None,
        "message_risk": round(mr, 4),
        "composite_risk": round(composite, 4),
        "policy_version": "policy-1.1.0",
    }
