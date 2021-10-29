<template>
  <div>
    <b-toast
      v-for="(notification, index) in notifications"
      :key="index"
      auto-hide-delay="3000"
      :title="notification.title"
      :variant="notification.variant"
      :visible="true"
      @hidden="remove_notification(index)"
    >
      {{ notification.message }}
    </b-toast>
  </div>
</template>
<script>
export default {
  computed: {
    notifications () {
      return this.$store.state.notifications.notifications
    }
  },
  methods: {
    remove_notification (index) {
      this.$store.dispatch('notifications/remove', index)
    }
  }
}
</script>
