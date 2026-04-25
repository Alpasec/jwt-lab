# JWT Security Lab (Educational)

Aplicación web educativa diseñada para enseñar los fundamentos de JSON Web Tokens (JWT) y sus vulnerabilidades más comunes, construida con Flask y lista para desplegar en Vercel.

**Nota:** Este proyecto es **100% simulado y educativo**. No utiliza bases de datos reales ni maneja datos financieros de verdad.

## Arquitectura

- **Backend:** Python con Flask
- **Frontend:** HTML/CSS/JS (Vanilla) moderno y responsivo
- **Persistencia:** Vercel Blob (Solo guarda los `usernames` registrados como un JSON para demostrar persistencia mínima).
- **Datos Simulados:** La información bancaria se genera determinísticamente en el backend al vuelo en base al username.

## Niveles del Lab

1. **Secure (`/`)**: Implementación correcta. El backend verifica la firma del JWT usando un Secret fuerte.
2. **Level 1 (`/level-1`)**: Vulnerabilidad de omisión de firma. El backend decodifica el token pero no verifica su firma, permitiendo a los alumnos modificar claims (ej. `role: admin`) directamente en el cliente.
3. **Level 2 (`/level-2`)**: Vulnerabilidad de clave débil. El backend verifica la firma, pero el Secret es `muyseguro123`, lo cual permite a los alumnos realizar fuerza bruta para encontrar la clave y firmar sus propios tokens maliciosos.

## Credenciales Admin

Existe un usuario admin hardcodeado para pruebas y demostración de escalamiento de privilegios:
- **Usuario:** `alpaca123`
- **Contraseña:** `alpaca123`
- **Privilegio:** Permite acceder a la ruta de administración para ver todos los usuarios registrados en Vercel Blob y sus perfiles bancarios generados.

## Lab Oculto (Easter Egg)

El laboratorio original de DevTools y almacenamiento en el navegador sigue existiendo. Se encuentra oculto en la ruta:
`/me_encontraste_dev`

El archivo `robots.txt` incluye una pista en **base64** (`L21lX2VuY29udHJhc3RlX2Rldg==`) que apunta a esta ruta, reforzando el concepto de que la seguridad por oscuridad no es efectiva.

## Configuración y Despliegue Local

### Requisitos
- Python 3.9+
- Una cuenta en Vercel (opcional, para Vercel Blob)

### Pasos

1. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

2. Configurar la variable de entorno para Vercel Blob (OBLIGATORIO para persistencia de registros):
   ```bash
   # En Windows (Powershell)
   $env:BLOB_READ_WRITE_TOKEN="tu_token_de_vercel_blob"
   
   # En Linux/Mac
   export BLOB_READ_WRITE_TOKEN="tu_token_de_vercel_blob"
   ```
   *Nota: Si no configuras esto, la app funcionará pero no guardará los nuevos usuarios registrados.*

3. Correr la aplicación:
   ```bash
   python app.py
   ```

4. Abrir en el navegador: `http://localhost:8000`

## Despliegue en Vercel

El proyecto incluye el archivo `vercel.json` configurado para desplegar la aplicación Flask usando `@vercel/python`. 

1. Conecta el repositorio a Vercel.
2. Asegúrate de añadir la variable de entorno `BLOB_READ_WRITE_TOKEN` en los ajustes del proyecto en Vercel.
3. Vercel Blob se encargará de mantener la lista de usuarios persistida entre ejecuciones sin necesidad de una base de datos pesada.
