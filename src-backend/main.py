import socket
import uvicorn
import logging
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]

app = FastAPI(
    title="Kasaio API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.StreamHandler(sys.stdout)],
)

# --- Include routers ---
from routers.categoies_router import router as categories_router
from routers.transactions_router import router as transactions_router
app.include_router(categories_router)
app.include_router(transactions_router)


# --- Health check ---
@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    port = find_free_port()
    print(f"KASAIO_API_PORT={port}", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=port, access_log=False)