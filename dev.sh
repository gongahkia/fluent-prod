#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting big-livepeek in dev mode...${NC}\n"

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${RED}Shutting down servers...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${GREEN}Starting backend server...${NC}"
cd backend && npm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 3

# Check if backend is responding
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready!${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo -e "${YELLOW}  Waiting... (${RETRY_COUNT}/${MAX_RETRIES})${NC}"
        sleep 1
    else
        echo -e "${RED}✗ Backend failed to start after ${MAX_RETRIES} seconds${NC}"
        echo -e "${RED}  Please check backend logs for errors${NC}"
        cleanup
    fi
done

# Start frontend with dev mode flag
echo -e "${GREEN}Starting frontend server...${NC}"
cd "$(dirname "$0")" && pnpm sync-cache && VITE_USE_LOCAL_API=true pnpm dev &
FRONTEND_PID=$!

echo -e "\n${BLUE}Both servers are running!${NC}"
echo -e "${GREEN}Frontend:${NC} http://localhost:5173 (Vite)"
echo -e "${GREEN}Backend:${NC}  http://localhost:3001"
echo -e "\n${YELLOW}Tip: Wait a few seconds for the frontend to compile before opening the browser${NC}"
echo -e "${RED}Press Ctrl+C to stop all servers${NC}\n"

# Wait for both processes
wait
