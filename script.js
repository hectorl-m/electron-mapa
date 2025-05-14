let map, userMarker, questions = [], asked = new Set(), currentPos = null;

// Arrancar el mapa y la geolocalización al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  initMap();
  // Si se selecciona municipio más adelante, cargará las preguntas
  document.getElementById('municipioSelect').addEventListener('change', onMunicipioChange);
});

function onMunicipioChange(e) {
  const municipio = e.target.value;
  if (!municipio) {
    document.getElementById('infoDistancia').textContent = 'Selecciona un municipio para comenzar…';
    questions = [];
    return;
  }
  loadQuestions(municipio);
}

async function loadQuestions(municipio) {
  try {
    document.getElementById('infoDistancia').textContent = 'Cargando preguntas…';
    const res = await fetch(`data/${municipio}.json`);
    questions = await res.json();
    asked.clear();
    document.getElementById('infoDistancia').textContent = 'Calculando distancia al punto más cercano…';
    // Al cargar nuevas preguntas, recalcular inmediatamente
    if (currentPos) checkNearby();
  } catch (err) {
    console.error(err);
    alert('Error al cargar las preguntas del municipio.');
  }
}

function initMap() {
  map = L.map('map').setView([38.79, 0.17], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  userMarker = L.marker([0, 0]).addTo(map).bindPopup("Tú estás aquí");

  navigator.geolocation.watchPosition(
    pos => {
      currentPos = [pos.coords.latitude, pos.coords.longitude];
      userMarker.setLatLng(currentPos);
      map.setView(currentPos);
      // Solo si ya hay preguntas cargadas
      if (questions.length > 0) checkNearby();
      else document.getElementById('infoDistancia').textContent = 'Selecciona un municipio para comenzar…';
    },
    err => {
      console.error(err);
      document.getElementById('infoDistancia').textContent = 'Error al obtener ubicación.';
    },
    { enableHighAccuracy: true, maximumAge: 1000 }
  );
}

function checkNearby() {
  let nearest = null;
  let nearestDist = Infinity;

  for (const q of questions) {
    if (asked.has(q.title)) continue;
    const dist = getDistance(currentPos[0], currentPos[1], q.lat, q.lon);
    if (dist < nearestDist) {
      nearest = q;
      nearestDist = dist;
    }
  }

  const info = document.getElementById('infoDistancia');
  if (!nearest) {
    info.textContent = "No hay más preguntas disponibles.";
    return;
  }

  info.textContent = `Estás a ${Math.round(nearestDist)} m de: ${nearest.title}`;
  if (nearestDist < 20) {
    showQuestion(nearest);
  }
}

function showQuestion(q) {
  asked.add(q.title);
  const c = document.getElementById('preguntaContainer');
  document.getElementById('tituloLugar').textContent = q.title;
  document.getElementById('preguntaTexto').textContent = q.question;

  const respDiv = document.getElementById('respuestas');
  respDiv.innerHTML = '';
  q.answers.forEach((a, i) => {
    const btn = document.createElement('button');
    btn.textContent = a;
    btn.onclick = () => {
      alert(i === q.correct ? '✅ ¡Correcto!' : '❌ Incorrecto');
      c.classList.add('hidden');
      // Revisa de nuevo tras un segundo
      setTimeout(checkNearby, 1000);
    };
    respDiv.appendChild(btn);
  });
  c.classList.remove('hidden');
}

// Haversine: distancia en metros
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3, φ = Math.PI/180;
  const dφ = (lat2 - lat1) * φ;
  const dλ = (lon2 - lon1) * φ;
  const a = Math.sin(dφ/2) ** 2 + Math.cos(lat1*φ) * Math.cos(lat2*φ) * Math.sin(dλ/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
