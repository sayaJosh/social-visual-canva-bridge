# Public Social Visual → Canva Bridge Design

## Goal

Build an independent, public GitHub service that lets a user install a social-visual Skill, choose one of three generated 1:1 concepts, and create a new editable Canva draft from that chosen concept.

## Product boundary

The service is separate from AdCraft. It does not modify the browser extension, reuse its telemetry service, read its data, or share its credentials.

The first release creates a new 1080 × 1080 Canva draft only. It never edits, overwrites, publishes, or deletes an existing Canva design.

## User flow

1. A user downloads the `social-visual-canva` Skill from GitHub.
2. The Skill turns long copy and reference images into three finished previews. Each option has a genuinely different visual system, not a recolour.
3. The user selects one option.
4. The Skill sends its `DesignSpec` and the option's separate visual assets to the bridge.
5. On first use, the user signs in to and authorizes their own Canva account.
6. The Canva app creates a new editable draft and returns the Canva editing URL.

## Components

### 1. Transferable Skill

`skill/social-visual-canva/SKILL.md` is the user-facing workflow. It must:

- deliver three finished 1:1 results without stopping for a style-selection step;
- infer multiple possible thematic worlds from the content before designing;
- produce a `DesignSpec` only after the user chooses a result;
- generate non-text visual assets separately from textual content;
- send no Canva action until the user has selected an option.

### 2. DesignSpec contract

`shared/design-spec.schema.json` is the compatibility boundary between the Skill, bridge API, and Canva app.

It contains:

- `canvas`: exact width `1080` and height `1080`;
- `assets`: background and decoration image references, role, z-index, position, size, and whether each asset is locked;
- `elements`: editable native Canva text, shape, line, and information-card elements;
- `metadata`: version, selected concept ID, and a short human-readable design name.

It explicitly excludes raw source copy, customer identifiers, API keys, access tokens, and generated preview images with baked-in text. A request failing schema validation is rejected before any Canva operation begins.

### 3. Bridge API

The bridge exposes a small HTTP API:

- `POST /v1/design-jobs` validates a `DesignSpec`, creates a short-lived job, and returns a job ID plus a handoff URL;
- `GET /v1/design-jobs/:id` returns only the validated design payload required by the authorized Canva app;
- `POST /v1/design-jobs/:id/complete` marks the job complete and schedules asset cleanup.

The API stores a random job ID, validated DesignSpec, and short-lived asset references. It does not retain source prompts or customer copy. Jobs and temporary assets expire after 24 hours. The service does not log request bodies.

### 4. Canva app

The Canva app receives an authorized handoff, reads the job once, and uses Canva's Design Editing API to create elements in a new design:

- image assets become background/decorative layers;
- information cards, rules, and CTA frames become editable shapes;
- headings, subheadings, key points, CTA, and brand details become editable native Canva text;
- special title treatments that cannot survive as native text are independent transparent PNG layers and are labelled as such in the draft.

The app must preserve the supplied z-order and element positions. It must report a usable design URL or a clear failure reason. It must not fall back to Canva Magic Layers as the core mechanism.

## Security and privacy

- Canva authorization is per user; the bridge never accepts a user Canva password.
- Secrets are environment variables and are not committed.
- The API uses signed, expiring handoff tokens so one user cannot request another user's job.
- Uploaded assets are limited to allowlisted image types and a fixed size limit.
- Job IDs are cryptographically random and are not enumerable.
- Browser-visible errors use generic messages and do not disclose OAuth tokens, upstream responses, or stored payloads.

## Delivery model

The public GitHub repository includes the Skill, shared schema, bridge API, Canva app source, tests, an `.env.example`, and install instructions.

Local development can validate jobs and preview the intended element operations with a fake Canva adapter. A real Canva draft requires a registered Canva developer app, user authorization, and the production app approval/review required by Canva for public distribution. Those account-level actions are not automated by this repository.

## Non-goals for first release

- No automated image generation provider.
- No editing or publishing existing Canva designs.
- No customer CRM, analytics, billing, account management, or permanent design archive.
- No dependence on AdCraft services or data.

## Errors

| Condition | User-visible result | Internal action |
| --- | --- | --- |
| Invalid DesignSpec | `設計資料不完整，請重新選擇方案後再試。` | Reject without job creation. |
| Expired or unknown job | `這份設計已過期，請重新送到 Canva。` | Return 404-style safe error. |
| Authorization cancelled | `尚未授權 Canva，未建立草稿。` | Do not consume the job. |
| Canva element operation fails | `Canva 建立草稿失敗，請重試。` | Preserve job until expiry and record a redacted error code. |

## Testable acceptance criteria

1. A valid DesignSpec creates a short-lived job and can be read exactly through its signed handoff.
2. Invalid schema, malformed asset URL, expired handoff, and cross-job handoff attempts are rejected.
3. The Canva adapter receives layer creation calls in z-order and creates text as native editable text operations.
4. The adapter labels special title PNG layers and does not convert them into editable fake text.
5. Completion marks a job for cleanup; the cleanup routine removes expired job records.
6. The repository can run its automated test suite without Canva credentials or network access.

## Verification boundary

Automated tests prove the local schema, job security boundary, and fake Canva adapter behavior. They do not prove a real Canva draft until a registered Canva app, OAuth configuration, and a logged-in Canva account are available for an end-to-end test.
