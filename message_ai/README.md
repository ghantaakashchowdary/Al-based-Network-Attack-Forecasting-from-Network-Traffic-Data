# SentinelAI Message Threat Layer

This module is a **runnable offline baseline** for the next-level SIH26153 extension.

Pipeline:

`message text + optional URL -> TF-IDF/Logistic Regression -> transparent URL/text signals -> policy/context fusion -> audit`

Classes: `SAFE`, `SPAM`, `PHISHING`, `SCAM`, `MALICIOUS`.

The included model is trained on a small curated demonstration dataset so the repository remains offline-friendly. It is **not a production-grade phishing model**. Replace it with a validated larger dataset or a DistilBERT-class model before making production claims.

To retrain the baseline:

```bash
python -m message_ai.train
```
