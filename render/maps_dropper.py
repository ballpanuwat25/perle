# Transmit and glow maps for the dropper sprite (silhouette taken from the render itself).
#   python maps_dropper.py <render dir> <site img dir>
import sys, json, shutil
import numpy as np
from PIL import Image, ImageFilter
src, dst = sys.argv[1], sys.argv[2]
b = np.asarray(Image.open(f'{src}/dropper-black.png').convert('RGB')).astype(np.float32) / 255
w = np.asarray(Image.open(f'{src}/dropper-white.png').convert('RGB')).astype(np.float32) / 255
T, F = np.clip(w - b, 0, 1), np.clip(b, 0, 1)
mask = ((T.mean(2) < 0.985) | (F.max(2) > 0.03)).astype(np.uint8) * 255
grow = np.asarray(Image.fromarray(mask).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1))).astype(np.float32)[..., None] / 255
T = T * grow + (1 - grow); F = F * grow
Image.fromarray((T * 255).astype(np.uint8)).save(f'{dst}/dropper-transmit.png', optimize=True)
Image.fromarray((F * 255).astype(np.uint8)).save(f'{dst}/dropper-glow.png', optimize=True)
shutil.copy(f'{src}/dropper.json', f'{dst}/dropper.json')
print('dropper maps written')
