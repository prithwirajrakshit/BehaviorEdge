from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from database import engine, Base
from routers import auth, trades, profile, coach, dashboard, rules
import os

Base.metadata.create_all(bind=engine)

os.makedirs("avatars", exist_ok=True)

app = FastAPI(
    title="BehaviorEdge API",
    description="AI-Based Behavioral Risk Regulation Platform for Traders",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://behavior-edge.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/avatars", StaticFiles(directory="avatars"), name="avatars")

app.include_router(auth.router)
app.include_router(trades.router)
app.include_router(profile.router)
app.include_router(coach.router)
app.include_router(dashboard.router)
app.include_router(rules.router)

@app.get("/")
def root():
    return {"message": "BehaviorEdge API is running"}
