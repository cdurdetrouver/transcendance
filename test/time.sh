#!/bin/bash

# Base URL of the website
BASE_URL="https://localhost:5500"

# List of routes to test
ROUTES=(
  "/"
  "/about"
  "/test"
  "/pong"
)

# Function to test a single route
test_route() {
  local route=$1
  local url="${BASE_URL}${route}"

  # Make a request and measure the time taken
  START_TIME=$(date +%s%N)
  curl -s -o /dev/null $url
  END_TIME=$(date +%s%N)

  # Calculate the duration in milliseconds
  DURATION=$(( (END_TIME - START_TIME) / 1000000 ))

  # Print the response time
  echo "Response time for ${route} : ${DURATION} ms"

  # Check if the duration is greater than 1000 milliseconds (1 second)
  if [ $DURATION -gt 1000 ]; then
    echo "Assertion failed: Response time for ${route} is higher than 1 second."
    exit 1
  fi
}

# Loop through each route and test it
for route in "${ROUTES[@]}"; do
  test_route $route
done
