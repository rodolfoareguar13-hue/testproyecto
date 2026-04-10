// Aerolineas.js  Maneja la lógica para el CRUD de aerolíneas
let aerolineasData = [];
let currentEditingId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadAerolineas();
    setupEventListeners();
});

function setupEventListeners() {
    // Buscador tiempo real
    document.getElementById('searchInput').addEventListener('input', filterAerolineas);
    
    // Filtrar por estado
    document.getElementById('estadoFilter').addEventListener('change', filterAerolineas);
    
    // Form de aerolínea
    document.getElementById('aerolineaForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveAerolinea();
    });
}

async function loadAerolineas() {
    try {
        showLoading();
        aerolineasData = await api.getAerolineas();
        displayAerolineas(aerolineasData);
        updateStatistics();
    } catch (error) {
        console.error('Error loading aerolíneas:', error);
        showAlert('Error al cargar las aerolíneas', 'danger');
        showErrorState();
    } finally {
        hideLoading();
    }
}

function displayAerolineas(aerolineas) {
    const tbody = document.getElementById('aerolineasTableBody');
    
    if (!aerolineas || aerolineas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No hay aerolíneas registradas
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = aerolineas.map(aerolinea => `
        <tr>
            <td>${aerolinea.idAerolinea}</td>
            <td>${aerolinea.identificacion || 'N/A'}</td>
            <td>
                <strong>${aerolinea.nombre || 'Sin nombre'}</strong>
            </td>
            <td>${aerolinea.telefono || 'N/A'}</td>
            <td>${aerolinea.pais || 'N/A'}</td>
            <td>${formatEstado(aerolinea.estado)}</td>
            
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary" onclick="editAerolinea(${aerolinea.idAerolinea})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="viewAerolinea(${aerolinea.idAerolinea})" title="Ver detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    
                </div>
            </td>
        </tr>
    `).join('');
}

function updateStatistics() {
    const total = aerolineasData.length;
    const activas = aerolineasData.filter(a => a.estado === true).length;
    const inactivas = aerolineasData.filter(a => a.estado === false).length;

    document.getElementById('totalAerolineas').textContent = total;
    document.getElementById('aerolineasActivas').textContent = activas;
    document.getElementById('aerolineasInactivas').textContent = inactivas;
}

function filterAerolineas() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const estadoFilter = document.getElementById('estadoFilter').value;

    let filtered = aerolineasData;

    // Filtrar por término de búsqueda
    if (searchTerm) {
        filtered = filtered.filter(aerolinea => 
            (aerolinea.nombre && aerolinea.nombre.toLowerCase().includes(searchTerm)) ||
            (aerolinea.identificacion && aerolinea.identificacion.toLowerCase().includes(searchTerm))
        );
    }

    // Filtrar por estado
    if (estadoFilter !== '') {
        const isActive = estadoFilter === 'true';
        filtered = filtered.filter(aerolinea => aerolinea.estado === isActive);
    }

    displayAerolineas(filtered);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('estadoFilter').value = '';
    displayAerolineas(aerolineasData);
}

function openModal() {
    currentEditingId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="bi bi-building me-2"></i>Nueva Aerolínea';
    document.getElementById('aerolineaForm').reset();
    document.getElementById('estado').checked = true;
}

async function editAerolinea(id) {
    try {
        const aerolinea = aerolineasData.find(a => a.idAerolinea === id);
        if (!aerolinea) {
            showAlert('Aerolínea no encontrada', 'warning');
            return;
        }

        currentEditingId = id;
        document.getElementById('modalTitle').innerHTML = '<i class="bi bi-pencil me-2"></i>Editar Aerolínea';
        
        // Rellenar formulario con datos
        document.getElementById('identificacion').value = aerolinea.identificacion || '';
        document.getElementById('nombre').value = aerolinea.nombre || '';
        document.getElementById('telefono').value = aerolinea.telefono || '';
        document.getElementById('pais').value = aerolinea.pais || '';
        document.getElementById('estado').checked = aerolinea.estado || false;

        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('aerolineaModal'));
        modal.show();
    } catch (error) {
        console.error('Error editing aerolínea:', error);
        showAlert('Error al cargar la aerolínea para editar', 'danger');
    }
}

async function viewAerolinea(id) {
    try {
        const aerolinea = aerolineasData.find(a => a.idAerolinea === id);
        if (!aerolinea) {
            showAlert('Aerolínea no encontrada', 'warning');
            return;
        }

        // Crear contenido del modal de detalles
        const modalBody = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Información General</h6>
                    <p><strong>ID:</strong> ${aerolinea.idAerolinea}</p>
                    <p><strong>Identificación:</strong> ${aerolinea.identificacion || 'N/A'}</p>
                    <p><strong>Nombre:</strong> ${aerolinea.nombre || 'N/A'}</p>
                    <p><strong>Teléfono:</strong> ${aerolinea.telefono || 'N/A'}</p>
                    <p><strong>País:</strong> ${aerolinea.pais || 'N/A'}</p>
                    <p><strong>Estado:</strong> ${formatEstado(aerolinea.estado)}</p>
                </div>
                <div class="col-md-6">
                    <h6>Información de Aviones</h6>
                    <p><strong>Total de Aviones:</strong> ${aerolinea.aviones ? aerolinea.aviones.length : 0}</p>
                    ${aerolinea.aviones && aerolinea.aviones.length > 0 ? 
                        `<div class="mt-2">
                            <h7>Lista de Aviones:</h7>
                            <ul class="list-unstyled">
                                ${aerolinea.aviones.slice(0, 5).map(avion => 
                                    `<li class="mb-1">
                                        <i class="bi bi-airplane me-1"></i>
                                        ${avion.nombre} (${avion.matricula})
                                    </li>`
                                ).join('')}
                                ${aerolinea.aviones.length > 5 ? `<li class="text-muted">... y ${aerolinea.aviones.length - 5} más</li>` : ''}
                            </ul>
                        </div>` : 
                        '<p class="text-muted">No tiene aviones registrados</p>'
                    }
                </div>
            </div>
        `;

        // Mostrar detalles en modal
        const modalHtml = `
            <div class="modal fade" id="detailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-eye me-2"></i>
                                Detalles de Aerolínea
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${modalBody}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-primary" onclick="editAerolinea(${id}); bootstrap.Modal.getInstance(document.getElementById('detailsModal')).hide();">
                                <i class="bi bi-pencil me-2"></i>
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal de detalles existente si existe
        const existingModal = document.getElementById('detailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Agregar modal al body y mostrar
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
        modal.show();

    } catch (error) {
        console.error('Error viewing aerolínea:', error);
        showAlert('Error al mostrar los detalles de la aerolínea', 'danger');
    }
}

async function saveAerolinea() {
    try {
        const formData = {
            identificacion: document.getElementById('identificacion').value.trim(),
            nombre: document.getElementById('nombre').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            pais: document.getElementById('pais').value.trim(),
            estado: document.getElementById('estado').checked
        };

        // Validación
        if (!formData.identificacion || !formData.nombre || !formData.telefono || !formData.pais) {
            showAlert('Por favor complete todos los campos obligatorios', 'warning');
            return;
        }

        // Verificar duplicado de identificación (solo para nuevos registros)
        if (!currentEditingId) {
            const duplicate = aerolineasData.find(a => 
                a.identificacion === formData.identificacion
            );
            if (duplicate) {
                showAlert('Ya existe una aerolínea con esa identificación', 'warning');
                return;
            }
        }

        // Guardar
        let result;
        if (currentEditingId) {
            result = await api.updateAerolinea(currentEditingId, formData);
            showAlert('Aerolínea actualizada exitosamente', 'success');
        } else {
            result = await api.createAerolinea(formData);
            showAlert('Aerolínea creada exitosamente', 'success');
        }

        // Cerrar modal y recargar datos
        const modal = bootstrap.Modal.getInstance(document.getElementById('aerolineaModal'));
        modal.hide();
        
        await loadAerolineas();

    } catch (error) {
        console.error('Error saving aerolínea:', error);
        showAlert('Error al guardar la aerolínea', 'danger');
    }
}

async function deleteAerolinea(id) {
    try {
        const aerolinea = aerolineasData.find(a => a.idAerolinea === id);
        if (!aerolinea) {
            showAlert('Aerolínea no encontrada', 'warning');
            return;
        }

        // Verificar si tiene aviones asociados
        if (aerolinea.aviones && aerolinea.aviones.length > 0) {
            showAlert(`No se puede eliminar la aerolínea "${aerolinea.nombre}" porque tiene ${aerolinea.aviones.length} aviones asociados. Primero elimine o reasigne los aviones.`, 'warning');
            return;
        }

        // Confirmar eliminación
        if (!confirm(`¿Está seguro que desea eliminar la aerolínea "${aerolinea.nombre}"?`)) {
            return;
        }

        await api.deleteAerolinea(id);
        showAlert('Aerolínea eliminada exitosamente', 'success');
        await loadAerolineas();

    } catch (error) {
        console.error('Error deleting aerolínea:', error);
        showAlert('Error al eliminar la aerolínea', 'danger');
    }
}

function showLoading() {
    const tbody = document.getElementById('aerolineasTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando aerolíneas...</p>
            </td>
        </tr>
    `;
}

function hideLoading() {
    // El loading se oculta cuando se muestran los datos
}

function showErrorState() {
    const tbody = document.getElementById('aerolineasTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center text-danger py-4">
                <i class="bi bi-exclamation-triangle fs-1 d-block mb-2"></i>
                Error al cargar los datos
                <br>
                <button class="btn btn-sm btn-outline-primary mt-2" onclick="loadAerolineas()">
                    <i class="bi bi-arrow-clockwise me-1"></i>
                    Reintentar
                </button>
            </td>
        </tr>
    `;
}
