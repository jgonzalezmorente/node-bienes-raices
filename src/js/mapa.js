(function() {

    const lat = 40.5398402;
    const lng = -3.638753;
    const mapa = L.map('mapa').setView([lat, lng ], 16);    

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapa);

})()