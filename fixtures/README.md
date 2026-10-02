# Independent audio evaluation

The scripts and expected outcomes in `cases.json` are authored before any analyzer run. Commit this file before processing audio. Expected data must never be passed to the application or model.

A and B differ in one utterance only: the replacement date for the wireframes. The reply accepting that replacement is identical. C has a relative deadline with no date anchor and explicitly unassigned responsibility. D is eight seconds of digital silence.

Audio generation: Windows System.Speech, Microsoft David Desktop (Alex) and Microsoft Zira Desktop (Maya), 16 kHz mono PCM WAV, sequential speech with short gaps. All dialogue is fictional and newly authored for this submission. Voices are synthetic. No API service or paid TTS is used. Local compute and the Windows license are not priced as API usage. Generated timings are synthesis boundaries, not independently audited ASR evidence timestamps.

After generation, listen to the recordings to check script fidelity. After analysis, listen to every evidence excerpt. Do not mark these listening checks complete based only on generated text or waveform duration.
