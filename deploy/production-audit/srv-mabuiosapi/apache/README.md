# Apache — srv-mabuiosapi (sites-available)

Copias de `/etc/apache2/sites-available/` para referencia. **No desplegar** desde git al servidor.

| Archivo | enabled | Migración SCNexus |
|---------|---------|-------------------|
| [scnexus.conf](./scnexus.conf) | `003-scnexus.conf` | **Editar** → proxy `http://127.0.0.1:8082/` |
| [intranet.conf](./intranet.conf) | `002-intranet.conf` | No tocar |
| [storecontrol.conf](./storecontrol.conf) | `001-storecontrol.conf` | No tocar |
| [sitio.conf](./sitio.conf) | `000-sitio.conf` | No tocar |
| [glpi.conf](./glpi.conf) | `glpi.conf` | No tocar |
| [reference/](./reference/) | Stock Apache | No relacionado |

Objetivo post-Docker: [deploy/apache/003-scnexus-docker.conf.example](../../apache/003-scnexus-docker.conf.example)
