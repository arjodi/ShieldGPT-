# Shield GPT

Shield GPT is a Chrome extension for ChatGPT and Claude. It checks the message currently in the composer before it is sent, warns when it finds likely sensitive data, and can replace those values with realistic random placeholders.

The extension is intentionally local-first: it does not request storage permissions, does not send findings anywhere, and does not keep logs. Logging can be added later behind a clear storage boundary without changing the scanner or page controller.

## Current coverage

The scanner looks for common high-risk values, including:

- API keys and access tokens for OpenAI, Anthropic, GitHub, Slack, Stripe, Google, and AWS
- Generic secret assignments such as `password=...`, `api_key: ...`, and `DATABASE_URL=...`
- JWTs, private key blocks, SSH key material, and database connection URLs
- Credit card numbers with Luhn validation
- Email addresses, phone numbers, SSNs, IBANs, public IP addresses, and URLs with embedded credentials
- Date-of-birth style values when they are labeled as DOB or birth date

Regex detection is deliberately conservative where false positives are common. Every finding is kept in memory only long enough to render the warning panel and apply replacements.

## Install locally

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this folder: `shield-gpt`.
5. Open ChatGPT or Claude and type a message containing test data such as `sk-test-1234567890abcdef1234567890abcdef`.

## How it works

The content script watches send actions on ChatGPT and Claude. When a message is about to be submitted, it scans the current composer text. If nothing sensitive is found, the send continues normally. If there are findings, the send is paused and a small panel appears in the top-right corner.

The panel gives two choices:

- **Randomize this data** replaces only the sensitive spans and leaves the edited message in the composer for review.
- **Send anyway** allows the original message through once.

## Project layout

```text
manifest.json                  Chrome extension manifest
src/patterns.js                Pure scanner and replacement generators
src/dom.js                     Site-agnostic composer and send-button helpers
src/panel.js                   Shadow DOM warning panel
src/content.js                 Page controller and event interception
scripts/validate-extension.mjs Basic manifest and source validation
```

## Development

Run the local validation and scanner regression tests before committing:

```sh
npm run validate
```

No build step is required. The extension runs from source as an unpacked Manifest V3 extension. The test suite loads the scanner in an isolated JavaScript context and verifies representative detections, value-only replacements, credit card validation, public IP filtering, and date-of-birth randomization.

## Privacy posture

Shield GPT does not persist findings. It does not use extension storage, background scripts, analytics, or remote services. Future logging should live behind a separate persistence module with explicit user controls, retention limits, and export/delete paths.
