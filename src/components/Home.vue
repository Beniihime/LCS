<template>
    <div>
        Home
    </div>
</template>

<script>
export default {
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
    message(newMessage, oldMessage) {
      if (newMessage) {
        this.$emit('route-changed', newMessage, this.detail);
      }
    }
  },
  mounted() {
    if (this.message) {
      this.$emit('route-changed', this.message, this.detail);
    }
  }
};
</script>