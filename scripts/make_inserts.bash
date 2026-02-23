#!/bin/bash

set -euo pipefail

cd scripts

mkdir -p data

echo
echo "=== Downloading PDFs (with WAF/Incapsula bypass) ==="
echo ">>> ppla"
python fetch_pdf.py "https://ulc.gov.pl/_download/personel_lotniczy/lke/ppla.pdf" "data/ppla.pdf"
echo ">>> bpl"
python fetch_pdf.py "https://ulc.gov.pl/_download/personel_lotniczy/lke/bpl.pdf" "data/bpl.pdf"
echo ">>> spl"
python fetch_pdf.py "https://ulc.gov.pl/_download/personel_lotniczy/lke/spl.pdf" "data/spl.pdf"
echo ">>> pplh"
python fetch_pdf.py "https://ulc.gov.pl/_download/personel_lotniczy/lkeang/pplh.pdf" "data/pplh.pdf"

echo
echo "=== Parsing PDFs into JSON ==="
echo
echo ">>> ppla"
python parse_pdf.py "data/ppla.pdf" "data/ppla.json"
echo
echo ">>> bpl"
python parse_pdf.py "data/bpl.pdf" "data/bpl.json"
echo
echo ">>> spl"
python parse_pdf.py "data/spl.pdf" "data/spl.json"
echo
echo ">>> pplh"
python parse_pdf.py "data/pplh.pdf" "data/pplh.json"

echo
echo "=== Combining questions ==="
python combine_questions.py

echo
echo "=== Generating inserts ==="
python generate_inserts.py
