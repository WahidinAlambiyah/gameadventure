# Architecture Overview

BacaNgaji Adventure is a modular monolith. Next.js handles public pages, parent portal, child portal, admin portal, REST APIs, PWA shell, and lazy Phaser mounting. Phaser is limited to gameplay scenes.

Supabase is used for PostgreSQL and Storage only. Supabase Auth is not used.

Server modules own authentication, authorization, persistence, logging, storage, gameplay authority, and screen-time interfaces.
