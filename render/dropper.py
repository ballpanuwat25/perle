# The PERLE dropper (the bottle's cap): ribbed collar and a round bulb, as most serum droppers,
# tilted so its tip points down toward the sea, rendered
# over black and white like the drops so the page can slide it to wherever a drop falls.
#   blender -b --factory-startup -P dropper.py -- <outdir> [samples] [tone]
# Writes dropper-black.png, dropper-white.png and dropper.json (tip position, frame size).
import bpy, bmesh, math, sys, os, json
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
SAMPLES = int(argv[1]) if len(argv) > 1 else 128
TONE = argv[2] if len(argv) > 2 else 'rose'
os.makedirs(OUT, exist_ok=True)
HERE = os.path.dirname(os.path.abspath(__file__))
ABSORB = {'gold': (1.0, 0.82, 0.25), 'rose': (1.0, 0.84, 0.66)}[TONE]
TILT = math.radians(35)

scene = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)

def mat(name, color, rough, metal=0.0, transmission=0.0, ior=1.5, absorb=None, density=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal; b.inputs['Transmission Weight'].default_value = transmission
    b.inputs['IOR'].default_value = ior
    if absorb:
        v = nt.nodes.new('ShaderNodeVolumeAbsorption')
        v.inputs['Color'].default_value = (*absorb, 1); v.inputs['Density'].default_value = density
        nt.links.new(v.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
    return m

def lathe(name, prof, material, n=96, ribs=0):
    verts, faces = [], []
    for (r, z) in prof:
        for j in range(n):
            a = 2 * math.pi * j / n
            # fine vertical ribs, cut into the outer wall only
            k = r - (0.00035 * (0.5 + 0.5 * math.cos(ribs * a)) if ribs and r > 0.008 else 0)
            verts.append((k * math.cos(a), k * math.sin(a), z))
    for i in range(len(prof) - 1):
        for j in range(n):
            a0, b0 = i * n + j, i * n + (j + 1) % n
            faces.append((a0, b0, b0 + n, a0 + n))
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces)
    # outward normals, so glass and oil know which side is inside
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free(); me.update()
    for p in me.polygons: p.use_smooth = True
    o = bpy.data.objects.new(name, me); scene.collection.objects.link(o)
    o.data.materials.append(material)
    return o

# ivory, to match the label: soft rubber bulb, satin plastic collar
rubber = mat('rubber', (0.46, 0.42, 0.37), 0.42)   # a shade darker than the collar so the bulb holds its shape against a white page
collar = mat('collar', (0.70, 0.66, 0.60), 0.38)
glass = mat('glass', (1, 1, 1), 0.02, transmission=1.0, ior=1.5)
oil = mat('oil', (1, 0.97, 0.92), 0.02, transmission=1.0, ior=1.47, absorb=ABSORB, density=380.0)

# metres, tip at the origin, pointing down -z before the tilt
parts = []
# the pipette: a glass wall drawn as one closed outline (outside down, the lip, inside up). It
# narrows gently, then ends in a thick rounded lip that flares out a little, as glass pipettes
# do where the end was fire-polished; its top end runs up inside the collar
def outer(z):
    k = min(max(z - 0.0018, 0) / 0.017, 1.0); k = k * k * (3 - 2 * k)
    return 0.00095 + (0.0036 - 0.00095) * k
WALL = 0.0006
zs = [0.0018 + (0.070 - 0.0018) * (i / 40) ** 1.6 for i in range(40, -1, -1)]   # top to the lip, denser low
tube = [(outer(z), z) for z in zs] + [(outer(z) - WALL, z) for z in reversed(zs)] + [(outer(zs[0]), zs[0])]
parts.append(lathe('pipette', tube, glass))
# the oil drawn up into the lower part; at the very end it fills a round knob, the tip
# rounding out with a little flare, so the end of the dropper reads even at a glance
parts.append(lathe('oil', [(0.0, 0.0018)] + [(outer(z) - WALL - 0.00005, z) for z in [0.0018 + 0.0222 * i / 20 for i in range(21)]] + [(0.0, 0.024)], oil))
LIP_C, LIP_R = (0.0002, 0.00075), 0.00105
knob = [(0.0, 0.0017), (outer(0.0017), 0.0017)] + [(LIP_C[0] + LIP_R * math.cos(a), LIP_C[1] + LIP_R * math.sin(a)) for a in [math.radians(60 - 150 * i / 16) for i in range(17)]] + [(0.0, LIP_C[1] - LIP_R)]
# a thinner oil here: light crosses the whole knob, not a film, so the same density would read red
knob_oil = mat('knob_oil', (1, 0.97, 0.92), 0.02, transmission=1.0, ior=1.47, absorb=ABSORB, density=110.0)
parts.append(lathe('knob', knob, knob_oil))
# a small plug where the pipette enters the collar
parts.append(lathe('plug', [(0.0036, 0.0572), (0.0045, 0.0572), (0.0048, 0.0578), (0.0048, 0.0606), (0.0036, 0.0606), (0.0036, 0.0572)], collar))
# a tall ribbed collar, as on most 30 ml serum droppers
parts.append(lathe('collar', [(0.0036, 0.060), (0.0103, 0.060), (0.0108, 0.0606), (0.0108, 0.0762), (0.0102, 0.0771), (0.0078, 0.0775), (0.0, 0.0775)], collar, n=240, ribs=60))
# a straight bulb with a round top
bulb = [(0.0, 0.0773), (0.0071, 0.0773), (0.0072, 0.0778), (0.0072, 0.0845)]
bulb += [(0.0072 * math.cos(math.pi / 2 * i / 12), 0.0845 + 0.0072 * math.sin(math.pi / 2 * i / 12)) for i in range(1, 13)]
parts.append(lathe('bulb', bulb, rubber))
root = bpy.data.objects.new('dropper', None); scene.collection.objects.link(root)
for p in parts: p.parent = root
root.rotation_euler = (0, TILT, 0)
bpy.context.view_layer.update()

# backdrop dome (camera side carries the carded studio, as for the drops)
bpy.ops.mesh.primitive_uv_sphere_add(radius=30, segments=64, ring_count=32, location=(0, 0, 0))
card = bpy.context.active_object
cm = bpy.data.materials.new('card'); cm.use_nodes = True; cn = cm.node_tree; cn.nodes.clear()
em = cn.nodes.new('ShaderNodeEmission'); outn = cn.nodes.new('ShaderNodeOutputMaterial')
geo = cn.nodes.new('ShaderNodeNewGeometry'); sep = cn.nodes.new('ShaderNodeSeparateXYZ'); rng = cn.nodes.new('ShaderNodeMapRange')
rng.inputs['From Min'].default_value = -14.0; rng.inputs['From Max'].default_value = 2.0
mix = cn.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
envt = cn.nodes.new('ShaderNodeTexEnvironment'); envt.image = bpy.data.images.load(os.path.join(HERE, 'hdri', 'env-cards.exr'))
nrm = cn.nodes.new('ShaderNodeVectorMath'); nrm.operation = 'NORMALIZE'
cn.links.new(geo.outputs['Position'], nrm.inputs[0]); cn.links.new(nrm.outputs[0], envt.inputs['Vector'])
cn.links.new(geo.outputs['Position'], sep.inputs[0]); cn.links.new(sep.outputs['Y'], rng.inputs['Value'])
cn.links.new(rng.outputs[0], mix.inputs['Factor']); cn.links.new(envt.outputs['Color'], mix.inputs[6])
# the backdrop is for the camera only: every other ray sees the studio HDRI, as on the sea plate
clp = cn.nodes.new('ShaderNodeLightPath'); envm = cn.nodes.new('ShaderNodeMix'); envm.data_type = 'RGBA'
# (and so do rays that pass through the glass, or the matte would read the glass as solid)
seen = cn.nodes.new('ShaderNodeMath'); seen.operation = 'MAXIMUM'
cn.links.new(clp.outputs['Is Camera Ray'], seen.inputs[0]); cn.links.new(clp.outputs['Is Transmission Ray'], seen.inputs[1])
cn.links.new(seen.outputs[0], envm.inputs['Factor'])
envs = cn.nodes.new('ShaderNodeMix'); envs.data_type = 'RGBA'; envs.blend_type = 'MULTIPLY'; envs.inputs['Factor'].default_value = 1.0
cn.links.new(envt.outputs['Color'], envs.inputs[6]); envs.inputs[7].default_value = (0.95, 0.95, 0.95, 1)   # a little under the sea's 1.3, so the pale cap keeps its shading against a white page
cn.links.new(envs.outputs[2], envm.inputs[6]); cn.links.new(mix.outputs[2], envm.inputs[7])
cn.links.new(envm.outputs[2], em.inputs['Color']); cn.links.new(em.outputs[0], outn.inputs[0])
card.data.materials.append(cm)
backdrop = mix.inputs[7]

def area(name, loc, size, power):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = power; l.size = size; l.shape = 'DISK'
    o = bpy.data.objects.new(name, l); o.location = loc; scene.collection.objects.link(o)
    o.rotation_euler = (Vector((0, 0, 0.04)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
area('top', (0, 0, 9), 12, 400)   # the sea plate's top light
world = bpy.data.worlds.new('w'); scene.world = world

# frame the whole dropper; remember where its tip lands in the sprite
corners = []
for p in parts:
    for v in p.data.vertices: corners.append(p.matrix_world @ v.co)
xs = [c.x for c in corners]; zs = [c.z for c in corners]
cx, cz = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2
size = max(max(xs) - min(xs), max(zs) - min(zs)) * 1.08
cam_d = bpy.data.cameras.new('cam'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = size
cam = bpy.data.objects.new('cam', cam_d); scene.collection.objects.link(cam)
cam.location = (cx, -10, cz); cam.rotation_euler = (math.radians(90), 0, 0)
scene.camera = cam
scene.render.resolution_x = scene.render.resolution_y = 900
scene.render.engine = 'CYCLES'; scene.cycles.samples = SAMPLES; scene.cycles.use_denoising = True
scene.cycles.max_bounces = 16; scene.cycles.transmission_bounces = 16
scene.view_settings.view_transform = 'Standard'
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_depth = '16'
tip = Vector((0, 0, 0))
json.dump({'tip': [(tip.x - cx) / size + 0.5, (tip.z - cz) / size + 0.5], 'size': size}, open(os.path.join(OUT, 'dropper.json'), 'w'))
for name, value in (('black', 0.0), ('white', 1.0)):
    backdrop.default_value = (value, value, value, 1)
    scene.render.filepath = os.path.join(OUT, f'dropper-{name}.png')
    bpy.ops.render.render(write_still=True)
print('done')
