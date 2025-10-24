#!/bin/bash

# Development extraction wrapper
# This script is a convenience wrapper for local development
# It calls the unified extract.sh script with 'development' environment

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Pass all arguments to the unified extraction script with 'development' environment
"$SCRIPT_DIR/extract.sh" development "$@"
