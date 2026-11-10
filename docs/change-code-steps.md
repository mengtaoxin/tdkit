# Change code steps

Ordered workflow for every code change. Domain details stay in the linked docs.

| Need                                         | Doc                          |
| -------------------------------------------- | ---------------------------- |
| Definition vs implementation, contract tests | [kit-rules.md](kit-rules.md) |
| Test layers and commands                     | [testing.md](testing.md)     |

## 1. Inspect structure

Before writing or moving files, match [kit-rules.md](kit-rules.md) and the tree that is already here:

- Keep public contracts (types, interfaces, exported APIs) in definition files such as `src/TdLog.ts`, `src/TdLogConfig.ts`, and `src/TdSettingDict.ts`.
- Keep concrete behavior in implementation files under `src/log/` and `src/setting/`.
- Colocate unit tests as `src/**/*.test.ts` next to the public module they cover.
- Consumers and tests depend on definitions, not on implementation details.

## 2. TDD (behavior changes)

Follow [test-driven development](../.agents/skills/test-driven-development/SKILL.md).

1. State the observable behavior in one sentence.
2. **Red** — add or extend a test at the lowest layer that locks it ([kit-rules.md](kit-rules.md), [testing.md](testing.md)). Run it. It must fail for the missing behavior, not a broken import or flaky setup.
3. **Green** — change production code only enough to pass.
4. **Refactor** — clean up with tests still green.

No new test is required for docs, comments, formatting, or mechanical moves with unchanged behavior. Still run the unit suite when code moves.

## 3. Cross-cutting while implementing

Update the matching file under `docs/` when a documented contract or workflow changes.

## 4. Tests

Follow [test-driven development](../.agents/skills/test-driven-development/SKILL.md).

Take test layers and commands from [testing.md](testing.md).

During Red/Green, run the focused spec named there. Before finishing a behavior change, run the full unit suite named there.

## 5. Format and verify

When the tree needs formatting, run `npm run format`, then run `npm run verify` once at the end.

## Done when

- Structure and assertions match [kit-rules.md](kit-rules.md).
- Behavior changes went through observed Red → Green.
- The unit suite and `npm run verify` pass.
- Docs are updated when a documented contract or workflow changes.
