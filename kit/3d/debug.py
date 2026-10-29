"""Builds the character without rendering and prints each object's size and bounding box.

Run it after every change to 3d/character.json, before any render: npm run shot:debug
It catches unit mistakes in seconds. On a real film the first render was "thin spiky sheets"
because depth missed the unit scale and the body came out 110 m deep; one printout shows that.
Works inside Blender (blender -b --python 3d/debug.py) or from plain Python, which re-runs it in Blender.
"""
import os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True  # no __pycache__ left in 3d/
import character  # noqa: E402

if character.bpy is None:
    blender = os.environ.get("BLENDER") or next(
        (b for b in [os.path.expanduser("~/opt/blender.sh"), os.path.join(HERE, "..", ".tools", "blender", "blender.sh"),
                     shutil.which("blender")] if b and os.access(b, os.X_OK)), None)
    if not blender:
        sys.exit("Blender not found. Run: npm run blender:install")
    os.execv(blender, [blender, "-b", "--factory-startup", "--python", os.path.abspath(__file__), "--", *sys.argv[1:]])

if "--" not in sys.argv:
    sys.argv.append("--")
sys.argv.append("--debug")
character.main()
