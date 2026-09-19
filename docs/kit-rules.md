# Kit Rules

Conditions that features provided by this kit must follow.

## Separate definition from implementation

- Keep public contracts (types, interfaces, exported APIs) in definition files.
- Keep concrete behavior in implementation files.
- Consumers and tests should depend on definitions, not on implementation details.

## Unit tests against definitions

- Every feature must include appropriate unit tests.
- Tests must assert against the public definition (exported API / contract), not private implementation internals.
- Prefer black-box tests that remain valid when the implementation changes without changing the definition.
