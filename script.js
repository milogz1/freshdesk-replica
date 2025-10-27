// ===== ESTRUCTURAS DE DATOS =====

// Agentes predefinidos - ACTUALIZADOS
const predefinedAgents = [
    { 
        id: 'agent1', 
        name: 'Jonathan Arroyave', 
        email: 'tic2@repuestossimonbolivar.com', 
        phone: '+573113878767', 
        active: true, 
        skills: 'Soporte Técnico',
        registrationDate: new Date().toISOString()
    },
    { 
        id: 'agent2', 
        name: 'Sebastian Villada', 
        email: 'tic3@repuestossimonbolivar.com', 
        phone: '+573233315933', 
        active: true, 
        skills: 'Soporte Técnico',
        registrationDate: new Date().toISOString()
    },
    { 
        id: 'agent3', 
        name: 'Katalina', 
        email: 'tic_practicante@repuestossimonbolivar.com', 
        phone: '+573045980739', 
        active: true, 
        skills: 'Practicante',
        registrationDate: new Date().toISOString()
    }
];

// Cargar datos existentes o inicializar
let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
let clients = JSON.parse(localStorage.getItem('clients')) || [];
// Forzar el uso de los agentes predefinidos actualizados
let agents = predefinedAgents;
localStorage.setItem('agents', JSON.stringify(agents));

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
        agentId: null,
        updates: []
    };

    tickets.unshift(newTicket);
    saveTickets();
    return newTicket;
}

function assignAgentToTicket(ticketId, agentId) {
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex !== -1) {
        const agent = agents.find(a => a.id === agentId);
        if (!agent) {
            showNotification('Agente no encontrado', 'error');
            return false;
        }

        tickets[ticketIndex].agentId = agentId;
        tickets[ticketIndex].agentName = agent.name;
        tickets[ticketIndex].agentEmail = agent.email;
        tickets[ticketIndex].agentPhone = agent.phone;
        
        // Agregar al historial
        if (!tickets[ticketIndex].updates) {
            tickets[ticketIndex].updates = [];
        }
        tickets[ticketIndex].updates.push({
            type: 'assignment',
            message: `Ticket asignado a ${agent.name}`,
            timestamp: new Date().toISOString(),
            agent: agent.name
        });
        
        saveTickets();
        showNotification(`Ticket asignado a ${agent.name}`, 'success');
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
        if (agent.active) {
            const agentTickets = tickets.filter(ticket => ticket.agentId === agent.id);
            metrics[agent.id] = {
                name: agent.name,
                email: agent.email,
                phone: agent.phone,
                skills: agent.skills,
                total: agentTickets.length,
                open: agentTickets.filter(t => t.status === 'open').length,
                progress: agentTickets.filter(t => t.status === 'progress').length,
                resolved: agentTickets.filter(t => t.status === 'resolved').length,
                performance: agentTickets.length > 0 ? 
                    Math.round((agentTickets.filter(t => t.status === 'resolved').length / agentTickets.length) * 100) : 0
            };
        }
    });

    // Tickets sin asignar
    const unassignedTickets = tickets.filter(t => !t.agentId);
    metrics.unassigned = {
        name: 'Sin asignar',
        total: unassignedTickets.length,
        open: unassignedTickets.filter(t => t.status === 'open').length,
        progress: unassignedTickets.filter(t => t.status === 'progress').length,
        resolved: unassignedTickets.filter(t => t.status === 'resolved').length,
        performance: 0
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
    updateAgentFilters();
    loadAgentsForAssignment();
}

function initializeClientPortal() {
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

function renderAllTickets(ticketsToRender = tickets) {
    const ticketsList = document.getElementById('all-tickets-list');
    if (!ticketsList) {
        console.error('❌ No se encontró el elemento all-tickets-list');
        return;
    }
    
    ticketsList.innerHTML = '';
    
    if (ticketsToRender.length === 0) {
        ticketsList.innerHTML = `
            <div class="no-tickets">
                <h3>📭 No se encontraron tickets</h3>
                <p>No hay tickets que coincidan con los filtros aplicados</p>
            </div>
        `;
        return;
    }
    
    ticketsToRender.forEach(ticket => {
        try {
            const ticketElement = createAgentTicketElement(ticket);
            ticketsList.appendChild(ticketElement);
        } catch (error) {
            console.error('Error al renderizar ticket:', ticket, error);
        }
    });
}

function renderClientTickets() {
    if (!currentClient) {
        console.log('No hay cliente actual');
        return;
    }
    
    const ticketsList = document.getElementById('client-tickets-list');
    if (!ticketsList) {
        console.error('No se encontró client-tickets-list');
        return;
    }
    
    tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    agents = JSON.parse(localStorage.getItem('agents')) || [];
    
    const clientTickets = tickets.filter(ticket => ticket.clientEmail === currentClient.email);
    
    ticketsList.innerHTML = '';
    
    if (clientTickets.length === 0) {
        ticketsList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No tienes tickets aún.</p>';
        return;
    }
    
    clientTickets.forEach(ticket => {
        try {
            const ticketElement = createClientTicketElement(ticket);
            ticketsList.appendChild(ticketElement);
        } catch (error) {
            console.error('Error al renderizar ticket:', ticket, error);
        }
    });
}

function createAgentTicketElement(ticket) {
    const ticketDiv = document.createElement('div');
    ticketDiv.className = 'ticket-item';
    
    const chatButton = ticket.chatMessages && ticket.chatMessages.length > 0 
        ? `<button onclick="openChatModal(${ticket.id})" class="btn-chat">
             💬 Chat (${ticket.chatMessages.length})
           </button>`
        : `<button onclick="openChatModal(${ticket.id})" class="btn-secondary">
             Iniciar Chat
           </button>`;
    
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
        
        <!-- Información de Chat -->
        <div class="ticket-chat-preview">
            ${ticket.chatMessages && ticket.chatMessages.length > 0 ? 
                `<div class="chat-summary">
                    <strong>💬 ${ticket.chatMessages.length} mensajes</strong>
                    <small>Último: ${new Date(ticket.chatMessages[ticket.chatMessages.length-1].timestamp).toLocaleDateString()}</small>
                </div>` : 
                '<div class="chat-summary">💬 Sin mensajes aún</div>'
            }
            ${chatButton}
        </div>
        
        <div class="ticket-actions">
            <button onclick="changeTicketStatus(${ticket.id}, 'progress')" class="btn-secondary">
                En Progreso
            </button>
            <button onclick="openChatModal(${ticket.id})" class="btn-primary">
                Gestionar Chat
            </button>
        </div>
    `;
    return ticketDiv;
}

function createClientTicketElement(ticket) {
    const ticketDiv = document.createElement('div');
    ticketDiv.className = 'ticket-item';
    
    let agentInfo = '';
    if (ticket.agentId) {
        const agent = agents.find(a => a.id === ticket.agentId);
        if (agent) {
            agentInfo = `
                <div class="assigned-agent-info">
                    <h4>🛠️ Agente Asignado</h4>
                    <div class="agent-contact">
                        <strong>${agent.name}</strong>
                        ${agent.skills ? `<div class="agent-skills">${agent.skills}</div>` : ''}
                        <div class="agent-contact-details">
                            <span>📧 ${agent.email}</span>
                            ${agent.phone ? `<span>📱 ${agent.phone}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    } else {
        agentInfo = `
            <div class="assigned-agent-info waiting">
                <h4>⏳ Esperando asignación</h4>
                <p>Tu ticket será asignado a un agente pronto</p>
            </div>
        `;
    }
    
    // Mostrar resumen del chat
    let chatSummary = '';
    if (ticket.chatMessages && ticket.chatMessages.length > 0) {
        const agentMessages = ticket.chatMessages.filter(msg => msg.type === 'agent_message').length;
        const lastMessages = ticket.chatMessages.slice(-3).map(msg => `
            <div class="client-chat-message ${msg.type === 'agent_message' ? 'agent' : 'system'}">
                <strong>${msg.type === 'agent_message' ? '🛠️ Agente' : '📢 Sistema'}:</strong>
                ${escapeHtml(msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content)}
            </div>
        `).join('');
        
        chatSummary = `
            <div class="client-chat-summary">
                <h4>💬 Historial de Conversación</h4>
                <div class="chat-messages-preview">
                    ${lastMessages}
                </div>
                <small>${agentMessages} mensajes del agente • Última actualización: ${new Date(ticket.chatMessages[ticket.chatMessages.length-1].timestamp).toLocaleDateString()}</small>
            </div>
        `;
    }
    
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
            </div>
        </div>
        <p>${escapeHtml(ticket.description)}</p>
        ${agentInfo}
        ${chatSummary}
        <div class="ticket-meta">
            <small>Creado: ${new Date(ticket.createdAt).toLocaleDateString()}</small>
            ${ticket.updates && ticket.updates.length > 0 ? 
                `<small>Última actualización: ${new Date(ticket.updates[ticket.updates.length-1].timestamp).toLocaleDateString()}</small>` : ''}
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
            ${metric.performance > 0 ? `<div class="agent-performance">Rendimiento: ${metric.performance}%</div>` : ''}
        `;
        statsContainer.appendChild(metricElement);
    });
}

function updateClientMetrics() {
    if (!currentClient) return;
    
    tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    
    const clientTickets = tickets.filter(ticket => ticket.clientEmail === currentClient.email);
    const metrics = {
        open: clientTickets.filter(t => t.status === 'open').length,
        progress: clientTickets.filter(t => t.status === 'progress').length,
        resolved: clientTickets.filter(t => t.status === 'resolved').length
    };
    
    const openElement = document.getElementById('client-open-tickets');
    const progressElement = document.getElementById('client-progress-tickets');
    const resolvedElement = document.getElementById('client-resolved-tickets');
    
    if (openElement) openElement.textContent = metrics.open;
    if (progressElement) progressElement.textContent = metrics.progress;
    if (resolvedElement) resolvedElement.textContent = metrics.resolved;
}

function loadAgentsForAssignment() {
    const agentSelect = document.getElementById('agent-select');
    if (!agentSelect) return;
    
    agentSelect.innerHTML = '<option value="">Seleccionar agente</option>';
    
    const activeAgents = agents.filter(agent => agent.active);
    activeAgents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = `${agent.name} - ${agent.skills || 'Soporte General'}`;
        agentSelect.appendChild(option);
    });
}

function updateAgentFilters() {
    const agentFilter = document.getElementById('agent-filter');
    if (!agentFilter) return;
    
    agentFilter.innerHTML = '<option value="all">Todos los agentes</option>';
    
    const activeAgents = agents.filter(agent => agent.active);
    activeAgents.forEach(agent => {
        const option = document.createElement('option');
        option.value = agent.id;
        option.textContent = agent.name;
        agentFilter.appendChild(option);
    });
}

// ===== UTILIDADES =====

function escapeHtml(unsafe) {
    if (!unsafe) return '';
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

// ===== FUNCIONES DE REGISTRO Y LOGIN DE AGENTES =====

function registerAgent(name, email, phone, skills = '') {
    const existingAgent = agents.find(agent => agent.email === email);
    if (existingAgent) {
        showNotification('Este correo ya está registrado como agente', 'error');
        return { success: false };
    }

    const newAgent = {
        id: 'agent_' + Date.now(),
        name,
        email,
        phone,
        skills,
        registrationDate: new Date().toISOString(),
        active: true,
        role: 'agent'
    };

    agents.push(newAgent);
    localStorage.setItem('agents', JSON.stringify(agents));
    
    showNotification('Agente registrado exitosamente. Ahora puedes iniciar sesión.', 'success');
    
    return { success: true, agent: newAgent };
}

function loginAgent(email) {
    const agent = agents.find(agent => agent.email === email && agent.active);
    if (agent) {
        localStorage.setItem('currentAgent', JSON.stringify(agent));
        window.location.href = 'agent-dashboard.html';
    } else {
        showNotification('Agente no encontrado o cuenta inactiva', 'error');
    }
}

function getCurrentAgent() {
    const agentData = localStorage.getItem('currentAgent');
    return agentData ? JSON.parse(agentData) : null;
}

function logoutAgent() {
    localStorage.removeItem('currentAgent');
    window.location.href = 'index.html';
}

// ===== FUNCIONES PARA DATOS DE PRUEBA =====

function initializeSampleData() {
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    let clients = JSON.parse(localStorage.getItem('clients')) || [];
    
    if (tickets.length === 0) {
        tickets = [
            {
                id: 1,
                subject: "Error al acceder al sistema",
                description: "No puedo iniciar sesión en la plataforma, me da error de credenciales",
                status: "open",
                priority: "high",
                clientName: "Juan Pérez",
                clientEmail: "juan@empresa.com",
                createdAt: new Date().toISOString(),
                agentId: null
            },
            {
                id: 2,
                subject: "Problema con facturación",
                description: "La factura del mes pasado no coincide con lo contratado",
                status: "open", 
                priority: "medium",
                clientName: "María García",
                clientEmail: "maria@empresa.com",
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                agentId: null
            },
            {
                id: 3,
                subject: "Solicitud de nuevo usuario",
                description: "Necesito que se cree una cuenta para un nuevo empleado",
                status: "progress",
                priority: "low",
                clientName: "Carlos López",
                clientEmail: "carlos@empresa.com", 
                createdAt: new Date(Date.now() - 172800000).toISOString(),
                agentId: "agent1"
            }
        ];
        localStorage.setItem('tickets', JSON.stringify(tickets));
    }
    
    if (clients.length === 0) {
        clients = [
            {
                id: 1,
                name: "Juan Pérez",
                email: "juan@empresa.com",
                phone: "+573001234567",
                registrationDate: new Date().toISOString()
            },
            {
                id: 2, 
                name: "María García",
                email: "maria@empresa.com",
                phone: "+573007654321",
                registrationDate: new Date().toISOString()
            }
        ];
        localStorage.setItem('clients', JSON.stringify(clients));
    }
}

// ===== INICIALIZACIÓN GLOBAL =====

// Variables globales
let currentClient = null;

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
window.getAllTickets = getAllTickets;
window.getTicketById = getTicketById;
window.assignAgentToTicket = assignAgentToTicket;
window.changeTicketStatus = changeTicketStatus;
window.exportTickets = exportTickets;
window.initializeSampleData = initializeSampleData;
window.registerAgent = registerAgent;
window.loginAgent = loginAgent;
window.getCurrentAgent = getCurrentAgent;
window.logoutAgent = logoutAgent;
