/* ========================================
   趣味天氣預報 - JavaScript
   ======================================== */

// DOM 元素
const weatherContainer = document.getElementById('weatherContainer');
const weatherEffects = document.getElementById('weatherEffects');
const countrySelect = document.getElementById('countrySelect');
const searchBtn = document.getElementById('searchBtn');
const weatherCard = document.getElementById('weatherCard');
const loading = document.getElementById('loading');
const weatherInfo = document.getElementById('weatherInfo');
const welcomeMessage = document.getElementById('welcomeMessage');
const funFactText = document.getElementById('funFactText');

// 天氣 Emoji 對照表
const weatherEmoji = {
    'Clear': '☀️',
    'Sunny': '☀️',
    'Partly cloudy': '⛅',
    'Cloudy': '☁️',
    'Overcast': '🌥️',
    'Mist': '🌫️',
    'Fog': '🌫️',
    'Light rain': '🌦️',
    'Rain': '🌧️',
    'Heavy rain': '⛈️',
    'Thunderstorm': '⛈️',
    'Snow': '❄️',
    'Light snow': '🌨️',
    'Heavy snow': '❄️',
    'Sleet': '🌨️',
    'default': '🌤️'
};

// 天氣主題對照
const weatherTheme = {
    'Clear': 'sunny',
    'Sunny': 'sunny',
    'Partly cloudy': 'cloudy',
    'Cloudy': 'cloudy',
    'Overcast': 'cloudy',
    'Rain': 'rainy',
    'Light rain': 'rainy',
    'Heavy rain': 'rainy',
    'Thunderstorm': 'rainy',
    'Drizzle': 'rainy',
    'Snow': 'snowy',
    'Light snow': 'snowy',
    'Heavy snow': 'snowy',
    'default': ''
};

// 天氣小知識
const weatherFacts = {
    'sunny': [
        '☀️ 陽光中的紫外線可以幫助身體製造維生素D！',
        '🌞 太陽表面溫度約5,500°C，但日冕可達200萬°C！',
        '😎 記得塗防曬霜，保護皮膚健康！',
        '🌻 向日葵會追著太陽轉動，這叫做「向日性」！'
    ],
    'cloudy': [
        '☁️ 一朵普通的積雲重量可達50萬公斤！',
        '🌥️ 雲是由無數微小水滴或冰晶組成的',
        '⛅ 雲的種類有十種基本形態',
        '🌫️ 霧其實就是貼近地面的雲！'
    ],
    'rainy': [
        '🌧️ 雨滴的形狀其實更像漢堡包，不是淚珠形！',
        '⛈️ 閃電的溫度可達30,000°C，比太陽表面還熱！',
        '☔ 地球上每秒約有1,800場雷雨正在發生',
        '💧 一滴雨從雲降落到地面約需2分鐘'
    ],
    'snowy': [
        '❄️ 世界上沒有兩片完全相同的雪花！',
        '🌨️ 雪花有六角形結構是因為水分子的排列方式',
        '☃️ 南極洲的雪可以保存100萬年前的空氣！',
        '🏔️ 最大的雪花紀錄是38公分寬！'
    ],
    'default': [
        '🌍 地球大氣層厚度約480公里',
        '🌈 彩虹其實是一個完整的圓，我們通常只能看到一半',
        '🌡️ 有記錄以來最高氣溫是56.7°C（美國死谷）',
        '❄️ 有記錄以來最低氣溫是-89.2°C（南極洲）'
    ]
};

// 中文天氣描述
const weatherDescCN = {
    'Clear': '晴朗',
    'Sunny': '晴天',
    'Partly cloudy': '多雲',
    'Cloudy': '陰天',
    'Overcast': '陰沉',
    'Mist': '薄霧',
    'Fog': '大霧',
    'Light rain': '小雨',
    'Rain': '下雨',
    'Moderate rain': '中雨',
    'Heavy rain': '大雨',
    'Thunderstorm': '雷暴',
    'Light drizzle': '毛毛雨',
    'Drizzle': '細雨',
    'Snow': '下雪',
    'Light snow': '小雪',
    'Heavy snow': '大雪',
    'Sleet': '雨夾雪',
    'Patchy rain possible': '可能有雨',
    'Patchy light rain': '局部小雨',
    'default': '未知'
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    addInitialEffects();
    // 默認加載天氣（因為 HTML 已經 set 咗 value="Shenzhen,CN"）
    if (countrySelect.value) {
        fetchWeather();
    }
});

// 搜尋按鈕事件
searchBtn.addEventListener('click', fetchWeather);

// 選擇框變更時也觸發
countrySelect.addEventListener('change', () => {
    if (countrySelect.value) {
        fetchWeather();
    }
});

// 獲取天氣資料
async function fetchWeather() {
    const city = countrySelect.value;
    
    if (!city) {
        showNotification('請選擇一個城市！');
        return;
    }

    // 顯示 loading
    welcomeMessage.style.display = 'none';
    weatherInfo.style.display = 'none';
    loading.style.display = 'block';

    try {
        // 使用 Open-Meteo API (更穩定，無需 Key)
        // 1. 先用 Geocoding API 搵座標
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.split(',')[0])}&count=1&language=zh&format=json`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('找不到城市');
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // 2. 再用 Weather API 獲取天氣
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
        
        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        displayWeather(weatherData, name, country);
        
    } catch (error) {
        console.error('Error:', error);
        loading.style.display = 'none';
        // welcomeMessage.style.display = 'block'; // 已刪除
        showNotification('獲取天氣失敗，請稍後再試！');
    }
}

// 天氣代碼轉換 (Open-Meteo WMO Code -> Emoji & Desc)
const wmoCodeToEmoji = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌧️', 55: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '⛈️',
    71: '🌨️', 73: '❄️', 75: '❄️',
    80: '🌦️', 81: '🌧️', 82: '⛈️',
    95: '⛈️', 96: '⛈️', 99: '⛈️'
};

const wmoCodeToDesc = {
    0: '晴朗', 1: '大致晴朗', 2: '多雲', 3: '陰天',
    45: '霧', 48: '結霜霧',
    51: '毛毛雨', 53: '中雨', 55: '大雨',
    61: '小雨', 63: '中雨', 65: '大雨',
    71: '小雪', 73: '中雪', 75: '大雪',
    80: '陣雨', 81: '中陣雨', 82: '暴雨',
    95: '雷雨', 96: '雷雨伴冰雹', 99: '重雷雨'
};

function displayWeather(data, cityName, countryName) {
    const current = data.current;
    const daily = data.daily;
    
    // 更新 DOM
    document.getElementById('temperature').textContent = Math.round(current.temperature_2m);
    
    const code = current.weather_code;
    document.getElementById('weatherDesc').textContent = wmoCodeToDesc[code] || '未知';
    document.getElementById('locationName').textContent = `${cityName}, ${countryName}`;
    
    document.getElementById('wind').textContent = `${current.wind_speed_10m} km/h`;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('feelsLike').textContent = `${Math.round(current.apparent_temperature)}°C`;
    
    // Open-Meteo 沒直接提供能見度，這裡用雲量稍微模擬一下或者隱藏
    const visibilityText = current.cloud_cover > 80 ? '低' : '高';
    document.getElementById('visibility').textContent = visibilityText;

    // 更新圖標
    const emoji = wmoCodeToEmoji[code] || '🌤️';
    document.getElementById('weatherIcon').textContent = emoji;

    // 更新動效主題 (Mapping WMO code to simple theme)
    // Simple mapping logic here...
    let themeDesc = 'Clear';
    if (code > 2) themeDesc = 'Cloudy';
    if (code >= 50) themeDesc = 'Rain';
    if (code >= 70) themeDesc = 'Snow';
    updateTheme(themeDesc); // Reuse existing theme logic
    updateWeatherEffects(themeDesc);

    // 顯示資訊
    loading.style.display = 'none';
    weatherInfo.style.display = 'block';

    // 顯示預報
    displayForecast(daily);
}

function displayForecast(daily) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = ''; 

    // Open-Meteo returns array of values
    for(let i=0; i<daily.time.length; i++) {
        if (i >= 5) break; // 只顯示未來 5 天

        const dateStr = daily.time[i].slice(5).replace('-', '/'); // "02-02" -> "02/02"
        const max = Math.round(daily.temperature_2m_max[i]);
        const min = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weather_code[i];
        const emoji = wmoCodeToEmoji[code] || '🌤️';

        const item = document.createElement('div');
        item.className = 'forecast-item';
        item.innerHTML = `
            <div class="forecast-date">${i === 0 ? '今天' : dateStr}</div>
            <div class="forecast-icon">${emoji}</div>
            <div class="forecast-temp">${max}° / ${min}°</div>
        `;
        forecastContainer.appendChild(item);
    }
}

// 更新主題
function updateTheme(weatherDesc) {
    // 移除所有主題 class
    weatherContainer.classList.remove('sunny', 'cloudy', 'rainy', 'snowy', 'night');
    
    // 判斷是否夜晚（簡單判斷：根據當地時間）
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 18;
    
    if (isNight && (weatherDesc.includes('Clear') || weatherDesc.includes('Sunny'))) {
        weatherContainer.classList.add('night');
    } else {
        const theme = weatherTheme[weatherDesc] || weatherTheme['default'];
        if (theme) {
            weatherContainer.classList.add(theme);
        }
    }
}

// 更新天氣動效
function updateWeatherEffects(weatherDesc) {
    // 清除現有動效
    weatherEffects.innerHTML = '';
    
    const desc = weatherDesc.toLowerCase();
    
    if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('thunderstorm')) {
        createRainEffect();
    } else if (desc.includes('snow') || desc.includes('sleet')) {
        createSnowEffect();
    } else if (desc.includes('clear') || desc.includes('sunny')) {
        createSunEffect();
    } else if (desc.includes('cloud') || desc.includes('overcast')) {
        createCloudEffect();
    }
}

// 創建雨滴效果
function createRainEffect() {
    const rainCount = 100;
    
    for (let i = 0; i < rainCount; i++) {
        const drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        drop.style.opacity = Math.random() * 0.5 + 0.3;
        weatherEffects.appendChild(drop);
    }
}

// 創建雪花效果
function createSnowEffect() {
    const snowCount = 50;
    const snowflakes = ['❄', '❅', '❆', '✦', '✧'];
    
    for (let i = 0; i < snowCount; i++) {
        const flake = document.createElement('div');
        flake.className = 'snowflake';
        flake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
        flake.style.left = `${Math.random() * 100}%`;
        flake.style.fontSize = `${0.8 + Math.random() * 1.2}rem`;
        flake.style.animationDuration = `${3 + Math.random() * 4}s`;
        flake.style.animationDelay = `${Math.random() * 3}s`;
        weatherEffects.appendChild(flake);
    }
}

// 創建 CSS 雲朵效果 (更真實)
function createCloudEffect() {
    const cloudCount = 4;
    
    for (let i = 0; i < cloudCount; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'css-cloud';
        // 隨機位置同大細
        const topPos = Math.random() * 40;
        const scale = 0.5 + Math.random();
        const duration = 40 + Math.random() * 40;
        
        cloud.style.top = `${topPos}%`;
        cloud.style.transform = `scale(${scale})`;
        cloud.style.animationDuration = `${duration}s`;
        cloud.style.animationDelay = `${-Math.random() * 60}s`; // 隨機開始時間
        
        weatherEffects.appendChild(cloud);
    }
}

// 創建太陽光暈 (Lens Flare)
function createSunEffect() {
    const sun = document.createElement('div');
    sun.className = 'sun-flare';
    weatherEffects.appendChild(sun);
}

// 添加初始效果
function addInitialEffects() {
    // 預設加少少雲
    createCloudEffect();
}

// 更新趣味小知識
function updateFunFact(weatherDesc) {
    let category = 'default';
    const desc = weatherDesc.toLowerCase();
    
    if (desc.includes('clear') || desc.includes('sunny')) {
        category = 'sunny';
    } else if (desc.includes('cloud') || desc.includes('overcast')) {
        category = 'cloudy';
    } else if (desc.includes('rain') || desc.includes('thunder') || desc.includes('drizzle')) {
        category = 'rainy';
    } else if (desc.includes('snow') || desc.includes('sleet')) {
        category = 'snowy';
    }
    
    const facts = weatherFacts[category];
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    
    funFactText.style.opacity = '0';
    setTimeout(() => {
        funFactText.textContent = randomFact;
        funFactText.style.opacity = '1';
        funFactText.style.transition = 'opacity 0.5s ease';
    }, 300);
}

// 簡單通知
function showNotification(message) {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-size: 1rem;
        z-index: 1000;
        animation: slideDown 0.3s ease;
    `;
    
    // 添加動畫樣式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // 3秒後移除
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
