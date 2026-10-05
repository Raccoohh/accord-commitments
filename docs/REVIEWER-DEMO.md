# Reviewer demo access

The optional gateway exposes the existing local application through an encrypted tunnel. Inference still runs on the host computer. The gateway requires HTTP Basic credentials, rejects unrelated origins, limits upload size, and isolates job access by browser session. The main app and model server remain bound to loopback. No OS account or paid API is required for reviewers.

## Account-assigned address with ngrok

The ngrok integration is active at [Accord](https://unread-sleek-renewably.ngrok-free.dev). Authenticated health checks and a full gateway/tunnel restart passed on 6 October 2026; the assigned URL stayed unchanged. See the [restart record](../reports/ngrok-restart.json). This establishes restart behavior, not continuous uptime. No subscription or paid API is needed.

1. Create a free account at [ngrok](https://dashboard.ngrok.com/signup), then obtain its [Authtoken](https://dashboard.ngrok.com/get-started/your-authtoken).
2. Add `NGROK_AUTHTOKEN=your_token` to the ignored `.env.local` file. Never paste the token into chat, commit it, or supply it as a process argument.
3. Put the official signed Windows AMD64 `ngrok.exe` from [ngrok downloads](https://ngrok.com/download/windows) in `.runtime/demo/ngrok.exe`. This workstation has version 3.39.11, verified with a valid ngrok, Inc. Authenticode signature; SHA-256 `d339bcbd0713233337e860163f5249eea679cf26750a5700510dbc241d201748`.
4. Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\ТЗ\scripts\start-demo.ps1" -Provider ngrok
```

The launcher validates credentials/configuration before stopping the previous demo, writes ignored `.runtime/demo/ngrok.yml`, and forwards only the authenticated gateway on port 3100. It disables local HTTP body inspection and remote agent management. The agent's local API listens only on 127.0.0.1:4041. The inference services are not exposed directly. Subsequent launches without `-Provider` select ngrok when its project configuration exists; there is no automatic fallback to a changing URL.

The free plan supplies one [account-assigned dev domain](https://ngrok.com/docs/pricing-limits/free-plan-limits). Visitors may first see ngrok's notice: click **Visit Site**, then enter the reviewer credentials. Quotas apply; check the account's Usage dashboard. The domain remains associated with the account, but it is not a promise of continuous uptime. The agent has heartbeat-based reconnection; after a computer reboot or an exited process, run the launcher again. Windows automatic startup has not been installed. The computer must remain powered, online and awake.

## Current access

The current URL is recorded in the README and in ignored `delivery/demo-access.txt`. That local access note also contains the username and password. Share the note privately through the submission form; never commit it or paste its password into a public issue. The GitHub repository itself is public.

The landing page offers fictional A/B/C/D WAV downloads. Download a sample, select it in the audio uploader, and click **Find final commitments**. Reviewers may also upload new shareable English recordings within the two-speaker/three-minute limit. Allow a few minutes for inference. Result quotes play from the original audio in the reviewer's browser.

## Availability limits

This is a **temporary demonstration**, not continuous hosting. The owner must keep the computer powered, online, plugged in and with the laptop lid open. The launcher holds a temporary system-awake request while the gateway runs; it does not change the Windows power plan or prevent manual shutdown/sleep. Closing the PowerShell window does not intentionally stop the hidden demo processes.

The current provider is ngrok with its account-assigned dev domain. The previous localhost.run URLs expired after a few hours and should not be submitted. Its [free-tier documentation](https://localhost.run/docs/forever-free/) and [FAQ](https://localhost.run/docs/faq/) describe that limitation. Cloudflare's quick-tunnel API also timed out from this network. The old providers remain explicit alternatives, not automatic fallbacks. Ngrok quotas, internet loss and a stopped host can still make this demo unavailable.

## Start and stop on this computer

From any PowerShell directory:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\ТЗ\scripts\start-demo.ps1"
```

The script starts the app, authenticated gateway and configured tunnel, then writes the current access note. After ngrok setup it selects ngrok automatically. On another checkout, replace the project path in these commands and complete account setup first. The optional `-Provider localhost` route requires Windows OpenSSH and saves its accepted first host key under `.runtime/demo/known_hosts`; a changed key is not silently accepted. It uses `nokey`, not a personal SSH private key.

To stop external access while retaining the local app:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\ТЗ\scripts\stop-demo.ps1"
```

With the same ngrok account, the assigned URL survived the verified restart. Check `delivery/demo-access.txt` after startup. This differs from the previous temporary localhost.run URLs, which can change. Stopping the gateway discards its session-to-job mapping. Local inference jobs already accepted can continue, but old browser sessions cannot retrieve them through a new gateway.

## Privacy and costs

The tunnel service terminates public HTTPS and forwards traffic through the encrypted tunnel. Uploaded audio therefore passes through that service before reaching the host computer; it is not a browser-only/offline path. Use fictional or shareable material. The page discloses this before upload. No OpenAI request or paid fallback is enabled. Metered model API charges remain zero; hardware, electricity and internet costs are unmeasured. The free tunnel adds no purchased hosting plan and provides no uptime guarantee.

The generated password lives only in ignored `.runtime/demo/config.json` and `delivery/demo-access.txt`. Operational logs and these files are excluded from source archives. The secret verification script checks the current demo password as well as configured API tokens before publication. Browser diagnostic errors are sanitized because HTTP-client call logs can contain authorization headers.

## Verification and retained limitations

Run `node --test tests/demo-gateway.test.mjs` for gateway checks. `scripts/check-public-demo.mjs` uses the configured public origin and password in memory, uploads real D and C audio in Edge, checks session isolation and original-audio playback, and saves ngrok results under `reports/ngrok-demo/` (older provider runs remain under `reports/public-demo/`). This script needs the development Playwright environment; it does not manufacture AI answers. The first ngrok diagnostic received its warning page instead of an anonymous API response; the diagnostic now bypasses that page only for API checks and clicks Visit Site in the actual browser flow. Earlier probes encountered a tunnel transport reset and a test-harness error reading a collapsed metrics panel; the latter was fixed by reading its text content. Credentials were rotated after a diagnostic client exposed an authorization header; no current password is included in reports.

Optional Cloudflare client: release `2026.9.3`, official [Windows AMD64 binary](https://github.com/cloudflare/cloudflared/releases/download/2026.9.3/cloudflared-windows-amd64.exe), SHA-256 `f096265ec2fcbe9bb6e2d64268db167ced3fcbb83d894bdb9e2fcdb26f2ea7e2`. Put the verified binary at `.runtime/demo/cloudflared.exe`, then pass `-Provider cloudflare`. This route failed with network timeouts here and is not the verified current route. Neither provider changes the inference implementation.

Verified on 5 October 2026 through the public HTTPS endpoint: [browser checks](../reports/public-demo/checks.json), [real C result](../reports/public-demo/C.actual.json), [real D result](../reports/public-demo/D.actual.json). The read-only diagnostic client permits up to two retries on connection resets; this does not retry inference or mask a failed semantic result. A passing run is a point-in-time availability check, not an uptime promise.

Verified on 6 October 2026 through ngrok: [browser checks](../reports/ngrok-demo/checks.json), [C actual result](../reports/ngrok-demo/C.actual.json), [D actual result](../reports/ngrok-demo/D.actual.json). C reached a useful result in 116.479 seconds (server processing 115.463 seconds), with zero inference retries and no metered model API charges. The confirmed task retained an unknown owner and the unresolved relative date “next Friday”. The browser notice, authentication, sample download, evidence playback, result isolation and clearing all passed.
