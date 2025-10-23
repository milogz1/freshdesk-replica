// Datos de ejemplo (en un caso real, esto vendría de una API)
let tickets = JSON.parse(localStorage.getItem('tickets')) || [
    {
        id: 1,
        subject: "Error al iniciar sesión",
        description: "No puedo acceder a mi cuenta con mis credenciales",
        status: "open",
        priority: "high",
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        subject: "Pregunta sobre facturación",
        description: "Necesito ayuda para entender mi factura del mes pasado",
        status: "progress",
        priority: "medium",
        createdAt: new Date(Date.now() - 86400000).toISOString()
    }
];

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Solo inicializar elementos si existen en la página actual
    if (document.getElementById('tickets-list')) {
        renderTickets();
        updateStats();
        
        // Event listeners para filtros
        const searchInput = document.getElementById('search-tickets');
        const statusFilter = document.getElementById('status-filter');
        const ticketForm = document.getElementById('ticket-form');
        
        if (searchInput) searchInput.addEventListener('input', filterTickets);
        if (statusFilter) statusFilter.addEventListener('change', filterTickets);
        if (ticketForm) ticketForm.addEventListener('submit', handleTicketSubmit);
    }
    
    // Configurar formulario de contacto si existe
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

// Renderizar lista de tickets
function renderTickets(ticketsToRender = tickets) {
    const ticketsList = document.getElementById('tickets-list');
    if (!ticketsList) return;
    
    ticketsList.innerHTML = '';
    
    if (ticketsToRender.length === 0) {
        ticketsList.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 2rem;">No se encontraron tickets.</p>';
        return;
    }
    
    ticketsToRender.forEach(ticket => {
        const ticketElement = createTicketElement(ticket);
        ticketsList.appendChild(ticketElement);
    });
}

// Crear elemento HTML para un ticket
function createTicketElement(ticket) {
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
            <span class="ticket-status status-${ticket.status}">
                ${getStatusText(ticket.status)}
            </span>
        </div>
        <p>${escapeHtml(ticket.description)}</p>
        <div class="ticket-actions">
            <button onclick="changeTicketStatus(${ticket.id}, 'progress')" class="btn-secondary">
                En Progreso
            </button>
            <button onclick="changeTicketStatus(${ticket.id}, 'resolved')" class="btn-secondary">
                Resolver
            </button>
            <button onclick="deleteTicket(${ticket.id})" class="btn-danger">
                Eliminar
            </button>
        </div>
    `;
    return ticketDiv;
}

// Función de seguridad para evitar XSS
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Texto para los estados
function getStatusText(status) {
    const statusMap = {
        'open': 'Abierto',
        'progress': 'En Progreso',
        'resolved': 'Resuelto'
    };
    return statusMap[status] || status;
}

// Filtrar tickets
function filterTickets() {
    const searchInput = document.getElementById('search-tickets');
    const statusFilter = document.getElementById('status-filter');
    
    if (!searchInput || !statusFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilterValue = statusFilter.value;
    
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm) || 
                            ticket.description.toLowerCase().includes(searchTerm);
        const matchesStatus = statusFilterValue === 'all' || ticket.status === statusFilterValue;
        
        return matchesSearch && matchesStatus;
    });
    
    renderTickets(filteredTickets);
}

// Actualizar estadísticas
function updateStats() {
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const progressTickets = tickets.filter(t => t.status === 'progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    
    const openElement = document.getElementById('open-tickets-count');
    const progressElement = document.getElementById('progress-tickets-count');
    const resolvedElement = document.getElementById('resolved-tickets-count');
    
    if (openElement) openElement.textContent = openTickets;
    if (progressElement) progressElement.textContent = progressTickets;
    if (resolvedElement) resolvedElement.textContent = resolvedTickets;
}

// Manejar envío de nuevo ticket
function handleTicketSubmit(e) {
    e.preventDefault();
    
    const subject = document.getElementById('ticket-subject').value;
    const description = document.getElementById('ticket-description').value;
    const priority = document.getElementById('ticket-priority').value;
    
    const newTicket = {
        id: Date.now(),
        subject,
        description,
        status: 'open',
        priority,
        createdAt: new Date().toISOString()
    };
    
    tickets.unshift(newTicket);
    saveTickets();
    renderTickets();
    updateStats();
    closeModal();
    
    const ticketForm = document.getElementById('ticket-form');
    if (ticketForm) ticketForm.reset();
    
    // Mostrar confirmación
    showNotification('Ticket creado exitosamente', 'success');
}

// Manejar envío de formulario de contacto
function handleContactSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('contact-name').value;
    const subject = document.getElementById('contact-subject').value;
    const description = document.getElementById('contact-description').value;
    const priority = document.getElementById('contact-priority').value;
    
    const newTicket = {
        id: Date.now(),
        subject: `[Contacto] ${subject} - ${name}`,
        description,
        status: 'open',
        priority,
        createdAt: new Date().toISOString()
    };
    
    tickets.unshift(newTicket);
    saveTickets();
    
    // Mostrar confirmación y redirigir
    showNotification('Ticket creado exitosamente. Redirigiendo al dashboard...', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// Cambiar estado del ticket
function changeTicketStatus(ticketId, newStatus) {
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex !== -1) {
        tickets[ticketIndex].status = newStatus;
        saveTickets();
        renderTickets();
        updateStats();
        showNotification(`Ticket marcado como ${getStatusText(newStatus)}`, 'info');
    }
}

// Eliminar ticket
function deleteTicket(ticketId) {
    if (confirm('¿Estás seguro de que quieres eliminar este ticket?')) {
        tickets = tickets.filter(t => t.id !== ticketId);
        saveTickets();
        renderTickets();
        updateStats();
        showNotification('Ticket eliminado', 'warning');
    }
}

// Guardar tickets en localStorage
function saveTickets() {
    localStorage.setItem('tickets', JSON.stringify(tickets));
}

// Mostrar notificación
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
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

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

// Modal functions
function createNewTicket() {
    const ticketModal = document.getElementById('ticket-modal');
    if (ticketModal) ticketModal.style.display = 'block';
}

function closeModal() {
    const ticketModal = document.getElementById('ticket-modal');
    if (ticketModal) ticketModal.style.display = 'none';
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const ticketModal = document.getElementById('ticket-modal');
    if (event.target === ticketModal) {
        closeModal();
    }
}

// Hacer funciones disponibles globalmente
window.createNewTicket = createNewTicket;
window.closeModal = closeModal;
window.changeTicketStatus = changeTicketStatus;
window.deleteTicket = deleteTicket;