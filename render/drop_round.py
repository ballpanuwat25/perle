# Renders a round oil drop over a black and a white backdrop (as render_drop.py does for the hanging drop). The pair gives a transmission
# map (white - black) and an added-light map (black): the page multiplies by the first and adds
# the second, so the drop composites over live content.
#   blender -b --factory-startup -P drop_round.py -- <outdir> [samples]
import bpy, math, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
SAMPLES = int(argv[1]) if len(argv) > 1 else 192
TONE = argv[2] if len(argv) > 2 else 'gold'
# gold, or the rose-gold amber of the splash render
# gold oil, champagne-peach for rose, and molten metal for liquid gold
# and the five oils of the formula, each in its own colour, for the dive below the surface
ABSORB = {'gold': (1.0, 0.82, 0.25), 'rose': (1.0, 0.84, 0.66), 'metal': (1.0, 1.0, 1.0),
          'squalane': (1.0, 0.96, 0.84), 'ricebran': (1.0, 0.76, 0.4), 'camellia': (1.0, 0.91, 0.62),
          'moringa': (0.92, 0.95, 0.6), 'vite': (1.0, 0.66, 0.32)}[TONE]
# the five oils hang in oil, not in air: lit from the surface above, and only a little denser
# than what surrounds them, so they bend light gently instead of shining like glass beads
UNDER = TONE in ('squalane', 'ricebran', 'camellia', 'moringa', 'vite')
os.makedirs(OUT, exist_ok=True)

scene = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)

# --- drop: a round bead of oil, radius 1 at the origin (the page squashes it as it wobbles) ---
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, segments=160, ring_count=96, location=(0, 0, 0))
drop = bpy.context.active_object
bpy.ops.object.shade_smooth()

oil = bpy.data.materials.new('oil'); oil.use_nodes = True
nt = oil.node_tree; bsdf = nt.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (1.0, 0.97, 0.9, 1)
bsdf.inputs['Roughness'].default_value = 0.015
bsdf.inputs['IOR'].default_value = 1.47
bsdf.inputs['Transmission Weight'].default_value = 1.0
vol = nt.nodes.new('ShaderNodeVolumeAbsorption')
vol.inputs['Color'].default_value = (*ABSORB, 1)   # the same oil as the sea plate
vol.inputs['Density'].default_value = {'gold': 1.8, 'rose': 1.6, 'metal': 0.0, 'squalane': 0.7, 'ricebran': 1.6, 'camellia': 1.2,
                                         'moringa': 1.4, 'vite': 2.0}[TONE]   # a bead reads rich, not glassy
if TONE == 'metal':
    # liquid gold is a metal: no body to see into, only a gold-tinted mirror
    bsdf.inputs['Metallic'].default_value = 1.0
    bsdf.inputs['Base Color'].default_value = (1.0, 0.76, 0.33, 1)
    bsdf.inputs['Roughness'].default_value = 0.06
    bsdf.inputs['Transmission Weight'].default_value = 0.0
nt.links.new(vol.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
if UNDER:
    # squalane is clear: a touch of gold and a softer sheen, or it reads as an air bubble
    bsdf.inputs['IOR'].default_value = 1.12; bsdf.inputs['Roughness'].default_value = 0.16 if TONE == 'squalane' else 0.04
drop.data.materials.append(oil)

# --- backdrop: an emissive dome, black or white behind the drop and dim on the camera side,
# so light leaving the drop's sides still lands on "page" instead of a dark world ---
bpy.ops.mesh.primitive_uv_sphere_add(radius=30, segments=64, ring_count=32, location=(0, 0, 0))
card = bpy.context.active_object
cm = bpy.data.materials.new('card'); cm.use_nodes = True
cn = cm.node_tree; cn.nodes.clear()
em = cn.nodes.new('ShaderNodeEmission'); outn = cn.nodes.new('ShaderNodeOutputMaterial')
geo = cn.nodes.new('ShaderNodeNewGeometry'); sep = cn.nodes.new('ShaderNodeSeparateXYZ')
ramp = cn.nodes.new('ShaderNodeMapRange')
ramp.inputs['From Min'].default_value = -14.0; ramp.inputs['From Max'].default_value = 2.0
mix = cn.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
# the camera side of the dome is the same carded studio the oil reflects (env_bake.py)
ENV = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hdri', 'env-cards.exr')
envt = cn.nodes.new('ShaderNodeTexEnvironment'); envt.image = bpy.data.images.load(ENV)
envs = cn.nodes.new('ShaderNodeVectorMath'); envs.operation = 'NORMALIZE'
cn.links.new(geo.outputs['Position'], envs.inputs[0]); cn.links.new(envs.outputs[0], envt.inputs['Vector'])
envk = cn.nodes.new('ShaderNodeMixRGB'); envk.blend_type = 'MULTIPLY'; envk.inputs[0].default_value = 1.0
envk.inputs[2].default_value = (1.3, 1.3, 1.3, 1)
cn.links.new(envt.outputs['Color'], envk.inputs[1]); cn.links.new(envk.outputs[0], mix.inputs[6])
cn.links.new(geo.outputs['Position'], sep.inputs[0])
cn.links.new(sep.outputs['Y'], ramp.inputs['Value'])
cn.links.new(ramp.outputs[0], mix.inputs['Factor'])
cn.links.new(mix.outputs[2], em.inputs['Color'])
cn.links.new(em.outputs[0], outn.inputs[0]); card.data.materials.append(cm)
backdrop = mix.inputs[7]
# --- studio: a soft key top left, a strip rim right, a warm bounce below ---
def area(name, loc, size, power, color, sx=None):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = power; l.color = color
    if sx: l.shape = 'RECTANGLE'; l.size = sx; l.size_y = size
    else: l.shape = 'DISK'; l.size = size
    o = bpy.data.objects.new(name, l); o.location = loc; scene.collection.objects.link(o)
    o.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return o
if UNDER:
    # under the surface: one broad light from above, a faint warm glow from below, and the oil
    # all round in place of the studio
    area('surface', (0.0, -1.0, 6.0), 9.0, 1100, (1.0, 0.95, 0.88))
    deep = area('deep', (0.0, -1.0, -6.0), 8.0, 160, (1.0, 0.78, 0.52)); deep.visible_glossy = False
    for l in list(cn.links):
        if l.to_socket == mix.inputs[6]: cn.links.remove(l)
    mix.inputs[6].default_value = (0.86, 0.68, 0.5, 1)
else:
    area('key', (-3.2, -4.0, 2.2), 1.4, 350, (1.0, 0.97, 0.92))
    area('rim', (3.6, -1.2, -0.6), 3.0, 250, (1.0, 0.93, 0.82), sx=0.45)
    bounce = area('bounce', (0.5, -2.5, -5.0), 3.0, 120, (1.0, 0.78, 0.45))
    bounce.visible_glossy = False
    # a hot light behind and above the drop: the drop focuses it into a caustic near its belly
    back = area('back', (0.0, 2.6, 1.6), 0.8, 1400, (1.0, 0.85, 0.55))
    back.visible_camera = False
world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True  # hidden by the dome
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.04, 0.035, 0.03, 1); bg.inputs['Strength'].default_value = 1

# --- camera: orthographic, framing -1.15..1.15 both ways ---
cam_d = bpy.data.cameras.new('cam'); cam_d.type = 'ORTHO'
cam_d.sensor_fit = 'HORIZONTAL'; cam_d.ortho_scale = 2.3
cam = bpy.data.objects.new('cam', cam_d); scene.collection.objects.link(cam)
cam.location = (0, -10, 0); cam.rotation_euler = (math.radians(90), 0, 0)
scene.camera = cam
scene.render.resolution_x, scene.render.resolution_y = 640, 640

scene.render.engine = 'CYCLES'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 16; scene.cycles.transmission_bounces = 16; scene.cycles.glossy_bounces = 8
scene.cycles.caustics_refractive = True; scene.cycles.caustics_reflective = True
scene.view_settings.view_transform = 'Standard'
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_depth = '16'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for kind in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
        try:
            prefs.compute_device_type = kind; prefs.get_devices()
            if any(d.type == kind for d in prefs.devices):
                for d in prefs.devices: d.use = True
                scene.cycles.device = 'GPU'; print('device', kind); break
        except TypeError: pass
except Exception as e: print('cpu render', e)

for name, value in (('black', 0.0), ('white', 1.0)):
    backdrop.default_value = (value, value, value, 1); em.inputs['Strength'].default_value = 1
    scene.render.filepath = os.path.join(OUT, f'round-{TONE}-{name}.png')
    bpy.ops.render.render(write_still=True)
print('done')
