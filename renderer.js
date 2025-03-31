const fs = require('fs');
const path = require('path');

let puntosInteres = [];
let tempCoords = null;

document.addEventListener('DOMContentLoaded', function() {
  var map = L.map('map').setView([0, 0], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;
      map.setView([lat, lon], 15);
      L.marker([lat, lon]).addTo(map).bindPopup("Tu ubicación").openPopup();
    });
  }

  // Búsqueda de ubicaciones
  document.getElementById('searchBtn').addEventListener('click', function() {
    let query = document.getElementById('searchBox').value;
    if (!query) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        if (data.length > 0) {
          let lat = data[0].lat;
          let lon = data[0].lon;
          map.setView([lat, lon], 15);
          L.marker([lat, lon]).addTo(map).bindPopup(data[0].display_name).openPopup();
        } else {
          alert("Ubicación no encontrada.");
        }
      })
      .catch(() => alert("Error en la búsqueda."));
  });

  // Evento para abrir formulario al hacer clic en el mapa
  map.on('click', function(e) {
    tempCoords = e.latlng; // Guardar coordenadas temporalmente
    document.getElementById('poiForm').style.display = 'block';
  });

  // Evento para añadir punto de interés
  document.getElementById('addPoiBtn').addEventListener('click', function() {
    let title = document.getElementById('poiTitle').value;
    let description = document.getElementById('poiDescription').value;
    
    if (!title || !description || !tempCoords) return;

    let marker = L.marker([tempCoords.lat, tempCoords.lng]).addTo(map)
      .bindPopup(`<b>${title}</b><br>${description}`);

    puntosInteres.push({ title, description, lat: tempCoords.lat, lon: tempCoords.lng });

    document.getElementById('poiForm').style.display = 'none';
    document.getElementById('poiTitle').value = "";
    document.getElementById('poiDescription').value = "";
  });

  // Evento para cancelar la adición
  document.getElementById('cancelPoiBtn').addEventListener('click', function() {
    document.getElementById('poiForm').style.display = 'none';
  });

  // Guardar puntos en JSON
  document.getElementById('saveBtn').addEventListener('click', function() {
    let filePath = path.join(__dirname, 'puntosInteres.json');
    fs.writeFile(filePath, JSON.stringify(puntosInteres, null, 2), err => {
      if (err) alert("Error al guardar.");
      else alert("Puntos guardados en " + filePath);
    });
  });

});
