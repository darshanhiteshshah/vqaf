from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import re
from datetime import datetime
from gemini_evaluator import evaluate_call
from embedding_service import get_embedding

app = FastAPI()

class ScoreRequest(BaseModel):
    transcript: List[Dict[str, Any]]
    metrics: Dict[str, Any]
    callId: str
    agentId: str

class SearchRequest(BaseModel):
    query: str


def analyze_agent_quality(agent_text: str) -> Dict[str, float]:
    """Detailed agent speech analysis"""
    if not agent_text:
        return {"clarity": 50, "courtesy": 50, "professionalism": 50, "fillers": 0, "courtesyWords": 0, "empathyPhrases": 0}
    
    # Fillers hurt clarity
    fillers = len(re.findall(r'\b(um|uh|like|you know|so|actually)\b', agent_text.lower()))
    filler_penalty = min(fillers * 3, 30)
    
    # Courtesy words boost score
    courtesy_words = re.findall(r'\b(thank|please|sorry|appreciate|certainly|happy to|welcome|apolog)\b', agent_text.lower())
    courtesy_bonus = min(len(courtesy_words) * 6, 25)
    
    # Professional greetings
    greetings = re.findall(r'\b(hello|hi|good morning|good afternoon|how may I|this is|speaking)\b', agent_text.lower())
    professional_bonus = min(len(greetings) * 8, 20)
    
    # Empathy phrases
    empathy = re.findall(r'\b(understand|I see|makes sense|hear you|frustrat)\b', agent_text.lower())
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
        "empathyPhrases": len(empathy)
    }

def analyze_customer_sentiment(customer_text: str) -> Dict[str, Any]:
    """Analyze customer satisfaction indicators"""
    if not customer_text:
        return {"satisfaction": 50, "frustration": False, "positiveWords": 0, "negativeWords": 0}
    
    # Positive indicators
    positive = re.findall(r'\b(thank|thanks|great|good|perfect|appreciate|helpful|solved)\b', customer_text.lower())
    
    # Negative indicators
    negative = re.findall(r'\b(frustrated|angry|unacceptable|terrible|awful|bad|upset|annoyed)\b', customer_text.lower())
    
    satisfaction = 70 + len(positive) * 5 - len(negative) * 8
    satisfaction = max(20, min(95, satisfaction))
    
    return {
        "satisfaction": round(satisfaction, 1),
        "frustration": len(negative) > 2,
        "positiveWords": len(positive),
        "negativeWords": len(negative)
    }


def safe_score(value, default=80):
    try:
        value = float(value)

        # Gemini sometimes returns 1-5 ratings
        if 0 < value <= 5:
            return round(value * 20, 1)

        return round(max(0, min(100, value)), 1)
    except (TypeError, ValueError):
        return float(default)


@app.post("/score")
async def score_call(request: ScoreRequest):
    try:
        print(f"⚖️ Scoring {request.callId} ({request.agentId})")
        
        if not request.transcript:
            raise HTTPException(400, "Missing transcript")
        
        # Separate agent/customer text
        agent_segments = [s for s in request.transcript if s.get("speaker") == "AGENT"]
        customer_segments = [s for s in request.transcript if s.get("speaker") == "CUSTOMER"]
        
        agent_text = " ".join([s.get("text", "") for s in agent_segments])
        customer_text = " ".join([s.get("text", "") for s in customer_segments])
        conversation=""
        full_transcript=""
        for seg in request.transcript:
            speaker = seg.get("speaker", "UNKNOWN")
            text = seg.get("text", "")
            conversation += f"{speaker}: {text}\n"

            full_transcript += (
                f"{speaker}: {text}\n"
            )

        try:
            gemini_result = evaluate_call(full_transcript)

            print("\n🧠 GEMINI RESPONSE:")
            print(gemini_result)
            print()

        except Exception as e:
            print(f"⚠️ Gemini failed: {e}")
            gemini_result = {}

        search_text = f"""
Transcript:
{full_transcript}

Category:
{gemini_result.get("category", "")}

Sentiment:
{gemini_result.get("sentiment", "")}

Summary:
{gemini_result.get("summary", "")}

Critical Issues:
{" ".join(gemini_result.get("criticalIssues", []))}

Weaknesses:
{" ".join(gemini_result.get("weaknesses", []))}
"""

        try:

            embedding = get_embedding(
                search_text
            )

            print(
                f"🔍 Embedding generated: {len(embedding)} dimensions"
            )

        except Exception as e:

            print(
                f"⚠️ Embedding failed: {e}"
            )

            embedding = []

        print(f"📊 Agent segments: {len(agent_segments)} | Customer segments: {len(customer_segments)}")
        
        # Analyze agent performance
        agent_quality = analyze_agent_quality(agent_text)
        
        # Analyze customer sentiment
        customer_sentiment = analyze_customer_sentiment(customer_text)
        
        # FIX: Get metrics with correct key names
        total_duration=float(
            request.metrics.get("total_duration")
            or request.metrics.get("totalDuration")
            or request.metrics.get("duration")
            or 0
        )
        agent_talk_time = float(
            request.metrics.get("agent_speaking_time")
            or request.metrics.get("agentSeconds")
            or 0
        )

        customer_talk_time = float(
            request.metrics.get("customer_speaking_time")
            or request.metrics.get("customerSeconds")
            or 0
        )
        
        # FIX: Calculate talk ratio correctly
        agent_talk_ratio = (agent_talk_time / max(total_duration, 0.1)) * 100 if total_duration > 0 else 0
        
        # Talk balance score (ideal 40-60%)
        talk_balance_score = 100
        if agent_talk_ratio < 35:
            talk_balance_score = max(40, 60 + (agent_talk_ratio / 35 * 40))
        elif agent_talk_ratio > 70:
            talk_balance_score = max(40, 100 - ((agent_talk_ratio - 70) / 30 * 50))
        
        # Efficiency (based on resolution indicators)
        resolution_keywords = len(re.findall(r'\b(resolved|solved|fixed|helped|completed|done)\b', agent_text.lower()))
        efficiency_score = min(95, 70 + resolution_keywords * 8)
        
        # Resolution quality
        resolution_score = 75
        if "problem" in customer_text.lower() or "issue" in customer_text.lower():
            if any(word in agent_text.lower() for word in ["resolved", "solved", "fixed"]):
                resolution_score += 15
        if customer_sentiment["satisfaction"] > 70:
            resolution_score += 10
        resolution_score = min(95, resolution_score)

        greeting = safe_score(gemini_result.get("greeting", 80))

        professionalism = safe_score(
            gemini_result.get(
                "professionalism",
                agent_quality["professionalism"]
            ),
            agent_quality["professionalism"]
        )

        empathy = safe_score(gemini_result.get("empathy", 80))

        resolution = safe_score(
            gemini_result.get(
                "resolution",
                resolution_score
            ),
            resolution_score
        )

        overall_score = round(
            (
                greeting * 0.15 +
                professionalism * 0.25 +
                empathy * 0.25 +
                resolution * 0.25 +
                agent_quality["clarity"] * 0.10
            ),
            1
        )
        
        # FIX: Smart flags with correct values
        flags = []
        if agent_talk_ratio > 75:
            flags.append(f"Agent dominates conversation ({agent_talk_ratio:.1f}%)")
        if agent_talk_ratio < 30:
            flags.append(f"Agent not engaging enough ({agent_talk_ratio:.1f}%)")
        if agent_quality["fillers"] > 5:
            flags.append(f"{agent_quality['fillers']} filler words detected")
        if agent_quality["courtesyWords"] == 0:
            flags.append("No courtesy words used")
        if len(agent_segments) == 0:
            flags.append("No agent speech detected")
        if len(customer_segments) == 0:
            flags.append("No customer speech detected")
        if customer_sentiment["frustration"]:
            flags.append("Customer frustration detected")
        # FIX: Use total_duration variable
        if total_duration < 5:
            flags.append(f"Very short call ({total_duration:.1f}s)")
        
        scores = {
            "callId": request.callId,
            "agentId": request.agentId,
            "timestamp": datetime.now().isoformat(),
            "overallScore": overall_score,
            "greeting": greeting,
            "professionalism": professionalism,
            "empathy": empathy,
            "resolution": resolution,
            "clarity": agent_quality["clarity"],
            "courtesy": agent_quality["courtesy"],
            "talkBalance": round(talk_balance_score, 1),
            "efficiency": round(efficiency_score, 1),
            "customerSatisfaction": customer_sentiment["satisfaction"],
            "customerFrustration": customer_sentiment["frustration"],
            "agentTalkRatio": round(agent_talk_ratio, 1),
            "agentTalkTime": round(agent_talk_time, 1),
            "customerTalkTime": round(customer_talk_time, 1),
            "totalDuration": round(total_duration, 1),
            "category": gemini_result.get("category", "Other"),
            "sentiment": gemini_result.get("sentiment", "Neutral"),
            "sentimentScore": safe_score(gemini_result.get("sentimentScore", 80), 80),
            "summary": gemini_result.get("summary", ""),
            "criticalIssues": gemini_result.get("criticalIssues", []),
            "fullTranscript": full_transcript,
            "searchText": search_text,
            "embedding": embedding,
            "actionItems": gemini_result.get("actionItems", []),
            "strengths": gemini_result.get("strengths", []),
            "weaknesses": gemini_result.get("weaknesses", []),
            "coaching": gemini_result.get("coaching", []),
            "flags": flags,
            "status": "scored"
        }
        
        print(f"✅ {overall_score:.1f}/100 | Agent: {agent_talk_ratio:.1f}% | Customer Sat: {customer_sentiment['satisfaction']:.1f} | Flags: {len(flags)}")
        return scores
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ QA Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, str(e))

@app.post("/embedding")
async def generate_embedding(request: SearchRequest):
    embedding = get_embedding(request.query)
    return {
        "embedding": embedding
    }

@app.get("/")
async def root():
    return {"status": "Speaker-aware QA Engine v3.1 (FIXED)", "port": 8001}
