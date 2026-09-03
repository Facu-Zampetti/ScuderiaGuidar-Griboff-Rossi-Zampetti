// public/session.js
// Manejo de sesión y header dinámico según ROL (Admin vs Cliente)

const THEME_STORAGE_KEY = 'scuderiaguidar_theme';

function getStoredThemePreference() {
    try {
        const storedValue = localStorage.getItem(THEME_STORAGE_KEY);
        if (storedValue === 'dark' || storedValue === 'light') {
            return storedValue;
        }
    } catch (_) {}

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }

    return 'light';
}

function isDarkThemeEnabled() {
    return document.body?.classList.contains('theme-dark') ?? false;
}

function updateThemeSwitchState() {
    const button = document.getElementById('themeSwitchBtn');
    if (!button) return;

    const darkEnabled = isDarkThemeEnabled();
    button.setAttribute('aria-checked', String(darkEnabled));
    button.setAttribute('title', darkEnabled ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

function applyThemePreference(theme, persist = true) {
    if (!document.body) return;

    const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
    document.body.classList.toggle('theme-dark', normalizedTheme === 'dark');

    if (persist) {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
        } catch (_) {}
    }

    updateThemeSwitchState();
}

function toggleThemePreference() {
    applyThemePreference(isDarkThemeEnabled() ? 'light' : 'dark');
}

function initThemePreference() {
    if (document.body) {
        applyThemePreference(getStoredThemePreference(), false);
        return;
    }

    document.addEventListener('DOMContentLoaded', () => {
        applyThemePreference(getStoredThemePreference(), false);
    }, { once: true });
}

function getThemeSwitchHtml() {
    return `
        <button id="themeSwitchBtn" class="theme-switch" type="button" role="switch" aria-checked="false" aria-label="Cambiar modo claro u oscuro">
            <span class="theme-switch-icon" aria-hidden="true">☀</span>
            <span class="theme-switch-track" aria-hidden="true">
                <span class="theme-switch-thumb"></span>
            </span>
            <span class="theme-switch-icon" aria-hidden="true">☾</span>
        </button>
    `;
}

function bindThemeSwitch() {
    const button = document.getElementById('themeSwitchBtn');
    if (!button) return;
    button.addEventListener('click', toggleThemePreference);
    updateThemeSwitchState();
}

async function updateHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    // 1. Detectar página actual para el subrayado
    const path = window.location.pathname;
    const page = path.split("/").pop(); 

    // Estilos de enlaces
    const activeClass = "text-primary font-semibold border-b-2 border-secondary pb-1";
    const inactiveClass = "text-text-secondary hover:text-primary transition-quick pb-1";

    function getClass(targetPage) {
        if ((targetPage === 'homepage.html' && (page === '' || page === '/')) || page === targetPage) {
            return activeClass;
        }
        return inactiveClass;
    }

    try {
        const res = await fetch('../api/session.php', { credentials: 'include' });
        const data = await res.json();
        const themeSwitchHtml = getThemeSwitchHtml();

        // Logo común
        const logoHtml = `
            <div class="flex items-center">
                <a href="homepage.html" class="flex items-center group">
                    <svg class="h-10 w-10 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="100" height="100" fill="#F7C52D"/>
                        <path class="site-logo-contrast" d="M0 70 Q40 40, 100 0 L100 30 Q55 60, 0 90 Z" fill="#000"/>
                        <rect class="site-logo-contrast" x="10" y="65" width="10" height="25" fill="#000"/>
                        <rect class="site-logo-contrast" x="30" y="55" width="10" height="35" fill="#000"/>
                        <rect class="site-logo-contrast" x="50" y="45" width="10" height="45" fill="#000"/>
                    </svg>
                    <span class="ml-3 text-xl font-bold text-primary">ScuderiaGuidar</span>
                </a>
            </div>
        `;

        if (data.logged) {
            let menuLinks = '';
            
            if (parseInt(data.user.rol) === 1) {
                // --- MENU ADMINISTRADOR ---
                menuLinks = `
                    <a href="homepage.html" class="${getClass('homepage.html')}">Inicio</a>
                    <a href="admin_flota.html" class="${getClass('admin_flota.html')}">Flota</a>
                    <a href="admin_reservas.html" class="${getClass('admin_reservas.html')}">Reservas</a>
                    <a href="admin_clientes.html" class="${getClass('admin_clientes.html')}">Clientes</a>
                    <a href="admin_dashboard.html" class="${getClass('admin_dashboard.html')}">Dashboard</a>
                `;
            } else {
                // --- MENU CLIENTE ---
                menuLinks = `
                    <a href="homepage.html" class="${getClass('homepage.html')}">Inicio</a>
                    <a href="vehicle_catalog.html" class="${getClass('vehicle_catalog.html')}">Vehículos</a>
                    <a href="reservation_gestion.html" class="${getClass('reservation_gestion.html')}">Mis Reservas</a>
                    <a href="reservation_system.html" class="${getClass('reservation_system.html')}">Nueva Reserva</a>
                `;
            }

            header.innerHTML = `
                <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        ${logoHtml}

                        <div class="flex items-center gap-3">
                            ${themeSwitchHtml}

                            <div class="hidden md:flex items-center space-x-6">
                                ${menuLinks}

                                <div class="flex items-center ml-4 pl-4 border-l border-gray-200">
                                    <div class="flex flex-col items-end mr-4">
                                        <span class="text-sm font-semibold text-primary">
                                            Hola, ${escapeHtml(data.user.nombre)}
                                        </span>
                                        <span class="text-xs text-gray-500 uppercase tracking-wider font-bold">
                                            ${parseInt(data.user.rol) === 1 ? 'ADMINISTRADOR' : 'Cliente'}
                                        </span>
                                    </div>
                                    <button id="logoutBtn" class="text-sm bg-secondary text-primary font-semibold px-3 py-2 rounded-md transition-colors hover:bg-primary hover:text-white">
                                        Cerrar sesión
                                    </button>
                                </div>
                            </div>

                            <div class="md:hidden">
                                <button class="text-primary"><svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg></button>
                            </div>
                        </div>
                    </div>
                </nav>
            `;

            document.getElementById('logoutBtn').addEventListener('click', logout);
            bindThemeSwitch();

        } else {
            header.innerHTML = `
                <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        ${logoHtml}

                        <div class="flex items-center gap-3">
                            ${themeSwitchHtml}

                            <div class="hidden md:flex items-center space-x-8">
                                <a href="homepage.html" class="${getClass('homepage.html')}">Inicio</a>
                                <a href="vehicle_catalog.html" class="${getClass('vehicle_catalog.html')}">Vehículos</a>
                                <a href="reservation_system.html" class="${getClass('reservation_system.html')}">Reservar</a>
                                
                                <div class="flex items-center space-x-4 ml-4">
                                    <a href="login.html" class="${getClass('login.html')}">Iniciar Sesión</a>
                                    <a href="registration.html" class="bg-secondary text-primary font-semibold px-4 py-2 rounded-md transition-colors hover:bg-primary hover:text-white">
                                        Registrarse
                                    </a>
                                </div>
                            </div>

                            <div class="md:hidden">
                                 <button class="text-primary"><svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg></button>
                            </div>
                        </div>
                    </div>
                </nav>
            `;

            bindThemeSwitch();
        }
    } catch (err) {
        console.error('Error al verificar sesión:', err);
    }
}

async function logout() {
    try {
        await fetch('../api/logout.php', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.reload();
    } catch (err) {
        alert('Error cerrando sesión');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

initThemePreference();

document.addEventListener('DOMContentLoaded', () => {
    updateHeader();
});