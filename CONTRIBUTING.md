# Contributing

Use npm for this repository.

Recommended branches:

- `main`
- `develop`
- `feat/*`
- `fix/*`
- `docs/*`
- `chore/*`

Use Conventional Commits:

- `feat: add child profile foundation`
- `fix: prevent unauthorized child access`
- `docs: document authentication architecture`
- `chore: configure GitHub Actions`

Before opening a pull request:

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Do not run production migrations from pull requests.
