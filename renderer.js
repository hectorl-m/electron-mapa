const fs = require('fs');
const path = require('path');

let puntosInteres = [];
let tempCoords = null;

document.addEventListener('DOMContentLoaded', function() {
  var map = L.map('map').setView([0, 0], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Centrar en la ubicación actual
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      let lat = position.coords.latitude;
      let lon = position.coords.longitude;
      map.setView([lat, lon], 15);
      L.marker([lat, lon]).addTo(map).bindPopup("Tu ubicación").openPopup();
    });
  }

  // Búsqueda de ubicaciones (sin agregar marcador)
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
        } else {
          alert("Ubicación no encontrada.");
        }
      })
      .catch(() => alert("Error en la búsqueda."));
  });

  // Evento para abrir el formulario al hacer clic en el mapa
  map.on('click', function(e) {
    tempCoords = e.latlng; // Guardar coordenadas temporalmente
    document.getElementById('poiForm').style.display = 'block';
  });

  // Función para actualizar el panel lateral de POIs
  function updatePoiList() {
    const poiList = document.getElementById('poiList');
    poiList.innerHTML = '';
    puntosInteres.forEach((poi, index) => {
      const li = document.createElement('li');
      li.textContent = `${poi.title} (${poi.lat.toFixed(4)}, ${poi.lon.toFixed(4)})`;
      poiList.appendChild(li);
    });
  }

  // Evento para añadir un punto de interés
  document.getElementById('addPoiBtn').addEventListener('click', function() {
    let title = document.getElementById('poiTitle').value;
    let description = document.getElementById('poiDescription').value;
    
    if (!title || !description || !tempCoords) return;

    // Crear marcador arrastrable
    let marker = L.marker([tempCoords.lat, tempCoords.lng], { draggable: true }).addTo(map)
      .bindPopup(`<b>${title}</b><br>${description}`);

    // Crear objeto POI y almacenar la referencia al marcador
    let poi = {
      title,
      description,
      lat: tempCoords.lat,
      lon: tempCoords.lng,
      marker
    };

    // Actualizar las coordenadas cuando se termine de arrastrar
    marker.on('dragend', function(e) {
      const newPos = e.target.getLatLng();
      poi.lat = newPos.lat;
      poi.lon = newPos.lng;
      updatePoiList();
    });

    puntosInteres.push(poi);

    updatePoiList();

    // Limpiar y ocultar formulario
    document.getElementById('poiForm').style.display = 'none';
    document.getElementById('poiTitle').value = "";
    document.getElementById('poiDescription').value = "";
  });

  // Evento para cancelar la adición de un POI
  document.getElementById('cancelPoiBtn').addEventListener('click', function() {
    document.getElementById('poiForm').style.display = 'none';
  });

  // Guardar puntos en JSON
  document.getElementById('saveBtn').addEventListener('click', function() {
    let filePath = path.join(__dirname, 'puntosInteres.json');
    // Crear un arreglo que solo contenga los datos (sin referencias circulares)
    let datosGuardados = puntosInteres.map(poi => ({
      title: poi.title,
      description: poi.description,
      lat: poi.lat,
      lon: poi.lon
    }));
    fs.writeFile(filePath, JSON.stringify(datosGuardados, null, 2), err => {
      if (err) alert("Error al guardar.");
      else alert("Puntos guardados en " + filePath);
    });
  });

});
