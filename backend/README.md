# CVC Digital Twin Simulator - Backend

This is the Python FastAPI backend for the CVC Digital Twin Simulator.

## Requirements
- Python 3.9+
- PostgreSQL (for local database persistence)

## Getting Started

Follow these steps to run the backend locally.

### 1. PostgreSQL Setup

This backend uses PostgreSQL to store training sessions and trajectory records.

1. Download and install PostgreSQL from the [official website](https://www.postgresql.org/download/).
2. Start the PostgreSQL service on your machine.
3. Open a terminal and run `psql -U postgres` (you may need to provide the password you set during installation).
4. Create the simulator database:
   ```sql
   CREATE DATABASE cvc_simulator;
   ```
5. Exit `psql` by typing `\q`.

### 2. Configure Environment Variables

Create a `.env` file in the `backend` directory (you can copy `.env.example`):
```powershell
cp .env.example .env
```
Ensure the `DATABASE_URL` matches your local PostgreSQL credentials:
`DATABASE_URL=postgresql://postgres:password@localhost:5432/cvc_simulator`

### 3. Create a virtual environment

Navigate to the `backend` directory and create a Python virtual environment:

```powershell
cd backend
python -m venv venv
```

Activate the virtual environment:
- On Windows: `venv\Scripts\activate`
- On macOS/Linux: `source venv/bin/activate`

### 4. Install dependencies

With the virtual environment activated, install the required packages:

```powershell
pip install -r requirements.txt
```

### 5. Start FastAPI

Run the development server using `uvicorn`:

```powershell
uvicorn app.main:app --reload
```

The API will automatically create the required database tables on startup. It will be accessible at `http://127.0.0.1:8000`.

### 6. Test /api/health

You can test if the server is running correctly by sending a request to the health endpoint. In a new terminal, run:

```powershell
curl http://127.0.0.1:8000/api/health
```
