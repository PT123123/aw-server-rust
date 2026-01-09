use clap::Parser;
use log::{info, warn};
use aw_models::Event;
use chrono::Utc;
use std::time::Duration as StdDuration;
use serde_json::json;

#[derive(Parser)]
#[clap(version = "0.1", author = "Your Name")]
struct Opts {
    #[clap(long, default_value = "http://localhost:5600")]
    server_url: String,

    #[clap(long, default_value = "/tmp/aw-sync-dump")]
    sync_dir: String,
}

// Mocking aw-inbox-rust
struct InboxClient {
    base_url: String,
}

impl InboxClient {
    fn new(base_url: String) -> Self {
        Self { base_url }
    }

    // Mock interface: getDumpInbox
    // In reality, this might query aw-inbox-rust endpoints
    fn get_dump_inbox(&self) -> Result<Vec<Event>, String> {
        info!("Fetching dump from inbox at {}...", self.base_url);
        
        // Simulating network delay
        std::thread::sleep(StdDuration::from_millis(500));

        // Mock data
        let mut data_map = serde_json::Map::new();
        data_map.insert("label".to_string(), json!("demo_inbox_data"));
        data_map.insert("source".to_string(), json!("aw-inbox-rust"));

        let event = Event {
            id: Some(1),
            timestamp: Utc::now(),
            duration: chrono::Duration::seconds(60),
            data: data_map,
        };

        Ok(vec![event])
    }
}

// Mocking aw-sync
struct SyncClient {
    sync_dir: String,
}

impl SyncClient {
    fn new(sync_dir: String) -> Self {
        Self { sync_dir }
    }

    // Mock interface: send
    // In reality, this would likely push to a sync folder or remote
    fn send(&self, events: &[Event]) -> Result<(), String> {
        info!("Sending {} events to sync dir: {}", events.len(), self.sync_dir);
        
        // Simulating sync process
        std::thread::sleep(StdDuration::from_millis(500));

        for event in events {
             info!(" - Synced event ID {:?} at {}", event.id, event.timestamp);
        }
        
        Ok(())
    }
}

fn main() {
    // Initialize logger
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let opts = Opts::parse();

    info!("Starting aw-dump...");
    info!("Target Server: {}", opts.server_url);
    info!("Sync Directory: {}", opts.sync_dir);

    let inbox = InboxClient::new(opts.server_url.clone());
    let sync = SyncClient::new(opts.sync_dir.clone());

    // 1. Pull data from aw-inbox-rust (mock)
    match inbox.get_dump_inbox() {
        Ok(events) => {
            info!("Successfully retrieved {} events from inbox.", events.len());
            
            // 2. Push data to aw-sync (mock)
            if let Err(e) = sync.send(&events) {
                warn!("Failed to send events to sync: {}", e);
                std::process::exit(1);
            } else {
                info!("Successfully sent events to sync.");
            }
        }
        Err(e) => {
            warn!("Failed to get dump from inbox: {}", e);
            std::process::exit(1);
        }
    }
}
