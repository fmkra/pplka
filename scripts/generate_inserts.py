#!/usr/bin/env python3
"""
Generate SQL inserts for license, category, question, and question_instance.
All IDs are UUIDv5 (content-based) except license and category which use sequential integers.
"""

import json
import re
import uuid
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
QUESTIONS_FILE = SCRIPT_DIR / "data" / "questions.json"
LICENSES_FILE = SCRIPT_DIR / "licenses.json"
OUTPUT_FILE = SCRIPT_DIR / "data" / "inserts.sql"

# UUIDv5 namespace for deterministic IDs (arbitrary fixed UUID)
NAMESPACE = uuid.uuid5(uuid.NAMESPACE_OID, "pplka")

LICENSE_FIRST_ID = 1
CATEGORY_FIRST_ID = 1

TABLE_PREFIX = "nauka-ppla_"
LICENSE_TABLE = TABLE_PREFIX + "license"
CATEGORY_TABLE = TABLE_PREFIX + "category"
QUESTION_TABLE = TABLE_PREFIX + "question"
QUESTION_INSTANCE_TABLE = TABLE_PREFIX + "question_instance"


def sql_escape(s: str) -> str:
    """Escape single quotes for SQL."""
    return s.replace("'", "''")


def question_content_key(q: dict) -> str:
    """Key for question UUIDv5: external_id + question text + all answers (no licenses)."""
    parts = [
        q["external_id"],
        q["question"],
        q["answers"][0],
        q["answers"][1],
        q["answers"][2],
        q["answers"][3],
    ]
    return json.dumps(parts)


def main():
    with open(QUESTIONS_FILE, "r", encoding="utf-8") as f:
        questions = json.load(f)

    with open(LICENSES_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write("-- LICENSES\n\n")

        licenses = []
        for i, lic in enumerate(data["licenses"]):
            license_id = LICENSE_FIRST_ID + i
            licenses.append((license_id, lic["url"]))
            f.write(
                f'INSERT INTO "{LICENSE_TABLE}" (id, name, url, description, icon) '
                f"VALUES ({license_id}, '{sql_escape(lic['name'])}', '{sql_escape(lic['url'])}', "
                f"'{sql_escape(lic['description'])}', '{sql_escape(lic['icon'])}');\n"
            )

        f.write("\n\n-- CATEGORIES\n\n")

        cat_idx = 0
        category_ids = {}
        for category in data["categories"]:
            for license_id, license_url in licenses:
                category_id = CATEGORY_FIRST_ID + cat_idx
                cat_idx += 1
                category_ids[(category["url"], license_url)] = category_id
                exam_time = category["examTime"][license_url]
                exam_questions = category["examQuestions"][license_url]
                topics = "{" + ", ".join(f'"{t}"' for t in category["topics"]) + "}"
                f.write(
                    f'INSERT INTO "{CATEGORY_TABLE}" (id, name, url, color, description, "licenseId", '
                    f'"examTime", "examQuestionCount", icon, topics) VALUES '
                    f"({category_id}, '{sql_escape(category['name'])}', '{sql_escape(category['url'])}', "
                    f"'{sql_escape(category['color'])}', '{sql_escape(category['description'])}', "
                    f"{license_id}, {exam_time}, {exam_questions}, '{sql_escape(category['icon'])}', '{topics}');\n"
                )

        f.write("\n\n-- QUESTIONS\n\n")

        # Unique questions by content key (same content => same id, one INSERT)
        question_ids = {}
        unique_questions = {}
        for q in questions:
            key = question_content_key(q)
            question_id = str(uuid.uuid5(NAMESPACE, key))
            question_ids[key] = question_id
            if key not in unique_questions:
                unique_questions[key] = q

        for q in unique_questions.values():
            key = question_content_key(q)
            question_id = question_ids[key]
            f.write(
                f'INSERT INTO "{QUESTION_TABLE}" (id, "externalId", question, "answerCorrect", '
                f'"answerIncorrect1", "answerIncorrect2", "answerIncorrect3") VALUES '
                f"('{question_id}', '{sql_escape(q['external_id'])}', '{sql_escape(q['question'])}', "
                f"'{sql_escape(q['answers'][0])}', '{sql_escape(q['answers'][1])}', "
                f"'{sql_escape(q['answers'][2])}', '{sql_escape(q['answers'][3])}');\n"
            )

        instance_inserts = []
        for q in questions:
            key = question_content_key(q)
            question_id = question_ids[key]
            category_url = None
            for category in data["categories"]:
                if re.match(category["externalIds"], q["external_id"]):
                    category_url = category["url"]
                    break
            if category_url is None:
                raise SystemExit(f"Question {q['external_id']} not in any category")

            for license_url in q["licenses"]:
                category_id = category_ids[(category_url, license_url)]
                instance_key = json.dumps([question_id, category_id])
                instance_id = str(uuid.uuid5(NAMESPACE, instance_key))
                instance_inserts.append(
                    f'INSERT INTO "{QUESTION_INSTANCE_TABLE}" (id, "categoryId", "questionId") '
                    f"VALUES ('{instance_id}', {category_id}, '{question_id}');\n"
                )

        f.write("\n\n-- QUESTION INSTANCES\n\n")
        f.writelines(instance_inserts)

    print(f"Wrote {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
