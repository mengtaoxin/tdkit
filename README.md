# tdkit

Browser TypeScript library. Provides **TdLog** (structured logs in IndexedDB) and **TdSettingDict** (string settings in IndexedDB).

## Install

Published to [GitHub Packages](https://github.com/features/packages) (not npm).

1. Create a GitHub personal access token with `read:packages` (and `write:packages` if you publish).
2. In the consuming project, add an `.npmrc`:

```ini
@mengtaoxin:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

3. Install:

```bash
npm install @mengtaoxin/tdkit
```

Local / git alternatives (no registry):

```bash
npm install /path/to/tdkit
# or
npm install github:mengtaoxin/tdkit
```

## Usage

```ts
import { TdLog, TdLogConfig, TdSettingDict } from "@mengtaoxin/tdkit";

TdLogConfig.retainCount(100);
TdLogConfig.retainDays(30);
TdLogConfig.maxChars(65535);

await TdLog.info("app started");
await TdLog.warn("slow request");
await TdLog.error("request failed");

const page = await TdLog.query({ keyword: "request", limit: 20 });
// page.total, page.records — newest first

await TdLog.clean();

await TdSettingDict.set("color", "blue");
const color = await TdSettingDict.get("color"); // "blue"
```

### API

| Export | Role |
| --- | --- |
| `TdLog.info` / `warn` / `error` | Append a log entry |
| `TdLog.query` | Query with optional keyword + pagination |
| `TdLog.clean` | Delete all stored entries |
| `TdLogConfig.retainCount` | Max entries kept (default `100`) |
| `TdLogConfig.retainDays` | Max age in days (default `30`) |
| `TdLogConfig.maxChars` | Truncate message length before save (default `65535`) |
| `TdSettingDict.get` | Read a string setting (or `undefined` if missing) |
| `TdSettingDict.set` | Write a string setting |

Types: `TdLogLevel`, `TdLogRecord`, `TdLogQuery`, `TdLogPage`.

## Develop

```bash
npm install
npm test
npm run build
```

Publish (maintainers):

```bash
npm publish
```

Requires a token with `write:packages` and membership on `mengtaoxin/tdkit`.

## License

MIT
