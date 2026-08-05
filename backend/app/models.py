from datetime import date
from typing import Self

from pydantic import BaseModel, Field, model_validator


class WeatherRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def validate_date_range(self) -> Self:
        if self.start_date > self.end_date:
            raise ValueError("start_date must be on or before end_date")
        if (self.end_date - self.start_date).days + 1 > 31:
            raise ValueError("date range cannot exceed 31 days")
        return self


class StoredFile(BaseModel):
    name: str
    size: int
    created_at: str


class FileList(BaseModel):
    files: list[StoredFile]


class StoreResult(BaseModel):
    status: str = "ok"
    file: str


class ErrorResult(BaseModel):
    status: str = "error"
    message: str

