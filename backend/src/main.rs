mod api;
mod assignment;
mod auth;
mod config;
mod error;
mod oauth;
mod repository;
mod roster;
mod speakers;
mod state;
mod types;
mod validation;

use std::{sync::Arc, time::Duration};

use axum::{
    Router,
    routing::{get, post, put},
};
use mongodb::{Client as MongoClient, options::ClientOptions};
use tower_http::{
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::{config::Config, state::AppState};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    dotenvy::from_filename(".env.local").ok();

    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "vision_cafe_api=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Arc::new(Config::from_env()?);
    let mut mongo_options = ClientOptions::parse(&config.mongodb_uri).await?;
    mongo_options.server_selection_timeout = Some(Duration::from_secs(5));
    let mongo_client = MongoClient::with_options(mongo_options)?;
    let db = mongo_client.database(&config.mongodb_db);
    let state = AppState {
        config: Arc::clone(&config),
        db,
        http: reqwest::Client::new(),
    };
    let app = router(state);
    let listener = tokio::net::TcpListener::bind(config.listen_addr).await?;

    tracing::info!("serving vision cafe api on {}", config.listen_addr);
    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

fn router(state: AppState) -> Router {
    let api_router = Router::new()
        .route("/lookup", get(api::lookup))
        .route("/student/me", get(api::student_me))
        .route("/student/preferences", put(api::update_student_preferences))
        .route("/admin/login", post(api::admin_login))
        .route(
            "/admin/flow-controls",
            get(api::admin_flow_controls).put(api::update_admin_flow_controls),
        )
        .route("/admin/preferences", get(api::admin_preferences))
        .route(
            "/admin/preferences/{student_id}",
            put(api::update_admin_preference),
        )
        .route("/admin/assignments/dry-run", post(api::dry_run_assignment))
        .route("/admin/assignments/publish", post(api::publish_assignment))
        .route(
            "/admin/assignments/published",
            get(api::published_assignments),
        )
        .route("/auth/github/start", get(oauth::start_github_oauth))
        .route("/auth/github/callback", get(oauth::github_callback))
        .route("/auth/logout", post(oauth::logout))
        .with_state(state.clone());

    let index_file = state.config.static_dir.join("index.html");
    let static_files =
        ServeDir::new(&state.config.static_dir).not_found_service(ServeFile::new(index_file));

    Router::new()
        .nest("/api", api_router)
        .fallback_service(static_files)
        .layer(TraceLayer::new_for_http())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}
