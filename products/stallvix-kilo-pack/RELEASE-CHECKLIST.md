# Release checklist

This checklist separates a technically installable candidate from a product
Granaide can responsibly pilot or sell.

## Candidate evidence

- [x] Product identity and exact install map are machine-readable in `pack.json`.
- [x] Runtime payload has portable normalized SHA-256 hashes.
- [x] Read-only investigator is the default; implementer is opt-in.
- [x] Source behavior tests cover permissions, secret paths, and shell allowlist.
- [x] A consumer PR installs the locked payload without changing StallVix app code.
- [ ] Relevant Kilo credential has been rotated after accidental terminal disclosure.
- [ ] P2 full Test A passes with sanitized streaming/session evidence and a complete Work Receipt.
- [ ] Independent review accepts the source and consumer diffs.

## Pilot gate

- [ ] Owner accepts P2 evidence and explicitly promotes `candidate` to `pilot`.
- [ ] Supported Kilo/PowerShell/OS versions are declared and exercised.
- [ ] Clean install and uninstall are repeated from a fresh consumer worktree.
- [ ] Failure, rollback, and evidence-retention instructions are exercised.
- [ ] A named Granaide support owner and response expectation are recorded.

## Release/commercial gate

- [ ] Repository and pack licensing are decided. The repository currently has no
  root `LICENSE*` file; `pack.json` therefore says `UNSPECIFIED`.
- [ ] Ownership of included instructions/configuration and third-party notices is reviewed.
- [ ] Versioning, compatibility, upgrade, and deprecation policy are published.
- [ ] Customer terms, privacy boundary, data handling, and security contact are published.
- [ ] At least one owner-accepted pilot demonstrates the advertised outcome.
- [ ] Release artifact is generated from a tagged, reviewed commit and its hashes are published.

Until all candidate and pilot items pass, call this product a candidate, not a
finished or generally available agent product.
