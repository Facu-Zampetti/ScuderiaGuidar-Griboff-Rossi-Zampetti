document.addEventListener('DOMContentLoaded', async () => {
    try {
        const sessionRes = await fetch('../api/session.php', { credentials: 'include' });
        const sessionData = await sessionRes.json();

        if (!sessionData.logged || parseInt(sessionData.user.rol, 10) !== 1) {
            window.location.href = 'login.html';
            return;
        }
    } catch (e) {
        console.error('Error verificando sesion', e);
        window.location.href = 'login.html';
        return;
    }

    setupFiltersEvents();
    await Promise.all([loadCategoryFilterOptions(), loadBranchFilterOptions()]);
    await loadReservations();
});

function setupFiltersEvents() {
    const filterIds = ['sort-by', 'sort-dir', 'filter-category', 'filter-status', 'filter-branch'];
    filterIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', loadReservations);
        }
    });

    const resetButton = document.getElementById('filters-reset');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            document.getElementById('sort-by').value = 'fecha_operacion';
            document.getElementById('sort-dir').value = 'desc';
            document.getElementById('filter-category').value = '';
            document.getElementById('filter-status').value = '';
            document.getElementById('filter-branch').value = '';
            loadReservations();
        });
    }
}

async function loadCategoryFilterOptions() {
    const select = document.getElementById('filter-category');

    try {
        const res = await fetch('../api/get_types.php');
        const categories = await res.json();

        if (!Array.isArray(categories)) return;

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = String(category.ID_Tipos);
            option.textContent = category.Nombre;
            select.appendChild(option);
        });
    } catch (e) {
        console.error('Error cargando categorias de filtro', e);
    }
}

async function loadBranchFilterOptions() {
    const select = document.getElementById('filter-branch');

    try {
        const res = await fetch('../api/get_sucursales.php');
        const branches = await res.json();

        if (!Array.isArray(branches)) return;

        branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = String(branch.ID);
            option.textContent = branch.Nombre;
            select.appendChild(option);
        });
    } catch (e) {
        console.error('Error cargando sucursales de filtro', e);
    }
}

function buildReservationsQuery() {
    const params = new URLSearchParams();

    const sortBy = document.getElementById('sort-by').value;
    const sortDir = document.getElementById('sort-dir').value;
    const category = document.getElementById('filter-category').value;
    const status = document.getElementById('filter-status').value;
    const branch = document.getElementById('filter-branch').value;

    params.set('sort_by', sortBy || 'fecha_operacion');
    params.set('sort_dir', sortDir || 'desc');

    if (category) params.set('tipo_id', category);
    if (status) params.set('estado_id', status);
    if (branch) params.set('sucursal_id', branch);

    return params.toString();
}

async function loadReservations() {
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');
    const grid = document.getElementById('reservations-grid');

    loader.classList.remove('hidden');
    emptyState.classList.add('hidden');
    grid.classList.add('hidden');

    try {
        const query = buildReservationsQuery();
        const res = await fetch(`../api/admin_reservas.php?${query}`, { credentials: 'include' });
        const reservas = await res.json();

        loader.classList.add('hidden');

        if (!Array.isArray(reservas) || reservas.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        grid.classList.remove('hidden');
        renderReservations(reservas, grid);
    } catch (err) {
        console.error('Error cargando reservas:', err);
        loader.innerHTML = '<p class="text-red-500">Error al cargar reservas.</p>';
    }
}

function renderReservations(reservas, container) {
    container.innerHTML = '';

    reservas.forEach(reserva => {
        let foto = reserva.Foto;
        if (foto && !foto.startsWith('http') && !foto.startsWith('../')) {
            foto = `../img/${foto}`;
        }

        let statusColor = 'bg-gray-100 text-gray-800';
        switch (parseInt(reserva.ID_Estado, 10)) {
            case 1: statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200'; break;
            case 2: statusColor = 'bg-green-100 text-green-800 border-green-200'; break;
            case 3: statusColor = 'bg-blue-100 text-blue-800 border-blue-200'; break;
            case 5: statusColor = 'bg-red-100 text-red-800 border-red-200'; break;
        }

        const fechaOperacion = formatDate(reserva.Fecha_Operacion);
        const fechaInicio = formatDate(reserva.Fecha_Inicio);
        const fechaFin = formatDate(reserva.Fecha_Fin);

        const estadoBloqueado = [3, 4, 5].includes(parseInt(reserva.ID_Estado, 10));
        const sucursalRetiro = reserva.SucursalRetiroNombre || '-';
        const sucursalDevolucion = reserva.SucursalDevolucionNombre || '-';

        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col';

        card.innerHTML = `
            <div class="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span class="text-xs font-mono text-gray-500">#${escapeHtml(reserva.CodigoReserva)}</span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}">
                    ${escapeHtml(reserva.EstadoNombre)}
                </span>
            </div>

            <div class="p-5 flex-1">
                <div class="flex gap-4 items-start mb-4">
                    <img src="${foto}" class="w-20 h-20 object-cover rounded-lg bg-gray-100" alt="Auto">
                    <div>
                        <h3 class="font-bold text-gray-900">${escapeHtml(reserva.Marca)} ${escapeHtml(reserva.Modelo)}</h3>
                        <p class="text-sm text-gray-500">
                            Total: <span class="font-semibold text-gray-900">${formatCurrency(reserva.Precio_Total)}</span>
                        </p>
                    </div>
                </div>

                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Fecha de reserva:</span>
                        <span class="text-gray-900 font-medium">${fechaOperacion}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Categoria:</span>
                        <span class="text-gray-900 font-medium">${escapeHtml(reserva.TipoNombre || '-')}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Cliente:</span>
                        <span class="text-gray-900 font-medium">${escapeHtml(reserva.ClienteNombre)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Mail:</span>
                        <span class="text-gray-900 font-medium">${escapeHtml(reserva.ClienteMail)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">DNI:</span>
                        <span class="text-gray-900 font-medium">${escapeHtml(reserva.ClienteDNI)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Retiro:</span>
                        <span class="text-gray-900 font-medium">${fechaInicio}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Devolucion:</span>
                        <span class="text-gray-900 font-medium">${fechaFin}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Sucursal retiro:</span>
                        <span class="text-gray-900 font-medium">${escapeHtml(sucursalRetiro)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Sucursal devolucion:</span>
                        <span class="text-gray-900 font-medium">${escapeHtml(sucursalDevolucion)}</span>
                    </div>
                </div>
            </div>

            <div class="px-5 py-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
                <select id="estado-${reserva.ReservaID}" 
                        class="border rounded-lg p-2 text-sm focus:ring-blue-500"
                        ${estadoBloqueado ? 'disabled' : ''}>
                    <option value="1" ${reserva.ID_Estado == 1 ? 'selected' : ''}>Pendiente</option>
                    <option value="2" ${reserva.ID_Estado == 2 ? 'selected' : ''}>Confirmada</option>
                    <option value="5" ${reserva.ID_Estado == 5 ? 'selected' : ''}>Cancelada</option>
                </select>

                <button onclick="updateReservationStatus(${reserva.ReservaID})"
                        class="w-full py-2 px-4 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors
                        ${estadoBloqueado ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${estadoBloqueado ? 'disabled' : ''}>
                    Modificar Estado
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}

async function updateReservationStatus(id) {
    const select = document.getElementById(`estado-${id}`);
    const newEstado = select.value;

    try {
        const res = await fetch('../api/admin_mod_reservas.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_reserva: id, new_estado: newEstado })
        });

        const data = await res.json();

        if (data.success) {
            alert('Estado actualizado correctamente.');
            loadReservations();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexion.');
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatCurrency(value) {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return '$0';
    return '$' + amount.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}
