---
tools-used:
  - OpenCode
models-used:
  - claude-fable-5-2
providers:
  - Anthropic
scope:
  human-authored: >
    The AI search feature and its design, product decisions, review of every
    change, and testing against a real Olog service.
  ai-assisted: >
    The code review of the AI search branch, the review fixes and their tests,
    and this disclosure. The upstream Olog code is outside this statement.
last-updated: 2026-11-18
---

# AI Disclosure

This file describes how AI tools are used in this repository. It is provided
for transparency in accordance with the
[BNL AI Policy](https://intranet.bnl.gov/itd/ai-policy.php) Transparency
principle and the BNL Generative AI Usage Guidelines.

## Disclosure levels

This repository uses the vocabulary of the
[W3C AI Content Disclosure Community Group](https://www.w3.org/community/ai-content-disclosure/)
(a community-group effort, not a ratified W3C standard):

| Level | Meaning |
| --- | --- |
| `none` | No AI tools were used. |
| `ai-assisted` | AI contributed, but a human authored and reviewed. |
| `ai-generated` | AI generated the content; a human reviewed it. |
| `autonomous` | AI generated and published without human review. |

This repository is **`ai-assisted`**.

## Scope of AI use

- **Human-authored:** The AI search feature and its design, product decisions,
  review of every change, and testing against a real Olog service.
- **AI-assisted:** The code review of the AI search branch, the review fixes
  and their tests, and this disclosure. The upstream Olog code is outside this
  statement.

## Tools and models

- Tools: OpenCode.
- Models: listed in the front matter. Each AI-assisted commit names the
  models in an `Assisted-by` trailer.

## Purpose of use

AI was used to review the AI search branch and to write the fixes and tests
that followed from that review.

## Input data

No secrets, tokens, credentials or decrypted vault values were submitted to
any AI service. No personal data was submitted.

## Limitations

AI output can be wrong or incomplete. Review AI-assisted changes as you
would any other change.

## Reviewer disclaimer

A human reviews every change before it is merged. The reviewer is
responsible for the result, not the AI tool.
