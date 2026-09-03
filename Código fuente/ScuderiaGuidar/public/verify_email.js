document.addEventListener('DOMContentLoaded', () => {
    const loadingEl = document.getElementById('verify-loading');
    const messageEl = document.getElementById('verify-message');
    const subtitleEl = document.getElementById('verify-subtitle');
    const resendBlock = document.getElementById('resend-block');
    const resendEmailInput = document.getElementById('resend-email');
    const resendBtn = document.getElementById('resend-btn');

    function setMessage(message, isError = false) {
        messageEl.textContent = message;
        messageEl.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-green-100', 'text-green-700');
        messageEl.classList.add(isError ? 'bg-red-100' : 'bg-green-100', isError ? 'text-red-700' : 'text-green-700');
    }

    function showResendBlock(email = '') {
        resendBlock.classList.remove('hidden');
        if (email) {
            resendEmailInput.value = email;
        }
    }

    async function verifyToken(token) {
        try {
            const res = await fetch('../api/verify_email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });

            const data = await res.json();

            loadingEl.classList.add('hidden');

            if (res.ok && data.success) {
                subtitleEl.textContent = 'Tu cuenta ya está lista para usarse.';
                setMessage(data.message || 'Cuenta verificada correctamente.');
                return;
            }

            subtitleEl.textContent = 'No se pudo validar el enlace.';
            setMessage(data.message || 'Enlace inválido o vencido.', true);
            showResendBlock(data.email || '');

        } catch (err) {
            loadingEl.classList.add('hidden');
            subtitleEl.textContent = 'Error de conexión.';
            setMessage('No se pudo completar la verificación por un problema de red.', true);
            showResendBlock('');
        }
    }

    async function resendVerification() {
        const email = resendEmailInput.value.trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            setMessage('Ingresa un email válido para reenviar el enlace.', true);
            return;
        }

        resendBtn.disabled = true;
        resendBtn.textContent = 'Enviando...';

        try {
            const res = await fetch('../api/resend_verification_email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                subtitleEl.textContent = 'Reenvío completado.';
                setMessage(data.message || 'Te enviamos un nuevo enlace de verificación.');
            } else {
                setMessage(data.message || 'No se pudo reenviar el email.', true);
            }
        } catch (err) {
            setMessage('Error de conexión al intentar reenviar el email.', true);
        } finally {
            resendBtn.disabled = false;
            resendBtn.textContent = 'Reenviar email de verificación';
        }
    }

    resendBtn.addEventListener('click', resendVerification);

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        loadingEl.classList.add('hidden');
        subtitleEl.textContent = 'Falta token de verificación.';
        setMessage('El enlace no contiene token. Solicita un nuevo email de verificación.', true);
        showResendBlock('');
        return;
    }

    verifyToken(token);
});
