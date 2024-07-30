<script setup>
import { ref } from "vue";

const selectedLanguage = ref();
const languages = ref([
    { name: 'English', code: 'en'},
    { name: 'Русский', code: 'ru' }
]);
</script>

<template>
    <div class="d-flex gap-3 align-items-center">
        <i class="bi bi-globe2"></i>
        <Select v-model="selectedLanguage" :options="languages" optionLabel="name" class="drop rounded-3" placeholder="Выберите язык"/>
    </div>
</template>

<script>
import Select from 'primevue/select';

export default {
    name: "LanguageSwitcher",
    components: {
        Select,
    }
}
</script>

<style scoped>
.drop {
    width: 190px;
}
.bi {
    font-size: 2.5rem;
    color: var(--p-blue-500);
}
</style>