# Testing

One layer. Assert the public definition, not private implementation ([kit-rules.md](kit-rules.md)). When to run tests: [change-code-steps.md](change-code-steps.md).

| Layer | Tool           | Location                                      | Covers                                                      |
| ----- | -------------- | --------------------------------------------- | ----------------------------------------------------------- |
| Unit  | Vitest (jsdom) | `src/**/*.test.ts`, next to the public module | Exported contracts: `TdLog`, `TdLogConfig`, `TdSettingDict` |

## Commands

```sh
npm test                              # full unit suite, once
npm run test -- src/TdLog.test.ts     # one file
npm run test -- -t "retainCount"      # tests whose name matches
npm run test:watch                    # re-run on change
```

- Config: `vitest.config.ts`. Only `src/**/*.test.ts` is collected.
- Environment: jsdom.
- Setup: `src/test/setup.ts` loads `fake-indexeddb/auto`.
- Put a new test beside the public module it covers (`src/TdLog.test.ts`, `src/TdSettingDict.test.ts`) and follow the style of those files.

## Choosing a layer

Lock behavior with a unit test of the exported API. This kit has no separate end-to-end suite.

## What to run before finishing

- During Red/Green, run the focused spec (`npm run test -- src/<file>.test.ts` or `npm run test:watch`).
- Before a behavior change is done, run `npm test`.
- At the end of the change, run `npm run verify` ([change-code-steps.md](change-code-steps.md)).
