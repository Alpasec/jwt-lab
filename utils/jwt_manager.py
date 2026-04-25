import jwt
import datetime

# Strong secret for the secure level and level 1 (where signature isn't checked anyway, but we still sign it)
SECURE_SECRET = "SUp3r_S3cr3t_K3y_Th4t_I5_1mposs1bl3_T0_Gu3ss_2026!"
# Weak secret for level 2
WEAK_SECRET = "muyseguro123"

def generate_jwt(username, role, level="secure"):
    """
    Generates a JWT.
    For 'secure' and 'level1', it uses SECURE_SECRET.
    For 'level2', it uses WEAK_SECRET.
    """
    secret = WEAK_SECRET if level == "level2" else SECURE_SECRET
    
    payload = {
        "sub": username,
        "role": role,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1),
        "iss": "educational-jwt-lab",
        "aud": "lab-students",
        "jti": f"{username}-{datetime.datetime.now().timestamp()}"
    }
    
    token = jwt.encode(payload, secret, algorithm="HS256")
    return token

def decode_jwt(token, level="secure"):
    """
    Decodes and validates a JWT based on the level.
    Returns (payload, error_message).
    If error_message is None, the token is valid.
    """
    try:
        if level == "level1":
            # Level 1 vulnerability: No signature verification
            # In PyJWT, we can disable signature verification by passing options
            payload = jwt.decode(token, options={"verify_signature": False, "verify_aud": False})
            return payload, None
            
        elif level == "level2":
            # Level 2 vulnerability: Signature is verified, but with a weak secret
            payload = jwt.decode(token, WEAK_SECRET, algorithms=["HS256"], audience="lab-students")
            return payload, None
            
        else: # secure
            # Secure implementation: proper signature verification with strong secret
            payload = jwt.decode(token, SECURE_SECRET, algorithms=["HS256"], audience="lab-students")
            return payload, None
            
    except jwt.ExpiredSignatureError:
        return None, "Token has expired"
    except jwt.InvalidTokenError as e:
        return None, f"Invalid token: {str(e)}"
    except Exception as e:
        return None, f"Error decoding token: {str(e)}"

def decode_jwt_without_verification(token):
    """
    Decodes the token payload without ANY verification, just to inspect the contents.
    Useful for the frontend or /api/me to always show what the token has, even if invalid.
    """
    try:
        return jwt.decode(token, options={"verify_signature": False})
    except:
        return None
