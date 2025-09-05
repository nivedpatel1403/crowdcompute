import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from plugins.sort.plugin import JobPlugin
from plugins.sort.worker_task import run as worker_run

def test_shard_returns_parallelism_count():
    plugin = JobPlugin()
    shards = plugin.shard({"parallelism": 3, "job_id": "job1"})
    assert len(shards) == 3
    assert all("payload" in s for s in shards)
    assert all(s["job_id"] == "job1" for s in shards)

def test_worker_run_outputs_and_fingerprint():
    task = {
        "task_id": "t1",
        "job_id": "j1",
        "shard_id": "s1",
        "payload": "Hello"
    }
    result = worker_run(task)
    assert result["task_id"] == "t1"
    assert result["job_id"] == "j1"
    assert result["shard_id"] == "s1"
    assert result["output"].startswith("processed: ")
    assert len(result["fingerprint"]) == 64  # sha256 hex length
