// ===== ESTRUCTURAS DE DATOS =====

// Agentes predefinidos
const predefinedAgents = [
    { id: 'agent1', name: 'Ana García', email: 'ana@soporte.com', active: true },
    { id: 'agent2', name: 'Carlos López', email: 'carlos@soporte.com', active: true },
    { id: 'agent3', name: 'María Rodríguez', email: 'maria@soporte.com', active: true }
];

// Cargar datos existentes o inicializar
let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
let clients = JSON.parse(localStorage.getItem('clients')) || [];
let agents = JSON.parse(localStorage.getItem('agents')) || predefinedAgents;

// Guardar datos iniciales si no existen
if (!localStorage.getItem('agents')) {
    localStorage.setItem('agents', JSON.stringify(agents));
}

// ===== FUNCIONES DE GESTIÓN DE DATOS =====

function saveTickets() {
    localStorage.setItem('tickets', JSON.stringify(tickets));
}

function saveClients() {
    localStorage.setItem('clients', JSON.stringify(clients));
}

function getAllTickets() {
    return tickets;
}

function getTicketById(ticketId) {
    return tickets.find(ticket => ticket.id === ticketId);
}

function getClientTickets(clientEmail) {
    return tickets.filter(ticket => ticket.clientEmail === clientEmail);
}

function getAgentTickets(agentId) {
    return tickets.filter(ticket => ticket.agentId === agentId);
}

// ===== FUNCIONES DE CLIENTES =====

function registerClient(name, email, phone) {
    const existingClient = clients.find(client => client.email === email);
    if (existingClient) {
        return { success: false, message: 'Este correo ya está registrado' };
    }

    const newClient = {
        id: Date.now(),
        name,
        email,
        phone,
        registrationDate: new Date().toISOString()
    };

    clients.push(newClient);
    saveClients();
    return { success: true, client: newClient };
}

function loginClient(email) {
    const client = clients.find(client => client.email === email);
    if (client) {
        return { success: true, client };
    }
    return { success: false, message: 'Cliente no encontrado' };
}

// ===== FUNCIONES DE TICKETS =====

function createClientTicket(subject, description, priority, clientEmail, clientName) {
    const newTicket = {
        id: Date.now(),
        subject,
        description,
        status: 'open',
        priority,
        clientEmail,
        clientName,
        createdAt: new Date().toISOString(),
        agentId: null, // Será asignado posteriormente por un agente
        updates: [] // Historial de actualizaciones
    };

    tickets.unshift(newTicket);
    saveTickets();
    return newTicket;
}

function assignAgentToTicket(ticketId, agentId) {
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex !== -1) {
        const agent = agents.find(a => a.id === agentId);
        tickets[ticketIndex].agentId = agentId;
        tickets[ticketIndex].agentName = agent ? agent.name : 'Sin asignar';
        
        // Agregar al historial
        if (!tickets[ticketIndex].updates) {
            tickets[ticketIndex].updates = [];
        }
        tickets[ticketIndex].updates.push({
            type: 'assignment',
            message: `Ticket asignado a ${agent ? agent.name : 'agente'}`,
            timestamp: new Date().toISOString()
        });
        
        saveTickets();
        return true;
    }
    return false;
}

function changeTicketStatus(ticketId, newStatus) {
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex !== -1) {
        tickets[ticketIndex].status = newStatus;
        
        // Agregar al historial
        if (!tickets[ticketIndex].updates) {
            tickets[ticketIndex].updates = [];
        }
        tickets[ticketIndex].updates.push({
            type: 'status_change',
            message: `Estado cambiado a ${getStatusText(newStatus)}`,
            timestamp: new Date().toISOString()
        });
        
        saveTickets();
        return true;
    }
    return false;
}

// ===== MÉTRICAS Y REPORTES =====

function getAgentMetrics() {
    const metrics = {};
    
    agents.forEach(agent => {
        const agentTickets = tickets.filter(ticket => ticket.agentId === agent.id);
        metrics[agent.id] = {
            name: agent.name,
            total: agentTickets.length,
            open: agentTickets.filter(t => t.status === 'open').length,
            progress: agentTickets.filter(t => t.status === 'progress').length,
            resolved: agentTickets.filter(t => t.status === 'resolved').length
        };
    });

    // Tickets sin asignar
    const unassignedTickets = tickets.filter(t => !t.agentId);
    metrics.unassigned = {
        name: 'Sin asignar',
        total: unassignedTickets.length,
        open: unassignedTickets.filter(t => t.status === 'open').length,
        progress: unassignedTickets.filter(t => t.status === 'progress').length,
        resolved: unassignedTickets.filter(t => t.status === 'resolved').length
    };

    return metrics;
}

function getClientMetrics(clientEmail) {
    const clientTickets = getClientTickets(clientEmail);
    return {
        total: clientTickets.length,
        open: clientTickets.filter(t => t.status === 'open').length,
        progress: clientTickets.filter(t => t.status === 'progress').length,
        resolved: clientTickets.filter(t => t.status === 'resolved').length
    };
}

// ===== FUNCIONES DE UI/UX =====

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    
    const backgroundColor = {
        'success': '#27ae60',
        'error': '#e74c3c',
        'warning': '#f39c12',
        'info': '#3498db'
    }[type] || '#3498db';
    
    notification.style.backgroundColor = backgroundColor;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ===== INICIALIZACIÓN DE MÓDULOS =====

function initializeAgentDashboard() {
    renderAllTickets();
    updateAgentMetrics();
    loadAgentFilters();
}

function initializeClientPortal() {
    // Verificar si ya hay un cliente logueado
    const savedClient = localStorage.getItem('currentClient');
    if (savedClient) {
        showClientDashboard(JSON.parse(savedClient));
    }
    
    setupClientForms();
}

function setupClientForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const ticketForm = document.getElementById('client-ticket-form');

    if (loginForm) {
        loginForm.addEventListener('submit', handleClientLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleClientRegistration);
    }

    if (ticketForm) {
        ticketForm.addEventListener('submit', handleClientTicketSubmit);
    }
}

// ===== MANEJADORES DE EVENTOS =====

function handleClientLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    
    const result = loginClient(email);
    if (result.success) {
        showClientDashboard(result.client);
        showNotification('Bienvenido de nuevo', 'success');
    } else {
        showNotification(result.message, 'error');
    }
}

function handleClientRegistration(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    
    const result = registerClient(name, email, phone);
    if (result.success) {
        showClientDashboard(result.client);
        showNotification('Cuenta creada exitosamente', 'success');
    } else {
        showNotification(result.message, 'error');
    }
}

function handleClientTicketSubmit(e) {
    e.preventDefault();
    
    if (!currentClient) {
        showNotification('Debes iniciar sesión primero', 'error');
        return;
    }
    
    const subject = document.getElementById('client-ticket-subject').value;
    const description = document.getElementById('client-ticket-description').value;
    const priority = document.getElementById('client-ticket-priority').value;
    
    createClientTicket(subject, description, priority, currentClient.email, currentClient.name);
    
    showNotification('Ticket creado exitosamente', 'success');
    hideNewTicketForm();
    renderClientTickets();
    updateClientMetrics();
}

// ===== RENDERIZADO DE UI =====

function showClientDashboard(client) {
    currentClient = client;
    localStorage.setItem('currentClient', JSON.stringify(client));
    
    document.getElementById('client-auth-section').style.display = 'none';
    document.getElementById('client-dashboard').style.display = 'block';
    document.getElementById('client-name').textContent = client.name;
    
    renderClientTickets();
    updateClientMetrics();
}

function renderAllTickets() {
    const ticketsList = document.getElementById('all-tickets-list');
    if (!ticketsList) return;
    
    ticketsList.innerHTML = '';
    
    if (tickets.length === 0) {
        ticketsList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No hay tickets en el sistema.</p>';
        return;
    }
    
    tickets.forEach(ticket => {
        const ticketElement = createAgentTicketElement(ticket);
        ticketsList.appendChild(ticketElement);
    });
}

function renderClientTickets() {
    if (!currentClient) return;
    
    const ticketsList = document.getElementById('client-tickets-list');
    if (!ticketsList) return;
    
    const clientTickets = getClientTickets(currentClient.email);
    ticketsList.innerHTML = '';
    
    if (clientTickets.length === 0) {
        ticketsList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No tienes tickets aún.</p>';
        return;
    }
    
    clientTickets.forEach(ticket => {
        const ticketElement = createClientTicketElement(ticket);
        ticketsList.appendChild(ticketElement);
    });
}

function createAgentTicketElement(ticket) {
    const ticketDiv = document.createElement('div');
    ticketDiv.className = 'ticket-item';
    ticketDiv.innerHTML = `
        <div class="ticket-header">
            <div>
                <div class="ticket-subject">${escapeHtml(ticket.subject)}</div>
                <div class="ticket-client">Cliente: ${escapeHtml(ticket.clientName || 'N/A')}</div>
                <div class="ticket-priority ${'priority-' + ticket.priority}">
                    Prioridad: ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </div>
            </div>
            <div class="ticket-agent-info">
                <span class="ticket-status status-${ticket.status}">
                    ${getStatusText(ticket.status)}
                </span>
                <div class="ticket-agent">
                    Agente: ${ticket.agentName || 'Sin asignar'}
                </div>
                <button onclick="openAssignModal(${ticket.id})" class="btn-secondary btn-small">
                    Asignar
                </button>
            </div>
        </div>
        <p>${escapeHtml(ticket.description)}</p>
        <div class="ticket-actions">
            <button onclick="changeTicketStatus(${ticket.id}, 'progress')" class="btn-secondary">
                En Progreso
            </button>
            <button onclick="changeTicketStatus(${ticket.id}, 'resolved')" class="btn-secondary">
                Resolver
            </button>
        </div>
    `;
    return ticketDiv;
}

function createClientTicketElement(ticket) {
    const ticketDiv = document.createElement('div');
    ticketDiv.className = 'ticket-item';
    ticketDiv.innerHTML = `
        <div class="ticket-header">
            <div>
                <div class="ticket-subject">${escapeHtml(ticket.subject)}</div>
                <div class="ticket-priority ${'priority-' + ticket.priority}">
                    Prioridad: ${ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </div>
            </div>
            <div class="ticket-agent-info">
                <span class="ticket-status status-${ticket.status}">
                    ${getStatusText(ticket.status)}
                </span>
                <div class="ticket-agent">
                    Agente: ${ticket.agentName || 'En espera de asignación'}
                </div>
            </div>
        </div>
        <p>${escapeHtml(ticket.description)}</p>
        <div class="ticket-meta">
            <small>Creado: ${new Date(ticket.createdAt).toLocaleDateString()}</small>
        </div>
    `;
    return ticketDiv;
}

function updateAgentMetrics() {
    const metrics = getAgentMetrics();
    const statsContainer = document.getElementById('agents-stats');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = '';
    
    Object.keys(metrics).forEach(agentId => {
        const metric = metrics[agentId];
        const metricElement = document.createElement('div');
        metricElement.className = 'agent-metric-card';
        metricElement.innerHTML = `
            <h4>${metric.name}</h4>
            <div class="metric-numbers">
                <span class="metric-total">Total: ${metric.total}</span>
                <span class="metric-open">Abiertos: ${metric.open}</span>
                <span class="metric-progress">En Progreso: ${metric.progress}</span>
                <span class="metric-resolved">Resueltos: ${metric.resolved}</span>
            </div>
        `;
        statsContainer.appendChild(metricElement);
    });
}

function updateClientMetrics() {
    if (!currentClient) return;
    
    const metrics = getClientMetrics(currentClient.email);
    document.getElementById('client-open-tickets').textContent = metrics.open;
    document.getElementById('client-progress-tickets').textContent = metrics.progress;
    document.getElementById('client-resolved-tickets').textContent = metrics.resolved;
}

function loadAgentFilters() {
    const agentFilter = document.getElementById('agent-filter');
    const agentSelect = document.getElementById('agent-select');
    
    if (agentFilter) {
        agents.forEach(agent => {
            const option = document.createElement('option');
            option.value = agent.id;
            option.textContent = agent.name;
            agentFilter.appendChild(option);
        });
    }
    
    if (agentSelect) {
        agents.forEach(agent => {
            const option = document.createElement('option');
            option.value = agent.id;
            option.textContent = agent.name;
            agentSelect.appendChild(option);
        });
    }
}

function loadAgentsForAssignment() {
    const agentSelect = document.getElementById('agent-select');
    agentSelect.innerHTML = '<option value="">Seleccionar agente</option>';
    
    agents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = agent.name;
        agentSelect.appendChild(option);
    });
}

// ===== UTILIDADES =====

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getStatusText(status) {
    const statusMap = {
        'open': 'Abierto',
        'progress': 'En Progreso',
        'resolved': 'Resuelto'
    };
    return statusMap[status] || status;
}

function convertTicketsToCSV(tickets) {
    const headers = ['ID', 'Asunto', 'Cliente', 'Agente', 'Estado', 'Prioridad', 'Fecha Creación'];
    const rows = tickets.map(ticket => [
        ticket.id,
        ticket.subject,
        ticket.clientName || 'N/A',
        ticket.agentName || 'Sin asignar',
        getStatusText(ticket.status),
        ticket.priority,
        new Date(ticket.createdAt).toLocaleDateString()
    ]);
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ===== INICIALIZACIÓN GLOBAL =====

// Agregar estilos de animación para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Hacer funciones disponibles globalmente
window.openAssignModal = openAssignModal;
window.closeAssignModal = closeAssignModal;
window.assignTicketToAgent = assignTicketToAgent;
window.changeTicketStatus = changeTicketStatus;
window.exportTickets = exportTickets;
