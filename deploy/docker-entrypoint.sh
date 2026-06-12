#!/bin/sh
set -e

# Path to the config file in the container
# Usually served from the root of the web server
CONFIG_FILE="/usr/share/nginx/html/config.js"

echo "window.CONFIG = {" > $CONFIG_FILE

# List all VITE_ environment variables and convert them to window.CONFIG entries
# We iterate over all environment variables starting with VITE_
env | grep '^VITE_' | while read -r line; do
    key=$(echo $line | cut -d'=' -f1)
    # Get value, escaping single quotes for the JS string
    value=$(echo $line | cut -d'=' -f2- | sed "s/'/\\\\'/g")
    
    echo "  $key: '$value'," >> $CONFIG_FILE
done

echo "};" >> $CONFIG_FILE

echo "Configuration generated in $CONFIG_FILE:"
cat $CONFIG_FILE

# Execute the original command (usually nginx)
exec "$@"
