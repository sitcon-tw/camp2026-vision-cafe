use std::sync::Arc;

use mongodb::Database;
use reqwest::Client;

use crate::config::Config;

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<Config>,
    pub db: Database,
    pub http: Client,
}
