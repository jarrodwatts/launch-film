"""Builds a brand character in 3D from its own SVG paths, then renders one shot as PNG frames.

What the viewer sees: the flat brand art, inflated into a soft rounded body, with its features
(a fold, a brow, eyes) lying on the surface where the 2D art puts them, in the brand's colours.

Everything product-specific lives in 3d/character.json (paths, depths, colours, lights, cameras).
Run it headless through Blender (3d/render-shot.sh does this for you):

  blender -b -P 3d/character.py -- <out_dir> <shot> [--preview|--cpu-final|--gpu]
          [--config 3d/character.json] [--source <text>] [--debug]

Shots: still (1 frame), spin (30, turns in from the side), idle (60, breathing loop with a blink),
hop (36, squash and stretch), fly (28, a full turn while the camera dollies in until the body fills
the frame). Frames are RGBA PNGs named 0001.png onward. Next to them, shot.json holds this shot's
manifest entry (frames, size, camera, base, anchorY, loop, quality, lastFrameFill, source).
--debug builds the model, prints each object's size and bounding box, and renders nothing.
"""
import json, math, os, re, sys

try:  # The SVG parser below is plain Python, so it can be tested outside Blender.
    import bpy, bmesh
    from mathutils import Matrix, Vector
    from mathutils.bvhtree import BVHTree
except ImportError:
    bpy = None

HERE = os.path.dirname(os.path.abspath(__file__))
TIERS = {"preview": (400, 24), "cpu-final": (600, 40), "gpu": (800, 96)}  # pixels, samples
SHOT_FRAMES = {"still": 1, "spin": 30, "idle": 60, "hop": 36, "fly": 28}


# ---------- SVG paths, every command, absolute and relative ----------

TOKEN = re.compile(r"[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")


def _arc(p0, rx, ry, phi, large, sweep, p1, n):
    """Points along an SVG elliptical arc (endpoint form converted to centre form, SVG spec F.6.5)."""
    if p0 == p1:
        return []
    rx, ry = abs(rx), abs(ry)
    if rx == 0 or ry == 0:
        return [p1]
    c, s = math.cos(math.radians(phi)), math.sin(math.radians(phi))
    dx, dy = (p0[0] - p1[0]) / 2, (p0[1] - p1[1]) / 2
    x1, y1 = c * dx + s * dy, -s * dx + c * dy
    lam = x1 ** 2 / rx ** 2 + y1 ** 2 / ry ** 2
    if lam > 1:  # radii too small to reach: scale them up, as browsers do
        rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
    num = rx ** 2 * ry ** 2 - rx ** 2 * y1 ** 2 - ry ** 2 * x1 ** 2
    den = rx ** 2 * y1 ** 2 + ry ** 2 * x1 ** 2
    k = math.sqrt(max(0.0, num / den)) * (-1 if large == sweep else 1)
    cxp, cyp = k * rx * y1 / ry, -k * ry * x1 / rx
    cx = c * cxp - s * cyp + (p0[0] + p1[0]) / 2
    cy = s * cxp + c * cyp + (p0[1] + p1[1]) / 2
    ang = lambda ux, uy, vx, vy: math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
    ux, uy = (x1 - cxp) / rx, (y1 - cyp) / ry
    t0 = ang(1, 0, ux, uy)
    dt = ang(ux, uy, (-x1 - cxp) / rx, (-y1 - cyp) / ry)
    if not sweep and dt > 0:
        dt -= 2 * math.pi
    elif sweep and dt < 0:
        dt += 2 * math.pi
    out = []
    for i in range(1, n + 1):
        t = t0 + dt * i / n
        out.append((c * rx * math.cos(t) - s * ry * math.sin(t) + cx, s * rx * math.cos(t) + c * ry * math.sin(t) + cy))
    out[-1] = p1
    return out


def parse_path(d, per_curve=24):
    """Samples an SVG path into subpaths, each a list of (x, y). Supports M L H V C S Q T A Z, any case."""
    toks = TOKEN.findall(d.replace(",", " "))
    subs, pts = [], []
    cur = start = (0.0, 0.0)
    last_c = last_q = None  # reflected control points for S and T
    cmd, i = None, 0

    def num():
        nonlocal i
        v = float(toks[i]); i += 1
        return v

    def flag():  # arc flags may be packed ("01"), so read them one character at a time
        nonlocal i
        t = toks[i]
        if len(t) > 1 and t[0] in "01":
            toks[i] = t[1:]
            return int(t[0])
        i += 1
        return int(float(t))

    def bezier(ctrl, end):
        p = [cur, *ctrl, end]
        for k in range(1, per_curve + 1):
            t, u = k / per_curve, 1 - k / per_curve
            if len(p) == 4:
                w = (u ** 3, 3 * u * u * t, 3 * u * t * t, t ** 3)
            else:
                w = (u * u, 2 * u * t, t * t)
            pts.append(tuple(sum(wj * pj[a] for wj, pj in zip(w, p)) for a in (0, 1)))

    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]; i += 1
        elif cmd is None:
            raise ValueError("SVG path must start with M")
        rel = cmd.islower()
        C = cmd.upper()
        ox, oy = cur if rel else (0.0, 0.0)
        pt = lambda: (num() + ox, num() + oy)
        if C == "Z":
            if pts:
                subs.append(pts)
            pts, cur = [], start
            last_c = last_q = None
            continue
        if C == "M":
            if pts:
                subs.append(pts)
            cur = start = pt()
            pts = [cur]
            cmd = "l" if rel else "L"  # extra pairs after M are line-tos
            last_c = last_q = None
            continue
        if C in "LHV":
            end = pt() if C == "L" else ((num() + ox, cur[1]) if C == "H" else (cur[0], num() + oy))
            pts.append(end)
            cur, last_c, last_q = end, None, None
        elif C == "C":
            c1, c2, end = pt(), pt(), pt()
            bezier([c1, c2], end); cur, last_c, last_q = end, c2, None
        elif C == "S":
            c1 = (2 * cur[0] - last_c[0], 2 * cur[1] - last_c[1]) if last_c else cur
            c2, end = pt(), pt()
            bezier([c1, c2], end); cur, last_c, last_q = end, c2, None
        elif C == "Q":
            q, end = pt(), pt()
            bezier([q], end); cur, last_q, last_c = end, q, None
        elif C == "T":
            q = (2 * cur[0] - last_q[0], 2 * cur[1] - last_q[1]) if last_q else cur
            end = pt()
            bezier([q], end); cur, last_q, last_c = end, q, None
        elif C == "A":
            rx, ry, phi = num(), num(), num()
            large, sweep = flag(), flag()
            end = pt()
            pts.extend(_arc(cur, rx, ry, phi, large, sweep, end, per_curve))
            cur, last_c, last_q = end, None, None
    if pts:
        subs.append(pts)
    for s in subs:  # a closed outline must not repeat its first point
        if len(s) > 1 and math.dist(s[0], s[-1]) < 1e-6:
            s.pop()
    return subs


def outline(d):
    """The first closed outline of a path (one shape per path keeps inflate simple)."""
    subs = parse_path(d)
    if len(subs) > 1:
        print(f"note: path has {len(subs)} subpaths; using the first", file=sys.stderr)
    return subs[0]


def resample(pts, n):
    """Evenly spaced points along a closed outline, so the mesh rings are even and smoothing doesn't pucker."""
    seg = [math.dist(pts[i], pts[(i + 1) % len(pts)]) for i in range(len(pts))]
    total, out, acc, j = sum(seg), [], 0.0, 0
    for k in range(n):
        target = total * k / n
        while acc + seg[j] < target:
            acc += seg[j]; j += 1
        t = (target - acc) / seg[j] if seg[j] else 0
        a, b = pts[j], pts[(j + 1) % len(pts)]
        out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out


# ---------- the build (Blender only) ----------

def hexrgb(h, a=1.0):
    """Brand hex (sRGB) to Blender's linear colour. Skipping this makes every colour pale."""
    h = h.lstrip("#")
    srgb = [int(h[k:k + 2], 16) / 255 for k in (0, 2, 4)]
    return (*[c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb], a)


class Units:
    """The one place SVG units turn into metres. Every coordinate, depth and lift goes through it."""

    def __init__(self, cfg):
        self.ox, self.oy = cfg["origin"]
        self.s = cfg["scale"]

    def to3(self, x, y, depth=0.0):
        """SVG (x, y) plus depth toward the camera, to Blender: x right, z up, the face towards -Y."""
        return Vector(((x - self.ox) * self.s, -depth * self.s, -(y - self.oy) * self.s))

    def to2(self, v):
        return v.x / self.s + self.ox, -v.z / self.s + self.oy


def inflate(u, name, pts, front, back, rings=22, centre=None):
    """A closed blob from a star-shaped outline: rings shrink to a centre point on an elliptic profile."""
    pts = resample(pts, 160)
    cx = centre[0] if centre else sum(p[0] for p in pts) / len(pts)
    cy = centre[1] if centre else sum(p[1] for p in pts) / len(pts)
    bm = bmesh.new()
    rim = [bm.verts.new(u.to3(x, y, 0)) for x, y in pts]
    for depth in (front, -back):
        prev = rim
        for k in range(1, rings):
            th = (k / rings) * (math.pi / 2)
            r = math.cos(th)
            cur = [bm.verts.new(u.to3(cx + (x - cx) * r, cy + (y - cy) * r, depth * math.sin(th))) for x, y in pts]
            for i in range(len(pts)):
                f = (prev[i], prev[(i + 1) % len(pts)], cur[(i + 1) % len(pts)], cur[i])
                bm.faces.new(f if depth > 0 else f[::-1])
            prev = cur
        tip = bm.verts.new(u.to3(cx, cy, depth))
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


def onto(u, bvh, x, y, lift=0.0):
    """The point on the body's front surface over SVG (x, y), lifted along the normal, and that normal."""
    hit, normal, _, _ = bvh.ray_cast(u.to3(x, y, 1000), Vector((0, 1, 0)), 1e4)
    if hit is None:
        print(f"warning: ({x:.0f}, {y:.0f}) misses the body; the feature will float", file=sys.stderr)
        return u.to3(x, y, 0), Vector((0, -1, 0))
    return hit + normal * lift * u.s, normal


def gradient(u, nt, spec):
    """A linear gradient between two SVG points in object space, optionally warmed by a radial blush."""
    tex = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tex.outputs["Object"], sep.inputs[0])
    A, B = u.to3(*spec["from"]), u.to3(*spec["to"])
    d = B - A
    # t = dot(p - A, d) / |d|^2, built from math nodes over x and z.
    mx = nt.nodes.new("ShaderNodeMath"); mx.operation = "MULTIPLY_ADD"
    mx.inputs[1].default_value = d.x / d.length_squared
    mx.inputs[2].default_value = -(A.x * d.x + A.z * d.z) / d.length_squared
    nt.links.new(sep.outputs["X"], mx.inputs[0])
    mz = nt.nodes.new("ShaderNodeMath"); mz.operation = "MULTIPLY_ADD"
    mz.inputs[1].default_value = d.z / d.length_squared
    nt.links.new(sep.outputs["Z"], mz.inputs[0]); nt.links.new(mx.outputs[0], mz.inputs[2])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    stops = spec["stops"]
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = stops[0][0], hexrgb(stops[0][1])
    els[1].position, els[1].color = stops[-1][0], hexrgb(stops[-1][1])
    for pos, col in stops[1:-1]:
        els.new(pos).color = hexrgb(col)
    nt.links.new(mz.outputs[0], ramp.inputs[0])
    colour = ramp.outputs[0]
    blush = spec.get("blush")
    if blush:
        dist = nt.nodes.new("ShaderNodeVectorMath"); dist.operation = "DISTANCE"
        dist.inputs[1].default_value = u.to3(*blush["at"], 20)
        nt.links.new(tex.outputs["Object"], dist.inputs[0])
        fall = nt.nodes.new("ShaderNodeMapRange")
        fall.inputs["From Min"].default_value, fall.inputs["From Max"].default_value = 0.0, blush["radius"] * u.s
        fall.inputs["To Min"].default_value, fall.inputs["To Max"].default_value = blush.get("strength", 1.0), 0.0
        nt.links.new(dist.outputs["Value"], fall.inputs["Value"])
        mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = "RGBA"
        nt.links.new(fall.outputs[0], mix.inputs["Factor"])
        nt.links.new(colour, mix.inputs["A"]); mix.inputs["B"].default_value = hexrgb(blush["colour"])
        colour = mix.outputs["Result"]
    return colour


def material(u, name, spec):
    """A matte brand material: a flat colour or a gradient, with a little subsurface and a faint coat."""
    m = bpy.data.materials.new(name)
    if m.node_tree is None:  # Blender 4.x; from 5.0 every material has nodes
        m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    if "gradient" in spec:
        nt.links.new(gradient(u, nt, spec["gradient"]), bsdf.inputs["Base Color"])
    else:
        bsdf.inputs["Base Color"].default_value = hexrgb(spec["colour"])
    bsdf.inputs["Roughness"].default_value = spec.get("roughness", 0.5)
    bsdf.inputs["Subsurface Weight"].default_value = spec.get("subsurface", 0.0)
    bsdf.inputs["Coat Weight"].default_value = spec.get("coat", 0.12)
    bsdf.inputs["Coat Roughness"].default_value = 0.25
    return m


def smooth(obj, levels=2):
    sub = obj.modifiers.new("smooth", "SUBSURF")
    sub.levels = sub.render_levels = levels


def build(cfg):
    """Body, features laid on it by raycast, eyes on an explicit basis, all parented to one rig."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    u = Units(cfg)
    b = cfg["body"]
    body_pts = outline(b["path"])
    body = inflate(u, "body", body_pts, b["front"], b["back"], centre=b.get("centre"))
    smooth(body)
    body.data.materials.append(material(u, "body", b["material"]))
    bpy.context.view_layer.update()
    bvh = BVHTree.FromObject(body, bpy.context.evaluated_depsgraph_get())
    parts = [body]

    # Features are built flat, then every vertex moves onto the curved body plus a lift.
    # Subdivision pulls the body in a little, so features need a lift of about 1 to 1.5 units.
    for f in cfg.get("features", []):
        obj = inflate(u, f["name"], outline(f["path"]), f["front"], f.get("back", 1), rings=f.get("rings", 12))
        for v in obj.data.vertices:
            height = -v.co.y / u.s
            hit, normal = onto(u, bvh, *u.to2(v.co))
            v.co = hit + normal * (height + f.get("lift", 1.2)) * u.s
        if f.get("smooth", True):
            smooth(obj)
        obj.data.materials.append(material(u, f["name"], f["material"]))
        parts.append(obj)

    # Eyes: local -Y along the surface normal and local Z as close to world up as it can be.
    # A shortest-arc rotation instead twists them, and tall eyes come out wide.
    eyes = []
    for k, e in enumerate(cfg.get("eyes", [])):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1)
        o = bpy.context.active_object
        o.name = f"eye{k}"
        hit, normal = onto(u, bvh, *e["at"], e.get("lift", 0.4))
        o.location = hit
        back = -normal
        side = back.cross(Vector((0, 0, 1))).normalized()
        up = side.cross(back).normalized()
        o.rotation_mode = "QUATERNION"
        o.rotation_quaternion = Matrix((side, back, up)).transposed().to_quaternion()
        o.scale = (e["r"][0] * u.s, e.get("depth", 3.2) * u.s, e["r"][1] * u.s)
        bpy.ops.object.shade_smooth()
        o.data.materials.append(material(u, f"eye{k}", e.get("material", {"colour": "#141c26", "roughness": 0.35, "coat": 0.25})))
        eyes.append(o)

    # Everything turns and squashes together about the base of the body.
    xs, ys = [p[0] for p in body_pts], [p[1] for p in body_pts]
    bx, by = cfg.get("base", [(min(xs) + max(xs)) / 2, max(ys)])
    rig = bpy.data.objects.new("rig", None)
    bpy.context.collection.objects.link(rig)
    rig.location = u.to3(bx, by, 0)
    bpy.context.view_layer.update()  # Blender doesn't refresh matrix_world after setting location
    for o in parts + eyes:
        o.parent = rig
        o.matrix_parent_inverse = rig.matrix_world.inverted()
    return rig, eyes


def stage(cfg, tier):
    """Camera, three soft area lights and render settings. Dim lights and Standard keep brand hexes true."""
    scene = bpy.context.scene
    look = cfg.get("look", {})
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    if tier == "gpu":  # RTX cards render through OptiX; every OptiX device found is used.
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "OPTIX"
        prefs.get_devices()
        for device in prefs.devices:
            device.use = device.type == "OPTIX"
        scene.cycles.device = "GPU"
    size, samples = TIERS[tier]
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    # AgX and Filmic desaturate brand colours; Standard keeps them.
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = look.get("exposure", 0.35)
    world = bpy.data.worlds.new("world"); scene.world = world
    if world.node_tree is None:
        world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = hexrgb("#ffffff"); bg.inputs[1].default_value = look.get("world", 0.35)

    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    bpy.context.collection.objects.link(cam)
    cam.data.lens = look.get("lens", 85)
    cam.location = (0, -cfg["camera"]["base"], cfg["camera"].get("height", 0.05))
    cam.rotation_euler = (math.radians(90), 0, 0)
    scene.camera = cam

    lights = look.get("lights", {})
    for name, loc, size_m, default, colour in [
        ("key", (1.5, -5.0, 3.0), 5.0, 230, "#ffffff"),   # big soft key from upper left
        ("fill", (-3.5, -3.5, -0.5), 4.0, 60, "#d7e3ff"),  # cool fill, low right
        ("rim", (1.5, 4.0, 3.0), 2.5, 350, "#d7e3ff"),     # rim from behind
    ]:
        spec = lights.get(name, {})
        light = bpy.data.objects.new(name, bpy.data.lights.new(name, "AREA"))
        light.data.size = size_m
        light.data.energy = spec.get("energy", default)
        light.data.color = hexrgb(spec.get("colour", colour))[:3]
        light.location = loc
        bpy.context.collection.objects.link(light)
        light.rotation_euler = (Vector((0, 0, 0)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()


def animate(cfg, shot, rig, eyes):
    """Each shot is a pure function of the frame number, so a re-render gives the same frames."""
    scene = bpy.context.scene
    cam = scene.camera
    base_z = rig.location.z
    rig.rotation_mode = "XYZ"
    n = SHOT_FRAMES[shot]
    scene.frame_start, scene.frame_end = 1, n
    eye_scale = [e.scale.copy() for e in eyes]
    for f in range(1, n + 1):
        t = (f - 1) / max(1, n - 1)
        if shot == "spin":  # turns in from the side and settles, decelerating hard
            e = 1 - (1 - t) ** 3
            rig.rotation_euler = (math.radians(4 * (1 - e)), 0, math.radians(-80 * (1 - e)))
        elif shot == "idle":  # a two-second breathing sway, one blink at frame 40
            ph = (f - 1) / n * 2 * math.pi
            rig.rotation_euler = (math.radians(1.5 * math.sin(ph)), 0, math.radians(4 * math.sin(ph + 0.6)))
            shut = max(0.0, 1 - abs(f - 40) / 3)
            for e, s in zip(eyes, eye_scale):
                e.scale = (s.x, s.y, s.z * (1 - 0.9 * shut))
                e.keyframe_insert("scale", frame=f)
        elif shot == "fly":  # a full turn toward the lens while the camera dollies in, speeding up
            e = t ** 2.2
            rig.rotation_euler = (math.radians(-10 * e), math.radians(8 * math.sin(t * math.pi)), math.radians(360 * e))
            near = cfg["camera"].get("fly_end", 0.6)
            cam.location = (0, -cfg["camera"]["base"] + (cfg["camera"]["base"] - near) * e, 0.05 + 0.15 * e)
            cam.keyframe_insert("location", frame=f)
        rig.keyframe_insert("rotation_euler", frame=f)
    if shot == "hop":  # crouch, spring up stretched, land squashed, settle
        cam.location = (0, -cfg["camera"].get("hop", cfg["camera"]["base"]), 0.45)
        keys = [(1, 0, 1.0, 1.0), (6, 0, 1.12, 0.84), (11, 0.55, 0.9, 1.16), (16, 0.8, 0.97, 1.04),
                (21, 0, 1.18, 0.8), (26, 0, 0.96, 1.05), (31, 0, 1.02, 0.98), (36, 0, 1.0, 1.0)]
        for f, lift, wide, tall in keys:
            rig.location.z = base_z + lift
            rig.scale = (wide, wide, tall)
            rig.rotation_euler = (0, 0, math.radians(6 if 9 < f < 21 else 0))
            for path in ("location", "scale", "rotation_euler"):
                rig.keyframe_insert(path, frame=f)


def anchor_y(rig):
    """Where the body's base sits in the frame on frame 1, 0 = top, 1 = bottom. The film's player reads it."""
    from bpy_extras.object_utils import world_to_camera_view
    scene = bpy.context.scene
    scene.frame_set(1)
    return round(1 - world_to_camera_view(scene, scene.camera, rig.matrix_world.translation).y, 3)


def last_fill(path):
    """The last frame's centre colour as hex, but only when the body covers the whole frame (the fly's end).

    The film lays a flat fill of this colour over the last frame, then wipes to the next scene through it.
    Sampled, not typed: a hand-picked colour drifts from the render.
    """
    img = bpy.data.images.load(path)
    w, h = img.size
    px = img.pixels[:]
    bpy.data.images.remove(img)
    at = lambda fx, fy: px[(int(fy * (h - 1)) * w + int(fx * (w - 1))) * 4:][:4]
    if any(at(fx, fy)[3] < 0.99 for fx, fy in [(0.5, 0.5), (0.1, 0.1), (0.9, 0.1), (0.1, 0.9), (0.9, 0.9)]):
        return None
    return "#" + "".join(f"{round(min(1, max(0, c)) * 255):02x}" for c in at(0.5, 0.5)[:3])


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    opt = lambda k, d=None: argv[argv.index(k) + 1] if k in argv else d
    cfg = json.load(open(opt("--config", os.path.join(HERE, "character.json"))))
    rig, eyes = build(cfg)
    if "--debug" in argv:
        bpy.context.view_layer.update()
        for o in sorted(bpy.data.objects, key=lambda o: o.name):
            if o.type != "MESH":
                continue
            corners = [o.matrix_world @ Vector(c) for c in o.bound_box]
            lo = [min(c[k] for c in corners) for k in range(3)]
            hi = [max(c[k] for c in corners) for k in range(3)]
            print(f"{o.name:8s} size {o.dimensions.x:6.3f} x {o.dimensions.y:6.3f} x {o.dimensions.z:6.3f} m   "
                  f"box ({lo[0]:6.2f},{lo[1]:6.2f},{lo[2]:6.2f}) to ({hi[0]:6.2f},{hi[1]:6.2f},{hi[2]:6.2f})")
        print("Body should be about 1.5 to 2 m wide. Anything 100x off is a unit bug in the config.")
        return
    out, shot = os.path.abspath(argv[0]), argv[1]
    if shot not in SHOT_FRAMES:
        sys.exit(f"unknown shot {shot}; pick one of {', '.join(SHOT_FRAMES)}")
    tier = next((t for t in TIERS if f"--{t}" in argv), "preview")
    stage(cfg, tier)
    animate(cfg, shot, rig, eyes)
    anchor = anchor_y(rig)
    os.makedirs(out, exist_ok=True)
    bpy.context.scene.render.filepath = out + "/"  # Blender names frames 0001.png onward
    bpy.ops.render.render(animation=True)
    n = SHOT_FRAMES[shot]
    cam = cfg["camera"]
    entry = {shot: {
        "frames": n, "size": TIERS[tier][0],
        "camera": cam.get("hop", cam["base"]) if shot == "hop" else cam["base"], "base": cam["base"],
        "anchorY": anchor, "loop": shot == "idle", "quality": tier,
        "lastFrameFill": last_fill(os.path.join(out, f"{n:04d}.png")),
        "source": opt("--source", "3d/character.py"),
    }}
    json.dump(entry, open(os.path.join(out, "shot.json"), "w"), indent=1)
    print(json.dumps(entry))


if __name__ == "__main__" and bpy is not None:
    main()
