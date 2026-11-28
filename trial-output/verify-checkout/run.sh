#!/bin/sh
set -eu
exec /usr/bin/python3 -I "$(dirname "$0")/drive.py"
