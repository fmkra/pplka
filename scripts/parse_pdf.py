#!/usr/bin/env python3
"""
Script to parse questions from PDF file and output as JSON.
The PDF contains a table with columns: id, external_id, question, answer_1, answer_2, answer_3, answer_4
"""

import json
import pdfplumber
from tqdm import tqdm
from pathlib import Path
import sys
import argparse


def parse_pdf(pdf_path: str) -> list[dict]:
    """
    Parse the PDF and extract questions from the table.
    
    Args:
        pdf_path: Path to the PDF file
        
    Returns:
        List of question dictionaries
    """
    questions = []
    current_question = None
    
    with pdfplumber.open(pdf_path) as pdf:
        for page in tqdm(pdf.pages, desc="Processing pages"):
            # Extract table from the page
            table = page.extract_table()
            
            if table is None:
                continue
            
            for row in table:
                # Skip header rows or empty rows
                if row is None or len(row) < 7:
                    continue
                
                # Skip header row (check if first cell contains "id" or similar)
                if row[0] and row[0].strip().lower() in ['id', 'lp', 'lp.', 'nr', 'l.p.']:
                    continue
                
                id_col = row[0].strip() if row[0] else ""
                external_id = row[1].strip() if row[1] else ""
                question = row[2].strip() if row[2] else ""
                answer_1 = row[3].strip() if row[3] else ""
                answer_2 = row[4].strip() if row[4] else ""
                answer_3 = row[5].strip() if row[5] else ""
                answer_4 = row[6].strip() if row[6] else ""
                
                # If id column has a value, this is a new question
                if id_col:
                    # Save the previous question if exists
                    if current_question is not None:
                        questions.append(current_question)
                    
                    # Start a new question
                    current_question = {
                        "id": id_col,
                        "external_id": external_id,
                        "question": question,
                        "answer_1": answer_1,
                        "answer_2": answer_2,
                        "answer_3": answer_3,
                        "answer_4": answer_4,
                    }
                else:
                    # This is a continuation of the previous question
                    if current_question is not None:
                        # Append text to existing fields (with space/newline separator)
                        if external_id:
                            current_question["external_id"] += " " + external_id
                        if question:
                            current_question["question"] += " " + question
                        if answer_1:
                            current_question["answer_1"] += " " + answer_1
                        if answer_2:
                            current_question["answer_2"] += " " + answer_2
                        if answer_3:
                            current_question["answer_3"] += " " + answer_3
                        if answer_4:
                            current_question["answer_4"] += " " + answer_4
        
        # Don't forget to add the last question
        if current_question is not None:
            questions.append(current_question)
    
    return questions


def clean_questions(questions: list[dict]) -> list[dict]:
    """
    Clean up the extracted questions by normalizing whitespace.
    """
    cleaned = []
    for q in questions:
        cleaned.append({
            "id": "".join(q["id"].replace(" ", "").split()),
            "external_id": "".join(q["external_id"].replace(" ", "").split()),
            "question": " ".join(q["question"].split()),
            "answer_1": " ".join(q["answer_1"].split()),
            "answer_2": " ".join(q["answer_2"].split()),
            "answer_3": " ".join(q["answer_3"].split()),
            "answer_4": " ".join(q["answer_4"].split()),
        })
    return cleaned


def main():

    parser = argparse.ArgumentParser(description="Extract questions from PDF and save as JSON.")
    parser.add_argument("input_pdf", help="Path to input PDF file")
    parser.add_argument("output_json", help="Path to output JSON file")

    args = parser.parse_args()

    script_dir = Path(__file__).parent
    pdf_path = Path(args.input_pdf)
    if not pdf_path.is_absolute():
        pdf_path = script_dir / pdf_path

    if not pdf_path.exists():
        print(f"Error: PDF file not found at {pdf_path}")
        return

    print(f"Parsing PDF: {pdf_path}")

    # Parse the PDF
    questions = parse_pdf(str(pdf_path))

    # Clean up the questions
    questions = clean_questions(questions)

    print(f"\nExtracted {len(questions)} questions")

    # Output as JSON
    output_path = Path(args.output_json)
    if not output_path.is_absolute():
        output_path = script_dir / output_path
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    print(f"Output saved to: {output_path}")


if __name__ == "__main__":
    main()
