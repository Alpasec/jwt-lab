document.addEventListener("DOMContentLoaded", () => {
    let currentChallengeId = null;
    let challengeToken = null;

    const ui = {
        grid: document.getElementById("challenge-grid"),
        workspace: document.getElementById("challenge-workspace"),
        btnBack: document.getElementById("btn-back-grid"),
        challengeTitle: document.getElementById("current-challenge-title"),
        
        loginForm: document.getElementById("login-form"),
        registerBtn: document.getElementById("register-btn"),
        logoutBtn: document.getElementById("logout-btn"),
        
        authPanel: document.getElementById("auth-panel"),
        userPanel: document.getElementById("user-panel"),
        
        adminPanelBtn: document.getElementById("admin-panel-btn"),
        adminPanelContainer: document.getElementById("admin-panel-container"),
        adminDataBody: document.getElementById("admin-data-body"),
        
        bankProfile: document.getElementById("bank-profile"),
        
        alertBox: document.getElementById("alert-box"),
        
        rewardSection: document.getElementById("reward-section"),
        rewardImage: document.getElementById("reward-image"),
        rewardPlaceholder: document.getElementById("reward-placeholder")
    };

    const rewards = {
        1: { name: "Messi", src: "/static/challenge_rewards/messi.png" },
        2: { name: "Cristiano Ronaldo", src: "/static/challenge_rewards/ronaldo.png" },
        3: { name: "Messi + Cristiano Ronaldo", src: "/static/challenge_rewards/messi_ronaldo.png" },
        4: { name: "Chaufa", src: "/static/challenge_rewards/chaufa.jpeg" }
    };

    // --- UTILS ---
    function showAlert(msg, isError = true) {
        ui.alertBox.textContent = msg;
        ui.alertBox.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
        ui.alertBox.classList.remove('hidden');
        setTimeout(() => ui.alertBox.classList.add('hidden'), 5000);
    }

    async function apiRequest(endpoint, method = "GET", body = null) {
        // Cargar token desde las cookies por si el alumno lo editó en DevTools
        loadToken();
        
        const headers = {
            "Content-Type": "application/json"
        };
        
        if (challengeToken) {
            headers["Authorization"] = `Bearer ${challengeToken}`;
        }

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const response = await fetch(`/api/challenge/${currentChallengeId}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || "Error en la petición");
        }
        return data;
    }

    function setToken(token) {
        challengeToken = token;
        if (token) {
            document.cookie = `challenge_token_${currentChallengeId}=${token}; path=/;`;
        } else {
            document.cookie = `challenge_token_${currentChallengeId}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
    }

    function loadToken() {
        const match = document.cookie.match(new RegExp('(^| )' + `challenge_token_${currentChallengeId}` + '=([^;]+)'));
        challengeToken = match ? match[2] : null;
    }

    // --- UI UPDATES ---
    async function updateDashboard() {
        // Reset Admin UI
        ui.adminPanelContainer.classList.add('hidden');
        ui.rewardSection.classList.add('hidden');
        ui.rewardImage.style.display = 'inline-block';
        ui.rewardPlaceholder.style.display = 'none';

        if (!challengeToken) {
            ui.authPanel.classList.remove('hidden');
            ui.userPanel.classList.add('hidden');
            return;
        }

        ui.authPanel.classList.add('hidden');
        ui.userPanel.classList.remove('hidden');

        try {
            const bankData = await apiRequest("/bank");
            renderBankProfile(bankData.profile);
        } catch (e) {
            showAlert(e.message);
            if (e.message.includes("Token inválido") || e.message.includes("No Autorizado")) {
                setToken(null);
                updateDashboard();
            }
        }
    }

    function renderBankProfile(profile) {
        let txHtml = profile.recent_transactions.map(t => 
            `<li>${t.date}: ${t.description} <strong>$${t.amount}</strong></li>`
        ).join('');

        ui.bankProfile.innerHTML = `
            <p><strong>Usuario:</strong> ${profile.username}</p>
            <p><strong>Nombre:</strong> ${profile.full_name}</p>
            <p><strong>Cuenta:</strong> ${profile.account_type} (${profile.account_number})</p>
            <p><strong>Saldo:</strong> $${profile.available_balance}</p>
            <p><strong>Tarjeta:</strong> ${profile.card_masked}</p>
            <hr>
            <h4>Últimos movimientos simulados:</h4>
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
            
            // Show Reward if success
            showReward();
            
        } catch (e) {
            showAlert("Error cargando panel admin: " + e.message);
        }
    }

    function showReward() {
        const reward = rewards[currentChallengeId];
        if (reward) {
            ui.rewardImage.src = reward.src;
            ui.rewardPlaceholder.textContent = `Reward: ${reward.name}`;
            ui.rewardSection.classList.remove('hidden');
            // Scroll to reward
            ui.rewardSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    function selectChallenge(id) {
        currentChallengeId = id;
        document.body.className = `challenge-theme-${id}`;
        ui.challengeTitle.textContent = `Reto ${id}`;
        
        ui.grid.classList.add('hidden');
        ui.workspace.classList.remove('hidden');
        
        loadToken();
        updateDashboard();
    }

    // --- EVENTS ---
    document.querySelectorAll('.challenge-card').forEach(card => {
        card.addEventListener('click', () => {
            selectChallenge(card.dataset.id);
        });
    });

    ui.btnBack.addEventListener('click', () => {
        ui.grid.classList.remove('hidden');
        ui.workspace.classList.add('hidden');
        document.body.className = '';
        currentChallengeId = null;
        challengeToken = null;
    });

    ui.loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = ui.loginForm.username.value;
        const password = ui.loginForm.password.value;
        
        try {
            const res = await apiRequest("/login", "POST", { username, password });
            setToken(res.token);
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
            setToken(res.token);
            showAlert("Registro exitoso", false);
            updateDashboard();
        } catch (e) {
            showAlert(e.message);
        }
    });

    ui.logoutBtn.addEventListener("click", () => {
        setToken(null);
        updateDashboard();
    });

    ui.adminPanelBtn.addEventListener("click", loadAdminPanel);

});
