# Lurker
Lurker is a lightweight, self‑contained service that monitors OpenFront.io public game lobbies, downloads their replays once they finish, and archives them to an S3‑compatible object store.

## Requirements
- Bun (v1.x or later) for development and runtime
- Redis server for queuing
- S3-compatible storage for replay storage

## Running from Source
```shell
bun install
bun run index.ts
```

## Importing Historical Matches
Place a JSON array of match IDs at the path specified by `LURKER_IMPORT_PATH` (`import.json` by default).  On launch, `HistoryImporter` will iterate the list, fetch each replay through the public API, and archive it just like live games.