import os
from flask import Flask, request, jsonify, render_template, send_from_directory
from utils.blob_storage import get_all_users, save_user
from utils.jwt_manager import generate_jwt, decode_jwt, decode_jwt_without_verification
from utils.jwt_challenge_manager import generate_challenge_jwt, decode_challenge_jwt
from utils.bank_simulator import generate_bank_profile

app = Flask(__name__)

# Config
ADMIN_USER = "alpaca123"
ADMIN_PASS = "alpaca123"

# --- RENDERIZADO DEL FRONTEND (NUEVO LAB JWT) ---

@app.route('/')
def home_secure():
    return render_template('index.html', level='secure', title='JWT Lab - Seguro')

@app.route('/level-1')
def level_1():
    return render_template('index.html', level='level1', title='JWT Lab - Level 1 (Sin Verificación de Firma)')

@app.route('/level-2')
def level_2():
    return render_template('index.html', level='level2', title='JWT Lab - Level 2 (Secret Débil)')

@app.route('/jwt-challenge')
def jwt_challenge():
    return render_template('jwt_challenge.html', title='JWT Challenge Lab')

# --- RENDERIZADO DEL LAB ANTIGUO (OCULTO) ---

@app.route('/me_encontraste_dev')
def hidden_lab_index():
    return render_template('old_lab/index.html')

@app.route('/me_encontraste_dev/static/<path:filename>')
def hidden_lab_static(filename):
    # Asumimos que los estáticos viejos están en static/old_lab/
    base_dir = os.path.join(app.root_path, 'static', 'old_lab')
    return send_from_directory(base_dir, filename)


# --- API ENDPOINTS ---

def get_level_from_request():
    """Obtiene el nivel de seguridad (secure, level1, level2) desde un header."""
    return request.headers.get('X-Lab-Level', 'secure')

def extract_token(req):
    auth_header = req.headers.get('Authorization')
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    return None

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('username'):
        return jsonify({"error": "Falta el username"}), 400
        
    username = data.get('username').lower()
    
    # Prevenir que alguien intente registrar al admin
    if username == ADMIN_USER:
        return jsonify({"error": "No puedes registrar el usuario admin"}), 400
    
    # En este lab educativo, la contraseña es igual al username.
    # No la guardamos. Solo guardamos la existencia del usuario.
    users = get_all_users()
    if username not in users:
        # Guardar en blob
        save_user(username)
        
    # Emitir JWT de registro automático
    level = get_level_from_request()
    token = generate_jwt(username, role="user", level=level)
    
    return jsonify({
        "message": f"Usuario {username} registrado exitosamente.",
        "token": token
    })

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Faltan credenciales"}), 400
        
    username = data.get('username').lower()
    password = data.get('password')
    level = get_level_from_request()
    
    # Validar admin hardcodeado
    if username == ADMIN_USER and password == ADMIN_PASS:
        token = generate_jwt(username, role="admin", level=level)
        return jsonify({"message": "Login exitoso (Admin)", "token": token})
        
    # Validar usuario normal (contraseña == username)
    if username == password:
        users = get_all_users()
        if username in users:
            token = generate_jwt(username, role="user", level=level)
            return jsonify({"message": "Login exitoso (User)", "token": token})
        else:
            return jsonify({"error": "Usuario no registrado"}), 401
            
    return jsonify({"error": "Credenciales inválidas"}), 401

@app.route('/api/me', methods=['GET'])
def me():
    """Devuelve la info del token parseado (sin importar si es válido o no) solo para UI."""
    token = extract_token(request)
    if not token:
        return jsonify({"error": "No token provided"}), 401
        
    # Solo inspeccionamos el token para mostrar en UI
    payload = decode_jwt_without_verification(token)
    if not payload:
        return jsonify({"error": "Token mal formado"}), 400
        
    return jsonify({"payload": payload, "raw_token": token})

@app.route('/api/bank', methods=['GET'])
def bank():
    token = extract_token(request)
    if not token:
        return jsonify({"error": "No Autorizado (Falta Token)"}), 401
        
    level = get_level_from_request()
    payload, err = decode_jwt(token, level=level)
    
    if err:
        return jsonify({"error": f"Token inválido: {err}"}), 401
        
    # Extraer username del subject
    username = payload.get("sub")
    if not username:
        return jsonify({"error": "Token no contiene 'sub'"}), 401
        
    # Generar data bancaria
    profile = generate_bank_profile(username)
    return jsonify({"profile": profile, "validated_by": level})

@app.route('/api/admin/accounts', methods=['GET'])
def admin_accounts():
    token = extract_token(request)
    if not token:
        return jsonify({"error": "No Autorizado (Falta Token)"}), 401
        
    level = get_level_from_request()
    payload, err = decode_jwt(token, level=level)
    
    if err:
        return jsonify({"error": f"Token inválido: {err}"}), 401
        
    # Validar que tenga el rol admin
    role = payload.get("role")
    if role != "admin":
        return jsonify({"error": "Prohibido (Requiere rol admin)"}), 403
        
    # Leer todos los usuarios desde Blob
    users = get_all_users()
    
    # Generar perfiles
    profiles = []
    for u in users:
        profiles.append(generate_bank_profile(u))
        
    return jsonify({"users_count": len(users), "accounts": profiles, "validated_by": level})

# --- CHALLENGE API ENDPOINTS ---

@app.route('/api/challenge/<int:challenge_id>/register', methods=['POST'])
def challenge_register(challenge_id):
    data = request.json
    if not data or not data.get('username'):
        return jsonify({"error": "Falta el username"}), 400
        
    username = data.get('username').lower()
    
    # Prevenir registrar al admin
    if username == ADMIN_USER:
        return jsonify({"error": "No puedes registrar el usuario admin"}), 400
        
    users = get_all_users()
    if username not in users:
        save_user(username)
        
    token = generate_challenge_jwt(username, role="user", challenge_id=challenge_id)
    if not token:
        return jsonify({"error": "Challenge ID inválido"}), 400
        
    return jsonify({
        "message": f"Usuario {username} registrado.",
        "token": token
    })

@app.route('/api/challenge/<int:challenge_id>/login', methods=['POST'])
def challenge_login(challenge_id):
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Faltan credenciales"}), 400
        
    username = data.get('username').lower()
    password = data.get('password')
    
    # Validar usuario normal (password == username)
    if username == password and username != ADMIN_USER:
        users = get_all_users()
        if username in users:
            token = generate_challenge_jwt(username, role="user", challenge_id=challenge_id)
            if not token:
                return jsonify({"error": "Challenge ID inválido"}), 400
            return jsonify({"message": "Login exitoso", "token": token})
        else:
            return jsonify({"error": "Usuario no registrado"}), 401
            
    return jsonify({"error": "Credenciales inválidas"}), 401

@app.route('/api/challenge/<int:challenge_id>/me', methods=['GET'])
def challenge_me(challenge_id):
    token = extract_token(request)
    if not token:
        return jsonify({"error": "No token provided"}), 401
        
    payload = decode_jwt_without_verification(token)
    if not payload:
        return jsonify({"error": "Token mal formado"}), 400
        
    return jsonify({"payload": payload, "raw_token": token})

@app.route('/api/challenge/<int:challenge_id>/bank', methods=['GET'])
def challenge_bank(challenge_id):
    token = extract_token(request)
    if not token:
        return jsonify({"error": "No Autorizado (Falta Token)"}), 401
        
    payload, err = decode_challenge_jwt(token, challenge_id)
    
    if err:
        return jsonify({"error": f"Token inválido: {err}"}), 401
        
    username = payload.get("sub")
    if not username:
        return jsonify({"error": "Token no contiene 'sub'"}), 401
        
    profile = generate_bank_profile(username)
    return jsonify({"profile": profile, "validated_by": f"challenge_{challenge_id}"})

@app.route('/api/challenge/<int:challenge_id>/admin/accounts', methods=['GET'])
def challenge_admin_accounts(challenge_id):
    token = extract_token(request)
    if not token:
        return jsonify({"error": "No Autorizado (Falta Token)"}), 401
        
    payload, err = decode_challenge_jwt(token, challenge_id)
    
    if err:
        return jsonify({"error": f"Token inválido: {err}"}), 401
        
    role = payload.get("role")
    if role != "admin":
        return jsonify({"error": "Prohibido (Requiere rol admin)"}), 403
        
    users = get_all_users()
    profiles = []
    for u in users:
        profiles.append(generate_bank_profile(u))
        
    return jsonify({
        "users_count": len(users), 
        "accounts": profiles, 
        "validated_by": f"challenge_{challenge_id}",
        "success": True
    })

# --- ARCHIVOS ESPECIALES ---
@app.route('/robots.txt')
def robots():
    # Enviar archivo estático desde la raíz si existe, o hardcodear
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return send_from_directory(base_dir, 'robots.txt')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8000))
    print(f"Lab JWT ejecutandose en puerto {port}!")
    app.run(host='0.0.0.0', port=port, debug=True)
