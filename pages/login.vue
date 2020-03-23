<template>
  <div>
    <h2 class="text-center">
      Login
    </h2>
    <b-btn
      variant="primary"
      block
      @click="login"
    >
      Login
    </b-btn>
  </div>
</template>
<script>
export default {
  // middleware: ['auth'],
  data () {
    return {
      username: '',
      password: '123',
      error: null
    }
  },
  computed: {
    redirect () {
      return (
        this.$route.query.redirect &&
        decodeURIComponent(this.$route.query.redirect)
      )
    },
    isCallback () {
      return Boolean(this.$route.query.callback)
    }
  },
  methods: {
    async login () {
      this.error = null
      const formData = new FormData()
      // TODO: use real form data
      formData.append('username', 'pieterjan.depotter@ugent.be')
      formData.append('password', 'crdb')
      await this.$auth.loginWith('local', {
        data: formData
      })
        .catch((e) => {
          // TODO: set error in message system
          this.error = e + ''
        })
      // TODO: redirect to original restricted page or homepage
    }
  }
}
</script>
