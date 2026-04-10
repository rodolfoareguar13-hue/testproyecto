// Dashboard.js - Maneja la lógica para cargar y mostrar los datos en el dashboard
document.addEventListener('DOMContentLoaded', async function() {
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Cargar estadísticas
        await Promise.all([
            loadAerolineasCount(),
            loadAvionesCount(),
            loadAvionesActivosCount(),
            loadSystemStats()
        ]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Error al cargar los datos del dashboard', 'danger');
    }
}

async function loadAerolineasCount() {
    try {
        const aerolineas = await api.getAerolineas();
        const count = aerolineas.length || 0;
        document.getElementById('totalAerolineas').textContent = count;
    } catch (error) {
        document.getElementById('totalAerolineas').textContent = '?';
    }
}

async function loadAvionesCount() {
    try {
        const aviones = await api.getAviones();
        const count = aviones.length || 0;
        document.getElementById('totalAviones').textContent = count;
    } catch (error) {
        document.getElementById('totalAviones').textContent = '?';
    }
}

async function loadAvionesActivosCount() {
    try {
        const aviones = await api.getAviones();
        const count = aviones.filter(avion => avion.estado === true).length || 0;
        document.getElementById('avionesActivos').textContent = count;
    } catch (error) {
        document.getElementById('avionesActivos').textContent = '?';
    }
}

async function loadPropietariosCount() {
    try {
        const propietarios = await api.getPropietarios();
        const count = propietarios.length || 0;
        document.getElementById('totalPropietarios').textContent = count;
    } catch (error) {
        document.getElementById('totalPropietarios').textContent = '?';
    }
}

async function loadRecentActivity() {
    const activityContainer = document.getElementById('recentActivity');
    
    try {
        // obtener datos de los endpoints de aerolineas, aviones y propietarios
        const [aerolineas, aviones, propietarios] = await Promise.all([
            api.getAerolineas(),
            api.getAviones(),
            api.getPropietarios()
        ]);

        // combinar y formatear los datos para mostrar en la sección de actividad reciente
        const activities = [];
        
        // Add aerolíneas
        aerolineas.slice(0, 3).forEach(aerolinea => {
            activities.push({
                type: 'aerolinea',
                icon: 'bi-building',
                color: 'primary',
                title: `Aerolínea: ${aerolinea.nombre}`,
                description: `ID: ${aerolinea.idAerolinea} - ${aerolinea.pais}`,
                status: aerolinea.estado
            });
        });

        // agregar aviones
        aviones.slice(0, 3).forEach(avion => {
            activities.push({
                type: 'avion',
                icon: 'bi-airplane',
                color: 'success',
                title: `Avión: ${avion.nombre}`,
                description: `Matrícula: ${avion.matricula} - Capacidad: ${avion.capacidad}`,
                status: avion.estado
            });
        });

        // agregar propietarios
        propietarios.slice(0, 3).forEach(propietario => {
            activities.push({
                type: 'propietario',
                icon: 'bi-person-fill',
                color: 'info',
                title: `Propietario: ${propietario.nombre}`,
                description: `ID: ${propietario.idPropietario}`,
                status: propietario.estado
            });
        });

        // mezclar aleatoriamente las actividades para mostrar una variedad cada vez que se carga el dashboard
        activities.sort(() => Math.random() - 0.5);
        displayRecentActivity(activities.slice(0, 5));

    } catch (error) {
        console.error('Error loading recent activity:', error);
        activityContainer.innerHTML = `
            <div class="list-group-item text-center text-muted">
                <i class="bi bi-exclamation-triangle me-2"></i>
                No se pudo cargar la actividad reciente
            </div>
        `;
    }
}

function displayRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="list-group-item text-center text-muted">
                <i class="bi bi-inbox me-2"></i>
                No hay actividad reciente
            </div>
        `;
        return;
    }

    container.innerHTML = activities.map(activity => `
        <div class="list-group-item">
            <div class="d-flex align-items-center">
                <div class="me-3">
                    <i class="bi ${activity.icon} text-${activity.color} fs-4"></i>
                </div>
                <div class="flex-grow-1">
                    <h6 class="mb-1">${activity.title}</h6>
                    <p class="mb-1 text-muted small">${activity.description}</p>
                    <div class="d-flex align-items-center">
                        ${formatEstado(activity.status)}
                        <small class="text-muted ms-2">
                            <i class="bi bi-clock me-1"></i>
                            Recientemente
                        </small>
                    </div>
                </div>
                <div>
                    <a href="pages/${activity.type}s.html" class="btn btn-sm btn-outline-primary">
                        Ver
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

async function loadSystemStats() {
    try {
        const [aerolineas, aviones] = await Promise.all([
            api.getAerolineas(),
            api.getAviones()
        ]);

        // Estadísticas por país
        loadPaisesStats(aerolineas);
        
        // Capacidad total de aviones
        loadCapacidadStats(aviones);
        
        // Aerolíneas activas vs inactivas
        loadEstadoAerolineas(aerolineas);
        
        // Promedio de antigüedad de aviones
        loadAntiguedadStats(aviones);

    } catch (error) {
        console.error('Error loading system stats:', error);
        // Mostrar error en todas las secciones de estadísticas
        document.getElementById('paisesStats').innerHTML = '<div class="text-danger">Error al cargar datos</div>';
        document.getElementById('capacidadStats').innerHTML = '<div class="text-danger">Error al cargar datos</div>';
        document.getElementById('estadoAerolineas').innerHTML = '<div class="text-danger">Error al cargar datos</div>';
        document.getElementById('antiguedadStats').innerHTML = '<div class="text-danger">Error al cargar datos</div>';
    }
}

function loadPaisesStats(aerolineas) {
    const paisesCount = {};
    aerolineas.forEach(aerolinea => {
        const pais = aerolinea.pais || 'Sin país';
        paisesCount[pais] = (paisesCount[pais] || 0) + 1;
    });

    const totalAerolineas = aerolineas.length;
    const statsHtml = Object.entries(paisesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pais, count]) => {
            const percentage = ((count / totalAerolineas) * 100).toFixed(1);
            return `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span>${pais}</span>
                    <div class="d-flex align-items-center">
                        <div class="progress me-2" style="width: 100px; height: 8px;">
                            <div class="progress-bar bg-primary" style="width: ${percentage}%"></div>
                        </div>
                        <small class="text-muted">${count} (${percentage}%)</small>
                    </div>
                </div>
            `;
        }).join('');

    document.getElementById('paisesStats').innerHTML = statsHtml || '<div class="text-muted">No hay datos disponibles</div>';
}

function loadCapacidadStats(aviones) {
    const capacidadTotal = aviones.reduce((total, avion) => total + (avion.capacidad || 0), 0);
    const capacidadPromedio = aviones.length > 0 ? Math.round(capacidadTotal / aviones.length) : 0;

    const statsHtml = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span>Capacidad Total</span>
            <span class="badge bg-primary">${capacidadTotal.toLocaleString()} pasajeros</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <span>Promedio por Avión</span>
            <span class="badge bg-info">${capacidadPromedio.toLocaleString()} pasajeros</span>
        </div>
    `;

    document.getElementById('capacidadStats').innerHTML = statsHtml;
}

function loadEstadoAerolineas(aerolineas) {
    const activas = aerolineas.filter(a => a.estado === true).length;
    const inactivas = aerolineas.filter(a => a.estado === false).length;
    const total = aerolineas.length;

    const activasPercentage = total > 0 ? ((activas / total) * 100).toFixed(1) : 0;
    const inactivasPercentage = total > 0 ? ((inactivas / total) * 100).toFixed(1) : 0;

    const statsHtml = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span> Activas</span>
            <div class="d-flex align-items-center">
                <div class="progress me-2" style="width: 100px; height: 8px;">
                    <div class="progress-bar bg-success" style="width: ${activasPercentage}%"></div>
                </div>
                <small class="text-muted">${activas} (${activasPercentage}%)</small>
            </div>
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <span> Inactivas</span>
            <div class="d-flex align-items-center">
                <div class="progress me-2" style="width: 100px; height: 8px;">
                    <div class="progress-bar bg-danger" style="width: ${inactivasPercentage}%"></div>
                </div>
                <small class="text-muted">${inactivas} (${inactivasPercentage}%)</small>
            </div>
        </div>
    `;

    document.getElementById('estadoAerolineas').innerHTML = statsHtml;
}

function loadAntiguedadStats(aviones) {
    const añoActual = new Date().getFullYear();
    const antiguedades = aviones.map(avion => añoActual - (avion.anioFabricacion || 0));
    
    if (antiguedades.length === 0) {
        document.getElementById('antiguedadStats').innerHTML = '<div class="text-muted">No hay datos disponibles</div>';
        return;
    }

    const antiguedadPromedio = Math.round(antiguedades.reduce((a, b) => a + b, 0) / antiguedades.length);
    const masNuevo = Math.min(...antiguedades);
    const masAntiguo = Math.max(...antiguedades);

    const statsHtml = `
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span>Promedio</span>
            <span class="badge bg-info">${antiguedadPromedio} años</span>
        </div>
        <div class="d-flex justify-content-between align-items-center mb-2">
            <span>Más nuevo</span>
            <span class="badge bg-success">${masNuevo} años</span>
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <span>Más antiguo</span>
            <span class="badge bg-warning">${masAntiguo} años</span>
        </div>
    `;

    document.getElementById('antiguedadStats').innerHTML = statsHtml;
}

// hacer un refresh cada 30 segundos para mantener los datos actualizados sin necesidad de recargar la página
setInterval(loadDashboardData, 30000);
