from __future__ import annotations

from pathlib import Path
import joblib

from .url_analyzer import analyze_url


URGENCY = {
    "urgent",
    "immediately",
    "now",
    "final warning",
    "within 24 hours",
    "suspended",
    "locked",
    "expires today",
    "act now",
    "last warning",
}

CREDENTIALS = {
    "password",
    "passcode",
    "credential",
    "login",
    "sign in",
    "signin",
    "verify your identity",
    "account details",
    "verify your account",
    "confirm your identity",
    "username",
    "security code",
}

PAYMENT = {
    "card number",
    "verification code",
    "gift card",
    "pay",
    "payment",
    "transfer funds",
    "processing fee",
    "bank details",
    "account number",
    "upi",
    "refund",
    "fee",
}

EXECUTION = {
    "disable antivirus",
    "run this command",
    "execute",
    "install",
    "administrator",
    "elevated privileges",
    "enable macros",
    "unsigned application",
}

SCAM = {
    "inheritance",
    "stranded",
    "guarantees huge returns",
    "send money",
    "release the funds",
    "registration fee",
    "cash award",
    "you have won",
    "winner",
    "lottery",
    "prize",
    "claim your prize",
    "investment opportunity",
    "guaranteed profit",
}

PHISHING_TERMS = {
    "account suspended",
    "account will be suspended",
    "verify your account",
    "verify your identity",
    "confirm your account",
    "security alert",
    "unusual activity",
    "suspicious activity",
    "account locked",
    "click the link",
    "open the link",
    "login immediately",
}


def _detect_signals(text: str) -> tuple[float, list[str]]:
    lower = text.lower()
    detected: list[str] = []
    signal_groups = [
        ("urgency", URGENCY),
        ("credential request", CREDENTIALS),
        ("payment request", PAYMENT),
        ("execution/privilege request", EXECUTION),
        ("scam/social-engineering language", SCAM),
        ("phishing language", PHISHING_TERMS),
    ]
    weights = {
        "urgency": 0.16,
        "credential request": 0.22,
        "payment request": 0.22,
        "execution/privilege request": 0.25,
        "scam/social-engineering language": 0.24,
        "phishing language": 0.20,
    }
    score = 0.0
    for label, terms in signal_groups:
        if any(term in lower for term in terms):
            detected.append(label)
            score += weights[label]
    return min(1.0, score), detected


class MessageThreatModel:
    def __init__(self, artifact_path: str | Path):
        self.artifact_path = Path(artifact_path)
        self.model = joblib.load(self.artifact_path)
        self.model_version = "message-baseline-1.1.0"

    def predict(self, text: str, url: str | None = None) -> dict:
        text = (text or "").strip()
        if not text:
            raise ValueError("Message text cannot be empty")

        probabilities = self.model.predict_proba([text])[0]
        classes = list(self.model.classes_)
        probs = {
            label: float(probability)
            for label, probability in zip(classes, probabilities)
        }

        category = max(probs, key=probs.get)
        ml_score = float(probs[category])

        url_result = analyze_url(url)
        url_score = float(url_result.get("risk_score", 0.0))
        heuristic_score, heuristic_signals = _detect_signals(text)

        if category == "SAFE" and heuristic_score >= 0.40:
            lower = text.lower()
            if any(term in lower for term in PHISHING_TERMS) or url_score >= 0.45:
                category = "PHISHING"
            elif any(term in lower for term in SCAM):
                category = "SCAM"
            elif any(term in lower for term in PAYMENT):
                category = "SCAM"

        ml_component = ml_score * 0.45
        heuristic_component = heuristic_score * 0.30
        url_component = url_score * 0.25
        threat_probability = (
            ml_component + heuristic_component + url_component
        )

        lower = text.lower()
        has_urgency = any(term in lower for term in URGENCY)
        has_credentials = any(term in lower for term in CREDENTIALS)
        has_payment = any(term in lower for term in PAYMENT)
        has_phishing_language = any(term in lower for term in PHISHING_TERMS)
        has_suspicious_url = url_score >= 0.35

        if category == "PHISHING" and has_suspicious_url:
            threat_probability += 0.18
        if has_urgency and has_credentials:
            threat_probability += 0.12
        if has_urgency and has_payment:
            threat_probability += 0.12
        if (
            category == "PHISHING"
            and has_phishing_language
            and has_urgency
            and has_suspicious_url
        ):
            threat_probability += 0.15
        if category == "SCAM" and has_payment and has_urgency:
            threat_probability += 0.12

        if category in {"PHISHING", "SCAM", "MALICIOUS"}:
            strong_signal_count = sum(
                [
                    has_urgency,
                    has_credentials,
                    has_payment,
                    has_suspicious_url,
                    has_phishing_language,
                ]
            )
            if strong_signal_count >= 3:
                threat_probability = max(threat_probability, 0.80)
            elif strong_signal_count >= 2:
                threat_probability = max(threat_probability, 0.68)

        threat_probability = min(1.0, max(0.0, threat_probability))

        if category == "SAFE" and heuristic_score < 0.20 and url_score < 0.20:
            threat_probability = min(threat_probability, 0.20)

        evidence: list[str] = []

        if category != "SAFE":
            evidence.append(f"message model classified content as {category.lower()}")

        evidence.extend(heuristic_signals)

        for signal in url_result.get("signals", []):
            evidence.append(signal)

        if category == "PHISHING" and has_suspicious_url:
            evidence.append("phishing classification combined with suspicious URL")

        if has_urgency and has_credentials:
            evidence.append(
                "urgent language combined with credential/account request"
            )

        if has_urgency and has_payment:
            evidence.append("urgent language combined with payment request")

        if (
            category == "PHISHING"
            and has_phishing_language
            and has_urgency
            and has_suspicious_url
        ):
            evidence.append("multiple high-risk phishing indicators detected")

        # The mobile app displays the original SMS after receiving the policy
        # result.  The existing audit endpoint only stores evidence, so include
        # a bounded message preview here so the dashboard can display the same
        # SMS without changing the API contract.
        message_preview = " ".join(text.split())
        if len(message_preview) > 300:
            message_preview = message_preview[:297] + "..."
        evidence.insert(0, f"message preview: {message_preview}")

        if not evidence:
            evidence.append(
                "no strong threat indicators detected by the baseline model"
            )

        evidence = list(dict.fromkeys(evidence))

        return {
            "threat_probability": round(threat_probability, 4),
            "category": category,
            "confidence": round(ml_score, 4),
            "class_probabilities": {
                key: round(value, 4) for key, value in probs.items()
            },
            "evidence": evidence,
            "url_analysis": url_result,
            "model_version": self.model_version,
        }
