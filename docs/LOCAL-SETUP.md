# Local inference setup

The current app uses only local inference. `src/pipeline.mjs` imports `local-provider.mjs` and cannot automatically fall back to paid OpenAI calls. The historical OpenAI adapter remains for comparison and isolated unit tests only.

Hardware inspected on this machine: AMD Ryzen 5 8645HS, 15.3 GiB usable system RAM, NVIDIA RTX 4050 Laptop with 6,141 MiB VRAM and driver 610.88. Speech recognition and diarization use CPU; Ollama can use the GPU. This separates memory needs and avoids a separate system-wide CUDA installation.

| Component | Selected version/model | Source |
| --- | --- | --- |
| Python | 3.12.14 on this machine | Existing bundled runtime |
| PyTorch / torchaudio | 2.8.0 CPU | [Official wheels](https://download.pytorch.org/whl/cpu) |
| faster-whisper | 1.2.1, `Systran/faster-whisper-medium.en`, INT8 CPU | [Project](https://github.com/SYSTRAN/faster-whisper) |
| pyannote.audio | 4.0.7, `pyannote/speaker-diarization-community-1` | [Model and conditions](https://huggingface.co/pyannote/speaker-diarization-community-1) |
| Ollama | Portable Windows 0.35.0 | [Official release](https://github.com/ollama/ollama/releases/tag/v0.35.0) |
| Extraction | `qwen2.5:7b`, Q4_K_M | [Model](https://ollama.com/library/qwen2.5:7b) |

No metered API charges apply. Hardware, electricity and local computation are not measured and must not be represented as free compute. Model downloads require internet and several GB of disk space. Model weights and environments are ignored under `.runtime/`; they are not included in source archives.

Before setup, accept the pyannote model conditions in your Hugging Face account and put a read-scoped `HF_TOKEN` in ignored `.env.local`. Never print or commit it. Use Python 3.12 and Node 24. Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-local.ps1 -Python 'C:\path\to\python.exe'
```

For subsequent starts:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-local.ps1
```

The launch script starts hidden project processes: app on `127.0.0.1:3000`, Ollama on `127.0.0.1:11435`, and model storage in `.runtime/ollama-models`. It does not install a Windows service or change the persistent system PATH. It discovers Node 24 on PATH, in `.runtime/node/node.exe`, in the standard Windows installation folder or in the current user's Codex runtime; `-NodePath 'C:\path\to\node.exe'` explicitly selects another installation. It checks the version before starting services and waits for local app readiness before printing the URL. Restart an existing app process after code edits; the launcher intentionally does not terminate an unknown process on the same port.

On this Windows build, native CUDA DLL loading failed from the Cyrillic workspace path. The launcher creates a project-specific `accord-ollama-<hash>` junction under the user's temporary folder pointing to the existing portable runtime, and adds its CUDA directory to the child process PATH. No model files are moved or duplicated. GPU discovery was verified through this ASCII alias; the original process had silently used CPU. The alias is recreated if the temporary folder is cleaned. A different target at the same alias is rejected.

The optional TorchCodec decoder reports unavailable FFmpeg DLLs on this machine. The actual pipeline decodes WAV with SoundFile and passes an in-memory waveform to pyannote; its successful real speech run confirms that this path does not need the optional decoder. Do not interpret the warning as a failed audio run.

Installed transitive versions are saved in `local/requirements.lock.txt`. Pinned model identifiers are in `local/models.json`; the verified download manifest is in `reports/local-models.json`. Setup runs a real synthetic A audio initialization and then records `.runtime/local-ready.json`; subsequent speech calls load offline. Delete that marker only when deliberately reinstalling or updating model caches. The final development upgrade used E for this initialization because the smaller ASR model had omitted Maya's introduction. Medium.en restored the name from audio alone.

Audio is sent only to the loopback app server. A bounded Python subprocess consumes audio through stdin, transcribes it, diarizes it and assigns each word estimate to the speaker with maximum time overlap. Contiguous same-speaker words form evidence segments. The language model sees only those segments. All timestamps remain ASR estimates; listening review is still required.

Telemetry is disabled for pyannote and Hugging Face. After model setup is marked ready, speech loading uses the local cache in offline mode. Ollama cloud functionality is disabled in the launcher. Results and logs follow the same local retention policy as the app; evaluation outputs for fictional audio are deliberately saved in `reports/`.
