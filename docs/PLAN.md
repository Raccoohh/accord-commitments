# Delivery plan and acceptance criteria

1. Freeze independently authored A–D scripts and expected outcomes in Git before running any analyzer.
2. Build an audio-first local browser prototype; validate input and every cited transcript segment.
3. Integrate real timestamped diarized ASR and schema-constrained commitment extraction after credential setup.
4. Run A–D through audio upload; compare final status, owner, deadline and evidence separately. Then create a fresh holdout recording after fixes.
5. Prepare measured latency/cost reports, README, delivery notes and a sub-three-minute video or clearly labelled recording script.

Risks: ASR hallucinations on silence; incorrect voice/name mapping; proposals mistaken for acceptance; late corrections/cancellations missed; segment timestamps too broad; provider access and costs unverified until a live call.

Ready means real new audio produces final active commitments with sufficient playable evidence, cancelled/proposed items stay out of active results, ambiguity is explicit, reproducible evaluation includes honest failures, and startup instructions work. No accuracy claim follows from a tiny synthetic set.

Environment: empty D:\ТЗ; Node v24.19.0; Git 2.55.0.windows.2; Windows PowerShell; local Microsoft David Desktop and Zira Desktop voices; bundled Playwright available. npm is not on PATH. No API key detected in process environment or project files. No GitHub remote or public deployment configured. Local execution and reversible project setup are authorized. No purchases or messages to third parties are authorized.

That environment paragraph records the initial inspection. After the cloud-credit blocker, the user authorized a free local path and configured a Hugging Face read token. Current runtime requirements, hardware and model versions are in [local setup](LOCAL-SETUP.md). Paid inference remains disabled; remaining risks include local model quality, CPU speech latency and limited GPU/RAM capacity.
