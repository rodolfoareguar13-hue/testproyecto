
class AerolineasAPI {
    constructor() {
        this.baseURL =  this.baseURL = 'https://proyectotopicosgrupo1-ercvb7cfetc0dwc2.eastus-01.azurewebsites.net/api'; // Cambiar si el backend está en otra URL HAY QUE CAMBIARLO PARA EL AZURE, PERO PARA PRUEBAS LO DEJO ASÍ
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Aerolíneas 
    async getAerolineas() {
        return await this.request('/Aerolinea/ObtenerTodos');
    }

    async getAerolinea(id) {
        return await this.request(`/Aerolinea/ObtenerPorId/${id}`);
    }

    async createAerolinea(data) {
        return await this.request('/Aerolinea/Crear', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateAerolinea(id, data) {
        return await this.request(`/Aerolinea/Actualizar/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async filtrarAerolinea(filtro) {
        return await this.request('/Aerolinea/filtro', {
            method: 'POST',
            body: JSON.stringify(filtro)
        });
    }

    // Aviones 
    async getAviones() {
        return await this.request('/Avion/ObtenerTodos');
    }

    async getAvion(id) {
        return await this.request(`/Avion/ObtenerPorId/${id}`);
    }

    async createAvion(data) {
        return await this.request('/Avion/Crear', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateAvion(id, data) {
        return await this.request(`/Avion/Actualizar/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async filtrarAvion(filtro) {
        return await this.request('/Avion/filtro', {
            method: 'POST',
            body: JSON.stringify(filtro)
        });
    }

    // Propietarios 
    async getPropietarios(filtro = {}) {
        return await this.request('/Propietarios/ObtenerAvionesPorPropietario', {
            method: 'POST',
            body: JSON.stringify(filtro)
        });
    }

    async getAllPropietarios() {
        return await this.request('/Propietarios/ObtenerTodos');
    }

    async updatePropietario(id, data) {
        return await this.request(`/Propietarios/ActualizarPropietarioDelAvion/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
}

// nuevo funcion de estado y la de las alertas
function formatEstado(estado) {
    return estado ? 
        '<span class="badge bg-success">Activo</span>' : 
        '<span class="badge bg-danger">Inactivo</span>';
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        setTimeout(() => {
            if (alertDiv.parentNode) alertDiv.remove();
        }, 5000);
    }
}
const api = new AerolineasAPI();
