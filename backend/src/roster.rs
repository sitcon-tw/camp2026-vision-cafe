use chrono::Utc;
use jsonwebtoken::{Algorithm, EncodingKey, Header};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::{config::Config, error::AppError, types::AuthenticatedStudent};

const ROSTER_RANGE: &str = "A1:Z500";
const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_SCOPE: &str = "https://www.googleapis.com/auth/spreadsheets.readonly";

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum RosterLookupResult {
    Ok(AuthenticatedStudent),
    NotFound,
    Duplicate(Vec<AuthenticatedStudent>),
}

pub async fn get_roster_students(
    http: &Client,
    config: &Config,
) -> Result<Vec<AuthenticatedStudent>, AppError> {
    let rows = get_roster_rows(http, config).await?;
    Ok(parse_roster_students(rows))
}

pub async fn find_roster_student_by_github_username(
    http: &Client,
    config: &Config,
    github_username: &str,
) -> Result<RosterLookupResult, AppError> {
    let normalized_github_username = normalize_github_username(github_username);
    let matches = get_roster_students(http, config)
        .await?
        .into_iter()
        .filter(|student| {
            normalize_github_username(&student.github_username) == normalized_github_username
        })
        .collect::<Vec<_>>();

    Ok(match matches.len() {
        0 => RosterLookupResult::NotFound,
        1 => RosterLookupResult::Ok(matches.into_iter().next().unwrap()),
        _ => RosterLookupResult::Duplicate(matches),
    })
}

pub async fn find_roster_student_by_id(
    http: &Client,
    config: &Config,
    student_id: &str,
) -> Result<Option<AuthenticatedStudent>, AppError> {
    Ok(get_roster_students(http, config)
        .await?
        .into_iter()
        .find(|student| student.student_id == student_id))
}

pub fn parse_roster_students(rows: Vec<Vec<String>>) -> Vec<AuthenticatedStudent> {
    let Some((header_row, data_rows)) = rows.split_first() else {
        return Vec::new();
    };
    let header = create_header_index(header_row);

    data_rows
        .iter()
        .filter_map(|row| {
            let team_id = read_column(row, &header, "小隊");
            let student_name = read_column(row, &header, "學員姓名");
            let student_id = read_column(row, &header, "token");
            let github_username = read_column(row, &header, "GitHub username");
            let telegram_group_url = read_column(row, &header, "Telegram 群組連結");

            if team_id.is_empty()
                || student_id.is_empty()
                || github_username.is_empty()
                || telegram_group_url.is_empty()
            {
                return None;
            }

            Some(AuthenticatedStudent {
                github_username,
                student_id,
                student_name: if student_name.is_empty() {
                    "未命名學員".to_string()
                } else {
                    student_name
                },
                team_name: format!("第{team_id}組"),
                team_id,
            })
        })
        .collect()
}

pub fn normalize_github_username(github_username: &str) -> String {
    github_username
        .trim()
        .trim_start_matches('@')
        .to_lowercase()
}

async fn get_roster_rows(http: &Client, config: &Config) -> Result<Vec<Vec<String>>, AppError> {
    let access_token = fetch_google_access_token(http, config).await?;
    let range = format!(
        "{}!{ROSTER_RANGE}",
        quote_sheet_name(&config.google_sheets_roster_sheet_name)
    );
    let encoded_range = urlencoding::encode(&range);
    let url = format!(
        "https://sheets.googleapis.com/v4/spreadsheets/{}/values/{}?valueRenderOption=FORMATTED_VALUE",
        config.google_sheets_roster_spreadsheet_id, encoded_range
    );
    let response = http
        .get(url)
        .bearer_auth(access_token)
        .send()
        .await?
        .error_for_status()?
        .json::<GoogleSheetsValuesResponse>()
        .await?;

    Ok(response
        .values
        .unwrap_or_default()
        .into_iter()
        .map(|row| row.into_iter().map(google_cell_to_string).collect())
        .collect())
}

async fn fetch_google_access_token(http: &Client, config: &Config) -> Result<String, AppError> {
    let now = Utc::now().timestamp();
    let claims = GoogleServiceAccountClaims {
        aud: GOOGLE_TOKEN_URL,
        exp: now + 3600,
        iat: now,
        iss: &config.google_service_account_email,
        scope: GOOGLE_SHEETS_SCOPE,
    };
    let assertion = jsonwebtoken::encode(
        &Header::new(Algorithm::RS256),
        &claims,
        &EncodingKey::from_rsa_pem(config.google_private_key.as_bytes())?,
    )?;
    let response = http
        .post(GOOGLE_TOKEN_URL)
        .form(&[
            ("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer"),
            ("assertion", assertion.as_str()),
        ])
        .send()
        .await?
        .error_for_status()?
        .json::<GoogleTokenResponse>()
        .await?;

    Ok(response.access_token)
}

fn create_header_index(header_row: &[String]) -> HashMap<String, usize> {
    header_row
        .iter()
        .enumerate()
        .map(|(index, header)| (header.trim().to_string(), index))
        .collect()
}

fn read_column(row: &[String], header: &HashMap<String, usize>, column_name: &str) -> String {
    header
        .get(column_name)
        .and_then(|column_index| row.get(*column_index))
        .map(|value| value.trim().to_string())
        .unwrap_or_default()
}

fn quote_sheet_name(sheet_name: &str) -> String {
    format!("'{}'", sheet_name.replace('\'', "''"))
}

fn google_cell_to_string(value: serde_json::Value) -> String {
    match value {
        serde_json::Value::Null => String::new(),
        serde_json::Value::String(value) => value,
        serde_json::Value::Number(value) => value.to_string(),
        serde_json::Value::Bool(value) => value.to_string(),
        other => other.to_string(),
    }
}

#[derive(Debug, Serialize)]
struct GoogleServiceAccountClaims<'a> {
    iss: &'a str,
    scope: &'a str,
    aud: &'a str,
    exp: i64,
    iat: i64,
}

#[derive(Debug, Deserialize)]
struct GoogleTokenResponse {
    access_token: String,
}

#[derive(Debug, Deserialize)]
struct GoogleSheetsValuesResponse {
    values: Option<Vec<Vec<serde_json::Value>>>,
}

#[cfg(test)]
mod tests {
    use super::{normalize_github_username, parse_roster_students};

    #[test]
    fn keeps_rows_with_team_token_and_github_username() {
        let students = parse_roster_students(vec![
            vec![
                "小隊".to_string(),
                "學員姓名".to_string(),
                "token".to_string(),
                "GitHub username".to_string(),
                "Telegram 群組連結".to_string(),
            ],
            vec![
                "1".to_string(),
                "小明".to_string(),
                "student-1".to_string(),
                "Octocat".to_string(),
                "https://t.me/+team1".to_string(),
            ],
            vec![
                "2".to_string(),
                "缺帳號".to_string(),
                "student-2".to_string(),
                String::new(),
                "https://t.me/+team2".to_string(),
            ],
            vec![
                String::new(),
                "測試".to_string(),
                "student-3".to_string(),
                "staff-user".to_string(),
                "https://t.me/+team3".to_string(),
            ],
            vec![
                "3".to_string(),
                "小華".to_string(),
                "student-4".to_string(),
                "@Mona".to_string(),
                "https://t.me/+team3".to_string(),
            ],
            vec![
                "4".to_string(),
                "缺 Telegram".to_string(),
                "student-5".to_string(),
                "no-telegram".to_string(),
                String::new(),
            ],
        ]);

        assert_eq!(students.len(), 2);
        assert_eq!(students[0].github_username, "Octocat");
        assert_eq!(students[1].team_name, "第3組");
    }

    #[test]
    fn uses_header_names_instead_of_fixed_column_positions() {
        let students = parse_roster_students(vec![
            vec![
                "GitHub username".to_string(),
                "token".to_string(),
                "Telegram 群組連結".to_string(),
                "學員姓名".to_string(),
                "小隊".to_string(),
            ],
            vec![
                "octocat".to_string(),
                "student-1".to_string(),
                "https://t.me/+team5".to_string(),
                "小明".to_string(),
                "5".to_string(),
            ],
        ]);

        assert_eq!(students[0].team_name, "第5組");
        assert_eq!(students[0].student_id, "student-1");
    }

    #[test]
    fn normalizes_github_usernames() {
        assert_eq!(normalize_github_username("  @OctoCat  "), "octocat");
    }
}
