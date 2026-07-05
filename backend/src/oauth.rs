use axum::{
    Json,
    extract::{Query, State},
    http::{HeaderMap, HeaderValue, header},
    response::{IntoResponse, Redirect, Response},
};
use reqwest::Client;
use serde::Deserialize;
use uuid::Uuid;

use crate::{
    auth::{
        OAUTH_STATE_COOKIE, STUDENT_SESSION_COOKIE, clear_cookie_header, logout_payload,
        oauth_state_cookie, oauth_state_from_cookie, student_session_cookie,
    },
    config::Config,
    error::AppError,
    repository::ensure_student_profile,
    roster::{RosterLookupResult, find_roster_student_by_github_username},
    state::AppState,
};

const GITHUB_AUTHORIZE_URL: &str = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL: &str = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL: &str = "https://api.github.com/user";
const USER_AGENT: &str = "camp2026-vision-cafe";

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartGithubOAuthQuery {
    callback_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GithubCallbackQuery {
    code: Option<String>,
    error: Option<String>,
    state: Option<String>,
}

pub async fn start_github_oauth(
    State(state): State<AppState>,
    Query(query): Query<StartGithubOAuthQuery>,
) -> Result<Response, AppError> {
    let callback_url = sanitize_callback_url(query.callback_url.as_deref());
    let nonce = Uuid::new_v4().simple().to_string();
    let authorize_url = github_authorize_url(&state.config, &nonce);
    let mut response = Redirect::temporary(&authorize_url).into_response();

    response.headers_mut().append(
        header::SET_COOKIE,
        oauth_state_cookie(callback_url, nonce, &state.config)?,
    );

    Ok(response)
}

pub async fn github_callback(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(query): Query<GithubCallbackQuery>,
) -> Result<Response, AppError> {
    if query.error.is_some() {
        return Ok(Redirect::temporary("/auth/error").into_response());
    }

    let Some(code) = query.code else {
        return Ok(Redirect::temporary("/auth/error").into_response());
    };
    let Some(state_nonce) = query.state else {
        return Ok(Redirect::temporary("/auth/error").into_response());
    };
    let Some(oauth_state) = oauth_state_from_cookie(&headers, &state.config) else {
        return Ok(Redirect::temporary("/auth/error").into_response());
    };

    if oauth_state.nonce != state_nonce {
        return Ok(Redirect::temporary("/auth/error").into_response());
    }

    let github_profile = fetch_github_profile(&state.http, &state.config, &code).await?;
    let roster_result =
        find_roster_student_by_github_username(&state.http, &state.config, &github_profile.login)
            .await?;
    let RosterLookupResult::Ok(student) = roster_result else {
        return Ok(Redirect::temporary("/auth/error").into_response());
    };

    ensure_student_profile(&state, &student).await?;

    let mut response = Redirect::temporary(&oauth_state.callback_url).into_response();
    response.headers_mut().append(
        header::SET_COOKIE,
        student_session_cookie(&student, &state.config)?,
    );
    response.headers_mut().append(
        header::SET_COOKIE,
        clear_cookie_header(OAUTH_STATE_COOKIE, &state.config)?,
    );

    Ok(response)
}

pub async fn logout(State(state): State<AppState>) -> Result<Response, AppError> {
    let mut response = Json(logout_payload()).into_response();
    response.headers_mut().append(
        header::SET_COOKIE,
        clear_cookie_header(STUDENT_SESSION_COOKIE, &state.config)?,
    );

    Ok(response)
}

async fn fetch_github_profile(
    http: &Client,
    config: &Config,
    code: &str,
) -> Result<GithubUserResponse, AppError> {
    let token_response = http
        .post(GITHUB_TOKEN_URL)
        .header(header::ACCEPT, HeaderValue::from_static("application/json"))
        .form(&[
            ("client_id", config.github_client_id.as_str()),
            ("client_secret", config.github_client_secret.as_str()),
            ("code", code),
            ("redirect_uri", config.github_redirect_uri().as_str()),
        ])
        .send()
        .await?
        .error_for_status()?
        .json::<GithubTokenResponse>()
        .await?;

    let profile = http
        .get(GITHUB_USER_URL)
        .bearer_auth(token_response.access_token)
        .header(header::USER_AGENT, HeaderValue::from_static(USER_AGENT))
        .send()
        .await?
        .error_for_status()?
        .json::<GithubUserResponse>()
        .await?;

    Ok(profile)
}

fn github_authorize_url(config: &Config, nonce: &str) -> String {
    format!(
        "{GITHUB_AUTHORIZE_URL}?client_id={}&redirect_uri={}&scope=read:user&state={}",
        urlencoding::encode(&config.github_client_id),
        urlencoding::encode(&config.github_redirect_uri()),
        urlencoding::encode(nonce)
    )
}

fn sanitize_callback_url(callback_url: Option<&str>) -> String {
    let callback_url = callback_url.unwrap_or("/select");

    if callback_url.starts_with('/') && !callback_url.starts_with("//") {
        callback_url.to_string()
    } else {
        "/select".to_string()
    }
}

#[derive(Debug, Deserialize)]
struct GithubTokenResponse {
    access_token: String,
}

#[derive(Debug, Deserialize)]
struct GithubUserResponse {
    login: String,
}

#[cfg(test)]
mod tests {
    use super::sanitize_callback_url;

    #[test]
    fn accepts_only_local_callback_urls() {
        assert_eq!(sanitize_callback_url(Some("/select")), "/select");
        assert_eq!(sanitize_callback_url(Some("/admin/flow")), "/admin/flow");
        assert_eq!(sanitize_callback_url(Some("https://evil.test")), "/select");
        assert_eq!(sanitize_callback_url(Some("//evil.test")), "/select");
        assert_eq!(sanitize_callback_url(None), "/select");
    }
}
