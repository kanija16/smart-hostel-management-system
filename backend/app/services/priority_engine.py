"""Priority Determination Engine

Rule-based safety and severity evaluation engine.
Note: This module operates via deterministic domain severity heuristics
and safety rules. It evaluates hazard risk, life-safety implications,
and disruption severity in combination with the ML-predicted category.
It does NOT claim to be a machine learning model; the category classification
is powered by TF-IDF + Multinomial Naive Bayes ML, while priority is governed
by this documented safety protocol.
"""

from typing import Tuple
import re

CRITICAL_PATTERNS = [
    # 1. Fire, sparks, electrical arc, explosion, burning life-safety hazards
    r"\b(spark|sparking|sparks|short circuit|smoke|fire|burning|blast|explosion|shock|electrocution)\b",
    # 2. Water in direct proximity to electrical infrastructure (immediate electrocution/fire hazard)
    r"\b(leak|leaking|dripping|water|spray|spraying|seeping)\b.*\b(switch|switchboard|socket|plug|wire|wiring|electricity|electrical|breaker|fuse\s*box)\b",
    r"\b(switch|switchboard|socket|plug|wire|wiring|electricity|electrical|breaker|fuse\s*box)\b.*\b(leak|leaking|dripping|water|spray|spraying|seeping)\b",
    # 3. Pipe burst, room flooding, severe water inundation
    r"\b(burst\s+pipe|pipe\s+burst|pipe\s+has\s+burst|bursting\s+pipe|water\s+pipe\s+burst|pipe\s+broken)\b",
    r"\b(flooded|flooding|massive\s+flood|severe\s+flood|flooding\s+everywhere|water\s+gushing|water\s+overflowing)\b",
    # 4. Critical security breaches: theft, stolen property, burglary, assault, physical threats
    r"\b(break-in|thief|theft|stolen|robbery|burglar|burglary|stole|intruder|assault|weapon|harassment|stalking|violence|threat)\b",
    r"\b(laptop|phone|wallet|valuables|money)\b.*\b(stolen|theft|robbed|missing)\b",
    r"\b(stolen|theft|robbed)\b.*\b(laptop|phone|wallet|valuables|money)\b",
    # 5. Gas leaks, structural collapse hazards
    r"\b(gas\s+leak|toxic\s+smell|toxic\s+gas|ceiling\s+collapse|wall\s+crack\s+collapse|roof\s+collapse)\b"
]

HIGH_PATTERNS = [
    # Total infrastructure outages
    r"\b(total blackout|power cut|no power|no electricity|all lights off|breaker tripped)\b",
    r"\b(no water|water cut|dry tap|no running water|overflowing toilet|sewage overflow)\b",
    # Access and physical security integrity
    r"\b(door lock jammed|door broken|cannot lock|lock broken|window broken|broken glass)\b",
    # Academic/connectivity emergency during critical exams or deadlines
    r"\b(exam|deadline|submission|quiz|test|interview)\b.*\b(no internet|wifi down|no wifi|internet down|connection down)\b",
    r"\b(no internet|wifi down|no wifi|internet down|connection down)\b.*\b(exam|deadline|submission|quiz|test|interview)\b"
]

MEDIUM_PATTERNS = [
    # Fixture defects and non-critical electrical items
    r"\b(fan not working|fan speed|light not working|bulb fused|fused bulb|socket loose|loose socket|switch not working|loose switch)\b",
    # Ordinary plumbing maintenance, slow drains, routine tap leaks
    r"\b(slow drain|drain clogged|sink clogged|clogged|tap leaking|dripping tap|leaking tap|tap is leaking|water dripping from tap|faucet leaking)\b",
    # Sanitation, hygiene, general room cleanliness
    r"\b(dirty|smelly|garbage|trash|cleaning needed|washroom dirty|bathroom uncleaned)\b",
    # General network degradation (slow Wi-Fi without active exam emergency)
    r"\b(wifi slow|slow internet|slow wifi|disconnecting|high ping|poor signal)\b",
    # Standard furniture maintenance
    r"\b(broken chair|table broken|cupboard broken|bed squeaking|loose handle)\b"
]

LOW_PATTERNS = [
    # Aesthetic / cosmetic touchups
    r"\b(paint peeling|paint chipped|wall stain|cosmetic|scratch|minor scratch)\b",
    # Minor adjustments, squeaks, smudges
    r"\b(squeaky door|door creaks|curtain rod|mirror smudge)\b",
    # Routine non-urgent room servicing
    r"\b(routine cleaning|dusty|bedsheet|dust)\b"
]

def determine_priority(text: str, category: str, is_fallback: bool = False) -> Tuple[str, str]:
    """
    Evaluates complaint text and ML predicted category to assign priority.
    
    Returns:
        (priority: str, reason: str)
    """
    # 0. Defensive input validation and normalization
    if text is None:
        text = ""
    
    clean_text = str(text).strip()
    if not clean_text:
        if is_fallback:
            return (
                "Low",
                "General or ambiguous complaint requiring manual warden review and triage."
            )
        return (
            "Low",
            "Empty or uninformative complaint text provided. Assigned Low priority pending review."
        )

    text_lower = clean_text.lower()
    cat_normalized = (category or "").strip().capitalize()

    # 1. Critical Check: Immediate safety, fire, electrical hazard, structural failure, theft
    for pattern in CRITICAL_PATTERNS:
        match = re.search(pattern, text_lower)
        if match:
            matched_term = match.group(0)
            return (
                "Critical",
                f"Immediate hazard or emergency detected ('{matched_term}'). Requires immediate warden dispatch."
            )

    # 2. High Check: Significant disruption, total outages, locks broken, water supply gone
    for pattern in HIGH_PATTERNS:
        match = re.search(pattern, text_lower)
        if match:
            matched_term = match.group(0)
            return (
                "High",
                f"Severe living disruption or security concern detected ('{matched_term}'). Needs prompt intervention."
            )

    # Category-specific default elevated priorities
    if cat_normalized == "Security":
        return (
            "High",
            "Security category complaints are assigned High priority by default for student safety."
        )

    # 3. Medium Check: Standard maintenance issues, slow wifi, single bulb, clogged sink, ordinary tap leak
    for pattern in MEDIUM_PATTERNS:
        match = re.search(pattern, text_lower)
        if match:
            matched_term = match.group(0)
            return (
                "Medium",
                f"Standard maintenance or operational issue detected ('{matched_term}'). Scheduled for standard repair."
            )

    # 4. Low Check: Cosmetic, paint, squeaks, minor dust
    for pattern in LOW_PATTERNS:
        match = re.search(pattern, text_lower)
        if match:
            matched_term = match.group(0)
            return (
                "Low",
                f"Non-urgent aesthetic or minor adjustment requested ('{matched_term}')."
            )

    # Fallback or default based on category
    if is_fallback:
        return (
            "Low",
            "General or ambiguous complaint requiring manual warden review and triage."
        )

    # Category baseline defaults
    category_defaults = {
        "Electrical": ("High", "Electrical issue defaults to High priority to prevent escalation."),
        "Plumbing": ("Medium", "Plumbing issue defaults to Medium priority for facility maintenance."),
        "Internet": ("Medium", "Internet disruption defaults to Medium priority."),
        "Cleaning": ("Low", "Sanitation and cleaning request assigned standard Low priority queue."),
        "Maintenance": ("Medium", "General maintenance assigned standard Medium priority."),
        "Security": ("High", "Security category complaints are assigned High priority by default for student safety."),
        "Other": ("Low", "General request assigned Low priority pending review.")
    }

    return category_defaults.get(cat_normalized, ("Medium", "Default priority assigned for standard resolution."))
