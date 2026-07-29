# Security Policy

Declarative Forms is an early-stage project. Operators should review the
deployment and trust model before exposing it to untrusted traffic.

## Supported versions

Security fixes are made on the current development branch. There is not yet a
published long-term-support or release-support schedule.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting feature for this repository when
it is available. If it is not available, contact the repository maintainers
privately through the contact information on their GitHub profiles and ask for
a secure reporting channel.

Do not open a public issue containing exploit details, credentials, private
repository names, form responses, or other sensitive information.

Include:

- the affected version or commit;
- the deployment configuration relevant to the issue;
- reproduction steps or a minimal proof of concept;
- the expected and observed impact; and
- any suggested mitigation.

The maintainers will acknowledge receipt when possible, investigate, and
coordinate disclosure after a fix or mitigation is available. No fixed response
time is currently promised.

## Relevant trust boundaries

- GitHub form definitions are untrusted input and are parsed and validated
  before rendering.
- `GITHUB_TOKEN` is sent only to repositories listed in
  `GITHUB_TRUSTED_REPOSITORIES`.
- Submission connections are enabled only for trusted repositories.
- MongoDB and S3-compatible storage contain operational submission data, not
  authoritative form definitions.
- `AUTH_API_KEY`, token secrets, GitHub credentials, email credentials, and
  storage credentials must not be exposed to browsers or committed to Git.

See the [self-hosting guide](docs/getting-started/self-host.mdx) for deployment
guidance.

