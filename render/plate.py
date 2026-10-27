# A still "sea" of golden oil to the horizon under a white sky: the background plate that the
# page ripples in code. Also writes the camera so the page can project ripples onto the water.
#   blender -b --factory-startup -P plate.py -- <outdir> <level|tilt15> <wide|tall> <samples> [pct]
import bpy, math, sys, os, json
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT, VIEW, SHAPE, SAMPLES = argv[0], argv[1], argv[2], int(argv[3])
PCT = int(argv[4]) if len(argv) > 4 else 100
TONE = argv[5] if len(argv) > 5 else 'gold'
ABSORB = {'gold': ((1.0, 0.85, 0.32), 3.3), 'rose': ((1.0, 0.84, 0.66), 1.7)}[TONE]   # champagne-peach: pale, soft, warm
os.makedirs(OUT, exist_ok=True)
scene = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)

def principled(name, color, rough=0.02, transmission=0.0, absorb=None, density=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['IOR'].default_value = 1.47
    b.inputs['Transmission Weight'].default_value = transmission
    if absorb:
        v = nt.nodes.new('ShaderNodeVolumeAbsorption')
        v.inputs['Color'].default_value = (*absorb, 1); v.inputs['Density'].default_value = density
        nt.links.new(v.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
    return m, nt, b

# the oil: a slab over a white floor, so its gold is light passing through it
oil, ont, obsdf = principled('oil', (1.0, 0.97, 0.9), rough=0.02, transmission=1.0, absorb=ABSORB[0], density=ABSORB[1])
# no surface reflection in the plate: the page adds every reflection itself, from the same
# HDRI, so reflections move with the swell and the ripples
refr = ont.nodes.new('ShaderNodeBsdfRefraction')
refr.inputs['IOR'].default_value = 1.47; refr.inputs['Roughness'].default_value = 0.02
olp = ont.nodes.new('ShaderNodeLightPath'); omix = ont.nodes.new('ShaderNodeMixShader')
ont.links.new(olp.outputs['Is Camera Ray'], omix.inputs[0])
ont.links.new(obsdf.outputs[0], omix.inputs[1]); ont.links.new(refr.outputs[0], omix.inputs[2])
ont.links.new(omix.outputs[0], ont.nodes['Material Output'].inputs['Surface'])
# the surface is dead calm: the page draws all of its motion
white, _, _ = principled('white', (0.93, 0.92, 0.9), rough=0.6)

bpy.ops.mesh.primitive_plane_add(size=600, location=(0, 0, 0))
sea = bpy.context.active_object; sea.data.materials.append(oil)
s = sea.modifiers.new('slab', 'SOLIDIFY'); s.thickness = 0.4; s.offset = -1
bpy.ops.mesh.primitive_plane_add(size=800, location=(0, 0, -0.41))
bpy.context.active_object.data.materials.append(white)

# lighting and reflections come from the studio HDRI with black cards painted in
# (env_bake.py); the camera itself sees a plain white sky
ENV = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hdri', 'env-cards.exr')
world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True
wn = world.node_tree
envt = wn.nodes.new('ShaderNodeTexEnvironment'); envt.image = bpy.data.images.load(ENV)
envbg = wn.nodes.new('ShaderNodeBackground'); envbg.inputs['Strength'].default_value = 1.3
wn.links.new(envt.outputs['Color'], envbg.inputs['Color'])
grad_in = wn.nodes.new('ShaderNodeTexCoord'); sep = wn.nodes.new('ShaderNodeSeparateXYZ'); ramp = wn.nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].position = 0.5; ramp.color_ramp.elements[0].color = (1.0, 0.985, 0.96, 1)
ramp.color_ramp.elements[1].position = 0.75; ramp.color_ramp.elements[1].color = (1.0, 1.0, 1.0, 1)
wn.links.new(grad_in.outputs['Generated'], sep.inputs[0]); wn.links.new(sep.outputs['Z'], ramp.inputs['Fac'])
skybg = wn.nodes.new('ShaderNodeBackground'); skybg.inputs['Strength'].default_value = 1.0
wn.links.new(ramp.outputs['Color'], skybg.inputs['Color'])
lp = wn.nodes.new('ShaderNodeLightPath'); mixs = wn.nodes.new('ShaderNodeMixShader')
wn.links.new(lp.outputs['Is Camera Ray'], mixs.inputs[0])
wn.links.new(envbg.outputs[0], mixs.inputs[1]); wn.links.new(skybg.outputs[0], mixs.inputs[2])
wn.links.new(mixs.outputs[0], wn.nodes['World Output'].inputs['Surface'])

def area(name, loc, target, size, power, color=(1, 1, 1)):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = power; l.size = size; l.color = color
    o = bpy.data.objects.new(name, l); o.location = loc; scene.collection.objects.link(o)
    o.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    o.visible_camera = False
    return o
area('top', (0, 2, 9), (0, 2, 0), 12, 400)


# cameras: eye-level (as the first splash render) or pitched 15 degrees down
cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 85
cam_d.dof.use_dof = True; cam_d.dof.aperture_fstop = 2.8
cam = bpy.data.objects.new('cam', cam_d); scene.collection.objects.link(cam)
if VIEW == 'level':
    focus_d = 10.5
    cam.location = (0, -focus_d, 1.1); pitch = math.radians(-3.0)
elif VIEW in ('macro', 'macrob'):
    # macro: low and close on a long lens, focus razor-thin, as the reference splash photos
    focus_d = 1.6; cam_d.lens = 100; cam_d.dof.aperture_fstop = 2.8
    pitch = math.radians(-4.0)
    cam.location = (0, -focus_d * math.cos(-pitch), focus_d * math.sin(-pitch))
    if VIEW == 'macrob':
        # with the bottle in shot, focus sits on the bottle, like a product photo; the phone frame
        # is too narrow for the whole bottle up close, so there it lies a little further off
        # focus on the label's face (nearer than the bottle's middle), stopped down a little so
        # all of the label is sharp while the oil before and behind stays soft
        focus_d = 0.912 if SHAPE == 'wide' else 0.811
        cam_d.dof.aperture_fstop = 4.0
else:
    # 15 degrees down needs a wide lens to keep the horizon in frame
    focus_d = 6.0; cam_d.lens = 30; cam_d.dof.aperture_fstop = 5.6
    pitch = math.radians(-15.0)
    cam.location = (0, -focus_d * math.cos(-pitch), focus_d * math.sin(-pitch))
cam.rotation_euler = (math.radians(90) + pitch, 0, 0)
cam_d.dof.focus_distance = focus_d
scene.camera = cam
res = (1920, 1080) if SHAPE == 'wide' else (1080, 1920)
scene.render.resolution_x, scene.render.resolution_y = res
scene.render.resolution_percentage = PCT
cam_d.sensor_fit = 'HORIZONTAL' if SHAPE == 'wide' else 'VERTICAL'

scene.render.engine = 'CYCLES'
scene.cycles.samples = SAMPLES; scene.cycles.use_denoising = True
scene.cycles.max_bounces = 12; scene.cycles.transmission_bounces = 12; scene.cycles.volume_bounces = 2
scene.view_settings.view_transform = 'Standard'
# no look: the page adds reflections in linear light, so the plate must stay linear + sRGB
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0.0
scene.render.image_settings.file_format = 'JPEG'; scene.render.image_settings.quality = 92
# --- the PERLE bottle, lying open and half-sunk at the bottom left (macro with bottle) ---
if VIEW == 'macrob':
    HERE = os.path.dirname(os.path.abspath(__file__))
    LABEL_TURN = float(os.environ.get('LABEL_TURN', '342'))
    # a 30 ml Boston round, the shape most dropper serums come in: straight body, domed shoulder,
    # short threaded neck with a lip
    R, BODY, SH, NECK_R, NECK = 0.017, 0.056, 0.012, 0.0085, 0.011
    prof = [(0.0, 0.0), (R - 0.0025, 0.0), (R, 0.0025), (R, BODY)]
    prof += [(NECK_R + (R - NECK_R) * math.cos(math.pi / 2 * i / 10), BODY + SH * math.sin(math.pi / 2 * i / 10)) for i in range(1, 11)]
    top = BODY + SH + NECK
    prof += [(NECK_R, BODY + SH + 0.002), (NECK_R + 0.0007, BODY + SH + 0.0035), (NECK_R, BODY + SH + 0.005),
             (NECK_R + 0.0007, BODY + SH + 0.0065), (NECK_R, BODY + SH + 0.008),
             (NECK_R + 0.0009, top - 0.0015), (NECK_R + 0.0009, top), (NECK_R - 0.0015, top + 0.0004)]
    verts, faces, N = [], [], 96
    for (r, z) in prof:
        for j in range(N):
            a = 2 * math.pi * j / N
            verts.append((r * math.cos(a), r * math.sin(a), z))
    for i in range(len(prof) - 1):
        for j in range(N):
            a0, b0 = i * N + j, i * N + (j + 1) % N
            faces.append((a0, b0, b0 + N, a0 + N))
    me = bpy.data.meshes.new('bottle'); me.from_pydata(verts, [], faces); me.update()
    for p in me.polygons: p.use_smooth = True
    bottle = bpy.data.objects.new('bottle', me); scene.collection.objects.link(bottle)
    sol = bottle.modifiers.new('wall', 'SOLIDIFY'); sol.thickness = 0.0016; sol.offset = -1
    bottle.modifiers.new('smooth', 'SUBSURF').levels = 1
    glass, gnt, gb = principled('amber_glass', (1.0, 0.97, 0.92), rough=0.04, transmission=1.0, absorb=(0.95, 0.66, 0.2), density=700.0)   # amber glass: yellow-brown, not red
    gb.inputs['IOR'].default_value = 1.52
    bottle.data.materials.append(glass)
    # lying along +x (neck toward the centre of the frame), turned a little toward the camera,
    # sunk to just under half its radius
    bottle.rotation_euler = (0, math.radians(90), math.radians(-14))
    # the phone frame is much narrower, so the bottle moves back and in toward the centre
    # drawn larger than life so the product carries the frame, sunk to just under its middle
    # on a phone it lies nearer the camera, low in the tall frame under the type
    bottle.scale = (1.28 if SHAPE == 'wide' else 1.0,) * 3
    bottle.location = (-0.140, -0.656, -0.004) if SHAPE == 'wide' else (-0.038, -0.761, -0.003)
    # paper label wrapped round the middle of the body
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=R + 0.0004, depth=0.036, end_fill_type='NOTHING')
    lab = bpy.context.active_object; lab.name = 'label'
    bpy.ops.object.shade_smooth()
    lab.parent = bottle; lab.location = (0, 0, BODY * 0.5); lab.rotation_euler = (0, 0, math.radians(LABEL_TURN))
    lm = bpy.data.materials.new('label'); lm.use_nodes = True
    lnt = lm.node_tree; tex = lnt.nodes.new('ShaderNodeTexImage'); tex.image = bpy.data.images.load(os.path.join(HERE, 'label.png'))
    lnt.links.new(tex.outputs['Color'], lnt.nodes['Principled BSDF'].inputs['Base Color'])
    lnt.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.55
    lab.data.materials.append(lm)

name = f'plate-{VIEW}-{SHAPE}' + ('' if TONE == 'gold' else f'-{TONE}')
scene.render.filepath = os.path.join(OUT, f'{name}.jpg')
bpy.ops.render.render(write_still=True)

if VIEW == 'macrob':
    # the bottle's own reflection in the oil, which the plate leaves out like every other: the oil
    # becomes a mirror for camera rays, and the world goes black for the rays that leave the
    # mirror (depth 1), so only the bottle shows; deeper rays still light the bottle as before
    gloss = ont.nodes.new('ShaderNodeBsdfGlossy'); gloss.inputs['Roughness'].default_value = 0.02
    ont.links.new(gloss.outputs[0], omix.inputs[2])
    wlp = wn.nodes.new('ShaderNodeLightPath'); first = wn.nodes.new('ShaderNodeMath'); first.operation = 'LESS_THAN'
    first.inputs[1].default_value = 1.5; wn.links.new(wlp.outputs['Ray Depth'], first.inputs[0])
    black = wn.nodes.new('ShaderNodeBackground'); black.inputs['Strength'].default_value = 0.0
    wmix = wn.nodes.new('ShaderNodeMixShader'); wn.links.new(first.outputs[0], wmix.inputs[0])
    wn.links.new(mixs.outputs[0], wmix.inputs[1]); wn.links.new(black.outputs[0], wmix.inputs[2])
    wn.links.new(wmix.outputs[0], wn.nodes['World Output'].inputs['Surface'])
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = os.path.join(OUT, f'{name}-refl.png')
    bpy.ops.render.render(write_still=True)
    # and where in the oil that reflection falls: the same mirror, the bottle glowing white
    glow = bpy.data.materials.new('glow'); glow.use_nodes = True
    gn = glow.node_tree; gn.nodes.clear()
    gn.links.new(gn.nodes.new('ShaderNodeEmission').outputs[0], gn.nodes.new('ShaderNodeOutputMaterial').inputs['Surface'])
    keep = {}
    for o in scene.objects:
        if o.name in ('bottle', 'label'):
            keep[o.name] = list(o.data.materials); o.data.materials.clear(); o.data.materials.append(glow)
    wn.links.new(black.outputs[0], wn.nodes['World Output'].inputs['Surface'])
    scene.cycles.samples = 16
    scene.render.filepath = os.path.join(OUT, f'{name}-reflmask.png')
    bpy.ops.render.render(write_still=True)
    # where the bottle stands above the oil, so the page leaves it out of the ripples and reflections
    hold = bpy.data.materials.new('hold'); hold.use_nodes = True
    hn = hold.node_tree; hn.nodes.clear()
    ho = hn.nodes.new('ShaderNodeOutputMaterial'); hn.links.new(hn.nodes.new('ShaderNodeHoldout').outputs[0], ho.inputs['Surface'])
    white_e = bpy.data.materials.new('white_e'); white_e.use_nodes = True
    wn2 = white_e.node_tree; wn2.nodes.clear()
    wo = wn2.nodes.new('ShaderNodeOutputMaterial'); we = wn2.nodes.new('ShaderNodeEmission'); we.inputs['Strength'].default_value = 1
    wn2.links.new(we.outputs[0], wo.inputs['Surface'])
    for o in scene.objects:
        if o.type != 'MESH': continue
        mat = white_e if o.name in ('bottle', 'label') else hold
        o.data.materials.clear(); o.data.materials.append(mat)
    for o in scene.objects:
        if o.type == 'MESH' and o.name not in ('bottle', 'label') and o.modifiers.get('wall') is None:
            pass
    scene.render.film_transparent = True
    scene.cycles.samples = 16
    scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'Standard'
    scene.render.filepath = os.path.join(OUT, f'{name}-mask.png')
    bpy.ops.render.render(write_still=True)

# the camera as the page needs it: position, axes and half-angle tangents (Blender is Z-up)
bpy.context.view_layer.update()
m = cam.matrix_world
right, up, back = m.col[0].xyz.normalized(), m.col[1].xyz.normalized(), m.col[2].xyz.normalized()
json.dump({
    'pos': list(cam.location), 'right': list(right), 'up': list(up), 'forward': list(-back),
    'tanX': math.tan(cam_d.angle_x / 2) if SHAPE == 'wide' else math.tan(cam_d.angle_y / 2) * res[0] / res[1],
    'tanY': math.tan(cam_d.angle_x / 2) * res[1] / res[0] if SHAPE == 'wide' else math.tan(cam_d.angle_y / 2),
}, open(os.path.join(OUT, f'{name}.json'), 'w'), indent=1)
print('done', name)
