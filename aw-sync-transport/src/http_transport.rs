use async_trait::async_trait;
use log::{info, error};
use std::sync::{Arc, Mutex};
use crate::discovery::Discovery;
use crate::transport::Transport;

pub struct HttpTransport {
    client: reqwest::Client,
    discovery: Arc<Mutex<Discovery>>,
}

impl HttpTransport {
    pub fn new(discovery: Arc<Mutex<Discovery>>) -> Self {
        Self {
            client: reqwest::Client::new(),
            discovery,
        }
    }
}

#[async_trait]
impl Transport for HttpTransport {
    async fn send(&self, data: &[u8]) -> anyhow::Result<()> {
        // Get discovered peers
        let peers = {
            self.discovery.lock().unwrap().get_peers()
        };

        if peers.is_empty() {
            info!("No peers discovered, skipping send");
            return Ok(());
        }

        info!("Broadcasting to {} peers", peers.len());

        // Broadcast to all peers (naive implementation)
        for (hostname, addr) in peers {
            let url = format!("http://{}/sync", addr);
            info!("Sending to peer {} at {}", hostname, url);
            
            // Send as POST with raw bytes body
            // In a real app, you might want multipart or specific content-type
            let res = self.client.post(&url)
                .body(data.to_vec())
                .header("Content-Type", "application/json")
                .send()
                .await;

            match res {
                Ok(response) => {
                    if !response.status().is_success() {
                        error!("Failed to send to {}: status {}", hostname, response.status());
                    } else {
                        info!("Successfully sent to {}", hostname);
                    }
                }
                Err(e) => {
                    error!("Failed to connect to {}: {}", hostname, e);
                }
            }
        }
        
        Ok(())
    }
}
