from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="LandHub API", version="1.0.0")

# Configure CORS - this fixes the CORS error
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "LandHub API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "API is working"}

@app.get("/api/plots")
async def get_plots(status: str = None):
    sample_plots = [
        {
            "id": "1",
            "title": "Prime Commercial Plot - Msimbazi",
            "description": "Excellent commercial plot located in the heart of Msimbazi area",
            "area_sqm": 2500,
            "price": 450000000,
            "location": {
                "id": "1",
                "name": "Msimbazi, Kinondoni",
                "region": "Dar es Salaam",
                "district": "Kinondoni",
                "council": "Kinondoni Municipal",
                "coordinates": [-6.7924, 39.2083]
            },
            "usage_type": "commercial",
            "status": "available",
            "plot_number": "Plot No. 123, Block A",
            "coordinates": [-6.7924, 39.2083],
            "listed_at": "2024-01-15T10:00:00Z",
            "created_at": "2024-01-15T10:00:00Z",
            "updated_at": "2024-01-15T10:00:00Z"
        },
        {
            "id": "2",
            "title": "Residential Plot - Mikocheni",
            "description": "Beautiful residential plot in prestigious Mikocheni area",
            "area_sqm": 1800,
            "price": 320000000,
            "location": {
                "id": "2",
                "name": "Mikocheni, Kinondoni",
                "region": "Dar es Salaam",
                "district": "Kinondoni",
                "council": "Kinondoni Municipal",
                "coordinates": [-6.7733, 39.2297]
            },
            "usage_type": "residential",
            "status": "available",
            "plot_number": "Plot No. 456, Block B",
            "coordinates": [-6.7733, 39.2297],
            "listed_at": "2024-01-16T14:30:00Z",
            "created_at": "2024-01-16T14:30:00Z",
            "updated_at": "2024-01-16T14:30:00Z"
        },
        {
            "id": "3",
            "title": "Industrial Plot - Temeke",
            "description": "Large industrial plot in Temeke suitable for manufacturing",
            "area_sqm": 5000,
            "price": 280000000,
            "location": {
                "id": "3",
                "name": "Temeke Industrial Area",
                "region": "Dar es Salaam",
                "district": "Temeke",
                "council": "Temeke Municipal",
                "coordinates": [-6.8500, 39.2780]
            },
            "usage_type": "industrial",
            "status": "available",
            "plot_number": "Plot No. 789, Industrial Zone C",
            "coordinates": [-6.8500, 39.2780],
            "listed_at": "2024-01-17T09:15:00Z",
            "created_at": "2024-01-17T09:15:00Z",
            "updated_at": "2024-01-17T09:15:00Z"
        },
        {
            "id": "4",
            "title": "Beachfront Plot - Oyster Bay",
            "description": "Exclusive beachfront plot in upscale Oyster Bay area",
            "area_sqm": 3200,
            "price": 850000000,
            "location": {
                "id": "4",
                "name": "Oyster Bay, Kinondoni",
                "region": "Dar es Salaam",
                "district": "Kinondoni",
                "council": "Kinondoni Municipal",
                "coordinates": [-6.7580, 39.2891]
            },
            "usage_type": "residential",
            "status": "locked",
            "plot_number": "Plot No. 001, Beachfront Estate",
            "coordinates": [-6.7580, 39.2891],
            "listed_at": "2024-01-18T11:45:00Z",
            "created_at": "2024-01-18T11:45:00Z",
            "updated_at": "2024-01-18T11:45:00Z"
        },
        {
            "id": "5",
            "title": "Agricultural Plot - Mbagala",
            "description": "Spacious agricultural plot in Mbagala area",
            "area_sqm": 8000,
            "price": 180000000,
            "location": {
                "id": "5",
                "name": "Mbagala, Temeke",
                "region": "Dar es Salaam",
                "district": "Temeke",
                "council": "Temeke Municipal",
                "coordinates": [-6.8800, 39.3200]
            },
            "usage_type": "agricultural",
            "status": "available",
            "plot_number": "Plot No. 345, Agricultural Zone",
            "coordinates": [-6.8800, 39.3200],
            "listed_at": "2024-01-19T16:20:00Z",
            "created_at": "2024-01-19T16:20:00Z",
            "updated_at": "2024-01-19T16:20:00Z"
        },
        {
            "id": "6",
            "title": "Mixed-Use Plot - Posta",
            "description": "Strategic mixed-use plot in Posta area",
            "area_sqm": 3500,
            "price": 520000000,
            "location": {
                "id": "6",
                "name": "Posta, Ilala",
                "region": "Dar es Salaam",
                "district": "Ilala",
                "council": "Ilala Municipal",
                "coordinates": [-6.8147, 39.2794]
            },
            "usage_type": "commercial",
            "status": "available",
            "plot_number": "Plot No. 678, Mixed Zone",
            "coordinates": [-6.8147, 39.2794],
            "listed_at": "2024-01-20T08:30:00Z",
            "created_at": "2024-01-20T08:30:00Z",
            "updated_at": "2024-01-20T08:30:00Z"
        },
        {
            "id": "7",
            "title": "Residential Plot - Upanga",
            "description": "Prime residential plot in central Upanga",
            "area_sqm": 1200,
            "price": 380000000,
            "location": {
                "id": "7",
                "name": "Upanga, Ilala",
                "region": "Dar es Salaam",
                "district": "Ilala",
                "council": "Ilala Municipal",
                "coordinates": [-6.8086, 39.2625]
            },
            "usage_type": "residential",
            "status": "available",
            "plot_number": "Plot No. 234, Upanga West",
            "coordinates": [-6.8086, 39.2625],
            "listed_at": "2024-01-21T12:15:00Z",
            "created_at": "2024-01-21T12:15:00Z",
            "updated_at": "2024-01-21T12:15:00Z"
        },
        {
            "id": "8",
            "title": "Industrial Plot - Chang'ombe",
            "description": "Large industrial plot in Chang'ombe industrial area",
            "area_sqm": 7500,
            "price": 420000000,
            "location": {
                "id": "8",
                "name": "Chang'ombe, Temeke",
                "region": "Dar es Salaam",
                "district": "Temeke",
                "council": "Temeke Municipal",
                "coordinates": [-6.8700, 39.2650]
            },
            "usage_type": "industrial",
            "status": "available",
            "plot_number": "Plot No. 890, Industrial Block D",
            "coordinates": [-6.8700, 39.2650],
            "listed_at": "2024-01-22T15:45:00Z",
            "created_at": "2024-01-22T15:45:00Z",
            "updated_at": "2024-01-22T15:45:00Z"
        },
        {
            "id": "9",
            "title": "Luxury Residential - Msasani",
            "description": "Exclusive residential plot in upscale Msasani peninsula",
            "area_sqm": 2800,
            "price": 750000000,
            "location": {
                "id": "9",
                "name": "Msasani, Kinondoni",
                "region": "Dar es Salaam",
                "district": "Kinondoni",
                "council": "Kinondoni Municipal",
                "coordinates": [-6.7650, 39.2750]
            },
            "usage_type": "residential",
            "status": "locked",
            "plot_number": "Plot No. 567, Peninsula Estate",
            "coordinates": [-6.7650, 39.2750],
            "listed_at": "2024-01-23T10:20:00Z",
            "created_at": "2024-01-23T10:20:00Z",
            "updated_at": "2024-01-23T10:20:00Z"
        },
        {
            "id": "10",
            "title": "Commercial Plot - Kariakoo",
            "description": "Strategic commercial plot in bustling Kariakoo market area",
            "area_sqm": 1800,
            "price": 680000000,
            "location": {
                "id": "10",
                "name": "Kariakoo, Ilala",
                "region": "Dar es Salaam",
                "district": "Ilala",
                "council": "Ilala Municipal",
                "coordinates": [-6.8200, 39.2700]
            },
            "usage_type": "commercial",
            "status": "available",
            "plot_number": "Plot No. 123, Market Street",
            "coordinates": [-6.8200, 39.2700],
            "listed_at": "2024-01-24T14:00:00Z",
            "created_at": "2024-01-24T14:00:00Z",
            "updated_at": "2024-01-24T14:00:00Z"
        },
        {
            "id": "11",
            "title": "Agricultural Plot - Kimara",
            "description": "Fertile agricultural land in Kimara area",
            "area_sqm": 12000,
            "price": 240000000,
            "location": {
                "id": "11",
                "name": "Kimara, Kinondoni",
                "region": "Dar es Salaam",
                "district": "Kinondoni",
                "council": "Kinondoni Municipal",
                "coordinates": [-6.7200, 39.2100]
            },
            "usage_type": "agricultural",
            "status": "available",
            "plot_number": "Plot No. 456, Farm Zone A",
            "coordinates": [-6.7200, 39.2100],
            "listed_at": "2024-01-25T09:30:00Z",
            "created_at": "2024-01-25T09:30:00Z",
            "updated_at": "2024-01-25T09:30:00Z"
        },
        {
            "id": "12",
            "title": "Residential Plot - Mbezi",
            "description": "Modern residential plot in rapidly developing Mbezi area",
            "area_sqm": 2200,
            "price": 290000000,
            "location": {
                "id": "12",
                "name": "Mbezi, Kinondoni",
                "region": "Dar es Salaam",
                "district": "Kinondoni",
                "council": "Kinondoni Municipal",
                "coordinates": [-6.7300, 39.2400]
            },
            "usage_type": "residential",
            "status": "available",
            "plot_number": "Plot No. 789, Mbezi Beach",
            "coordinates": [-6.7300, 39.2400],
            "listed_at": "2024-01-26T11:45:00Z",
            "created_at": "2024-01-26T11:45:00Z",
            "updated_at": "2024-01-26T11:45:00Z"
        },
        {
            "id": "13",
            "title": "Commercial Plot - Sinza",
            "description": "Growing commercial area in Sinza",
            "area_sqm": 4000,
            "price": 580000000,
            "location": {
                "id": "13",
                "name": "Sinza, Kinondoni",
                "region": "Dar es Salaam",
                "district": "Kinondoni",
                "council": "Kinondoni Municipal",
                "coordinates": [-6.7800, 39.2200]
            },
            "usage_type": "commercial",
            "status": "available",
            "plot_number": "Plot No. 321, Commercial Hub",
            "coordinates": [-6.7800, 39.2200],
            "listed_at": "2024-01-27T16:10:00Z",
            "created_at": "2024-01-27T16:10:00Z",
            "updated_at": "2024-01-27T16:10:00Z"
        },
        {
            "id": "14",
            "title": "Industrial Plot - Kurasini",
            "description": "Strategic industrial plot near Kurasini port area",
            "area_sqm": 6000,
            "price": 480000000,
            "location": {
                "id": "14",
                "name": "Kurasini, Temeke",
                "region": "Dar es Salaam",
                "district": "Temeke",
                "council": "Temeke Municipal",
                "coordinates": [-6.8900, 39.2800]
            },
            "usage_type": "industrial",
            "status": "available",
            "plot_number": "Plot No. 654, Port Zone",
            "coordinates": [-6.8900, 39.2800],
            "listed_at": "2024-01-28T13:25:00Z",
            "created_at": "2024-01-28T13:25:00Z",
            "updated_at": "2024-01-28T13:25:00Z"
        },
        {
            "id": "15",
            "title": "Beachfront Plot - Kunduchi",
            "description": "Premium beachfront property in Kunduchi",
            "area_sqm": 5500,
            "price": 920000000,
            "location": {
                "id": "15",
                "name": "Kunduchi, Kinondoni",
                "region": "Dar es Salaam",
                "district": "Kinondoni",
                "council": "Kinondoni Municipal",
                "coordinates": [-6.6800, 39.2900]
            },
            "usage_type": "residential",
            "status": "available",
            "plot_number": "Plot No. 001, Beach Resort",
            "coordinates": [-6.6800, 39.2900],
            "listed_at": "2024-01-29T17:40:00Z",
            "created_at": "2024-01-29T17:40:00Z",
            "updated_at": "2024-01-29T17:40:00Z"
        }
    ]
    
    if status:
        return [plot for plot in sample_plots if plot["status"] == status]
    return sample_plots

@app.get("/api/plots/locations")
async def get_locations():
    return [
        {
            "id": "1",
            "name": "Kinondoni",
            "region": "Dar es Salaam",
            "district": "Kinondoni",
            "council": "Kinondoni Municipal"
        },
        {
            "id": "2", 
            "name": "Temeke",
            "region": "Dar es Salaam",
            "district": "Temeke",
            "council": "Temeke Municipal"
        }
    ]