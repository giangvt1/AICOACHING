"""
AI-powered insights generation for learning analysis.
Generates personalized coaching messages and recommendations.
"""
from __future__ import annotations
from typing import List, Dict, Any, Optional
import os

# Try to import Gemini, fallback gracefully
try:
    import google.generativeai as genai
    HAVE_GEMINI = bool(os.getenv("GOOGLE_API_KEY"))
    if HAVE_GEMINI:
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
except ImportError:
    HAVE_GEMINI = False


def generate_analysis_insights(
    topics: List[Dict[str, Any]],
    student_profile: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Generate AI insights based on diagnostic analysis.
    
    Args:
        topics: List of topic summaries with mastery, classification, priority
        student_profile: Optional student info (goal_score, availability, etc)
        
    Returns:
        Dict with narrative, recommendations, and motivational content
    """
    if not topics:
        return _fallback_insights(topics, student_profile)
    
    if HAVE_GEMINI:
        try:
            return _generate_with_gemini(topics, student_profile)
        except Exception as e:
            print(f"Gemini insight generation failed: {e}")
            return _fallback_insights(topics, student_profile)
    else:
        return _fallback_insights(topics, student_profile)


def _generate_with_gemini(
    topics: List[Dict[str, Any]],
    student_profile: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate insights using Gemini AI"""
    
    # Prepare data summary
    weak_topics = [t for t in topics if t.get("classification") == "weak"]
    average_topics = [t for t in topics if t.get("classification") == "average"]
    strong_topics = [t for t in topics if t.get("classification") == "strong"]
    
    top_priority = topics[:3] if len(topics) >= 3 else topics
    
    goal_score = student_profile.get("goal_score", 8) if student_profile else 8
    
    # Build prompt
    prompt = f"""You are an encouraging AI learning coach for high school Math (Grade 10 Vietnam curriculum).

Student's goal: Score {goal_score}+ points

Analysis results:
- Strong topics ({len(strong_topics)}): {', '.join([t['topic_name'] for t in strong_topics[:3]])}
- Average topics ({len(average_topics)}): {', '.join([t['topic_name'] for t in average_topics[:3]])}
- Weak topics ({len(weak_topics)}): {', '.join([t['topic_name'] for t in weak_topics[:3]])}

Top 3 priority topics to focus on:
{chr(10).join([f"{i+1}. {t['topic_name']} - {t['percent']:.0f}% mastery (Priority: {t['priority_score']:.1f})" for i, t in enumerate(top_priority)])}

Generate a personalized learning insight with:
1. Overall assessment (2-3 sentences, be encouraging)
2. Why these topics are prioritized (explain the reasoning)
3. Specific actionable recommendations (3-4 recommendations)
4. Encouraging message

Format as JSON:
{{
    "overall_assessment": "string",
    "priority_reasoning": "string",
    "recommendations": ["rec1", "rec2", "rec3"],
    "encouragement": "string",
    "estimated_weeks": number
}}

Keep tone friendly, encouraging, and specific. Use Vietnamese context when relevant."""

    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    response = model.generate_content(prompt)
    text = response.text.strip()
    
    # Extract JSON from response
    import json
    # Try to find JSON in the response
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    
    try:
        insights = json.loads(text)
    except:
        # Fallback if JSON parsing fails
        insights = {
            "overall_assessment": text[:200],
            "priority_reasoning": "Based on diagnostic results and curriculum importance.",
            "recommendations": [
                f"Focus on {top_priority[0]['topic_name']}" if top_priority else "Complete diagnostic test",
                "Practice daily for 30-45 minutes",
                "Review weak areas regularly"
            ],
            "encouragement": "You're on the right track! Keep learning consistently.",
            "estimated_weeks": 4
        }
    
    # Add metadata
    insights["weak_count"] = len(weak_topics)
    insights["average_count"] = len(average_topics)
    insights["strong_count"] = len(strong_topics)
    insights["top_priority_topics"] = [t["topic_name"] for t in top_priority]
    insights["model_used"] = "gemini-2.0-flash-exp"
    
    return insights


def _fallback_insights(
    topics: List[Dict[str, Any]],
    student_profile: Optional[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate rule-based insights when AI is unavailable"""
    
    if not topics:
        return {
            "overall_assessment": "Chào bạn! Để tôi có thể tạo lộ trình học tập cá nhân hóa, hãy hoàn thành bài kiểm tra chẩn đoán trước nhé.",
            "priority_reasoning": "Bài kiểm tra chẩn đoán giúp xác định điểm mạnh và điểm yếu của bạn.",
            "recommendations": [
                "Hoàn thành bài kiểm tra chẩn đoán ở trang Diagnostic",
                "Khai báo thời gian rảnh trong tuần",
                "Xác định mục tiêu điểm số của bạn"
            ],
            "encouragement": "Hãy bắt đầu hành trình học tập của bạn! 🚀",
            "weak_count": 0,
            "average_count": 0,
            "strong_count": 0,
            "top_priority_topics": [],
            "estimated_weeks": 0,
            "model_used": "rule-based"
        }
    
    weak_topics = [t for t in topics if t.get("classification") == "weak"]
    average_topics = [t for t in topics if t.get("classification") == "average"]
    strong_topics = [t for t in topics if t.get("classification") == "strong"]
    
    top_priority = topics[:3] if len(topics) >= 3 else topics
    
    # Build assessment
    if len(strong_topics) > len(weak_topics):
        assessment = f"Kết quả tốt! Bạn đã nắm vững {len(strong_topics)} chuyên đề. "
    elif len(weak_topics) > len(strong_topics):
        assessment = f"Bạn có {len(weak_topics)} chuyên đề cần cải thiện, nhưng đừng lo! "
    else:
        assessment = "Bạn đang ở mức độ cân bằng. "
    
    assessment += f"Tôi đã phân tích và tạo lộ trình học tập phù hợp với trình độ hiện tại của bạn."
    
    # Priority reasoning
    if top_priority:
        reasoning = f"Tôi ưu tiên {top_priority[0]['topic_name']} đầu tiên vì: "
        if top_priority[0]['percent'] < 50:
            reasoning += "đây là chuyên đề bạn còn yếu nhất và cần củng cố ngay. "
        reasoning += "Chuyên đề này là nền tảng quan trọng cho các chủ đề khác."
    else:
        reasoning = "Dựa trên kết quả chẩn đoán, tôi đã sắp xếp thứ tự học tập từ yếu đến mạnh."
    
    # Recommendations
    recommendations = []
    if weak_topics:
        recommendations.append(f"Tập trung vào {weak_topics[0]['topic_name']} trước - đây là điểm yếu cần khắc phục ưu tiên")
    if len(weak_topics) > 1:
        recommendations.append(f"Sau đó học {weak_topics[1]['topic_name']} để củng cố nền tảng")
    recommendations.append("Học mỗi ngày 30-45 phút sẽ hiệu quả hơn học dồn")
    recommendations.append("Làm bài tập ngay sau khi học lý thuyết để ghi nhớ tốt hơn")
    
    if strong_topics:
        recommendations.append(f"Duy trì và nâng cao {strong_topics[0]['topic_name']} - đây là thế mạnh của bạn")
    
    # Encouragement
    goal = student_profile.get("goal_score", 8) if student_profile else 8
    encouragement = f"Với lộ trình này và sự kiên trì, bạn hoàn toàn có thể đạt mục tiêu {goal}+ điểm! Hãy bắt đầu ngay hôm nay! 💪"
    
    # Estimate weeks needed
    estimated_weeks = max(4, len(weak_topics) * 2 + len(average_topics))
    
    return {
        "overall_assessment": assessment,
        "priority_reasoning": reasoning,
        "recommendations": recommendations[:5],  # Top 5
        "encouragement": encouragement,
        "weak_count": len(weak_topics),
        "average_count": len(average_topics),
        "strong_count": len(strong_topics),
        "top_priority_topics": [t["topic_name"] for t in top_priority],
        "estimated_weeks": estimated_weeks,
        "model_used": "rule-based"
    }


def generate_daily_coaching_message(
    student_name: Optional[str] = None,
    completed_today: int = 0,
    streak_days: int = 0,
    next_topic: Optional[str] = None
) -> str:
    """Generate a daily coaching message for the dashboard"""
    
    import datetime
    hour = datetime.datetime.now().hour
    
    # Greeting based on time
    if hour < 12:
        greeting = "Chào buổi sáng"
    elif hour < 18:
        greeting = "Chào buổi chiều"
    else:
        greeting = "Chào buổi tối"
    
    name_part = f" {student_name}" if student_name else ""
    
    messages = []
    
    # Add greeting
    messages.append(f"{greeting}{name_part}! ")
    
    # Streak message
    if streak_days > 0:
        messages.append(f"🔥 Bạn đang có chuỗi {streak_days} ngày học liên tiếp! ")
    
    # Today's progress
    if completed_today > 0:
        messages.append(f"Hôm nay bạn đã hoàn thành {completed_today} buổi học. Tuyệt vời! ")
    else:
        if next_topic:
            messages.append(f"Sẵn sàng bắt đầu với {next_topic} chưa? ")
        else:
            messages.append("Hãy bắt đầu buổi học đầu tiên hôm nay! ")
    
    return "".join(messages)

