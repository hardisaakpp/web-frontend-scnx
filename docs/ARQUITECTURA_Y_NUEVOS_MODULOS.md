# 🏗️ Arquitectura SCNexus - Guía Completa para Desarrollo

> **Guía completa de arquitectura y desarrollo de módulos para el ecosistema SCNexus**

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Configuración del Core](#configuración-del-core)
4. [Sistema de Permisos](#sistema-de-permisos)
5. [Desarrollo de Nuevos Módulos Backend](#desarrollo-de-nuevos-módulos-backend)
6. [Desarrollo de Nuevos Módulos Frontend](#desarrollo-de-nuevos-módulos-frontend)
   - Convención: [sincronizar UI tras mutaciones API](MUTACIONES_API_SINCRONIZACION_UI.md) (auditoría y estado local sin refetch obligatorio)
7. [Integración Completa](#integración-completa)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

SCNexus es un sistema empresarial modular que utiliza una arquitectura desacoplada con:

- **SCNexus Core**: Servidor de autenticación centralizado (Identity Provider)
- **Módulos Backend**: APIs independientes (.NET) que validan JWT
- **Frontend Único**: Aplicación Vue 3 con módulos integrados

### Principios Fundamentales

1. **Desacoplamiento**: Los módulos NO conocen el Core internamente
2. **JWT Stateless**: Los módulos validan tokens sin consultar al Core
3. **Permisos Granulares**: Control de acceso a nivel de acción (`modulo.accion`)
4. **Single Sign-On**: Un solo login para todos los módulos

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                  SCNexus CORE API                        │
│            http://192.168.2.12:8080/api                  │
│                                                           │
│  • Autenticación (Local + Active Directory)             │
│  • Gestión de Usuarios, Roles y Permisos                │
│  • Emisión de JWT con claims                            │
│  • Base de Datos: SCNexusDB                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ JWT Token (incluye roles y permisos)
                     │
    ┌────────────────┼────────────────┬────────────────┐
    │                │                │                │
    ▼                ▼                ▼                ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Depósitos│   │Caja Chica│   │Inventario│   │  Otros   │
│   API    │   │   API    │   │   API    │   │ Módulos  │
│  :8081   │   │  :8082   │   │  :8083   │   │   ...    │
└────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │              │
     └──────────────┴──────────────┴──────────────┘
                     │
                     │ Todas las APIs conectadas
                     ▼
            ┌────────────────┐
            │  FRONTEND VUE  │
            │ http://localhost:3000 │
            │                │
            │ • Vue 3 + Vite │
            │ • TypeScript   │
            │ • Tailwind CSS │
            │ • Pinia Stores │
            └────────────────┘
```

### Flujo de Autenticación

```
1. Usuario → Frontend: Login (usuario/password)
              ↓
2. Frontend → Core API: POST /api/Auth/login
              ↓
3. Core valida credenciales (Local o Active Directory)
              ↓
4. Core genera JWT con:
   - sub: ID del usuario
   - name: Nombre de usuario
   - email: Email
   - role: ["Admin", "User", "Gerente"]
   - permission: ["depositos.view", "depositos.create", ...]
   - exp: Fecha de expiración (3 horas)
              ↓
5. Frontend guarda token en localStorage
              ↓
6. Usuario navega a módulo → Frontend verifica permisos
              ↓
7. Frontend → API Módulo: GET /api/Recurso
   Headers: Authorization: Bearer {token}
              ↓
8. API Módulo valida JWT localmente (SIN llamar al Core)
   - Verifica firma con la misma clave secreta
   - Verifica expiración
   - Lee claims (permisos, roles)
              ↓
9. API retorna datos si el usuario tiene permisos
```

---

## 🔑 Configuración del Core

### Variables de Configuración

**Ubicación**: `c:\devLX\scnexus-core\SCNexus.Core.API\appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=210.17.1.54;Database=SCNexusDB;User Id=desadmin;Password=***REMOVED***;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "clave_super_secreta_para_jwt_12345",
    "Issuer": "SCNexus.Core",
    "Audience": "SCNexus.Users"
  },
  "Ldap": {
    "Host": "10.10.100.8",
    "Port": 389,
    "Domain": "sunsetcorp.local",
    "BindDn": "ldapconsulta@sunsetcorp.local",
    "BindPassword": "***REMOVED***",
    "SearchBase": "DC=sunsetcorp,DC=local",
    "UserFilter": "(objectClass=user)",
    "DefaultRole": "User"
  }
}
```

### ⚠️ Claves Críticas para Módulos

**IMPORTANTE**: Estas 3 claves DEBEN ser idénticas en todos los módulos backend:

```json
{
  "Jwt": {
    "Key": "clave_super_secreta_para_jwt_12345",
    "Issuer": "SCNexus.Core",
    "Audience": "SCNexus.Users"
  }
}
```

Si la clave `Key` no coincide, los módulos NO podrán validar el JWT.

---

## 🔐 Sistema de Permisos

### Concepto de Permisos

Un **permiso** es una acción específica que un usuario puede realizar:

**Formato**: `modulo.accion`

**Ejemplos**:
- `depositos.view` - Ver depósitos
- `depositos.create` - Crear depósitos
- `cajachica.view` - Ver liquidaciones de caja chica
- `cajachica.approve` - Aprobar liquidaciones
- `inventarios.realizar` - Realizar conteo de inventario

### Relación: Usuarios → Roles → Permisos

```
Usuario "jperez"
    ├── Rol: "Gerente"
    │   ├── depositos.view
    │   ├── depositos.approve
    │   ├── cajachica.view
    │   └── cajachica.approve
    │
    └── Rol: "User"
        ├── depositos.view
        └── cajachica.view

Admin → Tiene TODOS los permisos automáticamente
```

### Crear Permisos para un Nuevo Módulo

#### Paso 1: Login como Admin

```powershell
# Obtener token de administrador
$loginResponse = Invoke-RestMethod -Uri "http://192.168.2.12:8080/api/Auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body (@{
        userName = "admin"
        password = "Admin123!"
        useActiveDirectory = $false
    } | ConvertTo-Json)

$token = $loginResponse.token
Write-Host "Token obtenido: $token"
```

#### Paso 2: Definir Permisos del Módulo

Ejemplo para módulo "Caja Chica":

```powershell
$permisos = @(
    @{
        key = "cajachica.view"
        description = "Ver liquidaciones de caja chica"
        module = "cajachica"
    },
    @{
        key = "cajachica.create"
        description = "Crear nuevas liquidaciones"
        module = "cajachica"
    },
    @{
        key = "cajachica.edit"
        description = "Editar liquidaciones existentes"
        module = "cajachica"
    },
    @{
        key = "cajachica.delete"
        description = "Eliminar liquidaciones"
        module = "cajachica"
    },
    @{
        key = "cajachica.approve"
        description = "Aprobar liquidaciones"
        module = "cajachica"
    },
    @{
        key = "cajachica.export"
        description = "Exportar liquidaciones a Excel"
        module = "cajachica"
    }
)
```

#### Paso 3: Crear Permisos en el Core

```powershell
foreach ($permiso in $permisos) {
    try {
        $response = Invoke-RestMethod `
            -Uri "http://192.168.2.12:8080/api/Permissions" `
            -Method Post `
            -Headers @{Authorization = "Bearer $token"} `
            -ContentType "application/json" `
            -Body ($permiso | ConvertTo-Json)
        
        Write-Host "✓ Permiso creado: $($permiso.key)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Error creando $($permiso.key): $_" -ForegroundColor Red
    }
}
```

#### Paso 4: Listar Permisos Creados

```powershell
$todosLosPermisos = Invoke-RestMethod `
    -Uri "http://192.168.2.12:8080/api/Permissions" `
    -Headers @{Authorization = "Bearer $token"}

# Filtrar por módulo
$permisosCajaChica = $todosLosPermisos | Where-Object { $_.module -eq "cajachica" }
$permisosCajaChica | Format-Table Id, Key, Description
```

#### Paso 5: Asignar Permisos a Roles

```powershell
# Asignar permisos de visualización al rol "User"
$permisosUser = $permisosCajaChica | Where-Object { $_.key -like "*view*" }

foreach ($permiso in $permisosUser) {
    Invoke-RestMethod `
        -Uri "http://192.168.2.12:8080/api/Permissions/assign" `
        -Method Post `
        -Headers @{Authorization = "Bearer $token"} `
        -ContentType "application/json" `
        -Body (@{
            roleName = "User"
            permissionId = $permiso.id
        } | ConvertTo-Json)
    
    Write-Host "✓ Asignado $($permiso.key) a User"
}

# Asignar todos los permisos al rol "Gerente"
foreach ($permiso in $permisosCajaChica) {
    Invoke-RestMethod `
        -Uri "http://192.168.2.12:8080/api/Permissions/assign" `
        -Method Post `
        -Headers @{Authorization = "Bearer $token"} `
        -ContentType "application/json" `
        -Body (@{
            roleName = "Gerente"
            permissionId = $permiso.id
        } | ConvertTo-Json)
}
```

---

## 🖥️ Desarrollo de Nuevos Módulos Backend

### Checklist de Creación

- [ ] Crear proyecto Web API con .NET 8
- [ ] Instalar paquetes necesarios
- [ ] Configurar JWT (mismas claves del Core)
- [ ] Configurar base de datos
- [ ] Implementar Controllers con validación de permisos
- [ ] Configurar CORS para el frontend
- [ ] Probar endpoints con Swagger/Postman

### Paso 1: Crear Proyecto

```bash
# Crear nuevo proyecto Web API
dotnet new webapi -n SCNexus.MiModulo

cd SCNexus.MiModulo

# Instalar paquetes necesarios
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools
dotnet add package Swashbuckle.AspNetCore
```

### Paso 2: Configurar appsettings.json

```json
{
  "Jwt": {
    "Key": "clave_super_secreta_para_jwt_12345",
    "Issuer": "SCNexus.Core",
    "Audience": "SCNexus.Users"
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=210.17.1.54;Database=SCMiModulo;User Id=desadmin;Password=xxx;TrustServerCertificate=True;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

### Paso 3: Configurar Program.cs

```csharp
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ========== CONFIGURACIÓN JWT (CRÍTICO) ==========
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

// ========== CONFIGURACIÓN CORS ==========
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://192.168.2.12:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ========== CONFIGURACIÓN BASE DE DATOS ==========
builder.Services.AddDbContext<MiModuloDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ========== SERVICIOS ==========
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ========== MIDDLEWARE ==========
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

// ⚠️ IMPORTANTE: UseAuthentication ANTES de UseAuthorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
```

### Paso 4: Implementar Controllers con Permisos

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace SCNexus.MiModulo.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // ⚠️ Requiere JWT válido para todos los endpoints
    public class MiRecursoController : ControllerBase
    {
        private readonly ILogger<MiRecursoController> _logger;
        private readonly MiModuloDbContext _context;

        public MiRecursoController(
            MiModuloDbContext context,
            ILogger<MiRecursoController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/MiRecurso
        /// Listar todos los recursos
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Validar permiso
            if (!HasPermission("mimodulo.view"))
            {
                _logger.LogWarning(
                    "Usuario {User} intentó acceder sin permiso mimodulo.view",
                    GetUserName());
                return Forbid(); // HTTP 403
            }

            var recursos = await _context.MisRecursos.ToListAsync();
            return Ok(recursos);
        }

        /// <summary>
        /// GET: api/MiRecurso/{id}
        /// Obtener un recurso por ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (!HasPermission("mimodulo.view"))
                return Forbid();

            var recurso = await _context.MisRecursos.FindAsync(id);
            if (recurso == null)
                return NotFound();

            return Ok(recurso);
        }

        /// <summary>
        /// POST: api/MiRecurso
        /// Crear un nuevo recurso
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateRecursoRequest request)
        {
            if (!HasPermission("mimodulo.create"))
                return Forbid();

            var recurso = new MiRecurso
            {
                // Mapear propiedades
                CreadoPor = GetUserId(),
                FechaCreacion = DateTime.UtcNow
            };

            _context.MisRecursos.Add(recurso);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Usuario {User} creó recurso {RecursoId}",
                GetUserName(), recurso.Id);

            return CreatedAtAction(nameof(GetById), new { id = recurso.Id }, recurso);
        }

        /// <summary>
        /// PUT: api/MiRecurso/{id}
        /// Actualizar un recurso
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateRecursoRequest request)
        {
            if (!HasPermission("mimodulo.edit"))
                return Forbid();

            var recurso = await _context.MisRecursos.FindAsync(id);
            if (recurso == null)
                return NotFound();

            // Actualizar propiedades
            recurso.ModificadoPor = GetUserId();
            recurso.FechaModificacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Usuario {User} actualizó recurso {RecursoId}",
                GetUserName(), id);

            return NoContent();
        }

        /// <summary>
        /// DELETE: api/MiRecurso/{id}
        /// Eliminar un recurso
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!HasPermission("mimodulo.delete"))
                return Forbid();

            var recurso = await _context.MisRecursos.FindAsync(id);
            if (recurso == null)
                return NotFound();

            _context.MisRecursos.Remove(recurso);
            await _context.SaveChangesAsync();

            _logger.LogWarning(
                "Usuario {User} eliminó recurso {RecursoId}",
                GetUserName(), id);

            return NoContent();
        }

        // ========== MÉTODOS AUXILIARES ==========

        /// <summary>
        /// Verifica si el usuario tiene un permiso específico
        /// </summary>
        private bool HasPermission(string permission)
        {
            return User.HasClaim("permission", permission);
        }

        /// <summary>
        /// Verifica si el usuario tiene al menos uno de los permisos
        /// </summary>
        private bool HasAnyPermission(params string[] permissions)
        {
            return permissions.Any(p => User.HasClaim("permission", p));
        }

        /// <summary>
        /// Verifica si el usuario tiene un rol específico
        /// </summary>
        private bool HasRole(string role)
        {
            return User.IsInRole(role);
        }

        /// <summary>
        /// Obtiene el ID del usuario desde el JWT
        /// </summary>
        private string GetUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
        }

        /// <summary>
        /// Obtiene el nombre del usuario desde el JWT
        /// </summary>
        private string GetUserName()
        {
            return User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
        }

        /// <summary>
        /// Obtiene el email del usuario desde el JWT
        /// </summary>
        private string GetUserEmail()
        {
            return User.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;
        }

        /// <summary>
        /// Verifica si el usuario es administrador
        /// </summary>
        private bool IsAdmin()
        {
            return User.IsInRole("Admin");
        }
    }
}
```

### Paso 5: Probar el Módulo

```powershell
# 1. Obtener token del Core
$loginResponse = Invoke-RestMethod `
    -Uri "http://192.168.2.12:8080/api/Auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body (@{
        userName = "admin"
        password = "Admin123!"
    } | ConvertTo-Json)

$token = $loginResponse.token

# 2. Probar endpoint GET
$headers = @{
    Authorization = "Bearer $token"
}

$recursos = Invoke-RestMethod `
    -Uri "http://localhost:5000/api/MiRecurso" `
    -Headers $headers

$recursos | Format-Table

# 3. Probar endpoint POST
$nuevoRecurso = @{
    nombre = "Test"
    descripcion = "Prueba"
}

Invoke-RestMethod `
    -Uri "http://localhost:5000/api/MiRecurso" `
    -Method Post `
    -Headers $headers `
    -ContentType "application/json" `
    -Body ($nuevoRecurso | ConvertTo-Json)
```

---

## 🎨 Desarrollo de Nuevos Módulos Frontend

### Estructura de un Módulo Frontend

```
src/modules/mi-modulo/
├── router.ts                    # Rutas del módulo
├── views/
│   ├── MiModuloView.vue        # Vista principal
│   ├── MiModuloForm.vue        # Formulario crear/editar
│   └── MiModuloDetail.vue      # Vista de detalle
├── components/
│   ├── MiModuloTable.vue       # Tabla de datos
│   ├── MiModuloFilters.vue     # Filtros de búsqueda
│   └── MiModuloCard.vue        # Tarjeta de resumen
├── services/
│   └── miModuloService.ts      # Llamadas a la API
└── stores/
    └── miModuloStore.ts        # Estado global del módulo
```

### Convención: respuesta de mutaciones y estado local

Tras un **PATCH/PUT/POST** exitoso, el backend debe devolver el registro actualizado (p. ej. campos de auditoría como última modificación y usuario). En el frontend, **fusiona esa respuesta en el estado** (fila de tabla, store o formulario) en lugar de depender solo de un segundo GET.

- **Guía del proyecto:** [MUTACIONES_API_SINCRONIZACION_UI.md](MUTACIONES_API_SINCRONIZACION_UI.md)
- **Referencia implementada:** módulo `gestion-usuarios` (`storeEmployeesApi.ts`, `GestionUsuariosView.vue`).

Extender el mismo patrón al resto de módulos es recomendable cuando se toquen flujos de guardado; no es obligatorio hacerlo de golpe en todo el código.

### Paso 1: Crear Estructura del Módulo

```bash
# Desde c:\devLX\scnexus-front\
cd src/modules
mkdir mi-modulo
cd mi-modulo
mkdir views components services stores
```

### Paso 2: Crear Router del Módulo

**Archivo**: `src/modules/mi-modulo/router.ts`

```typescript
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/mi-modulo',
    name: 'mi-modulo',
    component: () => import('./views/MiModuloView.vue'),
    meta: { 
      requiresAuth: true,
      permissions: ['mimodulo.view'], // ⚠️ Permiso requerido
      title: 'Mi Módulo',
      icon: 'DocumentTextIcon' // Icono de Heroicons
    }
  },
  {
    path: '/mi-modulo/nuevo',
    name: 'mi-modulo-nuevo',
    component: () => import('./views/MiModuloForm.vue'),
    meta: { 
      requiresAuth: true,
      permissions: ['mimodulo.create'],
      title: 'Crear Nuevo'
    }
  },
  {
    path: '/mi-modulo/:id',
    name: 'mi-modulo-detalle',
    component: () => import('./views/MiModuloDetail.vue'),
    meta: { 
      requiresAuth: true,
      permissions: ['mimodulo.view'],
      title: 'Detalle'
    }
  },
  {
    path: '/mi-modulo/:id/editar',
    name: 'mi-modulo-editar',
    component: () => import('./views/MiModuloForm.vue'),
    meta: { 
      requiresAuth: true,
      permissions: ['mimodulo.edit'],
      title: 'Editar'
    }
  }
]

export default routes
```

### Paso 3: Registrar Módulo en el Router Principal

**Archivo**: `src/router/index.ts`

```typescript
// ... otras importaciones ...
import miModuloRoutes from '../modules/mi-modulo/router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ... rutas existentes ...
    {
      path: '/',
      component: MainLayout,
      children: [
        // ... otras rutas ...
        ...miModuloRoutes, // ⚠️ AGREGAR AQUÍ
      ]
    }
  ]
})
```

### Paso 4: Crear Servicio API

**Archivo**: `src/modules/mi-modulo/services/miModuloService.ts`

```typescript
import api from '@/plugins/axios'

export interface MiRecurso {
  id: number
  nombre: string
  descripcion: string
  fechaCreacion: string
  creadoPor: string
}

export interface CreateMiRecursoRequest {
  nombre: string
  descripcion: string
}

export interface UpdateMiRecursoRequest {
  nombre: string
  descripcion: string
}

class MiModuloService {
  private baseUrl = '/MiRecurso' // Ruta del controller backend

  /**
   * Obtener todos los recursos
   */
  async getAll(): Promise<MiRecurso[]> {
    const response = await api.get<MiRecurso[]>(this.baseUrl)
    return response.data
  }

  /**
   * Obtener un recurso por ID
   */
  async getById(id: number): Promise<MiRecurso> {
    const response = await api.get<MiRecurso>(`${this.baseUrl}/${id}`)
    return response.data
  }

  /**
   * Crear un nuevo recurso
   */
  async create(data: CreateMiRecursoRequest): Promise<MiRecurso> {
    const response = await api.post<MiRecurso>(this.baseUrl, data)
    return response.data
  }

  /**
   * Actualizar un recurso existente
   */
  async update(id: number, data: UpdateMiRecursoRequest): Promise<void> {
    await api.put(`${this.baseUrl}/${id}`, data)
  }

  /**
   * Eliminar un recurso
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`)
  }

  /**
   * Buscar recursos por nombre
   */
  async search(query: string): Promise<MiRecurso[]> {
    const response = await api.get<MiRecurso[]>(`${this.baseUrl}/search`, {
      params: { q: query }
    })
    return response.data
  }
}

export default new MiModuloService()
```

### Paso 5: Crear Store (Opcional)

**Archivo**: `src/modules/mi-modulo/stores/miModuloStore.ts`

```typescript
import { defineStore } from 'pinia'
import miModuloService, { type MiRecurso } from '../services/miModuloService'

interface MiModuloState {
  recursos: MiRecurso[]
  recursoActual: MiRecurso | null
  loading: boolean
  error: string | null
}

export const useMiModuloStore = defineStore('miModulo', {
  state: (): MiModuloState => ({
    recursos: [],
    recursoActual: null,
    loading: false,
    error: null
  }),

  getters: {
    recursosActivos: (state) => state.recursos.filter(r => r.activo),
    totalRecursos: (state) => state.recursos.length
  },

  actions: {
    async fetchRecursos() {
      this.loading = true
      this.error = null
      try {
        this.recursos = await miModuloService.getAll()
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Error al cargar recursos'
        console.error('Error fetchRecursos:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchRecursoById(id: number) {
      this.loading = true
      this.error = null
      try {
        this.recursoActual = await miModuloService.getById(id)
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Error al cargar recurso'
        console.error('Error fetchRecursoById:', error)
      } finally {
        this.loading = false
      }
    },

    async createRecurso(data: any) {
      this.loading = true
      this.error = null
      try {
        const nuevoRecurso = await miModuloService.create(data)
        this.recursos.push(nuevoRecurso)
        return nuevoRecurso
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Error al crear recurso'
        console.error('Error createRecurso:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateRecurso(id: number, data: any) {
      this.loading = true
      this.error = null
      try {
        await miModuloService.update(id, data)
        const index = this.recursos.findIndex(r => r.id === id)
        if (index !== -1) {
          this.recursos[index] = { ...this.recursos[index], ...data }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Error al actualizar recurso'
        console.error('Error updateRecurso:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteRecurso(id: number) {
      this.loading = true
      this.error = null
      try {
        await miModuloService.delete(id)
        this.recursos = this.recursos.filter(r => r.id !== id)
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Error al eliminar recurso'
        console.error('Error deleteRecurso:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
```

### Paso 6: Crear Vista Principal

**Archivo**: `src/modules/mi-modulo/views/MiModuloView.vue`

```vue
<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Mi Módulo
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gestión de recursos del módulo
        </p>
      </div>
      
      <!-- Botón Crear - Solo si tiene permiso -->
      <button
        v-if="authStore.hasPermission('mimodulo.create')"
        @click="router.push('/mi-modulo/nuevo')"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 
               dark:hover:bg-indigo-600 text-white rounded-lg transition-colors 
               flex items-center gap-2"
      >
        <PlusIcon class="h-5 w-5" />
        Nuevo Recurso
      </button>
    </div>

    <!-- Filtros -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div class="flex gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar recursos..."
          class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 
                 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 
                 dark:text-white"
        />
        <button
          @click="fetchRecursos"
          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 
                 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <MagnifyingGlassIcon class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="bg-red-50 dark:bg-red-900/20 border 
                                        border-red-200 dark:border-red-800 
                                        rounded-lg p-4">
      <p class="text-red-600 dark:text-red-400">{{ store.error }}</p>
    </div>

    <!-- Tabla de Recursos -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 
                       dark:text-gray-400 uppercase tracking-wider">
              ID
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 
                       dark:text-gray-400 uppercase tracking-wider">
              Nombre
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 
                       dark:text-gray-400 uppercase tracking-wider">
              Descripción
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 
                       dark:text-gray-400 uppercase tracking-wider">
              Fecha Creación
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 
                       dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 
                      dark:divide-gray-700">
          <tr v-for="recurso in recursosFiltered" :key="recurso.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 
                       dark:text-gray-100">
              {{ recurso.id }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium 
                       text-gray-900 dark:text-white">
              {{ recurso.nombre }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
              {{ recurso.descripcion }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 
                       dark:text-gray-400">
              {{ formatDate(recurso.fechaCreacion) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-end gap-2">
                <!-- Botón Ver -->
                <button
                  @click="verDetalle(recurso.id)"
                  class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 
                         dark:hover:text-indigo-300"
                  title="Ver detalle"
                >
                  <EyeIcon class="h-5 w-5" />
                </button>

                <!-- Botón Editar - Solo con permiso -->
                <button
                  v-if="authStore.hasPermission('mimodulo.edit')"
                  @click="editarRecurso(recurso.id)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 
                         dark:hover:text-blue-300"
                  title="Editar"
                >
                  <PencilIcon class="h-5 w-5" />
                </button>

                <!-- Botón Eliminar - Solo con permiso -->
                <button
                  v-if="authStore.hasPermission('mimodulo.delete')"
                  @click="confirmarEliminar(recurso)"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 
                         dark:hover:text-red-300"
                  title="Eliminar"
                >
                  <TrashIcon class="h-5 w-5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div v-if="recursosFiltered.length === 0" 
           class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">
          No se encontraron recursos
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMiModuloStore } from '../stores/miModuloStore'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const store = useMiModuloStore()

const searchQuery = ref('')

const recursosFiltered = computed(() => {
  if (!searchQuery.value) return store.recursos
  
  const query = searchQuery.value.toLowerCase()
  return store.recursos.filter(r => 
    r.nombre.toLowerCase().includes(query) ||
    r.descripcion.toLowerCase().includes(query)
  )
})

const fetchRecursos = async () => {
  await store.fetchRecursos()
}

const verDetalle = (id: number) => {
  router.push(`/mi-modulo/${id}`)
}

const editarRecurso = (id: number) => {
  router.push(`/mi-modulo/${id}/editar`)
}

const confirmarEliminar = async (recurso: any) => {
  if (confirm(`¿Está seguro de eliminar "${recurso.nombre}"?`)) {
    try {
      await store.deleteRecurso(recurso.id)
      alert('Recurso eliminado correctamente')
    } catch (error) {
      alert('Error al eliminar el recurso')
    }
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

onMounted(() => {
  fetchRecursos()
})
</script>
```

### Paso 7: Agregar al Menú de Navegación

**Archivo**: `src/layouts/MainLayout.vue`

Buscar la sección "Módulos" y agregar:

```vue
<!-- Mi Módulo -->
<router-link
  to="/mi-modulo"
  v-if="authStore.hasPermission('mimodulo.view')"
  class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
  :class="{
    'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg': 
      $route.path.startsWith('/mi-modulo'),
    'text-slate-300 hover:bg-slate-800/50 hover:text-white': 
      !$route.path.startsWith('/mi-modulo')
  }"
>
  <DocumentTextIcon class="h-5 w-5 flex-shrink-0" />
  <span v-show="!isSidebarCollapsed">Mi Módulo</span>
</router-link>
```

---

## 🔄 Integración Completa

### Checklist Final

#### Backend

- [ ] Crear permisos en el Core
- [ ] Asignar permisos a roles
- [ ] Configurar JWT en appsettings.json
- [ ] Configurar autenticación en Program.cs
- [ ] Implementar validación en Controllers
- [ ] Configurar CORS
- [ ] Probar endpoints con token válido

#### Frontend

- [ ] Crear estructura de carpetas del módulo
- [ ] Implementar router con meta.permissions
- [ ] Registrar rutas en router principal
- [ ] Crear servicio API
- [ ] Crear store (opcional)
- [ ] Implementar vistas con validación de permisos
- [ ] Agregar al menú de navegación
- [ ] Probar flujo completo

### Flujo de Prueba Completo

```powershell
# 1. Verificar que el Core está corriendo
Test-NetConnection -ComputerName 192.168.2.12 -Port 8080

# 2. Login y obtener token
$loginResponse = Invoke-RestMethod `
    -Uri "http://192.168.2.12:8080/api/Auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body (@{
        userName = "testuser"
        password = "Test123!"
    } | ConvertTo-Json)

$token = $loginResponse.token
$user = $loginResponse.user

Write-Host "✓ Usuario: $($user.userName)"
Write-Host "✓ Roles: $($user.roles -join ', ')"
Write-Host "✓ Permisos: $($user.permissions -join ', ')"

# 3. Probar endpoint del módulo
$headers = @{
    Authorization = "Bearer $token"
}

$recursos = Invoke-RestMethod `
    -Uri "http://localhost:5000/api/MiRecurso" `
    -Headers $headers

Write-Host "✓ Recursos obtenidos: $($recursos.Count)"
```

---

## 🔧 Troubleshooting

### Error: 401 Unauthorized

**Síntomas**: Todas las llamadas devuelven 401

**Causas**:
1. Token no enviado en headers
2. Token expirado (más de 3 horas)
3. Token inválido

**Solución**:
```typescript
// Verificar que axios envía el token
import api from '@/plugins/axios'

// El token se configura automáticamente en login
const token = localStorage.getItem('token')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}
```

### Error: 403 Forbidden

**Síntomas**: Endpoint devuelve 403 aunque el usuario está autenticado

**Causas**:
1. Usuario no tiene el permiso requerido
2. Permiso no asignado al rol del usuario
3. Token generado antes de asignar permisos

**Solución**:
```powershell
# 1. Verificar permisos del rol
$permisos = Invoke-RestMethod `
    -Uri "http://192.168.2.12:8080/api/Permissions/role/User" `
    -Headers @{Authorization = "Bearer $tokenAdmin"}

$permisos | Where-Object { $_.key -like "mimodulo.*" }

# 2. Hacer login nuevamente para obtener token actualizado
```

### Error: JWT Signature Invalid

**Síntomas**: Error al validar token en el módulo

**Causa**: La clave `Jwt:Key` no coincide entre Core y Módulo

**Solución**:
```json
// Verificar que sea IDÉNTICA en ambos appsettings.json
{
  "Jwt": {
    "Key": "clave_super_secreta_para_jwt_12345", // Debe ser igual
    "Issuer": "SCNexus.Core",
    "Audience": "SCNexus.Users"
  }
}
```

### Error: CORS Policy

**Síntomas**: Error de CORS en el navegador

**Solución**:
```csharp
// En Program.cs del módulo backend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://192.168.2.12:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ...

app.UseCors("AllowFrontend"); // Antes de UseAuthentication
```

### Frontend no muestra botones con permisos

**Síntomas**: Los `v-if` con permisos no funcionan

**Solución**:
```typescript
// Verificar que userData tenga permisos
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
console.log('Permisos del usuario:', authStore.userPermissions)

// Si está vacío, hacer logout y login nuevamente
```

---

## 📚 Referencias Rápidas

### URLs del Sistema

| Servicio | URL | Propósito |
|----------|-----|-----------|
| Core API | http://192.168.2.12:8080 | Autenticación y permisos |
| Swagger Core | http://192.168.2.12:8080/swagger | Documentación API Core |
| Frontend Dev | http://localhost:3000 | Interfaz de usuario |
| Base de Datos Core | 210.17.1.54 | SCNexusDB |

### Comandos Útiles

```powershell
# Iniciar frontend
cd c:\devLX\scnexus-front
npm run dev

# Iniciar Core API
cd c:\devLX\scnexus-core\SCNexus.Core.API
dotnet run

# Iniciar módulo backend
cd c:\devLX\scnexus-mimodulo
dotnet run

# Ver logs en tiempo real
dotnet watch run

# Crear migración EF Core
dotnet ef migrations add NombreMigracion
dotnet ef database update
```

### Scripts PowerShell de Utilidad

**Crear permisos masivamente**:
```powershell
function New-ModulePermissions {
    param(
        [string]$ModuleName,
        [string]$Token
    )
    
    $actions = @("view", "create", "edit", "delete", "approve", "export")
    $descriptions = @{
        view = "Ver"
        create = "Crear"
        edit = "Editar"
        delete = "Eliminar"
        approve = "Aprobar"
        export = "Exportar"
    }
    
    foreach ($action in $actions) {
        $permiso = @{
            key = "$ModuleName.$action"
            description = "$($descriptions[$action]) $ModuleName"
            module = $ModuleName
        }
        
        try {
            Invoke-RestMethod `
                -Uri "http://192.168.2.12:8080/api/Permissions" `
                -Method Post `
                -Headers @{Authorization = "Bearer $Token"} `
                -ContentType "application/json" `
                -Body ($permiso | ConvertTo-Json)
            
            Write-Host "✓ $($permiso.key)" -ForegroundColor Green
        } catch {
            Write-Host "✗ $($permiso.key): $_" -ForegroundColor Red
        }
    }
}

# Uso:
# New-ModulePermissions -ModuleName "cajachica" -Token $token
```

---

## 🎓 Mejores Prácticas

### 1. Nomenclatura de Permisos

✅ **Correcto**:
- `cajachica.view`
- `depositos.create`
- `inventarios.aprobar`

❌ **Incorrecto**:
- `CajaChica.View`
- `deposito_crear`
- `INVENTARIOS_APROBAR`

### 2. Validación de Permisos

```csharp
// ✅ CORRECTO: Validar al inicio del método
[HttpGet]
public async Task<IActionResult> GetData()
{
    if (!HasPermission("modulo.view"))
        return Forbid();
    
    // Lógica del endpoint
}

// ❌ INCORRECTO: No validar permisos
[HttpGet]
public async Task<IActionResult> GetData()
{
    // Cualquiera con token válido puede acceder
    return Ok(data);
}
```

### 3. Manejo de Errores

```typescript
// ✅ CORRECTO: Manejo específico de errores
try {
  await miModuloService.create(data)
  alert('Creado correctamente')
  router.push('/mi-modulo')
} catch (error: any) {
  if (error.response?.status === 403) {
    alert('No tiene permisos para crear')
  } else if (error.response?.status === 401) {
    alert('Sesión expirada')
    router.push('/login')
  } else {
    alert('Error al crear: ' + error.message)
  }
}

// ❌ INCORRECTO: Error genérico
try {
  await miModuloService.create(data)
} catch (error) {
  alert('Error')
}
```

### 4. Logging y Auditoría

```csharp
// ✅ CORRECTO: Registrar acciones importantes
_logger.LogInformation(
    "Usuario {User} creó recurso {RecursoId}",
    GetUserName(), recurso.Id);

_logger.LogWarning(
    "Usuario {User} intentó eliminar sin permiso",
    GetUserName());

// Backend también debe guardar en tabla AuditLogs
```

### 5. Seguridad en Frontend

```vue
<!-- ✅ CORRECTO: Validar permisos en UI y backend -->
<button
  v-if="authStore.hasPermission('mimodulo.delete')"
  @click="eliminar">
  Eliminar
</button>

<!-- ❌ INCORRECTO: Solo ocultar en UI -->
<!-- El backend SIEMPRE debe validar -->
<button @click="eliminar" style="display: none">
  Eliminar
</button>
```

---

## 📞 Contacto y Soporte

Para dudas o problemas:

- **Permisos del Core**: Contactar al equipo de Core
- **Active Directory**: Contactar a Sistemas
- **Desarrollo de módulos**: Consultar esta guía
- **Base de datos**: DBA del proyecto

---

**Última actualización**: Febrero 2026  
**Versión**: 1.0  
**Autor**: Equipo SCNexus Development
