use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, Method},
    response::{IntoResponse, Response},
};

use crate::{
    auth::{
        admin_password_matches, admin_session_cookie, require_admin_session, require_same_origin,
        student_from_session,
    },
    error::AppError,
    repository::{
        clear_all_student_preferences, create_current_assignment_plan, get_admin_preferences,
        get_flow_controls, get_lookup_payload, get_published_assignment_plans,
        get_student_preference, get_student_selection_payload, publish_current_assignment_plan,
        save_student_preference, update_flow_controls,
    },
    roster::find_roster_student_by_id,
    state::AppState,
    types::{
        AdminAssignmentPlanPayload, AdminFlowControls, AdminLoginRequest, AdminPreferenceUpdate,
        AdminPreferencesPayload, AdminPublishedAssignmentPlansPayload, FlowControlsUpdate,
        OkPayload, StudentPreferenceSubmit,
    },
    validation::{validate_speaker_preference_order, validate_submitted_at},
};

pub async fn lookup(
    State(state): State<AppState>,
) -> Result<Json<crate::types::LookupPayload>, AppError> {
    Ok(Json(get_lookup_payload(&state).await?))
}

pub async fn student_me(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<crate::types::StudentSelectionPayload>, AppError> {
    let student = student_from_session(&headers, &state.config)?;

    Ok(Json(get_student_selection_payload(&state, &student).await?))
}

pub async fn update_student_preferences(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<StudentPreferenceSubmit>,
) -> Result<Json<serde_json::Value>, AppError> {
    let student = student_from_session(&headers, &state.config)?;
    let flow_controls = get_flow_controls(&state).await?;

    if !flow_controls.speaker_preference_selection_open {
        return Err(AppError::Forbidden(
            "Speaker preference selection is closed".to_string(),
        ));
    }

    if !validate_speaker_preference_order(&body.preference_order) {
        return Err(AppError::invalid_payload(
            "Invalid speaker preference order",
        ));
    }

    save_student_preference(
        &state,
        &student,
        body.preference_order,
        Some(current_timestamp()),
    )
    .await?;

    Ok(Json(serde_json::json!({
        "preference": get_student_preference(&state, &student).await?
    })))
}

pub async fn admin_login(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(body): Json<AdminLoginRequest>,
) -> Result<Response, AppError> {
    require_same_origin(&headers, &state.config)?;

    let Some(password) = body.password else {
        return Err(AppError::Unauthorized("Unauthorized".to_string()));
    };

    if !admin_password_matches(&password, &state.config) {
        return Err(AppError::Unauthorized("Unauthorized".to_string()));
    }

    let mut response = Json(OkPayload { ok: true }).into_response();
    response.headers_mut().append(
        axum::http::header::SET_COOKIE,
        admin_session_cookie(&state.config)?,
    );

    Ok(response)
}

pub async fn admin_flow_controls(
    State(state): State<AppState>,
    headers: HeaderMap,
    method: Method,
) -> Result<Json<AdminFlowControls>, AppError> {
    require_admin_session(&method, &headers, &state.config)?;

    Ok(Json(get_flow_controls(&state).await?))
}

pub async fn update_admin_flow_controls(
    State(state): State<AppState>,
    headers: HeaderMap,
    method: Method,
    Json(body): Json<FlowControlsUpdate>,
) -> Result<Json<AdminFlowControls>, AppError> {
    require_admin_session(&method, &headers, &state.config)?;

    Ok(Json(
        update_flow_controls(
            &state,
            AdminFlowControls {
                assignment_lookup_open: body.assignment_lookup_open,
                speaker_preference_selection_open: body.speaker_preference_selection_open,
            },
        )
        .await?,
    ))
}

pub async fn admin_preferences(
    State(state): State<AppState>,
    headers: HeaderMap,
    method: Method,
) -> Result<Json<AdminPreferencesPayload>, AppError> {
    require_admin_session(&method, &headers, &state.config)?;

    Ok(Json(AdminPreferencesPayload {
        preferences: get_admin_preferences(&state).await?,
    }))
}

pub async fn clear_admin_preferences(
    State(state): State<AppState>,
    headers: HeaderMap,
    method: Method,
) -> Result<Json<OkPayload>, AppError> {
    require_admin_session(&method, &headers, &state.config)?;
    clear_all_student_preferences(&state).await?;

    Ok(Json(OkPayload { ok: true }))
}

pub async fn update_admin_preference(
    State(state): State<AppState>,
    headers: HeaderMap,
    method: Method,
    Path(student_id): Path<String>,
    Json(body): Json<AdminPreferenceUpdate>,
) -> Result<Json<OkPayload>, AppError> {
    require_admin_session(&method, &headers, &state.config)?;
    validate_submitted_at(&body.submitted_at)?;

    if !validate_speaker_preference_order(&body.preference_order) {
        return Err(AppError::invalid_payload(
            "Invalid speaker preference order",
        ));
    }

    let decoded_student_id = urlencoding::decode(&student_id)
        .map_err(|_| AppError::invalid_payload("Invalid student id"))?
        .into_owned();
    let student = find_roster_student_by_id(&state.http, &state.config, &decoded_student_id)
        .await?
        .ok_or_else(|| AppError::NotFound("Student not found in roster".to_string()))?;

    save_student_preference(&state, &student, body.preference_order, body.submitted_at).await?;

    Ok(Json(OkPayload { ok: true }))
}

pub async fn dry_run_assignment(
    State(state): State<AppState>,
    headers: HeaderMap,
    method: Method,
) -> Result<Json<AdminAssignmentPlanPayload>, AppError> {
    require_admin_session(&method, &headers, &state.config)?;

    Ok(Json(AdminAssignmentPlanPayload {
        assignment_plan: create_current_assignment_plan(&state).await?,
    }))
}

pub async fn publish_assignment(
    State(state): State<AppState>,
    headers: HeaderMap,
    method: Method,
) -> Result<Json<AdminAssignmentPlanPayload>, AppError> {
    require_admin_session(&method, &headers, &state.config)?;

    Ok(Json(AdminAssignmentPlanPayload {
        assignment_plan: publish_current_assignment_plan(&state).await?,
    }))
}

pub async fn published_assignments(
    State(state): State<AppState>,
    headers: HeaderMap,
    method: Method,
) -> Result<Json<AdminPublishedAssignmentPlansPayload>, AppError> {
    require_admin_session(&method, &headers, &state.config)?;

    Ok(Json(AdminPublishedAssignmentPlansPayload {
        assignment_plans: get_published_assignment_plans(&state).await?,
    }))
}

fn current_timestamp() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}
