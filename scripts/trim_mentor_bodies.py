"""
One-off script: trim the transparent mentor PNGs down to their content bounding box
(plus a small margin) so the half-body chat-widget icon can show the character at
full size with no dead transparent space around it. The full-frame PNGs in
public/mentors/ are kept as-is for the circular avatars, which rely on their
consistent 1280x1280 coordinate space for the zoom/crop math.
Run with: python3 scripts/trim_mentor_bodies.py
"""
import glob
import os

from PIL import Image

SRC_DIR = "public/mentors"
OUT_DIR = "public/mentors/body"
MARGIN_FRAC = 0.03


def trim(path: str, out_path: str) -> None:
    im = Image.open(path)
    bbox = im.getbbox()
    if not bbox:
        raise ValueError(f"{path} has no visible content")

    left, top, right, bottom = bbox
    mx = int((right - left) * MARGIN_FRAC)
    my = int((bottom - top) * MARGIN_FRAC)
    left = max(0, left - mx)
    top = max(0, top - my)
    right = min(im.width, right + mx)
    bottom = min(im.height, bottom + my)

    im.crop((left, top, right, bottom)).save(out_path)
    print(f"{path} -> {out_path}")


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    for png_path in sorted(glob.glob(os.path.join(SRC_DIR, "*.png"))):
        out_path = os.path.join(OUT_DIR, os.path.basename(png_path))
        trim(png_path, out_path)
