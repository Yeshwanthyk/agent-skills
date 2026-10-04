"""Whistle (cactus-needle) times every spoken word, sentence by sentence.

usage: hear.py <out_dir>   reads narration.wav + segments.json, writes heard.json: [{w, s, e}]
Whistle takes 16 kHz mono clips of at most 30 s, so each sentence is heard on its own and offset back.
"""
import json, os, pathlib, subprocess, sys, tempfile, wave
os.environ.setdefault("NEEDLE_TELEMETRY", "0")
import needle

out = pathlib.Path(sys.argv[1])
segments = json.loads((out / "segments.json").read_text())
with tempfile.TemporaryDirectory() as tmp:
    full = pathlib.Path(tmp) / "16k.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out / "narration.wav", "-ar", "16000", "-ac", "1", full], check=True)
    with wave.open(str(full)) as w:
        params, frames = w.getparams(), w.readframes(w.getnframes())
    words, heard = [], []
    for i, seg in enumerate(segments):
        s0, s1 = max(0, seg["s"] - 0.1), seg["e"] + 0.15
        if s1 - s0 > 29.5: sys.exit(f"sentence {i + 1} runs {s1 - s0:.1f}s; Whistle hears at most 30s. Split it.")
        clip = pathlib.Path(tmp) / f"{i}.wav"
        with wave.open(str(clip), "wb") as w:
            w.setparams(params); w.writeframes(frames[int(s0 * 16000) * 2: int(s1 * 16000) * 2])
        res = needle.transcribe(str(clip), language="en", word_timestamps=True)
        heard.append(res["text"].strip())
        words += [{"w": x["word"].strip(), "s": round(s0 + x["start"], 3), "e": round(s0 + x["end"], 3)} for x in res["words"] if x["word"].strip()]
(out / "heard.json").write_text(json.dumps({"heard": " ".join(heard), "words": words}, indent=1))
print(f"heard {len(words)} words")
