# Expected versus actual

Expected labels were frozen before analysis. Unavailable is not a passing result. Owner/deadline shown on unavailable rows are EXPECTED values, not analyzer outputs.

| Case | Expected task / status | Actual status | Owner | Deadline | Evidence structure | Evidence meaning / listening |
| --- | --- | --- | --- | --- | --- | --- |
| A | Add dashboard dark mode: proposed_not_accepted | proposed_not_accepted | PASS (null) | PASS (null) | Structural match | Supports; listened=false |
| A | Send wireframes: confirmed | confirmed | PASS (Alex) | PASS (2026-10-08) | Structural match | Supports; listened=false |
| A | Write launch announcement: cancelled | cancelled | PASS (Maya) | PASS (null) | Structural match | Supports; listened=false |
| A | Run accessibility audit: confirmed | confirmed | PASS (null) | PASS (null) | Structural match | Supports; listened=false |
| A | Choose analytics provider: unresolved | unresolved | PASS (null) | PASS (null) | Structural match | Supports; listened=false |
| B | Add dashboard dark mode: proposed_not_accepted | proposed_not_accepted | PASS (null) | PASS (null) | Structural match | Supports; listened=false |
| B | Send wireframes: confirmed | confirmed | PASS (Alex) | PASS (2026-10-09) | Structural match | Supports; listened=false |
| B | Write launch announcement: cancelled | cancelled | PASS (Maya) | PASS (null) | Structural match | Supports; listened=false |
| B | Run accessibility audit: confirmed | confirmed | PASS (null) | PASS (null) | Structural match | Supports; listened=false |
| B | Choose analytics provider: unresolved | unresolved | PASS (null) | PASS (null) | Structural match | Supports; listened=false |
| C | Run usability test: confirmed | confirmed | PASS (null) | PASS (next Friday) | Structural match | Supports; listened=false |
| D | No tasks; request new recording | unusable | n/a | n/a | n/a | Local silence detection; no speech to listen to |
| E | Prepare rollback checklist: confirmed | confirmed | PASS (Maya) | PASS (2026-11-03) | Structural match | Supports; listened=false |
| E | Verify restore steps: confirmed | confirmed | PASS (Maya) | PASS (null) | Structural match | Supports; listened=false |
| E | Delete old backups: proposed_not_accepted | proposed_not_accepted | PASS (null) | PASS (null) | Structural match | Supports; listened=false |
| F | Deliver migration checklist: confirmed | confirmed | PASS (Alex) | PASS (2026-12-04) | Structural match | Supports; listened=false |
| F | Verify access roles: confirmed | confirmed | PASS (Maya) | PASS (null) | Structural match | Supports; listened=false |
| F | Archive old exports: proposed_not_accepted | Missing | FAIL (null) | FAIL (null) | FAIL | Does not support; listened=false |
| F | Choose staging region: unresolved | unresolved | PASS (null) | PASS (null) | Structural match | Supports; listened=false |
| G | Prepare compatibility matrix: confirmed | confirmed | PASS (alex) | PASS (2027-01-12) | Structural match | Supports; listened=false |
| G | Test installer: cancelled | cancelled | PASS (maya) | PASS (null) | Structural match | Supports; listened=false |
| G | Review support notes: confirmed | confirmed | PASS (null) | PASS (null) | Structural match | Supports; listened=false |
| G | Redraw toolbar icons: proposed_not_accepted | proposed_not_accepted | PASS (null) | PASS (null) | Structural match | Supports; listened=false |
