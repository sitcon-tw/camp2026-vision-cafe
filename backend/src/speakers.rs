use serde::Deserialize;
use std::sync::LazyLock;

const SPEAKER_CONFIG_JSON: &str = include_str!("../shared/speakers.json");

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpeakerConfig {
    pub session_capacity: usize,
    pub session_count: usize,
    pub speakers: Vec<Speaker>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Speaker {
    pub speaker_name: String,
}

static SPEAKER_CONFIG: LazyLock<SpeakerConfig> = LazyLock::new(|| {
    serde_json::from_str(SPEAKER_CONFIG_JSON).expect("shared speaker config must be valid JSON")
});

pub fn speaker_config() -> &'static SpeakerConfig {
    &SPEAKER_CONFIG
}

pub fn speaker_names() -> Vec<String> {
    speaker_config()
        .speakers
        .iter()
        .map(|speaker| speaker.speaker_name.clone())
        .collect()
}
