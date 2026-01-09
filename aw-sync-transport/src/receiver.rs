use std::sync::Arc;
use log::{info, error};
use aw_inbox_datastore::models::Note;

pub trait InboxMerger: Send + Sync {
    // Return true if updated/inserted
    fn apply_note(&self, note: Note) -> bool;
}

pub trait WebUINotifier: Send + Sync {
    fn notify_refresh(&self);
}

pub struct SyncReceiver {
    merger: Arc<dyn InboxMerger>,
    notifier: Arc<dyn WebUINotifier>,
}

impl SyncReceiver {
    pub fn new(merger: Arc<dyn InboxMerger>, notifier: Arc<dyn WebUINotifier>) -> Self {
        Self { merger, notifier }
    }

    // Called when Transport receives data
    pub async fn on_receive_chunk(&self, data: &[u8]) {
        info!("Received chunk of size {}", data.len());

        // Deserialize
        match serde_json::from_slice::<Vec<Note>>(data) {
            Ok(notes) => {
                let mut changes = false;
                for note in notes {
                    if self.merger.apply_note(note) {
                        changes = true;
                    }
                }

                if changes {
                    info!("Changes applied, notifying WebUI");
                    self.notifier.notify_refresh();
                } else {
                    info!("No effective changes in this chunk");
                }
            }
            Err(e) => {
                error!("Failed to deserialize received chunk: {}", e);
            }
        }
    }
}
