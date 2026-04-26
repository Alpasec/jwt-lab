import jwt
import datetime
import base64

# Reto 1: Secreto fuerte pero no se verifica la firma
CH1_SECRET = "SIKAWOavOUuqoPQzT9muetkrkDl6N9pm2q3B5mphtuDjKxnvQ4czAwPqWj9PRHaXLDH3iO60o4yp5LQgTwewvk"

# Reto 2: Secreto débil que debería estar en rockyou (ej. "superman")
CH2_SECRET = "superman"

# Reto 3: Secreto fuerte, pero la vulnerabilidad es aceptar alg="none"
CH3_SECRET = "mHxqjRpUBzAs9jOpqXkcidA3TEAPbkh1u1chfh7ZysrB7skcq8lSME8bDyyzZwjPLtxnHBbnMShGLpME5XnGUe"

# Reto 4: Secreto filtrado en claims
CH4_SECRET = "ChaufaConAji123"

def generate_challenge_jwt(username, role, challenge_id):
    """
    Genera un JWT para el respectivo challenge.
    """
    payload = {
        "sub": username,
        "role": role,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)
    }

    if challenge_id == 1:
        return jwt.encode(payload, CH1_SECRET, algorithm="HS256")
        
    elif challenge_id == 2:
        return jwt.encode(payload, CH2_SECRET, algorithm="HS256")
        
    elif challenge_id == 3:
        # Generamos uno válido inicialmente
        return jwt.encode(payload, CH3_SECRET, algorithm="HS256")
        
    elif challenge_id == 4:
        # Inyectamos el secreto codificado en base64 para que el alumno lo encuentre
        payload["debug_key"] = base64.b64encode(CH4_SECRET.encode('utf-8')).decode('utf-8')
        return jwt.encode(payload, CH4_SECRET, algorithm="HS256")
        
    return None

def decode_challenge_jwt(token, challenge_id):
    """
    Decodifica y valida el token según las reglas del challenge.
    Retorna (payload, error_message).
    """
    try:
        # Intentamos obtener un payload base para ver si tiene alg="none"
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "").lower()
        
        if challenge_id == 1:
            # Reto 1: Acepta cualquier token sin verificar firma
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload, None
            
        elif challenge_id == 2:
            # Reto 2: Verifica firma con secret débil
            payload = jwt.decode(token, CH2_SECRET, algorithms=["HS256"])
            return payload, None
            
        elif challenge_id == 3:
            # Reto 3: Acepta token con alg="none" sin firma, o token normal con firma
            if alg == "none":
                payload = jwt.decode(token, options={"verify_signature": False})
                return payload, None
            else:
                # Si no es alg=none, verifica normalmente
                payload = jwt.decode(token, CH3_SECRET, algorithms=["HS256"])
                return payload, None
                
        elif challenge_id == 4:
            # Reto 4: Verifica firma normalmente
            payload = jwt.decode(token, CH4_SECRET, algorithms=["HS256"])
            return payload, None
            
        else:
            return None, "Challenge inválido"

    except jwt.ExpiredSignatureError:
        return None, "Token ha expirado"
    except jwt.InvalidTokenError as e:
        return None, f"Token inválido: {str(e)}"
    except Exception as e:
        return None, f"Error decodificando token: {str(e)}"

