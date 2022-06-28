#!/usr/bin/env bash

while inotifywait -r -e modify,create,delete,move triplehop_frontend overrides; do
    triplehop_frontend/override.sh -u
done
