use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};

use crate::types::ApiErrorPayload;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("{0}")]
    BadRequest(String),
    #[error("{0}")]
    Forbidden(String),
    #[error("{0}")]
    NotFound(String),
    #[error("{0}")]
    Unauthorized(String),
    #[error("database error: {0}")]
    Database(#[from] mongodb::error::Error),
    #[error("http client error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("oauth token error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),
    #[error("serialization error: {0}")]
    Serde(#[from] serde_json::Error),
    #[error("{0}")]
    Internal(String),
}

impl AppError {
    pub fn invalid_payload(message: impl Into<String>) -> Self {
        Self::BadRequest(message.into())
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = match &self {
            Self::BadRequest(_) => StatusCode::BAD_REQUEST,
            Self::Forbidden(_) => StatusCode::FORBIDDEN,
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            Self::Database(_)
            | Self::Http(_)
            | Self::Jwt(_)
            | Self::Serde(_)
            | Self::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        let message = match self {
            Self::BadRequest(message)
            | Self::Forbidden(message)
            | Self::NotFound(message)
            | Self::Unauthorized(message)
            | Self::Internal(message) => message,
            Self::Database(_) | Self::Http(_) | Self::Jwt(_) | Self::Serde(_) => {
                "Internal server error".to_string()
            }
        };

        (status, Json(ApiErrorPayload { error: message })).into_response()
    }
}
