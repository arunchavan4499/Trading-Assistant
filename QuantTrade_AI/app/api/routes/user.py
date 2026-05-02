"""User management and configuration endpoints."""

from datetime import datetime
import logging
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.dependencies.db import get_db
from app.models.database import User as UserModel
from app.models.schemas import (
    User,
    UserConfig,
    UserUpdateRequest,
    ApiResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/user", tags=["user"])


def _ensure_default_user(db: Session) -> UserModel:
    """Return the first user, creating a default one if the table is empty."""
    user = db.query(UserModel).order_by(UserModel.id).first()
    if user:
        return user

    user = UserModel(
        name="Default User",
        email="user@example.com",
        risk_tolerance=0.5,
        capital=100000.0,
        max_assets=settings.DEFAULT_SPARSITY,
        drawdown_limit=0.25,
        max_position_size=settings.MAX_POSITION_SIZE,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("Created default user record because none existed.")
    return user


def _user_config_from_model(user: UserModel) -> Dict[str, Any]:
    return {
        "default_sparsity": user.max_assets or settings.DEFAULT_SPARSITY,
        "deviation_threshold": settings.DEVIATION_THRESHOLD,
        "max_position_size": user.max_position_size or settings.MAX_POSITION_SIZE,
        "initial_capital": user.capital,
        "theme": "light",
        "notifications_enabled": True,
    }


def _serialize_user(user: UserModel) -> Dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "drawdown_limit": user.drawdown_limit,
        "max_assets": user.max_assets,
        "config": _user_config_from_model(user),
        "created_at": user.created_at.isoformat() if user.created_at else datetime.utcnow().isoformat(),
    }


@router.get("/me", response_model=ApiResponse)
async def get_current_user(db: Session = Depends(get_db)):
    """Return the first (and currently only) user from the database."""
    try:
        logger.info("Fetching current user")
        user = _ensure_default_user(db)
        return ApiResponse(
            success=True,
            data=_serialize_user(user),
            message="User retrieved",
            timestamp=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        logger.exception("Error fetching user")
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")


@router.put("/me", response_model=ApiResponse)
async def update_current_user(request: UserUpdateRequest, db: Session = Depends(get_db)):
    """
    Update current user profile.
    
    - **name**: User name (optional)
    - **email**: User email (optional)
    - **drawdown_limit**: Max drawdown limit as fraction (optional, e.g. 0.25 for 25%)
    - **max_assets**: Maximum number of assets (optional)
    - **config**: User configuration (optional)
    """
    try:
        logger.info("Updating user profile")
        user = _ensure_default_user(db)

        if request.name:
            user.name = request.name
        if request.email:
            user.email = request.email
        if request.drawdown_limit is not None:
            user.drawdown_limit = request.drawdown_limit
        if request.max_assets is not None:
            user.max_assets = request.max_assets
        if request.config:
            config = request.config
            if config.default_sparsity is not None:
                user.max_assets = config.default_sparsity
            if config.initial_capital is not None:
                user.capital = config.initial_capital
            if config.max_position_size is not None:
                user.max_position_size = config.max_position_size

        db.add(user)
        db.commit()
        db.refresh(user)

        return ApiResponse(
            success=True,
            data=_serialize_user(user),
            message="User profile updated",
            timestamp=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        db.rollback()
        logger.exception("Error updating user")
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")


@router.get("/config", response_model=ApiResponse)
async def get_user_config(db: Session = Depends(get_db)):
    """
    Get user application configuration.
    """
    try:
        logger.info("Fetching user config")
        user = _ensure_default_user(db)
        config = _user_config_from_model(user)
        config.update(
            {
                "DATA_START_DATE": settings.DATA_START_DATE,
                "DATA_END_DATE": settings.DATA_END_DATE,
                "COMMISSION_RATE": 0.0005,
                "SLIPPAGE_PCT": 0.0005,
            }
        )

        return ApiResponse(
            success=True,
            data={"config": config},
            message="User configuration retrieved",
            timestamp=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        logger.exception("Error fetching user config")
        raise HTTPException(status_code=500, detail=f"Error fetching user config: {str(e)}")


@router.put("/config", response_model=ApiResponse)
async def update_user_config(updates: dict, db: Session = Depends(get_db)):
    """
    Update user application configuration.
    
    Accepts key-value pairs to update in configuration.
    """
    try:
        logger.info("Updating user config")
        user = _ensure_default_user(db)

        default_sparsity = updates.get("default_sparsity") or updates.get("DEFAULT_SPARSITY")
        if default_sparsity is not None:
            user.max_assets = int(default_sparsity)

        initial_capital = updates.get("initial_capital") or updates.get("INITIAL_CAPITAL")
        if initial_capital is not None:
            user.capital = float(initial_capital)

        max_position_size = updates.get("max_position_size") or updates.get("MAX_POSITION_SIZE")
        if max_position_size is not None:
            user.drawdown_limit = float(max_position_size)

        db.add(user)
        db.commit()
        db.refresh(user)

        return ApiResponse(
            success=True,
            data={"config": _user_config_from_model(user)},
            message="User configuration updated",
            timestamp=datetime.utcnow().isoformat(),
        )
    except Exception as e:
        db.rollback()
        logger.exception("Error updating user config")
        raise HTTPException(status_code=500, detail=f"Error updating user config: {str(e)}")
