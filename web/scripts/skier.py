# Jibber-style skier, built from the SVG poses in Lys.astro and rendered as
# sprites that drop into the same viewBox (0 -4 24 36), extended to -8..33 x -4..32.
# Usage: /Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup -P scripts/skier.py -- public/hero/skier
# Writes ride-legs, ride-up, ride-arm, ride-point, air and flip (.webp) for Lys.astro.
import bpy, sys, math
from mathutils import Vector

OUT = sys.argv[sys.argv.index('--') + 1]
PPU = 12  # pixels per SVG unit
X0, X1, Y0, Y1 = -8.0, 33.0, -4.0, 32.0

def V(x, y, d=0.0):
    # SVG (x right, y down) + depth d (positive = away from the camera)
    return Vector((x, d, -y))

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def mat(name, rgb, rough=0.92):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (*[c / 255 for c in rgb], 1)
    # sRGB to linear
    b.inputs['Base Color'].default_value = (*[((c / 255 + 0.055) / 1.055) ** 2.4 for c in rgb], 1)
    b.inputs['Roughness'].default_value = rough
    for k in ('Specular IOR Level', 'Specular'):
        if k in b.inputs: b.inputs[k].default_value = 0.15
    return m

def tube(name, pts, r, m, coll, caps=True):
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = 6
    cu.use_fill_caps = True
    sp = cu.splines.new('POLY')
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*p, 1)
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(m)
    coll.objects.link(ob)
    if caps:
        for i, p in enumerate(pts):
            ball(name + f'_j{i}', p, r, m, coll)
    return ob

def smooth_tube(name, ctrl, r, m, coll, n=12):
    # quadratic SVG-like curve through control points, sampled
    pts = []
    if len(ctrl) == 3:
        a, c, b = ctrl
        for i in range(n + 1):
            t = i / n
            pts.append(a * (1 - t) ** 2 + c * 2 * (1 - t) * t + b * t * t)
    else:
        pts = ctrl
    return tube(name, pts, r, m, coll)

def ball(name, p, r, m, coll, scale=(1, 1, 1)):
    me = bpy.data.meshes.new(name)
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=r)
    bm.to_mesh(me); bm.free()
    for poly in me.polygons: poly.use_smooth = True
    ob.location = p
    ob.scale = scale
    ob.data.materials.append(m)
    return ob

def blob(name, balls, m, coll, res=0.18):
    mb = bpy.data.metaballs.new(name)
    mb.resolution = res
    mb.render_resolution = res
    mb.threshold = 0.6
    ob = bpy.data.objects.new(name, mb)
    coll.objects.link(ob)
    for (p, r) in balls:
        e = mb.elements.new()
        e.co = p
        e.radius = r
    ob.data.materials.append(m)
    return ob

def ski(name, pts, m_top, m_edge, coll, d):
    tube(name + '_edge', [V(x, y + 0.25, d) for x, y in pts], 0.62, m_edge, coll, caps=False)
    tube(name, [V(x, y - 0.1, d - 0.05) for x, y in pts], 0.5, m_top, coll, caps=False)

def coll_new(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c

def setup_scene():
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.film_transparent = True
    sc.render.resolution_x = int((X1 - X0) * PPU)
    sc.render.resolution_y = int((Y1 - Y0) * PPU)
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'WEBP'
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.image_settings.quality = 92
    sc.view_settings.view_transform = 'Standard'
    try: sc.eevee.taa_render_samples = 32
    except Exception: pass
    cam = bpy.data.cameras.new('cam')
    cam.type = 'ORTHO'
    cam.ortho_scale = X1 - X0
    co = bpy.data.objects.new('cam', cam)
    sc.collection.objects.link(co)
    co.location = V((X0 + X1) / 2, (Y0 + Y1) / 2, -60)
    co.rotation_euler = (math.radians(90), 0, 0)
    sc.camera = co
    w = bpy.data.worlds.new('w'); sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (0.32, 0.35, 0.42, 1)
    bg.inputs['Strength'].default_value = 0.55
    def sun(name, rot, e, col=(1, 1, 1)):
        l = bpy.data.lights.new(name, 'SUN'); l.energy = e; l.color = col; l.angle = math.radians(8)
        o = bpy.data.objects.new(name, l); sc.collection.objects.link(o)
        o.rotation_euler = [math.radians(a) for a in rot]
    # key from upper left and in front, a cool fill, a rim from behind
    sun('key', (50, 0, -35), 3.2, (1.0, 0.97, 0.92))
    sun('fill', (75, 0, 120), 0.7, (0.75, 0.82, 1.0))
    sun('rim', (110, 0, 170), 2.0, (0.85, 0.9, 1.0))

PINK, PINK_HI, VIOLET, VIOLET_D, HOOD, GOG, MINT, EDGE, POLE, GLOVE = \
    (196, 138, 162), (220, 170, 189), (108, 91, 140), (87, 73, 117), (70, 59, 95), (47, 40, 57), (143, 200, 182), (42, 51, 48), (138, 144, 154), (47, 40, 57)

def build_rider(c_legs, c_up, P, c_arm=None):
    M = {k: mat(k, v) for k, v in dict(pink=PINK, violet=VIOLET, violetd=VIOLET_D, hood=HOOD, gog=GOG, mint=MINT, edge=EDGE, pole=POLE, glove=GLOVE).items()}
    M['gog'].node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.25
    # skis
    for i, (pts, d) in enumerate(P['skis']):
        ski(f'ski{i}', pts, M['mint'], M['edge'], c_legs, d)
    # legs: baggy pants as blobs along hip-knee-boot
    for i, (pts, d) in enumerate(P['legs']):
        balls = []
        for a, b in zip(pts, pts[1:]):
            for k in range(6):
                t = k / 5
                x = a[0] + (b[0] - a[0]) * t; y = a[1] + (b[1] - a[1]) * t
                balls.append((V(x, y, d), 3.4 - 0.55 * (pts.index(a) + t) / max(1, len(pts) - 1)))
        blob(f'leg{i}', balls, M['violet'] if d < 0 else M['violetd'], c_legs)
        bx, by = pts[-1]
        ball(f'boot{i}', V(bx + 0.6, by - 0.4, d), 1.25, M['edge'], c_legs, (1.35, 1, 0.8))
    # torso: one big soft jacket, hips to shoulders, and the hood
    (hx, hy), (sx, sy) = P['torso']
    balls = []
    for k in range(9):
        t = k / 8
        x = hx + (sx - hx) * t; y = hy + (sy - hy) * t
        balls.append((V(x, y, 0), 5.0 + 0.9 * math.sin(t * math.pi)))
    jacket = blob('jacket', balls, M['pink'], c_up, res=0.2)
    # arms
    for i, (pts, d) in enumerate(P['arms']):
        cA = c_arm if (c_arm and i == 1) else c_up
        # baggy sleeves: a blob along the quadratic through the three points
        a, c, b = [Vector((x, y)) for x, y in pts]
        balls = []
        for k in range(10):
            t = k / 9
            q = a * (1 - t) ** 2 + c * 2 * (1 - t) * t + b * t * t
            balls.append((V(q.x, q.y, d), 2.65 - 0.55 * t))
        blob(f'arm{i}', balls, M['pink'], cA)
        ex, ey = pts[-1]
        ball(f'glove{i}', V(ex, ey, d), 1.45, M['glove'], cA)
    # poles
    for i, (pts, d) in enumerate(P['poles']):
        cA = c_arm if (c_arm and i == 1) else c_up
        tube(f'pole{i}', [V(x, y, d) for x, y in pts], 0.32, M['pole'], cA, caps=False)
        bx, by = pts[-1]
        ball(f'basket{i}', V(bx, by, d), 0.75, M['edge'], cA, (1, 1, 0.35))
    # head: helmet in the hood, goggles forward
    (cx, cy), face = P['head']
    # the hood lies behind and under the helmet, a collar of the jacket
    ball('hoodball', V(cx - 1.7 * face, cy + 1.8, 1.2), 3.3, M['pink'], c_up)
    ball('helmet', V(cx, cy, 0), 3.55, M['hood'], c_up)
    ball('goggles', V(cx + 2.55 * face, cy + 0.5, -0.4), 1.75, M['gog'], c_up, (0.6, 1.9, 0.85))
    return M

# --- the poses, in the SVG's own coordinates --------------------------------
RIDE = dict(
    skis=[([(-0.4, 26.6), (1.0, 28.2), (3.4, 28.6), (20.6, 28.4), (23.2, 28.2), (24.6, 25.6)], -1.3),
          ([(0.6, 26.9), (2.0, 28.5), (4.4, 28.9), (21.6, 28.7), (24.2, 28.5), (25.6, 25.9)], 1.3)],
    legs=[([(9.6, 20.6), (6.4, 24.0), (9.0, 27.6)], -1.7), ([(14.8, 20.6), (17.8, 23.6), (17.2, 27.4)], 1.7)],
    torso=((11.2, 19.6), (14.2, 13.2)),
    arms=[([(9.4, 13.9), (6.0, 16.2), (4.2, 18.8)], 2.4), ([(15.2, 13.1), (19.0, 14.7), (21.4, 17.3)], -2.4)],
    poles=[([(4.4, 18.6), (-6.6, 21.4)], 2.6), ([(21.4, 17.3), (31.4, 20.3)], -2.6)],
    head=((17.4, 8.9), 1),
)
AIR = dict(
    skis=[([(3.4, 16.3), (4.6, 17.6), (23.0, 24.4), (25.2, 25.2), (26.1, 23.2)], -1.2),
          ([(1.2, 27.8), (2.6, 28.6), (24.0, 20.2), (26.2, 19.4), (26.3, 17.2)], 1.2)],
    legs=[([(12.0, 17.0), (17.2, 15.4), (16.0, 22.0)], 1.5), ([(12.4, 18.8), (18.8, 18.2), (15.8, 24.0)], -1.5)],
    torso=((12.6, 17.6), (13.8, 11.4)),
    arms=[([(12.4, 10.0), (8.8, 7.4), (5.4, 5.0)], 2.2), ([(15.4, 11.0), (19.0, 14.6), (19.4, 20.8)], -2.2)],
    poles=[([(5.6, 5.2), (-4.6, 7.4)], 2.4)],
    head=((15.4, 6.0), 1),
)
FLIP = dict(
    skis=[([(3.0, 25.4), (4.6, 26.6), (22.4, 26.6), (24.6, 24.8)], -1.2),
          ([(1.4, 28.4), (3.0, 29.6), (20.8, 29.6), (23.0, 27.8)], 1.2)],
    legs=[([(10.4, 18.6), (6.4, 20.6), (7.2, 25.0)], 1.5), ([(13.2, 18.8), (18.8, 19.4), (17.4, 25.6)], -1.5)],
    torso=((11.4, 17.6), (12.8, 11.2)),
    arms=[([(10.6, 11.4), (7.4, 13.6), (6.4, 16.6)], 2.2), ([(15.4, 11.6), (19.0, 13.0), (20.6, 16.4)], -2.2)],
    poles=[([(6.4, 16.6), (-1.6, 23.0)], 2.4), ([(20.6, 16.4), (27.6, 23.0)], -2.4)],
    head=((13.6, 6.0), 1),
)

def render(pose, name, split=False):
    reset(); setup_scene()
    legs, up = coll_new('legs'), coll_new('up')
    arm, point = (coll_new('arm'), coll_new('point')) if split else (None, None)
    M = build_rider(legs, up, pose, arm)
    sc = bpy.context.scene
    if split:
        # the pointing arm, straight out from the shoulder (rotated in CSS)
        balls = [(V(15 + 8.8 * k / 9, 13.4, -2.2), 2.55 - 0.45 * k / 9) for k in range(10)]
        blob('ptarm', balls, M['pink'], point)
        ball('ptglove', V(24.2, 13.4, -2.2), 1.45, M['glove'], point)
        layers = dict(legs=legs, up=up, arm=arm, point=point)
        for tag, c in layers.items():
            for c2 in layers.values(): c2.hide_render = c2 is not c
            sc.render.filepath = f'{OUT}/{name}-{tag}.webp'
            bpy.ops.render.render(write_still=True)
        return
    sc.render.filepath = f'{OUT}/{name}.webp'
    bpy.ops.render.render(write_still=True)

render(RIDE, 'ride', split=True)
render(AIR, 'air')
render(FLIP, 'flip')
print('DONE', OUT)
