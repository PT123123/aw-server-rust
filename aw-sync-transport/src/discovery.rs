use mdns_sd::{ServiceDaemon, ServiceEvent, ServiceInfo};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use log::{info, error};

const SERVICE_TYPE: &str = "_activitywatch._tcp.local.";

pub struct Discovery {
    daemon: ServiceDaemon,
    // Store discovered peers: hostname -> IP:Port
    pub peers: Arc<Mutex<HashMap<String, String>>>,
}

impl Discovery {
    pub fn new() -> anyhow::Result<Self> {
        let daemon = ServiceDaemon::new()?;
        Ok(Self {
            daemon,
            peers: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    pub fn start_browsing(&self) -> anyhow::Result<()> {
        let receiver = self.daemon.browse(SERVICE_TYPE)?;
        let peers = self.peers.clone();

        tokio::spawn(async move {
            while let Ok(event) = receiver.recv_async().await {
                match event {
                    ServiceEvent::ServiceResolved(info) => {
                        info!("Resolved service: {}", info.get_fullname());
                        if let Some(addr) = info.get_addresses().iter().next() {
                            let ip_port = format!("{}:{}", addr, info.get_port());
                            // Using hostname part as ID for now
                            let hostname = info.get_hostname().trim_end_matches('.');
                            
                            info!("Found peer: {} at {}", hostname, ip_port);
                            peers.lock().unwrap().insert(hostname.to_string(), ip_port);
                        }
                    }
                    ServiceEvent::ServiceRemoved(service_type, fullname) => {
                        info!("Service removed: {} ({})", fullname, service_type);
                        // Ideally we should remove from peers map, but fullname parsing is needed
                    }
                    _ => {}
                }
            }
        });

        Ok(())
    }

    pub fn register_service(&self, port: u16) -> anyhow::Result<()> {
        let hostname = hostname::get()?.into_string().unwrap_or_else(|_| "unknown".to_string());
        let service_info = ServiceInfo::new(
            SERVICE_TYPE,
            &format!("aw-sync-{}", hostname),
            &hostname,
            "", // IP - let mdns-sd figure it out
            port,
            None,
        )?.enable_addr_auto();

        self.daemon.register(service_info)?;
        info!("Registered service: aw-sync-{} on port {}", hostname, port);
        Ok(())
    }

    pub fn get_peers(&self) -> HashMap<String, String> {
        self.peers.lock().unwrap().clone()
    }
}
