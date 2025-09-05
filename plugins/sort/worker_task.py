import hashlib

def run(task_descriptor: dict) -> dict:
    """
    Stage-1 worker logic:
    - Read 'payload'
    - Produce 'output'
    - Compute 'fingerprint' (sha256 of output)
    """
    payload = task_descriptor.get("payload", "")
    output = f"processed: {payload}"
    fingerprint = hashlib.sha256(output.encode("utf-8")).hexdigest()

    return {
        "task_id": task_descriptor["task_id"],
        "job_id": task_descriptor["job_id"],
        "shard_id": task_descriptor["shard_id"],
        "output": output,
        "fingerprint": fingerprint,
    }
