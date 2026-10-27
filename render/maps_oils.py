# Packs the five oils' bead renders into two atlases for the dive (transmit and glow), one
# 512 px cell per oil in formula order, after maps_round.py has turned each into its maps.
#   python maps_oils.py <render dir> <site img dir>
import sys, os, subprocess, tempfile
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
OILS = ['squalane', 'ricebran', 'camellia', 'moringa', 'vite']
CELL = 512   # big enough that a bead filling a third of the screen stays sharp
here = os.path.dirname(os.path.abspath(__file__))
with tempfile.TemporaryDirectory() as tmp:
    for oil in OILS:
        subprocess.run([sys.executable, os.path.join(here, 'maps_round.py'), src, tmp, oil], check=True)
    for kind in ('transmit', 'glow'):
        sheet = Image.new('RGB', (CELL * len(OILS), CELL))
        for i, oil in enumerate(OILS):
            sheet.paste(Image.open(os.path.join(tmp, f'round-{kind}-{oil}.png')).convert('RGB').resize((CELL, CELL), Image.LANCZOS), (i * CELL, 0))
        sheet.save(os.path.join(dst, f'oils-{kind}.png'), optimize=True)
print('atlases written')
