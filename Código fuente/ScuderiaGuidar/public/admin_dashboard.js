// public/admin_dashboard.js
// Carga estadísticas del servidor y renderiza las 4 tarjetas + 4 gráficos Chart.js

document.addEventListener('DOMContentLoaded', async () => {

    // ── Verificar sesión y rol administrador antes de mostrar datos ──────────
    try {
        const sessionRes = await fetch('../api/session.php', { credentials: 'include' });
        const sessionData = await sessionRes.json();

        if (!sessionData.logged || parseInt(sessionData.user.rol) !== 1) {
            window.location.href = 'login.html';
            return;
        }
    } catch {
        window.location.href = 'login.html';
        return;
    }

    // ── Cargar estadísticas ──────────────────────────────────────────────────
    let stats;
    try {
        const res = await fetch('../api/admin_stats.php', { credentials: 'include' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        stats = await res.json();
        if (stats.error) throw new Error(stats.error);
    } catch (err) {
        document.getElementById('loader').classList.add('hidden');
        const errorEl = document.getElementById('error-state');
        errorEl.classList.remove('hidden');
        document.getElementById('error-msg').textContent =
            'No se pudieron cargar las estadísticas: ' + err.message;
        return;
    }

    // ── Ocultar loader y mostrar contenido ──────────────────────────────────
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('dashboard-content').classList.remove('hidden');

    // ── Poblar tarjetas ──────────────────────────────────────────────────────
    document.getElementById('card-reservas').textContent =
        stats.total_reservas.toLocaleString('es-AR');

    document.getElementById('card-ingresos').textContent =
        '$ ' + stats.total_ingresos.toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

    document.getElementById('card-clientes').textContent =
        stats.total_clientes.toLocaleString('es-AR');

    document.getElementById('card-auto-cantidad').textContent =
        stats.auto_mas_reservado.cantidad.toLocaleString('es-AR');
    document.getElementById('card-auto-nombre').textContent =
        stats.auto_mas_reservado.nombre + ' · ' + stats.auto_mas_reservado.cantidad + ' reserva(s)';

    // ── Paleta de colores consistente ────────────────────────────────────────
    const PALETTE = [
        '#F7C52D', '#1A1A1A', '#10B981', '#3B82F6',
        '#8B5CF6', '#EF4444', '#F59E0B', '#14B8A6'
    ];

    const chartDefaults = {
        font: { family: 'Inter, sans-serif', size: 12 },
        color: '#6B7280'
    };
    Chart.defaults.font.family = chartDefaults.font.family;
    Chart.defaults.font.size   = chartDefaults.font.size;
    Chart.defaults.color       = chartDefaults.color;

    // ── Gráfico 1: Reservas por estado (barras verticales) ───────────────────
    const estadosLabels   = stats.reservas_por_estado.map(d => d.estado);
    const estadosCantidad = stats.reservas_por_estado.map(d => d.cantidad);

    new Chart(document.getElementById('chartEstados'), {
        type: 'bar',
        data: {
            labels: estadosLabels,
            datasets: [{
                label: 'Reservas',
                data: estadosCantidad,
                backgroundColor: PALETTE.slice(0, estadosLabels.length),
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => ' ' + ctx.parsed.y + ' reserva(s)'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                    grid: { color: '#F3F4F6' }
                },
                x: { grid: { display: false } }
            }
        }
    });

    // ── Gráfico 2: Distribución de flota por tipo (torta/doughnut) ───────────
    const tiposLabels   = stats.autos_por_tipo.map(d => d.tipo);
    const tiposCantidad = stats.autos_por_tipo.map(d => d.cantidad);

    new Chart(document.getElementById('chartTipos'), {
        type: 'doughnut',
        data: {
            labels: tiposLabels,
            datasets: [{
                data: tiposCantidad,
                backgroundColor: PALETTE.slice(0, tiposLabels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { boxWidth: 14, padding: 16 }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => ' ' + ctx.label + ': ' + ctx.parsed + ' auto(s)'
                    }
                }
            }
        }
    });

    // ── Gráfico 3: Ingresos por fecha (líneas) ───────────────────────────────
    const fechasLabels = stats.ingresos_por_fecha.map(d => d.fecha);
    const fechasTotals = stats.ingresos_por_fecha.map(d => d.total);

    if (fechasLabels.length === 0) {
        const canvas = document.getElementById('chartIngresos');
        const ctx = canvas.getContext('2d');
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#9CA3AF';
        ctx.textAlign = 'center';
        ctx.fillText('Sin datos de ingresos disponibles', canvas.width / 2, canvas.height / 2);
    } else {
        new Chart(document.getElementById('chartIngresos'), {
            type: 'line',
            data: {
                labels: fechasLabels,
                datasets: [{
                    label: 'Ingresos ($)',
                    data: fechasTotals,
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#10B981',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ' $' + ctx.parsed.y.toLocaleString('es-AR', {
                                minimumFractionDigits: 2
                            })
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#F3F4F6' },
                        ticks: {
                            callback: val => '$' + val.toLocaleString('es-AR')
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { maxRotation: 45, minRotation: 30 }
                    }
                }
            }
        });
    }

    // ── Gráfico 4: Top 5 autos más reservados (barras horizontales) ──────────
    const topLabels   = stats.top_autos.map(d => d.auto);
    const topCantidad = stats.top_autos.map(d => d.cantidad);

    if (topLabels.length === 0) {
        const canvas = document.getElementById('chartTopAutos');
        const ctx = canvas.getContext('2d');
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#9CA3AF';
        ctx.textAlign = 'center';
        ctx.fillText('Sin datos de reservas disponibles', canvas.width / 2, canvas.height / 2);
    } else {
        new Chart(document.getElementById('chartTopAutos'), {
            type: 'bar',
            data: {
                labels: topLabels,
                datasets: [{
                    label: 'Reservas',
                    data: topCantidad,
                    backgroundColor: '#3B82F6',
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ' ' + ctx.parsed.x + ' reserva(s)'
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        grid: { color: '#F3F4F6' }
                    },
                    y: { grid: { display: false } }
                }
            }
        });
    }
});
