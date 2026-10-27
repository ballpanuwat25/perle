# Turns the round drop's black/white renders into transmit (multiply) and glow (add) maps.
#   python maps_round.py <render dir> <site img dir>
import sys
import numpy as np
from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
tone = sys.argv[3] if len(sys.argv) > 3 else 'gold'
suffix = '' if tone == 'gold' else f'-{tone}'
b = np.asarray(Image.open(f'{src}/round-{tone}-black.png').convert('RGB')).astype(np.float32) / 255
w = np.asarray(Image.open(f'{src}/round-{tone}-white.png').convert('RGB')).astype(np.float32) / 255
T, F = np.clip(w - b, 0, 1), np.clip(b, 0, 1)
H, W = T.shape[:2]
# the silhouette is the exact circle of radius 1 in a frame 2.3 across
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
r = np.hypot((xx + 0.5) / W * 2.3 - 1.15, (yy + 0.5) / H * 2.3 - 1.15)
mask = (r <= 1.0).astype(np.float32)
m = Image.fromarray((mask * 255).astype(np.uint8))
# no painted edge band: a dark outline read as a drawn ring, not a bead of oil
grow = np.asarray(m.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)[..., None] / 255
T = T * grow + (1 - grow); F = F * grow
Image.fromarray((T * 255).astype(np.uint8)).save(f'{dst}/round-transmit{suffix}.png', optimize=True)
Image.fromarray((F * 255).astype(np.uint8)).save(f'{dst}/round-glow{suffix}.png', optimize=True)
print('maps written')
