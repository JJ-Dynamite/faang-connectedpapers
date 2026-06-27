use axum::{
    routing::{get, post},
    Router,
    Json,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{CorsLayer, Any};
use tracing_subscriber;

#[derive(Serialize)]
struct HealthResponse {
    status: String,
    service: String,
    version: String,
}

#[derive(Serialize)]
struct ApiResponse<T: Serialize> {
    success: bool,
    data: Option<T>,
    error: Option<String>,
}

#[derive(Serialize)]
struct GraphNode {
    id: String,
    title: String,
    authors: String,
    year: u32,
    citations: u32,
    cluster: String,
    x: f32,
    y: f32,
}

#[derive(Serialize)]
struct GraphEdge {
    source: String,
    target: String,
    weight: f32,
}

#[derive(Serialize)]
struct ResearchGraph {
    nodes: Vec<GraphNode>,
    edges: Vec<GraphEdge>,
    clusters: Vec<String>,
}

#[derive(Deserialize)]
struct VisualizeRequest {
    paper_id: String,
    depth: Option<u32>,
}

async fn health_check() -> impl IntoResponse {
    Json(HealthResponse {
        status: "healthy".to_string(),
        service: "Visualize and map research".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

async fn root() -> impl IntoResponse {
    Json(ApiResponse::<()> {
        success: true,
        data: None,
        error: None,
    })
}

async fn visualize(Json(req): Json<VisualizeRequest>) -> impl IntoResponse {
    let graph = ResearchGraph {
        nodes: vec![
            GraphNode {
                id: "1".to_string(),
                title: "Central Paper".to_string(),
                authors: "Author A et al.".to_string(),
                year: 2020,
                citations: 500,
                cluster: "Core".to_string(),
                x: 0.5,
                y: 0.5,
            },
            GraphNode {
                id: "2".to_string(),
                title: "Related Work 1".to_string(),
                authors: "Author B".to_string(),
                year: 2019,
                citations: 200,
                cluster: "Cluster A".to_string(),
                x: 0.3,
                y: 0.4,
            },
            GraphNode {
                id: "3".to_string(),
                title: "Related Work 2".to_string(),
                authors: "Author C".to_string(),
                year: 2021,
                citations: 150,
                cluster: "Cluster B".to_string(),
                x: 0.7,
                y: 0.6,
            },
        ],
        edges: vec![
            GraphEdge { source: "1".to_string(), target: "2".to_string(), weight: 0.8 },
            GraphEdge { source: "1".to_string(), target: "3".to_string(), weight: 0.6 },
            GraphEdge { source: "2".to_string(), target: "3".to_string(), weight: 0.3 },
        ],
        clusters: vec!["Core".to_string(), "Cluster A".to_string(), "Cluster B".to_string()],
    };

    Json(ApiResponse {
        success: true,
        data: Some(graph),
        error: None,
    })
}

async fn get_recommendations(Json(req): Json<VisualizeRequest>) -> impl IntoResponse {
    let recommendations = vec![
        serde_json::json!({
            "title": "Highly Cited Follow-up",
            "reason": "Cited by 89% of papers in this graph",
            "relevance_score": 0.95
        }),
        serde_json::json!({
            "title": "Recent Breakthrough",
            "reason": "Published in 2024 with high citation rate",
            "relevance_score": 0.88
        }),
    ];

    Json(ApiResponse {
        success: true,
        data: Some(recommendations),
        error: None,
    })
}

async fn get_stats() -> impl IntoResponse {
    Json(ApiResponse {
        success: true,
        data: Some(serde_json::json!({
            "total_papers_mapped": 8901234,
            "connections_found": 23456789,
            "graphs_generated": 345678,
            "clusters_identified": 12345
        })),
        error: None,
    })
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(health_check))
        .route("/api/visualize", post(visualize))
        .route("/api/recommendations", post(get_recommendations))
        .route("/api/stats", get(get_stats))
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001")
        .await
        .unwrap();

    tracing::info!("Visualize and map research backend running on port 3001");
    axum::serve(listener, app).await.unwrap();
}
