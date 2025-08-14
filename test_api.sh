#!/bin/bash
echo "Testing API health..."
curl -s -X GET "http://localhost:8000/health"
echo
echo
echo "Testing plots endpoint..."
curl -s -X GET "http://localhost:8000/api/plots/?status=available" | head -c 200
echo "..."
