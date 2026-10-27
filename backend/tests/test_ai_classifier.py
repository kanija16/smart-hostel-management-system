"""AI Classifier and Priority Engine Unit Tests"""

import pytest
from app.services.classifier import classifier
from app.services.priority_engine import determine_priority

def test_classifier_plumbing_sample():
    result = classifier.predict(
        "Burst bathroom pipe",
        "Water pipe leaking heavily under the bathroom sink, water overflowing onto floor"
    )
    assert result["predicted_category"] == "Plumbing"
    assert result["confidence_score"] > 0.5
    assert result["is_fallback"] is False

def test_classifier_electrical_sample():
    result = classifier.predict(
        "Flickering lights and sparks",
        "Electric switchboard sparked and smoke is coming out, dangerous burning smell"
    )
    assert result["predicted_category"] == "Electrical"
    assert result["predicted_priority"] == "Critical"
    assert result["confidence_score"] > 0.5
    assert result["is_fallback"] is False

def test_classifier_internet_sample():
    result = classifier.predict(
        "No Wi-Fi signal",
        "Wi-Fi connection keeps dropping every few minutes during online quiz"
    )
    assert result["predicted_category"] == "Internet"
    assert result["is_fallback"] is False

def test_classifier_cleaning_sample():
    result = classifier.predict(
        "Dirty washroom",
        "The shared washroom on 2nd floor is extremely dirty and needs urgent sanitation"
    )
    assert result["predicted_category"] == "Cleaning"
    assert result["is_fallback"] is False

def test_classifier_security_sample():
    result = classifier.predict(
        "Broken room lock",
        "Main room door lock is broken and anyone can push open the door without a key"
    )
    assert result["predicted_category"] == "Security"
    assert result["predicted_priority"] in ["Critical", "High"]
    assert result["is_fallback"] is False

def test_classifier_maintenance_sample():
    result = classifier.predict(
        "Broken furniture",
        "The study chair has a broken leg and cannot be sat upon safely"
    )
    assert result["predicted_category"] == "Maintenance"
    assert result["is_fallback"] is False

def test_classifier_fallback_for_nonsense():
    result = classifier.predict(
        "random title",
        "asdfghjk qwerty zzz123 999xyz"
    )
    assert result["predicted_category"] == "Other"
    assert result["is_fallback"] is True
    assert result["predicted_priority"] == "Low"

def test_priority_engine_critical_fire_hazard():
    priority, reason = determine_priority("fire coming from switchboard", "Electrical")
    assert priority == "Critical"
    assert "hazard" in reason.lower() or "emergency" in reason.lower()

def test_priority_engine_high_exam_wifi():
    priority, reason = determine_priority("exam in two hours but no internet", "Internet")
    assert priority == "High"

def test_priority_engine_low_cosmetic():
    priority, reason = determine_priority("paint peeling off the wall corner", "Maintenance")
    assert priority == "Low"
