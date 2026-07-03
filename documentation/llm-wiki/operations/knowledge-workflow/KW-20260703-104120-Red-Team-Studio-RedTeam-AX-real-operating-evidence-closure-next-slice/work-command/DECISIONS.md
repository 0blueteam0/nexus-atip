# Decisions

- Strict mode is the RedTeam2 default for operating closure submission packages.
- CASE-V2, fixture, smoke, sample, test, and operator-scanner-outputs sources are byproducts for completion purposes.
- Byproduct sources may prove regression or safety controls, but cannot prove final completion or support Report v2 claims.
- accepted gate runner uses file-backed stdout/stderr logs because captured pytest subprocesses timed out on Windows.
