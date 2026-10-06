from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TechKart API"
    app_env: str = "development"
    database_url: str = "sqlite:///./techkart.db"
    cors_origins: list[str] = ["http://localhost:5173"]
    jwt_secret: str = ""
    jwt_issuer: str = "techkart-api"
    jwt_audience: str = "techkart-web"
    access_token_expire_minutes: int = Field(default=30, ge=5, le=1_440)
    max_request_body_bytes: int = Field(default=1_000_000, ge=1_024, le=25_000_000)
    max_audio_upload_bytes: int = Field(default=10 * 1024 * 1024, ge=1_024, le=25_000_000)
    max_image_upload_bytes: int = Field(default=8 * 1024 * 1024, ge=1_024, le=25_000_000)
    max_pdf_upload_bytes: int = Field(default=15 * 1024 * 1024, ge=1_024, le=25_000_000)

    openai_api_key: str = ""
    openai_text_model: str = "gpt-4o-mini"
    openai_vision_model: str = "gpt-4o-mini"
    openai_transcription_model: str = "gpt-4o-mini-transcribe"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
