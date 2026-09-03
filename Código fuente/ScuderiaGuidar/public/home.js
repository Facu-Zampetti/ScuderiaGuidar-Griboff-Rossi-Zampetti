
document.addEventListener('DOMContentLoaded', () => {
    loadHeroVehicle();
    loadCategories();
    loadHomeBranchesMap();
});

const leafletIconCache = {};

async function loadHeroVehicle() {
    const heroImg = document.getElementById('hero-img');
    const heroBadge = document.getElementById('hero-badge-text');
    const heroPrice = document.getElementById('hero-price');

    if (!heroImg) return;

    try {
        const response = await fetch('../api/get_vehicles.php');
        const vehicles = await response.json();

        let topCar = vehicles.find(v => v.Destacado == 1);

        if (!topCar && vehicles.length > 0) {
            topCar = vehicles[0];
        }

        if (topCar) {
            let photoPath = resolvePath(topCar.Foto);
            
            heroImg.style.opacity = 0;
            setTimeout(() => {
                heroImg.src = photoPath;
                heroImg.alt = `${topCar.Marca} ${topCar.Modelo}`;
                
                if(heroBadge) heroBadge.textContent = `Destacado: ${topCar.Marca} ${topCar.Modelo}`;
                
                if(heroPrice && topCar.Precio) {
                    heroPrice.textContent = `$${topCar.Precio} / día`;
                }

                heroImg.style.opacity = 1;
            }, 200);

            heroImg.parentElement.style.cursor = 'pointer';
            heroImg.parentElement.addEventListener('click', () => {
                window.location.href = `reservation_system.html?id=${topCar.ID}`;
            });
        }
    } catch (error) {
        console.error("Error Hero:", error);
    }
}

async function loadCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;

    try {
        const res = await fetch('../api/get_types.php');
        const categories = await res.json();

        grid.innerHTML = ''; 

        if (!Array.isArray(categories) || categories.length === 0) {
            grid.innerHTML = '<p class="text-center col-span-full">No hay categorías disponibles.</p>';
            return;
        }

        categories.forEach(cat => {
            const imageSrc = cat.FotoEjemplo 
                ? resolvePath(cat.FotoEjemplo) 
                : 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=400';

            const linkUrl = `vehicle_catalog.html?type=${cat.ID_Tipos}`;

            const card = document.createElement('div');
            card.className = "card-elevated group cursor-pointer hover:shadow-lg transition-all duration-300 h-full flex flex-col overflow-hidden bg-white rounded-lg";
            
            card.innerHTML = `
                <a href="${linkUrl}" class="flex flex-col h-full">
                    <div class="relative overflow-hidden h-56">
                        <img src="${imageSrc}" 
                             alt="${cat.Nombre}" 
                             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                             loading="lazy"
                             onerror="this.src='https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=400';">
                        
                        <div class="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm text-white px-3 py-1 rounded text-sm font-bold shadow-md border border-white/10">
                            Base $${cat.Precio}/día
                        </div>
                    </div>
                    
                    <div class="p-6 flex-1 flex flex-col">
                        <h3 class="text-xl font-bold text-primary mb-2">${cat.Nombre}</h3>
                        <p class="text-text-secondary mb-4 text-sm line-clamp-2">
                            ${cat.Descripcion || 'Vehículos premium'}
                        </p>
                        
                        <div class="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                            <span class="text-xs font-medium text-text-secondary bg-gray-100 px-3 py-1 rounded-full">
                                ${cat.CantidadAutos} Disponibles
                            </span>
                            <span class="text-secondary font-semibold text-sm flex items-center group-hover:translate-x-1 transition-transform">
                                Ver Autos →
                            </span>
                        </div>
                    </div>
                </a>
            `;
            grid.appendChild(card);
        });

    } catch (err) {
        console.error("Error Categorías:", err);
        grid.innerHTML = `<p class="text-red-500 text-center col-span-full">Error de conexión.</p>`;
    }
}

function resolvePath(path) {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('../')) {
        return path;
    }
    return `../img/${path}`;
}

async function loadHomeBranchesMap() {
    const mapContainer = document.getElementById('home-branches-map');
    const errorElement = document.getElementById('home-map-error');
    if (!mapContainer) return;

    try {
        const [mapConfig, branchesResponse] = await Promise.all([
            window.MapsLoader.loadGoogleMaps(),
            fetch('../api/get_sucursales.php')
        ]);

        if (!branchesResponse.ok) {
            throw new Error('No se pudieron cargar las sucursales.');
        }

        const branches = await branchesResponse.json();

        if (mapConfig.provider === 'leaflet' && window.L && typeof window.L.map === 'function') {
            renderLeafletHomeMap(mapContainer, mapConfig, branches);
            return;
        }

        const map = new google.maps.Map(mapContainer, {
            center: mapConfig.cityCenter,
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
        });

        const bounds = new google.maps.LatLngBounds();
        const sharedInfoWindow = new google.maps.InfoWindow();

        const validBranches = Array.isArray(branches)
            ? branches.filter(branch => isFiniteCoordinate(branch.Latitud) && isFiniteCoordinate(branch.Longitud))
            : [];

        validBranches.forEach(branch => {
            const branchPosition = {
                lat: Number(branch.Latitud),
                lng: Number(branch.Longitud),
            };

            const marker = new google.maps.Marker({
                position: branchPosition,
                map,
                title: branch.Nombre,
                icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            });

            marker.addListener('click', () => {
                const content = `
                    <div style="max-width: 240px; font-family: Arial, sans-serif;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">${escapeHtml(branch.Nombre)}</h4>
                        <p style="margin: 0 0 10px 0; font-size: 12px; color: #4b5563;">${escapeHtml(branch.Direccion || '-')}</p>
                        <a href="vehicle_catalog.html?sucursal=${encodeURIComponent(branch.ID)}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; font-size: 12px; padding: 7px 10px; border-radius: 6px; font-weight: 600;">Ver disponibilidad</a>
                    </div>
                `;
                sharedInfoWindow.setContent(content);
                sharedInfoWindow.open({ map, anchor: marker });
            });

            bounds.extend(branchPosition);
        });

        const airport = mapConfig.airport;
        if (airport && isFiniteCoordinate(airport.lat) && isFiniteCoordinate(airport.lng)) {
            const airportPosition = { lat: Number(airport.lat), lng: Number(airport.lng) };

            const airportMarker = new google.maps.Marker({
                position: airportPosition,
                map,
                title: airport.name || 'Aeropuerto de Cordoba',
                icon: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
            });

            airportMarker.addListener('click', () => {
                const content = `
                    <div style="max-width: 230px; font-family: Arial, sans-serif;">
                        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">${escapeHtml(airport.name || 'Aeropuerto de Cordoba')}</h4>
                        <p style="margin: 0; font-size: 12px; color: #4b5563;">${escapeHtml(airport.address || '')}</p>
                    </div>
                `;
                sharedInfoWindow.setContent(content);
                sharedInfoWindow.open({ map, anchor: airportMarker });
            });

            bounds.extend(airportPosition);
        }

        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, 60);
        }

    } catch (error) {
        console.error('Error mapa home:', error);
        if (errorElement) {
            errorElement.textContent = 'No se pudo cargar el mapa interactivo de sucursales.';
            errorElement.classList.remove('hidden');
        }
    }
}

function renderLeafletHomeMap(mapContainer, mapConfig, branches) {
    if (mapContainer._leafletMapInstance) {
        mapContainer._leafletMapInstance.remove();
    }

    const center = mapConfig.cityCenter || { lat: -31.4201, lng: -64.1888 };
    const map = L.map(mapContainer, {
        center: [Number(center.lat), Number(center.lng)],
        zoom: 12,
    });

    mapContainer._leafletMapInstance = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(map);

    const bounds = [];
    const validBranches = Array.isArray(branches)
        ? branches.filter(branch => isFiniteCoordinate(branch.Latitud) && isFiniteCoordinate(branch.Longitud))
        : [];

    validBranches.forEach(branch => {
        const lat = Number(branch.Latitud);
        const lng = Number(branch.Longitud);
        const marker = L.marker([lat, lng], {
            icon: getLeafletColorIcon('red'),
        }).addTo(map);

        marker.bindPopup(`
            <div style="max-width: 240px; font-family: Arial, sans-serif;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">${escapeHtml(branch.Nombre)}</h4>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #4b5563;">${escapeHtml(branch.Direccion || '-')}</p>
                <a href="vehicle_catalog.html?sucursal=${encodeURIComponent(branch.ID)}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; font-size: 12px; padding: 7px 10px; border-radius: 6px; font-weight: 600;">Ver disponibilidad</a>
            </div>
        `);

        bounds.push([lat, lng]);
    });

    const airport = mapConfig.airport;
    if (airport && isFiniteCoordinate(airport.lat) && isFiniteCoordinate(airport.lng)) {
        const airportLat = Number(airport.lat);
        const airportLng = Number(airport.lng);
        const airportMarker = L.marker([airportLat, airportLng], {
            icon: getLeafletColorIcon('yellow'),
        }).addTo(map);

        airportMarker.bindPopup(`
            <div style="max-width: 230px; font-family: Arial, sans-serif;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700;">${escapeHtml(airport.name || 'Aeropuerto de Cordoba')}</h4>
                <p style="margin: 0; font-size: 12px; color: #4b5563;">${escapeHtml(airport.address || '')}</p>
            </div>
        `);

        bounds.push([airportLat, airportLng]);
    }

    if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });
    }
}

function getLeafletColorIcon(colorName) {
    const color = ['red', 'blue', 'green', 'yellow'].includes(colorName) ? colorName : 'red';

    if (!leafletIconCache[color]) {
        leafletIconCache[color] = L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
            iconRetinaUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
        });
    }

    return leafletIconCache[color];
}

function isFiniteCoordinate(value) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue);
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