// public/reservation_gestion.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Sesión primero
    try {
        const sessionRes = await fetch('../api/session.php', { credentials: 'include' });
        const sessionData = await sessionRes.json();
        if (!sessionData.logged) {
            window.location.href = 'login.html'; // Si no está logueado, fuera
            return;
        }
    } catch (e) {
        console.error("Error verificando sesión");
        return;
    }

    // 2. Cargar Reservas
    loadReservations();
});

async function loadReservations() {
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('empty-state');
    const grid = document.getElementById('reservations-grid');

    try {
        const res = await fetch('../api/get_my_reservations.php', { credentials: 'include' });
        const reservas = await res.json();

        loader.classList.add('hidden');

        if (!Array.isArray(reservas) || reservas.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        grid.classList.remove('hidden');
        renderReservations(reservas, grid);

    } catch (err) {
        console.error("Error cargando reservas:", err);
        loader.innerHTML = '<p class="text-red-500">Error al cargar tus reservas.</p>';
    }
}

function renderReservations(reservas, container) {
    container.innerHTML = '';

    reservas.forEach(reserva => {
        // Resolvemos ruta imagen
        let foto = reserva.Foto;
        if (foto && !foto.startsWith('http') && !foto.startsWith('../')) {
            foto = `../img/${foto}`;
        }
        
        // Estilos según estado
        // 1=Pendiente, 2=Confirmada, 3=En Curso, 4=Finalizada, 5=Cancelada
        let statusColor = "bg-gray-100 text-gray-800";
        let canCancel = false;

        switch(parseInt(reserva.ID_Estado)) {
            case 1: // Pendiente
                statusColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
                canCancel = true;
                break;
            case 2: // Confirmada
                statusColor = "bg-green-100 text-green-800 border-green-200";
                canCancel = true; // Depende de tu política, por ahora permitimos
                break;
            case 3: // En Curso
                statusColor = "bg-blue-100 text-blue-800 border-blue-200";
                break;
            case 5: // Cancelada
                statusColor = "bg-red-100 text-red-800 border-red-200";
                break;
        }

        // Formatear fechas (DD/MM/YYYY)
        const fechaInicio = formatDate(reserva.Fecha_Inicio);
        const fechaFin = formatDate(reserva.Fecha_Fin);

        const card = document.createElement('div');
        card.className = "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col";
        
        card.innerHTML = `
            <div class="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span class="text-xs font-mono text-gray-500">#${reserva.CodigoReserva}</span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}">
                    ${reserva.EstadoNombre}
                </span>
            </div>

            <div class="p-5 flex-1">
                <div class="flex gap-4 items-start mb-4">
                    <img src="${foto}" class="w-20 h-20 object-cover rounded-lg bg-gray-100" alt="Auto">
                    <div>
                        <h3 class="font-bold text-gray-900">${reserva.Marca} ${reserva.Modelo}</h3>
                        <p class="text-sm text-gray-500">Total: <span class="font-semibold text-gray-900">$${reserva.Precio_Total}</span></p>
                    </div>
                </div>

                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-500">Retiro:</span>
                        <span class="text-gray-900 font-medium">${fechaInicio}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500">Devolución:</span>
                        <span class="text-gray-900 font-medium">${fechaFin}</span>
                    </div>
                </div>
            </div>

            ${canCancel ? `
            <div class="px-5 py-4 bg-gray-50 border-t border-gray-100">
                <button onclick="cancelReservation(${reserva.ReservaID})" 
                        class="w-full py-2 px-4 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                    Cancelar Reserva
                </button>
            </div>
            ` : ''}
        `;
        container.appendChild(card);
    });
}

// Función para cancelar
async function cancelReservation(id) {
    if(!confirm("¿Estás seguro de que quieres cancelar esta reserva? Esta acción no se puede deshacer.")) {
        return;
    }

    try {
        const res = await fetch('../api/cancel_reservation.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_reserva: id })
        });
        
        const data = await res.json();

        if(data.success) {
            alert("Reserva cancelada correctamente.");
            loadReservations(); // Recargar la lista
        } else {
            alert("Error: " + data.message);
        }
    } catch(e) {
        alert("Error de conexión al cancelar.");
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    // dateString viene como YYYY-MM-DD
    const parts = dateString.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}