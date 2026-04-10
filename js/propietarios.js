

// propietarios.js - Maneja la lógica de la página de propietarios, incluyendo la visualización de aviones, filtrado y cambio de aerolínea propietaria.
let avionesData = [];
let aerolineasData = [];
let propietariosData = [];
// Al cargar la página, se obtienen los datos iniciales y se configuran los event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadInitialData();
    setupEventListeners();
});
// Carga los aviones y aerolíneas desde la API y los muestra en la tabla
async function loadInitialData() {
    try {
        showLoading();
        const [aviones, aerolineas, propietarios] = await Promise.all([
            api.getAviones(),
            api.getAerolineas(),
            api.getAllPropietarios()
        ]);
        avionesData = aviones;
        aerolineasData = aerolineas;
        propietariosData = propietarios;
        displayPropietarios(propietariosData);
        displayAvionesConAerolinea(avionesData);
        updateStatistics();
    } catch (error) {
        console.error('Error loading initial data:', error);
        showAlert('Error al cargar los datos', 'danger');
        showErrorState();
    } finally {
        hideLoading();
    }
}
// Configura los event listeners para los filtros y el formulario de cambio de propietario
function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', filterData);
    document.getElementById('estadoFilter').addEventListener('change', filterData);
    document.getElementById('changeOwnerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        changeOwner();
    });
}
// Muestra los aviones en la tabla, incluyendo el nombre de la aerolínea propietaria
function displayAvionesConAerolinea(aviones) {
    const tbody = document.getElementById('avionesTableBody');
    if (!aviones || aviones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay aviones registrados
                </td>
            </tr>`;
        return;
    }
    tbody.innerHTML = aviones.map(avion => {
        const aerolinea = aerolineasData.find(a => a.idAerolinea === avion.idAerolinea) || null;
        const propietario = propietariosData.find(p => p.idPropietario === avion.idPropietario) || null;
        return `
            <tr>
                <td>${propietario ? propietario.idPropietario : 'N/A'}</td>
                <td>${propietario ? propietario.nombre : 'Sin propietario'}</td>
                <td><strong>${avion.nombre || 'Sin nombre'}</strong></td>
                <td>${avion.modelo || 'N/A'}</td>
                <td><code>${avion.matricula || 'N/A'}</code></td>
                <td><span class="badge bg-info"><i class="bi bi-people-fill me-1"></i>${avion.capacidad || 0}</span></td>
                <td>${aerolinea ? `<span class="badge bg-primary">${aerolinea.nombre}</span>` : '<span class="text-muted">Sin aerolínea</span>'}</td>
                <td>${formatEstado(avion.estado)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-warning" onclick="openChangeOwnerModal(${avion.idAvion})" title="Cambiar aerolínea">
                        <i class="bi bi-arrow-left-right"></i>
                    </button>
                </td>
            </tr>`;
    }).join('');
}
// Muestra los propietarios en la tabla
function displayPropietarios(propietarios) {
    const tbody = document.getElementById('propietariosTableBody');
    if (!propietarios || propietarios.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay propietarios registrados
                </td>
            </tr>`;
        return;
    }
    tbody.innerHTML = propietarios.map(propietario => `
        <tr>
            <td>${propietario.idPropietario}</td>
            <td><code>${propietario.identificacion || 'N/A'}</code></td>
            <td><strong>${propietario.nombre || 'Sin nombre'}</strong></td>
            <td>${propietario.telefono || 'N/A'}</td>
            <td>${formatEstado(propietario.estado)}</td>
        </tr>
    `).join('');
}
// Formatea el estado del avión para mostrarlo con un badge
function updateStatistics() {
    const total = avionesData.length;
    const activos = avionesData.filter(a => a.estado === true).length;
    const inactivos = avionesData.filter(a => a.estado === false).length;
    document.getElementById('totalAviones').textContent = total;
    document.getElementById('avionesActivos').textContent = activos;
    document.getElementById('avionesInactivos').textContent = inactivos;
}
// Formatea el estado del avión para mostrarlo con un badge
function filterData() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const estadoFilter = document.getElementById('estadoFilter').value;

    let filtered = avionesData;
    if (searchTerm) {
        filtered = filtered.filter(avion => {
            const aerolinea = aerolineasData.find(a => a.idAerolinea === avion.idAerolinea);
            return (avion.nombre && avion.nombre.toLowerCase().includes(searchTerm)) ||
                   (avion.matricula && avion.matricula.toLowerCase().includes(searchTerm)) ||
                   (aerolinea && aerolinea.nombre.toLowerCase().includes(searchTerm));
        });
    }
    if (estadoFilter !== '') {
        filtered = filtered.filter(avion => avion.estado === (estadoFilter === 'true'));
    }
    displayAvionesConAerolinea(filtered);
}
// Resetea los filtros de búsqueda y muestra todos los aviones
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('estadoFilter').value = '';
    displayAvionesConAerolinea(avionesData);
}
// Abre el modal para cambiar la aerolínea propietaria de un avión
function openChangeOwnerModal(avionId) {
    const avion = avionesData.find(a => a.idAvion === avionId);
    if (!avion) { showAlert('Avión no encontrado', 'warning'); return; }

    document.getElementById('avionIdToChange').value = avionId;
    document.getElementById('avionNombreInfo').textContent = `${avion.nombre} (${avion.matricula})`;

    const select = document.getElementById('nuevaAerolinea');
    select.innerHTML = '<option value="">Seleccione una aerolínea</option>' +
        aerolineasData.map(a => `<option value="${a.idAerolinea}">${a.nombre}</option>`).join('');
    select.value = avion.idAerolinea || '';

    new bootstrap.Modal(document.getElementById('changeOwnerModal')).show();
}
// Cambia la aerolínea propietaria de un avión
async function changeOwner() {
    const avionId = parseInt(document.getElementById('avionIdToChange').value);
    const nuevaAerolineaId = parseInt(document.getElementById('nuevaAerolinea').value);

    if (!nuevaAerolineaId) { showAlert('Seleccione una aerolínea', 'warning'); return; }

    const avion = avionesData.find(a => a.idAvion === avionId);
    const aerolinea = aerolineasData.find(a => a.idAerolinea === nuevaAerolineaId);

    try {
        await api.updateAvion(avionId, { ...avion, idAerolinea: nuevaAerolineaId });
        showAlert(`Avión "${avion.nombre}" transferido a "${aerolinea.nombre}"`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('changeOwnerModal')).hide();
        await loadInitialData();
    } catch (error) {
        showAlert('Error al cambiar la aerolínea', 'danger');
    }
}
// Funciones de estado (cargando, error)
function showLoading() {
    document.getElementById('avionesTableBody').innerHTML = `
        <tr><td colspan="9" class="text-center">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Cargando...</p>
        </td></tr>`;
}

function hideLoading() {}

function showErrorState() {
    document.getElementById('avionesTableBody').innerHTML = `
        <tr><td colspan="9" class="text-center text-danger py-4">
            <i class="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
            Error al cargar los datos
            <br><button class="btn btn-sm btn-outline-primary mt-2" onclick="loadInitialData()">Reintentar</button>
        </td></tr>`;
}
