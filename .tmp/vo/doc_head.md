# Voice-over

Every line the narration bar can show is voiced: **161 lines, 11.5 minutes, 2.7 MB** in `assets/vo/`. That covers screen titles, steps, prompts, hints, wrong- and right-answer feedback, proof steps and the recap. Each clip is looked up by the exact text on screen, and the line types word by word at the voice's pace.

## How the clips were made

| Setting | Value |
|---|---|
| Studio | [Ai Wala Human By Aamir](https://ai-wala-human-by-aamir-809572708022.asia-southeast1.run.app/), tab *Batch Generation* |
| Language | Hindi |
| Voice | Female Teacher (Standard), a clear North Indian accent |
| Studio download | MP3, 24 kHz mono, 128 kbps |
| Shipped format | Ogg Opus, 32 kbps, mono, 48 kHz (about a quarter of the MP3 size) |
| Clip ids | `vo001` … `vo161`, in the order a learner first hears them |

**Why Hindi script for English lines.** Before speaking, the studio rewrites each line in the chosen language's script. English written in Devanagari ("Move ray O B." → "मूव रे ओ बी.") is spoken as English with an Indian accent, and the words stay English. Choose *English* instead for a neutral accent.

**Each row makes two requests.** First `gemini-3-flash-preview` rewrites the text in Devanagari, then `gemini-3.1-flash-tts-preview` speaks it.

**Rate limit.** The studio's proxy allows **100 requests per 15 minutes per IP**, which is about 48 lines per window. Over the limit it returns `429 Too many requests from this IP`. The headers `ratelimit-remaining` and `ratelimit-reset` say where you stand. The 161 lines took four windows.

## Spoken-form rules

The voice reads exactly what it is given, so `tools/vo_script.json` holds a **spoken** form beside each **line as shown**. The screen text never changes.

- Symbols are written as words: `∠1` → "angle one", `∠AOB` → "angle A O B", `°` → "degrees", `+` → "plus", `=` → "equals", `→` → "means".
- **Numbers are English words** ("one hundred and eighty"). If you write a digit, the script step sometimes turns it into a Hindi number word (180 → एक सौ अस्सी), and the voice then says it in Hindi.
- Point names are spaced so each letter is read: `OA` → "O A", `CD` → "C D".
- Dashes become sentence breaks, and commas add short pauses where a formula needs grouping ("So, angle one plus angle two, equals angle two plus angle three.").

88 of the 161 lines have a spoken form that differs from the text shown. The table below lists them all.

## Checks run on every clip

1. **Devanagari check.** The script-step output for every line is compared with its spoken form. Each line is flagged if it contains:
   - a Hindi number word (एक … सौ) or a digit;
   - a common Hindi word, meaning the English was translated rather than transliterated (कोण, रेखा, और …).

   The final result is 0 flagged.
2. **Pace check.** Characters of the spoken form ÷ seconds must fall within 6–22. One clip failed: vo017 "Move ray O B." read haltingly (3.3 s of speech with a 0.65 s pause). Its spoken form became "Move the ray O B." and it was regenerated, which brought it down to 2.38 s.
3. **Format check.** Every Ogg file decodes in Chrome, reports a length within 10 ms of the measured one, and plays (`currentTime` advances).
4. **In-game check.** Narration played on real screens. Each clip plays to its end, the words shown match the clip, and the last word appears at 60–85% of the clip (the tail is silence).

## How the game uses the clips

- `js/vo_lines.js` (generated, do not edit) maps the **exact plain line** to `[clip id, seconds]`.
- `js/core/voice.js` is the player. It uses one reused `<audio>` element, which is unlocked on the *Begin* tap so tablets will play it later. All clips are prefetched one at a time after Begin.
- `ctx.say()` in `js/core/engine.js` is the single choke point. It shows the line and speaks it, and the screen's timeline waits for the voice to finish. The line appears **word by word at `max(16, (seconds − 0.35) × 1000 / characters)` ms per character**, so each word lands as it is said.
- A new line stops the previous voice, and a screen change stops it too. If a line is already playing, asking for it again joins that clip instead of restarting it, and a line that was just said is not repeated.
- Sound effects duck under the voice.
- **Safety.** A stalled clip times out after its length plus about 1.4 s. If `play()` is rejected or a file is missing, the line types silently at reading pace. The lesson never waits on audio.
- **Turning it off.** `?vo=0` turns the narration off. Browsers without Ogg Opus (`canPlayType('audio/ogg; codecs="opus"')` is empty, as on older Safari and iPadOS) type the lines silently. `?speed=N` sets the playback rate (0.5–4) for testing.
- On screens whose first line tells the learner to move a ray, that line is held until the figure is built (`holdTitle`), so the words and the ray demo start together.

## Remaking a line

1. **Edit** the line's `spoken` text in `tools/vo_script.json`, keeping its `id` and `line`. For a new line, add an entry whose `line` is exactly what the screen shows.
2. **Generate** it in the studio. Upload an `.xlsx` with the columns `filename` (the id) and `text` (the spoken form), choose Hindi, MP3 and *Female Teacher (Standard)*, and press `GENERATE (N)`, then `DOWNLOAD ALL (.ZIP)`. Keep each batch to 48 rows or fewer, and wait 15 minutes between batches.
3. **Build** it into the game:

   ```
   node tools/vo_build.mjs voiceovers_batch.zip
   ```

   The build converts the clips, keeps the existing ones, regenerates `js/vo_lines.js`, lists any line still without a clip, and removes clips that no line uses. It is safe to run again, and it needs Node 22+ and Google Chrome. Chrome does the MP3 decode and the Opus encode with WebCodecs, and the tool writes the Ogg pages itself (RFC 7845). No ffmpeg or Python is required. Set `CHROME=` if Chrome is not at the default Windows path.

## All clips

| Clip | Line as shown | Spoken as (`=` if the same) | Devanagari sent to the voice | Seconds |
|---|---|---|---|---|
