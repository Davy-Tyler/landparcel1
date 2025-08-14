# Scalable Real Estate Platform

A comprehensive real estate platform for Tanzania built with React (frontend) and FastAPI (backend).

## Features

- **User Management**: Registration, authentication, role-based access control
- **Plot Management**: Browse, search, and manage land plots with geospatial data
- **Interactive Maps**: View plots on interactive maps using Leaflet
- **Admin Panel**: Comprehensive admin interface for managing plots, orders, and users
- **Cart System**: Add plots to cart and create purchase orders
- **Location Hierarchy**: Organized by regions, districts, and councils

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Maps**: React Leaflet with OpenStreetMap
- **State Management**: React Context + Custom Hooks
- **Build Tool**: Vite

### Backend (FastAPI + Python)
- **Framework**: FastAPI
- **Database**: PostgreSQL with PostGIS extension
- **ORM**: SQLAlchemy with GeoAlchemy2
- **Authentication**: JWT tokens
- **API Documentation**: Automatic OpenAPI/Swagger docs

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL with PostGIS extension

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`

4. Start development server:
```bash
npm run dev
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create environment file:
```bash
cp .env.example .env
```

5. Update database URL and other settings in `.env`

6. Create initial admin user:
```bash
python scripts/create_admin.py
```

7. Start the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` with documentation at `http://localhost:8000/docs`

## Database Schema

The platform uses a normalized database schema with the following main entities:

- **Users**: User accounts with role-based access
- **Regions/Districts/Councils**: Hierarchical location data for Tanzania
- **Plots**: Land plots with geospatial data and business information
- **Orders**: Purchase orders linking users and plots

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile

### Plots
- `GET /api/plots` - List plots with filtering
- `GET /api/plots/{id}` - Get plot details
- `POST /api/plots` - Create new plot (admin only)
- `PUT /api/plots/{id}` - Update plot (admin only)

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create new order
- `PUT /api/orders/{id}` - Update order status (admin only)

### Locations
- `GET /api/plots/locations/regions` - List regions
- `GET /api/plots/locations/districts` - List districts
- `GET /api/plots/locations/councils` - List councils

## Deployment

### Frontend Deployment
The frontend can be deployed to any static hosting service:

```bash
npm run build
```

Deploy the `dist` folder to services like Vercel, Netlify, or AWS S3.

### Backend Deployment
The backend can be containerized and deployed to cloud services:

```bash
docker build -t real-estate-api .
docker run -p 8000:8000 real-estate-api
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.