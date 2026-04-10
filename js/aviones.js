// Aviones.js Maneja la lógica para el CRUD de aviones
let avionesData = [];
let aerolineasData = [];
let propietariosData = [];
let currentEditingId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadInitialData();
    setupEventListeners();
});

async function loadInitialData() {
    try {
        showLoading();
        
        // Cargar aviones, aerolíneas y propietarios en paralelo
        const [aviones, aerolineas, propietarios] = await Promise.all([
            api.getAviones(),
            api.getAerolineas(),
            api.getAllPropietarios()
        ]);

        avionesData = aviones;
        aerolineasData = aerolineas;
        propietariosData = propietarios;

        displayAviones(avionesData);
        updateStatistics();
        populateSelects();
        populateFilters();

    } catch (error) {
        console.error('Error loading initial data:', error);
        showAlert('Error al cargar los datos', 'danger');
        showErrorState();
    } finally {
        hideLoading();
    }
}


function setupEventListeners() {
    // buscar
    document.getElementById('searchInput').addEventListener('input', filterAviones);
    
    // filtros
    document.getElementById('aerolineaFilter').addEventListener('change', filterAviones);
    document.getElementById('estadoFilter').addEventListener('change', filterAviones);
    
    // validación del formulario
    document.getElementById('avionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveAvion();
    });
}

function displayAviones(aviones) {
    const tbody = document.getElementById('avionesTableBody');
    
    if (!aviones || aviones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay aviones registrados
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = aviones.map(avion => {
        const aerolinea = aerolineasData.find(a => a.idAerolinea === avion.idAerolinea);
        const propietario = propietariosData.find(p => p.idPropietario === avion.idPropietario);
        
        return `
            <tr>
                <td>${avion.idAvion}</td>
                <td>
                    <strong>${avion.nombre || 'Sin nombre'}</strong>
                </td>
                <td>${avion.modelo || 'N/A'}</td>
                <td><code>${avion.matricula || 'N/A'}</code></td>
                <td>
                    <span class="badge bg-info">
                        <i class="bi bi-people-fill me-1"></i>
                        ${avion.capacidad || 0}
                    </span>
                </td>
                <td>${avion.anioFabricacion || 'N/A'}</td>
                <td>
                    ${aerolinea ? 
                        `<span class="badge bg-primary">${aerolinea.nombre}</span>` : 
                        '<span class="text-muted">Sin aerolínea</span>'
                    }
                </td>
                <td>
                    ${propietario ? 
                        `<span class="badge bg-secondary">${propietario.nombre}</span>` : 
                        '<span class="text-muted">Sin propietario</span>'
                    }
                </td>
                <td>${formatEstado(avion.estado)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline-primary" onclick="editAvion(${avion.idAvion})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="viewAvion(${avion.idAvion})" title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStatistics() {
    const total = avionesData.length;
    const activos = avionesData.filter(a => a.estado === true).length;
    const capacidadTotal = avionesData.reduce((sum, avion) => sum + (avion.capacidad || 0), 0);
    const promedioCapacidad = total > 0 ? Math.round(capacidadTotal / total) : 0;

    document.getElementById('totalAviones').textContent = total;
    document.getElementById('avionesActivos').textContent = activos;
    document.getElementById('capacidadTotal').textContent = capacidadTotal.toLocaleString();
    document.getElementById('promedioCapacidad').textContent = promedioCapacidad.toLocaleString();
}

function populateSelects() {
    // select de aerolíneas
    const aerolineaSelect = document.getElementById('idAerolinea');
    aerolineaSelect.innerHTML = '<option value="">Seleccione una aerolínea</option>' +
        aerolineasData.map(aerolinea => 
            `<option value="${aerolinea.idAerolinea}">${aerolinea.nombre}</option>`
        ).join('');

    
    
}

function populateFilters() {
    // filter de aerolíneas
    const aerolineaFilter = document.getElementById('aerolineaFilter');
    aerolineaFilter.innerHTML = '<option value="">Todas las aerolíneas</option>' +
        aerolineasData.map(aerolinea => 
            `<option value="${aerolinea.idAerolinea}">${aerolinea.nombre}</option>`
        ).join('');
}

function filterAviones() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const aerolineaFilter = document.getElementById('aerolineaFilter').value;
    const estadoFilter = document.getElementById('estadoFilter').value;

    let filtered = avionesData;

    // filtro por terminos
    if (searchTerm) {
        filtered = filtered.filter(avion => 
            (avion.nombre && avion.nombre.toLowerCase().includes(searchTerm)) ||
            (avion.matricula && avion.matricula.toLowerCase().includes(searchTerm))
        );
    }

    // filtro por aerolínea
    if (aerolineaFilter) {
        filtered = filtered.filter(avion => avion.idAerolinea === parseInt(aerolineaFilter));
    }

    // filtro por estado
    if (estadoFilter !== '') {
        const isActive = estadoFilter === 'true';
        filtered = filtered.filter(avion => avion.estado === isActive);
    }

    displayAviones(filtered);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('aerolineaFilter').value = '';
    document.getElementById('estadoFilter').value = '';
    displayAviones(avionesData);
}

function openModal() {
    currentEditingId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-airplane me-2"></i>Nuevo Avión';
    document.getElementById('avionForm').reset();
    document.getElementById('estado').checked = true;
}

async function editAvion(id) {
    try {
        const avion = avionesData.find(a => a.idAvion === id);
        if (!avion) {
            showAlert('Avión no encontrado', 'warning');
            return;
        }

        currentEditingId = id;
        document.getElementById('modalTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Avión';
        
        // llenar con los datos
        document.getElementById('nombre').value = avion.nombre || '';
        document.getElementById('modelo').value = avion.modelo || '';
        document.getElementById('matricula').value = avion.matricula || '';
        document.getElementById('capacidad').value = avion.capacidad || '';
        document.getElementById('anioFabricacion').value = avion.anioFabricacion || '';
        document.getElementById('idAerolinea').value = avion.idAerolinea || '';
        document.getElementById('estado').checked = avion.estado || false;

        // mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('avionModal'));
        modal.show();
    } catch (error) {
        console.error('Error editing avión:', error);
        showAlert('Error al cargar el avión para editar', 'danger');
    }
}

async function viewAvion(id) {
    try {
        const avion = avionesData.find(a => a.idAvion === id);
        if (!avion) {
            showAlert('Avión no encontrado', 'warning');
            return;
        }

        const aerolinea = aerolineasData.find(a => a.idAerolinea === avion.idAerolinea);
        const propietario = propietariosData.find(p => p.idPropietario === avion.idPropietario);
        const antiguedad = new Date().getFullYear() - (avion.anioFabricacion || 0);

        // crear contenido del modal de detalles
        const modalBody = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información General</h6>
                    <p><strong>ID:</strong> ${avion.idAvion}</p>
                    <p><strong>Nombre:</strong> ${avion.nombre || 'N/A'}</p>
                    <p><strong>Modelo:</strong> ${avion.modelo || 'N/A'}</p>
                    <p><strong>Matrícula:</strong> <code>${avion.matricula || 'N/A'}</code></p>
                    <p><strong>Capacidad:</strong> ${avion.capacidad || 0} pasajeros</p>
                    <p><strong>Año Fabricación:</strong> ${avion.anioFabricacion || 'N/A'} (${antiguedad} años de antigüedad)</p>
                    <p><strong>Estado:</strong> ${formatEstado(avion.estado)}</p>
                </div>
                <div class="col-md-6">
                    <h6>Información de Asociación</h6>
                    <p><strong>Aerolínea:</strong> 
                        ${aerolinea ? 
                            `<span class="badge bg-primary">${aerolinea.nombre}</span>` : 
                            '<span class="text-muted">Sin aerolínea</span>'
                        }
                    </p>
                    <p><strong>Propietario:</strong> 
                        ${propietario ? 
                            `<span class="badge bg-secondary">${propietario.nombre}</span>` : 
                            '<span class="text-muted">Sin propietario</span>'
                        }
                    </p>
                    ${aerolinea ? `
                        <div class="mt-3">
                            <h7>Datos de Aerolínea:</h7>
                            <p class="text-muted small">
                                <i class="bi bi-telephone me-1"></i> ${aerolinea.telefono || 'N/A'}<br>
                                <i class="bi bi-geo-alt me-1"></i> ${aerolinea.pais || 'N/A'}
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // mostrar detalles en modal
        const modalHtml = `
            <div class="modal fade" id="detailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-eye me-2"></i>
                                Detalles del Avión
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${modalBody}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="editAvion(${id}); bootstrap.Modal.getInstance(document.getElementById('detailsModal')).hide();">
                                <i class="bi bi-pencil me-2"></i>
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // remover modal de detalles existente si existe
        const existingModal = document.getElementById('detailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // agregar modal al body y mostrar
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
        modal.show();

    } catch (error) {
        console.error('Error viewing avión:', error);
        showAlert('Error al mostrar los detalles del avión', 'danger');
    }
}

async function saveAvion() {
    try {
        const formData = {
            nombre: document.getElementById('nombre').value.trim(),
            modelo: document.getElementById('modelo').value.trim(),
            matricula: document.getElementById('matricula').value.trim(),
            capacidad: parseInt(document.getElementById('capacidad').value),
            anioFabricacion: parseInt(document.getElementById('anioFabricacion').value),
            idAerolinea: parseInt(document.getElementById('idAerolinea').value),
            idPropietario: currentEditingId 
            ? (avionesData.find(a => a.idAvion === currentEditingId)?.idPropietario || 1)
            : 1, // propietario por defecto al crear
            estado: document.getElementById('estado').checked
        };

        // validación
        if (!formData.nombre || !formData.modelo || !formData.matricula || 
            !formData.capacidad || !formData.anioFabricacion || 
            !formData.idAerolinea) {
            showAlert('Por favor complete todos los campos obligatorios', 'warning');
            return;
        }

        // validación de año
        const currentYear = new Date().getFullYear();
        if (formData.anioFabricacion < 1900 || formData.anioFabricacion > currentYear) {
            showAlert(`El año de fabricación debe estar entre 1900 y ${currentYear}`, 'warning');
            return;
        }

        // validación de capacidad
        if (formData.capacidad < 1) {
            showAlert('La capacidad debe ser mayor a 0', 'warning');
            return;
        }

        // validación de matrícula duplicada (solo para nuevos registros)
        if (!currentEditingId) {
            const duplicate = avionesData.find(a => 
                a.matricula === formData.matricula
            );
            if (duplicate) {
                showAlert('Ya existe un avión con esa matrícula', 'warning');
                return;
            }
        }

        // guardar
        let result;
        if (currentEditingId) {
            result = await api.updateAvion(currentEditingId, formData);
            showAlert('Avión actualizado exitosamente', 'success');
        } else {
            result = await api.createAvion(formData);
            showAlert('Avión creado exitosamente', 'success');
        }

        // cerrar modal y recargar datos
        const modal = bootstrap.Modal.getInstance(document.getElementById('avionModal'));
        modal.hide();
        
        await loadInitialData();

    } catch (error) {
        console.error('Error saving avión:', error);
        showAlert('Error al guardar el avión', 'danger');
    }
}

async function deleteAvion(id) {
    try {
        const avion = avionesData.find(a => a.idAvion === id);
        if (!avion) {
            showAlert('Avión no encontrado', 'warning');
            return;
        }

        // confirmar eliminación
        if (!confirm(`¿Está seguro que desea eliminar el avión "${avion.nombre}" con matrícula "${avion.matricula}"?`)) {
            return;
        }

        await api.deleteAvion(id);
        showAlert('Avión eliminado exitosamente', 'success');
        await loadInitialData();

    } catch (error) {
        console.error('Error deleting avión:', error);
        showAlert('Error al eliminar el avión', 'danger');
    }
}

function showLoading() {
    const tbody = document.getElementById('avionesTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="10" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando aviones...</p>
            </td>
        </tr>
    `;
}

function hideLoading() {
    // el loading se oculta cuando se muestran los datos
}

function showErrorState() {
    const tbody = document.getElementById('avionesTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="10" class="text-center text-danger py-4">
                <i class="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
                Error al cargar los datos
                <br>
                <button class="btn btn-sm btn-outline-primary mt-2" onclick="loadInitialData()">
                    <i class="bi bi-arrow-clockwise me-1"></i>
                    Reintentar
                </button>
            </td>
        </tr>
    `;
}

