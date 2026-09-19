"""
One-off script: turn the flattened white-background mentor JPGs into transparent PNGs
by flood-filling the near-white background region from the image border, leaving
white pixels fully enclosed inside the character (hair-shine highlights, eye whites)
untouched. Run with: python3 scripts/cutout_mentors.py
"""
import glob
import os

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC_DIR = "public/mentors"
WHITE_THRESHOLD = 232  # min per-channel value to count as "background-like"


def cutout(path: str, out_path: str) -> None:
    im = Image.open(path).convert("RGB")
    arr = np.array(im)

    is_light = np.all(arr >= WHITE_THRESHOLD, axis=2)

    labeled, _ = ndimage.label(is_light)
    border_labels = set(labeled[0, :]) | set(labeled[-1, :]) | set(labeled[:, 0]) | set(labeled[:, -1])
    border_labels.discard(0)

    background_mask = np.isin(labeled, list(border_labels))

    alpha = np.where(background_mask, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, mode="L").filter(ImageFilter.GaussianBlur(1.2))

    rgba = im.convert("RGBA")
    rgba.putalpha(alpha_img)
    rgba.save(out_path)
    print(f"{path} -> {out_path}")


if __name__ == "__main__":
    for jpg_path in sorted(glob.glob(os.path.join(SRC_DIR, "*.jpg"))):
        png_path = os.path.splitext(jpg_path)[0] + ".png"
        cutout(jpg_path, png_path)
