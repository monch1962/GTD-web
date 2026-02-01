#!/bin/bash
# Script to add eslint-disable comments for any type warnings

FILE=$1
LINE=$2

# Read the line from the file
content=$(sed -n "${LINE}p" "$FILE")

# Check if the line already has an eslint-disable comment
if echo "$content" | grep -q "eslint-disable"; then
    echo "Line $LINE already has eslint-disable comment"
    exit 0
fi

# Add eslint-disable comment before the line
sed -i "${LINE}s/^/\/\/ eslint-disable-next-line @typescript-eslint\/no-explicit-any\n/" "$FILE"
echo "Added eslint-disable comment to $FILE line $LINE"
