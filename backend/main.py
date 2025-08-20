from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="LandHub API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174", "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "LandHub API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "API is working"}

@app.get("/api/plots")
async def get_plots():
    return {
        "plots": [
            {
                "id": "1",
                "title": "Sample Plot",
                "description": "A sample plot for testing",
                "area_sqm": 1000,
                "price": 50000000,
                "status": "available",
                "usage_type": "residential",
                "coordinates": [-6.8, 39.25]
            }
        ]
    }
