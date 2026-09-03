document.addEventListener("DOMContentLoaded", () => {
  console.log("[app.js] iniciado correctamente ✅");

  const grid = document.getElementById("vehicle-grid");
  const noResults = document.getElementById("no-results");
  const typesContainer = document.getElementById("filter-types");
  const branchSelect = document.getElementById("filter-branch");
  const minInput = document.getElementById("price-min");
  const maxInput = document.getElementById("price-max");
  const resetButton = document.getElementById("filter-reset");
  const sortSelect = document.getElementById("sort-select");

  const API_VEHICLES = "../api/get_vehicles.php";
  const API_TYPES = "../api/get_types.php";
  const API_BRANCHES = "../api/get_sucursales.php";

  const urlParams = new URLSearchParams(window.location.search);
  const initialType = urlParams.get('type');
  const initialBranch = urlParams.get('sucursal');

  const filters = {
    types: initialType ? [parseInt(initialType)] : [],
    branch: initialBranch && !isNaN(initialBranch) ? String(parseInt(initialBranch, 10)) : '',
    min_price: 10,
    max_price: 1000,
    sort: 'alpha'
  };

  if (initialType) console.log(`🎯 [app.js] Filtro inicial: Tipo ID ${initialType}`);

  loadVehicleTypes();
  loadBranches();
  loadVehicles();

  // ---  CARGAR TIPOS ---
  async function loadVehicleTypes() {
    try {
      const res = await fetch(API_TYPES);
      if (!res.ok) throw new Error("Error en get_types.php");
      
      const types = await res.json();
      if (!Array.isArray(types)) throw new Error("JSON inválido en tipos");

      typesContainer.innerHTML = "";

      types.forEach((t) => {
        const typeId = parseInt(t.ID_Tipos);
        const label = document.createElement("label");
        label.className = "flex items-center cursor-pointer hover:text-primary transition-colors mb-2";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = typeId;
        checkbox.className = "rounded border-gray-300 text-secondary focus:ring-secondary h-4 w-4";
        
        if (filters.types.includes(typeId)) checkbox.checked = true;

        checkbox.addEventListener("change", handleTypeChange);

        const name = document.createElement("span");
        name.className = "ml-3 text-text-primary text-sm";
        name.textContent = t.Nombre;

        label.appendChild(checkbox);
        label.appendChild(name);
        typesContainer.appendChild(label);
      });
    } catch (err) {
      console.error("Error tipos:", err);
      typesContainer.innerHTML = "<p class='text-red-500 text-xs'>Error cargando filtros</p>";
    }
  }

  async function loadBranches() {
    if (!branchSelect) return;

    try {
      const res = await fetch(API_BRANCHES);
      if (!res.ok) throw new Error('Error en get_sucursales.php');

      const branches = await res.json();
      branchSelect.innerHTML = '<option value="">Todas las sucursales</option>';

      if (!Array.isArray(branches) || branches.length === 0) {
        return;
      }

      branches.forEach(branch => {
        const option = document.createElement('option');
        option.value = String(branch.ID);
        option.textContent = branch.Nombre;
        branchSelect.appendChild(option);
      });

      if (filters.branch) {
        branchSelect.value = filters.branch;
      }
    } catch (err) {
      console.error('Error sucursales:', err);
      branchSelect.innerHTML = '<option value="">No se pudieron cargar sucursales</option>';
    }
  }

  // ---  CARGAR VEHÍCULOS ---
  async function loadVehicles() {
    try {
      const params = new URLSearchParams();

      if (filters.types.length > 0) {
        params.append("type", filters.types.join(","));
      }
      if (filters.branch) {
        params.append('sucursal', filters.branch);
      }
      if (filters.min_price) params.append("min_price", filters.min_price);
      if (filters.max_price) params.append("max_price", filters.max_price);
      
      params.append("sort", filters.sort);
      params.append("available", "1");

      const url = `${API_VEHICLES}?${params.toString()}`;
      
      grid.innerHTML = '<p class="col-span-full text-center text-gray-500 mt-10 animate-pulse">Cargando catálogo...</p>';

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const vehicles = await res.json();
      renderVehicles(vehicles);

    } catch (err) {
      console.error("Error vehículos:", err);
      grid.innerHTML = `<div class="col-span-full text-red-600 text-center">Error al cargar vehículos. Intenta recargar.</div>`;
    }
  }

  // ---  RENDERIZADO CON DESTACADO  ---
  function renderVehicles(vehicles) {
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      grid.innerHTML = "";
      noResults.classList.remove("hidden");
      return;
    }

    noResults.classList.add("hidden");

    grid.innerHTML = vehicles
      .map((v) => {
        const disponible = v.Disponibilidad == 1;
        const isDestacado = v.Destacado == 1; 
        const foto = resolveImagePath(v.Foto);
        const linkReserva = `reservation_system.html?id=${v.ID}`;

        const borderClass = isDestacado ? "border-2 border-secondary shadow-lg ring-2 ring-secondary/20" : "border border-gray-100 shadow-sm";
        const bgClass = isDestacado ? "bg-yellow-50/10" : "bg-white"; 

        // Etiqueta de Destacado 
        const starBadge = isDestacado 
            ? `<div class="absolute top-3 right-3 bg-secondary text-primary text-xs font-bold px-2 py-1 rounded shadow-md z-10 flex items-center">
                 <svg class="w-3 h-3 mr-1 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                 Destacado
               </div>`
            : '';

        return `
        <article class="${bgClass} rounded-2xl overflow-hidden group transition-all hover:shadow-lg ${borderClass} flex flex-col h-full relative">
          
          <div class="relative h-48 w-full overflow-hidden">
            ${starBadge}

            <img src="${foto}" alt="${v.Marca} ${v.Modelo}"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onerror="this.src='https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=600&auto=format&fit=crop';">
            
            <div class="absolute top-3 left-3">
              <span class="inline-block px-2 py-1 rounded text-xs font-bold shadow-sm ${
                disponible ? "bg-green-500 text-white" : "bg-gray-500 text-white"
              }">
                ${disponible ? "Disponible" : "Reservado"}
              </span>
            </div>
          </div>
          
          <div class="p-4 flex-1 flex flex-col">
            <div class="mb-2">
                <h3 class="text-lg font-semibold text-primary flex items-center">
                    ${v.Marca} ${v.Modelo}
                </h3>
                <p class="text-text-secondary text-sm">${v.TipoNombre || ""} • $${v.Precio}/día</p>
            </div>
            <div class="text-xs text-text-secondary mb-4">Patente: ${v.Patente}</div>
            
            <div class="mt-auto">
                <a href="${linkReserva}" 
                   class="inline-block w-full text-center bg-secondary hover:bg-yellow-500 text-primary font-semibold px-4 py-2 rounded-md text-sm transition-colors shadow-sm">
                  Reservar
                </a>
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  // --- EVENTOS ---
  function handleTypeChange(e) {
    const value = parseInt(e.target.value);
    if (e.target.checked) {
      filters.types.push(value);
    } else {
      filters.types = filters.types.filter((id) => id !== value);
    }
    loadVehicles();
  }

  if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
          filters.sort = e.target.value;
          loadVehicles();
      });
  }

    if (branchSelect) {
      branchSelect.addEventListener('change', (e) => {
        filters.branch = e.target.value;
        loadVehicles();
      });
    }

  let debounceTimer;
  function handlePriceChange() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const min = parseFloat(minInput.value) || 0;
        const max = parseFloat(maxInput.value) || 0;
        filters.min_price = min;
        filters.max_price = max;
        loadVehicles();
    }, 500);
  }

  minInput.addEventListener("input", handlePriceChange);
  maxInput.addEventListener("input", handlePriceChange);

  resetButton.addEventListener("click", () => {
    filters.types = [];
    filters.branch = '';
    filters.min_price = 10;
    filters.max_price = 1000;
    filters.sort = 'alpha';
    
    typesContainer.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = false));
    minInput.value = filters.min_price;
    maxInput.value = filters.max_price;
    if(sortSelect) sortSelect.value = 'alpha';
    if(branchSelect) branchSelect.value = '';
    
    window.history.pushState({}, '', window.location.pathname);
    loadVehicles();
  });

  function resolveImagePath(foto) {
    if (!foto || foto.trim() === "") return "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=600&auto=format&fit=crop";
    foto = foto.trim();
    if (/^(https?:\/\/|\/|(\.\.\/))/i.test(foto)) return foto;
    return `../img/${foto}`;
  }
});