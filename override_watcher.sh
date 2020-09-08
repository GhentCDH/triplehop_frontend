#!/usr/bin/env bash

while inotifywait -r -e modify,create,delete,move crdb_frontend/assets overrides/assets; do
    crdb_frontend/override.sh -u
done
