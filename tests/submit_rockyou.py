import requests
import os
import hashlib

def submit_rockyou_job():
    # Configuration
    # Ensure this matches your .env or setup
    COORDINATOR_URL = "http://localhost:8000" 
    JOB_TYPE = "hashcat_crack"
    FILE_PATH = "rockyou.txt" # Must be in the same folder
    
    # --- TARGET CONFIGURATION ---
    # Password: "iloveyou" (Very common, usually top 10)
    # Let's try something that might take a bit longer if chunks are small
    # or if the system is slow.
    
    # To truly test "10 minutes" on a fast CPU with a small wordlist is hard.
    # But based on your logs (50 H/s), we need something around index 30,000.
    
    # Target: "cameron" (Rank ~400)
    # Target: "jordan" (Rank ~250)
    # Target: "charlie" (Rank ~400)
    
    # Let's stick to MD5 as you requested.
    # Password: "dragon"
    TARGET_PASSWORD = "dragon" 
    
    # Calculate MD5 hash
    target_hash = hashlib.md5(TARGET_PASSWORD.encode()).hexdigest()
    
    HASH_MODE = "0" # 0 = MD5
    
    # Splitting rockyou.txt (14M lines) into many chunks ensures
    # that workers have to come back for more, testing the distribution.
    # 14,000,000 / 100 = 140,000 words per chunk.
    NUM_CHUNKS = 100 

    # Check file
    if not os.path.exists(FILE_PATH):
        print(f"Error: {FILE_PATH} not found in the current directory.")
        print("Please download it (e.g., from github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt)")
        return

    url = f"{COORDINATOR_URL}/submit-job/{JOB_TYPE}"
    
    print(f"Submitting Job to {url}...")
    print(f"  Target Password: {TARGET_PASSWORD}")
    print(f"  Target Hash (MD5): {target_hash}")
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
        print(f"\n[ERROR] Could not connect to {COORDINATOR_URL}. Is the server running?")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        if 'response' in locals():
             print(f"Server response: {response.text}")

if __name__ == "__main__":
    submit_rockyou_job()