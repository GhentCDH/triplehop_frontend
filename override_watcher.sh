#!/usr/bin/env bash

while inotifywait -r -e modify,create,delete,move crdb_frontend overrides; do
    crdb_frontend/override.sh -u
done
