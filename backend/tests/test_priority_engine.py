"""Unit Test Suite for Priority Determination Engine (app.services.priority_engine)

Software Testing Assignment Test Suite
Module Under Test: app/services/priority_engine.py
Function: determine_priority(text: str, category: str, is_fallback: bool = False)

Test Suite Coverage:
1. Critical Priority:
   - Electrical fire, sparks, smoke, explosion, shock
   - Water proximity to electrical fixtures (electrocution hazard)
   - Theft, burglary, stolen laptop/valuables, physical threat
   - Flooded rooms, pipe bursts, water inundation
   - Gas leaks and structural collapse
2. High Priority:
   - Total utilities outage (power blackout, no water)
   - Security access breaches (broken locks, shattered windows)
   - Wi-Fi outage during academic deadlines/exams
   - Security category default elevation
   - Electrical category baseline default
3. Medium Priority:
   - Ordinary water leaks (tap leaking, slow drains, dripping faucets) - NON-CRITICAL
   - Single fixture failures (fan capacitor, fused bulb, loose socket)
   - General Wi-Fi degradation (slow ping, poor signal)
   - Broken furniture (chair, table, cupboard)
   - Plumbing / Maintenance / Internet baseline defaults
4. Low Priority:
   - Cosmetic flaws (paint peeling, wall stains, scratches)
   - Minor noises and adjustments (squeaky door, curtain rod)
   - Routine cleaning requests
   - Cleaning / Other baseline defaults
5. Defensive Input Handling & Edge Cases:
   - Empty strings, whitespace-only strings, None handling
   - Case insensitivity (UPPERCASE, mixed case, lowercase)
   - Special characters, excessive punctuation, and symbols
   - Case-insensitive category string handling
   - Unknown/unrecognized categories
6. Fallback Behavior:
   - General/ambiguous input with is_fallback=True -> Low
   - Safety preservation: critical hazards override is_fallback flag
7. Bug-Fix Regression Verification:
   - Explicit tests locking in fixes for each discovered defect
"""

import pytest
from app.services.priority_engine import (
    determine_priority,
    CRITICAL_PATTERNS,
    HIGH_PATTERNS,
    MEDIUM_PATTERNS,
    LOW_PATTERNS
)

# ==============================================================================
# 1. CRITICAL PRIORITY TESTS (Immediate Life-Safety, Hazard, Theft, Disaster)
# ==============================================================================

class TestCriticalPriority:
    """Tests for immediate hazard and emergency scenarios requiring instant warden dispatch."""

    def test_critical_electrical_sparks_smoke_fire(self):
        """Verify direct electrical fire, spark, and explosion hazards trigger Critical."""
        test_cases = [
            ("Electric sparks coming out of main switchboard", "Electrical"),
            ("Thick black smoke and burning smell in room 204", "Electrical"),
            ("Small fire started near the room heater", "Maintenance"),
            ("Short circuit causing explosion sound in corridor", "Electrical"),
            ("Live wire giving electric shock to students touching tap", "Electrical"),
            ("Electrocution hazard from exposed live copper wire", "Electrical")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "Critical", f"Failed on '{text}'"
            assert "immediate hazard" in reason.lower() or "emergency" in reason.lower()

    def test_critical_water_near_electrical_hazard_fix(self):
        """
        BUG FIX VERIFICATION:
        Water leaking near electrical switchboards/sockets is a life/fire hazard.
        Previously misclassified as 'High'; must be 'Critical'.
        """
        test_cases = [
            # Direct requirement phrase
            ("Water leaking near an electrical switchboard", "Electrical"),
            ("Water leaking near an electrical switchboard", "Plumbing"),
            # Reordered phrasing (switchboard first, water second)
            ("Electrical switchboard has water dripping all over it", "Electrical"),
            ("Water dripping on the main power socket", "Electrical"),
            ("Water seeping into the circuit breaker fuse box", "Electrical"),
            ("Water spray reaching exposed electrical wiring", "Electrical")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "Critical", f"Water-electrical hazard '{text}' must be Critical, got {priority}"
            assert "immediate hazard" in reason.lower() or "emergency" in reason.lower()

    def test_critical_theft_and_stolen_items_fix(self):
        """
        BUG FIX VERIFICATION:
        Theft, burglary, and stolen belongings were previously missed because
        the pattern only searched for 'thief' rather than 'stolen', 'theft', 'robbery'.
        """
        test_cases = [
            ("My laptop was stolen from room 204 while I was at dinner", "Security"),
            ("Theft reported in room B-102, backpack and electronics missing", "Security"),
            ("Someone broke into my room and stole my wallet and cash", "Security"),
            ("Room burglary in broad daylight, phone and laptop stolen", "Security"),
            ("Break-in happened on 3rd floor, door forced open and valuables stolen", "Security")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "Critical", f"Theft incident '{text}' must be Critical, got {priority}"
            assert "immediate hazard" in reason.lower() or "emergency" in reason.lower()

    def test_critical_flooded_rooms_and_burst_pipes_fix(self):
        """
        BUG FIX VERIFICATION:
        'Room is flooded' and 'pipe has burst' were previously missed because patterns
        required specific adjectives like 'massive flood' or 'pipe burst'.
        """
        test_cases = [
            ("Room is flooded with water from the adjoining bathroom", "Plumbing"),
            ("The entire hallway is flooded and water is entering student rooms", "Plumbing"),
            ("Water pipe has burst under the main washroom basin", "Plumbing"),
            ("Pipe burst on the 4th floor causing water gushing everywhere", "Plumbing"),
            ("Severe flood in the ground floor dormitory", "Plumbing")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "Critical", f"Flooding/burst incident '{text}' must be Critical, got {priority}"

    def test_critical_structural_and_gas_hazards(self):
        """Verify gas leaks and structural collapse hazards trigger Critical."""
        test_cases = [
            ("Strong gas leak smell coming from the hostel pantry", "Maintenance"),
            ("Toxic smell spreading through the ventilation duct", "Maintenance"),
            ("Ceiling collapse in room 112, plaster chunks falling down", "Maintenance"),
            ("Massive wall crack collapse risk after tremor", "Maintenance")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "Critical", f"Structural/gas hazard '{text}' must be Critical, got {priority}"


# ==============================================================================
# 2. HIGH PRIORITY TESTS (Total Outages, Access Breaches, Exam Connectivity)
# ==============================================================================

class TestHighPriority:
    """Tests for major disruptions and urgent issues that require prompt intervention."""

    def test_high_total_blackout_and_power_outages(self):
        """Verify total power cuts and circuit breaker trips trigger High."""
        test_cases = [
            ("Total blackout in entire B block since evening", "Electrical"),
            ("Power cut in our wing and all lights off", "Electrical"),
            ("Main breaker tripped and no electricity in room", "Electrical"),
            ("No power across the entire 3rd floor rooms", "Electrical")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "High", f"Power outage '{text}' must be High, got {priority}"
            assert "severe living disruption" in reason.lower()

    def test_high_total_water_supply_loss_and_sewage(self):
        """Verify complete water outages and sewage overflows trigger High."""
        test_cases = [
            ("No water in the entire wing since morning", "Plumbing"),
            ("Water cut announced but taps completely dry for 24 hours", "Plumbing"),
            ("No running water in any bathroom on the floor", "Plumbing"),
            ("Sewage overflow in common bathroom area", "Plumbing"),
            ("Overflowing toilet creating unsanitary condition", "Plumbing")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "High", f"Water supply loss '{text}' must be High, got {priority}"

    def test_high_broken_locks_and_window_security(self):
        """Verify physical lock jams and broken windows trigger High."""
        test_cases = [
            ("Door lock jammed and students cannot lock room from inside", "Security"),
            ("Room door broken and latch will not close securely", "Security"),
            ("Lock broken on main balcony door", "Security"),
            ("Window broken with broken glass shards on sill", "Maintenance")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "High", f"Physical security '{text}' must be High, got {priority}"

    def test_high_wifi_outage_during_exams_and_deadlines(self):
        """Verify Wi-Fi outage combined with exams/deadlines triggers High."""
        test_cases = [
            ("Exam in two hours and no internet in the hostel", "Internet"),
            ("Submission deadline tonight but wifi down completely", "Internet"),
            ("No wifi connection down during online quiz test", "Internet"),
            ("Placement interview scheduled in 30 mins but internet down", "Internet")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "High", f"Exam wifi outage '{text}' must be High, got {priority}"

    def test_high_security_category_default(self):
        """Verify security category complaints elevate to High by default."""
        priority, reason = determine_priority("Suspicious person loitering near gate", "Security")
        assert priority == "High"
        assert "security category" in reason.lower()

    def test_high_electrical_category_baseline_default(self):
        """Verify unpatterned electrical issues default to High priority baseline."""
        priority, reason = determine_priority("Strange intermittent humming sound from conduit", "Electrical")
        assert priority == "High"
        assert "electrical issue defaults to high" in reason.lower()


# ==============================================================================
# 3. MEDIUM PRIORITY TESTS (Ordinary Leaks, Single Fixtures, Standard Wi-Fi)
# ==============================================================================

class TestMediumPriority:
    """Tests for standard operational issues, routine maintenance, and non-critical repairs."""

    def test_medium_ordinary_water_leaks_not_critical(self):
        """
        CRITICAL NEGATIVE TEST (DISTINCTION):
        Ordinary leaks (dripping taps, minor leak) MUST NOT be classified as Critical.
        They must remain Medium.
        """
        ordinary_leaks = [
            ("Tap is leaking in bathroom sink", "Plumbing"),
            ("Dripping tap in washroom making constant noise", "Plumbing"),
            ("Leaking tap in common washroom", "Plumbing"),
            ("Water dripping from tap into the washbasin", "Plumbing"),
            ("Bathroom faucet leaking slowly", "Plumbing")
        ]
        for text, category in ordinary_leaks:
            priority, reason = determine_priority(text, category)
            assert priority == "Medium", (
                f"Ordinary leak '{text}' must be Medium (not Critical or High), got {priority}"
            )
            assert "standard maintenance" in reason.lower()

    def test_medium_fixtures_and_slow_drains(self):
        """Verify routine fixture repairs and slow drainage trigger Medium."""
        test_cases = [
            ("Ceiling fan not working on speed 3", "Electrical"),
            ("Study table light not working bulb fused", "Electrical"),
            ("Loose socket makes plug wobble", "Electrical"),
            ("Washbasin slow drain takes five minutes to empty", "Plumbing"),
            ("Bathroom sink clogged with hair and soap scum", "Plumbing")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "Medium", f"Fixture issue '{text}' must be Medium, got {priority}"

    def test_medium_general_wifi_and_furniture(self):
        """Verify slow internet without exams and broken study furniture trigger Medium."""
        test_cases = [
            ("Wifi slow and disconnecting periodically", "Internet"),
            ("High ping and poor signal in room corner", "Internet"),
            ("Study chair broken armrest", "Maintenance"),
            ("Cupboard broken latch inside wardrobe", "Maintenance"),
            ("Bed squeaking loudly whenever turning", "Maintenance")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "Medium", f"Standard repair '{text}' must be Medium, got {priority}"

    def test_medium_category_defaults(self):
        """Verify category defaults for Plumbing, Internet, and Maintenance."""
        assert determine_priority("Periodic water check requested", "Plumbing")[0] == "Medium"
        assert determine_priority("Routine network DNS update inquiry", "Internet")[0] == "Medium"
        assert determine_priority("Door stopper installation", "Maintenance")[0] == "Medium"


# ==============================================================================
# 4. LOW PRIORITY TESTS (Cosmetic, Minor Adjustments, Routine Cleaning)
# ==============================================================================

class TestLowPriority:
    """Tests for non-urgent aesthetic, cosmetic, and routine cleaning requests."""

    def test_low_cosmetic_defects(self):
        """Verify peeling paint, scratches, and stains trigger Low priority."""
        test_cases = [
            ("Paint peeling off the wall behind my desk", "Maintenance"),
            ("Paint chipped on door frame", "Maintenance"),
            ("Wall stain from tea splash near window", "Cleaning"),
            ("Minor cosmetic scratch on study table surface", "Maintenance")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "Low", f"Cosmetic issue '{text}' must be Low, got {priority}"
            assert "non-urgent aesthetic" in reason.lower()

    def test_low_minor_squeaks_and_cleaning(self):
        """Verify squeaky doors, mirror smudges, and routine cleaning trigger Low."""
        test_cases = [
            ("Squeaky door makes minor noise when opening", "Maintenance"),
            ("Curtain rod slightly tilted", "Maintenance"),
            ("Mirror smudge in bathroom", "Cleaning"),
            ("Routine cleaning requested for floor dust", "Cleaning"),
            ("Room is dusty needs routine broom sweep", "Cleaning")
        ]
        for text, category in test_cases:
            priority, reason = determine_priority(text, category)
            assert priority == "Low", f"Minor adjustment '{text}' must be Low, got {priority}"

    def test_low_category_defaults(self):
        """Verify category defaults for Cleaning and Other."""
        assert determine_priority("Standard room dusting", "Cleaning")[0] == "Low"
        assert determine_priority("General query about laundry hours", "Other")[0] == "Low"


# ==============================================================================
# 5. INPUT SANITIZATION, EDGE CASES & NORMALIZATION
# ==============================================================================

class TestInputSanitizationAndEdgeCases:
    """Tests for robustness against invalid, empty, mixed-case, or malformed inputs."""

    def test_empty_string_handling(self):
        """Empty string must return Low without throwing exceptions."""
        priority, reason = determine_priority("", "Plumbing")
        assert priority == "Low"
        assert "empty or uninformative" in reason.lower()

    def test_whitespace_only_handling(self):
        """Whitespace-only string must return Low safely."""
        priority, reason = determine_priority("      ", "Electrical")
        assert priority == "Low"
        assert "empty or uninformative" in reason.lower()

    def test_none_input_handling(self):
        """None value passed as text must return Low without throwing AttributeError."""
        priority, reason = determine_priority(None, "Security")
        assert priority == "Low"
        assert "empty or uninformative" in reason.lower()

    def test_case_insensitivity_mixed_and_uppercase(self):
        """Engine must handle ALL CAPS, mixed case, and punctuation seamlessly."""
        cases = [
            ("SPARKS FLYING FROM SWITCHBOARD AND SMOKE", "ELECTRICAL", "Critical"),
            ("wAtEr LeAkInG nEaR eLeCtRiCaL sWiTcHbOaRd", "plumbing", "Critical"),
            ("MY LAPTOP WAS STOLEN FROM ROOM B-201!!!", "security", "Critical"),
            ("ROOM IS FLOODED WITH WATER!!!", "PLUMBING", "Critical"),
            ("TOTAL BLACKOUT ACROSS BLOCK", "ELECTRICAL", "High"),
            ("TAP IS LEAKING IN BATHROOM", "PLUMBING", "Medium"),
            ("PAINT PEELING IN CORNER", "MAINTENANCE", "Low")
        ]
        for text, cat, expected_priority in cases:
            priority, _ = determine_priority(text, cat)
            assert priority == expected_priority, f"Case insensitivity failed for '{text}', got {priority}"

    def test_punctuation_and_special_characters(self):
        """Ensure heavy punctuation and symbols do not break pattern matching."""
        priority, _ = determine_priority("!!! EMERGENCY !!! Fire & smoke detected in room #101 ???", "Electrical")
        assert priority == "Critical"

    def test_unknown_and_empty_category(self):
        """Unrecognized or empty category strings must gracefully fall back."""
        priority, _ = determine_priority("Unusual humming noise", "")
        assert priority == "Medium"
        priority, _ = determine_priority("Unusual humming noise", "UnknownCategoryXYZ")
        assert priority == "Medium"


# ==============================================================================
# 6. FALLBACK MECHANISM & SAFETY OVERRIDE
# ==============================================================================

class TestFallbackMechanism:
    """Tests for the documented fallback triage and safety override."""

    def test_fallback_ambiguous_text_assigned_low(self):
        """Unrecognized text with is_fallback=True defaults to Low triage."""
        priority, reason = determine_priority("asdfghjk qwerty xyz999", "Other", is_fallback=True)
        assert priority == "Low"
        assert "general or ambiguous complaint" in reason.lower()

    def test_fallback_empty_text_assigned_low(self):
        """Empty text with is_fallback=True defaults to Low triage."""
        priority, reason = determine_priority("", "Other", is_fallback=True)
        assert priority == "Low"
        assert "general or ambiguous complaint" in reason.lower()

    def test_safety_override_preserves_critical_on_fallback(self):
        """
        LIFE-SAFETY PROTOCOL:
        Even if ML confidence was low (is_fallback=True), life hazards like
        fire, sparks, water on switchboard, or stolen property MUST trigger Critical.
        """
        hazard_cases = [
            ("unusual burning smoke and fire sparks", "Other"),
            ("water leaking near electrical switchboard in hallway", "Other"),
            ("laptop stolen and room burglary reported", "Other"),
            ("room is flooded with burst pipe", "Other")
        ]
        for text, cat in hazard_cases:
            priority, reason = determine_priority(text, cat, is_fallback=True)
            assert priority == "Critical", f"Hazard '{text}' failed to override fallback! Got {priority}"
            assert "immediate hazard" in reason.lower() or "emergency" in reason.lower()


# ==============================================================================
# 7. REGRESSION AND BUG-FIX VERIFICATION
# ==============================================================================

class TestBugFixRegressions:
    """Explicit regression tests verifying all 6 identified defects remain permanently fixed."""

    def test_regression_bug1_water_near_electrical_is_critical(self):
        """Bug 1: Water near electrical was High; now Critical."""
        p, _ = determine_priority("Water leaking near an electrical switchboard", "Electrical")
        assert p == "Critical"

    def test_regression_bug2_theft_and_stolen_laptop_is_critical(self):
        """Bug 2: Stolen belongings / theft was missed by 'thief' regex; now Critical."""
        p1, _ = determine_priority("Laptop stolen from room", "Security")
        p2, _ = determine_priority("Theft in room 102", "Security")
        assert p1 == "Critical"
        assert p2 == "Critical"

    def test_regression_bug3_flooded_room_is_critical(self):
        """Bug 3: Simple 'room is flooded' was missed by 'massive flood'; now Critical."""
        p, _ = determine_priority("Room is flooded", "Plumbing")
        assert p == "Critical"

    def test_regression_bug4_pipe_has_burst_is_critical(self):
        """Bug 4: 'Pipe has burst' missed 'pipe burst'; now Critical."""
        p, _ = determine_priority("Water pipe has burst", "Plumbing")
        assert p == "Critical"

    def test_regression_bug5_ordinary_leaks_remain_medium(self):
        """Bug 5: Ordinary tap leaks must remain Medium, never accidentally Critical."""
        p, _ = determine_priority("Tap is leaking", "Plumbing")
        assert p == "Medium"

    def test_regression_bug6_empty_and_none_inputs_handled_safely(self):
        """Bug 6: None, empty string, and whitespace must not crash; returns safe Low."""
        assert determine_priority(None, "Plumbing")[0] == "Low"
        assert determine_priority("", "Plumbing")[0] == "Low"
        assert determine_priority("   ", "Plumbing")[0] == "Low"
