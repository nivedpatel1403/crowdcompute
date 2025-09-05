import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import requests
from plugins.sort.worker_task import run as worker_run

COORD = "http://127.0.0.1:8000"  # change if needed

def main():
    # 1) Register
    r = requests.post(f"{COORD}/register", json={"capabilities": {}})
    r.raise_for_status()
    worker_id = r.json().get("worker_id")
    print("Registered worker_id:", worker_id)

    # 2) Get task
    r = requests.post(f"{COORD}/get-task", json={"worker_id": worker_id})
    r.raise_for_status()
    task = r.json()
    print("Received task:", task)

    # Defensive check: coordinator may return 'no-task' shape
    if not task or "task_id" not in task:
        print("No task available. Exiting.")
        return

    # 3) Run local plugin on the task
    result = worker_run(task)
    print("Local plugin result:", result)

    # 4) Submit result
    r = requests.post(f"{COORD}/submit-result", json=result)
    r.raise_for_status()
    print("Submit response:", r.json())

if __name__ == "__main__":
    main()
