import socket
import uvicorn
import logging
import sys
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from seed import seed


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


def setup_logging():
    log_handlers = []

    if getattr(sys, "frozen", False):
        log_dir = Path(os.environ["KASAIO_DATA_DIR"]) / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_handlers.append(logging.FileHandler(log_dir / "backend.log", encoding="utf-8"))
    else:
        log_handlers.append(logging.StreamHandler(sys.stderr))

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=log_handlers,
    )

    def handle_exception(exc_type, exc_value, exc_traceback):
        logging.critical("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))

    sys.excepthook = handle_exception


@asynccontextmanager
async def lifespan(app: FastAPI):
    from database import engine, Base
    import models.category  # noqa: F401
    import models.transaction  # noqa: F401
    import models.holding  # noqa: F401
    import models.investment_transaction  # noqa: F401
    import models.asset_price  # noqa: F401
    import models.asset  # noqa: F401

    await seed()

    yield


app = FastAPI(
    title="Kasaio API",
    version="0.1.0",
    lifespan=lifespan,
)

logger = logging.getLogger("kasaio")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://tauri.localhost", "tauri://localhost", "http://localhost:1420"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers.category_router import router as category_router
from routers.transaction_router import router as transaction_router
from routers.holding_router import router as holding_router
from routers.investment_transaction_router import router as investment_transaction_router
from routers.asset_price_router import router as asset_price_router
from routers.asset_router import router as asset_router
from routers.exchange_rate_router import router as exchange_rate_router
from routers.portfolio_router import router as portfolio_router

app.include_router(category_router)
app.include_router(transaction_router)
app.include_router(holding_router)
app.include_router(investment_transaction_router)
app.include_router(exchange_rate_router)
app.include_router(asset_price_router)
app.include_router(asset_router)
app.include_router(portfolio_router)


@app.get("/health") # DO NOT CHANGE THIS ENDPOINT, IT IS USED FOR HEALTH CHECKS
async def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    setup_logging()
    
    port = find_free_port()
    print(f"KASAIO_API_PORT={port}", flush=True)

    is_dev = not getattr(sys, "frozen", False)
    uvicorn.run(
        "main:app" if is_dev else app,
        host="127.0.0.1",
        port=port,
        access_log=False,
        reload=is_dev
    )