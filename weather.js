/* ========================================
   🌦️ Weather System
   Dynamic backgrounds based on real weather
======================================== */

class WeatherSystem {
    constructor() {
        this.apiKey = ''; // User needs to add their own API key
        this.currentWeather = null;
        this.effectsContainer = document.getElementById('weather-effects');
        this.particles = [];
        this.lightningInterval = null;
    }

    async fetchWeather(location) {
        // Using Open-Meteo API (free, no API key needed)
        try {
            // First, geocode the location
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location.split(',')[0])}&count=1`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();

            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('Location not found');
            }

            const { latitude, longitude } = geoData.results[0];

            // Fetch weather data
            const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,is_day`;
            const weatherResponse = await fetch(weatherUrl);
            const weatherData = await weatherResponse.json();

            this.currentWeather = {
                temp: Math.round(weatherData.current.temperature_2m),
                code: weatherData.current.weather_code,
                isDay: weatherData.current.is_day === 1,
                description: this.getWeatherDescription(weatherData.current.weather_code),
                icon: this.getWeatherIcon(weatherData.current.weather_code, weatherData.current.is_day === 1)
            };

            this.updateUI();
            this.applyEffects();

            return this.currentWeather;
        } catch (error) {
            console.error('Weather fetch error:', error);
            return null;
        }
    }

    getWeatherDescription(code) {
        const descriptions = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            66: 'Light freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow',
            73: 'Moderate snow',
            75: 'Heavy snow',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with hail',
            99: 'Thunderstorm with heavy hail'
        };
        return descriptions[code] || 'Unknown';
    }

    getWeatherIcon(code, isDay) {
        if (code === 0) return isDay ? '☀️' : '🌙';
        if (code <= 3) return isDay ? '⛅' : '☁️';
        if (code <= 48) return '🌫️';
        if (code <= 67) return '🌧️';
        if (code <= 77) return '❄️';
        if (code <= 82) return '🌦️';
        if (code <= 86) return '🌨️';
        return '⛈️';
    }

    updateUI() {
        if (!this.currentWeather) return;

        const iconEl = document.getElementById('weather-icon');
        const tempEl = document.getElementById('weather-temp');
        const descEl = document.getElementById('weather-desc');

        if (iconEl) iconEl.textContent = this.currentWeather.icon;
        if (tempEl) tempEl.textContent = `${this.currentWeather.temp}°C`;
        if (descEl) descEl.textContent = this.currentWeather.description;
    }

    applyEffects() {
        this.clearEffects();
        if (!this.currentWeather || !this.effectsContainer) return;

        const code = this.currentWeather.code;

        // Rain effects
        if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
            this.createRain(code >= 63 ? 100 : 50);
        }

        // Snow effects
        if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
            this.createSnow(code >= 73 ? 80 : 40);
        }

        // Thunderstorm
        if (code >= 95) {
            this.createRain(120);
            this.createLightning();
        }

        // Update background based on conditions
        this.updateBackground();
    }

    createRain(count) {
        for (let i = 0; i < count; i++) {
            const drop = document.createElement('div');
            drop.className = 'rain-drop';
            drop.style.left = `${Math.random() * 100}%`;
            drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
            drop.style.animationDelay = `${Math.random() * 2}s`;
            this.effectsContainer.appendChild(drop);
            this.particles.push(drop);
        }
    }

    createSnow(count) {
        const snowflakes = ['❄', '❅', '❆', '✻', '✼'];
        for (let i = 0; i < count; i++) {
            const flake = document.createElement('div');
            flake.className = 'snowflake';
            flake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
            flake.style.left = `${Math.random() * 100}%`;
            flake.style.fontSize = `${0.5 + Math.random() * 1}rem`;
            flake.style.animationDuration = `${3 + Math.random() * 4}s`;
            flake.style.animationDelay = `${Math.random() * 5}s`;
            this.effectsContainer.appendChild(flake);
            this.particles.push(flake);
        }
    }

    createLightning() {
        if (this.lightningInterval !== null) {
            clearInterval(this.lightningInterval);
        }
        this.lightningInterval = setInterval(() => {
            if (Math.random() < 0.1) {
                document.body.style.backgroundColor = '#fff';
                setTimeout(() => {
                    document.body.style.backgroundColor = '';
                }, 100);
            }
        }, 2000);
    }

    updateBackground() {
        const body = document.body;
        const code = this.currentWeather.code;
        const isDay = this.currentWeather.isDay;

        // Remove existing weather classes
        body.classList.remove('weather-clear', 'weather-cloudy', 'weather-rain', 'weather-snow', 'weather-storm', 'weather-night');

        if (!isDay) {
            body.classList.add('weather-night');
            body.style.setProperty('--dark-bg', '#050510');
        } else if (code === 0) {
            body.style.setProperty('--dark-bg', '#0a0a1a');
        } else if (code <= 3) {
            body.style.setProperty('--dark-bg', '#0a0a15');
        } else if (code >= 51 && code <= 82) {
            body.style.setProperty('--dark-bg', '#080818');
        } else if (code >= 71 && code <= 86) {
            body.style.setProperty('--dark-bg', '#0a0a12');
        } else if (code >= 95) {
            body.style.setProperty('--dark-bg', '#050515');
        }
    }

    clearEffects() {
        if (this.lightningInterval !== null) {
            clearInterval(this.lightningInterval);
            this.lightningInterval = null;
        }
        this.particles.forEach(p => p.remove());
        this.particles = [];
    }

    getSpeedModifier() {
        // Weather can affect game speed slightly
        if (!this.currentWeather) return 1;

        const code = this.currentWeather.code;
        if (code >= 95) return 0.9; // Storm slows things down
        if (code >= 71 && code <= 86) return 0.95; // Snow slows slightly
        return 1;
    }
}

// Initialize weather system
const weather = new WeatherSystem();

// Country background images (using Unsplash for free images)
const countryBackgrounds = {
    'kyiv,ua': 'kyiv_background.png', // Kyiv, Ukraine
    'london,uk': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80', // London
    'new york,us': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&q=80', // NYC
    'tokyo,jp': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80', // Tokyo
    'paris,fr': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80', // Paris
    'sydney,au': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1920&q=80', // Sydney
    'dubai,ae': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80', // Dubai
    'moscow,ru': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=1920&q=80', // Moscow
    'rio de janeiro,br': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1920&q=80', // Rio
    'cape town,za': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1920&q=80', // Cape Town
    'mumbai,in': 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=1920&q=80', // Mumbai
    'beijing,cn': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1920&q=80', // Beijing
    'cairo,eg': 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1920&q=80' // Cairo pyramids
};

// Country names for display
const countryNames = {
    'kyiv,ua': 'Ukraine',
    'london,uk': 'United Kingdom',
    'new york,us': 'United States',
    'tokyo,jp': 'Japan',
    'paris,fr': 'France',
    'sydney,au': 'Australia',
    'dubai,ae': 'UAE',
    'moscow,ru': 'Russia',
    'rio de janeiro,br': 'Brazil',
    'cape town,za': 'South Africa',
    'mumbai,in': 'India',
    'beijing,cn': 'China',
    'cairo,eg': 'Egypt'
};

// Apply country background
function applyCountryBackground(location) {
    const bgUrl = countryBackgrounds[location];
    const countryName = countryNames[location] || 'Unknown';

    if (bgUrl) {
        document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('${bgUrl}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
    }

    // Update weather description to include country name
    const descEl = document.getElementById('weather-desc');
    if (descEl && weather.currentWeather) {
        descEl.textContent = `${weather.currentWeather.description} in ${countryName}`;
    }
}

// Setup country selector
document.addEventListener('DOMContentLoaded', () => {
    const selector = document.getElementById('country-select');
    if (selector) {
        selector.addEventListener('change', async (e) => {
            const location = e.target.value;
            if (location) {
                applyCountryBackground(location);
                await weather.fetchWeather(location);
                // Update description with country name after weather loads
                const countryName = countryNames[location] || 'Unknown';
                const descEl = document.getElementById('weather-desc');
                if (descEl && weather.currentWeather) {
                    descEl.textContent = `${weather.currentWeather.description} in ${countryName}`;
                }
            }
        });

        // Auto-load default country (United States) on page load
        const defaultLocation = selector.value;
        if (defaultLocation) {
            applyCountryBackground(defaultLocation);
            weather.fetchWeather(defaultLocation).then(() => {
                const countryName = countryNames[defaultLocation] || 'Unknown';
                const descEl = document.getElementById('weather-desc');
                if (descEl && weather.currentWeather) {
                    descEl.textContent = `${weather.currentWeather.description} in ${countryName}`;
                }
            });
        }
    }
});
