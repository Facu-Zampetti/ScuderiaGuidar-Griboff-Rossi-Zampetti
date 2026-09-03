console.log("register.js script cargado correctamente");

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const submitBtn = document.getElementById('submitBtn');
  const submitText = document.getElementById('submitText');
  const submitSpinner = document.getElementById('submitSpinner');
  const formMessage = document.getElementById('formMessage'); // Mensaje general

  const errEmail = document.getElementById('error-email');
  const errDni = document.getElementById('error-dni');
  const errPassword = document.getElementById('error-password');
  const errConfirm = document.getElementById('error-confirmPassword');
  const errBirth = document.getElementById('error-dateOfBirth');

  // Limpiar todos los errores
  function clearErrors() {
    [errEmail, errDni, errPassword, errConfirm, errBirth].forEach(span => {
      if (span) {
        span.textContent = '';
        span.classList.add('hidden');
      }
    });
    if (formMessage) {
      formMessage.textContent = '';
      formMessage.classList.add('hidden');
      formMessage.className = "hidden mb-4 p-3 rounded text-sm font-semibold text-center"; 
    }
  }

  // Mostrar error debajo de un campo y hacer SCROLL hacia el
  function showFieldError(span, msg) {
    if (span) {
      span.textContent = msg;
      span.classList.remove('hidden');
      // Esto hace que la pantalla suba hasta donde esta el error
      span.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // UI de carga
  function setLoading(loading) {
    if(submitBtn) submitBtn.disabled = loading;
    if(submitSpinner) submitSpinner.classList.toggle('hidden', !loading);
    if(submitText) submitText.textContent = loading ? 'Registrando...' : 'Crear mi cuenta';
  }

  function calculateAge(birthDateStr) {
    const dob = new Date(birthDateStr);
    if (isNaN(dob.getTime())) return null;
    const diff = new Date(Date.now() - dob.getTime());
    return Math.abs(diff.getUTCFullYear() - 1970);
  }

  // EVENTO DE ENVÍO
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // Evita que la página se recargue sola
      clearErrors(); // Limpia errores viejos

      //  Recoger datos del formulario
      const firstName = document.getElementById('firstName').value.trim();
      const lastName  = document.getElementById('lastName').value.trim();
      const email     = document.getElementById('email').value.trim();
      const phone     = document.getElementById('phone').value.trim();
      const dni       = document.getElementById('dni').value.trim();
      const license   = document.getElementById('licencia').checked ? 1 : 0;
      const dob       = document.getElementById('dateOfBirth').value.trim();
      const address   = document.getElementById('direccion').value.trim();
      const password  = document.getElementById('password').value;
      const confirm   = document.getElementById('confirmPassword').value;

      //  Validaciones Frontend (Lo que revisamos antes de enviar)
      let firstErrorSpan = null; // Guardaremos el primer error para hacer scroll ahí

      // Validar Email
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) { 
          showFieldError(errEmail, 'Email inválido'); 
          if(!firstErrorSpan) firstErrorSpan = errEmail;
      }
      
      // Validar DNI
      if (!dni || !/^\d+$/.test(dni)) { 
          showFieldError(errDni, 'DNI inválido (solo números)'); 
          if(!firstErrorSpan) firstErrorSpan = errDni;
      }

      // Validar Edad
      const age = calculateAge(dob);
      if (age === null || age < 21) { 
          showFieldError(errBirth, 'Debes tener al menos 21 años'); 
          if(!firstErrorSpan) firstErrorSpan = errBirth;
      }

      // Validar Contraseñas
      if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) { 
          showFieldError(errPassword, 'Contraseña insegura (Mín 8, 1 mayúscula, 1 número)'); 
          if(!firstErrorSpan) firstErrorSpan = errPassword;
      }
      if (password !== confirm) { 
          showFieldError(errConfirm, 'Las contraseñas no coinciden'); 
          if(!firstErrorSpan) firstErrorSpan = errConfirm;
      }

      if (firstErrorSpan) {
          firstErrorSpan.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
      }

      //  Preparar Envío al Servidor
      const payload = { firstName, lastName, email, phone, dni, hasLicense: license, dateOfBirth: dob, address, password };

      try {
        setLoading(true);

        // Hacemos la petición al PHP
        const resp = await fetch('../api/register.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const json = await resp.json();

        if (!resp.ok) {
          
          let serverErrorFound = false;

          if (json.errors) {
              if (json.errors.email) {
                  showFieldError(errEmail, json.errors.email); // "El email ya existe" en rojo
                  serverErrorFound = true;
              }
              if (json.errors.dni) {
                  showFieldError(errDni, json.errors.dni); // "El DNI ya existe" en rojo
                  serverErrorFound = true;
              }
              if (json.errors.password) {
                  showFieldError(errPassword, json.errors.password);
                  serverErrorFound = true;
              }
              if (json.errors.dateOfBirth) {
                  showFieldError(errBirth, json.errors.dateOfBirth);
                  serverErrorFound = true;
              }
              
              if (json.errors.server) {
                  formMessage.textContent = json.errors.server;
                  formMessage.classList.remove('hidden');
                  formMessage.classList.add('bg-red-100', 'text-red-700');
                  formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
          } else {
              formMessage.textContent = json.message || 'Error desconocido en el registro.';
              formMessage.classList.remove('hidden');
              formMessage.classList.add('bg-red-100', 'text-red-700');
              formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }

        const successMsg = json.message || 'Cuenta creada. Revisa tu email para verificar la cuenta.';
        formMessage.textContent = successMsg + ' Redirigiendo...';
        formMessage.classList.remove('hidden');
        formMessage.classList.remove('bg-red-100', 'text-red-700');
        formMessage.classList.add('bg-green-100', 'text-green-700');
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);

      } catch (err) {
        console.error('Error en fetch register:', err);
        formMessage.textContent = 'Error de conexión con el servidor.';
        formMessage.classList.remove('hidden');
        formMessage.classList.add('bg-red-100', 'text-red-700');
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } finally {
        setLoading(false);
      }
    });
  }
});