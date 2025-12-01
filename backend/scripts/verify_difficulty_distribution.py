"""
Verify difficulty distribution after auto-labeling
Kiểm tra phân bố độ khó sau khi gán nhãn tự động
"""

import json
import os
from collections import Counter
from typing import Dict, List

def analyze_chapter(filepath: str, chapter_name: str) -> Dict:
    """Analyze difficulty distribution for one chapter."""
    with open(filepath, "r", encoding="utf-8") as f:
        questions = json.load(f)
    
    difficulties = []
    labels = []
    
    for q in questions:
        answer = q.get("answer", {})
        diff_num = answer.get("difficulty_number")
        diff_label = answer.get("difficulty_level")
        
        if diff_num:
            difficulties.append(diff_num)
        if diff_label:
            labels.append(diff_label)
    
    return {
        "name": chapter_name,
        "total": len(questions),
        "numbers": Counter(difficulties),
        "labels": Counter(labels),
    }

def main():
    """Main function to analyze all chapters."""
    print("\n" + "="*80)
    print("📊 DIFFICULTY DISTRIBUTION ANALYSIS")
    print("="*80 + "\n")
    
    base_dir = os.path.join(os.path.dirname(__file__), "..", "artifacts", "production")
    
    chapters = [
        ("chuong_1.json", "Chương I: Mệnh đề và Tập hợp"),
        ("chuong_2.json", "Chương II: Bất phương trình"),
        ("chuong_3.json", "Chương III: Góc lượng giác"),
        ("chuong_4.json", "Chương IV: Vectơ"),
        ("chuong_5.json", "Chương V: Đường thẳng & tròn"),
    ]
    
    all_stats = []
    total_all = 0
    total_numbers = Counter()
    total_labels = Counter()
    
    for filename, chapter_name in chapters:
        filepath = os.path.join(base_dir, filename)
        if not os.path.exists(filepath):
            print(f"⚠️  File not found: {filepath}")
            continue
        
        stats = analyze_chapter(filepath, chapter_name)
        all_stats.append(stats)
        
        total_all += stats["total"]
        total_numbers.update(stats["numbers"])
        total_labels.update(stats["labels"])
        
        # Print chapter stats
        print(f"{'─'*80}")
        print(f"📚 {chapter_name}")
        print(f"{'─'*80}")
        print(f"Total: {stats['total']} questions\n")
        
        # By number
        print("By Number (1-5):")
        for num in sorted(stats["numbers"].keys()):
            count = stats["numbers"][num]
            pct = count / stats["total"] * 100 if stats["total"] > 0 else 0
            bar = "█" * int(pct / 2)
            print(f"  {num}: {bar:25s} {count:3d} ({pct:5.1f}%)")
        
        # By label
        print("\nBy Label:")
        label_order = ["easy", "medium", "hard", "very_hard"]
        label_emoji = {"easy": "🟢", "medium": "🟡", "hard": "🔴", "very_hard": "🔴🔴"}
        for label in label_order:
            count = stats["labels"].get(label, 0)
            pct = count / stats["total"] * 100 if stats["total"] > 0 else 0
            emoji = label_emoji.get(label, "⚪")
            bar = "█" * int(pct / 2)
            print(f"  {emoji} {label:10s}: {bar:25s} {count:3d} ({pct:5.1f}%)")
        
        print()
    
    # Overall summary
    print("\n" + "="*80)
    print("📊 OVERALL SUMMARY (ALL CHAPTERS)")
    print("="*80)
    print(f"Total: {total_all} questions\n")
    
    print("By Number (1-5):")
    for num in sorted(total_numbers.keys()):
        count = total_numbers[num]
        pct = count / total_all * 100 if total_all > 0 else 0
        bar = "█" * int(pct / 2)
        print(f"  {num}: {bar:25s} {count:3d} ({pct:5.1f}%)")
    
    print("\nBy Label:")
    label_order = ["easy", "medium", "hard", "very_hard"]
    label_emoji = {"easy": "🟢", "medium": "🟡", "hard": "🔴", "very_hard": "🔴🔴"}
    for label in label_order:
        count = total_labels.get(label, 0)
        pct = count / total_all * 100 if total_all > 0 else 0
        emoji = label_emoji.get(label, "⚪")
        bar = "█" * int(pct / 2)
        print(f"  {emoji} {label:10s}: {bar:25s} {count:3d} ({pct:5.1f}%)")
    
    # Target vs Actual
    print("\n" + "─"*80)
    print("🎯 TARGET vs ACTUAL")
    print("─"*80)
    
    targets = {"easy": 20, "medium": 40, "hard": 30, "very_hard": 10}
    
    print(f"{'Label':<15} {'Target':<15} {'Actual':<15} {'Diff':<10}")
    print("─"*55)
    
    for label in label_order:
        target_pct = targets.get(label, 0)
        actual_count = total_labels.get(label, 0)
        actual_pct = actual_count / total_all * 100 if total_all > 0 else 0
        diff = actual_pct - target_pct
        
        emoji = label_emoji.get(label, "⚪")
        status = "✅" if abs(diff) < 5 else "⚠️" if abs(diff) < 10 else "❌"
        
        print(f"{emoji} {label:<12} {target_pct:>5.1f}%         {actual_pct:>5.1f}%         {status} {diff:+.1f}%")
    
    print("\n" + "="*80)
    print("✅ Analysis complete!")
    print("="*80 + "\n")

if __name__ == "__main__":
    main()

