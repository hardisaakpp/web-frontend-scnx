# Nginx en el repo SCNexus

Tres roles distintos; no mezclar carpetas.

| Archivo | Dónde corre | Propósito |
|---------|-------------|-----------|
| [scnexus-docker.conf.template](./scnexus-docker.conf.template) | **Contenedor** `scnexus-front` (:8082 en host) | SPA + proxy `UPSTREAM_*` (build Docker) |
| [scnexus-host.conf.example](./scnexus-host.conf.example) | **Plantilla** Nginx host :3001 | Documentación; alinear con prod |
| — | Prod real | [production-audit/.../nginx/scnexus-host-3001.conf](../production-audit/srv-mabuiosapi/nginx/scnexus-host-3001.conf) |

**Apache** (`VirtualHost`) no va en esta carpeta → [production-audit/srv-mabuiosapi/apache/](../production-audit/srv-mabuiosapi/apache/).

**Deprecado:** `scnexus.conf.example` renombrado a `scnexus-host.conf.example`.
