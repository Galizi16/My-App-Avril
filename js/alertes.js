// js/alertes.js
const AlertsApp = {
    elements: {},
    allAlerts: [],

    init() {
        console.log('AlertsApp initializing...');
        this.cacheDOMElements();
        this.addEventListeners();
        this.loadAlerts();
        this.displayAlerts();
        console.log('AlertsApp initialized.');
    },

    cacheDOMElements() {
        this.elements.messageArea = document.getElementById('messageArea');
        this.elements.alertResults = document.getElementById('alertResults');
        this.elements.printAlertsButton = document.getElementById('printAlertsButton');
        this.elements.downloadAlertsButton = document.getElementById('downloadAlertsButton');
    },

    addEventListeners() {
        this.elements.printAlertsButton.addEventListener('click', () => window.print());
        this.elements.downloadAlertsButton.addEventListener('click', () => this.downloadAlertsAsCSV());
    },

    loadAlerts() {
        // Récupérer les alertes de staff.js depuis sessionStorage
        const staffAlerts = sessionStorage.getItem('staffAlerts');
        if (staffAlerts) {
            try {
                const parsedAlerts = JSON.parse(staffAlerts);
                this.allAlerts = parsedAlerts.map(day => ({
                    source: 'Staff',
                    date: day.date,
                    alerts: day.alerts
                }));
            } catch (error) {
                console.error('Erreur lors de la récupération des alertes staff:', error);
                this.displayMessage('Erreur lors de la récupération des alertes du staff.', 'error');
            }
        }

        // À l'avenir, on peut ajouter d'autres sources d'alertes (tarifs, disponibilités, veille)
        // Exemple : const tarifAlerts = sessionStorage.getItem('tarifAlerts');
    },

    displayAlerts() {
        if (this.allAlerts.length === 0) {
            this.elements.alertResults.innerHTML = '<p class="text-muted">Aucune alerte disponible. Générez un rapport depuis une section (ex. Mon Staff) pour voir les alertes ici.</p>';
            return;
        }

        let html = '<div class="table-responsive"><table class="table table-sm table-striped table-hover"><thead><tr><th>Source</th><th>Date</th><th>Type</th><th>Message</th></tr></thead><tbody>';
        this.allAlerts.forEach(day => {
            day.alerts.forEach(alert => {
                html += `<tr><td>${day.source}</td><td>${day.date}</td><td>${alert.type}</td><td>${alert.text}</td></tr>`;
            });
        });
        html += '</tbody></table></div>';

        this.elements.alertResults.innerHTML = html;
    },

    downloadAlertsAsCSV() {
        if (this.allAlerts.length === 0) {
            this.displayMessage('Aucune alerte à télécharger.', 'error');
            return;
        }

        let csvContent = "Source,Date,Type,Message\n";
        this.allAlerts.forEach(day => {
            day.alerts.forEach(alert => {
                csvContent += `"${day.source}","${day.date}","${alert.type}","${alert.text}"\n`;
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'alertes_globales.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    displayMessage(message, type = 'info') {
        const alertTypeMap = { 'info': 'alert-info', 'success': 'alert-success', 'error': 'alert-danger', 'warning': 'alert-warning' };
        const alertClass = alertTypeMap[type] || 'alert-secondary';
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert ${alertClass} alert-dismissible fade show`;
        messageDiv.setAttribute('role', 'alert');
        messageDiv.textContent = message;
        const closeButton = document.createElement('button');
        closeButton.type = 'button'; closeButton.className = 'btn-close';
        closeButton.setAttribute('data-bs-dismiss', 'alert'); closeButton.setAttribute('aria-label', 'Close');
        messageDiv.appendChild(closeButton);
        this.elements.messageArea.appendChild(messageDiv);
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                if (messageDiv.isConnected) {
                    const alertInstance = bootstrap.Alert.getOrCreateInstance(messageDiv);
                    if (alertInstance) alertInstance.close();
                }
            }, 5000);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AlertsApp.init();
});