let map;
let geocoder;
let autocomplete;
let currentMarker;
let currentLanguage = 'en';


// Translation objects
const translations = {
  en: {
    title: "RentWise",
    "description-bold": "Discover what it's like to rent at any location.",
    "description-text": "Type in an address or click directly on the map to explore key insights about safety, accessibility, and lifestyle —— so you can make informed housing decisions with confidence.",
    "search-placeholder": "Search for an address...",
    safety: "Safety",
    accessibility: "Accessibility",
    convenience: "Convenience & Lifestyle",
    "location-not-found": "Location not found.",
    "error-getting-analysis": "Error getting location analysis. Please try again.",
    "location-not-found-status": "Location not found: ",
    "demo-analysis": "This is a demo analysis. Please configure your OpenAI API key for real analysis.",
    "accessibility-demo": "Accessibility analysis would appear here with a valid API key.",
    "convenience-demo": "Convenience and lifestyle analysis would be provided here."
  },
  zh: {
    title: "租房智选",
    "description-bold": "发现任何地点的租房体验。",
    "description-text": "输入地址或直接点击地图，探索关于安全性、便利性和生活方式的深度洞察——让您做出明智的住房决策。",
    "search-placeholder": "搜索地址...",
    safety: "安全性",
    accessibility: "便利性",
    convenience: "便利与生活",
    "location-not-found": "未找到位置。",
    "error-getting-analysis": "获取位置分析时出错。请重试。",
    "location-not-found-status": "未找到位置：",
    "demo-analysis": "这是演示分析。请配置您的OpenAI API密钥以获取真实分析。",
    "accessibility-demo": "使用有效的API密钥后，便利性分析将在此处显示。",
    "convenience-demo": "便利性和生活方式分析将在此处提供。"
  },
  es: {
    title: "RentWise",
    "description-bold": "Descubre cómo es alquilar en cualquier ubicación.",
    "description-text": "Escribe una dirección o haz clic directamente en el mapa para explorar información clave sobre seguridad, accesibilidad y estilo de vida —— para que puedas tomar decisiones de vivienda informadas con confianza.",
    "search-placeholder": "Buscar una dirección...",
    safety: "Seguridad",
    accessibility: "Accesibilidad",
    convenience: "Conveniencia y Estilo de Vida",
    "location-not-found": "Ubicación no encontrada.",
    "error-getting-analysis": "Error al obtener el análisis de ubicación. Por favor, inténtalo de nuevo.",
    "location-not-found-status": "Ubicación no encontrada: ",
    "demo-analysis": "Este es un análisis de demostración. Por favor, configura tu clave API de OpenAI para un análisis real.",
    "accessibility-demo": "El análisis de accesibilidad aparecería aquí con una clave API válida.",
    "convenience-demo": "El análisis de conveniencia y estilo de vida se proporcionaría aquí."
  }
};

// Language switching functions
function switchLanguage(lang) {
  console.log('Switching to language:', lang);
  currentLanguage = lang;
  
  // Update HTML lang attribute
  document.documentElement.lang = lang;
  
  // Update all elements with data-translate attribute
  document.querySelectorAll('[data-translate]').forEach(element => {
    const key = element.getAttribute('data-translate');
    if (translations[lang] && translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });
  
  // Update placeholder attributes
  document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
    const key = element.getAttribute('data-translate-placeholder');
    if (translations[lang] && translations[lang][key]) {
      element.placeholder = translations[lang][key];
    }
  });
  
  // Update page title
  document.title = translations[lang].title;
  
  // Store language preference
  localStorage.setItem('rentwise-language', lang);
  
  // Update language selector
  document.getElementById('language-select').value = lang;
  
  console.log('Language switched to:', currentLanguage);
}

// Initialize language on page load
function initializeLanguage() {
  const savedLanguage = localStorage.getItem('rentwise-language') || 'en';
  console.log('Initializing language:', savedLanguage);
  switchLanguage(savedLanguage);
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 37.7749, lng: -122.4194 }, // Default: San Francisco
    zoom: 12,
  });
  geocoder = new google.maps.Geocoder();
  autocomplete = new google.maps.places.Autocomplete(document.getElementById('search-input'));

  // Initialize marker as draggable
  currentMarker = new google.maps.Marker({
    map,
    position: { lat: 37.7749, lng: -122.4194 },
    draggable: true,
    visible: false // Initially hidden until a location is selected
  });

  // Add listener for marker drag end
  currentMarker.addListener('dragend', function() {
    const position = currentMarker.getPosition();
    // Reverse geocode the new position
    geocoder.geocode({ location: position }, (results, status) => {
      if (status === 'OK' && results[0]) {
        // Update search input with new address
        document.getElementById('search-input').value = results[0].formatted_address;
        // Get analysis for new location
        getLocationAnalysis(results[0].formatted_address);
      }
    });
  });

  // Add listener for map click
  map.addListener('click', function(event) {
    const latLng = event.latLng;
    currentMarker.setPosition(latLng);
    currentMarker.setVisible(true);
    // Reverse geocode the clicked position
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results[0]) {
        document.getElementById('search-input').value = results[0].formatted_address;
        getLocationAnalysis(results[0].formatted_address);
      }
    });
  });

  autocomplete.addListener('place_changed', function() {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      map.setCenter(place.geometry.location);
      currentMarker.setPosition(place.geometry.location);
      currentMarker.setVisible(true);
      // Get location analysis when a place is selected
      getLocationAnalysis(place.formatted_address);
    } else {
      alert(translations[currentLanguage]['location-not-found']);
    }
  });
}

// Front-end function: safely call Cloudflare Function instead of OpenAI directly
async function getLocationAnalysis(address) {
  console.log('=== Starting location analysis ===');
  console.log('Current language:', currentLanguage);
  console.log('Address:', address);

  const fallbackAnalysis = {
    safety: { rating: 3, description: translations[currentLanguage]['demo-analysis'] },
    accessibility: { rating: 3, description: translations[currentLanguage]['accessibility-demo'] },
    convenience: { rating: 3, description: translations[currentLanguage]['convenience-demo'] }
  };

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, language: currentLanguage })
    });

    const data = await res.json();

    if (data.error) {
      console.error('Server error:', data.error);
      updateRatings(data.fallback || fallbackAnalysis);
      return;
    }

    // Expected JSON structure:
    // { safety: {description, rating}, accessibility: {...}, convenience: {...} }
    updateRatings(data);
  } catch (err) {
    console.error('Network or JSON error:', err);
    updateRatings(fallbackAnalysis);
  }
}


function updateRatings(analysis) {
  console.log('Updating ratings with analysis:', analysis);
  
  // Update Safety
  document.getElementById('safety-description').textContent = analysis.safety.description;
  updateStars('safety-stars', analysis.safety.rating);

  // Update Accessibility
  document.getElementById('accessibility-description').textContent = analysis.accessibility.description;
  updateStars('accessibility-stars', analysis.accessibility.rating);

  // Update Convenience
  document.getElementById('convenience-description').textContent = analysis.convenience.description;
  updateStars('convenience-stars', analysis.convenience.rating);
}

function updateStars(elementId, rating) {
  const starsContainer = document.getElementById(elementId);
  starsContainer.innerHTML = '';
  
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = `star ${i <= rating ? 'filled' : ''}`;
    star.innerHTML = '★';
    starsContainer.appendChild(star);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...');
  
  // Initialize language
  initializeLanguage();
  
  // Add language switcher event listener
  document.getElementById('language-select').addEventListener('change', function(e) {
    console.log('Language selector changed to:', e.target.value);
    switchLanguage(e.target.value);
  });
  
  const input = document.getElementById('search-input');
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      geocodeAddress(input.value);
    }
  });
});

function geocodeAddress(address) {
  if (!geocoder) return;
  geocoder.geocode({ address }, (results, status) => {
    if (status === 'OK' && results[0]) {
      map.setCenter(results[0].geometry.location);
      currentMarker.setPosition(results[0].geometry.location);
      currentMarker.setVisible(true);
      // Get location analysis when address is geocoded
      getLocationAnalysis(results[0].formatted_address);
    } else {
      alert(translations[currentLanguage]['location-not-found-status'] + status);
    }
  });
} 