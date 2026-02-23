import argparse
import sys
from pathlib import Path

import requests

BROWSER_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


def fetch_pdf(url: str, output: Path) -> None:
    session = requests.Session()
    session.headers["User-Agent"] = BROWSER_UA

    # Initial request to obtain Incapsula/Imperva WAF cookies
    session.get(url)

    resp = session.get(url)
    content_type = resp.headers.get("Content-Type", "")

    if "application/pdf" not in content_type:
        print(f"Error: expected PDF but got Content-Type: {content_type}", file=sys.stderr)
        print(f"Response body (first 500 chars):\n{resp.text[:500]}", file=sys.stderr)
        sys.exit(1)

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(resp.content)
    print(f"Saved {len(resp.content)} bytes -> {output}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fetch a PDF behind Incapsula WAF")
    parser.add_argument("url", help="URL of the PDF")
    parser.add_argument("output", type=Path, help="Output file path")
    args = parser.parse_args()

    fetch_pdf(args.url, args.output)
