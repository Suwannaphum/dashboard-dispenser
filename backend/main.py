from api.routes import router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from websocket.routes import router as websocket_router

app = FastAPI(title="Industrial Fuel Dashboard Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)
app.include_router(websocket_router)
