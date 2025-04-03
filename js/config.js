// js/config.js

const AppConfig = {
    hotelName: "Hôtel Le Magnifique", // <<< MODIFIEZ ICI le nom de votre hôtel
    currencySymbol: "€",             // <<< MODIFIEZ ICI le symbole monétaire si besoin
    defaultWelcomeMessage: "Bienvenue dans le panneau de gestion", // Exemple d'autre config
    // Ajoutez d'autres paramètres généraux ici si nécessaire
};

// On "gèle" l'objet pour éviter les modifications accidentelles ailleurs dans le code
Object.freeze(AppConfig);

// Vous pouvez ajouter ici un console.log pour vérifier que le fichier est chargé
console.log("Configuration chargée :", AppConfig.hotelName);