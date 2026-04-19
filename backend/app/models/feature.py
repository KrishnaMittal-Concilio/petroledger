"""PetroLedger — Tenant Feature Registry & Payment Config Models."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.tenant import Tenant


class TenantFeature(TimestampMixin, Base):
    """Global feature registry — one row per named feature, shared across all tenants.

    ``included_in_plans`` is a comma-separated list of plan codes whose
    subscribers get the feature by default (e.g. ``"PRO,ENTERPRISE"``).
    """

    __tablename__ = "tenant_features"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    module: Mapped[str] = mapped_column(String(64), nullable=False)
    is_core: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    included_in_plans: Mapped[str] = mapped_column(
        String(255), nullable=False, default="", server_default=""
    )

    overrides: Mapped[list[TenantFeatureOverride]] = relationship(
        "TenantFeatureOverride", back_populates="feature", lazy="raise"
    )


class TenantFeatureOverride(TimestampMixin, Base):
    """Per-tenant override that forces a feature on or off regardless of plan."""

    __tablename__ = "tenant_feature_overrides"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    feature_id: Mapped[int] = mapped_column(
        ForeignKey("tenant_features.id", ondelete="CASCADE"), nullable=False
    )
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    tenant: Mapped[Tenant] = relationship("Tenant", lazy="raise")
    feature: Mapped[TenantFeature] = relationship(
        "TenantFeature", back_populates="overrides", lazy="raise"
    )

    __table_args__ = (
        UniqueConstraint("tenant_id", "feature_id", name="uq_tenant_feature_override"),
    )


class TenantPaymentConfig(TimestampMixin, Base):
    """Payment gateway credentials for a tenant's pump operations.

    Stores the merchant API keys that allow payment receipts at the pump
    to be automatically recorded as transactions in the ERP.
    ``key_secret`` is stored masked — the last 4 characters are kept,
    the rest replaced with ``****`` on every read so the secret is
    never returned in full after initial save.
    """

    __tablename__ = "tenant_payment_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    gateway: Mapped[str] = mapped_column(
        String(32), nullable=False, default="razorpay", server_default="razorpay"
    )
    key_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    key_secret: Mapped[str | None] = mapped_column(String(512), nullable=True)
    webhook_secret: Mapped[str | None] = mapped_column(String(512), nullable=True)
    is_enabled: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )

    tenant: Mapped[Tenant] = relationship("Tenant", lazy="raise")
