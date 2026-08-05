import asyncio
import json
from typing import Any

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from .config import bucket_name
from .errors import StorageError
from .models import StoredFile


class S3WeatherStorage:
    def __init__(self, bucket: str, client: Any | None = None) -> None:
        self._bucket = bucket
        self._client = client or boto3.client("s3")

    async def put_json(self, name: str, payload: bytes) -> None:
        def upload() -> None:
            self._client.put_object(
                Bucket=self._bucket,
                Key=name,
                Body=payload,
                ContentType="application/json",
            )

        try:
            await asyncio.to_thread(upload)
        except (BotoCoreError, ClientError) as exc:
            raise StorageError("could not store weather data") from exc

    async def list_files(self) -> list[StoredFile]:
        def list_objects() -> list[StoredFile]:
            paginator = self._client.get_paginator("list_objects_v2")
            files: list[StoredFile] = []
            for page in paginator.paginate(Bucket=self._bucket):
                for item in page.get("Contents", []):
                    created_at = item["LastModified"].isoformat().replace("+00:00", "Z")
                    files.append(
                        StoredFile(
                            name=item["Key"],
                            size=item["Size"],
                            created_at=created_at,
                        )
                    )
            return sorted(files, key=lambda item: item.created_at, reverse=True)

        try:
            return await asyncio.to_thread(list_objects)
        except (BotoCoreError, ClientError) as exc:
            raise StorageError("could not list weather files") from exc

    async def get_json(self, name: str) -> dict[str, Any]:
        def download() -> dict[str, Any]:
            response = self._client.get_object(Bucket=self._bucket, Key=name)
            body = response["Body"]
            try:
                payload = body.read()
            finally:
                body.close()
            parsed = json.loads(payload)
            if not isinstance(parsed, dict):
                raise ValueError("stored weather data is not a JSON object")
            return parsed

        try:
            return await asyncio.to_thread(download)
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code")
            if code in {"404", "NoSuchKey", "NotFound"}:
                raise FileNotFoundError(name) from exc
            raise StorageError("could not retrieve weather file") from exc
        except BotoCoreError as exc:
            raise StorageError("could not retrieve weather file") from exc
        except (json.JSONDecodeError, ValueError) as exc:
            raise StorageError("stored weather file is invalid") from exc


def get_storage() -> S3WeatherStorage:
    try:
        return S3WeatherStorage(bucket_name())
    except RuntimeError as exc:
        raise StorageError("weather storage is not configured") from exc

