use chrono::{DateTime, SecondsFormat, Utc};
use rand::Rng;

use crate::speakers::speaker_config;
use crate::types::{
    AssignmentGroup, PlannedSpeakerAssignment, SpeakerAssignment, SpeakerAssignmentPlan,
    SpeakerAssignmentStatus, SpeakerLoad, SpeakerSessionAssignments, SpeakerSessionLoad,
    StudentSpeakerPreference, TeamAssignments,
};

const UNASSIGNED_REASON_FULL: &str = "所有講者場次皆已額滿";

pub fn create_speaker_assignment_plan(
    preferences: Vec<StudentSpeakerPreference>,
) -> SpeakerAssignmentPlan {
    create_speaker_assignment_plan_with_random(preferences, current_timestamp(), || {
        rand::rng().random::<f64>()
    })
}

pub fn create_speaker_assignment_plan_with_random(
    preferences: Vec<StudentSpeakerPreference>,
    generated_at: String,
    mut random: impl FnMut() -> f64,
) -> SpeakerAssignmentPlan {
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
            count: 0,
        })
        .collect::<Vec<_>>();
    let mut session_loads = speaker_names
        .iter()
        .flat_map(|speaker_name| {
            (1..=config.session_count).map(|session_index| SpeakerSessionLoad {
                count: 0,
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
    let mut assignment_results = vec![None; prioritized_preferences.len()];

    for (priority_index, item) in prioritized_preferences.into_iter().enumerate() {
        let assigned_session_index = if item.preference.preference_order.is_empty() {
            find_random_available_session(&session_loads, &mut random)
        } else {
            find_preferred_available_session(&item.preference.preference_order, &session_loads)
        };

        let Some(assigned_session_index) = assigned_session_index else {
            assignment_results[item.index] = Some(PlannedSpeakerAssignment {
                preference_rank: None,
                priority_order: (priority_index + 1) as u32,
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
        assigned_session.count += 1;

        if let Some(speaker_load) = speaker_loads
            .iter_mut()
            .find(|load| load.speaker_name == assigned_session.speaker_name)
        {
            speaker_load.count += 1;
        }

        assignment_results[item.index] = Some(PlannedSpeakerAssignment {
            preference_rank: get_preference_rank(
                &item.preference.preference_order,
                &assigned_session.speaker_name,
            ),
            priority_order: (priority_index + 1) as u32,
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

    let assignments = assignment_results
        .into_iter()
        .map(|assignment| assignment.expect("each preference must receive an assignment result"))
        .collect::<Vec<_>>();
    let assigned_count = assignments
        .iter()
        .filter(|assignment| assignment.status == SpeakerAssignmentStatus::Assigned)
        .count();
    let total_capacity = speaker_names.len() * config.session_count * config.session_capacity;
    let unassigned_count = assignments.len() - assigned_count;

    SpeakerAssignmentPlan {
        assignments,
        assigned_count,
        generated_at,
        session_capacity: config.session_capacity,
        session_loads,
        sessions_per_speaker: config.session_count,
        speaker_loads,
        total_capacity,
        unassigned_count,
    }
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
            count: session_load.count,
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
            session.count = session.count.max(session.assignments.len());
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

fn find_preferred_available_session(
    preference_order: &[String],
    session_loads: &[SpeakerSessionLoad],
) -> Option<usize> {
    for speaker_name in preference_order {
        let best_session_index = session_loads
            .iter()
            .enumerate()
            .filter(|(_, session_load)| {
                session_load.speaker_name == *speaker_name
                    && session_load.count < speaker_config().session_capacity
            })
            .min_by(|(_, left), (_, right)| {
                left.count
                    .cmp(&right.count)
                    .then(left.session_index.cmp(&right.session_index))
            })
            .map(|(index, _)| index);

        if best_session_index.is_some() {
            return best_session_index;
        }
    }

    None
}

fn find_random_available_session(
    session_loads: &[SpeakerSessionLoad],
    random: &mut impl FnMut() -> f64,
) -> Option<usize> {
    let available_session_indices = session_loads
        .iter()
        .enumerate()
        .filter(|(_, session_load)| session_load.count < speaker_config().session_capacity)
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

#[cfg(test)]
mod tests {
    use crate::speakers::speaker_names;

    use super::*;

    #[test]
    fn prioritizes_earlier_submissions_and_balances_sessions_for_same_speaker() {
        let speaker_names = speaker_names();
        let preferences = vec![
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
        ];

        let plan = create_speaker_assignment_plan_with_random(
            preferences,
            "2026-07-05T11:00:00.000+08:00".to_string(),
            || 0.0,
        );

        assert_eq!(plan.generated_at, "2026-07-05T11:00:00.000+08:00");
        assert_eq!(plan.assignments[0].priority_order, 3);
        assert_eq!(plan.assignments[1].priority_order, 1);
        assert_eq!(plan.assignments[2].priority_order, 2);
        assert_eq!(plan.assignments[0].session_index, Some(1));
        assert_eq!(plan.assignments[1].session_index, Some(1));
        assert_eq!(plan.assignments[2].session_index, Some(2));
        assert_eq!(plan.session_loads[0].count, 2);
        assert_eq!(plan.session_loads[1].count, 1);
    }

    #[test]
    fn uses_next_preferred_speaker_after_a_speaker_reaches_capacity() {
        let speaker_names = speaker_names();
        let first_speaker_capacity =
            speaker_config().session_count * speaker_config().session_capacity;
        let preferences = (0..=first_speaker_capacity)
            .map(|index| {
                preference(
                    &format!("student-{:02}", index + 1),
                    &speaker_names,
                    Some(&format!("2026-07-05T10:{index:02}:00.000+08:00")),
                )
            })
            .collect::<Vec<_>>();

        let plan = create_speaker_assignment_plan_with_random(
            preferences,
            "2026-07-05T11:00:00.000+08:00".to_string(),
            || 0.0,
        );
        let last_assignment = &plan.assignments[first_speaker_capacity];

        assert_eq!(plan.speaker_loads[0].count, first_speaker_capacity);
        assert_eq!(plan.speaker_loads[1].count, 1);
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
        let preferences = (0..=total_capacity)
            .map(|index| {
                preference(
                    &format!("student-{:02}", index + 1),
                    &speaker_names,
                    Some(&format!("2026-07-05T10:{index:02}:00.000+08:00")),
                )
            })
            .collect::<Vec<_>>();

        let plan = create_speaker_assignment_plan_with_random(
            preferences,
            "2026-07-05T11:00:00.000+08:00".to_string(),
            || 0.0,
        );

        assert_eq!(plan.assigned_count, total_capacity);
        assert_eq!(plan.unassigned_count, 1);
        assert_eq!(
            plan.assignments.last().unwrap().status,
            SpeakerAssignmentStatus::Unassigned
        );
        assert_eq!(
            plan.assignments
                .last()
                .unwrap()
                .unassigned_reason
                .as_deref(),
            Some(UNASSIGNED_REASON_FULL)
        );
    }

    #[test]
    fn randomly_assigns_empty_preferences_after_submitted_preferences() {
        let speaker_names = speaker_names();
        let preferences = vec![
            preference("student-1", &[], None),
            preference(
                "student-2",
                &speaker_names,
                Some("2026-07-05T10:01:00.000+08:00"),
            ),
        ];

        let plan = create_speaker_assignment_plan_with_random(
            preferences,
            "2026-07-05T11:00:00.000+08:00".to_string(),
            || 0.99,
        );

        assert_eq!(plan.assignments[0].priority_order, 2);
        assert_eq!(plan.assignments[0].preference_rank, None);
        assert_eq!(
            plan.assignments[0].speaker_name.as_deref(),
            Some(speaker_names[1].as_str())
        );
        assert_eq!(plan.assignments[1].priority_order, 1);
    }

    fn preference(
        student_id: &str,
        preference_order: &[String],
        submitted_at: Option<&str>,
    ) -> StudentSpeakerPreference {
        StudentSpeakerPreference {
            preference_order: preference_order.to_vec(),
            student_id: student_id.to_string(),
            student_name: student_id.to_string(),
            submitted_at: submitted_at.map(str::to_string),
            team_name: "第1組".to_string(),
        }
    }
}
