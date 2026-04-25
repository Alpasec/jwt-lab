# Guion de Clase: Almacenamiento y Seguridad en el Frontend

**Duración:** 90 Minutos
**Público:** Estudiantes de introducción a la seguridad web.
**Objetivo:** Comprender las tecnologías de almacenamiento local del navegador y cómo su manipulación demuestra que el "frontend no es seguro".

---

## ⏱️ Parte 1: Introducción Teórica (15 min)

1. **El Navegador no es solo un visor de documentos**
   * Explicar la evolución de la web: de páginas estáticas a aplicaciones complejas (SPAs).
   * Necesidad de guardar estado: sesión, preferencias, archivos para funcionar offline.
2. **Los mecanismos de almacenamiento (Resumen rápido)**
   * *Cookies:* El abuelo. Pequeño, viaja en peticiones HTTP.
   * *Web Storage API (localStorage / sessionStorage):* Más espacio, uso síncrono.
   * *IndexedDB:* Base de datos real, NoSQL, asíncrona, gran capacidad.
   * *Cache Storage:* Para guardar recursos de red (HTML, JS, Imágenes) y funcionar sin internet.
3. **El Modelo de Amenaza Básico**
   * Todo lo que llega al navegador (HTML, JS, CSS) está bajo el control absoluto del usuario.
   * Regla de oro: **Nunca confíes en el cliente.**

---

## ⏱️ Parte 2: Exploración Práctica (30 min)

*Instrucción a alumnos: Ejecuten el servidor local y abran `http://localhost:8000`. Abran DevTools (F12) en la pestaña "Application" (Chrome/Edge) o "Storage" (Firefox).*

### Demostración 1: LocalStorage vs SessionStorage (10 min)
1. Hacer clic en "Tema Oscuro". Ver en DevTools -> Local Storage cómo aparece el valor.
2. Hacer clic en "Paso 1". Ver en DevTools -> Session Storage.
3. **El Experimento:** Duplicar la pestaña actual. 
   * ¿El tema oscuro se mantiene? (Sí, LocalStorage se comparte en el origen).
   * ¿El "Paso 1" está en la nueva pestaña? (No, SessionStorage es único por pestaña).
4. Cerrar el navegador y reabrir. El tema sigue, la sesión se perdió.

### Demostración 2: Cookies (10 min)
1. Explicar que aunque DevTools las muestra similar, las cookies viajan por red.
2. Clic en "Cookie Preferencia" y "Rol = User".
3. Ver en la pestaña "Application" -> Cookies.
4. (Importante) Mostrar la pestaña "Network", recargar la página, seleccionar el request a localhost y ver la sección `Request Headers`. ¡Las cookies viajan automáticamente!

### Demostración 3: Bases de Datos Avanzadas (10 min)
1. Clic en "Insertar Registro" en IndexedDB.
2. Ir a Application -> IndexedDB. Desplegar `Lab_Demo_DB` y ver los datos.
3. Clic en "Crear Caché Demo". Ir a Application -> Cache Storage. Ver los archivos interceptados.

---

## ⏱️ Parte 3: Hackeando el Frontend (25 min)

### La Ilusión de Seguridad
1. Señalar que en la interfaz actual no vemos un "Panel de Administración".
2. Preguntar: *¿Existe el panel de administrador en nuestro código?*
3. Invitar a los alumnos a ir a la pestaña "Elements" y buscar en el HTML la palabra "Administración".
   * ¡Lo encontrarán! Tiene una clase CSS `hidden`.
   * **Lección:** Ocultar con CSS no es seguridad.

### Elevación de Privilegios vía DevTools
1. Pedir que miren la pestaña "Sources" y abran `app.js`.
2. Leer juntos la función `checkAdminAccess()`.
   * Analizar cómo verifica la cookie: `if (role === "admin")`.
3. **El Ataque:** 
   * Ir a la consola (Console).
   * Escribir: `document.cookie = "role=admin";`
   * Recargar la página o llamar a `checkAdminAccess()`.
4. ¡El panel rojo de administrador aparece!
5. **Impacto:** Si la aplicación real confía en esta cookie sin validación criptográfica en un backend real, acabamos de convertirnos en administradores reales.

---

## ⏱️ Parte 4: Ejercicios para Alumnos (15 min)

Dejar que los alumnos resuelvan los siguientes retos usando solo DevTools:

1. **Reto 1:** Encuentra en qué lugar físico del navegador se está guardando tu preferencia de idioma y cámbiala a "es" manualmente sin usar los botones.
2. **Reto 2:** Abre la consola y escribe un comando en una sola línea que modifique el DOM para eliminar la clase `hidden` del elemento con ID `admin-panel`. 
3. **Reto 3:** Inspecciona el código de `app.js`. ¿Qué nombre tiene la base de datos de IndexedDB y qué `STORE_NAME` utiliza?
4. **Reto 4:** Agrega un registro directamente a IndexedDB utilizando la consola de JavaScript en lugar de los botones. (Pista: Busca cómo la función `addDataToIDB()` lo hace).

---

## ⏱️ Parte 5: Reflexión y Cierre (5 min)

### Preguntas de Reflexión
* Si pudiste ver el HTML del panel admin aunque estaba oculto, ¿qué significa esto para el diseño de APIs? (El backend nunca debe enviar datos sensibles si el usuario no tiene permisos reales).
* Si las cookies viajan en cada petición HTTP y pueden ser leídas/modificadas por JavaScript (XSS), ¿cómo se protegen las sesiones de autenticación de verdad? (Usando banderas `HttpOnly` y `Secure` en las cookies).

### Lecciones de Seguridad (Para llevar)
1. **Frontend != Seguridad:** Validar un rol, precio, o acceso en React, Angular o Vanilla JS es solo por "Experiencia de Usuario (UX)". La seguridad real siempre ocurre en el backend.
2. **Lo que se manda, se ve:** Nunca envíes en el HTML, JS o estado inicial datos de otros usuarios o menús de administración esperando que el usuario "no mire" el código fuente.
3. **No confíes en el estado local:** LocalStorage y Cookies pueden ser editados libremente. El servidor debe validar criptográficamente la identidad (ej. JWT o Cookies de sesión de servidor cifradas/firmadas).
