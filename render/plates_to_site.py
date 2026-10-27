# Copies finished plates to the site as WebP, with their camera files, masks and reflections.
#   python plates_to_site.py <plates dir> <site img/sea dir>
import sys, os, glob, shutil
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
for f in sorted(glob.glob(os.path.join(src, 'plate-*.jpg'))):
    name = os.path.splitext(os.path.basename(f))[0]
    im = Image.open(f).convert('RGB')
    out = os.path.join(dst, name + '.webp')
    im.save(out, 'WEBP', quality=84, method=6)
    shutil.copy(os.path.join(src, name + '.json'), os.path.join(dst, name + '.json'))
    print(name, round(os.path.getsize(out) / 1e3), 'KB')
    mask = os.path.join(src, name + '-mask.png')
    if os.path.exists(mask):
        m = Image.open(mask).getchannel('A')
        m.save(os.path.join(dst, name + '-mask.png'), optimize=True)   # alpha as a grey mask
    refl = os.path.join(src, name + '-refl.png')
    if os.path.exists(refl):
        # the bottle's reflection, with where it falls as alpha
        # at half size (the ripples soften it anyway), with sampling noise cut from the mask and no
        # colour where nothing shows, so it stays small
        r = Image.open(refl).convert('RGB'); a = Image.open(os.path.join(src, name + '-reflmask.png')).convert('L')
        a = a.point(lambda x: 0 if x < 10 else x)
        r = Image.composite(r, Image.new('RGB', r.size), a.point(lambda x: 255 if x else 0))
        r.putalpha(a); r = r.resize((r.width // 2, r.height // 2), Image.LANCZOS)
        r.save(os.path.join(dst, name + '-refl.png'), optimize=True)
