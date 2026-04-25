import os
import json
import urllib.request
import urllib.error

# Configured from environment or hardcoded for lab purposes (if needed, but env is better)
BLOB_READ_WRITE_TOKEN = os.environ.get("BLOB_READ_WRITE_TOKEN", "")
STORE_FILENAME = "lab_users.json"

def get_base_url():
    # Attempt to extract store ID from token if Vercel Blob token is standard format
    # The Vercel Blob token format is usually vercel_blob_rw_STOREID_RANDOM
    if not BLOB_READ_WRITE_TOKEN:
        return ""
    
    parts = BLOB_READ_WRITE_TOKEN.split("_")
    if len(parts) >= 4:
        store_id = parts[3]
        return f"https://{store_id}.public.blob.vercel-storage.com"
    return "https://blob.vercel-storage.com"

def get_all_users():
    """
    Fetches the list of registered users from Vercel Blob.
    If no token or file doesn't exist, returns empty list.
    """
    if not BLOB_READ_WRITE_TOKEN:
        print("Warning: BLOB_READ_WRITE_TOKEN not set. Blob storage disabled.")
        return []
        
    base_url = get_base_url()
    # In Vercel Blob, files are usually accessible publicly if we know the URL
    # Or we can use the API directly: https://blob.vercel-storage.com/lab_users.json
    api_url = "https://blob.vercel-storage.com"
    
    try:
        req = urllib.request.Request(f"{api_url}?limit=1&prefix={STORE_FILENAME}")
        req.add_header("Authorization", f"Bearer {BLOB_READ_WRITE_TOKEN}")
        
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            blobs = data.get("blobs", [])
            if blobs:
                file_url = blobs[0]["url"]
                # Fetch the file content
                with urllib.request.urlopen(file_url) as file_resp:
                    return json.loads(file_resp.read().decode())
            return []
    except Exception as e:
        print(f"Error fetching users from Blob: {e}")
        return []

def save_user(username):
    """
    Adds a new user to the list in Vercel Blob.
    """
    if not BLOB_READ_WRITE_TOKEN:
        print("Warning: BLOB_READ_WRITE_TOKEN not set. Cannot save user.")
        return False
        
    users = get_all_users()
    if username not in users:
        users.append(username)
        
    api_url = f"https://blob.vercel-storage.com/{STORE_FILENAME}"
    
    try:
        data = json.dumps(users).encode('utf-8')
        req = urllib.request.Request(api_url, data=data, method="PUT")
        req.add_header("Authorization", f"Bearer {BLOB_READ_WRITE_TOKEN}")
        req.add_header("Content-Type", "application/json")
        req.add_header("x-api-version", "7") # Required by some Vercel APIs
        
        with urllib.request.urlopen(req) as response:
            return response.status == 200
    except Exception as e:
        print(f"Error saving user to Blob: {e}")
        return False
