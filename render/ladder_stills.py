"""Puts the PERLE label on the three Gemini stills of the range (render/stills/<id>.jpg): the thin
'PERLE' the generator drew is lifted off the paper, and the label face (label_faces.mjs) is wrapped
round the bottle in its place, lit by the paper it sits on. The face reads up the bottle, as the
label of the bottle lying in the hero does once it is stood up. Then the stills are cut for the ladder:
4:5 for the three-up row, 5:4 for phones.

  python ladder_stills.py <stillsDir> <siteImgDir>
    reads <stillsDir>/<id>.jpg and <stillsDir>/out/face-<id>.png
    writes <stillsDir>/out/<id>-labelled.jpg, <siteImgDir>/range-<id>-{tall,wide}.webp
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

INK = np.array([0x1c, 0x14, 0x0a], float)

# Per still, in its own pixels (1856 x 2304):
#   axis, radius: the bottle's centre line and radius on screen
#   text: the box round the generator's 'PERLE', to lift off
#   at: where the new face's centre goes; span: how tall it stands (on screen)
#   sag: how much higher a level line sits at the bottle's edge than at its front (seen from a
#   little above, the label's edges smile)
#   tilt: how far the label leans (px down per px right)
STILLS = {
    'gel':   dict(axis=930, radius=210, text=(772, 1328, 1088, 1428), at=(926, 1378), span=380, sag=40, tilt=-0.01),
    'serum': dict(axis=934, radius=216, text=(762, 1343, 1094, 1447), at=(930, 1400), span=340, sag=38, tilt=-0.01),
    'oil':   dict(axis=937, radius=239, text=(748, 1388, 1118, 1492), at=(934, 1440), span=380, sag=42, tilt=-0.01),
}


def lift_text(img, box):
    """Paper where the old lettering was: the paper's own shading (a blur that skips the ink) plus
    grain borrowed from the paper just above."""
    x0, y0, x1, y1 = box
    pad = 40
    X0, Y0, X1, Y1 = x0 - pad, y0 - pad, x1 + pad, y1 + pad
    patch = img[Y0:Y1, X0:X1]
    lum = patch.mean(2)
    paper = ndimage.median_filter(lum, size=31)
    ink = np.zeros(lum.shape, bool)
    ink[pad:-pad, pad:-pad] = (paper - lum)[pad:-pad, pad:-pad] > 10
    ink = ndimage.binary_dilation(ink, iterations=5)
    keep = (~ink).astype(float)
    base = np.stack([ndimage.gaussian_filter(patch[..., c] * keep, 14) for c in range(3)], 2)
    base /= np.maximum(ndimage.gaussian_filter(keep, 14), 1e-4)[..., None]
    h = Y1 - Y0
    above = img[Y0 - h - 10:Y1 - h - 10, X0:X1]
    grain = above - np.stack([ndimage.gaussian_filter(above[..., c], 6) for c in range(3)], 2)
    fill = base + grain
    soft = ndimage.gaussian_filter(ink.astype(float), 2)[..., None]
    img[Y0:Y1, X0:X1] = patch * (1 - soft) + fill * soft
    return img


def wrap_face(img, face, s):
    """Lays the face's ink on the bottle: each screen pixel is traced back round the cylinder to the
    flat face, and the ink takes the light of the paper under it."""
    face = face.convert('L').rotate(90, expand=True)   # (reading from the foot of the bottle up)
    fx0, fy0, fx1, fy1 = Image.eval(face, lambda c: 255 - c).getbbox()
    k = s['span'] / (fy1 - fy0)   # screen px per face px, at the bottle's front
    # bring the face to about screen scale first, so sampling it does not alias
    small = face.resize((round(face.width * k * 2), round(face.height * k * 2)), Image.LANCZOS)
    cov = 1 - np.asarray(small, float) / 255
    k2 = k * 2
    fcx, fcy = (fx0 + fx1) / 2 * k2, (fy0 + fy1) / 2 * k2

    ax, R, (cx, cy) = s['axis'], s['radius'], s['at']
    halfw = (fx1 - fx0) * k * 0.6
    X0, X1 = int(cx - halfw - 10), int(cx + halfw + 10)
    hh = (fy1 - fy0) * k * 0.6 + s['sag'] + 20
    Y0, Y1 = int(cy - hh), int(cy + hh)
    ys, xs = np.mgrid[Y0:Y1, X0:X1].astype(float)
    th = np.arcsin(np.clip((xs - ax) / R, -0.999, 0.999))
    u = R * th - (cx - ax)                                  # along the face, from its centre
    v = ys - cy + s['sag'] * (1 - np.cos(th)) - s['tilt'] * (xs - ax)
    a = ndimage.map_coordinates(cov, [v * 2 + fcy, u * 2 + fcx], order=1, cval=0)
    a[np.abs(xs - ax) > R * 0.97] = 0

    patch = img[Y0:Y1, X0:X1]
    # the ink is lit like the paper: darker where the paper turns away
    light = ndimage.gaussian_filter(patch.mean(2), 20) / 235
    ink = INK[None, None, :] * np.clip(light, 0.6, 1.15)[..., None]
    img[Y0:Y1, X0:X1] = patch * (1 - a[..., None]) + ink * a[..., None]
    return img


def cut(img, aspect, focus_y):
    """The largest crop of the given aspect (w / h), centred on the bottle across, and placed so
    focus_y (a fraction of the height) stays at the same fraction of the crop."""
    H, W = img.shape[:2]
    if W / H > aspect:
        w, h = round(H * aspect), H
    else:
        w, h = W, round(W / aspect)
    x = (W - w) // 2
    y = int(np.clip(focus_y * H - focus_y * h, 0, H - h))
    return img[y:y + h, x:x + w]


def main(stills, site):
    for name, s in STILLS.items():
        img = np.asarray(Image.open(f'{stills}/{name}.jpg').convert('RGB'), float)
        img = lift_text(img, s['text'])
        img = wrap_face(img, Image.open(f'{stills}/out/face-{name}.png'), s)
        out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))
        out.save(f'{stills}/out/{name}-labelled.jpg', quality=92)
        arr = np.asarray(out)
        for shape, aspect, width in (('tall', 4 / 5, 1100), ('wide', 5 / 4, 1100)):
            c = Image.fromarray(cut(arr, aspect, 0.6))
            c = c.resize((width, round(width / aspect)), Image.LANCZOS)
            c.save(f'{site}/range-{name}-{shape}.webp', quality=82, method=6)


if __name__ == '__main__':
    main(*sys.argv[1:3])
