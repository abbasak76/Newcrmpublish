# Release execution job — b52

1. Validate `sourceModifiedAtUtc` before an ERP mirror enters the upsert planner.
2. Add regression coverage for malformed timestamps; ensure invalid rows cannot mutate the import state.
3. Run the defined test suite and SQL contract audit.
4. Record build/typecheck and external integration limitations honestly.
5. Synchronize version metadata and package a verified ZIP release.
