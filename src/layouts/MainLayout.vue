<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
    <!-- Overlay para móvil -->
    <div v-if="isSidebarOpen" @click="isSidebarOpen = false"
      class="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"></div>

    <!-- Sidebar: escritorio = franja estrecha y se expande al pasar el ratón; móvil = panel ancho al abrir -->
    <aside :class="[
      'fixed top-0 left-0 h-full flex flex-col bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-800 dark:text-white transition-transform duration-150 ease-out md:transition-all md:duration-300 z-30 shadow-2xl border-r border-slate-200 dark:border-slate-700/40',
      effectiveSidebarCollapsed ? 'w-20' : 'w-72',
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]">
      <div class="h-full flex flex-col" @mouseenter="onSidebarMouseEnter" @mouseleave="onSidebarMouseLeave">
        <!-- Header del Sidebar -->
        <div
          class="flex-shrink-0 flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700/50 bg-gradient-to-r from-blue-500/10 to-sky-400/10 dark:from-blue-600/10 dark:to-sky-500/10 backdrop-blur-sm">
          <div class="flex items-center gap-3">
            <img src="/favicon.png" alt="Logo de la empresa" class="w-10 h-10 object-contain" />
            <div v-show="!effectiveSidebarCollapsed" class="transition-opacity duration-300">
              <h2
                class="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                SCNexus
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">Sistema Integrado</p>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 min-h-0 overflow-y-auto p-4 pb-4 space-y-1 custom-scrollbar" @click="onSidebarNavClick">
          <!-- Sección Principal -->
          <div v-show="!effectiveSidebarCollapsed" class="px-3 py-2 mb-2">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Principal</p>
          </div>

          <!-- Dashboard -->
          <router-link to="/dashboard"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path === '/dashboard',
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': $route.path !== '/dashboard'
            }" :title="effectiveSidebarCollapsed ? 'Dashboard' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <HomeIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path === '/dashboard' }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Dashboard</span>
          </router-link>

          <!-- Admin Panel -->
          <router-link v-if="authStore.isAdmin" to="/admin"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path === '/admin',
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': $route.path !== '/admin'
            }" :title="effectiveSidebarCollapsed ? 'Panel de Admin' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <UserGroupIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path === '/admin' }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Panel de Admin</span>
          </router-link>

          <!-- User Panel -->
          <router-link v-if="authStore.isUser" to="/user"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path === '/user',
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': $route.path !== '/user'
            }" :title="effectiveSidebarCollapsed ? 'Panel de Usuario' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <UserIcon class="h-5 w-5 flex-shrink-0 relative z-10" :class="{ 'scale-110': $route.path === '/user' }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Panel de Usuario</span>
          </router-link>

          <!-- Separador Módulos -->
          <div v-show="!effectiveSidebarCollapsed" class="px-3 py-2 my-3">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Módulos</p>
          </div>

          <!-- Artículo Maestro -->
          <router-link v-if="hasModuleAccess('articulomaestro')" to="/articulo-maestro"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/articulo-maestro'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/articulo-maestro')
            }" :title="effectiveSidebarCollapsed ? 'Artículo Maestro' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <CubeIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/articulo-maestro') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Artículo Maestro</span>
          </router-link>

          <!-- Caja Chica -->
          <router-link v-if="hasModuleAccess('cajachica')" to="/caja-chica"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/caja-chica'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/caja-chica')
            }" :title="effectiveSidebarCollapsed ? 'Caja Chica' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <DocumentCheckIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/caja-chica') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Caja Chica</span>
          </router-link>

          <!-- Conciliación -->
          <router-link v-if="hasModuleAccess('conciliacion')" to="/conciliacion"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/conciliacion'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/conciliacion')
            }" :title="effectiveSidebarCollapsed ? 'Conciliación' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <ClipboardDocumentCheckIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/conciliacion') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Conciliación</span>
          </router-link>

          <!-- Gestión ODC SAP -->
          <router-link v-if="canAccessGestionOdcSap" to="/mba3-consultas"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/mba3-consultas'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/mba3-consultas')
            }" :title="effectiveSidebarCollapsed ? 'Gestión ODC SAP' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <ArrowsRightLeftIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/mba3-consultas') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Gestión ODC SAP</span>
          </router-link>

          <!-- Importador PYG (main) -->
          <router-link v-if="hasModuleAccess('pyg')" to="/pyg"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/pyg'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/pyg')
            }" :title="effectiveSidebarCollapsed ? 'Importador PYG' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <DocumentArrowUpIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/pyg') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Importador PYG</span>
          </router-link>

        <!-- Mis Inventarios (usuarios con acceso tipo Tienda, o pickers invitados a una sesión puntual) -->
        <router-link
          v-if="(hasModuleAccess('inventario') && isTiendaAccess) || (!hasModuleAccess('inventario') && hasPickerSessions)"
          to="/inventario/mis-inventarios"
          class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
          :class="{
            'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/inventario/mis-inventarios'),
            'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/inventario/mis-inventarios')
          }"
          :title="effectiveSidebarCollapsed ? 'Mis Inventarios' : ''"
        >
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          <ClipboardDocumentListIcon class="h-5 w-5 flex-shrink-0 relative z-10" :class="{ 'scale-110': $route.path.startsWith('/inventario/mis-inventarios') }" />
          <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Mis Inventarios</span>
        </router-link>

          <!-- Inventario (Supervisor / Administrador: todas las pantallas) -->
          <router-link v-if="hasModuleAccess('inventario') && !isTiendaAccess" to="/inventario"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/inventario'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/inventario')
            }" :title="effectiveSidebarCollapsed ? 'Inventario' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <ArchiveBoxIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/inventario') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Inventario</span>
          </router-link>

          <!-- Personal de Tiendas -->
          <router-link v-if="hasModuleAccess('gestionusuarios')" to="/gestion-usuarios"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/gestion-usuarios'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/gestion-usuarios')
            }" :title="effectiveSidebarCollapsed ? 'Personal de Tiendas' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <IdentificationIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/gestion-usuarios') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Personal de Tiendas</span>
          </router-link>

          <!-- Promoción Sobres -->
          <router-link v-if="hasModuleAccess('promocionsobres')" :to="promocionSobresSidebarTo"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/promocion-sobres'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/promocion-sobres')
            }" :title="effectiveSidebarCollapsed ? 'Promoción Sobres' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <GiftIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/promocion-sobres') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Promoción Sobres</span>
          </router-link>

          <!-- Reposiciones -->
          <router-link v-if="hasModuleAccess('reposiciones')" to="/reposiciones"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/reposiciones'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/reposiciones')
            }" :title="effectiveSidebarCollapsed ? 'Reposiciones' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <ShoppingCartIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/reposiciones') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Reposiciones</span>
          </router-link>

          <!-- Ruleta -->
          <router-link v-if="hasModuleAccess('ruleta')" to="/ruleta"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/ruleta'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/ruleta')
            }" :title="effectiveSidebarCollapsed ? 'Ruleta' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <SparklesIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/ruleta') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Ruleta</span>
          </router-link>

          <!-- Transacciones -->
          <router-link v-if="hasModuleAccess('transacciones')" to="/transacciones"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/transacciones'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/transacciones')
            }" :title="effectiveSidebarCollapsed ? 'Transacciones' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <BanknotesIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/transacciones') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Transacciones</span>
          </router-link>

          <!-- Transferencias de Stocks -->
          <router-link v-if="hasModuleAccess('transferenciadirecta')" to="/transferencias-stock"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/transferencias-stock'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/transferencias-stock')
            }" :title="effectiveSidebarCollapsed ? 'Transferencias de Stock' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <TruckIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/transferencias-stock') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Transferencias de Stock</span>
          </router-link>

          <!-- Recepción Mercadería -->
          <router-link v-if="hasModuleAccess('recepcionmercaderia')" to="/recepcion-mercaderia"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/recepcion-mercaderia'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/recepcion-mercaderia')
            }" :title="effectiveSidebarCollapsed ? 'Recepción Mercadería' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <TruckIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/recepcion-mercaderia') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Recepción Mercadería</span>
          </router-link>

          <!-- Validación de Artículos -->
          <router-link v-if="hasModuleAccess('articuloscaner')" to="/articulo-scaner"
            class="group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden"
            :class="{
              'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/50': $route.path.startsWith('/articulo-scaner'),
              'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white': !$route.path.startsWith('/articulo-scaner')
            }" :title="effectiveSidebarCollapsed ? 'Validación de Artículos' : ''">
            <div
              class="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-sky-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            </div>
            <QrCodeIcon class="h-5 w-5 flex-shrink-0 relative z-10"
              :class="{ 'scale-110': $route.path.startsWith('/articulo-scaner') }" />
            <span v-show="!effectiveSidebarCollapsed" class="relative z-10 font-medium">Validación de Artículos</span>
          </router-link>

        </nav>

        <!-- Footer del Sidebar -->
        <div
          class="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm">
          <div v-show="!effectiveSidebarCollapsed" class="mb-3 px-2">
            <router-link
              to="/user"
              class="flex items-center gap-3 p-2 rounded-lg bg-slate-100/90 dark:bg-slate-800/50 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
              title="Panel de Usuario"
            >
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-xs font-bold flex-shrink-0 text-white">
                <span>{{ authStore.userName?.charAt(0).toUpperCase() || 'U' }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-800 dark:text-white truncate">{{ authStore.userName }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ authStore.fullName || 'Usuario' }}</p>
              </div>
            </router-link>
          </div>
          <button @click="logout"
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            :title="effectiveSidebarCollapsed ? 'Cerrar Sesión' : ''">
            <ArrowRightOnRectangleIcon class="h-5 w-5 flex-shrink-0" />
            <span v-show="!effectiveSidebarCollapsed">Cerrar Sesión</span>
          </button>
        </div>
      </div>
      <button v-if="isDesktopSidebarViewport" @click="toggleSidebarPin" @mouseenter="onPinHandleMouseEnter"
        @mouseleave="onPinHandleMouseLeave"
        class="group hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 h-10 w-7 items-center justify-center rounded-r-lg border border-slate-300 dark:border-slate-600/80 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors z-40"
        :aria-label="sidebarModeLabel">
        <PinOff v-if="sidebarMode === 'auto'" class="h-4 w-4 opacity-80 pin-icon pin-icon--auto" />
        <Pin v-else class="h-4 w-4 text-sky-300 pin-icon pin-icon--fixed" />
        <span
          class="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-200">
          <span
            class="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-700"></span>
          {{ sidebarModeLabel }}
        </span>
      </button>
    </aside>

    <!-- Main Content -->
    <div :class="[
      'transition-all duration-300',
      effectiveSidebarCollapsed ? 'md:ml-20' : 'md:ml-72'
    ]">
      <!-- Mobile Header -->
      <header class="bg-white dark:bg-gray-800 shadow md:hidden sticky top-0 z-30 transition-colors duration-300">
        <div class="px-4 py-3 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 flex-shrink-0">
            <button @click="isSidebarOpen = !isSidebarOpen"
              class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu">
              <Bars3Icon class="h-6 w-6 text-gray-800 dark:text-gray-200" />
            </button>
          </div>
          <h1 class="text-xl font-semibold text-gray-800 dark:text-white truncate min-w-0 text-center flex-1">
            SCNexus
          </h1>
          <button @click="themeStore.toggleTheme()"
            class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            :title="themeStore.isDark ? 'Modo Claro' : 'Modo Oscuro'">
            <SunIcon v-if="themeStore.isDark" class="h-5 w-5 text-yellow-400" />
            <MoonIcon v-else class="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </header>

      <!-- Desktop Header -->
      <header
        class="hidden md:block bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30 transition-colors duration-300">
        <div class="px-6 py-4 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <h1 class="text-2xl font-semibold text-gray-800 dark:text-white truncate">
              {{ pageTitle }}
            </h1>
          </div>
          <div class="flex items-center gap-4 flex-shrink-0">
            <button @click="themeStore.toggleTheme()"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
              :title="themeStore.isDark ? 'Modo Claro' : 'Modo Oscuro'">
              <SunIcon v-if="themeStore.isDark"
                class="h-6 w-6 text-yellow-400 group-hover:scale-110 transition-transform" />
              <MoonIcon v-else
                class="h-6 w-6 text-gray-600 dark:text-gray-300 group-hover:scale-110 transition-transform" />
            </button>
            <span class="text-sm text-gray-600 dark:text-gray-300">{{ authStore.fullName || authStore.userName }}</span>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main
        class="min-h-[calc(100vh-4rem)]"
        :class="route.meta?.fullBleed ? '' : 'p-2 md:p-3 lg:p-4'"
      >
        <div
          v-if="showOdcSapVolverInMainChrome && odcSapVolverTarget"
          class="flex justify-end mb-4 -mt-1"
        >
          <OdcSapVolverButton
            :to="odcSapVolverTarget"
            :title="odcSapVolverTitle"
          />
        </div>
        <router-view v-slot="{ Component, route }">
          <component :is="Component" :key="route.path" />
        </router-view>
      </main>
    </div>

    <!-- Toast Notifications -->
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
// @ts-ignore
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  Bars3Icon,
  HomeIcon,
  UserGroupIcon,
  UserIcon,
  UsersIcon,
  ArrowsRightLeftIcon,
  DocumentCheckIcon,
  ClipboardDocumentCheckIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  SunIcon,
  MoonIcon,
  CubeIcon,
  ArchiveBoxIcon,
  DocumentArrowUpIcon,
  QrCodeIcon,
  IdentificationIcon,
  GiftIcon,
  SparklesIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon
} from '@heroicons/vue/24/outline'
import { Pin, PinOff, TruckIcon } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'
import ToastContainer from '../components/ToastContainer.vue'
import { useNotificaciones } from '@/composables/useNotificaciones'
import { useOdcSapVolver } from '@/composables/useOdcSapVolver'
import OdcSapVolverButton from '@/components/OdcSapVolverButton.vue'
import { useWarehouseAccessType } from '@/modules/inventario/composables/useWarehouseAccessType'
import { usePickerSessionAccess } from '@/modules/inventario/composables/usePickerSessionAccess'
import {
  hasPromocionSobresUiPermission,
  promocionSobresDefaultPath
} from '@/modules/promocion-sobres/permissions'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { connect: connectNotificaciones, disconnect: disconnectNotificaciones } = useNotificaciones()
const { target: odcSapVolverTarget, title: odcSapVolverTitle } = useOdcSapVolver()
const { isTienda: isTiendaAccess } = useWarehouseAccessType()
const { hasPickerSessions, checkPickerAccess } = usePickerSessionAccess()

/** Volver en patrón A (arriba del título) dentro de cada vista; MainLayout solo si la ruta no lo define en la página. */
const showOdcSapVolverInMainChrome = computed(() => {
  if (!odcSapVolverTarget.value) return false
  const n = route.name
  if (n === 'mba3-consultas-pedido-detalle') return false
  if (n === 'mba3-consultas-cargar-plantilla-detalle') return false
  if (n === 'mba3-consultas-cargar-plantilla') return false
  if (n === 'mba3-consultas-pedidos-listado') return false
  if (n === 'mba3-consultas-produccion-pedidos-listado') return false
  if (n === 'mba3-consultas-redistribucion') return false
  if (n === 'mba3-consultas-pedido-redistribucion') return false
  if (n === 'mba3-consultas-revisar-redistribucion') return false
  if (n === 'mba3-consultas-proceso') return false
  if (n === 'mba3-consultas-admin-destinatarios') return false
  if (n === 'mba3-consultas-admin-catalogo-correos') return false
  return true
})

const isSidebarOpen = ref(false)

/** Expansión al pasar el ratón (solo escritorio, breakpoint `md`) */
const isSidebarHoverExpanded = ref(false)
type SidebarMode = 'auto' | 'expanded' | 'compact'
const SIDEBAR_MODE_STORAGE_KEY = 'scnexus.sidebar.mode'
const sidebarMode = ref<SidebarMode>('auto')
const SIDEBAR_MOUSELEAVE_DELAY_MS = 120
const isPointerOverPinHandle = ref(false)
let sidebarMouseLeaveTimer: ReturnType<typeof setTimeout> | null = null

const SIDEBAR_MD_MIN_PX = 768

const isDesktopSidebarViewport = ref(false)

function updateSidebarViewport() {
  if (typeof window === 'undefined') return
  isDesktopSidebarViewport.value = window.innerWidth >= SIDEBAR_MD_MIN_PX
}

if (typeof window !== 'undefined') {
  updateSidebarViewport()
}

function onSidebarMouseEnter() {
  if (sidebarMouseLeaveTimer) {
    clearTimeout(sidebarMouseLeaveTimer)
    sidebarMouseLeaveTimer = null
  }
  if (isDesktopSidebarViewport.value && sidebarMode.value === 'auto') {
    isSidebarHoverExpanded.value = true
  }
}

function onSidebarMouseLeave() {
  if (sidebarMode.value !== 'auto') return
  if (sidebarMouseLeaveTimer) {
    clearTimeout(sidebarMouseLeaveTimer)
  }
  sidebarMouseLeaveTimer = setTimeout(() => {
    if (!isPointerOverPinHandle.value) {
      isSidebarHoverExpanded.value = false
    }
    sidebarMouseLeaveTimer = null
  }, SIDEBAR_MOUSELEAVE_DELAY_MS)
}

function onPinHandleMouseEnter() {
  isPointerOverPinHandle.value = true
  if (sidebarMouseLeaveTimer) {
    clearTimeout(sidebarMouseLeaveTimer)
    sidebarMouseLeaveTimer = null
  }
}

function onPinHandleMouseLeave() {
  isPointerOverPinHandle.value = false
  if (sidebarMode.value === 'auto') {
    onSidebarMouseLeave()
  }
}

function onSidebarNavClick(event: MouseEvent) {
  if (isDesktopSidebarViewport.value || !isSidebarOpen.value) return
  const target = event.target as HTMLElement | null
  if (!target) return
  const anchor = target.closest('a')
  if (!anchor) return
  isSidebarOpen.value = false
}

/** Escritorio: franja estrecha salvo hover. Móvil: ancho completo cuando el panel está abierto */
const effectiveSidebarCollapsed = computed(() => {
  if (!isDesktopSidebarViewport.value) return false
  if (sidebarMode.value === 'expanded') return false
  if (sidebarMode.value === 'compact') return true
  return !isSidebarHoverExpanded.value
})

const sidebarModeLabel = computed(() => {
  if (sidebarMode.value === 'auto') {
    return effectiveSidebarCollapsed.value ? 'Anclar sidebar compacto' : 'Anclar sidebar expandido'
  }
  return 'Desanclar sidebar'
})

function persistSidebarMode() {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SIDEBAR_MODE_STORAGE_KEY, sidebarMode.value)
}

function toggleSidebarPin() {
  const isPinned = sidebarMode.value !== 'auto'
  if (!isPinned) {
    sidebarMode.value = effectiveSidebarCollapsed.value ? 'compact' : 'expanded'
  } else {
    sidebarMode.value = 'auto'
    isSidebarHoverExpanded.value = false
  }
  persistSidebarMode()
}

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/admin': 'Panel de Administración',
    '/user': 'Panel de Usuario',
    '/conciliacion': 'Conciliación Bancaria',
    '/conciliacion/importar': 'Importar Movimientos',
    '/conciliacion/sincronizar-sap': 'Sincronizar SAP',
    '/conciliacion/conciliar': 'Conciliación Automática',
    '/conciliacion/novedades': 'Novedades',
    '/conciliacion/historial': 'Historial',
    '/conciliacion/partidas-abiertas': 'Partidas Abiertas',
    '/mba3-consultas': 'Gestión ODC SAP',
    '/gestion-usuarios': 'Personal de Tiendas',
    '/pyg': 'Importador PYG',
    '/articulo-scaner': 'Validación de Artículos',
    '/inventario': 'Inventario',
    '/inventario/configuracion-usuario': 'Configuración de Usuario',
    '/inventario/planificaciones': 'Planificación de Inventario',
    '/inventario/generados': 'Inventarios Generados',
    '/promocion-sobres/entrega': 'Promoción Sobres',
    '/promocion-sobres/monitoreo': 'Monitoreo entregas',
    '/mba3-consultas/ordenes-compra': 'Órdenes de Compra',
    '/mba3-consultas/proceso': 'Enviar ODC a SAP',
    '/usuarios': 'Gestión de Usuarios',
    '/roles': 'Gestión de Roles',
    '/permisos': 'Gestión de Permisos',
    '/reposiciones': 'Reposiciones',
    '/reposiciones/carrito': 'Carrito de Reposición',
    '/reposiciones/historial': 'Historial de Reposiciones',
    '/recepcion-mercaderia': 'Recepción Mercadería',
    '/recepcion-mercaderia/pendientes': 'Transferencias Pendientes',
    '/recepcion-mercaderia/en-curso': 'Transferencias en Curso',
    '/recepcion-mercaderia/historial': 'Historial',
    '/ruleta': 'Ruleta One Card',
    '/ruleta/enrolador': 'Girar Ruleta',
    '/ruleta/listado': 'Listado de Ruleta',
    '/ruleta/supervisor': 'Monitoreo de Enroladores',
    '/ruleta/admin': 'Administración — Ruleta',
    '/ruleta/admin/campanas': 'Gestión de campañas',
    '/ruleta/admin/premios': 'Premios y probabilidades',
    '/ruleta/admin/inventario': 'Inventario por tienda',
    '/ruleta/admin/dashboard': 'Dashboard global',
    '/ruleta/admin/reportes': 'Reportes y exportación',
    '/ruleta/admin/enroladores': 'Enroladores y ranking',
    '/transferencias-stock': 'Transferencias de Stock',
    '/transferencias-stock/crearsolicitud': 'Crear Transferencia',
    '/transferencias-stock/historial' : 'Historial de Transferencias',
  }

  return (route.meta?.title as string) || titles[route.path] || 'SCNexus'
})

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const promocionSobresSidebarTo = computed(() =>
  promocionSobresDefaultPath(authStore.userPermissions || [])
)

const hasModuleAccess = (moduleName: string): boolean => {
  if (authStore.userRoles?.includes('Admin')) {
    return true
  }

  const permissions = authStore.userPermissions || []
  if (moduleName === 'gestionusuarios') {
    return permissions.some(
      (permission: string) => permission.startsWith('gestionusuarios.') || permission === 'staff.view'
    )
  }
  if (moduleName === 'pyg') {
    return permissions.some((permission: string) => {
      const normalizedPermission = permission.toLowerCase()
      return normalizedPermission === 'pyg.view' || normalizedPermission === 'pyg.edit'
    })
  }
  if (moduleName === 'inventario') {
    return permissions.some((permission: string) => permission.toLowerCase().startsWith('inventario.'))
  }
  if (moduleName === 'promocionsobres') {
    return hasPromocionSobresUiPermission(permissions)
  }
  if (moduleName === 'reposiciones') return true
  if (moduleName === 'recepcionmercaderia') {
    const isAdmin = authStore.userRoles?.includes('Admin') || false
    return isAdmin || permissions.some((permission: string) => permission.toLowerCase().startsWith('recepcion.'))
  }

  const normalizedModule = moduleName.toLowerCase()

  return permissions.some((permission: string) => {
    const normalizedPermission = permission.toLowerCase()
    if (moduleName.toLowerCase() === 'usuarios') {
      return normalizedPermission.startsWith('usuarios.') || normalizedPermission.startsWith('users.')
    }
    if (moduleName.toLowerCase() === 'roles') {
      return normalizedPermission.startsWith('roles.')
    }
    if (moduleName.toLowerCase() === 'permisos') {
      return normalizedPermission.startsWith('permisos.') || normalizedPermission.startsWith('permissions.')
    }
    return normalizedPermission.startsWith(`${normalizedModule}.`)
  })
}

/**
 * Fallback si /Auth/me falla temporalmente: capabilities primero, luego permisos legacy.
 */
const canAccessGestionOdcSap = computed(() => {
  if (
    authStore.canViewOdcSap ||
    authStore.canManageOrder ||
    authStore.canViewOrderList ||
    authStore.canViewMabel ||
    authStore.canViewProduccionElRayo
  ) {
    return true
  }

  const permissions = authStore.userPermissions || []
  return permissions.some((permission: string) => {
    const normalized = permission.toLowerCase()
    return (
      normalized === 'odc.view' ||
      normalized === 'odcsap.view' ||
      normalized === 'mabel.view' ||
      normalized === 'produccion-elrayo.view' ||
      normalized.startsWith('odc.') ||
      normalized.startsWith('odcsap.') ||
      normalized.startsWith('mabel.')
    )
  })
})

onMounted(async () => {
  if (authStore.token && !authStore.capabilities) {
    await authStore.fetchMe()
  }
  if (authStore.isAuthenticated && !hasModuleAccess('inventario') && authStore.userData?.id) {
    checkPickerAccess(authStore.userData.id)
  }
  if (typeof window !== 'undefined') {
    const savedSidebarMode = window.localStorage.getItem(SIDEBAR_MODE_STORAGE_KEY)
    if (savedSidebarMode === 'auto' || savedSidebarMode === 'expanded' || savedSidebarMode === 'compact') {
      sidebarMode.value = savedSidebarMode
    }
  }
  updateSidebarViewport()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateSidebarViewport)
  }

  if (authStore.isAuthenticated) {
    connectNotificaciones()
  }
})

onUnmounted(() => {
  if (sidebarMouseLeaveTimer) {
    clearTimeout(sidebarMouseLeaveTimer)
    sidebarMouseLeaveTimer = null
  }
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateSidebarViewport)
  }
})

watch(() => authStore.isAuthenticated, (isAuth: boolean) => {
  if (isAuth) {
    connectNotificaciones()
  } else {
    disconnectNotificaciones()
  }
})

watch(() => route.fullPath, () => {
  if (!isDesktopSidebarViewport.value) {
    isSidebarOpen.value = false
  }
})
</script>

<style scoped>
/* Scrollbar personalizado para el sidebar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.pin-icon {
  transform-origin: top center;
}

.pin-icon--auto {
  animation: pin-wiggle 1.8s ease-in-out infinite;
}

.pin-icon--fixed {
  animation: pin-breathe 2.4s ease-in-out infinite;
}

@keyframes pin-wiggle {

  0%,
  100% {
    transform: rotate(-10deg) translateY(0);
  }

  50% {
    transform: rotate(10deg) translateY(-1px);
  }
}

@keyframes pin-breathe {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.06);
  }
}
</style>
