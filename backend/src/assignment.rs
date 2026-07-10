use chrono::{DateTime, SecondsFormat, Utc};
use rand::Rng;
use std::collections::HashMap;

use crate::speakers::speaker_config;
use crate::types::{
    AssignmentGroup, ParticipantRole, PlannedSpeakerAssignment, SpeakerAssignment,
    SpeakerAssignmentPlan, SpeakerAssignmentStatus, SpeakerLoad, SpeakerSessionAssignments,
    SpeakerSessionLoad, StudentSpeakerPreference, TeamAssignments,
};

const UNASSIGNED_REASON_FULL: &str = "所有講者場次皆已額滿";

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum AssignmentPlanError {
    #[error("{team_name} 有 {count} 位有效隊輔，每隊必須恰好有 2 位")]
    InvalidCounselorCount { team_name: String, count: usize },
    #[error("{team_name} 有隊輔，但沒有有效學員")]
    CounselorTeamWithoutStudents { team_name: String },
    #[error("隊輔分場至少需要 2 個場次與 1 位講者")]
    InvalidSessionConfiguration,
}

pub fn create_speaker_assignment_plan(
    preferences: Vec<StudentSpeakerPreference>,
) -> Result<SpeakerAssignmentPlan, AssignmentPlanError> {
    create_speaker_assignment_plan_with_random(preferences, current_timestamp(), || {
        rand::rng().random::<f64>()
    })
}

pub fn create_speaker_assignment_plan_with_random(
    preferences: Vec<StudentSpeakerPreference>,
    generated_at: String,
    mut random: impl FnMut() -> f64,
) -> Result<SpeakerAssignmentPlan, AssignmentPlanError> {
    let config = speaker_config();
    let speaker_names = config
        .speakers
        .iter()
        .map(|speaker| speaker.speaker_name.clone())
        .collect::<Vec<_>>();
    let mut speaker_loads = speaker_names
        .iter()
        .map(|speaker_name| SpeakerLoad {
            speaker_name: speaker_name.clone(),
            student_count: 0,
            counselor_count: 0,
        })
        .collect::<Vec<_>>();
    let mut session_loads = speaker_names
        .iter()
        .flat_map(|speaker_name| {
            (1..=config.session_count).map(|session_index| SpeakerSessionLoad {
                student_count: 0,
                counselor_count: 0,
                session_index: session_index as u32,
                session_label: create_session_label(session_index as u32),
                speaker_name: speaker_name.clone(),
            })
        })
        .collect::<Vec<_>>();
    let indexed_preferences = preferences
        .into_iter()
        .enumerate()
        .map(|(index, preference)| IndexedPreference { index, preference })
        .collect::<Vec<_>>();
    let prioritized_preferences = create_prioritized_preferences(indexed_preferences, &mut random);
    validate_counselor_pairs(&prioritized_preferences)?;
    if config.session_count < 2 || speaker_names.is_empty() {
        return Err(AssignmentPlanError::InvalidSessionConfiguration);
    }

    let prioritized_preferences = prioritized_preferences
        .into_iter()
        .enumerate()
        .map(|(priority_index, item)| PrioritizedPreference {
            index: item.index,
            preference: item.preference,
            priority_order: (priority_index + 1) as u32,
        })
        .collect::<Vec<_>>();
    let mut assignment_results = vec![None; prioritized_preferences.len()];
    let (students, counselors): (Vec<_>, Vec<_>) = prioritized_preferences
        .into_iter()
        .partition(|item| item.preference.participant_role == ParticipantRole::Student);

    assign_students(
        students,
        &mut session_loads,
        &mut speaker_loads,
        &mut assignment_results,
        &mut random,
    );
    assign_counselor_pairs(
        counselors,
        &mut session_loads,
        &mut speaker_loads,
        &mut assignment_results,
        &mut random,
    );

    let assignments = assignment_results
        .into_iter()
        .map(|assignment| assignment.expect("each preference must receive an assignment result"))
        .collect::<Vec<_>>();
    let assigned_student_count = count_assignments(
        &assignments,
        ParticipantRole::Student,
        SpeakerAssignmentStatus::Assigned,
    );
    let unassigned_student_count = count_assignments(
        &assignments,
        ParticipantRole::Student,
        SpeakerAssignmentStatus::Unassigned,
    );
    let assigned_counselor_count = count_assignments(
        &assignments,
        ParticipantRole::Counselor,
        SpeakerAssignmentStatus::Assigned,
    );
    let unassigned_counselor_count = count_assignments(
        &assignments,
        ParticipantRole::Counselor,
        SpeakerAssignmentStatus::Unassigned,
    );
    let student_capacity = speaker_names.len() * config.session_count * config.session_capacity;

    Ok(SpeakerAssignmentPlan {
        assignments,
        assigned_student_count,
        assigned_counselor_count,
        generated_at,
        session_capacity: config.session_capacity,
        session_loads,
        sessions_per_speaker: config.session_count,
        speaker_loads,
        student_capacity,
        unassigned_student_count,
        unassigned_counselor_count,
    })
}

fn assign_students(
    students: Vec<PrioritizedPreference>,
    session_loads: &mut [SpeakerSessionLoad],
    speaker_loads: &mut [SpeakerLoad],
    assignment_results: &mut [Option<PlannedSpeakerAssignment>],
    random: &mut impl FnMut() -> f64,
) {
    for item in students {
        let assigned_session_index = if item.preference.preference_order.is_empty() {
            find_random_available_student_session(session_loads, random)
        } else {
            find_preferred_available_student_session(
                &item.preference.preference_order,
                session_loads,
            )
        };

        let Some(assigned_session_index) = assigned_session_index else {
            assignment_results[item.index] = Some(PlannedSpeakerAssignment {
                participant_role: item.preference.participant_role,
                preference_rank: None,
                priority_order: item.priority_order,
                session_index: None,
                session_label: None,
                speaker_name: None,
                status: SpeakerAssignmentStatus::Unassigned,
                student_id: item.preference.student_id,
                student_name: item.preference.student_name,
                submitted_at: item.preference.submitted_at,
                team_name: item.preference.team_name,
                unassigned_reason: Some(UNASSIGNED_REASON_FULL.to_string()),
            });
            continue;
        };

        let assigned_session = &mut session_loads[assigned_session_index];
        assigned_session.student_count += 1;

        if let Some(speaker_load) = speaker_loads
            .iter_mut()
            .find(|load| load.speaker_name == assigned_session.speaker_name)
        {
            speaker_load.student_count += 1;
        }

        assignment_results[item.index] = Some(PlannedSpeakerAssignment {
            participant_role: item.preference.participant_role,
            preference_rank: get_preference_rank(
                &item.preference.preference_order,
                &assigned_session.speaker_name,
            ),
            priority_order: item.priority_order,
            session_index: Some(assigned_session.session_index),
            session_label: Some(assigned_session.session_label.clone()),
            speaker_name: Some(assigned_session.speaker_name.clone()),
            status: SpeakerAssignmentStatus::Assigned,
            student_id: item.preference.student_id,
            student_name: item.preference.student_name,
            submitted_at: item.preference.submitted_at,
            team_name: item.preference.team_name,
            unassigned_reason: None,
        });
    }
}

fn assign_counselor_pairs(
    counselors: Vec<PrioritizedPreference>,
    session_loads: &mut [SpeakerSessionLoad],
    speaker_loads: &mut [SpeakerLoad],
    assignment_results: &mut [Option<PlannedSpeakerAssignment>],
    random: &mut impl FnMut() -> f64,
) {
    let mut teams = Vec::<(String, Vec<PrioritizedPreference>)>::new();
    for counselor in counselors {
        let team_name = counselor.preference.team_name.clone();
        if let Some((_, members)) = teams.iter_mut().find(|(name, _)| *name == team_name) {
            members.push(counselor);
        } else {
            teams.push((team_name, vec![counselor]));
        }
    }

    for (_, pair) in teams {
        let first = &pair[0];
        let second = &pair[1];
        let candidate = create_counselor_pair_candidates(first, second, session_loads, random)
            .into_iter()
            .min_by(compare_counselor_candidates)
            .expect("validated counselor pairs must have assignment candidates");

        for (item, session_load_index) in [
            (first, candidate.first_session_load_index),
            (second, candidate.second_session_load_index),
        ] {
            let assigned_session = &mut session_loads[session_load_index];
            assigned_session.counselor_count += 1;
            if let Some(speaker_load) = speaker_loads
                .iter_mut()
                .find(|load| load.speaker_name == assigned_session.speaker_name)
            {
                speaker_load.counselor_count += 1;
            }

            assignment_results[item.index] = Some(PlannedSpeakerAssignment {
                participant_role: ParticipantRole::Counselor,
                preference_rank: get_preference_rank(
                    &item.preference.preference_order,
                    &assigned_session.speaker_name,
                ),
                priority_order: item.priority_order,
                session_index: Some(assigned_session.session_index),
                session_label: Some(assigned_session.session_label.clone()),
                speaker_name: Some(assigned_session.speaker_name.clone()),
                status: SpeakerAssignmentStatus::Assigned,
                student_id: item.preference.student_id.clone(),
                student_name: item.preference.student_name.clone(),
                submitted_at: item.preference.submitted_at.clone(),
                team_name: item.preference.team_name.clone(),
                unassigned_reason: None,
            });
        }
    }
}

fn validate_counselor_pairs(preferences: &[IndexedPreference]) -> Result<(), AssignmentPlanError> {
    let mut student_teams = Vec::<String>::new();
    let mut counselor_counts = HashMap::<String, usize>::new();

    for item in preferences {
        match item.preference.participant_role {
            ParticipantRole::Student => {
                if !student_teams.contains(&item.preference.team_name) {
                    student_teams.push(item.preference.team_name.clone());
                }
            }
            ParticipantRole::Counselor => {
                *counselor_counts
                    .entry(item.preference.team_name.clone())
                    .or_default() += 1;
            }
        }
    }

    for team_name in &student_teams {
        let count = counselor_counts.get(team_name).copied().unwrap_or_default();
        if count != 2 {
            return Err(AssignmentPlanError::InvalidCounselorCount {
                team_name: team_name.clone(),
                count,
            });
        }
    }

    for team_name in counselor_counts.keys() {
        if !student_teams.contains(team_name) {
            return Err(AssignmentPlanError::CounselorTeamWithoutStudents {
                team_name: team_name.clone(),
            });
        }
    }

    Ok(())
}

fn create_counselor_pair_candidates(
    first: &PrioritizedPreference,
    second: &PrioritizedPreference,
    session_loads: &[SpeakerSessionLoad],
    random: &mut impl FnMut() -> f64,
) -> Vec<CounselorPairCandidate> {
    let mut candidates = Vec::new();

    for (first_index, first_load) in session_loads.iter().enumerate() {
        for (second_index, second_load) in session_loads.iter().enumerate() {
            if first_load.session_index == second_load.session_index {
                continue;
            }

            let preference_cost = counselor_preference_cost(
                &first.preference.preference_order,
                &first_load.speaker_name,
            ) + counselor_preference_cost(
                &second.preference.preference_order,
                &second_load.speaker_name,
            );
            let resulting_loads = session_loads
                .iter()
                .enumerate()
                .map(|(index, load)| {
                    load.counselor_count
                        + usize::from(index == first_index)
                        + usize::from(index == second_index)
                })
                .collect::<Vec<_>>();
            let max_session_load = resulting_loads.iter().copied().max().unwrap_or_default();
            let squared_load_sum = resulting_loads
                .iter()
                .map(|load| load * load)
                .sum::<usize>();

            candidates.push(CounselorPairCandidate {
                first_session_load_index: first_index,
                max_session_load,
                preference_cost,
                second_session_load_index: second_index,
                squared_load_sum,
                tie_break: random(),
            });
        }
    }

    candidates
}

fn compare_counselor_candidates(
    left: &CounselorPairCandidate,
    right: &CounselorPairCandidate,
) -> std::cmp::Ordering {
    left.preference_cost
        .cmp(&right.preference_cost)
        .then(left.max_session_load.cmp(&right.max_session_load))
        .then(left.squared_load_sum.cmp(&right.squared_load_sum))
        .then_with(|| left.tie_break.total_cmp(&right.tie_break))
}

fn counselor_preference_cost(preference_order: &[String], speaker_name: &str) -> usize {
    if preference_order.is_empty() {
        return 0;
    }

    preference_order
        .iter()
        .position(|candidate| candidate == speaker_name)
        .unwrap_or(preference_order.len())
}

fn count_assignments(
    assignments: &[PlannedSpeakerAssignment],
    role: ParticipantRole,
    status: SpeakerAssignmentStatus,
) -> usize {
    assignments
        .iter()
        .filter(|assignment| assignment.participant_role == role && assignment.status == status)
        .count()
}

pub fn create_team_assignments(assignments: &[PlannedSpeakerAssignment]) -> Vec<TeamAssignments> {
    group_assignments_by_team(
        assignments
            .iter()
            .map(to_speaker_assignment)
            .collect::<Vec<_>>(),
    )
}

pub fn create_speaker_session_assignments(
    assignment_plan: &SpeakerAssignmentPlan,
) -> Vec<SpeakerSessionAssignments> {
    group_assignments_by_session(
        &assignment_plan.session_loads,
        assignment_plan
            .assignments
            .iter()
            .map(to_speaker_assignment)
            .collect::<Vec<_>>(),
    )
}

pub fn to_speaker_assignment(assignment: &PlannedSpeakerAssignment) -> SpeakerAssignment {
    SpeakerAssignment {
        participant_role: assignment.participant_role.clone(),
        session_index: assignment.session_index,
        session_label: assignment.session_label.clone(),
        speaker_name: assignment.speaker_name.clone(),
        status: assignment.status.clone(),
        student_id: assignment.student_id.clone(),
        student_name: assignment.student_name.clone(),
        team_name: assignment.team_name.clone(),
    }
}

pub fn group_assignments_by_team<TAssignment>(
    assignments: Vec<TAssignment>,
) -> Vec<AssignmentGroup<TAssignment>>
where
    TAssignment: HasTeamName,
{
    let mut teams = Vec::<AssignmentGroup<TAssignment>>::new();

    for assignment in assignments {
        if let Some(team) = teams
            .iter_mut()
            .find(|team| team.team_name == assignment.team_name())
        {
            team.assignments.push(assignment);
            continue;
        }

        teams.push(AssignmentGroup {
            team_name: assignment.team_name().to_string(),
            assignments: vec![assignment],
        });
    }

    teams
}

pub fn group_assignments_by_session(
    session_loads: &[SpeakerSessionLoad],
    assignments: Vec<SpeakerAssignment>,
) -> Vec<SpeakerSessionAssignments> {
    let mut sessions = session_loads
        .iter()
        .map(|session_load| SpeakerSessionAssignments {
            assignments: Vec::new(),
            student_count: session_load.student_count,
            counselor_count: session_load.counselor_count,
            session_index: session_load.session_index,
            session_label: session_load.session_label.clone(),
            speaker_name: session_load.speaker_name.clone(),
        })
        .collect::<Vec<_>>();

    for assignment in assignments {
        if assignment.status != SpeakerAssignmentStatus::Assigned {
            continue;
        }

        let (Some(speaker_name), Some(session_index)) =
            (&assignment.speaker_name, assignment.session_index)
        else {
            continue;
        };

        if let Some(session) = sessions.iter_mut().find(|session| {
            session.speaker_name == *speaker_name && session.session_index == session_index
        }) {
            session.assignments.push(assignment);
        }
    }

    sessions
}

pub trait HasTeamName {
    fn team_name(&self) -> &str;
}

impl HasTeamName for SpeakerAssignment {
    fn team_name(&self) -> &str {
        &self.team_name
    }
}

impl HasTeamName for PlannedSpeakerAssignment {
    fn team_name(&self) -> &str {
        &self.team_name
    }
}

fn find_preferred_available_student_session(
    preference_order: &[String],
    session_loads: &[SpeakerSessionLoad],
) -> Option<usize> {
    for speaker_name in preference_order {
        let best_session_index = session_loads
            .iter()
            .enumerate()
            .filter(|(_, session_load)| {
                session_load.speaker_name == *speaker_name
                    && session_load.student_count < speaker_config().session_capacity
            })
            .min_by(|(_, left), (_, right)| {
                left.student_count
                    .cmp(&right.student_count)
                    .then(left.session_index.cmp(&right.session_index))
            })
            .map(|(index, _)| index);

        if best_session_index.is_some() {
            return best_session_index;
        }
    }

    None
}

fn find_random_available_student_session(
    session_loads: &[SpeakerSessionLoad],
    random: &mut impl FnMut() -> f64,
) -> Option<usize> {
    let available_session_indices = session_loads
        .iter()
        .enumerate()
        .filter(|(_, session_load)| session_load.student_count < speaker_config().session_capacity)
        .map(|(index, _)| index)
        .collect::<Vec<_>>();

    if available_session_indices.is_empty() {
        return None;
    }

    let random_index = ((random() * available_session_indices.len() as f64).floor() as usize)
        .min(available_session_indices.len() - 1);

    Some(available_session_indices[random_index])
}

fn get_preference_rank(preference_order: &[String], speaker_name: &str) -> Option<u32> {
    preference_order
        .iter()
        .position(|candidate| candidate == speaker_name)
        .map(|index| (index + 1) as u32)
}

fn create_prioritized_preferences(
    indexed_preferences: Vec<IndexedPreference>,
    random: &mut impl FnMut() -> f64,
) -> Vec<IndexedPreference> {
    let mut submitted_preferences = Vec::new();
    let mut unsubmitted_preferences = Vec::new();

    for item in indexed_preferences {
        if submitted_at_time(item.preference.submitted_at.as_deref()).is_some() {
            submitted_preferences.push(item);
        } else {
            unsubmitted_preferences.push(item);
        }
    }

    submitted_preferences.sort_by(|left, right| {
        submitted_at_time(left.preference.submitted_at.as_deref())
            .cmp(&submitted_at_time(right.preference.submitted_at.as_deref()))
            .then(left.index.cmp(&right.index))
    });

    submitted_preferences.extend(shuffle(unsubmitted_preferences, random));
    submitted_preferences
}

fn submitted_at_time(submitted_at: Option<&str>) -> Option<DateTime<Utc>> {
    submitted_at
        .and_then(|value| DateTime::parse_from_rfc3339(value).ok())
        .map(|value| value.with_timezone(&Utc))
}

fn shuffle<TItem>(mut items: Vec<TItem>, random: &mut impl FnMut() -> f64) -> Vec<TItem> {
    for index in (1..items.len()).rev() {
        let random_index = ((random() * (index + 1) as f64).floor() as usize).min(index);
        items.swap(index, random_index);
    }

    items
}

fn create_session_label(session_index: u32) -> String {
    format!("第 {session_index} 場")
}

fn current_timestamp() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}

#[derive(Clone, Debug)]
struct IndexedPreference {
    index: usize,
    preference: StudentSpeakerPreference,
}

#[derive(Clone, Debug)]
struct PrioritizedPreference {
    index: usize,
    preference: StudentSpeakerPreference,
    priority_order: u32,
}

#[derive(Clone, Debug)]
struct CounselorPairCandidate {
    first_session_load_index: usize,
    second_session_load_index: usize,
    preference_cost: usize,
    max_session_load: usize,
    squared_load_sum: usize,
    tie_break: f64,
}

#[cfg(test)]
mod tests {
    use crate::speakers::speaker_names;

    use super::*;

    #[test]
    fn prioritizes_earlier_submissions_and_balances_sessions_for_same_speaker() {
        let speaker_names = speaker_names();
        let preferences = with_counselor_pair(vec![
            preference(
                "student-1",
                &speaker_names,
                Some("2026-07-05T10:03:00.000+08:00"),
            ),
            preference(
                "student-2",
                &speaker_names,
                Some("2026-07-05T10:01:00.000+08:00"),
            ),
            preference(
                "student-3",
                &speaker_names,
                Some("2026-07-05T10:02:00.000+08:00"),
            ),
        ]);

        let plan = create_speaker_assignment_plan_with_random(
            preferences,
            "2026-07-05T11:00:00.000+08:00".to_string(),
            || 0.0,
        )
        .unwrap();

        assert_eq!(plan.generated_at, "2026-07-05T11:00:00.000+08:00");
        assert_eq!(plan.assignments[0].priority_order, 3);
        assert_eq!(plan.assignments[1].priority_order, 1);
        assert_eq!(plan.assignments[2].priority_order, 2);
        assert_eq!(plan.assignments[0].session_index, Some(1));
        assert_eq!(plan.assignments[1].session_index, Some(1));
        assert_eq!(plan.assignments[2].session_index, Some(2));
        assert_eq!(plan.session_loads[0].student_count, 2);
        assert_eq!(plan.session_loads[1].student_count, 1);
    }

    #[test]
    fn uses_next_preferred_speaker_after_a_speaker_reaches_capacity() {
        let speaker_names = speaker_names();
        let first_speaker_capacity =
            speaker_config().session_count * speaker_config().session_capacity;
        let preferences = with_counselor_pair(
            (0..=first_speaker_capacity)
                .map(|index| {
                    preference(
                        &format!("student-{:02}", index + 1),
                        &speaker_names,
                        Some(&format!("2026-07-05T10:{index:02}:00.000+08:00")),
                    )
                })
                .collect::<Vec<_>>(),
        );

        let plan = create_speaker_assignment_plan_with_random(
            preferences,
            "2026-07-05T11:00:00.000+08:00".to_string(),
            || 0.0,
        )
        .unwrap();
        let last_assignment = &plan.assignments[first_speaker_capacity];

        assert_eq!(plan.speaker_loads[0].student_count, first_speaker_capacity);
        assert_eq!(plan.speaker_loads[1].student_count, 1);
        assert_eq!(last_assignment.preference_rank, Some(2));
        assert_eq!(
            last_assignment.speaker_name.as_deref(),
            Some(speaker_names[1].as_str())
        );
    }

    #[test]
    fn marks_students_unassigned_when_all_sessions_are_full() {
        let speaker_names = speaker_names();
        let total_capacity = speaker_names.len()
            * speaker_config().session_count
            * speaker_config().session_capacity;
        let preferences = with_counselor_pair(
            (0..=total_capacity)
                .map(|index| {
                    preference(
                        &format!("student-{:02}", index + 1),
                        &speaker_names,
                        Some(&format!("2026-07-05T10:{index:02}:00.000+08:00")),
                    )
                })
                .collect::<Vec<_>>(),
        );

        let plan = create_speaker_assignment_plan_with_random(
            preferences,
            "2026-07-05T11:00:00.000+08:00".to_string(),
            || 0.0,
        )
        .unwrap();

        assert_eq!(plan.assigned_student_count, total_capacity);
        assert_eq!(plan.unassigned_student_count, 1);
        assert_eq!(
            plan.assignments[total_capacity].status,
            SpeakerAssignmentStatus::Unassigned
        );
        assert_eq!(
            plan.assignments[total_capacity]
                .unassigned_reason
                .as_deref(),
            Some(UNASSIGNED_REASON_FULL)
        );
    }

    #[test]
    fn randomly_assigns_empty_preferences_after_submitted_preferences() {
        let speaker_names = speaker_names();
        let preferences = with_counselor_pair(vec![
            preference("student-1", &[], None),
            preference(
                "student-2",
                &speaker_names,
                Some("2026-07-05T10:01:00.000+08:00"),
            ),
        ]);

        let plan = create_speaker_assignment_plan_with_random(
            preferences,
            "2026-07-05T11:00:00.000+08:00".to_string(),
            || 0.99,
        )
        .unwrap();

        assert_eq!(plan.assignments[0].priority_order, 4);
        assert_eq!(plan.assignments[0].preference_rank, None);
        assert_eq!(
            plan.assignments[0].speaker_name.as_deref(),
            Some(speaker_names[1].as_str())
        );
        assert_eq!(plan.assignments[1].priority_order, 1);
    }

    #[test]
    fn assigns_same_team_counselors_to_different_sessions() {
        let speaker_names = speaker_names();
        let preferences = vec![
            preference("student-1", &speaker_names, Some("2026-07-05T10:00:00Z")),
            counselor_preference(
                "counselor-1",
                "第1組",
                &speaker_names,
                Some("2026-07-05T10:01:00Z"),
            ),
            counselor_preference(
                "counselor-2",
                "第1組",
                &speaker_names,
                Some("2026-07-05T10:02:00Z"),
            ),
        ];

        let plan = create_speaker_assignment_plan_with_random(
            preferences,
            "2026-07-05T11:00:00Z".to_string(),
            || 0.0,
        )
        .unwrap();

        assert_ne!(
            plan.assignments[1].session_index,
            plan.assignments[2].session_index
        );
        assert_eq!(
            plan.assignments[1].speaker_name,
            plan.assignments[2].speaker_name
        );
        assert_eq!(plan.assignments[1].preference_rank, Some(1));
        assert_eq!(plan.assignments[2].preference_rank, Some(1));
    }

    #[test]
    fn counselors_do_not_consume_student_capacity() {
        let speaker_names = speaker_names();
        let total_capacity = speaker_names.len()
            * speaker_config().session_count
            * speaker_config().session_capacity;
        let preferences = with_counselor_pairs_for_teams(
            (0..total_capacity)
                .map(|index| {
                    preference_for_team(
                        &format!("student-{index:02}"),
                        &format!("第{}組", index % 9 + 1),
                        &speaker_names,
                        Some(&format!("2026-07-05T10:{index:02}:00Z")),
                    )
                })
                .collect(),
            9,
        );

        let plan = create_speaker_assignment_plan_with_random(
            preferences,
            "2026-07-05T11:00:00Z".to_string(),
            || 0.0,
        )
        .unwrap();

        assert_eq!(plan.assigned_student_count, total_capacity);
        assert_eq!(plan.unassigned_student_count, 0);
        assert_eq!(plan.assigned_counselor_count, 18);
        assert_eq!(plan.unassigned_counselor_count, 0);
        assert!(
            plan.session_loads
                .iter()
                .all(|load| load.student_count <= speaker_config().session_capacity)
        );
        for team_index in 1..=9 {
            let sessions = plan
                .assignments
                .iter()
                .filter(|assignment| {
                    assignment.participant_role == ParticipantRole::Counselor
                        && assignment.team_name == format!("第{team_index}組")
                })
                .map(|assignment| assignment.session_index)
                .collect::<Vec<_>>();
            assert_eq!(sessions.len(), 2);
            assert_ne!(sessions[0], sessions[1]);
        }
    }

    #[test]
    fn rejects_teams_without_exactly_two_counselors() {
        let speaker_names = speaker_names();

        for counselor_count in [0, 1, 3] {
            let mut preferences = vec![preference(
                "student-1",
                &speaker_names,
                Some("2026-07-05T10:00:00Z"),
            )];
            preferences.extend((0..counselor_count).map(|index| {
                counselor_preference(
                    &format!("counselor-{index}"),
                    "第1組",
                    &speaker_names,
                    Some("2026-07-05T10:01:00Z"),
                )
            }));

            let error = create_speaker_assignment_plan_with_random(
                preferences,
                "2026-07-05T11:00:00Z".to_string(),
                || 0.0,
            )
            .unwrap_err();

            assert_eq!(
                error,
                AssignmentPlanError::InvalidCounselorCount {
                    team_name: "第1組".to_string(),
                    count: counselor_count,
                }
            );
        }
    }

    #[test]
    fn rejects_counselors_without_a_student_team() {
        let speaker_names = speaker_names();
        let mut preferences = with_counselor_pair(vec![preference(
            "student-1",
            &speaker_names,
            Some("2026-07-05T10:00:00Z"),
        )]);
        preferences.extend([
            counselor_preference(
                "counselor-1",
                "第2組",
                &speaker_names,
                Some("2026-07-05T10:01:00Z"),
            ),
            counselor_preference(
                "counselor-2",
                "第2組",
                &speaker_names,
                Some("2026-07-05T10:02:00Z"),
            ),
        ]);

        let error = create_speaker_assignment_plan_with_random(
            preferences,
            "2026-07-05T11:00:00Z".to_string(),
            || 0.0,
        )
        .unwrap_err();

        assert_eq!(
            error,
            AssignmentPlanError::CounselorTeamWithoutStudents {
                team_name: "第2組".to_string(),
            }
        );
    }

    fn preference(
        student_id: &str,
        preference_order: &[String],
        submitted_at: Option<&str>,
    ) -> StudentSpeakerPreference {
        preference_for_team(student_id, "第1組", preference_order, submitted_at)
    }

    fn preference_for_team(
        student_id: &str,
        team_name: &str,
        preference_order: &[String],
        submitted_at: Option<&str>,
    ) -> StudentSpeakerPreference {
        StudentSpeakerPreference {
            participant_role: ParticipantRole::Student,
            preference_order: preference_order.to_vec(),
            student_id: student_id.to_string(),
            student_name: student_id.to_string(),
            submitted_at: submitted_at.map(str::to_string),
            team_name: team_name.to_string(),
        }
    }

    fn counselor_preference(
        student_id: &str,
        team_name: &str,
        preference_order: &[String],
        submitted_at: Option<&str>,
    ) -> StudentSpeakerPreference {
        StudentSpeakerPreference {
            participant_role: ParticipantRole::Counselor,
            preference_order: preference_order.to_vec(),
            student_id: student_id.to_string(),
            student_name: student_id.to_string(),
            submitted_at: submitted_at.map(str::to_string),
            team_name: team_name.to_string(),
        }
    }

    fn with_counselor_pair(
        preferences: Vec<StudentSpeakerPreference>,
    ) -> Vec<StudentSpeakerPreference> {
        with_counselor_pairs_for_teams(preferences, 1)
    }

    fn with_counselor_pairs_for_teams(
        mut preferences: Vec<StudentSpeakerPreference>,
        team_count: usize,
    ) -> Vec<StudentSpeakerPreference> {
        let speaker_names = speaker_names();
        for team_index in 1..=team_count {
            for counselor_index in 1..=2 {
                preferences.push(counselor_preference(
                    &format!("counselor-{team_index}-{counselor_index}"),
                    &format!("第{team_index}組"),
                    &speaker_names,
                    Some(&format!(
                        "2026-07-05T10:59:0{}.{}Z",
                        team_index - 1,
                        counselor_index
                    )),
                ));
            }
        }
        preferences
    }
}
