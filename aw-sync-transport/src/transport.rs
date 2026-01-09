use async_trait::async_trait;
use std::sync::Arc;
use tokio::sync::Mutex;

#[async_trait]
pub trait Transport: Send + Sync {
    async fn send(&self, data: &[u8]) -> anyhow::Result<()>;
    // In a real transport, this might register a callback or return a stream.
    // For mock, we'll just have a way to simulate receiving.
}

pub struct MockTransport {
    // Just for logging/verifying
    pub sent_data: Arc<Mutex<Vec<Vec<u8>>>>,
}

impl MockTransport {
    pub fn new() -> Self {
        Self {
            sent_data: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

#[async_trait]
impl Transport for MockTransport {
    async fn send(&self, data: &[u8]) -> anyhow::Result<()> {
        log::info!("Transport: Sending {} bytes", data.len());
        self.sent_data.lock().await.push(data.to_vec());
        // Simulate network delay
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        Ok(())
    }
}
