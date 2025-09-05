# Task / Result Schema (Stage-1)

## Task (from /get-task)
{
  "task_id": "string",
  "job_id": "string",
  "shard_id": "string",
  "payload": "string"
}

## Result (to /submit-result)
{
  "task_id": "string",
  "job_id": "string",
  "shard_id": "string",
  "output": "string",
  "fingerprint": "string (sha256 hex)"
}
