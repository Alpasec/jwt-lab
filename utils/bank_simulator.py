import hashlib
import random

def generate_bank_profile(username):
    """
    Generates a deterministic simulated bank profile based on the username.
    """
    # Create a deterministic seed based on username
    seed_str = f"salt_bank_{username}"
    hash_obj = hashlib.md5(seed_str.encode())
    hash_hex = hash_obj.hexdigest()
    
    # Deterministic generation
    random.seed(int(hash_hex[:8], 16))
    
    account_types = ["Checking Account", "Savings Account", "Premium Checking", "Student Account"]
    account_type = random.choice(account_types)
    
    # Generate account number
    account_num = f"{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
    
    # Generate balance between 10.00 and 50000.00
    balance = round(random.uniform(10.0, 50000.0), 2)
    credit_limit = round(random.uniform(1000.0, 100000.0), 2)
    
    # Masked card
    card_masked = f"**** **** **** {random.randint(1000, 9999)}"
    
    # Transactions
    num_transactions = random.randint(3, 5)
    transactions = []
    merchants = ["Amazon", "Uber", "Starbucks", "Netflix", "Spotify", "Apple Store", "Local Supermarket", "Gas Station"]
    
    for _ in range(num_transactions):
        txn = {
            "description": random.choice(merchants),
            "amount": round(random.uniform(-150.0, -2.0), 2),
            "date": f"2026-{random.randint(1, 4):02d}-{random.randint(1, 28):02d}"
        }
        transactions.append(txn)
        
    return {
        "username": username,
        "full_name": f"{username.capitalize()} (Simulated User)",
        "account_type": account_type,
        "account_number": account_num,
        "available_balance": balance,
        "credit_limit": credit_limit,
        "card_masked": card_masked,
        "recent_transactions": transactions
    }
