import uuid
from typing import List, Dict

JOB_TYPE = "sort"

class JobPlugin:
    def shard(self, job_config: Dict) -> List[Dict]:
        """Stage-1: generate N dummy shards with payload strings."""
        parallelism = job_config.get("parallelism", 1)
        job_id = job_config.get("job_id", str(uuid.uuid4()))
        shards = []
        for i in range(parallelism):
            shards.append({
                "task_id": f"{job_id}_task_{i}",
                "job_id": job_id,
                "shard_id": f"{job_id}_shard_{i}",
                "payload": f"Hello from {job_id} shard {i}",
            })
        return shards

    def verify(self, results: List[Dict]) -> bool:
        """Stage-1: trivial check — outputs must be non-empty."""
        return all(r.get("output") for r in results)

    def aggregate(self, results: List[Dict], output_uri: str = "final_output.txt") -> str:
        """Stage-1: concatenate outputs into a local file."""
        combined = "\n".join(r["output"] for r in results)
        with open(output_uri, "w", encoding="utf-8") as f:
            f.write(combined)
        return output_uri
