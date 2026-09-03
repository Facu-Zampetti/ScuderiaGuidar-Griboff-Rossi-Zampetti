document.addEventListener('DOMContentLoaded', () => {
    loadClients();
});

/* ============================
   CARGAR TABLA DE CLIENTES
   ============================ */
async function loadClients() {
    const tbody = document.getElementById('clients-table-body');
    tbody.innerHTML = `
        <tr>
            <td colspan="10" class="text-center py-4 text-gray-500">
                Cargando clientes...
            </td>
        </tr>
    `;

    try {
        const res = await fetch('../api/admin_get_clientes.php?t=' + Date.now());

        if (!res.ok) {
            throw new Error("Error al conectar con el servidor: " + res.status);
        }

        const clientes = await res.json();

        if (!Array.isArray(clientes)) {
            throw new Error("El servidor no devolvió una lista válida.");
        }

        tbody.innerHTML = "";

        if (clientes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-6">
                        No hay clientes registrados.
                    </td>
                </tr>
            `;
            return;
        }

        clientes.forEach(cli => {
            const tr = document.createElement('tr');
            tr.className = "border-b hover:bg-gray-50 transition-colors";

            const badgeColor =
                cli.Rol == 1
                ? "bg-purple-100 text-purple-700"
                : "bg-green-100 text-green-700";

            const badgeText =
                cli.Rol == 1 ? "Admin" : "Cliente";

            tr.innerHTML = `
                <td class="px-4 py-4 font-medium text-gray-800">${cli.ID}</td>

                <td class="px-4 py-4">
                    <span class="px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}">
                        ${badgeText}
                    </span>
                </td>

                <td class="px-4 py-4 font-medium">${cli.Nombre}</td>
                <td class="px-4 py-4">${cli.Apellido}</td>

                <td class="px-4 py-4 font-mono">${cli.DNI}</td>
                <td class="px-4 py-4">${cli.Mail}</td>
                <td class="px-4 py-4">${cli.Telefono || '-'}</td>
                <td class="px-4 py-4">${cli.Nacimiento || '-'}</td>
                <td class="px-4 py-4">${cli.Licencia || '-'}</td>
                <td class="px-4 py-4">${cli.Direccion || '-'}</td>

                <td class="px-4 py-4 text-right space-x-3">

                    <!-- BOTÓN ADMIN -->
                    <button onclick='toggleAdmin(${cli.ID}, ${cli.Rol})'
                        class="text-blue-600 hover:text-blue-800 font-medium">
                        ${cli.Rol == 1 ? 'Quitar Admin' : 'Hacer Admin'}
                    </button>

                    <!-- BOTÓN MODIFICAR -->
                    <button onclick='editClient(${JSON.stringify(cli)})'
                        class="text-yellow-600 hover:text-yellow-800 font-medium">
                        Modificar
                    </button>

                    <!-- BOTÓN ELIMINAR -->
                    <button onclick='deleteClient(${cli.ID})'
                        class="text-red-600 hover:text-red-800 font-medium">
                        Eliminar
                    </button>
                </td>
            `;

            tbody.appendChild(tr);
        });

    } catch (err) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-red-600 font-semibold">
                    Error: ${err.message}
                </td>
            </tr>
        `;
        console.error(err);
    }
}

/* ============================
   CAMBIAR ROL (0 ↔ 1)
   ============================ */
async function toggleAdmin(id, rolActual) {

    const nuevoRol = rolActual == 1 ? 0 : 1;

    if (!confirm(`¿Deseas cambiar el rol del usuario ${id} a ${nuevoRol}?`)) {
        return;
    }

    try {
        const res = await fetch('../api/admin_toggle_role.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, nuevoRol })
        });

        const data = await res.json();

        if (data.success) {
            alert("Rol actualizado correctamente.");
            loadClients();
        } else {
            alert("Error: " + (data.message || "No se pudo actualizar el rol."));
        }

    } catch (err) {
        console.error(err);
        alert("Error al conectar con el servidor.");
    }
}

/* ============================
   EDITAR CLIENTE
   ============================ */
function editClient(cli) {
    document.getElementById('clientId').value = cli.ID;
    document.getElementById('clientName').value = cli.Nombre;
    document.getElementById('clientLastName').value = cli.Apellido;
    document.getElementById('clientDNI').value = cli.DNI;
    document.getElementById('clientMail').value = cli.Mail;
    document.getElementById('clientPhone').value = cli.Telefono;
    document.getElementById('clientBirth').value = cli.Nacimiento;
    document.getElementById('clientLicense').value = cli.Licencia;
    document.getElementById('clientAddress').value = cli.Direccion;

    openModal(true);
}

/* ============================
   GUARDAR CLIENTE (UPDATE)
   ============================ */
document.getElementById('clientForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('id', document.getElementById('clientId').value);
    formData.append('nombre', document.getElementById('clientName').value);
    formData.append('apellido', document.getElementById('clientLastName').value);
    formData.append('dni', document.getElementById('clientDNI').value);
    formData.append('mail', document.getElementById('clientMail').value);
    formData.append('telefono', document.getElementById('clientPhone').value);
    formData.append('nacimiento', document.getElementById('clientBirth').value);
    formData.append('licencia', document.getElementById('clientLicense').value);
    formData.append('direccion', document.getElementById('clientAddress').value);

    try {
        const res = await fetch('../api/admin_update_client.php', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            closeModal();
            loadClients();
        } else {
            alert("Error: " + (data.message || "No se pudo guardar"));
        }

    } catch (err) {
        console.error(err);
        alert("Error de conexión.");
    }
});

/* ============================
   ELIMINAR CLIENTE
   ============================ */
async function deleteClient(id) {
    if (!confirm("¿Eliminar este cliente?")) return;

    try {
        await fetch('../api/admin_delete_client.php', {
            method: 'POST',
            body: JSON.stringify({ id })
        });

        loadClients();
    } catch (err) {
        console.error(err);
        alert("Error al eliminar.");
    }
}
