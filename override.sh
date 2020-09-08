#!/usr/bin/env bash

declare -a paths=(
    'assets'
    'components'
    'layouts'
    'middleware'
    'pages'
    'plugins'
    'static'
    'store'
    'test'
    '.babelrc'
    '.eslintrc.js'
    'jest.config.js'
    'nuxt.config.dev.js'
    'nuxt.config.js'
    'nuxt.config.qas.js'
)

for path in "${paths[@]}"; do
    if test -d "crdb_frontend/$path"; then
        cp -ruTv "crdb_frontend/$path" "$path"
    fi
    if test -f "crdb_frontend/$path"; then
        cp -uTv "crdb_frontend/$path" "$path"
    fi
    if test -d "overrides/$path"; then
        cp -ruTv "overrides/$path" "$path"
    fi
    if test -f "overrides/$path"; then
        cp -uTv "overrides/$path" "$path"
    fi
done
