# Paints black flags into the studio HDRI, the way a photographer sets cards just out of frame
# so liquid has something dark to reflect. Writes the result for Blender (EXR) and a small
# RGB-encoded PNG for the page, so Blender and the code reflect the very same surroundings.
#   blender -b --factory-startup -P env_bake.py -- <in.hdr> <out dir>
import bpy, sys, os, math
import numpy as np

src, out = sys.argv[sys.argv.index('--') + 1:][:2]
os.makedirs(out, exist_ok=True)
img = bpy.data.images.load(src)
W, H = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(H, W, 4)   # rows run bottom to top

# Blender's equirect: u = 0.5 - atan2(y, x) / 2pi, v = 0.5 + asin(z) / pi. The camera looks along +y.
u = (np.arange(W) + 0.5) / W
v = (np.arange(H) + 0.5) / H
az = (0.5 - u) * 2 * math.pi                    # atan2(y, x)
el = np.degrees((v - 0.5) * math.pi)            # elevation in degrees
front = np.degrees(np.abs(np.angle(np.exp(1j * (az - math.pi / 2)))))   # degrees away from +y

def soft(x, a, b, e=0.6):
    return np.clip((x - a) / e + 0.5, 0, 1) * np.clip((b - x) / e + 0.5, 0, 1)

# three flags above eye level, out of every camera's frame but in the oil's reflection
bands = [(6.8, 7.9), (11.5, 13.0), (19.0, 21.0)]
dark = np.zeros((H, W), np.float32)
for a, b in bands:
    dark = np.maximum(dark, soft(el, a, b)[:, None] * soft(front, -75, 75, 8)[None, :])
px[..., :3] *= (1 - 0.88 * dark)[..., None]

img.pixels[:] = px.ravel()
img.filepath_raw = os.path.join(out, 'env-cards.exr')
img.file_format = 'OPEN_EXR'
img.save()

# for the page: 1024x512, value / 4 with a 2.2 curve, so highlights up to 4x survive in 8 bits
small = bpy.data.images.new('small', 1024, 512, float_buffer=True)
sy = (np.arange(512) * H // 512); sx = (np.arange(1024) * W // 1024)
lo = px[sy][:, sx].copy()
lo[..., :3] = np.clip(lo[..., :3] / 4.0, 0, 1) ** (1 / 2.2)
lo[..., 3] = 1
small.pixels[:] = lo.ravel()
small.filepath_raw = os.path.join(out, 'env-cards.png')
small.file_format = 'PNG'
small.save()
print('done', W, H, float(px[..., :3].mean()))
