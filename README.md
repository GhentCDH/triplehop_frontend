# Front-end for TripleHop

## Prerequisites

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

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
