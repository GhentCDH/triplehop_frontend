export default async function ({ $axios, $auth }) {
  if ($auth.loggedIn && ($auth.user == null || Object.keys($auth.user).length === 0)) {
    const response = await $axios.get('/auth/user')
    if (response.status !== 200) {
      throw new Error('Could not get user data')
    }
    $auth.setUser(response.data)
  }
}
