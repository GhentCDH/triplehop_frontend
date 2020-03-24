<template>
  <b-row class="justify-content-md-center">
    <b-col
      md="6"
      lg="4"
    >
      <b-card class="bg-light border-0">
        <h2 class="text-center mb-4">
          Login
        </h2>
        <form @keydown.enter="login()">
          <b-form-group>
            <b-input-group>
              <b-input-group-prepend>
                <b-input-group-text class="border-0 bg-primary">
                  <b-icon icon="envelope-fill" variant="light" />
                </b-input-group-text>
              </b-input-group-prepend>
              <b-form-input
                v-model="userInfo.username"
                class="border-0"
                placeholder="example@domain.com"
                type="email"
                aria-label="Username (email)"
              />
            </b-input-group>
          </b-form-group>
          <b-form-group>
            <b-input-group>
              <b-input-group-prepend>
                <b-input-group-text class="border-0 bg-primary">
                  <b-icon icon="lock-fill" variant="light" />
                </b-input-group-text>
              </b-input-group-prepend>
              <b-input
                v-model="userInfo.password"
                class="border-0"
                type="password"
                aria-label="Password"
              />
            </b-input-group>
          </b-form-group>
          <b-btn
            block
            class="mt-4"
            variant="primary"
            @click="login()"
          >
            Login
          </b-btn>
        </form>
      </b-card>
    </b-col>
  </b-row>
</template>

<script>
export default {
  data () {
    return {
      userInfo: {
        username: '',
        password: ''
      }
    }
  },
  methods: {
    login () {
      this.$emit('login', this.userInfo)
    }
  }
}
</script>
