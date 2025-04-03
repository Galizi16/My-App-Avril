// js/index.js

// Attend que tout le contenu HTML soit chargé avant d'exécuter le script
document.addEventListener('DOMContentLoaded', function() {

    console.log("Index.js chargé.");

    // Vérifier si AppConfig est bien disponible (doit être chargé avant ce script)
    if (typeof AppConfig !== 'undefined') {
        console.log("Utilisation de la configuration :", AppConfig.hotelName);

        // Mettre à jour le nom de l'hôtel dans la barre de navigation
        const brandElement = document.getElementById('hotel-brand-name');
        if (brandElement) {
            brandElement.textContent = AppConfig.hotelName;
        }

        // Mettre à jour le titre de la page (optionnel)
        // document.title = AppConfig.hotelName + " - Tableau de Bord";

        // Mettre à jour le message de bienvenue (si vous ajoutez un élément pour ça)
        const welcomeElement = document.getElementById('welcome-message');
         if (welcomeElement && AppConfig.defaultWelcomeMessage) {
             welcomeElement.textContent = AppConfig.defaultWelcomeMessage;
         }

    } else {
        console.error("Erreur : La configuration (AppConfig) n'a pas été chargée avant index.js !");
    }

    // --- Ajoutez ici d'autres logiques spécifiques à la page d'accueil ---
    // Par exemple, rendre les panneaux cliquables (même s'ils le sont déjà via le lien <a>)
    // ou charger des données initiales pour un mini-dashboard sur l'accueil.

});