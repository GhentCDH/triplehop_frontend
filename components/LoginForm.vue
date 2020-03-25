<template>
  <b-row class="justify-content-md-center">
    <b-col
      md="6"
      lg="4"
    >
      <b-overlay :show="busy">
        <b-card class="bg-light border-0">
          <h2 class="text-center mb-4">
            Login
          </h2>
          <form @keydown.enter="login()">
            <b-form-group>
              <b-input-group>
                <b-input-group-prepend>
                  <b-input-group-text class="border-0" :class="validateBG('username')">
                    <b-icon icon="envelope-fill" variant="light" />
                  </b-input-group-text>
                </b-input-group-prepend>
                <b-form-input
                  v-model="$v.form.username.$model"
                  class="border-0"
                  placeholder="example@domain.com"
                  type="email"
                  aria-label="Username (email)"
                  :autofocus="true"
                  :state="validateState('username')"
                />
                <b-form-invalid-feedback
                  v-if="!$v.form.username.required"
                >
                  This field is required.
                </b-form-invalid-feedback>
                <b-form-invalid-feedback
                  v-if="!$v.form.username.email"
                >
                  This should be a valid email address.
                </b-form-invalid-feedback>
              </b-input-group>
            </b-form-group>
            <b-form-group>
              <b-input-group>
                <b-input-group-prepend>
                  <b-input-group-text class="border-0" :class="validateBG('password')">
                    <b-icon icon="lock-fill" variant="light" />
                  </b-input-group-text>
                </b-input-group-prepend>
                <b-input
                  v-model="$v.form.password.$model"
                  class="border-0"
                  type="password"
                  aria-label="Password"
                  :state="validateState('password')"
                />
                <b-form-invalid-feedback
                  v-if="!$v.form.password.required"
                >
                  This field is required.
                </b-form-invalid-feedback>
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
      </b-overlay>
    </b-col>
  </b-row>
</template>

<script>
import { validationMixin } from 'vuelidate'
import { required, email } from 'vuelidate/lib/validators'

export default {
  mixins: [validationMixin],
  props: {
    busy: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      form: {
        username: '',
        password: ''
      }
    }
  },
  validations: {
    form: {
      username: {
        required,
        email
      },
      password: {
        required
      }
    }
  },
  methods: {
    login () {
      this.$v.form.$touch()
      if (this.$v.form.$anyError) {
        return
      }
      this.$emit('login', this.form)
    },
    validateState (formElement) {
      const { $dirty, $error } = this.$v.form[formElement]
      return $dirty ? !$error : null
    },
    validateBG (formElement) {
      const state = this.validateState(formElement)
      if (state === null) {
        return 'bg-primary'
      }
      return state ? 'bg-success' : 'bg-danger'
    }
  }
}
</script>
