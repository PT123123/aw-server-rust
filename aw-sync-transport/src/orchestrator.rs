use std::sync::Arc;
use tokio::time::{self, Duration};
use log::{info, error};
use crate::queue::UpdateQueue;
use crate::transport::Transport;
use aw_inbox_datastore::models::Note; // Example model

pub trait DataProvider: Send + Sync {
    fn get_data(&self, id: i64) -> Option<Note>; // Mocking getting a Note
}

pub struct SyncOrchestrator {
    queue: UpdateQueue,
    transport: Arc<dyn Transport>,
    data_provider: Arc<dyn DataProvider>,
}

impl SyncOrchestrator {
    pub fn new(
        queue: UpdateQueue,
        transport: Arc<dyn Transport>,
        data_provider: Arc<dyn DataProvider>,
    ) -> Self {
        Self {
            queue,
            transport,
            data_provider,
        }
    }

    // Called by Inbox when new data arrives
    pub async fn on_new_data(&self, id: i64) {
        info!("New data arrived: {}", id);
        self.queue.push(id).await;
    }

    pub async fn run(&self) {
        let queue = self.queue.clone();
        let transport = self.transport.clone();
        let provider = self.data_provider.clone();

        // 1. Sending Loop (Every 10s)
        let send_task = tokio::spawn(async move {
            let mut interval = time::interval(Duration::from_secs(10));
            loop {
                interval.tick().await;
                
                let count = queue.len().await;
                if count > 0 {
                    info!("Checking queue, found {} items", count);
                    // Pop a batch
                    let ids = queue.pop_batch(10).await; // Pop up to 10
                    if ids.is_empty() {
                        continue;
                    }

                    // Fetch data
                    let mut payload = Vec::new();
                    for &id in &ids {
                        if let Some(note) = provider.get_data(id) {
                            payload.push(note);
                        }
                    }

                    // Serialize
                    match serde_json::to_vec(&payload) {
                        Ok(data) => {
                            // Send
                            match transport.send(&data).await {
                                Ok(_) => {
                                    info!("Successfully sent batch of {} items", ids.len());
                                    // Mark as sent / Update last_sync_time (omitted for now)
                                }
                                Err(e) => {
                                    error!("Failed to send batch: {}", e);
                                    // Requeue
                                    queue.requeue(ids).await;
                                }
                            }
                        }
                        Err(e) => {
                            error!("Serialization error: {}", e);
                            // Decide whether to requeue or drop (drop for now if corrupt)
                        }
                    }
                }
            }
        });

        // 2. Persistence Loop (Every 1 min)
        let queue_save = self.queue.clone();
        let save_task = tokio::spawn(async move {
            let mut interval = time::interval(Duration::from_secs(60));
            loop {
                interval.tick().await;
                if let Err(e) = queue_save.save().await {
                    error!("Failed to save queue: {}", e);
                }
            }
        });

        // Await both (in a real app, you might want graceful shutdown)
        let _ = tokio::join!(send_task, save_task);
    }
}
