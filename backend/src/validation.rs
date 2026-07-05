use std::collections::HashSet;

use chrono::DateTime;

use crate::{error::AppError, speakers::speaker_names};

pub fn validate_speaker_preference_order(preference_order: &[String]) -> bool {
    let speaker_names = speaker_names();
    let expected = speaker_names.iter().collect::<HashSet<_>>();
    let received = preference_order.iter().collect::<HashSet<_>>();

    preference_order.len() == speaker_names.len()
        && received.len() == speaker_names.len()
        && received == expected
}

pub fn validate_submitted_at(value: &Option<String>) -> Result<(), AppError> {
    if let Some(value) = value {
        DateTime::parse_from_rfc3339(value)
            .map_err(|_| AppError::invalid_payload("Invalid preference payload"))?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use crate::speakers::speaker_names;

    use super::validate_speaker_preference_order;

    #[test]
    fn accepts_exactly_the_configured_speakers_in_any_order() {
        let speaker_names = speaker_names();
        let mut reversed = speaker_names.clone();
        reversed.reverse();

        assert!(validate_speaker_preference_order(&speaker_names));
        assert!(validate_speaker_preference_order(&reversed));
    }

    #[test]
    fn rejects_duplicate_missing_and_unknown_speakers() {
        let speaker_names = speaker_names();
        let first_speaker = speaker_names[0].clone();

        assert!(!validate_speaker_preference_order(&[]));
        assert!(!validate_speaker_preference_order(&[
            first_speaker.clone(),
            first_speaker.clone(),
        ]));
        assert!(!validate_speaker_preference_order(&[first_speaker]));
        assert!(!validate_speaker_preference_order(&[
            "不存在的講者".to_string()
        ]));
    }
}
