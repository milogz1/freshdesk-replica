// ===== ESTRUCTURAS DE DATOS =====

// Agentes predefinidos
const predefinedAgents = [
    { id: 'agent1', name: 'Ana García', email: 'ana@soporte.com', phone: '+573001234567', skills: 'Soporte Técnico', active: true },
    { id: 'agent2', name: 'Carlos López', email: 'carlos@soporte.com', phone: '+573007654321', skills: 'Facturación', active: true },
    { id: 'agent3', name: 'María Rodríguez', email: 'maria@soporte.com', phone: '+573008765432', skills: 'Ventas', active: true }
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
    // Crear elemento de notificación
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

// ===== INICIALIZACIÓN DE DATOS DE PRUEBA =====

function initializeSampleData() {
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    let clients = JSON.parse(localStorage.getItem('clients')) || [];
    
    if (tickets.length === 0) {
        // Crear tickets de ejemplo
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

// ===== RENDERIZADO DE UI =====

function renderAllTickets(ticketsToRender = tickets) {
    const ticketsList = document.getElementById('all-tickets-list');
    if (!ticketsList) {
        console.error('❌ No se encontró el elemento all-tickets-list');
        return;
    }
    
    console.log('🎫 Renderizando tickets:', ticketsToRender.length);
    
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
    
    console.log('✅ Tickets renderizados correctamente');
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

function getCurrentAgent() {
    const agentData = localStorage.getItem('currentAgent');
    return agentData ? JSON.parse(agentData) : null;
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

function exportTickets() {
    const tickets = getAllTickets();
    const csv = convertTicketsToCSV(tickets);
    downloadCSV(csv, 'reporte_tickets.csv');
    showNotification('Reporte exportado correctamente', 'success');
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

// Inicializar datos de muestra al cargar la aplicación
initializeSampleData();
