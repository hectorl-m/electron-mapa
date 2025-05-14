let map, userMarker, questions = [], asked = new Set(), currentPos = null;

document.getElementById('municipioSelect').addEventListener('change', async (e) => {
  const municipio = e.target.value;
  if (!municipio) return;
  questions = await fetch(`data/${municipio}.json`).then(res => res.json());
  asked.clear();
  if (!map) initMap();
});

function initMap() {
  map = L.map('map').setView([38.79, 0.17], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  userMarker = L.marker([0, 0]).addTo(map).bindPopup("Tú estás aquí");

  navigator.geolocation.watchPosition(updateUserLocation, console.error, {
    enableHighAccuracy: true,
    maximumAge: 1000
  });
}

function updateUserLocation(pos) {
  currentPos = [pos.coords.latitude, pos.coords.longitude];
  userMarker.setLatLng(currentPos);
  map.setView(currentPos);

  checkNearby();
}

function checkNearby() {
  if (!currentPos || questions.length === 0) return;

  for (const q of questions) {
    if (asked.has(q.title)) continue;

    const dist = getDistance(currentPos[0], currentPos[1], q.lat, q.lon);
    if (dist < 20) {
      showQuestion(q);
      return;
    }
  }
}

function showQuestion(q) {
  asked.add(q.title);
  const container = document.getElementById('preguntaContainer');
  const titulo = document.getElementById('tituloLugar');
  const preguntaTexto = document.getElementById('preguntaTexto');
  const respuestas = document.getElementById('respuestas');

  titulo.textContent = q.title;
  preguntaTexto.textContent = q.question;
  respuestas.innerHTML = '';

  q.answers.forEach((resp, i) => {
    const btn = document.createElement('button');
    btn.textContent = resp;
    btn.onclick = () => {
      alert(i === q.correct ? "✅ ¡Correcto!" : "❌ Incorrecto");
      container.classList.add('hidden');
      setTimeout(checkNearby, 1000); // intentar buscar la siguiente
    };
    respuestas.appendChild(btn);
  });

  container.classList.remove('hidden');
}

// Distancia entre dos puntos en metros usando fórmula de Haversine
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
