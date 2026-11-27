# Bundle analysis

The visualizer is pinned and locked separately from the client dependency tree:

```sh
npm ci --prefix tools/bundle-analysis
ANALYZE_BUNDLE=1 pnpm build-only
```

The build writes `artifacts/bundle/report.html`, `report.json`, and `dist/.vite/manifest.json`.
Normal builds do not need the analyzer package. The Lighthouse workflow installs the
locked analyzer and uploads its reports. Measured browser transfers and verification
results are in the parent repository's `docs/tasks/menu-performance/RESULTS.md`.
