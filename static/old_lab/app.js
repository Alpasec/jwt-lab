/**
 * Laboratorio Web: Almacenamiento y Seguridad
 * 
 * ==================================================================
 * ¡ATENCIÓN ALUMNO/A!
 * Si estás leyendo esto desde la pestaña "Sources" de DevTools:
 * ¡Bien hecho! Estás inspeccionando el código fuente del frontend.
 * 
 * En aplicaciones web modernas, TODO el código JavaScript que se
 * envía al navegador (cliente) puede ser leído, modificado y 
 * manipulado por el usuario.
 * 
 * Es por eso que NUNCA debes confiar en el frontend para 
 * decisiones críticas de seguridad (como ocultar un panel de admin).
 * ==================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar estado de la interfaz
    updateUI();
    setupEventListeners();
    
    // ==============================================================
    // VULNERABILIDAD INTENCIONAL 1: Control de Acceso en Frontend
    // ==============================================================
    // La aplicación decide si mostrar un panel de administrador
    // solo evaluando una cookie o un valor de localStorage.
    // Esto es muy inseguro porque el cliente puede editar estos valores.
    checkAdminAccess();
});

// ==================================================================
// LÓGICA PRINCIPAL Y RENDERIZADO
// ==================================================================

function updateUI() {
    updateTheme();
    updateStateDisplay();
}

/**
 * Lee todos los métodos de almacenamiento y los muestra en el panel "Estado Actual"
 */
function updateStateDisplay() {
    // 1. Leer Cookies
    const cookies = document.cookie || "Ninguna";
    document.getElementById("state-cookies").textContent = cookies;
    
    // Extraer el rol de la cookie (Vulnerable!)
    const roleMatch = document.cookie.match(/(?:^|; )role=([^;]*)/);
    const role = roleMatch ? roleMatch[1] : "Desconocido (user)";
    document.getElementById("state-role").textContent = role;

    // 2. Leer localStorage
    const theme = localStorage.getItem("theme") || "Claro";
    document.getElementById("state-theme").textContent = theme === 'dark' ? 'Oscuro' : 'Claro';

    // 3. Leer sessionStorage
    const step = sessionStorage.getItem("currentStep") || "Ninguno";
    document.getElementById("state-step").textContent = step;

    // 4. Actualizar vista de IndexedDB
    updateIDBDisplay();

    // 5. Actualizar vista de Cache
    updateCacheDisplay();
}

/**
 * Aplica el tema según lo guardado en localStorage.
 * Al persistir en localStorage, este ajuste sobrevive aunque cierres la pestaña o navegador.
 */
function updateTheme() {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
        document.body.classList.add("dark-theme");
        document.body.classList.remove("light-theme");
    } else {
        document.body.classList.add("light-theme");
        document.body.classList.remove("dark-theme");
    }
}

/**
 * FUNCIÓN VULNERABLE: Muestra u oculta el panel admin basándose en el cliente.
 * Un atacante solo necesita abrir la consola y escribir: 
 * document.cookie = "role=admin"; location.reload();
 */
function checkAdminAccess() {
    const adminPanel = document.getElementById("admin-panel");
    const roleMatch = document.cookie.match(/(?:^|; )role=([^;]*)/);
    const role = roleMatch ? roleMatch[1] : null;

    if (role === "admin") {
        // ERROR DE SEGURIDAD: Ocultar con CSS no protege los datos.
        adminPanel.classList.remove("hidden");
    } else {
        adminPanel.classList.add("hidden");
    }
}


// ==================================================================
// EVENT LISTENERS (Conexión de los botones de la interfaz)
// ==================================================================

function setupEventListeners() {
    document.getElementById("btn-refresh-state").addEventListener("click", updateUI);

    // --- 1. LOCAL STORAGE ---
    // Guarda datos como pares clave-valor. No expiran. Viajan solo en frontend.
    document.getElementById("btn-theme-dark").addEventListener("click", () => {
        localStorage.setItem("theme", "dark");
        updateUI();
    });
    document.getElementById("btn-theme-light").addEventListener("click", () => {
        localStorage.setItem("theme", "light");
        updateUI();
    });
    document.getElementById("btn-lang-en").addEventListener("click", () => {
        localStorage.setItem("lang", "en");
        alert("Idioma 'en' guardado en localStorage");
        updateUI();
    });

    // --- 2. SESSION STORAGE ---
    // Igual que localStorage, pero se borra al cerrar la pestaña actual.
    document.getElementById("btn-step-1").addEventListener("click", () => {
        sessionStorage.setItem("currentStep", "Paso 1 Completado");
        updateUI();
    });
    document.getElementById("btn-step-2").addEventListener("click", () => {
        sessionStorage.setItem("currentStep", "Paso 2 Completado");
        updateUI();
    });
    document.getElementById("btn-clear-session").addEventListener("click", () => {
        sessionStorage.clear();
        updateUI();
    });

    // --- 3. COOKIES ---
    // Datos que (usualmente) el servidor establece y lee.
    // Viajan automáticamente en CADA petición HTTP (Headers).
    document.getElementById("btn-cookie-pref").addEventListener("click", () => {
        document.cookie = "ui_preference=compact; path=/";
        updateUI();
    });
    document.getElementById("btn-cookie-user").addEventListener("click", () => {
        document.cookie = "role=user; path=/";
        updateUI();
        checkAdminAccess();
    });
    document.getElementById("btn-cookie-admin").addEventListener("click", () => {
        // ¡Cuidado! Otorgar permisos vía cookies manipulables en cliente es crítico.
        document.cookie = "role=admin; path=/";
        updateUI();
        checkAdminAccess(); // Esto revelará el panel admin
    });
    document.getElementById("btn-clear-cookies").addEventListener("click", () => {
        // Para borrar una cookie, se establece su fecha de expiración al pasado.
        document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "ui_preference=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        updateUI();
        checkAdminAccess();
    });

    // --- 4. INDEXED DB ---
    document.getElementById("btn-idb-add").addEventListener("click", addDataToIDB);
    document.getElementById("btn-idb-read").addEventListener("click", updateIDBDisplay);
    document.getElementById("btn-idb-clear").addEventListener("click", clearIDB);

    // --- 5. CACHE STORAGE ---
    document.getElementById("btn-cache-create").addEventListener("click", createDemoCache);
    document.getElementById("btn-cache-read").addEventListener("click", updateCacheDisplay);
    document.getElementById("btn-cache-clear").addEventListener("click", clearDemoCache);
}


// ==================================================================
// FUNCIONES DE INDEXEDDB (Base de datos NoSQL del navegador)
// ==================================================================
// Permite guardar grandes cantidades de datos estructurados, incluyendo archivos/blobs.
const DB_NAME = "Lab_Demo_DB";
const STORE_NAME = "notas_demo";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function addDataToIDB() {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        
        const datoFalso = {
            titulo: "Nota Secreta " + Math.floor(Math.random() * 1000),
            contenido: "Este es un dato almacenado directamente en IndexedDB en el navegador.",
            timestamp: new Date().toISOString()
        };
        
        store.add(datoFalso);
        
        tx.oncomplete = () => {
            console.log("Registro añadido a IndexedDB");
            updateIDBDisplay();
        };
    } catch (e) {
        console.error("Error en IDB:", e);
    }
}

async function updateIDBDisplay() {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const items = request.result;
            const displayEl = document.getElementById("state-idb");
            if (items.length === 0) {
                displayEl.textContent = "Vacío";
            } else {
                displayEl.textContent = `${items.length} registro(s) guardados. Abre DevTools -> Application -> IndexedDB para ver detalles.`;
            }
        };
    } catch (e) {
        document.getElementById("state-idb").textContent = "Error o no soportado";
    }
}

async function clearIDB() {
    try {
        const db = await openDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => {
            console.log("IndexedDB limpiada");
            updateIDBDisplay();
        };
    } catch (e) {
        console.error("Error limpiando IDB:", e);
    }
}


// ==================================================================
// FUNCIONES DE CACHE STORAGE
// ==================================================================
// Diseñado para Service Workers y funcionamiento offline.
const CACHE_NAME = "demo-cache-v1";

async function createDemoCache() {
    try {
        const cache = await caches.open(CACHE_NAME);
        // Simulamos el guardado de recursos estáticos en caché
        await cache.addAll([
            '/',
            '/index.html',
            '/styles.css',
            '/app.js'
        ]);
        console.log("Recursos cacheados con éxito");
        updateCacheDisplay();
    } catch (e) {
        console.error("Error cacheando recursos (esto puede fallar si no usas un servidor HTTP local):", e);
        alert("Error: Cache Storage requiere ejecutarse sobre HTTP/HTTPS (ej. http://localhost). No funciona abriendo el archivo directamente file://");
    }
}

async function updateCacheDisplay() {
    try {
        const hasCache = await caches.has(CACHE_NAME);
        const displayEl = document.getElementById("state-cache");
        
        if (hasCache) {
            const cache = await caches.open(CACHE_NAME);
            const requests = await cache.keys();
            displayEl.textContent = `Caché "${CACHE_NAME}" existe con ${requests.length} recursos.`;
        } else {
            displayEl.textContent = "Vacío";
        }
    } catch (e) {
        document.getElementById("state-cache").textContent = "No disponible";
    }
}

async function clearDemoCache() {
    try {
        await caches.delete(CACHE_NAME);
        console.log("Caché limpiado");
        updateCacheDisplay();
    } catch (e) {
        console.error("Error limpiando caché:", e);
    }
}
