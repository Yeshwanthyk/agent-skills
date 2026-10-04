"""Kokoro speaks the narration, one sentence at a time.

usage: speak.py <narration.txt> <out_dir> [--engine mlx|onnx] [--voice af_heart] [--speed 0.95]
writes <out_dir>/narration.wav (24 kHz mono) and <out_dir>/segments.json: [{text, s, e}] per sentence.
mx runs this through uv; see bin/mx `voice`.
"""
import argparse, json, pathlib, re, urllib.request
import numpy as np, soundfile as sf

ap = argparse.ArgumentParser()
ap.add_argument("text"); ap.add_argument("out")
ap.add_argument("--engine", default="mlx"); ap.add_argument("--voice", default="af_heart"); ap.add_argument("--speed", type=float, default=0.95)
a = ap.parse_args()
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
text = " ".join(pathlib.Path(a.text).read_text().split())
sentences = [s for s in re.split(r"(?<=[.!?])\s+", text) if s]
SR, GAP = 24000, 0.32

if a.engine == "mlx":
    from mlx_audio.tts.utils import load_model
    model = load_model("mlx-community/Kokoro-82M-bf16")
    say = lambda s: np.concatenate([np.array(r.audio) for r in model.generate(text=s, voice=a.voice, speed=a.speed, lang_code="a")])
else:
    from kokoro_onnx import Kokoro
    cache = pathlib.Path.home() / ".cache/motion-explainer/kokoro"; cache.mkdir(parents=True, exist_ok=True)
    base = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
    for f in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
        if not (cache / f).exists(): urllib.request.urlretrieve(base + f, cache / f)
    model = Kokoro(str(cache / "kokoro-v1.0.onnx"), str(cache / "voices-v1.0.bin"))
    say = lambda s: model.create(s, voice=a.voice, speed=a.speed, lang="en-us")[0]

def trim(x, floor=0.008):  # cut the sentence's own leading and trailing silence
    loud = np.flatnonzero(np.abs(x) > floor)
    return x[max(0, loud[0] - 600): loud[-1] + 1200] if loud.size else x

lead = np.zeros(int(SR * 0.35), dtype=np.float32)
parts, segments, t = [lead], [], len(lead) / SR
for s in sentences:
    clip = trim(np.asarray(say(s), dtype=np.float32))
    segments.append({"text": s, "s": round(t, 3), "e": round(t + len(clip) / SR, 3)})
    parts += [clip, np.zeros(int(SR * GAP), dtype=np.float32)]
    t += len(clip) / SR + GAP
sf.write(out / "narration.wav", np.concatenate(parts), SR)
(out / "segments.json").write_text(json.dumps(segments, indent=1))
print(f"spoke {len(sentences)} sentences, {t:.2f}s")
