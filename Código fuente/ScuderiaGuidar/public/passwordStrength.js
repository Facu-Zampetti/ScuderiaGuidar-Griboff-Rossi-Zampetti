const passwordInput = document.getElementById("password");
const strengthBar = document.getElementById("passwordStrengthBar");
const strengthText = document.getElementById("passwordStrengthText");
const requirements = document.querySelectorAll("#password-requirements li");

function updateRequirements(password) {
  requirements.forEach(li => {
    const svg = li.querySelector("svg");
    const type = li.dataset.requirement;
    let valid = false;

    switch(type) {
      case "length":
        valid = password.length >= 8;
        break;
      case "uppercase":
        valid = /[A-Z]/.test(password);
        break;
      case "number":
        valid = /[0-9]/.test(password);
        break;
      case "special":
        valid = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        break;
    }

    // Mostrar el SVG si se cumple, ocultar si no
    if(valid){
      svg.classList.remove("hidden");
    } else {
      svg.classList.add("hidden");
    }
  });
}

// Llamamos la función cada vez que el usuario escribe
passwordInput.addEventListener("input", () => {
  const password = passwordInput.value;
  updateRequirements(password);
});

// Evaluar la fuerza de la contraseña
function evaluatePasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
}

// Actualizar barra y texto
function updateStrengthUI(strength) {
  const widths = ["0%", "25%", "50%", "75%", "100%"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#15803d"]; // Colores Tailwind en HEX
  const labels = ["Muy débil", "Débil", "Media", "Fuerte", "Muy fuerte"];

  // Actualizar ancho y color de fondo directamente con estilo
  strengthBar.style.width = widths[strength];
  strengthBar.style.backgroundColor = colors[strength];
  strengthBar.style.transition = "width 0.5s ease, background-color 0.5s ease";

  // Cambiar texto
  strengthText.textContent = `Nivel: ${labels[strength]}`;
  strengthText.style.color =
    strength <= 1
      ? "#dc2626" // rojo
      : strength === 2
      ? "#ca8a04" // amarillo
      : "#16a34a"; // verde
}


// Evento en tiempo real
passwordInput.addEventListener("input", () => {
  const password = passwordInput.value.trim();
  const strength = evaluatePasswordStrength(password);
  updateStrengthUI(strength);
});
