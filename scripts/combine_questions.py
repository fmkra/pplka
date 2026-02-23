#!/usr/bin/env python3
"""
Combine questions from multiple license JSON files, grouping by external_id.
Shows warnings if questions with the same external_id have different content.
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

FILES_DIR = Path(__file__).parent / "data"

replace_strings = [
    ('( ?C)', '(°C)'),
    (' ?', '?'),
    ('Północnoatlantyckieg o', 'Północnoatlantyckiego'),
    ('Północnoatlantyckie go', 'Północnoatlantyckiego'),
    ('<sup>°</sup>', '°'),
    ('/10 0m', '/100m'),
    ('/1 00m', '/100m'),
    ('Najodpowiedniejsz ą', 'Najodpowiedniejszą'),
    ('powietrze - ziemia', 'powietrze-ziemia')
]

def load_questions(file_path, license_name):
    """Load questions from a JSON file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    return questions, license_name


def normalize_text(text):
    """Normalize text for comparison (remove extra whitespace, etc.)."""
    if text is None:
        return ""
    normalized = " ".join(text.split())
    normalized = normalized.replace('–', '-')
    normalized = re.sub(r'(\w) -(\w)', r'\1-\2', normalized)
    normalized = re.sub(r'(\w)- (\w)', r'\1-\2', normalized)
    for (before, after) in replace_strings:
        normalized = normalized.replace(before, after)
    return normalized


def extract_answers(question):
    """Extract answers from a question object into a list."""
    answers = []
    for i in range(1, 5):
        answer_key = f"answer_{i}"
        if answer_key in question:
            answers.append(question[answer_key])
    return answers


def combine_questions():
    """Combine questions from all license files."""
    
    # Load all question files
    files = [
        (FILES_DIR / "ppla.json", "ppla"),
        (FILES_DIR / "pplh.json", "pplh"),
        (FILES_DIR / "bpl.json", "bpl"),
        (FILES_DIR / "spl.json", "spl"),
    ]
    
    all_questions = []
    for file_path, license_name in files:
        if not file_path.exists():
            print(f"Warning: {file_path} not found, skipping...", file=sys.stderr)
            continue
        questions, _ = load_questions(file_path, license_name)
        for q in questions:
            q['question'] = normalize_text(q['question'])
            q['answer_1'] = normalize_text(q['answer_1'])
            q['answer_2'] = normalize_text(q['answer_2'])
            q['answer_3'] = normalize_text(q['answer_3'])
            q['answer_4'] = normalize_text(q['answer_4'])
            q['_license'] = license_name
        all_questions.extend(questions)
    
    # Group by external_id
    grouped = defaultdict(lambda: {
        'external_id': None,
        'question': None,
        'answers': None,
        'licenses': [],
        '_raw_questions': []
    })
    
    warnings = []
    
    for q in all_questions:
        external_id = q.get('external_id')
        if not external_id:
            warnings.append(f"Warning: Question with id '{q.get('id')}' has no external_id, skipping...")
            continue
        
        question_text = q.get('question', '')
        answers = extract_answers(q)
        license_name = q.get('_license')
        
        if external_id not in grouped:
            grouped[external_id]['external_id'] = external_id
            grouped[external_id]['question'] = question_text
            grouped[external_id]['answers'] = answers
            grouped[external_id]['licenses'] = [license_name]
            grouped[external_id]['_raw_questions'].append(q)
        else:
            # Check for inconsistencies
            existing_question = grouped[external_id]['question']
            existing_answers = grouped[external_id]['answers']
            
            if existing_question != question_text:
                warnings.append(
                    f"Warning: external_id '{external_id}' has different question text:\n"
                    f"  License {grouped[external_id]['licenses']}: {existing_question[:100]}...\n"
                    f"  License {license_name}: {question_text[:100]}..."
                )
            
            if existing_answers != answers:
                warnings.append(
                    f"Warning: external_id '{external_id}' has different answers:\n"
                    f"  License {grouped[external_id]['licenses']}: {existing_answers}\n"
                    f"  License {license_name}: {answers}"
                )
            
            # Add license if not already present
            if license_name not in grouped[external_id]['licenses']:
                grouped[external_id]['licenses'].append(license_name)
            
            grouped[external_id]['_raw_questions'].append(q)
    
    # Convert to output format
    result = []
    for external_id in sorted(grouped.keys()):
        item = grouped[external_id]
        result.append({
            'external_id': item['external_id'],
            'question': item['question'],
            'answers': item['answers'],
            'licenses': item['licenses']
        })
    
    # Sort result by external_id to ensure proper ordering
    result.sort(key=lambda x: x['external_id'])
    
    # Print warnings
    if warnings:
        print("\n".join(warnings), file=sys.stderr)
        print(f"\nTotal warnings: {len(warnings)}", file=sys.stderr)
    
    return result


if __name__ == "__main__":
    combined = combine_questions()
    result = json.dumps(combined, ensure_ascii=False, indent=2)

    with open(FILES_DIR / "questions.json", "w", encoding="utf-8") as f:
        f.write(result)
