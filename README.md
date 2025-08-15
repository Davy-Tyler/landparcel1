# Scalable Real Estate Platform

A comprehensive hybrid land management platform for Tanzania built with React + TypeScript (frontend), FastAPI (backend), and advanced geospatial capabilities.

## Features

### Core Features
- **Advanced User Management**: JWT-based authentication, role-based access control (Master Admin, Admin, Partner, User)
- **Geospatial Plot Management**: Full CRUD operations with PostGIS geometry support
- **Interactive Maps**: Advanced Leaflet maps with drawing tools, area search, and radius search
- **Shapefile Processing**: Upload and process .shp, .dbf, .prj files with background processing
- **Real-time Updates**: WebSocket connections for live plot updates and notifications
- **Cart System**: Time-limited plot reservations with automatic expiration
- **Location Hierarchy**: JSONB-based hierarchical location data (Region → District → Council)

### Advanced Features
- **Background Processing**: Celery-based async tasks for shapefile processing and geo calculations
- **Caching Layer**: Redis for performance optimization and real-time messaging
- **Concurrency Support**: Designed for 100k+ concurrent users
- **Hybrid Architecture**: FastAPI core + optional Node.js microservices for real-time features
- **Production-Ready**: Docker containerization, proper error handling, and monitoring

## Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Maps**: Advanced Leaflet integration with drawing tools and geospatial search
- **State Management**: React Context + Custom Hooks
- **Real-time**: WebSocket integration for live updates
- **Build Tool**: Vite

### Backend (FastAPI + Python)
- **Framework**: FastAPI with async/await support
- **Database**: PostgreSQL with PostGIS extension
- **ORM**: SQLAlchemy with GeoAlchemy2 for geospatial operations
- **Authentication**: JWT tokens with role-based permissions
- **Background Tasks**: Celery with Redis broker
- **Caching**: Redis for performance and real-time messaging
- **File Processing**: Fiona and Shapely for shapefile processing
- **API Documentation**: Automatic OpenAPI/Swagger docs

### Infrastructure
- **Containerization**: Docker and Docker Compose
- **Message Queue**: Redis for Celery and WebSocket messaging
- **File Storage**: Local storage with configurable upload directory
- **Monitoring**: Comprehensive logging and error tracking

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker and Docker Compose (recommended)
- PostgreSQL with PostGIS extension (if not using Docker)
- Redis (if not using Docker)

### Using Docker (Recommended)

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Start all services with Docker Compose:
```bash
docker-compose up -d
```

This will start:
- FastAPI backend on port 8000
- PostgreSQL with PostGIS on port 5432
- Redis on port 6379
- Celery worker for background tasks

3. Start the frontend:
```bash
cd ..
npm install
npm run dev
```

### Manual Setup

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/api/ws
```

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

5. Update environment variables in `.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/landhub
REDIS_URL=redis://localhost:6379
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

6. Set up PostgreSQL database with PostGIS:
```sql
CREATE DATABASE landhub;
\c landhub;
CREATE EXTENSION postgis;
CREATE EXTENSION "uuid-ossp";
```

7. Run database migrations (if using Supabase, run the migration file)

8. Start Redis server:
```bash
redis-server
```

9. Start Celery worker (in a separate terminal):
```bash
celery -A app.core.celery_app worker --loglevel=info
```

10. Start the FastAPI server:
```bash
uvicorn app.main:app --reload
```

### Create Initial Admin User

If not using Docker, create an admin user:
```bash
python scripts/create_admin.py
```

Or manually insert into database:
```sql
INSERT INTO users (first_name, last_name, email, hashed_password, role, is_active)
VALUES ('Admin', 'User', 'admin@landhub.com', '$2b$12$...', 'master_admin', true);
```

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Key Features Guide

### Shapefile Upload
1. Login as admin user
2. Go to Admin Panel → Plots
3. Click "Upload Shapefile"
4. Upload .shp, .dbf, and optionally .prj files
5. Monitor processing status in real-time
6. View created plots on the map

### Advanced Map Features
1. **Drawing Tool**: Click the filter icon to draw search areas
2. **Radius Search**: Right-click on map to search nearby plots
3. **Layer Control**: Switch between street map and satellite view
4. **Plot Visualization**: Color-coded plots by status with detailed popups

### Real-time Updates
- WebSocket connection provides live updates for plot changes
- Notifications appear automatically for relevant events
- Background task status updates in real-time

### Geospatial Queries
- Find plots within drawn polygons
- Search plots within radius of a point
- Calculate plot statistics and analytics
- Validate geometry data

## Development

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
npm test
```

### Code Structure

```
├── backend/
│   ├── app/
│   │   ├── api/endpoints/     # API route handlers
│   │   ├── core/             # Configuration and utilities
│   │   ├── crud/             # Database operations
│   │   ├── db/               # Database models and session
│   │   ├── schemas/          # Pydantic schemas
│   │   └── tasks/            # Celery background tasks
│   ├── docker-compose.yml    # Development environment
│   └── requirements.txt      # Python dependencies
├── src/
│   ├── components/           # React components
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom hooks
│   ├── pages/               # Page components
│   ├── services/            # API services
│   └── utils/               # Utility functions
└── supabase/migrations/     # Database migrations
```

## Database Schema

### Core Tables
- **users**: User accounts with role-based access (master_admin, admin, partner, user)
- **locations**: JSONB hierarchical location data for Tanzania
- **plots**: Land plots with PostGIS geometry and business data
- **orders**: Purchase orders linking users and plots

### Geospatial Features
- PostGIS geometry storage for precise plot boundaries
- Spatial indexing for fast location-based queries
- Support for various coordinate systems and projections
- Geometry validation and optimization

## API Endpoints

### Core Endpoints
- **Authentication**: `/api/auth/*` - Login, registration, token management
- **Users**: `/api/users/*` - User management and profiles
- **Plots**: `/api/plots/*` - Plot CRUD operations with filtering
- **Orders**: `/api/orders/*` - Order management and status updates
- **Locations**: `/api/plots/locations/*` - Hierarchical location data

### Geospatial Endpoints
- **Shapefile Upload**: `POST /api/geo/shapefile/upload` - Process shapefile uploads
- **Area Search**: `POST /api/geo/plots-in-area` - Find plots within polygon
- **Radius Search**: `GET /api/geo/plots-near-point` - Find plots within radius
- **Statistics**: `GET /api/geo/statistics` - Geospatial analytics
- **Validation**: `POST /api/geo/validate-geometry` - Validate GeoJSON geometry

### Real-time Endpoints
- **WebSocket**: `/api/ws` - General real-time updates
- **Plot Updates**: `/api/ws/plots` - Plot-specific real-time updates

## Performance & Scalability

### Backend Optimizations
- Async FastAPI with connection pooling
- Redis caching for frequently accessed data
- Background task processing with Celery
- Spatial indexing for geospatial queries
- Connection pooling and query optimization

### Frontend Optimizations
- Component lazy loading
- Efficient state management
- WebSocket connection management
- Map rendering optimization
- Image lazy loading and caching

### Deployment Considerations
- Horizontal scaling with multiple FastAPI workers
- Redis cluster for high availability
- PostgreSQL read replicas for query scaling
- CDN for static assets
- Load balancing and health checks

## Security

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- SQL injection prevention with parameterized queries
- File upload validation and sanitization
- CORS configuration for cross-origin requests
- Rate limiting and request validation

## Monitoring & Logging

- Comprehensive application logging
- Database query monitoring
- Background task monitoring
- WebSocket connection tracking
- Error tracking and alerting
- Performance metrics collection

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Development Guidelines
- Follow TypeScript/Python type hints
- Add tests for new features
- Update documentation for API changes
- Follow existing code style and patterns
- Ensure all tests pass before submitting PR

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Ensure PostgreSQL is running with PostGIS extension
   - Check DATABASE_URL in environment variables
   - Verify database credentials and permissions

2. **Redis Connection Issues**
   - Ensure Redis server is running
   - Check REDIS_URL in environment variables
   - Verify Redis is accessible from the application

3. **Shapefile Upload Issues**
   - Ensure all required files (.shp, .dbf) are uploaded
   - Check file size limits (50MB default)
   - Verify Celery worker is running for background processing

4. **WebSocket Connection Issues**
   - Check WebSocket URL configuration
   - Verify CORS settings for WebSocket connections
   - Ensure proper authentication for WebSocket endpoints

5. **Map Display Issues**
   - Check if Leaflet CSS is properly loaded
   - Verify map container has proper dimensions
   - Check browser console for JavaScript errors

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page for known problems
- Review API documentation at `/docs` endpoint
- Check application logs for detailed error messages
- Ensure all environment variables are properly configured

## Roadmap

### Planned Features
- [ ] Mobile app with React Native
- [ ] Advanced analytics dashboard
- [ ] Integration with payment gateways
- [ ] Multi-language support expansion
- [ ] Advanced user permissions system
- [ ] Automated plot valuation
- [ ] Integration with government land registries
- [ ] Advanced reporting and export features

### Technical Improvements
- [ ] GraphQL API option
- [ ] Microservices architecture expansion
- [ ] Advanced caching strategies
- [ ] Machine learning for plot recommendations
- [ ] Blockchain integration for land ownership
- [ ] Advanced geospatial analysis tools

## License

This project is licensed under the MIT License.