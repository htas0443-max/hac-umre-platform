"""
Route modules for the Hac & Umre Platform API.
Each module contains related API endpoints organized by domain.
"""

from routes.auth_routes import router as auth_router
from routes.tour_routes import router as tour_router
from routes.operator_routes import router as operator_router
from routes.ai_routes import router as ai_router
from routes.user_routes import router as user_router
from routes.admin_routes import router as admin_router
from routes.monitoring_routes import router as monitoring_router
