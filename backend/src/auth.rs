use axum::http::{HeaderMap, HeaderValue, Method, header};
use base64::{Engine as _, engine::general_purpose::URL_SAFE_NO_PAD};
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use sha2::Sha256;
use subtle::ConstantTimeEq;

use crate::{
    config::Config,
    error::AppError,
    types::{AuthenticatedStudent, OkPayload, ParticipantRole},
};

type HmacSha256 = Hmac<Sha256>;

pub const ADMIN_SESSION_COOKIE: &str = "vision_cafe_admin";
pub const STUDENT_SESSION_COOKIE: &str = "vision_cafe_student";
pub const OAUTH_STATE_COOKIE: &str = "vision_cafe_oauth_state";

const ADMIN_SESSION_MAX_AGE_SECONDS: i64 = 60 * 60 * 8;
const STUDENT_SESSION_MAX_AGE_SECONDS: i64 = 60 * 60 * 24 * 7;
const OAUTH_STATE_MAX_AGE_SECONDS: i64 = 60 * 10;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct AdminSessionPayload {
    exp: i64,
    iat: i64,
    sub: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentSessionPayload {
    exp: i64,
    iat: i64,
    sub: String,
    student_id: String,
    student_name: String,
    team_id: String,
    team_name: String,
    github_username: String,
    #[serde(default)]
    participant_role: ParticipantRole,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OAuthStatePayload {
    pub callback_url: String,
    pub exp: i64,
    pub iat: i64,
    pub nonce: String,
}

pub fn require_same_origin(headers: &HeaderMap, config: &Config) -> Result<(), AppError> {
    let origin = headers
        .get(header::ORIGIN)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| AppError::Unauthorized("Unauthorized".to_string()))?;

    if origin == config.app_origin {
        Ok(())
    } else {
        Err(AppError::Unauthorized("Unauthorized".to_string()))
    }
}

pub fn require_admin_session(
    method: &Method,
    headers: &HeaderMap,
    config: &Config,
) -> Result<(), AppError> {
    if *method != Method::GET && *method != Method::HEAD {
        require_same_origin(headers, config)?;
    }

    let Some(token) = cookie_value(headers, ADMIN_SESSION_COOKIE) else {
        return Err(AppError::Unauthorized("Unauthorized".to_string()));
    };
    let payload =
        verify_signed_payload::<AdminSessionPayload>(&token, &admin_signing_secret(config))
            .ok_or_else(|| AppError::Unauthorized("Unauthorized".to_string()))?;

    if payload.sub == "admin" && payload.exp > now_seconds() {
        Ok(())
    } else {
        Err(AppError::Unauthorized("Unauthorized".to_string()))
    }
}

pub fn student_from_session(
    headers: &HeaderMap,
    config: &Config,
) -> Result<AuthenticatedStudent, AppError> {
    let Some(token) = cookie_value(headers, STUDENT_SESSION_COOKIE) else {
        return Err(AppError::Unauthorized("Unauthorized".to_string()));
    };
    let payload = verify_signed_payload::<StudentSessionPayload>(&token, &config.auth_secret)
        .ok_or_else(|| AppError::Unauthorized("Unauthorized".to_string()))?;

    if payload.sub != "student" || payload.exp <= now_seconds() {
        return Err(AppError::Unauthorized("Unauthorized".to_string()));
    }

    Ok(AuthenticatedStudent {
        github_username: payload.github_username,
        participant_role: payload.participant_role,
        student_id: payload.student_id,
        student_name: payload.student_name,
        team_id: payload.team_id,
        team_name: payload.team_name,
    })
}

pub fn admin_password_matches(password: &str, config: &Config) -> bool {
    let submitted_hash = hmac_digest(&config.auth_secret, password.as_bytes());
    let expected_hash = hmac_digest(&config.auth_secret, config.admin_password.as_bytes());

    submitted_hash.ct_eq(&expected_hash).into()
}

pub fn admin_session_cookie(config: &Config) -> Result<HeaderValue, AppError> {
    let now = now_seconds();
    let token = create_signed_payload(
        &AdminSessionPayload {
            exp: now + ADMIN_SESSION_MAX_AGE_SECONDS,
            iat: now,
            sub: "admin".to_string(),
        },
        &admin_signing_secret(config),
    )?;

    set_cookie_header(
        ADMIN_SESSION_COOKIE,
        &token,
        ADMIN_SESSION_MAX_AGE_SECONDS,
        config.cookie_secure,
    )
}

pub fn student_session_cookie(
    student: &AuthenticatedStudent,
    config: &Config,
) -> Result<HeaderValue, AppError> {
    let now = now_seconds();
    let token = create_signed_payload(
        &StudentSessionPayload {
            exp: now + STUDENT_SESSION_MAX_AGE_SECONDS,
            github_username: student.github_username.clone(),
            iat: now,
            participant_role: student.participant_role.clone(),
            student_id: student.student_id.clone(),
            student_name: student.student_name.clone(),
            sub: "student".to_string(),
            team_id: student.team_id.clone(),
            team_name: student.team_name.clone(),
        },
        &config.auth_secret,
    )?;

    set_cookie_header(
        STUDENT_SESSION_COOKIE,
        &token,
        STUDENT_SESSION_MAX_AGE_SECONDS,
        config.cookie_secure,
    )
}

pub fn oauth_state_cookie(
    callback_url: String,
    nonce: String,
    config: &Config,
) -> Result<HeaderValue, AppError> {
    let now = now_seconds();
    let token = create_signed_payload(
        &OAuthStatePayload {
            callback_url,
            exp: now + OAUTH_STATE_MAX_AGE_SECONDS,
            iat: now,
            nonce,
        },
        &config.auth_secret,
    )?;

    set_cookie_header(
        OAUTH_STATE_COOKIE,
        &token,
        OAUTH_STATE_MAX_AGE_SECONDS,
        config.cookie_secure,
    )
}

pub fn oauth_state_from_cookie(headers: &HeaderMap, config: &Config) -> Option<OAuthStatePayload> {
    let token = cookie_value(headers, OAUTH_STATE_COOKIE)?;
    let payload = verify_signed_payload::<OAuthStatePayload>(&token, &config.auth_secret)?;

    (payload.exp > now_seconds()).then_some(payload)
}

pub fn clear_cookie_header(name: &str, config: &Config) -> Result<HeaderValue, AppError> {
    let secure = if config.cookie_secure { "; Secure" } else { "" };
    let cookie = format!("{name}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly{secure}");
    HeaderValue::from_str(&cookie)
        .map_err(|error| AppError::Internal(format!("invalid cookie header: {error}")))
}

pub fn logout_payload() -> OkPayload {
    OkPayload { ok: true }
}

fn create_signed_payload<TPayload: Serialize>(
    payload: &TPayload,
    secret: &str,
) -> Result<String, AppError> {
    let encoded_payload = URL_SAFE_NO_PAD.encode(serde_json::to_vec(payload)?);
    let signature = URL_SAFE_NO_PAD.encode(hmac_digest(secret, encoded_payload.as_bytes()));

    Ok(format!("{encoded_payload}.{signature}"))
}

fn verify_signed_payload<TPayload: DeserializeOwned>(
    token: &str,
    secret: &str,
) -> Option<TPayload> {
    let (encoded_payload, signature) = token.split_once('.')?;
    let expected_signature =
        URL_SAFE_NO_PAD.encode(hmac_digest(secret, encoded_payload.as_bytes()));

    if signature
        .as_bytes()
        .ct_eq(expected_signature.as_bytes())
        .unwrap_u8()
        != 1
    {
        return None;
    }

    let payload = URL_SAFE_NO_PAD.decode(encoded_payload).ok()?;
    serde_json::from_slice(&payload).ok()
}

fn hmac_digest(secret: &str, value: &[u8]) -> Vec<u8> {
    let mut mac =
        HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC accepts keys of any length");
    mac.update(value);
    mac.finalize().into_bytes().to_vec()
}

fn cookie_value(headers: &HeaderMap, name: &str) -> Option<String> {
    let cookie_header = headers.get(header::COOKIE)?.to_str().ok()?;

    cookie_header.split(';').find_map(|part| {
        let (cookie_name, cookie_value) = part.trim().split_once('=')?;
        (cookie_name == name).then(|| cookie_value.to_string())
    })
}

fn set_cookie_header(
    name: &str,
    value: &str,
    max_age_seconds: i64,
    secure: bool,
) -> Result<HeaderValue, AppError> {
    let secure = if secure { "; Secure" } else { "" };
    let cookie = format!(
        "{name}={value}; Path=/; Max-Age={max_age_seconds}; SameSite=Lax; HttpOnly{secure}"
    );

    HeaderValue::from_str(&cookie)
        .map_err(|error| AppError::Internal(format!("invalid cookie header: {error}")))
}

fn admin_signing_secret(config: &Config) -> String {
    format!("{}:{}", config.auth_secret, config.admin_password)
}

fn now_seconds() -> i64 {
    chrono::Utc::now().timestamp()
}

#[cfg(test)]
mod tests {
    use axum::http::header::COOKIE;

    use super::*;

    #[test]
    fn signs_and_verifies_student_session_cookie() {
        let config = test_config();
        let student = AuthenticatedStudent {
            github_username: "octocat".to_string(),
            participant_role: ParticipantRole::Counselor,
            student_id: "student-1".to_string(),
            student_name: "小明".to_string(),
            team_id: "1".to_string(),
            team_name: "第1組".to_string(),
        };
        let set_cookie = student_session_cookie(&student, &config)
            .unwrap()
            .to_str()
            .unwrap()
            .to_string();
        let token = set_cookie
            .split_once('=')
            .unwrap()
            .1
            .split_once(';')
            .unwrap()
            .0;
        let mut headers = HeaderMap::new();
        headers.insert(
            COOKIE,
            HeaderValue::from_str(&format!("{STUDENT_SESSION_COOKIE}={token}")).unwrap(),
        );

        assert_eq!(student_from_session(&headers, &config).unwrap(), student);
    }

    #[test]
    fn rejects_wrong_origin_for_mutating_requests() {
        let config = test_config();
        let mut headers = HeaderMap::new();
        headers.insert(header::ORIGIN, HeaderValue::from_static("http://evil.test"));

        assert!(require_same_origin(&headers, &config).is_err());
    }

    #[test]
    fn defaults_legacy_student_sessions_to_student_role() {
        let payload = serde_json::from_value::<StudentSessionPayload>(serde_json::json!({
            "exp": 2,
            "iat": 1,
            "sub": "student",
            "studentId": "student-1",
            "studentName": "小明",
            "teamId": "1",
            "teamName": "第1組",
            "githubUsername": "octocat"
        }))
        .unwrap();

        assert_eq!(payload.participant_role, ParticipantRole::Student);
    }

    fn test_config() -> Config {
        Config {
            admin_password: "admin".to_string(),
            app_base_url: "http://localhost:5173".to_string(),
            app_origin: "http://localhost:5173".to_string(),
            auth_secret: "secret".to_string(),
            cookie_secure: false,
            github_client_id: "github-id".to_string(),
            github_client_secret: "github-secret".to_string(),
            google_private_key: "private-key".to_string(),
            google_service_account_email: "service@example.com".to_string(),
            google_sheets_roster_sheet_name: "學員帳號".to_string(),
            google_sheets_roster_spreadsheet_id: "spreadsheet".to_string(),
            mongodb_db: "vision_cafe".to_string(),
            mongodb_uri: "mongodb://localhost:27017".to_string(),
            static_dir: "../frontend/dist".into(),
            listen_addr: "127.0.0.1:3000".parse().unwrap(),
        }
    }
}
