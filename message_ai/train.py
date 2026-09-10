from pathlib import Path
import json
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
from message_ai.dataset import MESSAGES

ROOT = Path(__file__).resolve().parent
ARTIFACT = ROOT / "artifacts" / "message_model.joblib"
META = ROOT / "artifacts" / "message_model_meta.json"

texts = [x[1] for x in MESSAGES]
labels = [x[0] for x in MESSAGES]
model = Pipeline([
    ("tfidf", TfidfVectorizer(lowercase=True, strip_accents="unicode", ngram_range=(1, 2), sublinear_tf=True)),
    ("classifier", LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42)),
])
model.fit(texts, labels)
pred = model.predict(texts)
report = classification_report(labels, pred, output_dict=True, zero_division=0)
joblib.dump(model, ARTIFACT)
META.write_text(json.dumps({
    "model_version": "message-baseline-1.0.0",
    "model_type": "TF-IDF + Logistic Regression",
    "training_examples": len(MESSAGES),
    "classes": sorted(set(labels)),
    "training_note": "Curated offline baseline for controlled demonstration; replace with a validated larger dataset/DistilBERT model for production.",
    "training_report": report,
}, indent=2), encoding="utf-8")
print(f"saved {ARTIFACT}")
