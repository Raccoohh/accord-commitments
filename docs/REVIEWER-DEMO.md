# Reviewer demo access

The optional gateway exposes the existing local application through an encrypted tunnel. Inference still runs on the host computer. The gateway requires HTTP Basic credentials, rejects unrelated origins, limits upload size, and isolates job access by browser session. The main app and model server remain bound to loopback. No OS account or paid API is required for reviewers.

## Current access

The current URL is recorded in the README and in ignored `delivery/demo-access.txt`. That local access note also contains the username and password. Share the note privately through the submission form; never commit it or paste its password into a public issue. The GitHub repository itself is public.

The landing page offers fictional A/B/C/D WAV downloads. Download a sample, select it in the audio uploader, and click **Find final commitments**. Reviewers may also upload new shareable English recordings within the two-speaker/three-minute limit. Allow a few minutes for inference. Result quotes play from the original audio in the reviewer's browser.

## Availability limits

This is a **temporary demonstration**, not continuous hosting. The owner must keep the computer powered, online, plugged in and with the laptop lid open. The launcher holds a temporary system-awake request while the gateway runs; it does not change the Windows power plan or prevent manual shutdown/sleep. Closing the PowerShell window does not intentionally stop the hidden demo processes.

The current provider is localhost.run because Cloudflare's quick-tunnel API timed out from this network. The [free-tier documentation](https://localhost.run/docs/forever-free/) states that free domains change regularly and have speed limits; the [FAQ](https://localhost.run/docs/faq/) says free names change after a few hours. Merely keeping the computer on does **not** guarantee a stable URL for several days. Verify the link immediately before submission and coordinate a review window, or move to a service/account with a persistent endpoint. Never promise uninterrupted availability with this configuration.

## Start and stop on this computer

From any PowerShell directory:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\ТЗ\scripts\start-demo.ps1"
```

The script starts the app, authenticated gateway and SSH tunnel, then writes the current access note. Windows OpenSSH is required. The first SSH host key is accepted and saved only under `.runtime/demo/known_hosts`; a changed key is not silently accepted. The script uses the provider's `nokey` free-tunnel login, not a personal SSH private key. On another checkout, replace the project path in these commands.

To stop external access while retaining the local app:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "D:\ТЗ\scripts\stop-demo.ps1"
```

Stopping or restarting the tunnel invalidates the old URL. After a restart, use the new URL from `delivery/demo-access.txt`; update the submitted link if necessary. Stopping the gateway discards its session-to-job mapping. Local inference jobs already accepted can continue, but old browser sessions cannot retrieve them through a new gateway.

## Privacy and costs

The tunnel service terminates public HTTPS and forwards traffic through the encrypted tunnel. Uploaded audio therefore passes through that service before reaching the host computer; it is not a browser-only/offline path. Use fictional or shareable material. The page discloses this before upload. No OpenAI request or paid fallback is enabled. Metered model API charges remain zero; hardware, electricity and internet costs are unmeasured. The free tunnel adds no purchased hosting plan and provides no uptime guarantee.

The generated password lives only in ignored `.runtime/demo/config.json` and `delivery/demo-access.txt`. Operational logs and these files are excluded from source archives. The secret verification script checks the current demo password as well as configured API tokens before publication. Browser diagnostic errors are sanitized because HTTP-client call logs can contain authorization headers.

## Verification and retained limitations

Run `node --test tests/demo-gateway.test.mjs` for gateway checks. `scripts/check-public-demo.mjs` uses the configured public origin and password in memory, uploads real D and C audio in Edge, checks session isolation and original-audio playback, and saves results under `reports/public-demo/`. This script needs the development Playwright environment; it does not manufacture AI answers. The initial external probes encountered a tunnel transport reset and a test-harness error reading a collapsed metrics panel; the latter was fixed by reading its text content. Credentials were rotated after a diagnostic client exposed an authorization header; no current password is included in reports.

Optional Cloudflare client: release `2026.9.3`, official [Windows AMD64 binary](https://github.com/cloudflare/cloudflared/releases/download/2026.9.3/cloudflared-windows-amd64.exe), SHA-256 `f096265ec2fcbe9bb6e2d64268db167ced3fcbb83d894bdb9e2fcdb26f2ea7e2`. Put the verified binary at `.runtime/demo/cloudflared.exe`, then pass `-Provider cloudflare`. This route failed with network timeouts here and is not the verified current route. Neither provider changes the inference implementation.

Verified on 5 October 2026 through the public HTTPS endpoint: [browser checks](../reports/public-demo/checks.json), [real C result](../reports/public-demo/C.actual.json), [real D result](../reports/public-demo/D.actual.json). The read-only diagnostic client permits up to two retries on connection resets; this does not retry inference or mask a failed semantic result. A passing run is a point-in-time availability check, not an uptime promise.
