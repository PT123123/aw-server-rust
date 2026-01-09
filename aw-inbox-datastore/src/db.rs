use chrono::{DateTime, Utc};
use sqlx::{sqlite::SqlitePoolOptions, Error, SqlitePool};
use std::env;

use crate::models::{CreateNotePayload, DetailedTag, Note, UpdateNotePayload};

pub type DbPool = SqlitePool;

const DATABASE_URL_ENV_VAR: &str = "DATABASE_URL";
const DEFAULT_DATABASE_URL: &str = "sqlite:inbox.db";

pub async fn init_pool() -> Result<DbPool, Error> {
    let database_url = env::var(DATABASE_URL_ENV_VAR).unwrap_or_else(|_| DEFAULT_DATABASE_URL.to_string());
    println!("🗄️ 连接到数据库: {}", database_url);
    init_db(&database_url).await
}

pub async fn init_db(database_url: &str) -> Result<DbPool, Error> {
    let path = database_url.trim_start_matches("sqlite:");
    if !std::path::Path::new(path).exists() && path != ":memory:" {
        println!("数据库文件不存在，正在创建: {}", path);
        if let Some(parent) = std::path::Path::new(path).parent() {
            std::fs::create_dir_all(parent).map_err(|e| sqlx::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
        }
        std::fs::File::create(path)
            .map_err(|e| sqlx::Error::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await?;
    Ok(pool)
}

pub async fn migrate(pool: &DbPool) -> Result<(), Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            tags TEXT DEFAULT '[]',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            note_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
        );
        "#,
    )
    .execute(pool)
    .await?;
    println!("✅ 数据库迁移完成");
    Ok(())
}

pub async fn create_note_db(pool: &DbPool, payload: CreateNotePayload) -> Result<Note, Error> {
    let created_at = payload.created_at.unwrap_or_else(Utc::now);
    let updated_at = created_at;
    let tags_json =
        serde_json::to_string(&payload.tags.unwrap_or_default()).map_err(|e| sqlx::Error::Decode(Box::new(e)))?;

    let result = sqlx::query(
        r#"
        INSERT INTO notes (content, tags, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        "#,
    )
    .bind(&payload.content)
    .bind(&tags_json)
    .bind(created_at)
    .bind(updated_at)
    .execute(pool)
    .await?;

    let id = result.last_insert_rowid();

    Ok(Note {
        id,
        content: payload.content,
        tags: tags_json,
        created_at,
        updated_at,
    })
}

pub async fn get_note_db(pool: &DbPool, note_id: i64) -> Result<Option<Note>, Error> {
    let note = sqlx::query_as::<_, Note>("SELECT id, content, tags, created_at, updated_at FROM notes WHERE id = ?")
        .bind(note_id)
        .fetch_optional(pool)
        .await?;
    Ok(note)
}

pub async fn get_notes_db(
    pool: &DbPool,
    limit: Option<i64>,
    tag: Option<String>,
    created_after: Option<DateTime<Utc>>,
    created_before: Option<DateTime<Utc>>,
) -> Result<Vec<Note>, Error> {
    let mut query_str = "SELECT id, content, tags, created_at, updated_at FROM notes WHERE 1=1".to_string();
    let mut conditions = Vec::<String>::new();

    if tag.is_some() {
        conditions.push("tags LIKE ?".to_string());
    }
    if created_after.is_some() {
        conditions.push("created_at >= ?".to_string());
    }
    if created_before.is_some() {
        conditions.push("created_at < ?".to_string());
    }

    if !conditions.is_empty() {
        query_str.push_str(" AND ");
        query_str.push_str(&conditions.join(" AND "));
    }

    query_str.push_str(" ORDER BY created_at DESC");

    if let Some(l) = limit {
        query_str.push_str(&format!(" LIMIT {}", l));
    }

    let mut query = sqlx::query_as::<_, Note>(&query_str);

    if let Some(t) = tag {
        query = query.bind(format!("%\"{}\"%", t));
    }
    if let Some(after) = created_after {
        query = query.bind(after);
    }
    if let Some(before) = created_before {
        query = query.bind(before);
    }

    let notes = query.fetch_all(pool).await?;

    Ok(notes)
}

pub async fn update_note_db(pool: &DbPool, note_id: i64, payload: UpdateNotePayload) -> Result<Option<Note>, Error> {
    let updated_at = Utc::now();
    let tags_json =
        serde_json::to_string(&payload.tags.unwrap_or_default()).map_err(|e| sqlx::Error::Decode(Box::new(e)))?;

    let result = sqlx::query(
        r#"
        UPDATE notes
        SET content = ?, tags = ?, updated_at = ?
        WHERE id = ?
        "#,
    )
    .bind(&payload.content)
    .bind(&tags_json)
    .bind(updated_at)
    .bind(note_id)
    .execute(pool)
    .await?;

    if result.rows_affected() == 0 {
        return Ok(None);
    }

    let updated_note =
        sqlx::query_as::<_, Note>("SELECT id, content, tags, created_at, updated_at FROM notes WHERE id = ?")
            .bind(note_id)
            .fetch_one(pool)
            .await?;

    Ok(Some(updated_note))
}

pub async fn delete_note_db(pool: &DbPool, note_id: i64) -> Result<bool, Error> {
    sqlx::query("DELETE FROM comments WHERE note_id = ?")
        .bind(note_id)
        .execute(pool)
        .await?;

    let result = sqlx::query("DELETE FROM notes WHERE id = ?")
        .bind(note_id)
        .execute(pool)
        .await?;

    Ok(result.rows_affected() > 0)
}

pub async fn get_all_tags_db(pool: &DbPool) -> Result<Vec<String>, Error> {
    use sqlx::Row;
    let rows = sqlx::query("SELECT tags FROM notes WHERE tags IS NOT NULL")
        .fetch_all(pool)
        .await?;
    let mut tag_set = std::collections::HashSet::new();
    for row in rows {
        let tags_json: String = row.get(0);
        if let Ok(tags) = serde_json::from_str::<Vec<String>>(&tags_json) {
            for tag in tags {
                tag_set.insert(tag);
            }
        }
    }
    Ok(tag_set.into_iter().collect())
}

pub async fn get_detailed_tags_db(pool: &DbPool) -> Result<Vec<DetailedTag>, Error> {
    use sqlx::Row;

    let rows = sqlx::query(
        r#"
        SELECT json_each.value as tag, COUNT(*) as count, MAX(updated_at) as last_modified
        FROM notes, json_each(notes.tags)
        GROUP BY tag
        ORDER BY count DESC
        "#,
    )
    .fetch_all(pool)
    .await?;
    let mut result = Vec::new();
    for row in rows {
        let name: String = row.get("tag");
        let count: i64 = row.get("count");
        let last_modified: Option<String> = row.get("last_modified");
        result.push(DetailedTag {
            name,
            count,
            last_modified,
        });
    }
    Ok(result)
}

