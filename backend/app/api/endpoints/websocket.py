from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import List, Dict, Any
import json
import asyncio
import logging
from datetime import datetime

from app.core.redis import redis_client
from app.api.deps import get_current_user_ws

router = APIRouter()
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if user_id:
            self.user_connections[user_id] = websocket
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, user_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.user_connections:
            websocket = self.user_connections[user_id]
            try:
                await websocket.send_text(message)
            except:
                # Connection might be closed
                self.disconnect(websocket, user_id)
    
    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    General WebSocket endpoint for real-time updates
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            if message_data.get('type') == 'ping':
                await websocket.send_text(json.dumps({
                    'type': 'pong',
                    'timestamp': datetime.utcnow().isoformat()
                }))
            elif message_data.get('type') == 'subscribe':
                # Handle subscription to specific channels
                channel = message_data.get('channel')
                if channel:
                    # Store subscription info (in production, use Redis)
                    pass
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.websocket("/ws/plots")
async def plot_updates_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for plot-specific updates
    """
    await manager.connect(websocket)
    
    # Subscribe to Redis channel for plot updates
    pubsub = None
    try:
        if redis_client.redis:
            pubsub = redis_client.redis.pubsub()
            await pubsub.subscribe('plot_updates')
        
        # Handle both WebSocket messages and Redis messages
        while True:
            try:
                # Check for Redis messages
                if pubsub:
                    message = await pubsub.get_message(timeout=0.1)
                    if message and message['type'] == 'message':
                        await websocket.send_text(message['data'])
                
                # Check for WebSocket messages (non-blocking)
                try:
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                    # Handle client messages if needed
                except asyncio.TimeoutError:
                    pass
                
                await asyncio.sleep(0.1)  # Small delay to prevent busy waiting
                
            except WebSocketDisconnect:
                break
                
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if pubsub:
            await pubsub.unsubscribe('plot_updates')
            await pubsub.close()
        manager.disconnect(websocket)

# Utility functions for sending updates
async def broadcast_plot_update(plot_data: Dict[str, Any]):
    """
    Broadcast plot update to all connected clients
    """
    message = json.dumps({
        'type': 'plot_update',
        'data': plot_data,
        'timestamp': datetime.utcnow().isoformat()
    })
    
    # Send via WebSocket
    await manager.broadcast(message)
    
    # Send via Redis for other instances
    await redis_client.publish('plot_updates', message)

async def send_user_notification(user_id: str, notification: Dict[str, Any]):
    """
    Send notification to specific user
    """
    message = json.dumps({
        'type': 'notification',
        'data': notification,
        'timestamp': datetime.utcnow().isoformat()
    })
    
    await manager.send_personal_message(message, user_id)