# Angles Lab · Grade 9

An interactive, narrated learning section on angles: 29 screens covering points and rays, angle types, angle pairs, linear pairs and their converse, intersecting lines, and a proof of the Vertically Opposite Angles theorem. To run it, open `index.html` in Chrome or Edge. There is no build step.

- **Voice-over:** 161 narrated lines (2.7 MB, Ogg Opus) in `assets/vo/`. How they were made, checked and remade is in [docs/VOICEOVER.md](docs/VOICEOVER.md).
- **Code:** `js/core/` holds the engine, geometry scene, UI, audio and voice. `js/screens/` holds one file per chapter.
- **Testing aids:** `index.html?s=17` opens screen 17, `?vo=0` turns the narration off, and `?speed=2` speeds up every timeline.
- **`.tmp/`** is a scratch folder for build and test runs. It is safe to delete.
