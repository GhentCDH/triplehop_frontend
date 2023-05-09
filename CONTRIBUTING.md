# TripleHop Contributing Guide

We're really excited that you are interested in contributing to TripleHop. Please take a moment to read through our [Code of Conduct](CODE_OF_CONDUCT.md) first. All contributions (participation in discussions, issues, pull requests, ...) are welcome. Unfortunately, we cannot make commitments that issues will be resolved or pull requests will be merged swiftly, especially for new features.

Documentation is currently severely lacking. Please contact <https://github.com/pdpotter> to get started.

## Development set-up (based on a Debian Virtual Machine)

* Nodejs, npm and yarn

    ```sh
    curl -fsSL https://deb.nodesource.com/setup_14.x | sudo bash -
    sudo apt-get install -y nodejs
    sudo npm install --global yarn
    ```

## Build Setup

```sh
# install dependencies
$ yarn install

# serve with hot reload at virtual_network_ip:3000
$ HOST=`ip -f inet addr show eth1 | sed -En -e 's/.*inet ([0-9.]+).*/\1/p'` yarn dev
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
