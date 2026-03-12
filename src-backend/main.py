import socket
import uvicorn
import logging
import sys
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]

def setup_logging():
    if not getattr(sys, "frozen", False):
        return
    
    log_dir = Path(os.environ["KASAIO_DATA_DIR"]) / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[
            logging.FileHandler(log_dir / "backend.log", encoding="utf-8"),
        ]
    )

    def handle_exception(exc_type, exc_value, exc_traceback):
        logging.critical("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))

    sys.excepthook = handle_exception


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all DB tables on startup if they don't exist yet."""
    from database import engine, Base
    import models.category  # noqa: F401 — registers the model
    import models.transaction  # noqa: F401 — registers the model

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Kasaio API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://tauri.localhost", "tauri://localhost", "http://localhost:1420"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include routers ---
from routers.categories_router import router as categories_router
from routers.transactions_router import router as transactions_router
app.include_router(categories_router)
app.include_router(transactions_router)


# --- Health check ---
@app.get("/health")
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    setup_logging()
    port = find_free_port()
    print(f"KASAIO_API_PORT={port}", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=port, access_log=False)
