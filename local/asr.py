"""Local audio-only ASR + two-speaker diarization. No fixture text is read."""
import io
import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
os.environ.setdefault("HF_HOME", str(ROOT / ".runtime" / "huggingface"))
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
os.environ["HF_HUB_DISABLE_PROGRESS_BARS"] = "1"
os.environ["PYANNOTE_METRICS_ENABLED"] = "0"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

import numpy as np
import soundfile as sf
import torch
from faster_whisper import WhisperModel
from pyannote.audio import Pipeline

torch.set_num_threads(6)
MODEL_CONFIG = json.loads((ROOT / "local" / "models.json").read_text(encoding="utf-8"))
ASR_MODEL = MODEL_CONFIG["asr"]["id"]
DIARIZATION_MODEL = MODEL_CONFIG["diarization"]["id"]
ASR_REVISION = MODEL_CONFIG["asr"]["revision"]
DIARIZATION_REVISION = MODEL_CONFIG["diarization"]["revision"]


def run(data):
    waveform, rate = sf.read(io.BytesIO(data), dtype="float32", always_2d=True)
    if rate != 16000 or waveform.shape[1] != 1:
        raise ValueError("Expected 16 kHz mono audio")
    duration = len(waveform) / rate
    if not 0.5 <= duration <= 180:
        raise ValueError("Audio duration is outside the MVP limits")
    timings = {}
    start = time.perf_counter()
    whisper = WhisperModel(ASR_MODEL, revision=ASR_REVISION, device="cpu", compute_type="int8", cpu_threads=6,
                           download_root=str(ROOT / ".runtime" / "whisper"))
    timings["asrLoadMs"] = round((time.perf_counter() - start) * 1000)
    start = time.perf_counter()
    stream, info = whisper.transcribe(waveform[:, 0], language="en", beam_size=5,
                                     word_timestamps=True, vad_filter=True,
                                     condition_on_previous_text=False)
    words = []
    for segment in stream:
        if segment.no_speech_prob > 0.8 and segment.avg_logprob < -1.0:
            continue
        for word in segment.words or []:
            if word.word.strip() and word.end > word.start:
                words.append({"text": word.word, "start": max(0, word.start),
                              "end": min(duration, word.end), "probability": word.probability})
    timings["asrMs"] = round((time.perf_counter() - start) * 1000)
    del whisper
    if not words:
        return {"segments": [], "localMetadata": {"timings": timings, "models": [ASR_MODEL, DIARIZATION_MODEL]}}
    start = time.perf_counter()
    pipeline = Pipeline.from_pretrained(DIARIZATION_MODEL, revision=DIARIZATION_REVISION, token=os.environ.get("HF_TOKEN"))
    timings["diarizationLoadMs"] = round((time.perf_counter() - start) * 1000)
    start = time.perf_counter()
    output = pipeline({"waveform": torch.from_numpy(waveform.T.copy()), "sample_rate": rate}, num_speakers=2)
    turns = [(float(turn.start), float(turn.end), speaker)
             for turn, speaker in output.exclusive_speaker_diarization]
    timings["diarizationMs"] = round((time.perf_counter() - start) * 1000)
    segments = []
    for word in words:
        overlap = {}
        for start, end, speaker in turns:
            overlap[speaker] = overlap.get(speaker, 0) + max(0, min(end, word["end"]) - max(start, word["start"]))
        speaker = max(overlap, key=overlap.get) if overlap and max(overlap.values()) > 0 else "unknown"
        if (not segments or segments[-1]["speaker"] != speaker
                or word["start"] - segments[-1]["end"] > 0.8
                or word["end"] - segments[-1]["start"] > 18):
            segments.append({"id": f"s{len(segments)}", "speaker": speaker,
                             "start": word["start"], "end": word["end"], "text": word["text"].strip()})
        else:
            segments[-1]["text"] += word["text"]
            segments[-1]["end"] = word["end"]
    return {"segments": segments, "localMetadata": {"timings": timings,
            "models": [ASR_MODEL, DIARIZATION_MODEL], "revisions": [ASR_REVISION, DIARIZATION_REVISION], "device": "cpu", "computeType": "int8 ASR",
            "language": info.language, "audioSeconds": duration,
            "timingPrecision": "ASR word estimates grouped by diarized speaker; not manually aligned"}}


if __name__ == "__main__":
    try:
        payload = sys.stdin.buffer.read(6_000_001)
        if len(payload) > 6_000_000:
            raise ValueError("Audio too large")
        print(json.dumps(run(payload), ensure_ascii=True))
    except Exception as error:
        # Never echo a token or untrusted audio content in error output.
        message = str(error)
        for key in ("HF_TOKEN", "OPENAI_API_KEY"):
            if os.environ.get(key):
                message = message.replace(os.environ[key], "[REDACTED]")
        print(json.dumps({"errorType": type(error).__name__, "message": message[:1500]}), file=sys.stderr)
        sys.exit(1)
