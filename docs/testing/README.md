# Testing

## Struktur

- `tests/unit`: pure logic dan isolated services/policies.
- `tests/integration`: route/service interaction; sebagian menggunakan in-memory fakes, sebagian DB-backed opt-in.
- `tests/security`: ownership dan security invariants.
- `tests/e2e`: browser flow melalui Playwright.

## Commands

```bash
npm run test
npm run test:unit
npm run test:integration
npm run test:security
npm run test:e2e
```

Gunakan focused Vitest invocation ketika scope sempit. Perhatikan bahwa script repository dapat memperluas execution melebihi file argument; baca output suite yang benar-benar berjalan.

## Manual browser validation

Manual validation mencakup route navigation, form interaction, child map/play canvas, responsive behavior, dan runtime console/network errors. Automated test atau HTTP smoke test tidak boleh dilaporkan sebagai browser pass.

Gunakan status:

- `PASS`: scenario dijalankan dan hasil sesuai.
- `PARTIAL`: hanya sebagian langkah/permukaan tervalidasi.
- `NOT RUN`: belum dijalankan.
- `BLOCKED`: tidak dapat dijalankan karena blocker yang dicatat.

## CI expectation

PR harus menjalankan checks relevan terhadap perubahan. Documentation-only work tidak memerlukan runtime suites bila tidak menyentuh implementation, tetapi tetap memerlukan link/path audit dan `git diff --check`.
