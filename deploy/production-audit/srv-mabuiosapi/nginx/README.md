# Nginx HOST — srv-mabuiosapi (no confundir con Docker)

| Archivo | Uso |
|---------|-----|
| [scnexus-host-3001.conf](./scnexus-host-3001.conf) | Prod actual: `:3001`, `root /storage/scnexus/dist`, proxies API |

**Pendiente exportar del servidor** (si difiere del repo):

```bash
sudo cat /etc/nginx/sites-available/scnexus
sudo cat /etc/nginx/conf.d/scnexus-front.conf
```

Nginx **dentro del contenedor** `scnexus-front`: [deploy/nginx/scnexus-docker.conf.template](../../../nginx/scnexus-docker.conf.template)

Nginx **:3000** (`srv-mabuiosapi.mabeltrading.com`): otro sitio; no está en esta carpeta.
