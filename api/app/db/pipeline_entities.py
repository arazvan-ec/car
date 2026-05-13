"""
Entidades ORM para el patrón Pipeline — separadas del dominio.
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Integer, String, Text, JSON, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base


class PipelineRunEntity(Base):
    __tablename__ = "pipeline_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    pipeline_type = Column(String(100), nullable=False, index=True)
    subject_type  = Column(String(100), nullable=False, index=True)
    subject_data  = Column(JSON, nullable=False)
    subject_hash  = Column(String(64), nullable=False, index=True)  # SHA256 de subject_data
    status        = Column(String(20), nullable=False, default="pending", index=True)
    decision      = Column(JSON, nullable=True)
    skill_version = Column(String(100), nullable=True)
    notes         = Column(Text, nullable=True)

    steps = relationship(
        "PipelineStepEntity",
        back_populates="run",
        cascade="all, delete-orphan",
        order_by="PipelineStepEntity.created_at",
    )


class PipelineStepEntity(Base):
    __tablename__ = "pipeline_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    run_id     = Column(UUID(as_uuid=True), ForeignKey("pipeline_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    step_type  = Column(String(100), nullable=False, index=True)
    status     = Column(String(20), nullable=False, default="pending", index=True)
    structured_result = Column(JSON, nullable=True)
    error_message     = Column(Text, nullable=True)
    depends_on        = Column(JSON, nullable=True)   # ["technical_specs", ...]
    started_at        = Column(DateTime, nullable=True)
    completed_at      = Column(DateTime, nullable=True)

    run = relationship("PipelineRunEntity", back_populates="steps")
    data_sources = relationship(
        "DataSourceEntity",
        back_populates="step",
        cascade="all, delete-orphan",
        order_by="DataSourceEntity.created_at",
    )


class DataSourceEntity(Base):
    __tablename__ = "data_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    step_id     = Column(UUID(as_uuid=True), ForeignKey("pipeline_steps.id", ondelete="CASCADE"), nullable=False, index=True)
    source_name = Column(String(100), nullable=False, index=True)
    source_url  = Column(String(2048), nullable=False)
    fetched_at  = Column(DateTime, default=datetime.utcnow, nullable=False)

    step = relationship("PipelineStepEntity", back_populates="data_sources")
    cache_entries = relationship(
        "CacheEntryEntity",
        back_populates="data_source",
        cascade="all, delete-orphan",
        order_by="CacheEntryEntity.version",
    )


class CacheEntryEntity(Base):
    __tablename__ = "cache_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    data_source_id  = Column(UUID(as_uuid=True), ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False, index=True)
    version         = Column(Integer, nullable=False)           # Autoincremental por fuente
    is_current      = Column(Boolean, nullable=False, default=True, index=True)
    raw_content     = Column(Text, nullable=True)               # Texto completo guardado
    structured_data = Column(JSON, nullable=True)               # Datos extraídos
    notes           = Column(Text, nullable=True)

    data_source = relationship("DataSourceEntity", back_populates="cache_entries")
