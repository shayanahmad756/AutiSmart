"""
AutiSmart — Game Recommendation System
=======================================
Analyzes a child's autism assessment category scores to rank therapy games
by how much they address the child's specific problem areas.

Usage (standalone):
    python recommendation_system.py

Usage (import):
    from recommendation_system import calculate_recommendations
    results = calculate_recommendations(category_scores_dict)
"""

# ─── GAME → PROBLEM AREA MAPPING ──────────────────────────────────────────────
# Each game maps to the 2 autism categories it most directly addresses.
# Categories come from AssessmentResult.categoryScores in MongoDB:
#   "Eye Contact", "Social Interaction", "Communication",
#   "Repetitive Behavior", "Sensory Sensitivity", "Focus & Attention"

GAME_PROBLEM_MAP = {
    "Memory Match": {
        "id": 1,
        "categories": ["Focus & Attention", "Repetitive Behavior"],
        "description": "Match pairs of cards to improve memory and concentration",
        "route": "/games/memory-match",
        "icon": "🧩",
        "difficulty": "Easy",
    },
    "Sound Matching": {
        "id": 2,
        "categories": ["Sensory Sensitivity", "Communication"],
        "description": "Match sounds to images to improve auditory processing",
        "route": "/games/sound-matching",
        "icon": "🎵",
        "difficulty": "Easy",
    },
    "Color Matching": {
        "id": 10,
        "categories": ["Focus & Attention", "Sensory Sensitivity"],
        "description": "Match color names to tiles to improve color recognition",
        "route": "/games/color-matching",
        "icon": "🎨",
        "difficulty": "Easy",
    },
    "Emotion Explorer": {
        "id": 3,
        "categories": ["Eye Contact", "Social Interaction"],
        "description": "Recognize emotions to build social-emotional understanding",
        "route": "/games/emotion-explorer",
        "icon": "😊",
        "difficulty": "Medium",
    },
    "Communication Builder": {
        "id": 11,
        "categories": ["Communication", "Social Interaction"],
        "description": "Build 'I want ___' sentences with picture cards (PECS method)",
        "route": "/games/communication-builder",
        "icon": "💬",
        "difficulty": "Easy",
    },
}

# Severity threshold: a category with (score / total) above this value is treated
# as a problem area. 0.40 aligns with the "Beginner Level" boundary already used
# in AssessmentResult.js (≤40% → Beginner, meaning higher scores indicate more
# severe autism traits in that category).
SEVERITY_THRESHOLD = 0.40


# ─── CORE RECOMMENDATION FUNCTION ─────────────────────────────────────────────

def calculate_recommendations(category_scores: dict) -> list:
    """
    Calculate game recommendations based on a child's assessment category scores.

    Args:
        category_scores (dict): Maps category names to {"score": int, "total": int}.
            Example:
            {
                "Eye Contact":         {"score": 12, "total": 15},
                "Social Interaction":  {"score":  9, "total": 15},
                "Communication":       {"score":  5, "total": 15},
                "Repetitive Behavior": {"score": 11, "total": 15},
                "Sensory Sensitivity": {"score": 13, "total": 15},
                "Focus & Attention":   {"score":  7, "total": 15},
            }

    Returns:
        list[dict]: Games sorted by relevanceScore descending. Each item:
            - name            (str)   : Game name
            - id              (int)   : Game ID (matches frontend games array)
            - relevanceScore  (float) : 0.0–2.0, higher = more relevant
            - isRecommended   (bool)  : True if relevanceScore > 0
            - problemAreas    (list)  : Categories this game helps with that ARE problem areas
            - targetedCategories (list): All categories this game targets
            - description     (str)  : Game description
            - route           (str)  : Frontend route path
            - icon            (str)  : Emoji icon
            - difficulty      (str)  : Easy / Medium / Hard
    """
    # Step 1: Compute severity (0.0–1.0) for each assessed category
    severities = {}
    for category, data in category_scores.items():
        score = data.get("score", 0)
        total = data.get("total", 1)
        severities[category] = round(score / total, 4) if total > 0 else 0.0

    # Step 2: Score each game based on its targeted categories
    results = []
    for game_name, game_info in GAME_PROBLEM_MAP.items():
        relevance_score = 0.0
        problem_areas = []

        for category in game_info["categories"]:
            severity = severities.get(category, 0.0)
            if severity > SEVERITY_THRESHOLD:
                relevance_score += severity
                problem_areas.append(category)

        results.append({
            "name":               game_name,
            "id":                 game_info["id"],
            "relevanceScore":     round(relevance_score, 4),
            "isRecommended":      relevance_score > 0,
            "problemAreas":       problem_areas,
            "targetedCategories": game_info["categories"],
            "description":        game_info["description"],
            "route":              game_info["route"],
            "icon":               game_info["icon"],
            "difficulty":         game_info["difficulty"],
        })

    # Step 3: Sort by relevance score descending (most relevant game first)
    results.sort(key=lambda g: g["relevanceScore"], reverse=True)

    return results


# ─── PRETTY PRINT HELPER ───────────────────────────────────────────────────────

def print_recommendations(child_name: str, category_scores: dict, recommendations: list):
    """Pretty-print recommendation results to the terminal."""
    print(f"\n{'=' * 62}")
    print(f"  GAME RECOMMENDATIONS FOR: {child_name}")
    print(f"{'=' * 62}")

    if not category_scores:
        print("\n  ⚠  No assessment data available. Run an assessment first.\n")
        return

    print("\n📊  ASSESSMENT CATEGORY SCORES  (threshold = 40%):")
    for category, data in category_scores.items():
        score = data.get("score", 0)
        total = data.get("total", 1)
        severity = score / total if total > 0 else 0
        bar = "█" * int(severity * 20)
        flag = "  ⚠  PROBLEM AREA" if severity > SEVERITY_THRESHOLD else ""
        print(f"  {category:<24} {score:>2}/{total:<2}  ({severity:>4.0%})  {bar:<20}{flag}")

    print("\n🎮  RECOMMENDED GAMES  (sorted by relevance):")
    recommended_count = 0
    for i, game in enumerate(recommendations, 1):
        if game["isRecommended"]:
            tag = "★ RECOMMENDED"
            recommended_count += 1
        else:
            tag = "  available  "
        score_display = f"score: {game['relevanceScore']:.2f}" if game["isRecommended"] else "no match"
        print(f"\n  {i}. {game['icon']}  {game['name']:<24}  [{tag}]  ({score_display})")
        if game["problemAreas"]:
            print(f"      Helps with  : {', '.join(game['problemAreas'])}")
        print(f"      Description : {game['description']}")
        print(f"      Route       : {game['route']}")

    print(f"\n  → {recommended_count} of {len(recommendations)} games recommended based on problem areas.\n")


# ─── TEST / DEMO BLOCK ─────────────────────────────────────────────────────────

if __name__ == "__main__":

    # ── Example 1: Child with social & eye contact difficulties ─────────────
    scores_ahmed = {
        "Eye Contact":         {"score": 12, "total": 15},   # 80% ⚠ problem area
        "Social Interaction":  {"score": 10, "total": 15},   # 67% ⚠ problem area
        "Communication":       {"score":  4, "total": 15},   # 27% - low, not a problem
        "Repetitive Behavior": {"score": 11, "total": 15},   # 73% ⚠ problem area
        "Sensory Sensitivity": {"score":  5, "total": 15},   # 33% - low, not a problem
        "Focus & Attention":   {"score":  7, "total": 15},   # 47% ⚠ borderline
    }
    recs_ahmed = calculate_recommendations(scores_ahmed)
    print_recommendations("Ahmed (Social / Eye Contact issues)", scores_ahmed, recs_ahmed)

    # ── Example 2: Child with communication & sensory difficulties ──────────
    scores_sara = {
        "Eye Contact":         {"score":  4, "total": 15},   # 27% - low
        "Social Interaction":  {"score":  5, "total": 15},   # 33% - low
        "Communication":       {"score": 13, "total": 15},   # 87% ⚠ severe
        "Repetitive Behavior": {"score":  3, "total": 15},   # 20% - low
        "Sensory Sensitivity": {"score": 11, "total": 15},   # 73% ⚠ problem area
        "Focus & Attention":   {"score":  6, "total": 15},   # 40% - borderline
    }
    recs_sara = calculate_recommendations(scores_sara)
    print_recommendations("Sara (Communication / Sensory issues)", scores_sara, recs_sara)

    # ── Example 3: Child with all categories as problem areas ───────────────
    scores_ali = {
        "Eye Contact":         {"score": 13, "total": 15},   # 87% ⚠
        "Social Interaction":  {"score": 12, "total": 15},   # 80% ⚠
        "Communication":       {"score": 11, "total": 15},   # 73% ⚠
        "Repetitive Behavior": {"score": 10, "total": 15},   # 67% ⚠
        "Sensory Sensitivity": {"score":  9, "total": 15},   # 60% ⚠
        "Focus & Attention":   {"score":  8, "total": 15},   # 53% ⚠
    }
    recs_ali = calculate_recommendations(scores_ali)
    print_recommendations("Ali (All categories affected)", scores_ali, recs_ali)

    # ── Example 4: Child with no assessment (empty scores) ──────────────────
    scores_empty = {}
    recs_empty = calculate_recommendations(scores_empty)
    print_recommendations("New Child (no assessment yet)", scores_empty, recs_empty)
