#!/usr/bin/env bash

update_flag=''

while getopts u option
do
    case "${option}" in
    u) update_flag='u'
    esac
done

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
    if test -d "triplehop_frontend/$path"; then
        cp -rTv"$update_flag" "triplehop_frontend/$path" "$path"
    fi
    if test -f "triplehop_frontend/$path"; then
        cp -Tv"$update_flag" "triplehop_frontend/$path" "$path"
    fi
    if test -d "overrides/$path"; then
        cp -rTv"$update_flag" "overrides/$path" "$path"
    fi
    if test -f "overrides/$path"; then
        cp -Tv"$update_flag" "overrides/$path" "$path"
    fi
done
