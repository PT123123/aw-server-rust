use super::*;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::time;
use axum::{
    routing::post,
    Router,
    body::Bytes,
};
use std::net::SocketAddr;
use tower_http::trace::TraceLayer;

struct MockDataProvider;
impl orchestrator::DataProvider for MockDataProvider {
    fn get_data(&self, id: i64) -> Option<aw_inbox_datastore::models::Note> {
        Some(aw_inbox_datastore::models::Note {
            id,
            content: "test".to_string(),
            tags: "[]".to_string(),
            created_at: chrono::Utc::now(),
            updated_at: chrono::Utc::now(),
        })
    }
}

struct MockMerger;
impl receiver::InboxMerger for MockMerger {
    fn apply_note(&self, note: aw_inbox_datastore::models::Note) -> bool {
        println!("Applying note: {}", note.id);
        true
    }
}

struct MockNotifier;
impl receiver::WebUINotifier for MockNotifier {
    fn notify_refresh(&self) {
        println!("Refreshing WebUI");
    }
}

// Helper to start a simple HTTP server that acts as a peer
async fn start_peer_server(port: u16, receiver: Arc<receiver::SyncReceiver>) -> tokio::task::JoinHandle<()> {
    let app = Router::new()
        .route("/sync", post(move |body: Bytes| async move {
            println!("Server received {} bytes", body.len());
            receiver.on_receive_chunk(&body).await;
            "ok"
        }))
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    println!("Starting mock peer server on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    })
}

#[tokio::test]
async fn test_full_sync_flow_with_http() {
    // 1. Setup Components
    let queue_file = std::env::temp_dir().join("test_queue_http.json");
    if queue_file.exists() {
        std::fs::remove_file(&queue_file).unwrap();
    }

    let queue = queue::UpdateQueue::new(queue_file.clone());
    
    // 2. Setup Discovery
    let discovery = Arc::new(Mutex::new(discovery::Discovery::new().unwrap()));
    // Manually insert a peer for testing (skip waiting for mdns in test environment)
    // We will start a server on port 9000
    discovery.lock().unwrap().peers.lock().unwrap().insert("test-peer".to_string(), "127.0.0.1:9000".to_string());

    // 3. Setup Transport (HTTP)
    let transport = Arc::new(http_transport::HttpTransport::new(discovery.clone()));
    
    let provider = Arc::new(MockDataProvider);
    let orchestrator = orchestrator::SyncOrchestrator::new(
        queue.clone(),
        transport,
        provider,
    );

    // 4. Setup Receiver (The "Remote" Peer)
    let merger = Arc::new(MockMerger);
    let notifier = Arc::new(MockNotifier);
    let receiver = Arc::new(receiver::SyncReceiver::new(merger, notifier));
    
    // Start the peer server
    let _server_handle = start_peer_server(9000, receiver.clone()).await;
    
    // Give server time to start
    time::sleep(Duration::from_millis(500)).await;

    // 5. Simulate new data on Local
    orchestrator.on_new_data(100).await;
    
    // 6. Run Orchestrator (Send Logic)
    // We run it in a separate task but for only one cycle to verify
    let orchestrator_task = tokio::spawn(async move {
        orchestrator.run().await;
    });

    // Wait for the orchestration loop to pick up (it runs every 10s by default, 
    // but we can't easily change that constant without refactoring. 
    // For this test, we might need to rely on the fact that run() ticks immediately? 
    // Actually time::interval ticks immediately on first call.
    
    // Let it run for a bit
    time::sleep(Duration::from_secs(1)).await;

    // Verify queue is empty (meaning popped) - actually Orchestrator pops immediately
    // If send is successful, queue items are removed (handled in Orchestrator logic?)
    // Wait... Orchestrator logic in previous turn:
    // "match transport.send()... Ok(_) => info!(...)"
    // It doesn't explicitly remove from queue because pop_batch removes them from VecDeque!
    // And if it fails, it requeues.
    
    // So if successful, queue should be empty (or at least less than before)
    assert_eq!(queue.len().await, 0);

    // Clean up
    orchestrator_task.abort();
}
