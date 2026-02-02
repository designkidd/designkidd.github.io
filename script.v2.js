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
        // 使用 wttr.in API（免費，無需 API key）
        const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
        
        if (!response.ok) {
            throw new Error('無法獲取天氣資料');
        }

        const data = await response.json();
        displayWeather(data);
        
    } catch (error) {
        console.error('Error:', error);
        loading.style.display = 'none';
        welcomeMessage.style.display = 'block';
        showNotification('獲取天氣失敗，請稍後再試！');
    }
}

// 顯示天氣資料
function displayWeather(data) {
    const current = data.current_condition[0];
    const location = data.nearest_area[0];
    
    // 取得天氣描述
    const weatherDesc = current.weatherDesc[0].value;
    const descCN = weatherDescCN[weatherDesc] || weatherDescCN['default'];
    
    // 更新 DOM
    document.getElementById('temperature').textContent = current.temp_C;
    document.getElementById('weatherDesc').textContent = descCN;
    document.getElementById('locationName').textContent = 
        `${location.areaName[0].value}, ${location.country[0].value}`;
    document.getElementById('wind').textContent = `${current.windspeedKmph} km/h`;
    document.getElementById('humidity').textContent = `${current.humidity}%`;
    document.getElementById('feelsLike').textContent = `${current.FeelsLikeC}°C`;
    document.getElementById('visibility').textContent = `${current.visibility} km`;
    
    // 更新天氣圖標
    const emoji = weatherEmoji[weatherDesc] || weatherEmoji['default'];
    document.getElementById('weatherIcon').textContent = emoji;
    
    // 更新主題
    updateTheme(weatherDesc);
    
    // 更新天氣動效
    updateWeatherEffects(weatherDesc);
    
    // 更新趣味小知識
    updateFunFact(weatherDesc);
    
    // 顯示天氣資訊
    loading.style.display = 'none';
    weatherInfo.style.display = 'block';
    
    // 添加動畫
    weatherInfo.style.animation = 'none';
    setTimeout(() => {
        weatherInfo.style.animation = 'bounceIn 0.5s ease';
    }, 10);

    // 顯示未來天氣預報
    if (data.weather) {
        displayForecast(data.weather);
    }
}

// 顯示未來預報
function displayForecast(forecastData) {
    const forecastContainer = document.getElementById('forecastContainer');
    forecastContainer.innerHTML = ''; // 清空舊資料

    // 遍歷預報數據（通常 wttr.in 返回 3 天）
    forecastData.forEach((day, index) => {
        // 跳過今天（如果只想要未來幾天，可以 index > 0，但通常用戶也想看今天整體預報）
        // 這裡顯示所有可用天數
        
        const dateObj = new Date(day.date);
        // 格式化日期 (e.g., 2/2)
        const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
        
        // 獲取當天最高/最低溫
        const maxTemp = day.maxtempC;
        const minTemp = day.mintempC;
        
        // 獲取當天中午的天氣描述 (hourly 中間的數據，通常 index 4 是 12:00)
        // wttr.in hourly array usually has 3-hour intervals: 0, 300, 600, 900, 1200...
        const middayWeather = day.hourly[4]; 
        const weatherDesc = middayWeather.weatherDesc[0].value;
        const emoji = weatherEmoji[weatherDesc] || weatherEmoji['default'];
        const descCN = weatherDescCN[weatherDesc] || weatherDescCN['default'];

        // 創建預報卡片 (List Item)
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-date">${index === 0 ? '今天' : dateStr}</div>
            <div class="forecast-icon">${emoji}</div>
            <div class="forecast-temp">${maxTemp}° / ${minTemp}°</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
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

// 創建太陽效果
function createSunEffect() {
    const sunray = document.createElement('div');
    sunray.className = 'sunray';
    weatherEffects.appendChild(sunray);
}

// 創建雲朵效果
function createCloudEffect() {
    const cloudCount = 5;
    
    for (let i = 0; i < cloudCount; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'floating-cloud';
        cloud.textContent = Math.random() > 0.5 ? '☁️' : '⛅';
        cloud.style.top = `${10 + Math.random() * 30}%`;
        cloud.style.animationDuration = `${15 + Math.random() * 20}s`;
        cloud.style.animationDelay = `${-Math.random() * 20}s`;
        cloud.style.fontSize = `${3 + Math.random() * 3}rem`;
        weatherEffects.appendChild(cloud);
    }
}

// 添加初始效果
function addInitialEffects() {
    // 添加幾朵漂浮的雲
    for (let i = 0; i < 3; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'floating-cloud';
        cloud.textContent = '☁️';
        cloud.style.top = `${15 + i * 20}%`;
        cloud.style.animationDuration = `${20 + i * 5}s`;
        cloud.style.animationDelay = `${-i * 7}s`;
        cloud.style.opacity = '0.3';
        weatherEffects.appendChild(cloud);
    }
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
