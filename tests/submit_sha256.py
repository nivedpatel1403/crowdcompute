import requests
import os
import hashlib

def submit_sha256_job():
    # Configuration
    COORDINATOR_URL = "http://localhost:8000" 
    JOB_TYPE = "hashcat_crack"
    FILE_PATH = "rockyou.txt" 
    
    # --- TARGET CONFIGURATION ---
    TARGET_PASSWORD = "CUTE02" 
    
    # Calculate SHA256 hash
    target_hash = hashlib.sha256(TARGET_PASSWORD.encode()).hexdigest()
    
    # Hashcat Mode 1400 = SHA256
    HASH_MODE = "1400" 
    
    # Split heavily to force distribution
    NUM_CHUNKS = 100 

    # Check file
    if not os.path.exists(FILE_PATH):
        print(f"Error: {FILE_PATH} not found.")
        print("Please download it: wget https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt")
        return

    url = f"{COORDINATOR_URL}/submit-job/{JOB_TYPE}"
    
    print(f"Submitting SHA256 Job to {url}...")
    print(f"  Target Password: {TARGET_PASSWORD}")
    print(f"  Target Hash (SHA256): {target_hash}")
    print(f"  Mode: {HASH_MODE}")
    print(f"  Wordlist: {FILE_PATH}")
    print(f"  Chunks: {NUM_CHUNKS}")

    try:
        with open(FILE_PATH, 'rb') as f:
            files = {
                "file": (os.path.basename(FILE_PATH), f)
            }
            data = {
                "target_hash": target_hash,
                "hash_mode": HASH_MODE,
                "num_chunks": NUM_CHUNKS
            }
            
            response = requests.post(url, data=data, files=files)
            response.raise_for_status()
            
            print("\n[SUCCESS] Job Submitted!")
            print(response.json())
            print(f"\nCheck status at: {COORDINATOR_URL}/tasks")

    except requests.exceptions.ConnectionError:
        print(f"\n[ERROR] Could not connect to {COORDINATOR_URL}")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        if 'response' in locals():
             print(f"Server response: {response.text}")

if __name__ == "__main__":
    submit_sha256_job()