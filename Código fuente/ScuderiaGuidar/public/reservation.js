document.addEventListener('DOMContentLoaded', async () => {

    // ---  REFERENCIAS A ELEMENTOS HTML ---
    // Columna Derecha (Selector y Tarjeta)
    const selectVehiculo = document.getElementById('vehicle-select');
    const selectSucursalRetiro = document.getElementById('pickup-branch');
    const selectSucursalDevolucion = document.getElementById('return-branch');
    const branchVehicleMessage = document.getElementById('branch-vehicle-message');
    const reservationMapContainer = document.getElementById('reservation-branches-map');
    const reservationMapError = document.getElementById('reservation-map-error');
    const cardVehiculo = document.getElementById('vehicle-card');
    const imgVehiculo = document.getElementById('vehicle-img');
    const nameVehiculo = document.getElementById('vehicle-name');
    const infoVehiculo = document.getElementById('vehicle-info');
    const patentVehiculo = document.getElementById('vehicle-patent');
    
    // Columna Izquierda (Formulario y Precios)
    const form = document.getElementById('reservation-form');
    const dateInicio = document.getElementById('pickup-date');
    const dateFin = document.getElementById('return-date');
    const summaryPrecioDia = document.getElementById('summary-price-day');
    const summaryDias = document.getElementById('summary-days');
    const summaryTotal = document.getElementById('summary-total');
    const recommendDaysInput = document.getElementById('recommend-days');
    const recommendPassengersInput = document.getElementById('recommend-passengers');
    const recommendLuggageQtyInput = document.getElementById('recommend-luggage-qty');
    const recommendLuggageSizeInput = document.getElementById('recommend-luggage-size');
    const recommendTripStyleInput = document.getElementById('recommend-trip-style');
    const recommendKmInput = document.getElementById('recommend-km');
    const recommendBudgetModeInput = document.getElementById('recommend-budget-mode');
    const recommendBudgetValueInput = document.getElementById('recommend-budget-value');
    const extraAutomaticInput = document.getElementById('extra-automatic');
    const extraAcInput = document.getElementById('extra-ac');
    const recommendButton = document.getElementById('recommend-vehicle-btn');
    const recommendationFeedback = document.getElementById('recommendation-feedback');
    const recommendationResults = document.getElementById('recommendation-results');

    // Estado local
    let allVehicles = [];
    let pendingVehicleId = null;
    let selectedVehiclePrice = 0;
    let allBranches = [];
    let reservationMap = null;
    let mapConfig = null;
    let mapProvider = 'google';
    const branchMarkers = new Map();
    const leafletMarkerIcons = {};
    let sharedMapInfoWindow = null;
    let recommendationRequestInFlight = false;
    const recommendationVehicleCache = new Map();

    // ---  VERIFICAR SESIÓN ---
    try {
        const res = await fetch('../api/session.php', { credentials: 'include' });
        const data = await res.json();
        if (!data.logged) {
            alert("Debes iniciar sesión para poder reservar.");
            window.location.href = 'login.html'; // Redirigir al login
            return;
        }
        console.log("Sesión iniciada como:", data.user.nombre);
    } catch (e) {
        alert("Error de conexión. No se pudo verificar la sesión.");
        return;
    }

    // Si llegamos desde catalogo con ?id=...
    const urlParams = new URLSearchParams(window.location.search);
    pendingVehicleId = urlParams.get('id');

    // --- CARGAR SUCURSALES ---
    async function loadBranches() {
        try {
            const res = await fetch('../api/get_sucursales.php');
            const branches = await res.json();

            const branchList = Array.isArray(branches) ? branches : [];
            allBranches = branchList;
            const defaultOption = '<option value="">-- Elige una sucursal --</option>';

            if (branchList.length === 0) {
                const emptyOption = '<option value="" disabled>No hay sucursales disponibles</option>';
                selectSucursalRetiro.innerHTML = emptyOption;
                selectSucursalDevolucion.innerHTML = emptyOption;
                return;
            }

            selectSucursalRetiro.innerHTML = defaultOption;
            selectSucursalDevolucion.innerHTML = defaultOption;

            branchList.forEach(branch => {
                const label = `${branch.Nombre} - ${branch.Direccion}`;

                const pickupOpt = document.createElement('option');
                pickupOpt.value = String(branch.ID);
                pickupOpt.textContent = label;
                selectSucursalRetiro.appendChild(pickupOpt);

                const returnOpt = document.createElement('option');
                returnOpt.value = String(branch.ID);
                returnOpt.textContent = label;
                selectSucursalDevolucion.appendChild(returnOpt);
            });

            updateReservationMapMarkerColors();
        } catch (e) {
            console.error('Error al cargar sucursales', e);
            selectSucursalRetiro.innerHTML = '<option value="" disabled>Error al cargar sucursales</option>';
            selectSucursalDevolucion.innerHTML = '<option value="" disabled>Error al cargar sucursales</option>';
        }
    }

    // ---  CARGAR VEHÍCULOS EN EL SELECT ---
    async function loadVehicles() {
        try {
            const params = new URLSearchParams();
            params.append('available', '1');

            const pickupBranchId = parseInt(selectSucursalRetiro.value, 10);
            if (Number.isInteger(pickupBranchId) && pickupBranchId > 0) {
                params.append('sucursal', String(pickupBranchId));
            }

            const res = await fetch(`../api/get_vehicles.php?${params.toString()}`);
            const vehicles = await res.json();

            allVehicles = Array.isArray(vehicles)
                ? vehicles.filter(auto => parseInt(auto.Disponibilidad, 10) === 1)
                : [];

            const currentSelection = selectVehiculo.value;
            selectVehiculo.innerHTML = '<option value="">-- Elige tu vehículo --</option>';

            allVehicles.forEach(auto => {
                const option = document.createElement('option');
                option.value = String(auto.ID);
                option.textContent = `${auto.Marca} ${auto.Modelo} ($${auto.Precio}/día)`;
                selectVehiculo.appendChild(option);
            });

            if (currentSelection && allVehicles.some(auto => String(auto.ID) === String(currentSelection))) {
                selectVehiculo.value = currentSelection;
                updateVehicleInfo(currentSelection);
            } else if (pendingVehicleId && allVehicles.some(auto => String(auto.ID) === String(pendingVehicleId))) {
                selectVehiculo.value = pendingVehicleId;
                updateVehicleInfo(pendingVehicleId);
                pendingVehicleId = null;
                clearBranchVehicleMessage();
            } else {
                if (currentSelection || pendingVehicleId) {
                    updateVehicleInfo('');
                }

                if ((currentSelection || pendingVehicleId) && pickupBranchId > 0) {
                    showBranchVehicleMessage('El auto seleccionado no se encuentra disponible en la sucursal de retiro elegida.');
                    pendingVehicleId = null;
                } else {
                    clearBranchVehicleMessage();
                }
            }

        } catch (e) {
            console.error("Error al cargar vehículos", e);
            selectVehiculo.innerHTML = '<option value="">Error al cargar flota</option>';
        }
    }

    // ---  ACTUALIZAR INFO CUANDO SE ELIGE UN AUTO ---
    function updateVehicleInfo(id) {
        const auto = allVehicles.find(v => String(v.ID) === String(id));

        if (auto) {
            // Mostrar la tarjeta
            cardVehiculo.classList.remove('hidden');
            
            // Llenar tarjeta
            imgVehiculo.src = resolveImagePath(auto.Foto);
            imgVehiculo.alt = `${auto.Marca} ${auto.Modelo}`;
            nameVehiculo.textContent = `${auto.Marca} ${auto.Modelo}`;
            infoVehiculo.textContent = `${auto.TipoNombre} • $${auto.Precio}/día`;
            patentVehiculo.textContent = `Patente: ${auto.Patente}`;

            // Actualizar resumen en la izquierda
            selectedVehiclePrice = parseFloat(auto.Precio);
            summaryPrecioDia.textContent = `$${auto.Precio}`;
            calculateTotal(); // Recalcular por si ya había fechas
            clearBranchVehicleMessage();
        } else {
            // Ocultar tarjeta y resetear precios si se elige "Elige..."
            cardVehiculo.classList.add('hidden');
            selectedVehiclePrice = 0;
            summaryPrecioDia.textContent = "-";
            calculateTotal();
        }
    }

    // ---  Calcular total ---
    function calculateTotal() {
        const diffDays = calculateRentalDays();

        if (diffDays !== null && diffDays <= 0) {
            summaryDias.textContent = "Error";
            summaryTotal.textContent = "Error";
            return;
        }

        if (diffDays !== null && selectedVehiclePrice > 0) {
            if (diffDays <= 0) {
                summaryDias.textContent = "Error";
                summaryTotal.textContent = "Error";
                return;
            }

            const total = diffDays * selectedVehiclePrice;

            summaryDias.textContent = `${diffDays} días`;
            summaryTotal.textContent = `$${total.toLocaleString('es-AR')}`; // Formato de moneda
        } else {
            summaryDias.textContent = "-";
            summaryTotal.textContent = "-";
        }
    }

    function calculateRentalDays() {
        const inicio = dateInicio.value;
        const fin = dateFin.value;

        if (!inicio || !fin) return null;

        const d1 = new Date(inicio);
        const d2 = new Date(fin);

        if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) {
            return null;
        }

        if (d2 < d1) {
            return -1;
        }

        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    function syncRecommendationDays() {
        if (!recommendDaysInput) return;

        const calculatedDays = calculateRentalDays();
        if (calculatedDays !== null && calculatedDays > 0) {
            recommendDaysInput.value = String(calculatedDays);
        }
    }

    // ---  ENVIAR RESERVA (FORM SUBMIT) ---
    async function submitReservation(e) {
        e.preventDefault(); // Evitar envío normal

        // Validaciones
        if (!selectVehiculo.value) {
            alert("Por favor, selecciona un vehículo.");
            return;
        }
        if (!dateInicio.value || !dateFin.value) {
            alert("Por favor, selecciona las fechas.");
            return;
        }

        if (!selectSucursalRetiro.value || !selectSucursalDevolucion.value) {
            alert('Por favor, elige la sucursal de retiro y de devolución.');
            return;
        }

        const selectedVehicleId = String(selectVehiculo.value);
        const availableInPickup = allVehicles.some(v => String(v.ID) === selectedVehicleId);
        if (!availableInPickup) {
            showBranchVehicleMessage('El auto no esta disponible en la sucursal de retiro seleccionada.');
            alert('El auto no esta disponible en la sucursal de retiro seleccionada.');
            return;
        }

        const payload = {
            id_auto: selectVehiculo.value,
            fecha_inicio: dateInicio.value,
            fecha_fin: dateFin.value,
            id_sucursal_retiro: selectSucursalRetiro.value,
            id_sucursal_devolucion: selectSucursalDevolucion.value
        };

        try {
            document.getElementById('submit-reservation').disabled = true;
            document.getElementById('submit-reservation').textContent = "Procesando...";

            const res = await fetch('../api/create_reservation.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Importante para enviar la cookie de sesión
                body: JSON.stringify(payload)
            });

            const result = await res.json();

            if (result.success) {
                alert("¡Reserva confirmada con éxito!");
                window.location.href = 'homepage.html'; // O a una página de "Mis Reservas"
            } else {
                // Mostrar error del servidor (ej: "Fechas no disponibles")
                alert("Error: " + result.message);
                document.getElementById('submit-reservation').disabled = false;
                document.getElementById('submit-reservation').textContent = "Confirmar y Reservar";
            }
        } catch (err) {
            alert("Error de conexión al guardar la reserva.");
            document.getElementById('submit-reservation').disabled = false;
            document.getElementById('submit-reservation').textContent = "Confirmar y Reservar";
        }
    }

    function showBranchVehicleMessage(message) {
        branchVehicleMessage.textContent = message;
        branchVehicleMessage.classList.remove('hidden');
    }

    function clearBranchVehicleMessage() {
        branchVehicleMessage.textContent = '';
        branchVehicleMessage.classList.add('hidden');
    }

    function showRecommendationFeedback(message, level = 'info') {
        if (!recommendationFeedback) return;

        recommendationFeedback.textContent = message;
        recommendationFeedback.classList.remove('hidden', 'text-red-600', 'text-green-700', 'text-text-secondary');

        if (level === 'error') {
            recommendationFeedback.classList.add('text-red-600');
        } else if (level === 'success') {
            recommendationFeedback.classList.add('text-green-700');
        } else {
            recommendationFeedback.classList.add('text-text-secondary');
        }
    }

    function clearRecommendationFeedback() {
        if (!recommendationFeedback) return;
        recommendationFeedback.textContent = '';
        recommendationFeedback.classList.add('hidden');
    }

    function clearRecommendationCards() {
        if (!recommendationResults) return;
        recommendationVehicleCache.clear();
        recommendationResults.innerHTML = '';
    }

    function collectRecommendationPayload() {
        const extras = [];
        if (extraAutomaticInput && extraAutomaticInput.checked) {
            extras.push('transmision_automatica');
        }
        if (extraAcInput && extraAcInput.checked) {
            extras.push('aire_acondicionado');
        }

        return {
            dias_alquiler: parseInt(recommendDaysInput?.value ?? '', 10),
            pasajeros: parseInt(recommendPassengersInput?.value ?? '', 10),
            equipaje_cantidad: parseInt(recommendLuggageQtyInput?.value ?? '', 10),
            equipaje_tamano: String(recommendLuggageSizeInput?.value ?? ''),
            estilo_viaje: String(recommendTripStyleInput?.value ?? ''),
            kilometros_aprox: parseInt(recommendKmInput?.value ?? '', 10),
            presupuesto_modo: String(recommendBudgetModeInput?.value ?? ''),
            presupuesto_valor: parseFloat(recommendBudgetValueInput?.value ?? ''),
            extras,
            id_sucursal_retiro: parseInt(selectSucursalRetiro?.value ?? '0', 10) || 0,
        };
    }

    function validateRecommendationPayload(payload) {
        if (!Number.isInteger(payload.dias_alquiler) || payload.dias_alquiler < 1) {
            return 'Indica una cantidad de dias valida.';
        }
        if (!Number.isInteger(payload.pasajeros) || payload.pasajeros < 1) {
            return 'Indica una cantidad de pasajeros valida.';
        }
        if (!Number.isInteger(payload.equipaje_cantidad) || payload.equipaje_cantidad < 0) {
            return 'Indica una cantidad de equipaje valida.';
        }
        if (!payload.equipaje_tamano) {
            return 'Selecciona el tamano de equipaje.';
        }
        if (!payload.estilo_viaje) {
            return 'Selecciona un estilo de viaje.';
        }
        if (!Number.isInteger(payload.kilometros_aprox) || payload.kilometros_aprox < 0) {
            return 'Indica kilometros aproximados validos.';
        }
        if (!payload.presupuesto_modo) {
            return 'Selecciona el tipo de presupuesto.';
        }
        if (!Number.isFinite(payload.presupuesto_valor) || payload.presupuesto_valor <= 0) {
            return 'Indica un presupuesto mayor a cero.';
        }

        return '';
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/"/g, '&quot;');
    }

    function formatDailyPrice(value) {
        const numberValue = Number(value);
        if (!Number.isFinite(numberValue)) return '-';
        return numberValue.toLocaleString('es-AR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    }

    function ensureVehicleOption(vehicle) {
        const vehicleId = String(vehicle.id);
        const alreadyInList = allVehicles.some(item => String(item.ID) === vehicleId);

        if (!alreadyInList) {
            allVehicles.push({
                ID: vehicle.id,
                Marca: vehicle.marca,
                Modelo: vehicle.modelo,
                Patente: vehicle.patente,
                Foto: vehicle.foto,
                TipoNombre: vehicle.tipo,
                Precio: vehicle.precio_diario,
                Disponibilidad: 1,
            });

            const option = document.createElement('option');
            option.value = vehicleId;
            option.textContent = `${vehicle.marca} ${vehicle.modelo} ($${formatDailyPrice(vehicle.precio_diario)}/día)`;
            selectVehiculo.appendChild(option);
        }
    }

    function selectRecommendedVehicle(vehicle) {
        ensureVehicleOption(vehicle);
        selectVehiculo.value = String(vehicle.id);
        updateVehicleInfo(String(vehicle.id));
        clearBranchVehicleMessage();
    }

    function renderRecommendationCards(recommendations) {
        if (!recommendationResults) return;

        recommendationVehicleCache.clear();

        recommendationResults.innerHTML = recommendations.map((rec) => {
            const vehicle = rec.vehicle || {};
            const imagePath = resolveImagePath(vehicle.foto || '');
            const vehicleId = Number(vehicle.id || rec.id || 0);
            const badgeAuto = vehicle.extras?.transmision_automatica ? 'Automatica' : 'Manual';
            const badgeAc = vehicle.extras?.aire_acondicionado ? 'A/C' : 'Sin A/C';

            if (vehicleId > 0) {
                recommendationVehicleCache.set(vehicleId, {
                    id: vehicleId,
                    marca: vehicle.marca,
                    modelo: vehicle.modelo,
                    patente: vehicle.patente,
                    foto: vehicle.foto,
                    tipo: vehicle.tipo,
                    precio_diario: vehicle.precio_diario,
                    extras: vehicle.extras || {},
                });
            }

            return `
                <article class="card-elevated overflow-hidden border border-gray-100">
                    <div class="relative h-36 w-full overflow-hidden">
                        <img src="${escapeAttr(imagePath)}" alt="${escapeAttr(`${vehicle.marca || ''} ${vehicle.modelo || ''}`)}" class="w-full h-full object-cover">
                    </div>
                    <div class="p-4 space-y-2">
                        <h4 class="text-base font-semibold text-primary">${escapeHtml(`${vehicle.marca || ''} ${vehicle.modelo || ''}`.trim())}</h4>
                        <p class="text-sm text-text-secondary">${escapeHtml(vehicle.tipo || '')} • $${formatDailyPrice(vehicle.precio_diario)}/día</p>
                        <p class="text-xs text-text-secondary">Capacidad: ${escapeHtml(String(vehicle.capacidad_pasajeros ?? '-'))} pasajeros • Equipaje ${escapeHtml(String(vehicle.capacidad_equipaje ?? '-'))}</p>
                        <p class="text-xs text-text-secondary">Extras: ${escapeHtml(badgeAuto)} • ${escapeHtml(badgeAc)}</p>
                        <p class="text-sm text-primary"><strong>Motivo IA:</strong> ${escapeHtml(rec.reason || '')}</p>
                        <button type="button" class="btn-primary w-full text-sm py-2" data-recommend-id="${vehicleId}">Elegir este vehiculo</button>
                    </div>
                </article>
            `;
        }).join('');
    }

    async function requestRecommendations() {
        if (recommendationRequestInFlight || !recommendButton) return;

        const payload = collectRecommendationPayload();
        const validationError = validateRecommendationPayload(payload);
        if (validationError) {
            clearRecommendationCards();
            showRecommendationFeedback(validationError, 'error');
            return;
        }

        recommendationRequestInFlight = true;
        recommendButton.disabled = true;
        recommendButton.textContent = 'Consultando IA...';
        clearRecommendationCards();
        showRecommendationFeedback('Buscando recomendaciones personalizadas...', 'info');

        try {
            const res = await fetch('../api/recomendar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!result.success) {
                showRecommendationFeedback(result.message || 'No fue posible generar recomendaciones.', 'error');
                return;
            }

            if (!Array.isArray(result.recommendations) || result.recommendations.length === 0) {
                showRecommendationFeedback('No se encontraron recomendaciones para tu perfil.', 'error');
                return;
            }

            renderRecommendationCards(result.recommendations);
            showRecommendationFeedback('Estas son las mejores opciones para tu perfil de viaje.', 'success');
        } catch (error) {
            console.error('Error solicitando recomendaciones:', error);
            showRecommendationFeedback('No se pudo consultar el recomendador en este momento.', 'error');
        } finally {
            recommendationRequestInFlight = false;
            recommendButton.disabled = false;
            recommendButton.textContent = 'Buscar recomendaciones IA';
        }
    }

    function resolveImagePath(path) {
        if (!path) return '';
        if (path.startsWith('http') || path.startsWith('../')) {
            return path;
        }
        return `../img/${path}`;
    }

    async function initReservationMap() {
        if (!reservationMapContainer) return;

        try {
            mapConfig = await window.MapsLoader.loadGoogleMaps();

            if (mapConfig.provider === 'leaflet' && window.L && typeof window.L.map === 'function') {
                mapProvider = 'leaflet';

                reservationMap = L.map(reservationMapContainer, {
                    center: [Number(mapConfig.cityCenter.lat), Number(mapConfig.cityCenter.lng)],
                    zoom: 12,
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                    maxZoom: 19,
                }).addTo(reservationMap);

                renderBranchMarkers();
                return;
            }

            mapProvider = 'google';

            reservationMap = new google.maps.Map(reservationMapContainer, {
                center: mapConfig.cityCenter,
                zoom: 12,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
            });

            sharedMapInfoWindow = new google.maps.InfoWindow();
            renderBranchMarkers();
        } catch (error) {
            console.error('Error inicializando mapa de reservas:', error);
            if (reservationMapError) {
                reservationMapError.textContent = 'No se pudo cargar el mapa de sucursales.';
                reservationMapError.classList.remove('hidden');
            }
        }
    }

    function renderBranchMarkers() {
        if (!reservationMap) return;

        branchMarkers.forEach(marker => {
            if (mapProvider === 'google' && typeof marker.setMap === 'function') {
                marker.setMap(null);
                return;
            }

            if (typeof marker.remove === 'function') {
                marker.remove();
            }
        });
        branchMarkers.clear();

        const bounds = mapProvider === 'google' ? new google.maps.LatLngBounds() : [];

        allBranches.forEach(branch => {
            if (!isFiniteCoordinate(branch.Latitud) || !isFiniteCoordinate(branch.Longitud)) return;

            const position = {
                lat: Number(branch.Latitud),
                lng: Number(branch.Longitud),
            };

            if (mapProvider === 'google') {
                const marker = new google.maps.Marker({
                    position,
                    map: reservationMap,
                    title: branch.Nombre,
                    icon: markerIconByColor('red'),
                });

                marker.addListener('click', () => {
                    if (!sharedMapInfoWindow) return;

                    sharedMapInfoWindow.setContent(`
                        <div style="max-width: 240px; font-family: Arial, sans-serif;">
                            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">${escapeHtml(branch.Nombre)}</h4>
                            <p style="margin: 0; font-size: 12px; color: #4b5563;">${escapeHtml(branch.Direccion || '-')}</p>
                        </div>
                    `);
                    sharedMapInfoWindow.open({ map: reservationMap, anchor: marker });
                });

                branchMarkers.set(String(branch.ID), marker);
                bounds.extend(position);
            } else {
                const marker = L.marker([position.lat, position.lng], {
                    icon: markerIconByColor('red'),
                    title: branch.Nombre,
                }).addTo(reservationMap);

                marker.bindPopup(`
                    <div style="max-width: 240px; font-family: Arial, sans-serif;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">${escapeHtml(branch.Nombre)}</h4>
                        <p style="margin: 0; font-size: 12px; color: #4b5563;">${escapeHtml(branch.Direccion || '-')}</p>
                    </div>
                `);

                branchMarkers.set(String(branch.ID), marker);
                bounds.push([position.lat, position.lng]);
            }
        });

        if (mapConfig && mapConfig.airport && isFiniteCoordinate(mapConfig.airport.lat) && isFiniteCoordinate(mapConfig.airport.lng)) {
            const airportPosition = {
                lat: Number(mapConfig.airport.lat),
                lng: Number(mapConfig.airport.lng),
            };

            if (mapProvider === 'google') {
                const airportMarker = new google.maps.Marker({
                    position: airportPosition,
                    map: reservationMap,
                    title: mapConfig.airport.name || 'Aeropuerto de Cordoba',
                    icon: markerIconByColor('yellow'),
                });

                airportMarker.addListener('click', () => {
                    if (!sharedMapInfoWindow) return;

                    sharedMapInfoWindow.setContent(`
                        <div style="max-width: 240px; font-family: Arial, sans-serif;">
                            <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">${escapeHtml(mapConfig.airport.name || 'Aeropuerto de Cordoba')}</h4>
                            <p style="margin: 0; font-size: 12px; color: #4b5563;">${escapeHtml(mapConfig.airport.address || '')}</p>
                        </div>
                    `);
                    sharedMapInfoWindow.open({ map: reservationMap, anchor: airportMarker });
                });

                bounds.extend(airportPosition);
            } else {
                const airportMarker = L.marker([airportPosition.lat, airportPosition.lng], {
                    icon: markerIconByColor('yellow'),
                    title: mapConfig.airport.name || 'Aeropuerto de Cordoba',
                }).addTo(reservationMap);

                airportMarker.bindPopup(`
                    <div style="max-width: 240px; font-family: Arial, sans-serif;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">${escapeHtml(mapConfig.airport.name || 'Aeropuerto de Cordoba')}</h4>
                        <p style="margin: 0; font-size: 12px; color: #4b5563;">${escapeHtml(mapConfig.airport.address || '')}</p>
                    </div>
                `);

                bounds.push([airportPosition.lat, airportPosition.lng]);
            }
        }

        if (mapProvider === 'google' && !bounds.isEmpty()) {
            reservationMap.fitBounds(bounds, 60);
        }

        if (mapProvider === 'leaflet' && bounds.length > 0) {
            reservationMap.fitBounds(bounds, { padding: [40, 40] });
        }

        updateReservationMapMarkerColors();
    }

    function markerIconByColor(colorName) {
        if (mapProvider === 'leaflet') {
            return getLeafletMarkerIcon(colorName);
        }

        return `https://maps.google.com/mapfiles/ms/icons/${colorName}-dot.png`;
    }

    function getLeafletMarkerIcon(colorName) {
        if (!(window.L && typeof window.L.icon === 'function')) {
            return null;
        }

        const color = ['red', 'blue', 'green', 'yellow'].includes(colorName) ? colorName : 'red';

        if (!leafletMarkerIcons[color]) {
            leafletMarkerIcons[color] = L.icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
                iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            });
        }

        return leafletMarkerIcons[color];
    }

    function updateReservationMapMarkerColors() {
        if (!branchMarkers.size) return;

        const pickupId = String(selectSucursalRetiro.value || '');
        const returnId = String(selectSucursalDevolucion.value || '');

        branchMarkers.forEach((marker, branchId) => {
            let markerColor = 'red';

            if (pickupId && branchId === pickupId) {
                markerColor = 'blue';
            }

            if (returnId && branchId === returnId) {
                markerColor = 'green';
            }

            if (pickupId && returnId && pickupId === returnId && branchId === pickupId) {
                markerColor = 'blue';
            }

            marker.setIcon(markerIconByColor(markerColor));
        });
    }

    function isFiniteCoordinate(value) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue);
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

    // ---  ASIGNAR EVENTOS ---
    recommendationResults?.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const button = target.closest('[data-recommend-id]');
        if (!button) return;

        const vehicleId = Number(button.getAttribute('data-recommend-id'));
        if (!Number.isInteger(vehicleId) || vehicleId <= 0) return;

        const vehicleFromRecommendation = recommendationVehicleCache.get(vehicleId);
        if (vehicleFromRecommendation) {
            selectRecommendedVehicle(vehicleFromRecommendation);
            return;
        }

        const selectedRecommendation = allVehicles.find(item => Number(item.ID) === vehicleId);
        if (selectedRecommendation) {
            selectRecommendedVehicle({
                id: selectedRecommendation.ID,
                marca: selectedRecommendation.Marca,
                modelo: selectedRecommendation.Modelo,
                patente: selectedRecommendation.Patente,
                foto: selectedRecommendation.Foto,
                tipo: selectedRecommendation.TipoNombre,
                precio_diario: selectedRecommendation.Precio,
            });
            return;
        }

        selectVehiculo.value = String(vehicleId);
        updateVehicleInfo(String(vehicleId));
    });

    selectVehiculo.addEventListener('change', (e) => updateVehicleInfo(e.target.value));
    selectSucursalRetiro.addEventListener('change', loadVehicles);
    selectSucursalRetiro.addEventListener('change', updateReservationMapMarkerColors);
    selectSucursalRetiro.addEventListener('change', () => {
        clearRecommendationCards();
        clearRecommendationFeedback();
    });
    selectSucursalDevolucion.addEventListener('change', updateReservationMapMarkerColors);
    dateInicio.addEventListener('change', () => {
        calculateTotal();
        syncRecommendationDays();
    });
    dateFin.addEventListener('change', () => {
        calculateTotal();
        syncRecommendationDays();
    });
    recommendButton?.addEventListener('click', requestRecommendations);
    form.addEventListener('submit', submitReservation);

    // ---  EJECUCIÓN INICIAL ---
    await loadBranches();
    await initReservationMap();
    await loadVehicles();
    syncRecommendationDays();
});