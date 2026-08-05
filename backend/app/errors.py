class WeatherProviderError(Exception):
    """Raised when Open-Meteo cannot provide a usable response."""


class StorageError(Exception):
    """Raised when S3 cannot complete an operation."""

