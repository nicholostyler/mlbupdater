<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import { fetchActiveTeams } from '@/services/mlb';
import { useTeam } from '@/composables/useTeam';

const { favorite, setFavorite } = useTeam();
const teams = ref<any[]>([]);
const loading = ref(true);
const selected = ref<any>(null);

onMounted(async () => {
  const list = await fetchActiveTeams();
  teams.value = list
    .map(t => ({ id: t.id, name: `${t.name} (${t.abbreviation})`, abbreviation: t.abbreviation }))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (favorite.value) {
    selected.value = teams.value.find(t => t.id === favorite.value!.id) ?? null;
  }
  loading.value = false;
});

function save() {
  if (!selected.value) return;
  setFavorite({
    id: selected.value.id,
    name: selected.value.name.replace(/\s\([A-Z]+\)$/, ''),
    abbreviation: selected.value.abbreviation
  });
}
</script>

<template>
  <Card>
    <template #title>Settings</template>
    <template #content>
      <div class="flex flex-col gap-3 max-w-md">
        <label class="text-sm">Favorite Team</label>
        <Dropdown
          :options="teams"
          optionLabel="name"
          :loading="loading"
          placeholder="Select a team"
          v-model="selected"
          class="w-full"
          filter
        />
        <Button label="Save" icon="pi pi-save" @click="save" :disabled="!selected" />
        <small class="opacity-70">Saved to localStorage.</small>
      </div>
    </template>
  </Card>
</template>

<style scoped>

</style>
