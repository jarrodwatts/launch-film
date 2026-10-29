"""Builds Auni's mascot in 3D from its own SVG paths (apps/web/components/brand/mascot-art.tsx).

The body is the 2D silhouette inflated into a rounded blob; the fold, brow and eyes are laid on
its surface where the 2D art puts them, in the same colours. Run headless:

  blender.sh -b -P mascot.py -- <out_dir> [shot] [--preview] [--gpu]

Shots: "still" (one front frame), "spin" (turns in from the side), "idle" (a breathing loop
with one blink), "hop" (a happy jump with squash and stretch), "fly" (a full 3D turn as the
camera dollies in until the body fills the frame). Frames are RGBA PNGs at 800x800, for the film to place and animate.
"""
import math, os, re, sys

import bpy
import bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/mascot"
SHOT = argv[1] if len(argv) > 1 else "still"
PREVIEW = "--preview" in argv

BODY = "M43 145C48 108 77 60 114 46C139 36 176 39 197 53C212 63 209 81 202 94C214 117 226 139 224 162C226 200 199 222 147 225C93 228 58 211 46 182C41 171 40 157 43 145Z"
FOLD = "M121 47C144 38 179 41 198 53C210 60 215 72 211 85C207 102 193 94 181 83C161 66 143 54 121 53Z"
CREASE = "M123 53C155 49 181 68 203 99L191 109C171 89 153 65 123 53Z"
BROW = "M90 101C87 92 97 82 106 86C110 87 114 90 116 93C105 91 99 94 90 101Z"
EYES = [((112, 121), (7.7, 12)), ((156, 115), (7.7, 12))]
GLINTS = [((110, 116), (1.7, 2.3)), ((154, 110), (1.7, 2.3))]
S = 0.01  # SVG units to metres


def hexrgb(h, a=1.0):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, a)


def svg_points(d, per_curve=24):
    """Samples an SVG path of M, C, L and Z commands into a closed list of (x, y)."""
    tokens = re.findall(r"[MCLZ]|-?\d+\.?\d*", d)
    pts, i, cur, cmd = [], 0, None, None
    while i < len(tokens):
        if tokens[i] in "MCLZ":
            cmd = tokens[i]; i += 1
            if cmd == "Z":
                continue
        n = lambda k: float(tokens[i + k])
        if cmd == "M":
            cur = (n(0), n(1)); pts.append(cur); i += 2
        elif cmd == "L":
            nxt = (n(0), n(1))
            for s in range(1, per_curve + 1):
                t = s / per_curve
                pts.append((cur[0] + (nxt[0] - cur[0]) * t, cur[1] + (nxt[1] - cur[1]) * t))
            cur = nxt; i += 2
        elif cmd == "C":
            c1, c2, e = (n(0), n(1)), (n(2), n(3)), (n(4), n(5))
            for s in range(1, per_curve + 1):
                t = s / per_curve; u = 1 - t
                pts.append(tuple(u ** 3 * cur[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t ** 3 * e[k] for k in (0, 1)))
            cur = e; i += 6
    if pts[0] == pts[-1]:
        pts.pop()
    return pts


def resample(pts, n):
    """Evenly spaced points along a closed outline, so the mesh has even rings."""
    seg = [math.dist(pts[i], pts[(i + 1) % len(pts)]) for i in range(len(pts))]
    total, out, acc, j = sum(seg), [], 0.0, 0
    for k in range(n):
        target = total * k / n
        while acc + seg[j] < target:
            acc += seg[j]; j += 1
        t = (target - acc) / seg[j]
        a, b = pts[j], pts[(j + 1) % len(pts)]
        out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out


def to3(x, y, depth=0.0):
    """SVG (x, y) to Blender: x right, z up, the face towards -Y (the camera)."""
    return Vector(((x - 133) * S, -depth * S, -(y - 136) * S))


def inflate(name, outline, front, back, rings=22, centre=None):
    """A closed blob from a star-shaped outline: rings shrink to the centre on an elliptic profile."""
    pts = resample(outline, 160)
    cx = centre[0] if centre else sum(p[0] for p in pts) / len(pts)
    cy = centre[1] if centre else sum(p[1] for p in pts) / len(pts)
    bm = bmesh.new()
    def ring(theta, depth):
        r = math.cos(theta)
        return [bm.verts.new(to3(cx + (x - cx) * r, cy + (y - cy) * r, depth * math.sin(theta))) for x, y in pts]
    rim = [bm.verts.new(to3(x, y, 0)) for x, y in pts]
    for depth in (front, -back):
        prev = rim
        for k in range(1, rings):
            cur = ring((k / rings) * (math.pi / 2), depth)
            for i in range(len(pts)):
                f = (prev[i], prev[(i + 1) % len(pts)], cur[(i + 1) % len(pts)], cur[i])
                bm.faces.new(f if depth > 0 else f[::-1])
            prev = cur
        tip = bm.verts.new(to3(cx, cy, depth))
        for i in range(len(pts)):
            f = (prev[i], prev[(i + 1) % len(pts)], tip)
            bm.faces.new(f if depth > 0 else f[::-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    for p in mesh.polygons:
        p.use_smooth = True
    return obj


def onto(body_bvh, x, y, lift=0.0):
    """The point on the body's front surface over SVG (x, y), and its normal."""
    origin = to3(x, y, 200)
    hit, normal, _, _ = body_bvh.ray_cast(origin, Vector((0, 1, 0)), 10)
    if hit is None:
        return to3(x, y, 30), Vector((0, -1, 0))
    return hit + normal * lift, normal


def material(name, build):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    build(nt, bsdf)
    return m


def gradient(nt, bsdf, stops, a, b, blush=None):
    """A linear gradient from SVG point a to b (object space), optionally warmed by a radial blush."""
    tex = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tex.outputs["Object"], sep.inputs[0])
    A, B = to3(*a), to3(*b)
    d = B - A
    # t = dot(p - A, d) / |d|^2, built from math nodes over x and z.
    mx = nt.nodes.new("ShaderNodeMath"); mx.operation = "MULTIPLY_ADD"
    mx.inputs[1].default_value = d.x / d.length_squared; mx.inputs[2].default_value = -(A.x * d.x + A.z * d.z) / d.length_squared
    nt.links.new(sep.outputs["X"], mx.inputs[0])
    mz = nt.nodes.new("ShaderNodeMath"); mz.operation = "MULTIPLY_ADD"
    mz.inputs[1].default_value = d.z / d.length_squared
    nt.links.new(sep.outputs["Z"], mz.inputs[0]); nt.links.new(mx.outputs[0], mz.inputs[2])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position, ramp.color_ramp.elements[0].color = stops[0][0], hexrgb(stops[0][1])
    ramp.color_ramp.elements[1].position, ramp.color_ramp.elements[1].color = stops[-1][0], hexrgb(stops[-1][1])
    for pos, col in stops[1:-1]:
        e = ramp.color_ramp.elements.new(pos); e.color = hexrgb(col)
    nt.links.new(mz.outputs[0], ramp.inputs[0])
    colour = ramp.outputs[0]
    if blush:
        (bx, by), radius, col, strength = blush
        dist = nt.nodes.new("ShaderNodeVectorMath"); dist.operation = "DISTANCE"
        dist.inputs[1].default_value = to3(bx, by, 20)
        nt.links.new(tex.outputs["Object"], dist.inputs[0])
        fall = nt.nodes.new("ShaderNodeMapRange")
        fall.inputs["From Min"].default_value, fall.inputs["From Max"].default_value = 0.0, radius * S
        fall.inputs["To Min"].default_value, fall.inputs["To Max"].default_value = strength, 0.0
        nt.links.new(dist.outputs["Value"], fall.inputs["Value"])
        mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
        nt.links.new(fall.outputs[0], mix.inputs["Factor"])
        nt.links.new(colour, mix.inputs["A"]); mix.inputs["B"].default_value = hexrgb(col)
        colour = mix.outputs["Result"]
    nt.links.new(colour, bsdf.inputs["Base Color"])


def build():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    body = inflate("body", svg_points(BODY), front=62, back=48, centre=(136, 138))
    sub = body.modifiers.new("smooth", "SUBSURF"); sub.levels = sub.render_levels = 2
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    bvh = BVHTree.FromObject(body, dg)

    def body_mat(nt, bsdf):
        gradient(nt, bsdf, [(0, "#5388ff"), (0.5, "#98caff"), (1, "#bddfff")], (57, 90), (208, 191),
                 blush=((207, 185), 110, "#ffe6da", 1.0))
        # Soft, matte and saturated like the app's own mascot art, with only a faint sheen.
        bsdf.inputs["Roughness"].default_value = 0.5
        bsdf.inputs["Subsurface Weight"].default_value = 0.04
        bsdf.inputs["Subsurface Radius"].default_value = (0.6, 0.8, 1.0)
        bsdf.inputs["Coat Weight"].default_value = 0.12
        bsdf.inputs["Coat Roughness"].default_value = 0.25
    body.data.materials.append(material("body", body_mat))

    # The fold: a thin flap lying on the body, in its own darker blue.
    fold = inflate("fold", svg_points(FOLD), front=16, back=2, rings=12)
    for v in fold.data.vertices:
        x, y = v.co.x / S + 133, -v.co.z / S + 136
        hit, normal = onto(bvh, x, y)
        v.co = hit + normal * (-v.co.y + 0.012)
    fsub = fold.modifiers.new("smooth", "SUBSURF"); fsub.levels = fsub.render_levels = 2
    def fold_mat(nt, bsdf):
        gradient(nt, bsdf, [(0, "#88a5ff"), (0.6, "#a4aaff"), (1, "#6487fa")], (141, 39), (191, 99))
        bsdf.inputs["Roughness"].default_value = 0.45
        bsdf.inputs["Coat Weight"].default_value = 0.12
    fold.data.materials.append(material("fold", fold_mat))

    def ink(nt, bsdf):
        bsdf.inputs["Base Color"].default_value = hexrgb("#101e38")
        bsdf.inputs["Roughness"].default_value = 0.35
        bsdf.inputs["Coat Weight"].default_value = 0.25
    ink_mat = material("ink", ink)

    def glint(nt, bsdf):
        bsdf.inputs["Base Color"].default_value = hexrgb("#daedff")
        bsdf.inputs["Emission Color"].default_value = hexrgb("#daedff")
        bsdf.inputs["Emission Strength"].default_value = 0.4
    glint_mat = material("glint", glint)

    def bump(name, cx, cy, rx, ry, depth, mat, lift):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1)
        o = bpy.context.active_object; o.name = name
        hit, normal = onto(bvh, cx, cy, lift)
        o.location = hit
        # Face the surface: local -Y out along the normal, local Z kept as close to up as it can be,
        # so the eye's height (ry) stays vertical on the curved body.
        back = -normal
        side = back.cross(Vector((0, 0, 1))).normalized()
        up = side.cross(back).normalized()
        from mathutils import Matrix
        o.rotation_mode = "QUATERNION"
        o.rotation_quaternion = Matrix((side, back, up)).transposed().to_quaternion()
        o.scale = (rx * S, depth * S, ry * S)
        bpy.ops.object.shade_smooth()
        o.data.materials.append(mat)
        return o

    eyes = [bump(f"eye{i}", x, y, rx, ry, 3.2, ink_mat, 0.004) for i, ((x, y), (rx, ry)) in enumerate(EYES)]

    brow = inflate("brow", svg_points(BROW), front=5, back=1, rings=6)
    for v in brow.data.vertices:
        x, y = v.co.x / S + 133, -v.co.z / S + 136
        hit, normal = onto(bvh, x, y)
        v.co = hit + normal * (-v.co.y + 0.014)
    brow.data.materials.append(ink_mat)
    for p in brow.data.polygons:
        p.use_smooth = True

    # Everything turns and squashes together about the base of the body.
    rig = bpy.data.objects.new("rig", None)
    bpy.context.collection.objects.link(rig)
    rig.location = to3(136, 226, 0)
    bpy.context.view_layer.update()  # so the parent's matrix is current before children are bound to it
    for o in [body, fold, brow, *eyes]:
        o.parent = rig; o.matrix_parent_inverse = rig.matrix_world.inverted()
    return rig, eyes


def stage():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    if "--gpu" in argv:
        # NVIDIA cards render through OptiX; every GPU found is used.
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "OPTIX"
        prefs.get_devices()
        for device in prefs.devices:
            device.use = device.type == "OPTIX"
        scene.cycles.device = "GPU"
    scene.cycles.samples = 24 if PREVIEW else (40 if "--cpu-final" in argv else 96)
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = 400 if PREVIEW else (600 if "--cpu-final" in argv else 800)
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.35
    world = bpy.data.worlds.new("sky"); scene.world = world; world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = hexrgb("#ffffff"); bg.inputs[1].default_value = 0.35

    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    bpy.context.collection.objects.link(cam)
    cam.data.lens = 85
    cam.location = (0, -6.2, 0.05)
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam

    def area(name, loc, size, energy, colour):
        light = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
        light.data.size = size; light.data.energy = energy; light.data.color = colour[:3]
        light.location = loc
        bpy.context.collection.objects.link(light)
        direction = Vector((0, 0, 0)) - Vector(loc)
        light.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

    # A big soft key from upper left, a warm fill low right (the mascot's own peach), a cool rim.
    area("key", (1.5, -5.0, 3.0), 5.0, 230, hexrgb("#ffffff"))
    area("fill", (-3.5, -3.5, -0.5), 4.0, 60, hexrgb("#d7e3ff"))
    area("rim", (1.5, 4.0, 3.0), 2.5, 350, hexrgb("#d7e3ff"))


def shoot(rig, eyes):
    scene = bpy.context.scene
    os.makedirs(OUT, exist_ok=True)
    scene.render.filepath = os.path.join(OUT, f"{SHOT}_")
    rig.rotation_mode = "XYZ"
    base = [e.scale.copy() for e in eyes]
    if SHOT == "still":
        scene.frame_start = scene.frame_end = 1
        rig.rotation_euler = (0, 0, 0)
    elif SHOT == "spin":
        # Turns in from the side and settles, decelerating hard like the app's own curves.
        scene.frame_start, scene.frame_end = 1, 30
        for f in range(1, 31):
            t = (f - 1) / 29
            e = 1 - (1 - t) ** 3
            rig.rotation_euler = (math.radians(4 * (1 - e)), 0, math.radians(-80 * (1 - e)))
            rig.keyframe_insert("rotation_euler", frame=f)
    elif SHOT == "idle":
        # A two-second breathing sway, with one blink at about 1.3s.
        scene.frame_start, scene.frame_end = 1, 60
        for f in range(1, 61):
            ph = (f - 1) / 60 * 2 * math.pi
            rig.rotation_euler = (math.radians(1.5 * math.sin(ph)), 0, math.radians(4 * math.sin(ph + 0.6)))
            rig.keyframe_insert("rotation_euler", frame=f)
            close = max(0.0, 1 - abs(f - 40) / 3)
            for e, s in zip(eyes, base):
                e.scale = (s.x, s.y, s.z * (1 - 0.9 * close))
                e.keyframe_insert("scale", frame=f)
    elif SHOT == "fly":
        # A real 3D turn toward the lens: a full spin while the camera dollies in, speeding up,
        # until the body fills the frame and becomes the film's wipe.
        scene.frame_start, scene.frame_end = 1, 28
        cam = scene.camera
        for f in range(1, 29):
            t = (f - 1) / 27
            e = t ** 2.2
            rig.rotation_euler = (math.radians(-10 * e), math.radians(8 * math.sin(t * math.pi)), math.radians(360 * e))
            rig.keyframe_insert("rotation_euler", frame=f)
            cam.location = (0, -6.2 + 5.6 * e, 0.05 + 0.15 * e)
            cam.keyframe_insert("location", frame=f)
    elif SHOT == "hop":
        # A happy hop: crouch, spring up with a stretch, land with a squash, settle.
        scene.frame_start, scene.frame_end = 1, 36
        # Pulled back so the jump stays in frame; the film scales it to match the other shots.
        scene.camera.location = (0, -8.8, 0.45)
        rig.rotation_mode = "XYZ"
        keys = [(1, 0, 1.0, 1.0), (6, 0, 1.12, 0.84), (11, 0.55, 0.9, 1.16), (16, 0.8, 0.97, 1.04), (21, 0, 1.18, 0.8), (26, 0, 0.96, 1.05), (31, 0, 1.02, 0.98), (36, 0, 1.0, 1.0)]
        for f, lift, wide, tall in keys:
            rig.location.z = to3(136, 226, 0).z + lift
            rig.scale = (wide, wide, tall)
            rig.rotation_euler = (0, 0, math.radians(6 if 9 < f < 21 else 0))
            rig.keyframe_insert("location", frame=f); rig.keyframe_insert("scale", frame=f); rig.keyframe_insert("rotation_euler", frame=f)
    bpy.ops.render.render(animation=True)


rig, eyes = build()
stage()
shoot(rig, eyes)
