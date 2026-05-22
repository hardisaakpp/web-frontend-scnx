# Auditoría de infraestructura — srv-mabuiosapi

Inventario del host de **producción** (`scnexus.mabelgroup.com.ec`). Guía para migrar el front a Docker **sin afectar** otros sitios Apache/Nginx.

**Auditoría:** 2026-03-21 · **Configs exportadas:** 2026-03-21 (sites-available Apache)

| Documento | Contenido |
|-----------|-----------|
| [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) | Sitios, puertos, flujos, checklist |
| [OTHER-SITES-SUMMARY.md](./OTHER-SITES-SUMMARY.md) | sapi, intranet, storecontrol, glpi — no tocar |
| [apache/](./apache/) | VirtualHosts Apache (prod) |
| [nginx/](./nginx/) | Nginx host :3001 (prod) |
| [COMMANDS.md](./COMMANDS.md) | Re-exportar desde servidor |
| [snapshots/](./snapshots/) | `apache2ctl -S`, etc. |
| [../../apache/003-scnexus-docker.conf.example](../../apache/003-scnexus-docker.conf.example) | Apache tras corte Docker |

**Despliegue front:** [docs/DEPLOYMENT_PROD_SRV_MABUIOSAPI.md](../../../docs/DEPLOYMENT_PROD_SRV_MABUIOSAPI.md)

---

## Estructura (criterio técnico)

```text
deploy/
├── nginx/                          # Solo plantillas del PROYECTO (no confundir con prod)
│   ├── scnexus-docker.conf.template   → contenedor Docker
│   ├── scnexus-host.conf.example      → doc / plantilla host :3001
│   └── README.md
├── apache/
│   └── 003-scnexus-docker.conf.example  → objetivo Apache :443
└── production-audit/srv-mabuiosapi/  # SNAPSHOT prod (lo que trajiste del servidor)
    ├── apache/                     # VirtualHost Apache (era sites-available)
    ├── nginx/                      # Nginx listen 3001
    └── OTHER-SITES-SUMMARY.md
```

**Error corregido:** los `.conf` de Apache estaban en `deploy/nginx/`; Apache y Nginx host viven en carpetas separadas.

---

## Regla de oro

| Qué | Migración SCNexus |
|-----|-------------------|
| `apache/scnexus.conf` | **Sí** → proxy `:8082` |
| `nginx/scnexus-host-3001.conf` | Dejar de usar (rollback) |
| `apache/intranet.conf`, storecontrol, sitio, glpi | **No** |

---

## Pendiente en servidor

```bash
sudo cat /etc/nginx/conf.d/scnexus-front.conf
# Comparar con sites-available/scnexus si difiere de scnexus-host-3001.conf
```
