use std::collections::VecDeque;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use log::{info, error};
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct UpdateQueue {
    queue: Arc<Mutex<VecDeque<i64>>>,
    file_path: PathBuf,
}

#[derive(Serialize, Deserialize)]
struct QueueData {
    ids: Vec<i64>,
}

impl UpdateQueue {
    pub fn new(file_path: PathBuf) -> Self {
        let queue = if file_path.exists() {
            match fs::read_to_string(&file_path) {
                Ok(content) => match serde_json::from_str::<QueueData>(&content) {
                    Ok(data) => VecDeque::from(data.ids),
                    Err(e) => {
                        error!("Failed to parse queue file: {}", e);
                        VecDeque::new()
                    }
                },
                Err(e) => {
                    error!("Failed to read queue file: {}", e);
                    VecDeque::new()
                }
            }
        } else {
            VecDeque::new()
        };

        Self {
            queue: Arc::new(Mutex::new(queue)),
            file_path,
        }
    }

    pub async fn push(&self, id: i64) {
        let mut q = self.queue.lock().await;
        // Avoid duplicates if needed, but for now simple push
        if !q.contains(&id) {
            q.push_back(id);
        }
    }

    pub async fn pop_batch(&self, n: usize) -> Vec<i64> {
        let mut q = self.queue.lock().await;
        let mut batch = Vec::new();
        for _ in 0..n {
            if let Some(id) = q.pop_front() {
                batch.push(id);
            } else {
                break;
            }
        }
        batch
    }

    // Re-queue items if sending failed
    pub async fn requeue(&self, ids: Vec<i64>) {
        let mut q = self.queue.lock().await;
        for id in ids.into_iter().rev() {
            q.push_front(id);
        }
    }

    pub async fn save(&self) -> anyhow::Result<()> {
        let q = self.queue.lock().await;
        let data = QueueData {
            ids: q.iter().cloned().collect(),
        };
        let content = serde_json::to_string(&data)?;
        fs::write(&self.file_path, content)?;
        info!("Queue saved to {:?}", self.file_path);
        Ok(())
    }

    pub async fn len(&self) -> usize {
        self.queue.lock().await.len()
    }
}
