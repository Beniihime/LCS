<template>
    <div class="app-layout">
      <SideBar v-if="isAuthenticated"/>
      <div class="content">
        <router-view></router-view>
      </div>
    </div>
</template>

<script>
import SideBar from '@/components/SideBar.vue';
import { isAuthenticated } from "@/utils/auth";

export default {
  name: "Home",
  components: {
    SideBar,
  },
  computed: {
    isAuthenticated() {
      return isAuthenticated();
    }
  },
  props: {
    message: {
      type: String,
      default: ''
    },
    detail: {
      type: String,
      default: ''
    }
  },
  watch: {
    $route(newRoute) {
      if (newRoute.query.message) {
        this.$emit('route-changed', newRoute.query.message, newRoute.query.detail);
      }
    }
  },
  mounted() {
    if (this.$route.query.message) {
      this.$emit('route-changed', this.$route.query.message, this.$route.query.detail);
    }
  }
};
</script>

<style scoped>
.app-layout {
  display: flex;
}
.content {
  flex-grow: 1;
}
</style>