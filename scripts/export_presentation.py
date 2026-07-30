#!/usr/bin/env python3
"""Render presentation slides for the static website and extract slide text."""

from __future__ import annotations

import argparse
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image


DRAWING_NS = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}

IMAGE_SLIDE_DESCRIPTIONS = {
    10: "Original 1977 hand-drawn plot map and handwritten tree census ledger",
    11: "Original hand-drawn quadrat maps recording numbered trees and plot features",
    13: "Early San Emilio research papers on leafcutter ants and lianas",
    19: "Three field photographs showing San Emilio leaves, understory, and woody vegetation",
    29: "Three long-term San Emilio studies on forest composition, drought, and remote sensing",
    45: "San Emilio field teams and a researcher measuring a large tree trunk",
}


def chapter_for(slide_number: int) -> str:
    if slide_number <= 5:
        return "Introduction"
    if slide_number <= 13:
        return "Plot history"
    if slide_number <= 22:
        return "Census and methods"
    if slide_number <= 32:
        return "Forest change"
    if slide_number <= 40:
        return "Traits and drought"
    return "Conclusions"


def natural_key(path: str) -> int:
    match = re.search(r"slide(\d+)\.xml$", path)
    return int(match.group(1)) if match else 0


def extract_slide_text(pptx_path: Path) -> list[list[str]]:
    with zipfile.ZipFile(pptx_path) as archive:
        slide_paths = sorted(
            (
                name
                for name in archive.namelist()
                if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)
            ),
            key=natural_key,
        )
        slide_text = []
        for slide_path in slide_paths:
            root = ET.fromstring(archive.read(slide_path))
            text = [node.text.strip() for node in root.findall(".//a:t", DRAWING_NS) if node.text and node.text.strip()]
            slide_text.append(text)
        return slide_text


def title_from_text(slide_number: int, text: list[str]) -> str:
    for candidate in text:
        normalized = " ".join(candidate.split())
        if len(normalized) >= 4 and not normalized.isdigit():
            if len(normalized) <= 120:
                return normalized
            return normalized[:117].rsplit(" ", 1)[0] + "..."
    return IMAGE_SLIDE_DESCRIPTIONS.get(slide_number, f"San Emilio research presentation, slide {slide_number}")


def render_slides(pdf_path: Path, output_dir: Path, width: int, thumbnail_width: int) -> int:
    slides_dir = output_dir / "slides"
    thumbnails_dir = output_dir / "thumbnails"
    slides_dir.mkdir(parents=True, exist_ok=True)
    thumbnails_dir.mkdir(parents=True, exist_ok=True)

    document = pdfium.PdfDocument(str(pdf_path))
    for index in range(len(document)):
        page = document[index]
        page_width, _ = page.get_size()
        image = page.render(scale=width / page_width).to_pil().convert("RGB")
        slide_name = f"slide-{index + 1:02d}.webp"
        image.save(slides_dir / slide_name, "WEBP", quality=84, method=6)

        thumbnail_height = round(image.height * thumbnail_width / image.width)
        thumbnail = image.resize((thumbnail_width, thumbnail_height), Image.Resampling.LANCZOS)
        thumbnail.save(thumbnails_dir / slide_name, "WEBP", quality=72, method=6)

    return len(document)


def write_metadata(pptx_path: Path, output_dir: Path, slide_count: int) -> None:
    extracted_text = extract_slide_text(pptx_path)
    if len(extracted_text) != slide_count:
        raise RuntimeError(f"PPTX contains {len(extracted_text)} slides but PDF contains {slide_count} pages")

    metadata = []
    for index, text in enumerate(extracted_text, start=1):
        title = title_from_text(index, text)
        transcript = " ".join(dict.fromkeys(" ".join(value.split()) for value in text)) or IMAGE_SLIDE_DESCRIPTIONS.get(index, "")
        metadata.append(
            {
                "number": index,
                "title": title,
                "chapter": chapter_for(index),
                "src": f"assets/presentation/slides/slide-{index:02d}.webp",
                "thumbnail": f"assets/presentation/thumbnails/slide-{index:02d}.webp",
                "alt": f"Slide {index}: {title}",
                "transcript": transcript,
            }
        )

    data_dir = output_dir.parent.parent / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "slides.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pptx", type=Path, required=True)
    parser.add_argument("--pdf", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--width", type=int, default=1600)
    parser.add_argument("--thumbnail-width", type=int, default=320)
    args = parser.parse_args()

    count = render_slides(args.pdf, args.output, args.width, args.thumbnail_width)
    write_metadata(args.pptx, args.output, count)
    print(f"Rendered {count} slides to {args.output}")


if __name__ == "__main__":
    main()