"""Hostel Complaint Machine Learning Classifier

Technology:
- Feature Extraction: scikit-learn TfidfVectorizer (ngram_range=(1,2), sublinear_tf=True)
- Classification Algorithm: scikit-learn MultinomialNB (alpha=0.1)
- Fallback Heuristics: Clearly documented rule/threshold fallback when prediction confidence
  falls below CONFIDENCE_THRESHOLD or input contains out-of-vocabulary / gibberish tokens.
"""

import os
import json
import joblib
from typing import Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from app.config import settings
from app.services.priority_engine import determine_priority

# Supported canonical categories
CATEGORIES = [
    "Plumbing",
    "Electrical",
    "Cleaning",
    "Maintenance",
    "Internet",
    "Security",
    "Other"
]

class ComplaintClassifier:
    def __init__(self):
        self.model: Optional[Pipeline] = None
        self._ensure_model_loaded()

    def _ensure_model_loaded(self):
        """Loads existing model from disk, or trains on startup dataset."""
        if os.path.exists(settings.MODEL_PATH):
            try:
                self.model = joblib.load(settings.MODEL_PATH)
                return
            except Exception as e:
                print(f"[Classifier] Failed loading existing model ({e}). Retraining...")

        self.train_model()

    def train_model(self) -> Dict[str, Any]:
        """Trains MultinomialNB with TF-IDF pipeline using complaint_dataset.json."""
        if not os.path.exists(settings.DATASET_PATH):
            raise FileNotFoundError(f"Training dataset not found at {settings.DATASET_PATH}")

        with open(settings.DATASET_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        texts = [item["text"] for item in data]
        labels = [item["category"] for item in data]

        # Pipeline with TF-IDF Vectorizer and Multinomial Naive Bayes
        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(
                ngram_range=(1, 2),
                lowercase=True,
                stop_words="english",
                sublinear_tf=True,
                min_df=1
            )),
            ("clf", MultinomialNB(alpha=0.1))
        ])

        pipeline.fit(texts, labels)
        self.model = pipeline

        # Ensure directory exists and persist model
        os.makedirs(os.path.dirname(settings.MODEL_PATH), exist_ok=True)
        joblib.dump(pipeline, settings.MODEL_PATH)

        return {
            "status": "success",
            "samples_trained": len(texts),
            "categories": list(set(labels))
        }

    def predict(self, title: str, description: str) -> Dict[str, Any]:
        """
        Classifies complaint text.
        
        Returns:
            {
                "predicted_category": str,
                "predicted_priority": str,
                "confidence_score": float,
                "is_fallback": bool,
                "priority_reason": str,
                "probabilities": Dict[str, float]
            }
        """
        full_text = f"{title.strip()} {description.strip()}".strip()
        if not full_text:
            return {
                "predicted_category": "Other",
                "predicted_priority": "Low",
                "confidence_score": 0.0,
                "is_fallback": True,
                "priority_reason": "Empty complaint text provided; defaulted to fallback triage.",
                "probabilities": {}
            }

        if self.model is None:
            self._ensure_model_loaded()

        # 1. Machine Learning Prediction using TF-IDF + Multinomial Naive Bayes
        probabilities = self.model.predict_proba([full_text])[0]
        classes = self.model.classes_

        prob_dict = {cls: round(float(prob), 4) for cls, prob in zip(classes, probabilities)}
        max_idx = probabilities.argmax()
        max_prob = float(probabilities[max_idx])
        predicted_class = classes[max_idx]

        # Check for vocabulary presence:
        # If words in input are completely unknown to the vectorizer (e.g., gibberish "asdfghjk qwerty"),
        # TF-IDF returns an all-zero vector, giving uniform/uninformative prior distribution.
        vectorizer = self.model.named_steps["tfidf"]
        feature_vector = vectorizer.transform([full_text])
        has_known_features = feature_vector.nnz > 0

        # 2. Fallback Mechanism (Documented Fallback)
        # Triggered when:
        # a) No known vocabulary features matched in vectorizer (out-of-vocabulary / nonsense input)
        # b) Prediction confidence falls below confidence threshold (settings.CONFIDENCE_THRESHOLD)
        if not has_known_features or max_prob < settings.CONFIDENCE_THRESHOLD:
            category = "Other"
            confidence = round(max_prob if has_known_features else 0.1, 4)
            is_fallback = True
        else:
            category = predicted_class
            confidence = round(max_prob, 4)
            is_fallback = False

        # 3. Rule-Based Priority Determination Engine
        priority, reason = determine_priority(full_text, category, is_fallback=is_fallback)

        return {
            "predicted_category": category,
            "predicted_priority": priority,
            "confidence_score": confidence,
            "is_fallback": is_fallback,
            "priority_reason": reason,
            "probabilities": prob_dict
        }

# Global singleton classifier instance
classifier = ComplaintClassifier()
