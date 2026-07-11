use futures_util::TryStreamExt;
use mongodb::{Collection, bson::doc};

use crate::{
    assignment::{
        create_speaker_assignment_plan, create_speaker_session_assignments, create_team_assignments,
    },
    error::AppError,
    roster::get_roster_students,
    state::AppState,
    types::{
        AdminFlowControls, AssignmentPlanDocument, AuthenticatedStudent, LookupPayload,
        PreferenceDocument, PublishedAssignmentPlan, PublishedAssignmentStatus, SettingsDocument,
        SpeakerAssignmentPlan, StudentSelectionPayload, StudentSpeakerPreference,
    },
};

const FLOW_CONTROLS_ID: &str = "flow-controls";

pub async fn get_flow_controls(state: &AppState) -> Result<AdminFlowControls, AppError> {
    let document = settings_collection(state)
        .find_one(doc! { "_id": FLOW_CONTROLS_ID })
        .await?;

    Ok(document
        .map(|document| AdminFlowControls {
            assignment_lookup_open: document.assignment_lookup_open,
            speaker_preference_selection_open: document.speaker_preference_selection_open,
        })
        .unwrap_or_else(default_flow_controls))
}

pub async fn update_flow_controls(
    state: &AppState,
    updates: AdminFlowControls,
) -> Result<AdminFlowControls, AppError> {
    let document = SettingsDocument {
        id: FLOW_CONTROLS_ID.to_string(),
        assignment_lookup_open: updates.assignment_lookup_open,
        speaker_preference_selection_open: updates.speaker_preference_selection_open,
        updated_at: current_timestamp(),
    };

    settings_collection(state)
        .replace_one(doc! { "_id": FLOW_CONTROLS_ID }, document)
        .upsert(true)
        .await?;

    Ok(updates)
}

pub async fn get_student_selection_payload(
    state: &AppState,
    student: &AuthenticatedStudent,
) -> Result<StudentSelectionPayload, AppError> {
    let flow_controls = get_flow_controls(state).await?;
    let preference = get_student_preference(state, student).await?;

    Ok(StudentSelectionPayload {
        flow_controls,
        preference,
        student: student.clone(),
    })
}

pub async fn get_student_preference(
    state: &AppState,
    student: &AuthenticatedStudent,
) -> Result<StudentSpeakerPreference, AppError> {
    let document = preferences_collection(state)
        .find_one(doc! { "_id": &student.student_id })
        .await?;

    Ok(to_student_preference(student, document.as_ref()))
}

pub async fn get_admin_preferences(
    state: &AppState,
) -> Result<Vec<StudentSpeakerPreference>, AppError> {
    let roster_students = get_roster_students(&state.http, &state.config).await?;
    let student_ids = roster_students
        .iter()
        .map(|student| student.student_id.clone())
        .collect::<Vec<_>>();
    let documents = preferences_collection(state)
        .find(doc! { "_id": { "$in": student_ids } })
        .await?
        .try_collect::<Vec<_>>()
        .await?;

    Ok(roster_students
        .iter()
        .map(|student| {
            let document = documents
                .iter()
                .find(|document| document.id == student.student_id);
            to_student_preference(student, document)
        })
        .collect())
}

pub async fn ensure_student_profile(
    state: &AppState,
    student: &AuthenticatedStudent,
) -> Result<(), AppError> {
    let existing_preference = get_student_preference(state, student).await?;

    save_student_preference(
        state,
        student,
        existing_preference.preference_order,
        existing_preference.submitted_at,
    )
    .await
}

pub async fn save_student_preference(
    state: &AppState,
    student: &AuthenticatedStudent,
    preference_order: Vec<String>,
    submitted_at: Option<String>,
) -> Result<(), AppError> {
    let document = PreferenceDocument {
        github_username: student.github_username.clone(),
        id: student.student_id.clone(),
        participant_role: student.participant_role.clone(),
        preference_order,
        student_id: student.student_id.clone(),
        student_name: student.student_name.clone(),
        submitted_at,
        team_id: student.team_id.clone(),
        team_name: student.team_name.clone(),
        updated_at: current_timestamp(),
    };

    preferences_collection(state)
        .replace_one(doc! { "_id": &student.student_id }, document)
        .upsert(true)
        .await?;

    Ok(())
}

pub async fn clear_all_student_preferences(state: &AppState) -> Result<(), AppError> {
    preferences_collection(state).delete_many(doc! {}).await?;

    Ok(())
}

pub async fn create_current_assignment_plan(
    state: &AppState,
) -> Result<SpeakerAssignmentPlan, AppError> {
    create_speaker_assignment_plan(get_admin_preferences(state).await?)
        .map_err(|error| AppError::UnprocessableEntity(error.to_string()))
}

pub async fn publish_current_assignment_plan(
    state: &AppState,
) -> Result<SpeakerAssignmentPlan, AppError> {
    let assignment_plan = create_current_assignment_plan(state).await?;
    let document = AssignmentPlanDocument {
        assignment_plan: assignment_plan.clone(),
        id: None,
        published_at: current_timestamp(),
        status: PublishedAssignmentStatus::Published,
    };

    assignment_plans_collection(state)
        .insert_one(document)
        .await?;

    Ok(assignment_plan)
}

pub async fn get_published_assignment_plans(
    state: &AppState,
) -> Result<Vec<PublishedAssignmentPlan>, AppError> {
    let documents = assignment_plans_collection(state)
        .find(doc! { "status": "published" })
        .sort(doc! { "publishedAt": -1 })
        .await?
        .try_collect::<Vec<_>>()
        .await?;

    Ok(documents
        .into_iter()
        .enumerate()
        .map(|(index, document)| PublishedAssignmentPlan {
            assignment_plan: document.assignment_plan,
            id: document
                .id
                .map(|id| id.to_hex())
                .unwrap_or_else(|| document.published_at.clone()),
            is_active: index == 0,
            published_at: document.published_at,
            status: document.status,
        })
        .collect())
}

pub async fn get_lookup_payload(state: &AppState) -> Result<LookupPayload, AppError> {
    let flow_controls = get_flow_controls(state).await?;

    if !flow_controls.assignment_lookup_open {
        return Ok(LookupPayload::Closed);
    }

    let Some(assignment_plan) = get_latest_published_assignment_plan(state).await? else {
        return Ok(LookupPayload::Empty);
    };

    Ok(LookupPayload::Ready {
        generated_at: assignment_plan.generated_at.clone(),
        sessions: create_speaker_session_assignments(&assignment_plan),
        teams: create_team_assignments(&assignment_plan.assignments),
    })
}

async fn get_latest_published_assignment_plan(
    state: &AppState,
) -> Result<Option<SpeakerAssignmentPlan>, AppError> {
    Ok(assignment_plans_collection(state)
        .find_one(doc! { "status": "published" })
        .sort(doc! { "publishedAt": -1 })
        .await?
        .map(|document| document.assignment_plan))
}

fn to_student_preference(
    student: &AuthenticatedStudent,
    document: Option<&PreferenceDocument>,
) -> StudentSpeakerPreference {
    let submitted_at = document.and_then(|document| document.submitted_at.clone());

    StudentSpeakerPreference {
        participant_role: student.participant_role.clone(),
        preference_order: if submitted_at.is_some() {
            document
                .map(|document| document.preference_order.clone())
                .unwrap_or_default()
        } else {
            Vec::new()
        },
        student_id: student.student_id.clone(),
        student_name: student.student_name.clone(),
        submitted_at,
        team_name: student.team_name.clone(),
    }
}

fn default_flow_controls() -> AdminFlowControls {
    AdminFlowControls {
        assignment_lookup_open: false,
        speaker_preference_selection_open: true,
    }
}

fn preferences_collection(state: &AppState) -> Collection<PreferenceDocument> {
    state.db.collection("preferences")
}

fn settings_collection(state: &AppState) -> Collection<SettingsDocument> {
    state.db.collection("settings")
}

fn assignment_plans_collection(state: &AppState) -> Collection<AssignmentPlanDocument> {
    state.db.collection("assignmentPlans")
}

fn current_timestamp() -> String {
    chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true)
}
