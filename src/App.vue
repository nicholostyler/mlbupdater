<template>
  <div class="min-h-screen bg-[#f7fbf9] dark:bg-slate-900">
    <Menubar :model="items" class="px-2">
      <!-- Critical: custom item renderer that preserves RouterLink behavior -->
      <template #item="{ item, props }">
        <!-- Internal routes -->
        <RouterLink
          v-if="item.to"
          v-bind="props.action"
          :to="item.to"
          class="p-menuitem-link"
        >
          <span :class="item.icon" />
          <span>{{ item.label }}</span>
        </RouterLink>

        <!-- External links -->
        <a
          v-else-if="item.url"
          v-bind="props.action"
          :href="item.url"
          class="p-menuitem-link"
          target="_blank"
          rel="noreferrer"
        >
          <span :class="item.icon" />
          <span>{{ item.label }}</span>
        </a>

        <!-- Plain actions -->
        <button
          v-else
          v-bind="props.action"
          type="button"
          class="p-menuitem-link"
        >
          <span :class="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </template>

      <!-- Right side: dark mode toggle -->
      <template #end>
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-color hidden sm:inline">Dark</span>
          <InputSwitch v-model="isDark" />
        </div>
      </template>
    </Menubar>

    <main class="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import Menubar from 'primevue/menubar'
import InputSwitch from 'primevue/inputswitch'
import type { MenuItem } from 'primevue/menuitem'

const items = ref<MenuItem[]>([
  { label: 'Home',       icon: 'pi pi-home',       to: { name: 'home' },       routerLinkActiveOptions: { exact: true } },
  { label: 'Schedule', icon: 'pi pi-calendar',   to: { name: 'games' } },
  { label: 'Scoreboard', icon: 'pi pi-calendar',   to: { name: 'games' } },
  { label: 'Standings',  icon: 'pi pi-globe',      to: { name: 'standings'} },
  { label: 'Stats',      icon: 'pi pi-chart-line', },
  { label: 'Settings',   icon: 'pi pi-cog',        to: { name: 'settings' } },
])

// Dark mode toggle: syncs .dark-mode on <html> with the switch
const isDark = ref<boolean>(document.documentElement.classList.contains('dark-mode'))
watch(isDark, (val) => {
  document.documentElement.classList.toggle('dark-mode', val)
})
</script>
