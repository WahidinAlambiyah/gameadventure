# Panduan `.agents/`

Direktori ini menyediakan panduan tugas yang dipilih sesuai kebutuhan. Root [`AGENTS.md`](../AGENTS.md) selalu menjadi otoritas utama; fakta produk dan teknis tetap berada di dokumentasi kanonis melalui [`docs/README.md`](../docs/README.md).

Baca hanya file yang relevan dengan tugas:

| Tugas                                            | Skill utama                         |
| ------------------------------------------------ | ----------------------------------- |
| Perencanaan phase, scope, acceptance criteria    | `skills/product-planning/SKILL.md`  |
| API, session, permission, parent gate, ownership | `skills/backend-security/SKILL.md`  |
| Prisma, migration, seed, query, transaction      | `skills/database-prisma/SKILL.md`   |
| Child UI, React, Phaser, gameplay flow           | `skills/frontend-gameplay/SKILL.md` |
| Test plan, regression, closeout                  | `skills/quality-assurance/SKILL.md` |
| Review output atau PR                            | `skills/code-review/SKILL.md`       |
| Child/parent UX dan accessibility                | `skills/ux-design/SKILL.md`         |
| Dokumentasi dan status implementasi              | `skills/documentation/SKILL.md`     |

`rules/` berisi batas lintas tugas. `workflows/` berisi urutan kerja untuk feature, bug, dan phase closeout. Skill menunjuk ke dokumen yang diperlukan dan tidak menggantikan fakta di `docs/`.
