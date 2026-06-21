import re
from typing import Any, Dict


def analyze_agent_quality(agent_text: str) -> Dict[str, float]:
    if not agent_text:
        return {
            "clarity": 50,
            "courtesy": 50,
            "professionalism": 50,
            "fillers": 0,
            "courtesyWords": 0,
            "empathyPhrases": 0,
        }

    fillers = len(re.findall(r"\b(um|uh|like|you know|so|actually)\b", agent_text.lower()))
    filler_penalty = min(fillers * 3, 30)

    courtesy_words = re.findall(
        r"\b(thank|please|sorry|appreciate|certainly|happy to|welcome|apolog)\b",
        agent_text.lower(),
    )
    courtesy_bonus = min(len(courtesy_words) * 6, 25)

    greetings = re.findall(
        r"\b(hello|hi|good morning|good afternoon|how may I|this is|speaking)\b",
        agent_text.lower(),
    )
    professional_bonus = min(len(greetings) * 8, 20)

    empathy = re.findall(r"\b(understand|I see|makes sense|hear you|frustrat)\b", agent_text.lower())
    empathy_bonus = min(len(empathy) * 5, 15)

    clarity = max(40, min(95, 85 - filler_penalty + courtesy_bonus * 0.2))
    courtesy = max(40, min(95, 65 + courtesy_bonus + empathy_bonus))
    professionalism = max(40, min(95, 70 + professional_bonus + courtesy_bonus * 0.3))

    return {
        "clarity": round(clarity, 1),
        "courtesy": round(courtesy, 1),
        "professionalism": round(professionalism, 1),
        "fillers": fillers,
        "courtesyWords": len(courtesy_words),
        "empathyPhrases": len(empathy),
    }


def analyze_customer_sentiment(customer_text: str) -> Dict[str, Any]:
    if not customer_text:
        return {"satisfaction": 50, "frustration": False, "positiveWords": 0, "negativeWords": 0}

    positive = re.findall(
        r"\b(thank|thanks|great|good|perfect|appreciate|helpful|solved)\b",
        customer_text.lower(),
    )
    negative = re.findall(
        r"\b(frustrated|angry|unacceptable|terrible|awful|bad|upset|annoyed)\b",
        customer_text.lower(),
    )

    satisfaction = 70 + len(positive) * 5 - len(negative) * 8
    satisfaction = max(20, min(95, satisfaction))

    return {
        "satisfaction": round(satisfaction, 1),
        "frustration": len(negative) > 2,
        "positiveWords": len(positive),
        "negativeWords": len(negative),
    }


def safe_score(value, default=80):
    try:
        value = float(value)

        if 0 < value <= 5:
            return round(value * 20, 1)

        return round(max(0, min(100, value)), 1)
    except (TypeError, ValueError):
        return float(default)


def build_score_explanations(
    *,
    greeting,
    professionalism,
    empathy,
    resolution,
    clarity,
    talk_balance,
    efficiency,
    agent_quality,
    customer_sentiment,
    agent_talk_ratio,
    gemini_result,
):
    explanations = {
        "greeting": "Greeting was scored from the opening quality and whether the agent introduced the conversation clearly.",
        "professionalism": "Professionalism reflects the QA model score plus courtesy and structured agent language.",
        "empathy": "Empathy reflects whether the agent acknowledged the customer and used supportive language.",
        "resolution": "Resolution reflects whether the conversation shows the issue was solved, escalated, or left unresolved.",
        "clarity": "Clarity is based on concise agent language and filler-word usage.",
        "talkBalance": "Talk balance compares agent speaking time with the ideal 40-60% range.",
        "efficiency": "Efficiency rewards resolution language and concise progress toward an outcome.",
        "overallScore": "Overall score is a weighted blend of greeting, professionalism, empathy, resolution, and clarity.",
    }

    if greeting < 70:
        explanations["greeting"] = "Greeting needs work: the opening appears weak, missing, or not clearly professional."

    if professionalism < 70:
        explanations["professionalism"] = "Professionalism needs work: courtesy, structure, or QA rubric signals were below target."

    if empathy < 70:
        explanations["empathy"] = "Empathy needs work: the call shows limited acknowledgement of the customer's concern."
    elif agent_quality["empathyPhrases"] > 0:
        explanations["empathy"] = f"Empathy is supported by {agent_quality['empathyPhrases']} acknowledgement phrase(s)."

    if resolution < 70:
        explanations["resolution"] = "Resolution needs work: the call does not clearly show the issue was solved."

    if agent_quality["fillers"] > 5:
        explanations["clarity"] = f"Clarity was reduced by {agent_quality['fillers']} filler words in agent speech."

    if agent_talk_ratio > 70:
        explanations["talkBalance"] = f"Talk balance is lower because the agent spoke for {agent_talk_ratio:.1f}% of the call."
    elif agent_talk_ratio < 35:
        explanations["talkBalance"] = f"Talk balance is lower because the agent spoke for only {agent_talk_ratio:.1f}% of the call."

    if customer_sentiment["frustration"]:
        explanations["overallScore"] = "Overall score is reduced because customer frustration was detected."

    if gemini_result.get("summary"):
        explanations["summary"] = gemini_result["summary"]

    return explanations
