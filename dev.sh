#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

# Start frontend
echo -e "${GREEN}Starting frontend server...${NC}"
cd "$(dirname "$0")" && pnpm dev &
FRONTEND_PID=$!

echo -e "\n${BLUE}Both servers are running!${NC}"
echo -e "${GREEN}Frontend:${NC} http://localhost:5173 (Vite)"
echo -e "${GREEN}Backend:${NC}  http://localhost:3000 (or check backend logs)"
echo -e "\n${RED}Press Ctrl+C to stop all servers${NC}\n"

# Wait for both processes
wait
