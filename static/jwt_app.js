document.addEventListener("DOMContentLoaded", () => {
    // Determinar el nivel de seguridad leyendo un meta tag o desde la variable del template
    const level = document.body.dataset.level || "secure";
    
    const ui = {
        loginForm: document.getElementById("login-form"),
        registerBtn: document.getElementById("register-btn"),
        logoutBtn: document.getElementById("logout-btn"),
        authPanel: document.getElementById("auth-panel"),
        userPanel: document.getElementById("user-panel"),
        adminPanelBtn: document.getElementById("admin-panel-btn"),
        adminPanelContainer: document.getElementById("admin-panel-container"),
        adminDataBody: document.getElementById("admin-data-body"),
        bankProfile: document.getElementById("bank-profile"),
        jwtRaw: document.getElementById("jwt-raw"),
        jwtDecoded: document.getElementById("jwt-decoded"),
        alertBox: document.getElementById("alert-box")
    };

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i=0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    function setCookie(name, value) {
        document.cookie = name + "=" + (value || "")  + "; path=/";
    }
    
    function eraseCookie(name) {   
        document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }

    // Almacenar token en cookies para el lab en lugar de localStorage
    let currentToken = getCookie(`jwt_token_${level}`);

    function showAlert(msg, isError = true) {
        ui.alertBox.textContent = msg;
        ui.alertBox.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
        ui.alertBox.classList.remove('hidden');
        setTimeout(() => ui.alertBox.classList.add('hidden'), 5000);
    }

    function renderJWT(token) {
        if (!token) {
            ui.jwtRaw.innerHTML = "No hay token.";
            ui.jwtDecoded.innerHTML = "";
            return;
        }

        const parts = token.split('.');
        if (parts.length === 3) {
            ui.jwtRaw.innerHTML = `<span class="jwt-header">${parts[0]}</span>.<span class="jwt-payload">${parts[1]}</span>.<span class="jwt-signature">${parts[2]}</span>`;
            
            try {
                const header = JSON.parse(atob(parts[0]));
                const payload = JSON.parse(atob(parts[1]));
                
                ui.jwtDecoded.innerHTML = `
                    <strong>Header:</strong>
                    <pre>${JSON.stringify(header, null, 2)}</pre>
                    <strong>Payload (Editable en DevTools):</strong>
                    <pre id="payload-display">${JSON.stringify(payload, null, 2)}</pre>
                `;
            } catch (e) {
                ui.jwtDecoded.innerHTML = "Error decodificando JWT en el cliente.";
            }
        } else {
            ui.jwtRaw.textContent = token;
        }
    }

    async function apiRequest(endpoint, method = "GET", body = null) {
        const headers = {
            "Content-Type": "application/json",
            "X-Lab-Level": level
        };
        
        if (currentToken) {
            headers["Authorization"] = `Bearer ${currentToken}`;
        }

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`/api${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Error en la petición");
        }
        return data;
    }

    async function updateDashboard() {
        if (!currentToken) {
            ui.authPanel.classList.remove('hidden');
            ui.userPanel.classList.add('hidden');
            ui.adminPanelContainer.classList.add('hidden');
            renderJWT(null);
            return;
        }

        ui.authPanel.classList.add('hidden');
        ui.userPanel.classList.remove('hidden');
        renderJWT(currentToken);

        try {
            // Cargar datos bancarios
            const bankData = await apiRequest("/bank");
            renderBankProfile(bankData.profile, bankData.validated_by);
            
            // Decodificar token para ver rol
            const meData = await apiRequest("/me");
            if (meData.payload && meData.payload.role === "admin") {
                ui.adminPanelBtn.classList.remove('hidden');
            } else {
                ui.adminPanelBtn.classList.add('hidden');
            }
        } catch (e) {
            showAlert(e.message);
            if (e.message.includes("Token inválido") || e.message.includes("No Autorizado")) {
                logout();
            }
        }
    }

    function renderBankProfile(profile, validated_by) {
        let txHtml = profile.recent_transactions.map(t => 
            `<li>${t.date}: ${t.description} <strong>$${t.amount}</strong></li>`
        ).join('');

        ui.bankProfile.innerHTML = `
            <div class="alert alert-success">Validado por backend usando modo: <strong>${validated_by}</strong></div>
            <p><strong>Usuario:</strong> ${profile.username}</p>
            <p><strong>Nombre:</strong> ${profile.full_name}</p>
            <p><strong>Cuenta:</strong> ${profile.account_type} (${profile.account_number})</p>
            <p><strong>Saldo:</strong> $${profile.available_balance}</p>
            <p><strong>Tarjeta:</strong> ${profile.card_masked}</p>
            <h4>Últimos movimientos falsos:</h4>
            <ul>${txHtml}</ul>
        `;
    }

    async function loadAdminPanel() {
        try {
            const data = await apiRequest("/admin/accounts");
            ui.adminDataBody.innerHTML = data.accounts.map(acc => `
                <tr>
                    <td>${acc.username}</td>
                    <td>${acc.full_name}</td>
                    <td>${acc.account_type}</td>
                    <td>$${acc.available_balance}</td>
                    <td>${acc.card_masked}</td>
                </tr>
            `).join('');
            ui.adminPanelContainer.classList.remove('hidden');
        } catch (e) {
            showAlert("Error cargando panel admin: " + e.message);
        }
    }

    function logout() {
        currentToken = null;
        eraseCookie(`jwt_token_${level}`);
        updateDashboard();
    }

    // Eventos
    ui.loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = ui.loginForm.username.value;
        const password = ui.loginForm.password.value;
        
        try {
            const res = await apiRequest("/login", "POST", { username, password });
            currentToken = res.token;
            setCookie(`jwt_token_${level}`, currentToken);
            showAlert("Login exitoso", false);
            updateDashboard();
        } catch (e) {
            showAlert(e.message);
        }
    });

    ui.registerBtn.addEventListener("click", async () => {
        const username = prompt("Ingresa un username. La contraseña será la misma:");
        if (!username) return;
        
        try {
            const res = await apiRequest("/register", "POST", { username });
            currentToken = res.token;
            setCookie(`jwt_token_${level}`, currentToken);
            showAlert("Registro exitoso", false);
            updateDashboard();
        } catch (e) {
            showAlert(e.message);
        }
    });

    ui.logoutBtn.addEventListener("click", logout);
    ui.adminPanelBtn.addEventListener("click", loadAdminPanel);

    // Inicializar
    updateDashboard();
    
    // Exponer para que los alumnos puedan jugar
    window.lab = {
        setToken: (token) => {
            currentToken = token;
            setCookie(`jwt_token_${level}`, currentToken);
            updateDashboard();
        },
        getToken: () => currentToken,
        level: level
    };
});
