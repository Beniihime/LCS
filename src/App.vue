<template>
  <div id="app">
    <Toast />
    <router-view @route-changed="showMessage" />
  </div>
</template>

<script>
import { useToast } from "primevue/usetoast";

export default {
  setup() {
    const toast = useToast();

    const showMessage = (message, detail) => {
      if (message === 'success') {
        toast.add({ severity: 'success', summary: 'Успешно', detail, life: 3000 });
      } else if (message === 'error') {
        toast.add({ severity: 'error', summary: 'Ошибка', detail, life: 3000 });
      }
    };

    return {
      showMessage
    };
  }
};
</script>