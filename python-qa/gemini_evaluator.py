import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel("gemini-2.5-flash")


def evaluate_call(transcript_text):

    prompt = f"""
You are an expert call center QA evaluator.

Analyze the conversation below.

Return ONLY valid JSON.

Conversation:
{transcript_text}

Possible Categories:

- Order Placement
- Complaint
- Refund
- Billing
- Technical Support
- Cancellation
- Inquiry
- Other

Possible Sentiments:

- Positive
- Neutral
- Negative

Critical Issues:
Return only serious business-impacting mistakes.

Required JSON:

{{
  "greeting": 85,
  "professionalism": 85,
  "empathy": 85,
  "resolution": 85,

  "category": "Order Placement",

  "sentiment": "Positive",

  "sentimentScore": 80,

  "criticalIssues": [
    "Wrong customer email"
  ],

  "summary": "summary",

  "actionItems": [
    "action1"
  ],

  "strengths": [
    "strength1"
  ],

  "weaknesses": [
    "weakness1"
  ],

  "coaching": [
    "tip1"
  ]
}}
"""

    response = model.generate_content(prompt)

    text = response.text.strip()

    text = text.replace("```json", "")
    text = text.replace("```", "")

    return json.loads(text)