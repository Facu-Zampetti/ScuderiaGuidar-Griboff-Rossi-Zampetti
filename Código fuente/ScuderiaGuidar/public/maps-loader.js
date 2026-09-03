window.MapsLoader = (function () {
    let googleMapsPromise = null;

    async function getMapsConfig() {
        const response = await fetch('../api/get_maps_config.php');
        if (!response.ok) {
            throw new Error('No se pudo obtener configuracion de mapas.');
        }
        return response.json();
    }

    function injectGoogleMapsScript(apiKey) {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve();
                return;
            }

            const existingScript = document.querySelector('script[data-google-maps-loader="1"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => resolve());
                existingScript.addEventListener('error', () => reject(new Error('Error cargando Google Maps.')));
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
            script.async = true;
            script.defer = true;
            script.dataset.googleMapsLoader = '1';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Error cargando Google Maps.'));
            document.head.appendChild(script);
        });
    }

    function injectLeafletStylesheet() {
        return new Promise((resolve, reject) => {
            const existing = document.querySelector('link[data-leaflet-loader="1"]');
            if (existing) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            link.dataset.leafletLoader = '1';
            link.onload = () => resolve();
            link.onerror = () => reject(new Error('Error cargando estilos de Leaflet.'));
            document.head.appendChild(link);
        });
    }

    function injectLeafletScript() {
        return new Promise((resolve, reject) => {
            if (window.L && window.L.map) {
                resolve();
                return;
            }

            const existingScript = document.querySelector('script[data-leaflet-loader="1"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => resolve());
                existingScript.addEventListener('error', () => reject(new Error('Error cargando Leaflet.')));
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            script.crossOrigin = '';
            script.async = true;
            script.defer = true;
            script.dataset.leafletLoader = '1';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Error cargando Leaflet.'));
            document.head.appendChild(script);
        });
    }

    async function loadLeafletFallback() {
        await injectLeafletStylesheet();
        await injectLeafletScript();
    }

    async function loadGoogleMaps() {
        if (!googleMapsPromise) {
            googleMapsPromise = (async () => {
                const config = await getMapsConfig();
                const apiKey = String(config.apiKey || '').trim();

                if (apiKey !== '') {
                    try {
                        await injectGoogleMapsScript(apiKey);
                        return {
                            ...config,
                            provider: 'google',
                        };
                    } catch (error) {
                        console.warn('[maps-loader] Fallo Google Maps, se usa fallback Leaflet:', error);
                    }
                }

                await loadLeafletFallback();
                return {
                    ...config,
                    provider: 'leaflet',
                };
            })();
        }

        return googleMapsPromise;
    }

    return {
        loadGoogleMaps,
    };
})();
