export default async function ({ $axios, $auth }) {
  if ($auth.loggedIn && ($auth.user == null || Object.keys($auth.user).length === 0)) {
    try {
      const response = await $axios.get('/auth/user')
      $auth.setUser(response.data)
    } catch (error) {
      $auth.logout()
    }
  }
}
