use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Serialize, Deserialize, FromRow, Debug, Clone)]
pub struct Note {
    pub id: i64,
    pub content: String,
    pub tags: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize, Debug)]
pub struct CreateNotePayload {
    pub content: String,
    pub tags: Option<Vec<String>>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Deserialize, Debug)]
pub struct UpdateNotePayload {
    pub content: String,
    pub tags: Option<Vec<String>>,
}

#[derive(Serialize, Debug)]
pub struct NoteResponse {
    pub id: i64,
    pub content: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, FromRow, Debug, Clone)]
pub struct Tag {
    pub id: i64,
    pub name: String,
}

#[derive(Serialize, Debug)]
pub struct DetailedTag {
    pub name: String,
    pub count: i64,
    pub last_modified: Option<String>,
}

#[derive(Serialize, Deserialize, FromRow, Debug, Clone)]
pub struct Comment {
    pub id: i64,
    pub note_id: i64,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Deserialize, Debug)]
pub struct CreateCommentPayload {
    pub content: String,
}

#[derive(Serialize, Debug)]
pub struct CommentResponse {
    pub id: i64,
    pub content: String,
    pub created_at: String,
}

