use std::{env, net::SocketAddr, path::PathBuf};

#[derive(Clone, Debug)]
pub struct Config {
    pub admin_password: String,
    pub app_base_url: String,
    pub app_origin: String,
    pub auth_secret: String,
    pub cookie_secure: bool,
    pub github_client_id: String,
    pub github_client_secret: String,
    pub google_private_key: String,
    pub google_service_account_email: String,
    pub google_sheets_roster_sheet_name: String,
    pub google_sheets_roster_spreadsheet_id: String,
    pub mongodb_db: String,
    pub mongodb_uri: String,
    pub static_dir: PathBuf,
    pub listen_addr: SocketAddr,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        let app_base_url = optional_env("APP_BASE_URL").unwrap_or_else(default_app_base_url);
        let app_origin = origin_from_base_url(&app_base_url);
        let node_env = optional_env("NODE_ENV").unwrap_or_else(|| "development".to_string());
        let cookie_secure = optional_env("COOKIE_SECURE")
            .map(|value| matches!(value.as_str(), "1" | "true" | "TRUE"))
            .unwrap_or_else(|| app_base_url.starts_with("https://") || node_env == "production");
        let port = optional_env("PORT").unwrap_or_else(|| "3000".to_string());
        let listen_addr = format!("0.0.0.0:{port}")
            .parse()
            .map_err(|_| ConfigError::InvalidListenAddress(port.clone()))?;

        Ok(Self {
            admin_password: required_env("ADMIN_PASSWORD")?,
            app_base_url,
            app_origin,
            auth_secret: required_env("AUTH_SECRET")?,
            cookie_secure,
            github_client_id: required_env("AUTH_GITHUB_ID")?,
            github_client_secret: required_env("AUTH_GITHUB_SECRET")?,
            google_private_key: required_env("GOOGLE_PRIVATE_KEY")?.replace("\\n", "\n"),
            google_service_account_email: required_env("GOOGLE_SERVICE_ACCOUNT_EMAIL")?,
            google_sheets_roster_sheet_name: optional_env("GOOGLE_SHEETS_ROSTER_SHEET_NAME")
                .unwrap_or_else(|| "學員帳號".to_string()),
            google_sheets_roster_spreadsheet_id: required_env(
                "GOOGLE_SHEETS_ROSTER_SPREADSHEET_ID",
            )?,
            mongodb_db: optional_env("MONGODB_DB").unwrap_or_else(|| "vision_cafe".to_string()),
            mongodb_uri: required_env("MONGODB_URI")?,
            static_dir: optional_env("STATIC_DIR")
                .map(PathBuf::from)
                .unwrap_or_else(|| PathBuf::from("../frontend/dist")),
            listen_addr,
        })
    }

    pub fn github_redirect_uri(&self) -> String {
        app_url_with_path(&self.app_base_url, "/api/auth/github/callback")
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("missing required environment variable: {0}")]
    MissingEnv(&'static str),
    #[error("invalid listen address port: {0}")]
    InvalidListenAddress(String),
}

fn required_env(name: &'static str) -> Result<String, ConfigError> {
    env::var(name)
        .ok()
        .filter(|value| !value.is_empty())
        .ok_or(ConfigError::MissingEnv(name))
}

fn optional_env(name: &str) -> Option<String> {
    env::var(name).ok().filter(|value| !value.is_empty())
}

fn default_app_base_url() -> String {
    if cfg!(debug_assertions) {
        "http://localhost:5173".to_string()
    } else {
        "http://localhost:3000".to_string()
    }
}

fn origin_from_base_url(app_base_url: &str) -> String {
    let trimmed = app_base_url.trim_end_matches('/');
    match trimmed.find("://") {
        Some(scheme_index) => {
            let after_scheme_index = scheme_index + 3;
            let host_end = trimmed[after_scheme_index..]
                .find('/')
                .map(|index| after_scheme_index + index)
                .unwrap_or(trimmed.len());
            trimmed[..host_end].to_string()
        }
        None => trimmed.to_string(),
    }
}

fn app_url_with_path(app_base_url: &str, path: &str) -> String {
    format!("{}{}", app_base_url.trim_end_matches('/'), path)
}

#[cfg(test)]
mod tests {
    use super::app_url_with_path;

    #[test]
    fn joins_app_base_url_without_duplicate_slashes() {
        assert_eq!(
            app_url_with_path(
                "https://vision-cafe.sitcon.party",
                "/api/auth/github/callback"
            ),
            "https://vision-cafe.sitcon.party/api/auth/github/callback"
        );
        assert_eq!(
            app_url_with_path(
                "https://vision-cafe.sitcon.party/",
                "/api/auth/github/callback"
            ),
            "https://vision-cafe.sitcon.party/api/auth/github/callback"
        );
    }
}
