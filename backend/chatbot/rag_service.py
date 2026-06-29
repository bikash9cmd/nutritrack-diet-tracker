"""
RAG (Retrieval-Augmented Generation) service.
Uses OpenAI embeddings to retrieve relevant nutrition knowledge,
then GPT-4 to generate personalised answers.
"""
import json
import numpy as np
from openai import OpenAI
from django.conf import settings

client = OpenAI(api_key=settings.OPENAI_API_KEY)

# ── Nutrition knowledge base ──────────────────────────────────────────────────
KNOWLEDGE_BASE = [
    {
        "id": "protein_basics",
        "text": "Protein is essential for muscle repair and growth. Adults should consume 0.8g per kg of body weight daily as a minimum. Athletes may need 1.6–2.2g per kg. Good sources include chicken breast, eggs, Greek yogurt, lentils, and tofu.",
    },
    {
        "id": "calorie_deficit",
        "text": "A calorie deficit of 500 kcal/day typically leads to ~0.5 kg of fat loss per week. Deficits larger than 1000 kcal/day risk muscle loss and nutritional deficiencies. A safe, sustainable deficit is 300–500 kcal below your TDEE.",
    },
    {
        "id": "carbohydrates",
        "text": "Carbohydrates are the primary energy source. Complex carbs (oats, brown rice, sweet potato) provide sustained energy and fibre. Simple carbs (sugar, white bread) cause rapid blood sugar spikes. Aim for 45–65% of calories from carbs, preferring complex sources.",
    },
    {
        "id": "healthy_fats",
        "text": "Dietary fat supports hormone production, vitamin absorption, and brain health. Unsaturated fats (avocado, olive oil, nuts, fatty fish) are heart-healthy. Limit saturated fat to <10% of calories and avoid trans fats entirely.",
    },
    {
        "id": "hydration",
        "text": "Water intake should be approximately 35 ml per kg of body weight per day. Dehydration of just 2% can impair physical and cognitive performance. Thirst is a late indicator; monitor urine colour (pale yellow = well hydrated).",
    },
    {
        "id": "meal_timing",
        "text": "Eating protein within 2 hours post-workout supports muscle protein synthesis. For fat loss, meal timing matters less than total daily calories. Breakfast skipping is fine if total nutrition goals are met; avoid eating within 2–3 hours of bedtime for better sleep.",
    },
    {
        "id": "micronutrients",
        "text": "Key micronutrients: Iron (red meat, spinach) prevents fatigue; Calcium (dairy, leafy greens) supports bone density; Vitamin D (sunlight, fatty fish) regulates calcium absorption; B12 (animal products or supplements) is vital for nerve function.",
    },
    {
        "id": "fibre",
        "text": "Dietary fibre promotes gut health, reduces cholesterol, and supports satiety. Adults need 25–38g per day. High-fibre foods include legumes, whole grains, vegetables, and fruits. Increase fibre intake gradually to avoid bloating.",
    },
    {
        "id": "weight_plateau",
        "text": "Weight loss plateaus occur when metabolism adapts to a lower calorie intake. Strategies to break a plateau: increase NEAT (non-exercise activity), add 1–2 strength sessions per week, do a 1–2 week diet break at maintenance calories, or track food intake more precisely.",
    },
    {
        "id": "muscle_gain",
        "text": "Building muscle requires a calorie surplus of 200–400 kcal/day combined with progressive resistance training. Protein intake of 1.6–2.2g/kg is critical. Adequate sleep (7–9 hours) and recovery are as important as training stimulus.",
    },
    {
        "id": "intermittent_fasting",
        "text": "Intermittent fasting (16:8 method) restricts eating to an 8-hour window. Research shows it can aid fat loss primarily by reducing overall calorie intake, not through metabolic magic. It works best for people who find it easy to skip breakfast.",
    },
    {
        "id": "sugar",
        "text": "WHO recommends free sugar intake below 10% of total daily energy (ideally <5%). Excess sugar is linked to obesity, type 2 diabetes, and dental caries. Natural sugars in whole fruits are less problematic due to fibre content slowing absorption.",
    },
]

# Cache embeddings so we don't re-embed on every request
_embeddings_cache: dict = {}


def _get_embedding(text: str) -> list[float]:
    """Fetch embedding from OpenAI, with simple in-process cache."""
    if text in _embeddings_cache:
        return _embeddings_cache[text]
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    vec = response.data[0].embedding
    _embeddings_cache[text] = vec
    return vec


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


def retrieve_relevant_chunks(query: str, top_k: int = 3) -> list[dict]:
    """Embed the query and return top-k most relevant knowledge chunks."""
    query_vec = _get_embedding(query)
    scored = []
    for chunk in KNOWLEDGE_BASE:
        chunk_vec = _get_embedding(chunk["text"])
        score = _cosine_similarity(query_vec, chunk_vec)
        scored.append((score, chunk))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k]]


def build_system_prompt(user, retrieved_chunks: list[dict]) -> str:
    """Build a personalised system prompt with retrieved context."""
    profile_str = ""
    if user.is_authenticated:
        profile_str = f"""
User profile:
- Goal: {user.get_goal_display() if hasattr(user, 'get_goal_display') else user.goal}
- Daily calorie target: {user.daily_calorie_target or 'not set'} kcal
- Weight: {user.weight_kg or 'unknown'} kg
- Activity level: {user.activity_level}
"""

    context_str = "\n\n".join(
        f"[{c['id']}] {c['text']}" for c in retrieved_chunks
    )

    return f"""You are NutriBot, an expert AI nutrition assistant embedded in a diet tracking application.
Be concise, evidence-based, and encouraging. Always personalise advice to the user's profile.
Never provide medical diagnoses or replace professional medical advice.

{profile_str}

Relevant nutrition knowledge retrieved for this query:
{context_str}

Use the above knowledge to ground your response, but also draw on broader nutrition science.
Format your response clearly. Use bullet points where helpful. Keep answers under 200 words unless asked for more detail."""


def chat_with_rag(user, message: str, conversation_history: list[dict]) -> str:
    """
    Full RAG pipeline:
    1. Retrieve relevant chunks from knowledge base.
    2. Build a personalised system prompt.
    3. Call GPT-4 with conversation history.
    """
    relevant_chunks = retrieve_relevant_chunks(message, top_k=3)
    system_prompt = build_system_prompt(user, relevant_chunks)

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history[-10:])  # Keep last 10 turns
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
        temperature=0.7,
        max_tokens=500,
    )
    return response.choices[0].message.content
