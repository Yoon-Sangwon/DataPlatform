# AXD (Advanced Data Platform) Project Context

## Project Overview
**AXD** is a streamlined enterprise-grade data platform prototype. It uses a modern full-stack architecture optimized for rapid development and clear separation of concerns.

### Core Stack
*   **Backend:** FastAPI (Python 3.9+)
*   **Frontend:** React (Vite, TypeScript, Tailwind CSS)
*   **Database:** MariaDB 10.11

## Directory Structure
*   **`axd-backend/`**: The heart of the application.
    *   `app/`: FastAPI source code using a flat, functional structure.
        *   `api/v1/`: API endpoints (`assets`, `system`, `admin`).
        *   `models/`: Database schemas (SQLAlchemy).
        *   `schemas/`: Data validation models (Pydantic).
        *   `crud/`: Reusable database operations.
    *   `docker-compose.yml`: Main orchestration file for both DB and Backend.
*   **`axd-front/`**: Modern React frontend.
    *   `src/`: Organized by components, hooks, and contexts.
    *   `env/`: Environment-specific configurations.

## Running the Project

### 1. Backend & Database (Required First)
Everything is managed via Docker from the `axd-backend` directory.
```bash
cd axd-backend
docker-compose up --build -d
```
*   **API Docs**: `http://localhost:8000/docs`
*   **Database**: `localhost:13306` (axd_user / axd_password)

### 2. Frontend
```bash
cd axd-front
pnpm install
pnpm start:LOCAL
```
*   **URL**: `http://localhost:12083`

## Development Guidelines
*   **Data Init**: After the first run, go to **Admin Dashboard > Data Initialization** to seed the database.
*   **Simplicity First**: We prefer a flat directory structure under `app/` over complex layered architectures for this prototype.
*   **State Management**: Uses TanStack Query for server data and Zustand/MobX for UI state.