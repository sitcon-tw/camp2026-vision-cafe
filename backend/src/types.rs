use mongodb::bson::oid::ObjectId;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ParticipantRole {
    #[default]
    Student,
    Counselor,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AuthenticatedStudent {
    #[serde(default)]
    pub participant_role: ParticipantRole,
    pub student_id: String,
    pub student_name: String,
    pub team_id: String,
    pub team_name: String,
    pub github_username: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AdminFlowControls {
    pub speaker_preference_selection_open: bool,
    pub assignment_lookup_open: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct StudentSpeakerPreference {
    #[serde(default)]
    pub participant_role: ParticipantRole,
    pub student_id: String,
    pub student_name: String,
    pub team_name: String,
    pub preference_order: Vec<String>,
    pub submitted_at: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SpeakerAssignment {
    #[serde(default)]
    pub participant_role: ParticipantRole,
    pub session_index: Option<u32>,
    pub session_label: Option<String>,
    pub status: SpeakerAssignmentStatus,
    pub student_id: String,
    pub student_name: String,
    pub speaker_name: Option<String>,
    pub team_name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PlannedSpeakerAssignment {
    #[serde(default)]
    pub participant_role: ParticipantRole,
    pub session_index: Option<u32>,
    pub session_label: Option<String>,
    pub status: SpeakerAssignmentStatus,
    pub student_id: String,
    pub student_name: String,
    pub speaker_name: Option<String>,
    pub team_name: String,
    pub preference_rank: Option<u32>,
    pub priority_order: u32,
    pub submitted_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unassigned_reason: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SpeakerAssignmentStatus {
    Assigned,
    Unassigned,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SpeakerAssignmentPlan {
    pub assignments: Vec<PlannedSpeakerAssignment>,
    #[serde(alias = "assignedCount")]
    pub assigned_student_count: usize,
    #[serde(default)]
    pub assigned_counselor_count: usize,
    pub generated_at: String,
    pub session_capacity: usize,
    pub session_loads: Vec<SpeakerSessionLoad>,
    pub sessions_per_speaker: usize,
    pub speaker_loads: Vec<SpeakerLoad>,
    #[serde(alias = "totalCapacity")]
    pub student_capacity: usize,
    #[serde(alias = "unassignedCount")]
    pub unassigned_student_count: usize,
    #[serde(default)]
    pub unassigned_counselor_count: usize,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SpeakerLoad {
    pub speaker_name: String,
    #[serde(alias = "count")]
    pub student_count: usize,
    #[serde(default)]
    pub counselor_count: usize,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SpeakerSessionLoad {
    #[serde(alias = "count")]
    pub student_count: usize,
    #[serde(default)]
    pub counselor_count: usize,
    pub session_index: u32,
    pub session_label: String,
    pub speaker_name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AssignmentGroup<TAssignment> {
    pub assignments: Vec<TAssignment>,
    pub team_name: String,
}

pub type TeamAssignments = AssignmentGroup<SpeakerAssignment>;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SpeakerSessionAssignments<TAssignment = SpeakerAssignment> {
    pub assignments: Vec<TAssignment>,
    #[serde(alias = "count")]
    pub student_count: usize,
    #[serde(default)]
    pub counselor_count: usize,
    pub session_index: u32,
    pub session_label: String,
    pub speaker_name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(tag = "state", rename_all = "camelCase")]
pub enum LookupPayload {
    #[serde(rename = "closed")]
    Closed,
    #[serde(rename = "empty")]
    Empty,
    #[serde(rename = "ready")]
    Ready {
        generated_at: String,
        sessions: Vec<SpeakerSessionAssignments>,
        teams: Vec<TeamAssignments>,
    },
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentSelectionPayload {
    pub flow_controls: AdminFlowControls,
    pub preference: StudentSpeakerPreference,
    pub student: AuthenticatedStudent,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminPreferencesPayload {
    pub preferences: Vec<StudentSpeakerPreference>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminAssignmentPlanPayload {
    pub assignment_plan: SpeakerAssignmentPlan,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishedAssignmentPlan {
    #[serde(flatten)]
    pub assignment_plan: SpeakerAssignmentPlan,
    pub id: String,
    pub is_active: bool,
    pub published_at: String,
    pub status: PublishedAssignmentStatus,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum PublishedAssignmentStatus {
    Published,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminPublishedAssignmentPlansPayload {
    pub assignment_plans: Vec<PublishedAssignmentPlan>,
}

#[derive(Clone, Debug, Serialize)]
pub struct OkPayload {
    pub ok: bool,
}

#[derive(Clone, Debug, Serialize)]
pub struct ApiErrorPayload {
    pub error: String,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowControlsUpdate {
    pub speaker_preference_selection_open: bool,
    pub assignment_lookup_open: bool,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentPreferenceSubmit {
    pub preference_order: Vec<String>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminPreferenceUpdate {
    pub preference_order: Vec<String>,
    pub submitted_at: Option<String>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct AdminLoginRequest {
    pub password: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PreferenceDocument {
    #[serde(rename = "_id")]
    pub id: String,
    pub github_username: String,
    #[serde(default)]
    pub participant_role: ParticipantRole,
    pub preference_order: Vec<String>,
    pub student_id: String,
    pub student_name: String,
    pub submitted_at: Option<String>,
    pub team_id: String,
    pub team_name: String,
    pub updated_at: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsDocument {
    #[serde(rename = "_id")]
    pub id: String,
    pub assignment_lookup_open: bool,
    pub speaker_preference_selection_open: bool,
    pub updated_at: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AssignmentPlanDocument {
    #[serde(rename = "_id", skip_serializing_if = "Option::is_none")]
    pub id: Option<ObjectId>,
    #[serde(flatten)]
    pub assignment_plan: SpeakerAssignmentPlan,
    pub published_at: String,
    pub status: PublishedAssignmentStatus,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_legacy_assignment_plan_counts_as_student_counts() {
        let plan = serde_json::from_value::<SpeakerAssignmentPlan>(serde_json::json!({
            "assignments": [],
            "assignedCount": 1,
            "generatedAt": "2026-07-10T00:00:00Z",
            "sessionCapacity": 12,
            "sessionLoads": [{
                "count": 1,
                "sessionIndex": 1,
                "sessionLabel": "第 1 場",
                "speakerName": "講者"
            }],
            "sessionsPerSpeaker": 2,
            "speakerLoads": [{
                "speakerName": "講者",
                "count": 1
            }],
            "totalCapacity": 48,
            "unassignedCount": 0
        }))
        .unwrap();

        assert_eq!(plan.assigned_student_count, 1);
        assert_eq!(plan.assigned_counselor_count, 0);
        assert_eq!(plan.student_capacity, 48);
        assert_eq!(plan.session_loads[0].student_count, 1);
        assert_eq!(plan.session_loads[0].counselor_count, 0);
    }
}
