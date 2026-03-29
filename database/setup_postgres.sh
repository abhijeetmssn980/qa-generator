#!/bin/bash

# QA Generator - PostgreSQL Database Setup Helper Script
# This script automates database creation and setup

set -e

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}QA Generator - PostgreSQL Setup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL first:"
    echo "  macOS: brew install postgresql@15"
    echo "  Linux: sudo apt-get install postgresql"
    echo "  Windows: https://www.postgresql.org/download/windows/"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL found${NC}"
echo ""

# Get PostgreSQL connection details
read -p "Enter PostgreSQL host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter PostgreSQL port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Enter PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Enter PostgreSQL password: " DB_PASSWORD
echo ""

read -p "Enter database name (default: qa_generator): " DB_NAME
DB_NAME=${DB_NAME:-qa_generator}

echo ""
echo -e "${BLUE}Database Details:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Create database
echo -e "${BLUE}Creating database...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

echo -e "${GREEN}✓ Database created/verified${NC}"
echo ""

# Run setup script
echo -e "${BLUE}Running setup script...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f postgres_setup.sql

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Update your .env.local with database connection:"
echo "   DATABASE_URL=postgresql://$DB_USER:PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "2. Test connection with:"
echo "   PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
echo ""
echo "3. View sample data:"
echo "   SELECT * FROM products;"
echo ""
