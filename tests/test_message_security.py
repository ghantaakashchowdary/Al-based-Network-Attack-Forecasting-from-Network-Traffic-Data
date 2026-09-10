from fastapi.testclient import TestClient
from api import app


def test_message_analyze_safe():
    with TestClient(app) as client:
        response = client.post("/message/analyze", json={"text": "Hi team, the meeting is at 3 PM today."})
    assert response.status_code == 200
    body = response.json()
    assert body["category"] in {"SAFE", "SPAM", "PHISHING", "SCAM", "MALICIOUS"}
    assert 0 <= body["threat_probability"] <= 1
    assert "evidence" in body


def test_security_analysis_contract():
    with TestClient(app) as client:
        response = client.post("/security/analyze", json={
            "text": "Urgent: verify your password immediately or your account will be suspended.",
            "url": "http://192.0.2.10/verify",
            "network_risk": 0.8,
        })
    assert response.status_code == 200
    body = response.json()
    assert body["message"]["category"] in {"SAFE", "SPAM", "PHISHING", "SCAM", "MALICIOUS"}
    assert body["decision"]["action"] in {"ALLOW", "WARN", "QUARANTINE", "BLOCK"}
    assert body["event_id"] == body["decision"]["audit_id"]


def test_security_events_endpoint():
    with TestClient(app) as client:
        client.post("/security/analyze", json={"text": "Normal project update from the team."})
        response = client.get("/security/events")
    assert response.status_code == 200
    assert isinstance(response.json()["events"], list)
