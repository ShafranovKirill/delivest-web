# Bundle analysis

The visualizer is optional and installed separately from the client dependency tree:

```sh
npm install --prefix tools/bundle-analysis
ANALYZE_BUNDLE=1 pnpm build-only
```

The build writes `artifacts/bundle/report.html`, `report.json`, and `dist/.vite/manifest.json`. The first install creates a lockfile in this directory; commit that lockfile after a networked install. Normal builds need no analyzer package. This offline checkout has no analyzer package, so no visualizer report was produced. The separate build graph and icon measurements are in `docs/menu-performance-build.json`.
