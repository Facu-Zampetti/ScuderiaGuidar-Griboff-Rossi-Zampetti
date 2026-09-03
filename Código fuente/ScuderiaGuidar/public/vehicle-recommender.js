document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('ai-assistant-toggle');
    const closeButton = document.getElementById('ai-assistant-close');
    const panel = document.getElementById('ai-assistant-panel');
    const form = document.getElementById('ai-assistant-form');
    const messages = document.getElementById('ai-assistant-messages');
    const submitButton = document.getElementById('ai-assistant-submit');

    if (!toggleButton || !closeButton || !panel || !form || !messages || !submitButton) {
        return;
    }

    const fields = {
        days: document.getElementById('ai-days'),
        passengers: document.getElementById('ai-passengers'),
        luggageQuantity: document.getElementById('ai-luggage-quantity'),
        luggageSize: document.getElementById('ai-luggage-size'),
        tripStyle: document.getElementById('ai-trip-style'),
        kilometers: document.getElementById('ai-kilometers'),
        budgetMode: document.getElementById('ai-budget-mode'),
        budgetValue: document.getElementById('ai-budget-value'),
        automatic: document.getElementById('ai-extra-automatic'),
        airConditioning: document.getElementById('ai-extra-ac'),
        freeMessage: document.getElementById('ai-free-message'),
    };

    function setPanelOpen(isOpen) {
        panel.classList.toggle('hidden', !isOpen);
        toggleButton.setAttribute('aria-expanded', String(isOpen));

        if (isOpen && !form.classList.contains('hidden')) {
            fields.days.focus();
        }
    }

    function addMessage(text, type = 'bot') {
        const message = document.createElement('div');
        message.className = `ai-message ai-message-${type}`;
        message.textContent = text;
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
        return message;
    }

    function addRecommendationMessage(recommendation) {
        const vehicle = recommendation.vehicle || {};
        const message = document.createElement('div');
        message.className = 'ai-message ai-message-bot';

        const title = document.createElement('strong');
        title.textContent = `${vehicle.marca || ''} ${vehicle.modelo || ''}`.trim();
        message.appendChild(title);

        const details = document.createElement('div');
        details.textContent = `${vehicle.tipo || 'Vehiculo'} | $${formatPrice(vehicle.precio_diario)}/dia`;
        message.appendChild(details);

        const reason = document.createElement('div');
        reason.textContent = recommendation.reason || 'Opcion recomendada para tu viaje.';
        message.appendChild(reason);

        const reserveLink = document.createElement('a');
        reserveLink.className = 'ai-recommendation-link';
        reserveLink.href = `reservation_system.html?id=${encodeURIComponent(vehicle.id || recommendation.id)}`;
        reserveLink.textContent = 'Ver y reservar';
        message.appendChild(reserveLink);

        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
    }

    function formatPrice(value) {
        const numericValue = Number(value);
        return Number.isFinite(numericValue)
            ? numericValue.toLocaleString('es-AR', { maximumFractionDigits: 2 })
            : '-';
    }

    function collectPayload() {
        const extras = [];
        if (fields.automatic.checked) extras.push('transmision_automatica');
        if (fields.airConditioning.checked) extras.push('aire_acondicionado');

        return {
            dias_alquiler: Number.parseInt(fields.days.value, 10),
            pasajeros: Number.parseInt(fields.passengers.value, 10),
            equipaje_cantidad: Number.parseInt(fields.luggageQuantity.value, 10),
            equipaje_tamano: fields.luggageSize.value,
            estilo_viaje: fields.tripStyle.value,
            kilometros_aprox: Number.parseInt(fields.kilometers.value, 10),
            presupuesto_modo: fields.budgetMode.value,
            presupuesto_valor: Number.parseFloat(fields.budgetValue.value),
            extras,
            consulta_libre: fields.freeMessage.value.trim(),
        };
    }

    function getValidationError(payload) {
        if (!Number.isInteger(payload.dias_alquiler) || payload.dias_alquiler < 1) return 'Indica dias de alquiler validos.';
        if (!Number.isInteger(payload.pasajeros) || payload.pasajeros < 1) return 'Indica una cantidad valida de pasajeros.';
        if (!Number.isInteger(payload.equipaje_cantidad) || payload.equipaje_cantidad < 0) return 'Indica una cantidad valida de equipaje.';
        if (!Number.isInteger(payload.kilometros_aprox) || payload.kilometros_aprox < 0) return 'Indica kilometros validos.';
        if (!Number.isFinite(payload.presupuesto_valor) || payload.presupuesto_valor <= 0) return 'Indica un presupuesto mayor a cero.';
        return '';
    }

    async function requestRecommendations(event) {
        event.preventDefault();

        const payload = collectPayload();
        const validationError = getValidationError(payload);
        if (validationError) {
            addMessage(validationError, 'error');
            return;
        }

        const note = payload.consulta_libre || 'Perfil de viaje enviado.';
        addMessage(note, 'user');

        // Al enviar preferencias válidas, ocultamos el formulario y dejamos visible solo el chat.
        form.classList.add('hidden');
        panel.classList.add('ai-assistant-chat-only');

        submitButton.disabled = true;
        submitButton.textContent = 'Buscando...';

        try {
            const response = await fetch('../api/recomendar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'No fue posible obtener recomendaciones.');
            }

            if (!Array.isArray(result.recommendations) || result.recommendations.length === 0) {
                addMessage('No encontre vehiculos disponibles que se ajusten a ese perfil.', 'error');
                return;
            }

            addMessage('Estas son mis mejores opciones:', 'bot');
            result.recommendations.forEach(addRecommendationMessage);
        } catch (error) {
            console.error('Error del asistente IA:', error);
            addMessage(error.message || 'No se pudo consultar al asistente en este momento.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Buscar opciones';
        }
    }

    toggleButton.addEventListener('click', () => setPanelOpen(panel.classList.contains('hidden')));
    closeButton.addEventListener('click', () => setPanelOpen(false));
    form.addEventListener('submit', requestRecommendations);
});
