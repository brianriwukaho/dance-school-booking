#!/bin/bash
export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"

if ! command -v java &> /dev/null; then
    echo "Error: java not found in PATH"
    exit 1
fi

echo "Using Java: $(which java)"
java -version

exec pnpm exec serverless offline start
