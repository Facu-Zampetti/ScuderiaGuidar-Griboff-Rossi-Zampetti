let fleetCache = [];

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([loadTypes(), loadBranches()]);
    loadFleet();
});

// --- CARGAR TABLA ---
async function loadFleet() {
    const tbody = document.getElementById('fleet-table-body');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">Actualizando flota...</td></tr>';

    try {
        const res = await fetch(`../api/admin_get_fleet.php?t=${new Date().getTime()}`);

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Error del servidor (${res.status}): ${errorText.substring(0, 100)}...`);
        }

        const autos = await res.json();

        if (!Array.isArray(autos)) {
            throw new Error('El servidor no devolvio una lista valida de autos.');
        }

        fleetCache = autos;
        tbody.innerHTML = '';

        if (autos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8">No hay vehiculos registrados.</td></tr>';
            return;
        }

        autos.forEach(auto => {
            const isStar = auto.Destacado == 1;
            const starClass = isStar ? 'text-yellow-400 fill-current scale-110' : 'text-gray-300 hover:text-yellow-400';

            const tr = document.createElement('tr');
            tr.className = `transition-colors border-b ${isStar ? 'bg-yellow-50' : 'hover:bg-gray-50'}`;

            let foto = auto.Foto;
            if (foto && !foto.includes('/')) foto = '../img/autos/' + foto;

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <img class="h-10 w-16 object-cover rounded bg-gray-200" src="${foto}" onerror="this.src='../img/placeholder.jpg'">
                        <div class="ml-4 text-sm font-medium text-gray-900">${escapeHtml(auto.Marca)} ${escapeHtml(auto.Modelo)}</div>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">${escapeHtml(auto.TipoNombre || '-')}</td>
                <td class="px-6 py-4 text-sm font-mono text-gray-500">${escapeHtml(auto.Patente || '-')}</td>
                <td class="px-6 py-4 text-sm text-gray-600">${renderBranchBadges(auto.SucursalesNombres)}</td>
                <td class="px-6 py-4 text-sm font-bold text-gray-900">$${auto.Precio}</td>
                <td class="px-6 py-4 text-center">
                    <span class="px-2 py-1 text-xs rounded-full ${auto.Disponibilidad == 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${auto.Disponibilidad == 1 ? 'Disponible' : 'Ocupado'}
                    </span>
                </td>
                <td class="px-6 py-4 text-center cursor-pointer group" onclick="toggleStar(${auto.ID})">
                    <svg class="h-6 w-6 ${starClass} transition-all mx-auto transform group-hover:scale-110" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                </td>
                <td class="px-6 py-4 text-right text-sm font-medium">
                    <button onclick="editCar(${auto.ID})" class="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                    <button onclick="deleteCar(${auto.ID})" class="text-red-600 hover:text-red-900">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500 py-4 font-bold">Error: ${e.message}</td></tr>`;
    }
}

function normalizeBranchNames(rawNames) {
    if (Array.isArray(rawNames)) {
        return rawNames.map(name => String(name).trim()).filter(Boolean);
    }
    if (typeof rawNames === 'string' && rawNames.trim() !== '') {
        return rawNames
            .split('||')
            .map(name => name.trim())
            .filter(Boolean);
    }
    return [];
}

function normalizeBranchIds(rawIds) {
    if (Array.isArray(rawIds)) {
        return rawIds
            .map(value => parseInt(value, 10))
            .filter(value => Number.isInteger(value) && value > 0);
    }
    if (typeof rawIds === 'string' && rawIds.trim() !== '') {
        return rawIds
            .split(',')
            .map(value => parseInt(value, 10))
            .filter(value => Number.isInteger(value) && value > 0);
    }
    return [];
}

function renderBranchBadges(rawNames) {
    const names = normalizeBranchNames(rawNames);

    if (names.length === 0) {
        return '<span class="inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">Sin asignar</span>';
    }

    return names
        .map(name => `<span class="inline-block mr-1 mb-1 px-2 py-1 text-xs rounded bg-blue-50 text-blue-700">${escapeHtml(name)}</span>`)
        .join('');
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

// --- ACCIONES ---
async function toggleStar(id) {
    try {
        const res = await fetch('../api/admin_vehicle_actions.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'toggle_star', id: id })
        });
        const data = await res.json();
        if (data.success) {
            loadFleet();
        } else {
            alert('Error: ' + (data.message || data.error));
        }
    } catch (e) {
        console.error(e);
    }
}

async function deleteCar(id) {
    if (!confirm('¿Estas seguro de eliminar este vehiculo?')) return;

    await fetch('../api/admin_vehicle_actions.php', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', id: id })
    });
    loadFleet();
}

// --- FORMULARIO ---
function editCar(autoId) {
    const auto = fleetCache.find(item => parseInt(item.ID, 10) === parseInt(autoId, 10));
    if (!auto) {
        alert('No se encontro el vehiculo para editar.');
        return;
    }

    document.getElementById('carId').value = auto.ID;
    document.getElementById('carBrand').value = auto.Marca;
    document.getElementById('carModel').value = auto.Modelo;
    document.getElementById('carPlate').value = auto.Patente;
    document.getElementById('carType').value = auto.ID_Tipos;

    const branchIds = normalizeBranchIds(auto.SucursalesIds);
    setSelectedBranches(branchIds);

    openModal(true);
}

function setSelectedBranches(ids) {
    const branchSelect = document.getElementById('carBranches');
    const idsSet = new Set(ids.map(id => String(id)));
    Array.from(branchSelect.options).forEach(option => {
        option.selected = idsSet.has(option.value);
    });
}

document.getElementById('carForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedBranches = Array.from(document.getElementById('carBranches').selectedOptions)
        .map(option => option.value)
        .filter(Boolean);

    if (selectedBranches.length === 0) {
        alert('Selecciona al menos una sucursal para el vehiculo.');
        return;
    }

    const formData = new FormData();
    formData.append('id', document.getElementById('carId').value);
    formData.append('marca', document.getElementById('carBrand').value);
    formData.append('modelo', document.getElementById('carModel').value);
    formData.append('patente', document.getElementById('carPlate').value);
    formData.append('tipo', document.getElementById('carType').value);
    selectedBranches.forEach(branchId => formData.append('sucursales[]', branchId));

    const fileInput = document.getElementById('carImage');
    if (fileInput.files[0]) {
        formData.append('imagen', fileInput.files[0]);
    }

    try {
        const res = await fetch('../api/admin_save_vehicle.php', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            closeModal();
            loadFleet();
        } else {
            alert('Error: ' + (data.message || 'Error al guardar'));
        }
    } catch (err) {
        console.error(err);
        alert('Error de conexion');
    }
});

async function loadTypes() {
    try {
        const res = await fetch('../api/get_types.php');
        const types = await res.json();
        const select = document.getElementById('carType');
        select.innerHTML = '';

        if (!Array.isArray(types) || types.length === 0) {
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Sin categorias';
            select.appendChild(emptyOption);
            return;
        }

        types.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.ID_Tipos;
            opt.textContent = t.Nombre;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Error cargando tipos', e);
    }
}

async function loadBranches() {
    const select = document.getElementById('carBranches');
    select.innerHTML = '<option disabled>Cargando sucursales...</option>';

    try {
        const res = await fetch('../api/get_sucursales.php');
        const branches = await res.json();

        select.innerHTML = '';

        if (!Array.isArray(branches) || branches.length === 0) {
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.disabled = true;
            emptyOption.textContent = 'No hay sucursales cargadas';
            select.appendChild(emptyOption);
            return;
        }

        branches.forEach(branch => {
            const opt = document.createElement('option');
            opt.value = String(branch.ID);
            opt.textContent = `${branch.Nombre} - ${branch.Direccion}`;
            select.appendChild(opt);
        });
    } catch (e) {
        console.error('Error cargando sucursales', e);
        select.innerHTML = '<option disabled>Error al cargar sucursales</option>';
    }
}