# Otros sitios en srv-mabuiosapi — no editar para migración SCNexus

Resumen a partir de `apache/*.conf` exportados (2026-03-21).

| Sitio | Archivo | Puerto | Rol |
|-------|---------|--------|-----|
| **sapi** (default :443) | `apache/sitio.conf` | 80, 443 | `DocumentRoot /storage`, alias `192.168.2.153` |
| **storecontrol** | `apache/storecontrol.conf` | 80 → proxy **:3001**; 443 → `/storage` | HTTP comparte Nginx 3001 con SCNexus — ojo al depurar |
| **intranet** | `apache/intranet.conf` | 80, 443 | `DocumentRoot /storage` — independiente de SCNexus |
| **glpi** | `apache/glpi.conf` | 80 | `DocumentRoot /storage/glpi/public`, `glpi.local` |

Nginx host adicional (no SCNexus):

| listen | server_name | Archivo en servidor |
|--------|-------------|---------------------|
| 3000 | srv-mabuiosapi.mabeltrading.com | (no exportado aún) |

**SCNexus (único que migra a Docker):** `apache/scnexus.conf` + `nginx/scnexus-host-3001.conf`
