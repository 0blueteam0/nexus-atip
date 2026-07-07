# Insights

- npm audit requires explicit cwd control because the meaningful input is the package-lock workspace, not the RedTeam AX case directory.
- npm audit exit code 1 is a domain-specific success-with-findings state. Treating it as generic runner failure would hide valid JSON findings from collection.
- working_dir must be constrained to the project workspace to avoid using the governed runner as arbitrary filesystem traversal.
