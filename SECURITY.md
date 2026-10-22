# Security policy

## Supported versions

| Version      | Supported |
| ------------ | --------- |
| latest `0.x` | yes       |
| older `0.x`  | no        |

FlipReel is pre-1.0. Security fixes land in the latest minor release.

## Reporting a vulnerability

Please do not open a public issue, pull request or discussion for a vulnerability.

Report it privately through GitHub:
[Report a vulnerability](https://github.com/Flipatic/flip-reel/security/advisories/new)
(Security tab, "Report a vulnerability").

If you cannot use GitHub, email [opensource@flipatic.com](mailto:opensource@flipatic.com) with
"Security" in the subject line.

Please include the affected version, a description of the issue, steps or a minimal page that
reproduces it, and the impact you expect.

## What to expect

- We acknowledge the report within 5 business days.
- We confirm or reject the issue and share a planned fix date.
- We publish a fix and a GitHub Security Advisory, and credit you unless you prefer otherwise.

## Scope

In scope: code in this repository and the packages published from it (`@flipatic/flip-reel`,
`@flipatic/flip-reel-core`, `@flipatic/flip-reel-ad-gpt`). Examples: script injection through
feed data, the widget making network requests or writing storage it should not, CSP bypasses.

Out of scope: the demo site content, third-party ad code loaded through an `AdAdapter`, and
vulnerabilities in a publisher's own feed or CDN.
