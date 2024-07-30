<template>
    <!-- <Toast /> -->
    <router-view></router-view>
    <AuthPage />
</template>

<script>
import AuthPage from "./components/AuthPage.vue"
import { useToast } from "primevue/usetoast";

export default {
  setup() {
    const toast = useToast();

    const showMessage = (message, detail) => {
      if (message === 'success') {
        toast.add({ severity: 'success', summary: 'Success Message', detail, life: 3000 });
      } else if (message === 'error') {
        toast.add({ severity: 'error', summary: 'Error Message', detail, life: 3000 });
      }
    };

    return {
      showMessage
    };
  }
};
</script>