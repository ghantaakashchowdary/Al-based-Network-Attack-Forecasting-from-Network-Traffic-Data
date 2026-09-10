from __future__ import annotations

import re
from urllib.parse import urlparse

SHORTENERS = {"bit.ly", "tinyurl.com", "t.co", "is.gd", "ow.ly", "cutt.ly", "rb.gy"}
SUSPICIOUS_TLDS = {".zip", ".mov", ".click", ".top", ".xyz", ".work", ".support", ".buzz", ".cam"}
SUSPICIOUS_TERMS = {"login", "verify", "verification", "secure", "account", "password", "wallet", "payment", "update", "confirm"}


def analyze_url(url: str | None) -> dict:
    if not url or not url.strip():
        return {"present": False, "risk_score": 0.0, "signals": []}
    value = url.strip()
    candidate = value if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", value) else "https://" + value
    parsed = urlparse(candidate)
    host = (parsed.hostname or "").lower()
    path = (parsed.path or "").lower()
    full = candidate.lower()
    score = 0.0
    signals: list[str] = []
    if parsed.scheme != "https":
        score += 0.15
        signals.append("non-HTTPS URL")
    if host in SHORTENERS:
        score += 0.35
        signals.append("URL shortener")
    if re.fullmatch(r"\d{1,3}(?:\.\d{1,3}){3}", host):
        score += 0.30
        signals.append("raw IP address host")
    if "@" in value:
        score += 0.25
        signals.append("userinfo/@ URL pattern")
    if "xn--" in host:
        score += 0.30
        signals.append("punycode hostname")
    if any(host.endswith(tld) for tld in SUSPICIOUS_TLDS):
        score += 0.20
        signals.append("uncommon/suspicious TLD")
    is_ipv4 = bool(re.fullmatch(r"\d{1,3}(?:\.\d{1,3}){3}", host))
    if not is_ipv4 and len(host.split(".")) >= 4:
        score += 0.10
        signals.append("deep subdomain chain")
    if any(term in full for term in SUSPICIOUS_TERMS):
        score += 0.12
        signals.append("credential/payment language in URL")
    if len(value) > 120:
        score += 0.10
        signals.append("unusually long URL")
    return {
        "present": True,
        "host": host,
        "risk_score": round(min(score, 1.0), 4),
        "signals": signals,
    }
