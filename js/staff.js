// js/staff.js
const StaffApp = {
    staffData: [],
    services: new Set(),
    fileLoaded: false,
    elements: {},
    extras: { 'RECEPTION JOUR': [], 'RECEPTION NUIT': [], 'RECEPTION JOUR EXTRA': [], 'RECEPTION NUIT EXTRA': [] },

    init() {
        console.log('StaffApp initializing...');
        this.cacheDOMElements();
        this.addEventListeners();
        this.loadFromSessionStorage();
        this.updateSelectStates();
        console.log('StaffApp initialized.');
    },

    cacheDOMElements() {
        console.log('Caching DOM elements...');
        this.elements.messageArea = document.getElementById('messageArea');
        this.elements.staffFileInput = document.getElementById('staffFileInput');
        this.elements.staffFileStatus = document.getElementById('staffFileStatus');
        this.elements.reloadButtons = document.querySelectorAll('.reloadButton');
        this.elements.staffDateInput = document.getElementById('staffDate');
        this.elements.serviceFilterSelect = document.getElementById('serviceFilter');
        this.elements.staffResultsDiv = document.getElementById('staffResults');
        this.elements.reportStartDate = document.getElementById('reportStartDate');
        this.elements.reportEndDate = document.getElementById('reportEndDate');
        this.elements.generateReportButton = document.getElementById('generateReportButton');
        this.elements.alertReportSection = document.getElementById('alertReportSection');
        this.elements.alertReportResults = document.getElementById('alertReportResults');
        this.elements.printReportButton = document.getElementById('printReportButton');
        this.elements.downloadReportButton = document.getElementById('downloadReportButton');
        console.log('DOM elements cached:', this.elements);
    },

    addEventListeners() {
        console.log('Adding event listeners...');
        this.elements.staffFileInput.addEventListener('change', (e) => {
            console.log('File input changed:', e.target.files);
            this.handleFileLoad(e);
        });
        this.elements.reloadButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                console.log('Reload button clicked:', e.currentTarget.dataset.inputId);
                this.reloadFile(e.currentTarget.dataset.inputId);
            });
        });
        this.elements.staffDateInput.addEventListener('change', () => {
            console.log('Staff date changed:', this.elements.staffDateInput.value);
            this.updateStaffPlanning();
        });
        this.elements.serviceFilterSelect.addEventListener('change', () => {
            console.log('Service filter changed:', this.elements.serviceFilterSelect.value);
            this.updateStaffPlanning();
        });
        this.elements.generateReportButton.addEventListener('click', () => {
            console.log('Generate report button clicked');
            this.generateAlertReport();
        });
        this.elements.printReportButton.addEventListener('click', () => {
            console.log('Print report button clicked');
            window.print();
        });
        this.elements.downloadReportButton.addEventListener('click', () => {
            console.log('Download report button clicked');
            this.downloadReportAsCSV();
        });
        console.log('Event listeners added.');
    },

    loadFromSessionStorage() {
        console.log('Loading from sessionStorage...');
        const storedData = sessionStorage.getItem('staffData');
        if (storedData) {
            try {
                this.staffData = JSON.parse(storedData);
                console.log('Parsed staffData from sessionStorage:', this.staffData);
                // Vérifier la cohérence des données
                if (!this.staffData || this.staffData.length < 2 || this.staffData[0].length < 3) {
                    throw new Error("Données corrompues dans sessionStorage.");
                }
                this.fileLoaded = true;
                this.elements.staffFileStatus.textContent = 'Données chargées depuis la session';
                this.elements.staffFileStatus.style.color = 'green';
                this.displayMessage('Données restaurées depuis la session.', 'success');
                this.services.clear();
                for (let i = 1; i < this.staffData.length; i++) {
                    if (this.staffData[i][1]) {
                        let service = String(this.staffData[i][1]).trim().toUpperCase();
                        if (service === 'FDC EXTRA') service = 'FEMME DE CHAMBRE';
                        this.services.add(service);
                    }
                }
                this.identifyExtras();
                this.updateSelectStates();
                this.updateStaffPlanning();
            } catch (error) {
                console.error('Erreur lors de la restauration des données:', error);
                this.displayMessage('Erreur lors de la restauration des données de la session. Veuillez recharger le fichier.', 'error');
                this.fileLoaded = false;
                sessionStorage.removeItem('staffData');
                this.elements.staffResultsDiv.innerHTML = '<p class="text-muted">Rechargez le fichier Personnel.</p>';
            }
        } else {
            console.log('No staffData found in sessionStorage.');
        }
    },

    saveToSessionStorage() {
        console.log('Saving to sessionStorage...');
        try {
            sessionStorage.setItem('staffData', JSON.stringify(this.staffData));
            console.log('Data saved to sessionStorage.');
        } catch (error) {
            console.error('Erreur lors de la sauvegarde dans sessionStorage:', error);
            this.displayMessage('Erreur lors de la sauvegarde des données dans la session.', 'error');
        }
    },

    displayMessage(message, type = 'info') {
        console.log(`Displaying message: ${message} (type: ${type})`);
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
    },

    clearMessages() {
        console.log('Clearing messages...');
        this.elements.messageArea.innerHTML = '';
    },

    identifyExtras() {
        console.log('Identifying extras...');
        this.extras = { 'RECEPTION JOUR': [], 'RECEPTION NUIT': [], 'RECEPTION JOUR EXTRA': [], 'RECEPTION NUIT EXTRA': [] };
        for (let i = 1; i < this.staffData.length; i++) {
            const name = this.staffData[i][0]?.trim();
            let service = this.staffData[i][1]?.trim().toUpperCase();
            if (!name || !service) continue;
            if (service === 'FDC EXTRA') service = 'FEMME DE CHAMBRE';

            if (!['RECEPTION JOUR', 'RECEPTION NUIT', 'RECEPTION JOUR EXTRA', 'RECEPTION NUIT EXTRA'].includes(service)) continue;

            let hasRest = false;
            for (let j = 2; j < this.staffData[i].length; j++) {
                const status = this.staffData[i][j]?.toString().trim().toUpperCase() || '';
                if (status === 'R') {
                    hasRest = true;
                    break;
                }
            }
            if (!hasRest) {
                this.extras[service].push(name);
            }
        }
        console.log('Employés extras identifiés :', this.extras);
    },

    handleFileLoad(event) {
        console.log('Handling file load...');
        const file = event.target.files[0];
        if (!file) {
            console.log('No file selected.');
            this.displayMessage('Aucun fichier sélectionné.', 'warning');
            return;
        }
        this.elements.staffFileStatus.textContent = 'Chargement...';
        this.clearMessages();
        this.displayMessage('Chargement du fichier personnel...', 'info');
        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('File reader onload triggered.');
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary', cellDates: true, dateNF: 'yyyy-mm-dd' });
                console.log('Workbook read:', workbook);
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                console.log('Données brutes du fichier personnel:', data);
                if (!data || data.length < 2 || data[0].length < 3) {
                    throw new Error("Fichier vide ou mal formaté.");
                }

                this.staffData = data;
                this.services.clear();
                for (let i = 1; i < data.length; i++) {
                    if (data[i][1]) {
                        let service = String(data[i][1]).trim().toUpperCase();
                        if (service === 'FDC EXTRA') service = 'FEMME DE CHAMBRE';
                        this.services.add(service);
                    }
                }
                this.identifyExtras();
                this.fileLoaded = true;
                this.elements.staffFileStatus.textContent = `Chargé: ${file.name}`;
                this.elements.staffFileStatus.style.color = 'green';
                this.displayMessage('Fichier personnel chargé avec succès.', 'success');
                this.saveToSessionStorage();
                this.updateSelectStates();
                this.updateStaffPlanning();
            } catch (error) {
                console.error('Erreur traitement fichier:', error);
                this.displayMessage(`Erreur lecture fichier: ${error.message}`, 'error');
                this.elements.staffFileStatus.textContent = 'Erreur chargement';
                this.elements.staffFileStatus.style.color = 'red';
                event.target.value = '';
                this.fileLoaded = false;
                this.updateSelectStates();
                this.elements.staffResultsDiv.innerHTML = `<p class="text-danger">Erreur chargement fichier.</p>`;
            }
        };
        reader.onerror = (error) => {
            console.error('Erreur lecture fichier:', error);
            this.displayMessage('Erreur lors de la lecture du fichier.', 'error');
            this.elements.staffFileStatus.textContent = 'Erreur chargement';
            this.elements.staffFileStatus.style.color = 'red';
            event.target.value = '';
            this.fileLoaded = false;
            this.updateSelectStates();
        };
        console.log('Reading file as binary string...');
        reader.readAsBinaryString(file);
    },

    reloadFile(inputId) {
        console.log('Reloading file for input:', inputId);
        const input = document.getElementById(inputId);
        if (input) {
            this.fileLoaded = false;
            this.staffData = [];
            this.services.clear();
            this.extras = { 'RECEPTION JOUR': [], 'RECEPTION NUIT': [], 'RECEPTION JOUR EXTRA': [], 'RECEPTION NUIT EXTRA': [] };
            sessionStorage.removeItem('staffData');
            this.elements.staffFileStatus.textContent = '';
            this.elements.staffFileStatus.style.color = '';
            input.value = '';
            this.clearMessages();
            this.displayMessage('Veuillez sélectionner le nouveau fichier personnel.', 'info');
            this.updateSelectStates();
            this.elements.staffResultsDiv.innerHTML = '<p class="text-muted">Rechargez le fichier Personnel.</p>';
            this.elements.alertReportSection.style.display = 'none';
            input.click();
        }
    },

    fillSelectOptions(selectElement, options, config = {}) {
        console.log('Filling select options for:', selectElement.id);
        const { defaultOption, placeholder } = config;
        selectElement.innerHTML = '';
        if (defaultOption) {
            const defOption = document.createElement('option');
            defOption.value = ""; defOption.textContent = defaultOption;
            selectElement.appendChild(defOption);
        }
        if (placeholder && options.size === 0) {
            const phOption = document.createElement('option');
            phOption.value = ""; phOption.textContent = placeholder; phOption.disabled = true;
            if (!defaultOption) phOption.selected = true;
            selectElement.appendChild(phOption);
        }
        const sortedOptions = Array.from(options).sort();
        sortedOptions.forEach(optionValue => {
            if (optionValue) {
                const optionElement = document.createElement('option');
                optionElement.value = optionValue; optionElement.textContent = optionValue;
                selectElement.appendChild(optionElement);
            }
        });
        console.log('Select options filled:', selectElement.options);
    },

    updateSelectStates() {
        console.log('Updating select states...');
        console.log('fileLoaded:', this.fileLoaded);
        this.elements.staffDateInput.disabled = !this.fileLoaded;
        this.elements.serviceFilterSelect.disabled = !this.fileLoaded;
        this.elements.reportStartDate.disabled = !this.fileLoaded;
        this.elements.reportEndDate.disabled = !this.fileLoaded;
        this.elements.generateReportButton.disabled = !this.fileLoaded;
        if (!this.fileLoaded && this.elements.serviceFilterSelect.options.length <= 1 && !this.services.size) {
            this.fillSelectOptions(this.elements.serviceFilterSelect, [], { placeholder: "Charger fichier d'abord"});
        } else if (this.fileLoaded) {
            this.fillSelectOptions(this.elements.serviceFilterSelect, this.services, { defaultOption: "Tous les services" });
        }
        console.log('Select states updated:', {
            staffDateInput: this.elements.staffDateInput.disabled,
            serviceFilterSelect: this.elements.serviceFilterSelect.disabled,
            reportStartDate: this.elements.reportStartDate.disabled,
            reportEndDate: this.elements.reportEndDate.disabled,
            generateReportButton: this.elements.generateReportButton.disabled
        });
    },

    generateAlertsForDate(selectedDate) {
        console.log('Generating alerts for date:', selectedDate);
        const dateStrFormatted = this.formatDate(selectedDate);
        const headerRow = this.staffData[0];
        let dateIndex = -1;
        for (let i = 2; i < headerRow.length; i++) {
            const headerDate = this.parseExcelDate(headerRow[i]);
            if (headerDate && !isNaN(headerDate) && headerDate.getTime() === selectedDate.getTime()) {
                dateIndex = i;
                break;
            }
        }
        if (dateIndex === -1) {
            console.log('Date not found in file.');
            return { date: dateStrFormatted, alerts: [{ text: "Date non trouvée dans le fichier.", type: 'error' }] };
        }

        let allPresentStaff = [];
        let absentStaff = [];
        const staffCountByService = {};
        const pcStaff = [];

        for (let i = 1; i < this.staffData.length; i++) {
            const name = this.staffData[i][0]?.trim();
            let service = this.staffData[i][1]?.trim().toUpperCase();
            const status = this.staffData[i][dateIndex]?.toString().trim().toUpperCase() || '';

            if (!name || !service) continue;
            if (service === 'FDC EXTRA') service = 'FEMME DE CHAMBRE';

            console.log(`Employé: ${name}, Service: ${service}, Statut: ${status}`);

            const isExtra = ['RECEPTION JOUR EXTRA', 'RECEPTION NUIT EXTRA', 'FDC EXTRA'].includes(service);

            if (!staffCountByService[service]) staffCountByService[service] = 0;
            if (status === 'P' || status === 'PC') {
                allPresentStaff.push({ name, service, status });
                if (status === 'PC') {
                    pcStaff.push({ name, service });
                }
                staffCountByService[service]++;
            } else if (status && (!isExtra || (isExtra && status !== ''))) {
                let reason = '';
                switch(status) {
                    case 'R': reason = 'Repos'; break;
                    case 'CP': reason = 'Congé Payé'; break;
                    case 'AM': reason = 'Arrêt Maladie'; break;
                    default: reason = `Autre (${status})`;
                }
                absentStaff.push({ name, service, reason });
            }
        }

        console.log(`Présents le ${dateStrFormatted} :`, allPresentStaff);
        console.log(`Comptage par service le ${dateStrFormatted} :`, staffCountByService);

        let alerts = [];

        let cafeteCovered = (staffCountByService["CAFETE"] || 0) >= 1;
        let cafeteCoveredBy = null;
        if (!cafeteCovered) {
            for (const emp of pcStaff) {
                if (['GOUVERNANTE', 'FEMME DE CHAMBRE'].includes(emp.service)) {
                    cafeteCovered = true;
                    cafeteCoveredBy = emp.service === 'GOUVERNANTE' ? 'gouvernante' : 'femme de chambre';
                    break;
                }
            }
        }
        if (!cafeteCovered) {
            alerts.push({ text: "Alerte : Le poste Cafete n'est pas assuré.", type: 'danger' });
        } else if (cafeteCoveredBy) {
            alerts.push({ text: `Info : Poste Cafete assuré par une ${cafeteCoveredBy}.`, type: 'info' });
        }

        let recepJourCovered = (staffCountByService["RECEPTION JOUR"] || 0) >= 1;
        let recepJourCoveredByNuit = false;
        if (!recepJourCovered) {
            for (const emp of pcStaff) {
                if (emp.service === 'RECEPTION NUIT' || emp.service === 'RECEPTION NUIT EXTRA') {
                    if (this.extras['RECEPTION NUIT'].includes(emp.name) || this.extras['RECEPTION NUIT EXTRA'].includes(emp.name)) {
                        recepJourCovered = true;
                        recepJourCoveredByNuit = true;
                        break;
                    }
                }
            }
            if (!recepJourCovered) {
                for (const emp of pcStaff) {
                    if (emp.service === 'RECEPTION NUIT' || emp.service === 'RECEPTION NUIT EXTRA') {
                        recepJourCovered = true;
                        recepJourCoveredByNuit = true;
                        break;
                    }
                }
            }
        }
        if (!recepJourCovered) {
            alerts.push({ text: "Alerte : Le poste de réceptionniste de jour n'est pas assuré.", type: 'danger' });
        } else if (recepJourCoveredByNuit) {
            alerts.push({ text: "Info : Poste Réception Jour assuré par un réceptionniste nuit.", type: 'info' });
        }

        if ((staffCountByService["RECEPTION NUIT"] || 0) + (staffCountByService["RECEPTION NUIT EXTRA"] || 0) < 1) {
            alerts.push({ text: "Alerte : Le poste de réceptionniste de nuit n'est pas assuré.", type: 'danger' });
        }

        if ((staffCountByService["GOUVERNANTE"] || 0) < 1) alerts.push({ text: "Info : La gouvernante n'est pas présente.", type: 'info' });
        if ((staffCountByService["TECHNICIEN"] || 0) < 1) alerts.push({ text: "Info : Le technicien n'est pas présent.", type: 'info' });

        const fdcCount = staffCountByService["FEMME DE CHAMBRE"] || 0;
        if (fdcCount < 3) {
            alerts.push({
                text: `Alerte : Moins de 3 femmes de chambre prévues (${fdcCount}). Minimum 3 requis (règle temporaire).`,
                type: 'warning'
            });
        }

        console.log('Alerts generated:', alerts);
        return { date: dateStrFormatted, alerts };
    },

    updateStaffPlanning() {
        console.log('Updating staff planning...');
        this.clearMessages();
        const selectedDateStr = this.elements.staffDateInput.value;
        const serviceFilter = this.elements.serviceFilterSelect.value;

        if (!this.fileLoaded || !selectedDateStr) {
            console.log('File not loaded or no date selected.');
            this.elements.staffResultsDiv.innerHTML = `<p class="text-muted">${!this.fileLoaded ? 'Chargez le fichier Personnel.' : 'Sélectionnez une date.'}</p>`;
            return;
        }

        const selectedDate = new Date(Date.UTC(parseInt(selectedDateStr.substring(0, 4)), parseInt(selectedDateStr.substring(5, 7)) - 1, parseInt(selectedDateStr.substring(8, 10))));
        if (isNaN(selectedDate)) {
            console.log('Invalid date selected:', selectedDateStr);
            this.elements.staffResultsDiv.innerHTML = `<p class="text-danger">Date sélectionnée invalide.</p>`;
            this.displayMessage('Erreur : Date sélectionnée invalide.', 'error');
            return;
        }
        const dateStrFormatted = this.formatDate(selectedDate);
        console.log('Date sélectionnée (UTC) :', selectedDate);

        const headerRow = this.staffData[0];
        let dateIndex = -1;
        for (let i = 2; i < headerRow.length; i++) {
            const headerDate = this.parseExcelDate(headerRow[i]);
            console.log(`Comparaison avec en-tête [${i}] :`, headerDate);
            if (headerDate && !isNaN(headerDate) && headerDate.getTime() === selectedDate.getTime()) {
                dateIndex = i;
                console.log('Date trouvée à l’index :', dateIndex);
                break;
            }
        }
        if (dateIndex === -1) {
            console.log('Date not found in file.');
            this.elements.staffResultsDiv.innerHTML = `<p class="text-danger">Date non trouvée dans le fichier.</p>`;
            this.displayMessage('Erreur : La date sélectionnée n’est pas présente dans le fichier.', 'error');
            return;
        }

        let allPresentStaff = [];
        let absentStaff = [];
        const staffCountByService = {};
        const pcStaff = [];

        for (let i = 1; i < this.staffData.length; i++) {
            const name = this.staffData[i][0]?.trim();
            let service = this.staffData[i][1]?.trim().toUpperCase();
            const status = this.staffData[i][dateIndex]?.toString().trim().toUpperCase() || '';

            if (!name || !service) continue;
            if (service === 'FDC EXTRA') service = 'FEMME DE CHAMBRE';

            const isExtra = ['RECEPTION JOUR EXTRA', 'RECEPTION NUIT EXTRA', 'FDC EXTRA'].includes(service);

            if (!staffCountByService[service]) staffCountByService[service] = 0;
            if (status === 'P' || status === 'PC') {
                allPresentStaff.push({ name, service, status });
                if (status === 'PC') {
                    pcStaff.push({ name, service });
                }
                staffCountByService[service]++;
            } else if (status && (!isExtra || (isExtra && status !== ''))) {
                let reason = '';
                switch(status) {
                    case 'R': reason = 'Repos'; break;
                    case 'CP': reason = 'Congé Payé'; break;
                    case 'AM': reason = 'Arrêt Maladie'; break;
                    default: reason = `Autre (${status})`;
                }
                absentStaff.push({ name, service, reason });
            }
        }

        let alerts = [];

        let cafeteCovered = (staffCountByService["CAFETE"] || 0) >= 1;
        let cafeteCoveredBy = null;
        if (!cafeteCovered) {
            for (const emp of pcStaff) {
                if (['GOUVERNANTE', 'FEMME DE CHAMBRE'].includes(emp.service)) {
                    cafeteCovered = true;
                    cafeteCoveredBy = emp.service === 'GOUVERNANTE' ? 'gouvernante' : 'femme de chambre';
                    break;
                }
            }
        }
        if (!cafeteCovered) {
            alerts.push({ text: "Alerte : Le poste Cafete n'est pas assuré.", type: 'danger' });
        } else if (cafeteCoveredBy) {
            alerts.push({ text: `Info : Poste Cafete assuré par une ${cafeteCoveredBy}.`, type: 'info' });
        }

        let recepJourCovered = (staffCountByService["RECEPTION JOUR"] || 0) >= 1;
        let recepJourCoveredByNuit = false;
        if (!recepJourCovered) {
            for (const emp of pcStaff) {
                if (emp.service === 'RECEPTION NUIT' || emp.service === 'RECEPTION NUIT EXTRA') {
                    if (this.extras['RECEPTION NUIT'].includes(emp.name) || this.extras['RECEPTION NUIT EXTRA'].includes(emp.name)) {
                        recepJourCovered = true;
                        recepJourCoveredByNuit = true;
                        break;
                    }
                }
            }
            if (!recepJourCovered) {
                for (const emp of pcStaff) {
                    if (emp.service === 'RECEPTION NUIT' || emp.service === 'RECEPTION NUIT EXTRA') {
                        recepJourCovered = true;
                        recepJourCoveredByNuit = true;
                        break;
                    }
                }
            }
        }
        if (!recepJourCovered) {
            alerts.push({ text: "Alerte : Le poste de réceptionniste de jour n'est pas assuré.", type: 'danger' });
        } else if (recepJourCoveredByNuit) {
            alerts.push({ text: "Info : Poste Réception Jour assuré par un réceptionniste nuit.", type: 'info' });
        }

        if ((staffCountByService["RECEPTION NUIT"] || 0) + (staffCountByService["RECEPTION NUIT EXTRA"] || 0) < 1) {
            alerts.push({ text: "Alerte : Le poste de réceptionniste de nuit n'est pas assuré.", type: 'danger' });
        }

        if ((staffCountByService["GOUVERNANTE"] || 0) < 1) alerts.push({ text: "Info : La gouvernante n'est pas présente.", type: 'info' });
        if ((staffCountByService["TECHNICIEN"] || 0) < 1) alerts.push({ text: "Info : Le technicien n'est pas présent.", type: 'info' });

        const fdcCount = staffCountByService["FEMME DE CHAMBRE"] || 0;
        if (fdcCount < 3) {
            alerts.push({
                text: `Alerte : Moins de 3 femmes de chambre prévues (${fdcCount}). Minimum 3 requis (règle temporaire).`,
                type: 'warning'
            });
        }

        let displayedPresentStaff = serviceFilter ? allPresentStaff.filter(emp => emp.service === serviceFilter) : allPresentStaff;
        displayedPresentStaff.sort((a, b) => a.service.localeCompare(b.service) || a.name.localeCompare(b.name));
        const displayStaffCount = {};
        displayedPresentStaff.forEach(emp => displayStaffCount[emp.service] = (displayStaffCount[emp.service] || 0) + 1);

        let html = `<h3>Planning du ${dateStrFormatted}</h3>`;
        if (alerts.length > 0) {
            alerts.forEach(alert => html += `<div class="alert alert-${alert.type}" role="alert">${alert.text}</div>`);
        }

        const dayNames = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        const dayName = dayNames[selectedDate.getUTCDay()];
        let summary = `<strong>${dayName} ${dateStrFormatted} :</strong> `;
        const staffSummaryParts = Object.entries(displayStaffCount).map(([service, count]) => `${count} ${service.toLowerCase().replace(/_/g, ' ')}${count > 1 ? 's' : ''}`);
        if (staffSummaryParts.length > 0) {
            summary += (serviceFilter ? `${staffSummaryParts.join(", ")} du service <strong>"${serviceFilter}"</strong>` : `${staffSummaryParts.join(", ")}`) + " seront présents.";
        } else {
            summary += serviceFilter ? `aucun employé du service <strong>"${serviceFilter}"</strong> n'est présent.` : "aucun employé n'est prévu comme présent.";
        }
        html += `<p>${summary}</p>`;

        html += '<h4 class="mt-4">Employés Présents</h4>';
        if (displayedPresentStaff.length > 0) {
            html += '<div class="table-responsive"><table class="table table-sm table-striped table-hover"><thead><tr><th>Nom</th><th>Service</th><th>Statut</th></tr></thead><tbody>';
            displayedPresentStaff.forEach(emp => html += `<tr><td>${emp.name}</td><td>${emp.service}</td><td>${emp.status}</td></tr>`);
            html += '</tbody></table></div>';
        } else {
            html += `<p>Aucun employé présent ${serviceFilter ? 'pour le service sélectionné' : ''}.</p>`;
        }

        if (!serviceFilter) {
            html += '<h4 class="mt-4">Employés Absents / Autre Statut</h4>';
            if (absentStaff.length > 0) {
                absentStaff.sort((a, b) => a.service.localeCompare(b.service) || a.name.localeCompare(b.name));
                html += '<div class="table-responsive"><table class="table table-sm table-striped table-hover"><thead><tr><th>Nom</th><th>Service</th><th>Raison / Statut</th></tr></thead><tbody>';
                absentStaff.forEach(emp => html += `<tr><td>${emp.name}</td><td>${emp.service}</td><td>${emp.reason}</td></tr>`);
                html += '</tbody></table></div>';
            } else {
                html += '<p>Aucun employé enregistré comme absent ou avec un autre statut pour cette date.</p>';
            }
        }

        this.elements.staffResultsDiv.innerHTML = html;
        console.log('Staff planning updated.');
    },

    generateAlertReport() {
        console.log('Generating alert report...');
        const startDateStr = this.elements.reportStartDate.value;
        const endDateStr = this.elements.reportEndDate.value;

        if (!startDateStr || !endDateStr) {
            console.log('Missing start or end date.');
            this.displayMessage('Veuillez sélectionner une date de début et une date de fin.', 'error');
            return;
        }

        const startDate = new Date(Date.UTC(parseInt(startDateStr.substring(0, 4)), parseInt(startDateStr.substring(5, 7)) - 1, parseInt(startDateStr.substring(8, 10))));
        const endDate = new Date(Date.UTC(parseInt(endDateStr.substring(0, 4)), parseInt(endDateStr.substring(5, 7)) - 1, parseInt(endDateStr.substring(8, 10))));

        if (isNaN(startDate) || isNaN(endDate)) {
            console.log('Invalid dates:', startDateStr, endDateStr);
            this.displayMessage('Dates invalides.', 'error');
            return;
        }

        if (startDate > endDate) {
            console.log('Start date is after end date.');
            this.displayMessage('La date de début doit être antérieure ou égale à la date de fin.', 'error');
            return;
        }

        const reportData = [];
        let currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const result = this.generateAlertsForDate(new Date(currentDate));
            reportData.push(result);
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }

        let html = '<div class="table-responsive"><table class="table table-sm table-striped table-hover"><thead><tr><th>Date</th><th>Type</th><th>Message</th></tr></thead><tbody>';
        reportData.forEach(day => {
            day.alerts.forEach(alert => {
                html += `<tr><td>${day.date}</td><td>${alert.type}</td><td>${alert.text}</td></tr>`;
            });
        });
        html += '</tbody></table></div>';

        if (reportData.every(day => day.alerts.length === 0)) {
            html = '<p>Aucune alerte ou info pour la période sélectionnée.</p>';
        }

        this.elements.alertReportResults.innerHTML = html;
        this.elements.alertReportSection.style.display = 'block';
        this.reportData = reportData;

        // Sauvegarder les alertes dans sessionStorage pour les récupérer dans alertes.html
        sessionStorage.setItem('staffAlerts', JSON.stringify(reportData));
        console.log('Alert report generated and saved to sessionStorage.');
    },

    downloadReportAsCSV() {
        console.log('Downloading report as CSV...');
        if (!this.reportData || this.reportData.length === 0) {
            console.log('No report data to download.');
            this.displayMessage('Aucun rapport à télécharger.', 'error');
            return;
        }

        let csvContent = "Date,Type,Message\n";
        this.reportData.forEach(day => {
            day.alerts.forEach(alert => {
                csvContent += `"${day.date}","${alert.type}","${alert.text}"\n`;
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'rapport_alertes.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('Report downloaded as CSV.');
    },

    parseExcelDate(serialOrString) {
        console.log('Parsing Excel date:', serialOrString);
        if (typeof serialOrString === 'number' && serialOrString > 0) {
            const utc_days = Math.floor(serialOrString - 25569);
            const utc_value = utc_days * 86400;
            const date_info = new Date(utc_value * 1000);
            const parsedDate = new Date(Date.UTC(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate()));
            console.log('Date parsée (numéro série) :', parsedDate);
            return parsedDate;
        } else if (typeof serialOrString === 'string') {
            const cleanedValue = serialOrString.replace(' 00:00:00', '').trim();
            const d = new Date(cleanedValue);
            if (!isNaN(d)) {
                const parsedDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
                console.log('Date parsée (chaîne) :', parsedDate);
                return parsedDate;
            }
        } else if (serialOrString instanceof Date && !isNaN(serialOrString)) {
            const parsedDate = new Date(Date.UTC(serialOrString.getUTCFullYear(), serialOrString.getUTCMonth(), serialOrString.getUTCDate()));
            console.log('Date parsée (objet Date) :', parsedDate);
            return parsedDate;
        }
        console.warn("Impossible de parser la date depuis l'en-tête Excel:", serialOrString);
        return null;
    },

    formatDate(date) {
        if (!date || isNaN(date)) {
            console.log('Invalid date for formatting:', date);
            return "Date invalide";
        }
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        const formatted = `${day}/${month}/${year}`;
        console.log('Formatted date:', formatted);
        return formatted;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing StaffApp...');
    StaffApp.init();
});