const apiKey = '2568fa20d19243fda1c174135262704';
let clockInterval;
let currentLang = 'ko'; 
let lastWeatherData = null; 

// LANGUAGE TOGGLE 
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('vibeLang', lang);

  document.getElementById('btnKO').classList.toggle('active-lang', lang === 'ko');
  document.getElementById('btnEN').classList.toggle('active-lang', lang === 'en');
  document.documentElement.lang = lang === 'ko' ? 'ko' : 'en';

  document.querySelectorAll('[data-ko]').forEach(el => {
    if (el.tagName === 'INPUT') {
      el.placeholder = el.getAttribute('data-placeholder-' + lang) || el.getAttribute('data-' + lang);
    } else {
      el.textContent = el.getAttribute('data-' + lang);
    }
  });

  
  const inp = document.getElementById('cityInput');
  if (inp) inp.placeholder = lang === 'ko' ? '어디 날씨가 궁금해요?' : 'Where to?';

  if (lastWeatherData) renderWeather(lastWeatherData, false);
}

    //  SOUNDS
const sounds = {
  click:  new Audio('assets/sound/click.mp3'),
  hover:  new Audio('assets/sound/chime.mp3'),
  night:  new Audio('assets/sound/night.mp3'),
  rain:   new Audio('assets/sound/rain.mp3'),
  sunny:  new Audio('assets/sound/sunny.mp3'),
  winter: new Audio('assets/sound/winter.mp3'),
};
sounds.night.loop  = true;
sounds.rain.loop   = true;
sounds.sunny.loop  = true;
sounds.winter.loop = true;

let currentAmbient = null;
let isMuted = true;

function playAmbient(name) {
  if (currentAmbient && currentAmbient === sounds[name] && !currentAmbient.paused) return;
  if (currentAmbient) { currentAmbient.pause(); currentAmbient.currentTime = 0; }
  currentAmbient = sounds[name];
  currentAmbient.volume = 0.3;
  if (!isMuted) currentAmbient.play().catch(e => console.log('Audio blocked:', e));
}

function playHover() {
  if (isMuted) return;
  sounds.hover.currentTime = 0;
  sounds.hover.volume = 0.8;
  sounds.hover.play().catch(() => {});
}

window.addEventListener('load', () => {
  
  const saved = localStorage.getItem('vibeLang');
  if (saved) setLang(saved);

  const btn = document.getElementById('soundBtn');
  if (!btn) return;
  btn.onclick = () => {
    isMuted = !isMuted;
    btn.innerText = isMuted ? '🔇' : '🔊';
    if (isMuted) {
      if (currentAmbient) { currentAmbient.pause(); currentAmbient.currentTime = 0; }
    } else {
      sounds.click.currentTime = 0;
      sounds.click.play().catch(() => {});
      if (currentAmbient) currentAmbient.play().catch(e => console.log(e));
    }
  };
});

    //  UTILITIES 
function showHistory() {
  const saved = localStorage.getItem('lastVibe');
  if (saved) {
    const data = JSON.parse(saved);
    const el = document.getElementById('lastCity');
    if (el) el.innerText = `${data.city} (${data.temp})`;
    document.getElementById('prevSearch').classList.remove('hidden');
  }
}

function updateLiveClock(tzId, currentTemp = null) {
  const tick = () => {
    const now = new Date();
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: tzId }));
    const hours = localTime.getHours();
    const mins  = localTime.getMinutes().toString().padStart(2, '0');

    let greeting;
    if (currentLang === 'ko') {
      greeting = hours < 12 ? "좋은 아침이에요 ☕" : hours < 17 ? "편안한 오후 보내고 있나요 ☀️" : "오늘 하루도 수고했어요 🌙";
      if (currentTemp !== null) {
        if (currentTemp > 28) greeting = "많이 더워요 시원하게 쉬어가요 🧊";
        else if (currentTemp < 10) greeting = "쌀쌀해요 따뜻하게 챙겨요 🧣";
      }
    } else {
      greeting = hours < 12 ? "Good Morning ☕" : hours < 17 ? "Good Afternoon ☀️" : "Good Evening 🌙";
      if (currentTemp !== null) {
        if (currentTemp > 28) greeting = "Stay Cool! 🧊";
        else if (currentTemp < 10) greeting = "Stay Warm! 🧣";
      }
    }

    const greetingEl = document.getElementById('greeting');
    const clockEl    = document.getElementById('liveClock');
    if (greetingEl) greetingEl.innerText = greeting;
    if (clockEl)    clockEl.innerText    = `${hours.toString().padStart(2, '0')}:${mins}`;
  };
  tick();
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(tick, 1000);
}

function updateDynamicBackground(hour) {
  const video   = document.getElementById('bgVideo');
  const overlay = document.querySelector('.overlay-glow');
  if (!video) return;
  let videoSrc = "assets/images/night.mp4";
  let glow     = "radial-gradient(circle, transparent, rgba(0,0,0,0.7))";
  if      (hour >= 5  && hour < 11) { videoSrc = "assets/images/morning.mp4";   glow = "radial-gradient(circle, rgba(255,223,0,0.1), rgba(0,0,0,0.4))"; }
  else if (hour >= 11 && hour < 17) { videoSrc = "assets/images/afternoon.mp4"; glow = "radial-gradient(circle, rgba(255,255,255,0.05), rgba(0,0,0,0.4))"; }
  else if (hour >= 17 && hour < 20) { videoSrc = "assets/images/evening.mp4";   glow = "radial-gradient(circle, rgba(255,69,0,0.15), rgba(0,0,0,0.5))"; }
  if (!video.src.includes(videoSrc)) {
    video.src = videoSrc;
    if (overlay) overlay.style.background = glow;
    video.load();
    video.play().catch(e => console.log("Video play error:", e));
  }
}

//  KOREAN CITY → COORDINATES MAP 
const koreanCityCoords = {
  "서울": "37.5665,126.9780", "서울시": "37.5665,126.9780",
  "강남": "37.5172,127.0473", "강남구": "37.5172,127.0473",
  "강북": "37.6396,127.0255", "강북구": "37.6396,127.0255",
  "강서구": "37.5509,126.8495", "강동구": "37.5301,127.1238",
  "관악구": "37.4784,126.9516", "광진구": "37.5385,127.0823",
  "구로구": "37.4955,126.8877", "금천구": "37.4604,126.9002",
  "노원구": "37.6543,127.0568", "도봉구": "37.6688,127.0472",
  "동대문구": "37.5744,127.0395", "동작구": "37.5124,126.9393",
  "마포구": "37.5638,126.9084", "서대문구": "37.5791,126.9368",
  "서초구": "37.4837,127.0324", "성동구": "37.5633,127.0368",
  "성북구": "37.5894,127.0167", "송파구": "37.5145,127.1059",
  "양천구": "37.5270,126.8563", "영등포구": "37.5262,126.8963",
  "용산구": "37.5324,126.9901", "은평구": "37.6027,126.9291",
  "종로구": "37.5730,126.9794", "중구": "37.5641,126.9979",
  "중랑구": "37.6063,127.0927",
  "수원": "37.2636,127.0286", "수원시": "37.2636,127.0286",
  "성남": "37.4449,127.1388", "성남시": "37.4449,127.1388",
  "분당": "37.3825,127.1175",
  "고양": "37.6583,126.8320", "고양시": "37.6583,126.8320",
  "일산": "37.7219,126.7153",
  "용인": "37.2411,127.1776", "용인시": "37.2411,127.1776",
  "부천": "37.5034,126.7660", "부천시": "37.5034,126.7660",
  "안산": "37.3219,126.8309", "안산시": "37.3219,126.8309",
  "안양": "37.3943,126.9568", "안양시": "37.3943,126.9568",
  "남양주": "37.6360,127.2165", "남양주시": "37.6360,127.2165",
  "화성": "37.1994,126.8316", "화성시": "37.1994,126.8316",
  "평택": "36.9921,127.1130", "평택시": "36.9921,127.1130",
  "시흥": "37.3800,126.8031", "시흥시": "37.3800,126.8031",
  "파주": "37.8601,126.7874", "파주시": "37.8601,126.7874",
  "의정부": "37.7381,127.0438", "의정부시": "37.7381,127.0438",
  "김포": "37.6154,126.7158", "김포시": "37.6154,126.7158",
  "광주": "37.4294,127.2550", "광주시": "37.4294,127.2550",
  "하남": "37.5395,127.2148", "하남시": "37.5395,127.2148",
  "광명": "37.4784,126.8647", "광명시": "37.4784,126.8647",
  "군포": "37.3612,126.9352", "군포시": "37.3612,126.9352",
  "오산": "37.1499,127.0772", "오산시": "37.1499,127.0772",
  "이천": "37.2724,127.4348", "이천시": "37.2724,127.4348",
  "양주": "37.7853,127.0458", "양주시": "37.7853,127.0458",
  "구리": "37.5943,127.1295", "구리시": "37.5943,127.1295",
  "안성": "37.0079,127.2798", "안성시": "37.0079,127.2798",
  "포천": "37.8948,127.2002", "포천시": "37.8948,127.2002",
  "의왕": "37.3448,126.9686", "의왕시": "37.3448,126.9686",
  "여주": "37.2982,127.6378", "여주시": "37.2982,127.6378",
  "동두천": "37.9036,127.0607", "동두천시": "37.9036,127.0607",
  "과천": "37.4292,126.9876", "과천시": "37.4292,126.9876",
  "가평": "37.8316,127.5111", "가평군": "37.8316,127.5111",
  "양평": "37.4916,127.4875", "양평군": "37.4916,127.4875",
  "연천": "38.0967,127.0747", "연천군": "38.0967,127.0747",
  "인천": "37.4563,126.7052", "인천시": "37.4563,126.7052",
  "부평구": "37.5077,126.7218", "계양구": "37.5375,126.7378",
  "남동구": "37.4469,126.7314", "연수구": "37.4104,126.6780",
  "미추홀구": "37.4638,126.6503",
  "강화": "37.7474,126.4875", "강화군": "37.7474,126.4875",
  "옹진군": "37.4461,126.3678",
  "부산": "35.1796,129.0756", "부산시": "35.1796,129.0756",
  "해운대": "35.1628,129.1636", "해운대구": "35.1628,129.1636",
  "수영구": "35.1452,129.1133",
  "금정구": "35.2430,129.0909", "기장군": "35.2445,129.2225",
  "동래구": "35.2051,129.0861", "부산진구": "35.1628,129.0531",
  "사상구": "35.1526,128.9924", "사하구": "35.1045,128.9742",
  "연제구": "35.1760,129.0793", "영도구": "35.0893,129.0680",
  "대구": "35.8714,128.6014", "대구시": "35.8714,128.6014",
  "달서구": "35.8299,128.5328", "달성군": "35.7746,128.4312",
  "수성구": "35.8580,128.6300",
  "광주광역시": "35.1595,126.8526",
  "광산구": "35.1396,126.7937",
  "대전": "36.3504,127.3845", "대전시": "36.3504,127.3845",
  "유성구": "36.3624,127.3564",
  "울산": "35.5384,129.3114", "울산시": "35.5384,129.3114",
  "울주군": "35.5226,129.1595",
  "세종": "36.4800,127.2890", "세종시": "36.4800,127.2890",
  "춘천": "37.8813,127.7298", "춘천시": "37.8813,127.7298",
  "원주": "37.3422,127.9202", "원주시": "37.3422,127.9202",
  "강릉": "37.7519,128.8761", "강릉시": "37.7519,128.8761",
  "동해": "37.5245,129.1144", "동해시": "37.5245,129.1144",
  "태백": "37.1641,128.9857", "태백시": "37.1641,128.9857",
  "속초": "38.2070,128.5912", "속초시": "38.2070,128.5912",
  "삼척": "37.4497,129.1658", "삼척시": "37.4497,129.1658",
  "청주": "36.6424,127.4890", "청주시": "36.6424,127.4890",
  "충주": "36.9910,127.9259", "충주시": "36.9910,127.9259",
  "제천": "37.1324,128.1911", "제천시": "37.1324,128.1911",
  "천안": "36.8151,127.1139", "천안시": "36.8151,127.1139",
  "공주": "36.4468,127.1191", "공주시": "36.4468,127.1191",
  "전주": "35.8242,127.1479", "전주시": "35.8242,127.1479",
  "군산": "35.9676,126.7368", "군산시": "35.9676,126.7368",
  "익산": "35.9483,126.9578", "익산시": "35.9483,126.9578",
  "목포": "34.8118,126.3922", "목포시": "34.8118,126.3922",
  "여수": "34.7604,127.6622", "여수시": "34.7604,127.6622",
  "순천": "34.9506,127.4875", "순천시": "34.9506,127.4875",
  "포항": "36.0190,129.3435", "포항시": "36.0190,129.3435",
  "경주": "35.8562,129.2247", "경주시": "35.8562,129.2247",
  "안동": "36.5684,128.7294", "안동시": "36.5684,128.7294",
  "구미": "36.1195,128.3446", "구미시": "36.1195,128.3446",
  "창원": "35.2280,128.6811", "창원시": "35.2280,128.6811",
  "진주": "35.1799,128.1076", "진주시": "35.1799,128.1076",
  "김해": "35.2341,128.8813", "김해시": "35.2341,128.8813",
  "제주": "33.4996,126.5312", "제주시": "33.4996,126.5312",
  "서귀포": "33.2541,126.5600", "서귀포시": "33.2541,126.5600",
};

// CONDITION CODE → ICON 
function getWeatherIcon(conditionCode, conditionText, isDay) {
  const isThunder  = conditionCode === 1087 || (conditionCode >= 1273 && conditionCode <= 1282);
  const isBlizzard = conditionCode === 1117;
  const isSnow     = conditionCode >= 1210 && conditionCode <= 1282 && !conditionText.toLowerCase().includes("thunder");
  const isHail     = conditionCode >= 1237 || conditionCode === 1261 || conditionCode === 1264;
  const isSleet    = conditionCode >= 1204 && conditionCode <= 1207;
  const isRain     = (conditionCode >= 1180 && conditionCode <= 1201) || conditionCode === 1063;
  const isDrizzle  = (conditionCode >= 1150 && conditionCode <= 1171) || conditionCode === 1072;
  const isFog      = conditionCode === 1135 || conditionCode === 1147;
  const isOvercast = conditionCode === 1009;
  const isCloudy   = conditionCode >= 1003 && conditionCode <= 1030;
  const isAnyRain  = isRain || isDrizzle;

  let gif;
  if (isThunder)       gif = "Strom.gif";
  else if (isBlizzard) gif = "blizzard.png";
  else if (isSnow)     gif = "snow.png";
  else if (isHail)     gif = "hail.gif";
  else if (isSleet)    gif = "sleet.png";
  else if (isAnyRain)  gif = isDay ? "rain day.png" : "rain.png";
  else if (isFog)      gif = "fog.png";
  else if (isOvercast) gif = "Cloudy_overcast.png";
  else if (isCloudy)   gif = isDay ? "cloudy day.png" : "cloudy night.png";
  else                 gif = isDay ? "sunny.png" : "moon.gif";

  return { gif, isThunder, isBlizzard, isSnow, isHail, isSleet, isRain, isDrizzle, isFog, isOvercast, isCloudy, isAnyRain };
}

const conditionMapKO = {
  "Sunny":"맑음","Clear":"맑음","Partly cloudy":"구름 조금","Cloudy":"흐림",
  "Overcast":"완전 흐림","Mist":"안개","Fog":"짙은 안개","Freezing fog":"결빙 안개",
  "Patchy rain possible":"비 올 수도 있어요","Patchy snow possible":"눈 올 수도 있어요",
  "Blowing snow":"눈보라","Blizzard":"강한 눈보라","Thundery outbreaks possible":"천둥 가능",
  "Patchy light drizzle":"가벼운 이슬비","Light drizzle":"이슬비","Freezing drizzle":"결빙 이슬비",
  "Heavy freezing drizzle":"강한 결빙 이슬비","Patchy light rain":"가벼운 비",
  "Light rain":"가벼운 비","Moderate rain at times":"때때로 비","Moderate rain":"보통 비",
  "Heavy rain at times":"때때로 강한 비","Heavy rain":"강한 비",
  "Light freezing rain":"가벼운 결빙 비","Moderate or heavy freezing rain":"강한 결빙 비",
  "Light sleet":"가벼운 진눈깨비","Moderate or heavy sleet":"강한 진눈깨비",
  "Patchy light snow":"가벼운 눈","Light snow":"가벼운 눈","Patchy moderate snow":"보통 눈",
  "Moderate snow":"보통 눈","Patchy heavy snow":"강한 눈","Heavy snow":"강한 눈",
  "Ice pellets":"우박","Light rain shower":"소나기","Moderate or heavy rain shower":"강한 소나기",
  "Torrential rain shower":"폭우","Light sleet showers":"가벼운 진눈깨비 소나기",
  "Light snow showers":"가벼운 눈 소나기","Moderate or heavy snow showers":"강한 눈 소나기",
  "Light showers of ice pellets":"가벼운 우박","Moderate or heavy showers of ice pellets":"강한 우박",
  "Thunderstorm":"천둥번개","Patchy light rain with thunder":"천둥 동반 가벼운 비",
  "Moderate or heavy rain with thunder":"천둥 동반 강한 비",
  "Patchy light snow with thunder":"천둥 동반 가벼운 눈",
  "Moderate or heavy snow with thunder":"천둥 동반 강한 눈",
};


function calcRealFeel(T, v, H) {
  const v_ms = v / 3.6;
  const e = (H / 100) * 6.105 * Math.exp((17.27 * T) / (237.7 + T));
  let rf;
  if (T <= 10 && v >= 4.8) {
    rf = 13.12 + (0.6215 * T) - (11.37 * Math.pow(v, 0.16)) + (0.3965 * T * Math.pow(v, 0.16));
    if (H < 30) rf -= (30 - H) * 0.05;
  } else if (T >= 27 && H >= 40) {
    const c1=-8.78469475556,c2=1.61139411,c3=2.33854883889,c4=-0.14611605,
          c5=-0.012308094,c6=-0.0164248277778,c7=0.002211732,c8=0.00072546,c9=-0.000003582;
    rf = c1+(c2*T)+(c3*H)+(c4*T*H)+(c5*T*T)+(c6*H*H)+(c7*T*T*H)+(c8*T*H*H)+(c9*T*T*H*H);
    rf = Math.max(rf, T);
    if (v > 15) rf -= (v - 15) * 0.1;
  } else {
    rf = T + (0.33 * e) - (0.70 * v_ms) - 4.00;
    if (T >= 18 && T < 27 && H > 70)  rf += (H - 70) * 0.05;
    if (T >= 15 && T < 27 && H < 40)  rf -= (40 - H) * 0.04;
    if (T > 0  && T < 15 && H > 80)   rf -= (H - 80) * 0.04;
  }
  return parseFloat(rf.toFixed(1));
}
 
function t(ko, en) { return currentLang === 'ko' ? ko : en; }

function getHumidityVibe(dewPoint) {
  if (dewPoint < -5)      return { vibe: t("공기가 많이 건조해요 🏜️","Very Dry 🏜️"),             color:"#e0f2fe" };
  if (dewPoint < 5)       return { vibe: t("조금 건조한 느낌이에요 💨","Dry Air 💨"),             color:"#8fd3f4" };
  if (dewPoint < 10)      return { vibe: t("쾌적해서 편안해요 ✨","Comfortable ✨"),              color:"#98ff98" };
  if (dewPoint < 13)      return { vibe: t("상쾌한 느낌이에요 🌿","Pleasant 🌿"),               color:"#bbf7d0" };
  if (dewPoint < 16)      return { vibe: t("공기가 살짝 눅눅하게 느껴져요 🌫️","Noticeable Moisture 🌫️"), color:"#fde68a" };
  if (dewPoint < 18)      return { vibe: t("조금 끈적하게 느껴질 수 있어요 😅","Sticky 😅"),      color:"#fbbf24" };
  if (dewPoint < 21)      return { vibe: t("습해서 조금 무겁게 느껴질 수 있어요 💧","Humid & Heavy 💧"), color:"#f97316" };
  if (dewPoint < 24)      return { vibe: t("답답하게 느껴질 수 있어요 🥵","Oppressive 🥵"),       color:"#ef4444" };
  return                         { vibe: t("숨이 답답할 만큼 습해요… 🌊🥵","Soupy / Unbearable 🌊🥵"), color:"#dc2626" };
}

function getWindFeeling(rf) {
  if (rf <= -10)  return { text: t("숨이 아플 만큼 추워요… 꼭 따뜻하게 입어요 🥶","Dangerously Cold 🥶"), color:"#a5f3fc" };
  if (rf <= 0)    return { text: t("꽁꽁 얼 것 같아요 ❄️","Freezing ❄️"),                         color:"#8fd3f4" };
  if (rf <= 8)    return { text: t("차가운 공기가 살짝 아파요 🥶","Biting Cold 🧊"),               color:"#bfdbfe" };
  if (rf <= 14)   return { text: t("조금 쌀쌀해서 외투가 필요해요 🧊","Chilly 🌬️"),              color:"#c7d2fe" };
  if (rf <= 20)   return { text: t("선선하고 기분 좋은 공기예요 🍃","Cool & Fresh 🍃"),           color:"#bbf7d0" };
  if (rf <= 25)   return { text: t("딱 좋은 날씨… 편안해요 ✨","Comfortable ✨"),                color:"#98ff98" };
  if (rf <= 30)   return { text: t("따뜻해서 기분이 풀리는 느낌이에요 🌤️","Warm & Pleasant 🌤️"), color:"#fde68a" };
  if (rf <= 35)   return { text: t("조금 덥고 끈적할 수 있어요 🌡️","Hot & Humid 🌡️"),          color:"#fbbf24" };
  if (rf <= 40)   return { text: t("많이 더워요… 무리하지 말아요 🔥","Very Hot 🔥"),             color:"#f97316" };
  return                 { text: t("숨이 막힐 만큼 더워요… ☀️🔥","Extreme Heat ☀️🔥"),          color:"#ef4444" };
}

function getUVLabel(uvIndex) {
  if (uvIndex <= 0)  return t("자외선이 거의 없어요","None");
  if (uvIndex <= 2)  return t("자외선이 약해서 괜찮아요","Low");
  if (uvIndex <= 5)  return t("적당한 수준이에요","Moderate");
  if (uvIndex <= 7)  return t("자외선이 꽤 강해요… 조금 주의해요","High");
  if (uvIndex <= 10) return t("자외선이 많이 강해요… 피부 보호해요","Very High");
  return             t("자외선이 매우 위험해요… 꼭 조심해요","Extreme");
}

function getAQI(aqi) {
  if (!aqi)      return { label: "N/A",                                                    color:"#ffffff" };
  if (aqi === 1) return { label: t("공기가 아주 깨끗해요 🟢","Good 🟢"),                    color:"#98ff98" };
  if (aqi === 2) return { label: t("보통이에요 🟡","Moderate 🟡"),                         color:"#fde68a" };
  if (aqi === 3) return { label: t("민감군은 주의해요 🟠","Unhealthy for Sensitive 🟠"),    color:"#fbbf24" };
  if (aqi === 4) return { label: t("공기가 좋지 않아요 조심해요 🔴","Unhealthy 🔴"),         color:"#f97316" };
  if (aqi === 5) return { label: t("많이 나빠요 외출은 피하는 게 좋아요 🟣","Very Unhealthy 🟣"), color:"#c084fc" };
  return               { label: t("위험한 수준이에요 꼭 주의해요 ⚫","Hazardous ⚫"),          color:"#ef4444" };
}

function getVisibility(visKm) {
  if (visKm >= 10) return { label: t("시야가 맑고 아주 깨끗해요 😎","Crystal Clear 😎"), color:"#98ff98" };
  if (visKm >= 5)  return { label: t("잘 보이는 편이에요 👍","Good 👍"),                 color:"#bbf7d0" };
  if (visKm >= 2)  return { label: t("조금 흐릿하게 보여요 🌫️","Moderate 🌫️"),         color:"#fde68a" };
  if (visKm >= 1)  return { label: t("앞이 잘 안 보여요… 😶‍🌫️","Poor 😶‍🌫️"),          color:"#f97316" };
  return                  { label: t("시야가 많이 안 좋아요 주의해요 ⚠️","Very Poor ⚠️"), color:"#ef4444" };
}

function getPressure(pressureHpa) {
  if (pressureHpa < 980)  return { label: t("기압이 매우 낮아요… 날씨가 불안정해요 ⛈️","Very Low — Stormy ⛈️"), color:"#ef4444" };
  if (pressureHpa < 1000) return { label: t("기압이 낮아서 날씨가 흐릴 수 있어요 🌧️","Low — Unsettled 🌧️"),    color:"#f97316" };
  if (pressureHpa < 1013) return { label: t("조금 낮은 상태예요 🌥️","Slightly Low 🌥️"),                       color:"#fde68a" };
  if (pressureHpa < 1020) return { label: t("안정된 상태라 편안해요 ✅","Normal — Stable ✅"),                   color:"#98ff98" };
  if (pressureHpa < 1030) return { label: t("맑은 날씨가 이어질 것 같아요 ☀️","High — Clear Skies ☀️"),         color:"#bbf7d0" };
  return                         { label: t("공기가 건조하고 맑아요 🌤️","Very High — Dry & Sunny 🌤️"),          color:"#8fd3f4" };
}

function getMoonData(moonPhaseRaw) {
  const moonMap = {
    "New Moon":        { emoji:"🌑", ko:"신월",          en:"New Moon" },
    "Waxing Crescent": { emoji:"🌒", ko:"초승달",        en:"Waxing Crescent" },
    "First Quarter":   { emoji:"🌓", ko:"상현달",        en:"First Quarter" },
    "Waxing Gibbous":  { emoji:"🌔", ko:"차오르는 달",   en:"Waxing Gibbous" },
    "Full Moon":       { emoji:"🌕", ko:"보름달",        en:"Full Moon" },
    "Waning Gibbous":  { emoji:"🌖", ko:"기우는 달",     en:"Waning Gibbous" },
    "Last Quarter":    { emoji:"🌗", ko:"하현달",        en:"Last Quarter" },
    "Waning Crescent": { emoji:"🌘", ko:"그믐달",        en:"Waning Crescent" },
  };
  const d = moonMap[moonPhaseRaw] || { emoji:"🌑", ko:moonPhaseRaw, en:moonPhaseRaw };
  return { emoji: d.emoji, label: currentLang === 'ko' ? d.ko : d.en };
}

function getOutfit(conditionCode, conditionText, T, isAnyRain, isThunder, isSnow, isFog) {
  if (isThunder)   return { outfit: t("오늘은 밖에 나가지 않는 게 좋아요!","Stay Indoors!"),   emo:"⚡", mot:"motion-storm" };
  if (isAnyRain)   return { outfit: t("비가 와요 우산 꼭 챙겨요","Raincoat ☔"),                emo:"☔", mot:"motion-rain" };
  if (isSnow)      return { outfit: t("눈이 와요 따뜻하게 입어요","Dress Warm ⛄"),             emo:"⛄", mot:"motion-shiver" };
  if (isFog)       return { outfit: t("안개가 껴요 운전 조심해요","Watch Out — Foggy 🌫️"),     emo:"🌫️", mot:"motion-float" };
  if (T < 12)      return { outfit: t("쌀쌀해요 따뜻하게 입어요","Warm Parka 🧥"),             emo:"🧥", mot:"motion-shiver" };
  if (T > 28)      return { outfit: t("더워요 가볍게 입는 게 좋아요","Tank Top 🍦"),           emo:"🩳", mot:"motion-bounce" };
  return                  { outfit: t("편하게 입어도 괜찮아요","Casual Comfort 👕"),            emo:"👕", mot:"motion-float" };
}

function getNextUp(nextData, T, windSpeedKmh) {
  const h = 5;
  if (nextData.chance_of_rain > 40)
    return { vibe: t(`5시간 뒤 비가 올 것 같아요`,`Rain in ${h}h`),          emoji:"☔", motion:"motion-rain" };
  if (nextData.temp_c > T + 3)
    return { vibe: t(`5시간 뒤 조금 더 따뜻해질 거예요`,`Warmer in ${h}h`),   emoji:"☀️", motion:"motion-bounce" };
  if (nextData.wind_kph > windSpeedKmh + 15)
    return { vibe: t(`5시간 뒤 바람이 강해질 수 있어요`,`Windy in ${h}h`),    emoji:"🍃", motion:"motion-sway" };
  if (nextData.temp_c < T - 3)
    return { vibe: t(`5시간 뒤 조금 더 쌀쌀해져요`,`Cooler in ${h}h`),        emoji:"🧣", motion:"motion-shiver" };
  return   { vibe: t("당분간 큰 변화 없이 잔잔해요","Steady Skies"),           emoji:"✨", motion:"motion-float" };
}

function getAlertMsg(isThunder, isBlizzard, isHail, windSpeedKmh, uvIndex, T) {
  if (isThunder)          return t("⚡ 천둥번개가 있어요 밖에서는 조심해요!","⚡ Thunderstorm Warning — Stay indoors!");
  if (isBlizzard)         return t("🌨️ 눈보라가 심해요… 이동은 피하는 게 좋아요!","🌨️ Blizzard Warning — Dangerous travel conditions!");
  if (isHail)             return t("🌨️ 우박이 내려요… 실내에 있는 게 안전해요!","🌨️ Hail Warning — Stay indoors!");
  if (windSpeedKmh > 60)  return t(`💨 바람이 많이 불어요— ${Math.round(windSpeedKmh)} km/h 주의해요!`,`💨 High Wind Warning — ${Math.round(windSpeedKmh)} km/h!`);
  if (uvIndex >= 8)       return t("☀️ 자외선이 강해요… 피부 보호 꼭 해요!","☀️ High UV Warning — Apply sunscreen!");
  if (T >= 38)            return t("🔥 너무 더워요 물 자주 마시고 쉬어가요!","🔥 Extreme Heat Warning — Stay hydrated!");
  if (T <= -10)           return t("🥶 너무 추워요 따뜻하게 꼭 챙겨 입어요!","🥶 Extreme Cold Warning — Frostbite risk!");
  return null;
}

//  MAIN FETCH FUNCTION  
async function getVibe(searchInput, originalQuery = null) {
  if (!searchInput) return;
  if (!originalQuery) originalQuery = searchInput;

  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.disabled = true;
    searchBtn.innerText = currentLang === 'ko' ? '불러오는 중...' : 'Loading...';
  }

  let queryForApi = searchInput;
  let displayName = null;

  try {
    const isKorean = /[가-힣]/.test(searchInput);

    if (isKorean) {
      displayName = originalQuery;
      const stripped = searchInput.replace(/(특별시|광역시|특별자치시|특별자치도|특별자치|시|군|구)$/, '');
      const lookups = [searchInput, stripped, stripped+"시", stripped+"군"];
      let coordStr = null;
      for (const key of lookups) {
        if (koreanCityCoords[key]) { coordStr = koreanCityCoords[key]; break; }
      }
      if (coordStr) {
        queryForApi = coordStr;
      } else {
        try {
          const geoRes  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchInput)}&countrycodes=kr&format=json&limit=1`);
          const geoData = await geoRes.json();
          if (geoData && geoData[0]) {
            queryForApi = `${geoData[0].lat},${geoData[0].lon}`;
          } else {
            alert(currentLang === 'ko'
              ? `'${originalQuery}'을(를) 찾을 수 없어요 😢\n더 정확한 지역명으로 다시 검색해보세요!`
              : `'${originalQuery}' not found 😢\nPlease try a more specific name.`);
            return;
          }
        } catch(e) {
          alert(currentLang === 'ko' ? '검색 중 오류가 발생했어요 😢 다시 시도해주세요.' : 'Search error 😢 Please try again.');
          return;
        }
      }
    }

    const res  = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(queryForApi)}&days=6&aqi=yes&alerts=no&lang=ko`);
    const data = await res.json();

    if (data.error) {
      alert(currentLang === 'ko'
        ? `날씨 정보를 찾을 수 없어요 😢\n다른 도시명으로 검색해보세요!`
        : `City not found! 😢 Please try another name.`);
      return;
    }

    data._displayName = displayName;
    lastWeatherData = data;
    renderWeather(data, true);

  } catch(e) {
    console.error("Error:", e);
    alert(currentLang === 'ko' ? '오류가 발생했어요. 다시 시도해주세요.' : 'Something went wrong. Please try again.');
  } finally {
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.innerText = currentLang === 'ko' ? '검색' : 'EXPLORE';
    }
  }
}

// RENDER (called on fetch AND on lang switch) 
function renderWeather(data, showDashboard) {
  const displayName  = data._displayName || null;
  const current      = data.current;
  const location     = data.location;
  const forecastDay  = data.forecast.forecastday;
  const todayAstro   = forecastDay[0].astro;
  const todayDay     = forecastDay[0].day;

  const temp          = current.temp_c;
  const humidity      = current.humidity;
  const windSpeedKmh  = current.wind_kph;
  const isDay         = current.is_day === 1;
  const conditionText = current.condition.text;
  const conditionCode = current.condition.code;
  const uvIndex       = current.uv;
  const visKm         = current.vis_km;
  const pressureHpa   = current.pressure_mb;
  const tzId          = location.tz_id;
  const localTimeStr  = location.localtime;
  const localHour     = parseInt(localTimeStr.split(' ')[1].split(':')[0]);
  const localDate     = new Date(location.localtime);
  const min           = todayDay.mintemp_c;
  const max           = todayDay.maxtemp_c;
  const precipChance  = todayDay.daily_chance_of_rain;
  const aqi           = current.air_quality ? current.air_quality['us-epa-index'] : null;

  // City display name
  const cityDisplay = displayName
    ? displayName
    : (location.region
        ? `${location.name}, ${location.region}, ${location.country}`
        : `${location.name}, ${location.country}`);

  
  const { gif, isThunder, isBlizzard, isSnow, isHail, isSleet, isRain, isDrizzle, isFog, isOvercast, isCloudy, isAnyRain } =
    getWeatherIcon(conditionCode, conditionText, isDay);

  // Condition display text
  const condDisplay = currentLang === 'ko'
    ? (conditionMapKO[conditionText] || conditionText)
    : conditionText;

  
  const rf = calcRealFeel(temp, windSpeedKmh, humidity);

  // Dew point
  const dewPoint = temp - ((100 - humidity) / 5);

  // Computed labels
  const humData    = getHumidityVibe(dewPoint);
  const windData   = getWindFeeling(rf);
  const aqiData    = getAQI(aqi);
  const visData    = getVisibility(visKm);
  const presData   = getPressure(pressureHpa);
  const moonData   = getMoonData(todayAstro.moon_phase);
  const outfitData = getOutfit(conditionCode, conditionText, temp, isAnyRain, isThunder, isSnow, isFog);
  const uvLabel    = getUVLabel(uvIndex);

  // 5-hour look ahead
  const combinedHours = [...forecastDay[0].hour, ...forecastDay[1].hour];
  const nowMs    = new Date(localTimeStr).getTime();
  const targetMs = nowMs + 5 * 60 * 60 * 1000;
  const nextData = combinedHours.find(h => new Date(h.time).getTime() >= targetMs) || combinedHours[combinedHours.length - 1];
  const nextUp   = getNextUp(nextData, temp, windSpeedKmh);

  // Alert
  const alertMsg = getAlertMsg(isThunder, isBlizzard, isHail, windSpeedKmh, uvIndex, temp);
  const alertBanner = document.getElementById('alertBanner');
  const alertTextEl = document.getElementById('alertText');
  if (alertBanner && alertTextEl) {
    if (alertMsg) { alertTextEl.innerText = alertMsg; alertBanner.classList.remove('hidden'); }
    else alertBanner.classList.add('hidden');
  }

  
  const dateOptions = { weekday:'long', month:'long', day:'numeric' };
  const dateLocale  = currentLang === 'ko' ? 'ko-KR' : 'en-US';

  //  DOM updates
  document.getElementById('cityName').innerHTML = `<i class="fas fa-location-arrow"></i> ${cityDisplay}`;
  document.getElementById('temp').innerText = Math.round(temp) + "°C";
  document.getElementById('description').innerText = condDisplay;
  document.getElementById('todayDate').innerText = localDate.toLocaleDateString(dateLocale, dateOptions);
  document.getElementById('realFeelVal').innerText = `${rf.toFixed(1)}°C`;

  // Real feel 
  const realFeelCard = document.querySelector('#realFeelVal').closest('.vibe-card').querySelector('div');
  let rfEmoji, rfMotion;
  if (rf<=0)       { rfEmoji="🥶"; rfMotion="motion-shiver"; }
  else if (rf<=8)  { rfEmoji="🧊"; rfMotion="motion-shiver"; }
  else if (rf<=14) { rfEmoji="🍃"; rfMotion="motion-sway"; }
  else if (rf<=20) { rfEmoji="😌"; rfMotion="motion-float"; }
  else if (rf<=25) { rfEmoji="☀️"; rfMotion="motion-bounce"; }
  else if (rf<=32) { rfEmoji="🌡️"; rfMotion="motion-bounce"; }
  else             { rfEmoji="🔥"; rfMotion="motion-storm"; }
  realFeelCard.innerText = rfEmoji;
  realFeelCard.className = rfMotion;

  document.getElementById('humidityVal').innerText = `${humidity}%`;
  const hStatus = document.getElementById('humidityStatus');
  if (hStatus) { hStatus.innerText = humData.vibe; hStatus.style.color = humData.color; }

  document.getElementById('windVal').innerText = `${Math.round(windSpeedKmh)} km/h`;
  const wStatus = document.getElementById('windStatus');
  if (wStatus) { wStatus.innerText = windData.text; wStatus.style.color = windData.color; }

  document.getElementById('precipVal').innerText = `${precipChance}%`;
  document.getElementById('precipBarInner').style.width = `${precipChance}%`;

  document.getElementById('pressureVal').innerText = `${pressureHpa} hPa`;
  const pEl = document.getElementById('pressureStatus');
  if (pEl) { pEl.innerText = presData.label; pEl.style.color = presData.color; }

  document.getElementById('aqiVal').innerText = aqi ? `Index ${aqi}` : "N/A";
  const aqiEl = document.getElementById('aqiStatus');
  if (aqiEl) { aqiEl.innerText = aqiData.label; aqiEl.style.color = aqiData.color; }

  document.getElementById('visVal').innerText = `${visKm} km`;
  const visEl = document.getElementById('visStatus');
  if (visEl) { visEl.innerText = visData.label; visEl.style.color = visData.color; }

  // Min/max temp bar
  document.getElementById('minTemp').innerText = Math.round(min) + "°";
  document.getElementById('maxTemp').innerText = Math.round(max) + "°";
  const range   = max - min;
  const percent = range <= 0 ? 50 : ((temp - min) / range) * 100;
  const marker  = document.getElementById('tempMarker');
  const clamped = Math.min(Math.max(percent, 0), 100);
  marker.style.transition = "none";
  marker.style.left = "0%";
  marker.offsetHeight;
  marker.style.transition = "left 1s cubic-bezier(0.25, 1, 0.5, 1)";
  marker.style.left = `${clamped}%`;

  // Sunrise / sunset
  document.getElementById('sunriseTime').innerText = todayAstro.sunrise;
  document.getElementById('sunsetTime').innerText  = todayAstro.sunset;
  document.getElementById('sunriseIcon').className = "solar-sun animate-sunrise";
  document.getElementById('sunsetIcon').className  = "solar-sun animate-sunset";

  // Moon
  const moonIconEl = document.getElementById('moonIcon');
  const moonTextEl = document.getElementById('moonPhaseText');
  if (moonIconEl) moonIconEl.innerText = moonData.emoji;
  if (moonTextEl) moonTextEl.innerText = moonData.label;

  // Outfit
  const eBox = document.getElementById('outfitEmoji');
  if (eBox) { eBox.innerText = outfitData.emo; eBox.className = outfitData.mot; }
  document.getElementById('outfitVal').innerText = outfitData.outfit;

  // Activity cards
  document.getElementById('runVal').innerText =
    (temp > 12 && temp < 25 && !isAnyRain && !isFog && precipChance < 50)
    ? t("뛰기 딱 좋아요 🏃‍♀️","Great for running 🏃‍♀️")
    : t("오늘은 조금 피하는 게 좋아요","Best to skip today");

  document.getElementById('driveVal').innerText =
    (windSpeedKmh > 20 || isAnyRain || isFog)
    ? t("조심해서 운전해요 🚗","Drive with caution 🚗")
    : t("편하게 운전해도 괜찮아요","Smooth driving ✅");

  document.getElementById('pollenVal').innerText =
    (isDay && conditionCode === 1000)
    ? t("꽃가루가 많아요 🌼","High pollen 🌼")
    : t("괜찮은 수준이에요","Low 🌿");

  document.getElementById('uvVal').innerText = uvLabel;

  const nextEmojiEl = document.getElementById('nextUpEmoji');
  if (nextEmojiEl) { nextEmojiEl.innerText = nextUp.emoji; nextEmojiEl.className = nextUp.motion; }
  document.getElementById('nextUpVal').innerText = nextUp.vibe;

  const iconEl     = document.getElementById('mainWeatherIcon');
  const timeIconEl = document.getElementById('timeIcon');
  const hasConditionIcon = isThunder || isSnow || isHail || isSleet || isAnyRain || isFog || isOvercast || isCloudy || isBlizzard;
  if (hasConditionIcon) {
    iconEl.src = `assets/icons/${gif}`;
    iconEl.style.display = 'block';
    timeIconEl.src = isDay ? 'assets/icons/sunny.png' : 'assets/icons/moon.gif';
    timeIconEl.style.display = 'block';
  } else {
    iconEl.src = isDay ? 'assets/icons/sunny.png' : 'assets/icons/moon.gif';
    iconEl.style.display = 'block';
    timeIconEl.style.display = 'none';
  }

  updateDynamicBackground(localHour);
  updateLiveClock(tzId, temp);

  if (isAnyRain || isThunder) playAmbient('rain');
  else if (isSnow || isBlizzard || temp < 2) playAmbient('winter');
  else if (isDay) playAmbient('sunny');
  else playAmbient('night');

  renderForecast(forecastDay);
  renderHourly(combinedHours, localTimeStr);

  if (showDashboard) {
    document.getElementById('portal').classList.add('hidden');
    document.getElementById('portalVideo').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('bgVideo').classList.remove('hidden');
    window.history.pushState({ page: "dashboard" }, "Weather", "");
    localStorage.setItem('lastVibe', JSON.stringify({ city: cityDisplay, temp: Math.round(temp) + "°C" }));
    document.querySelectorAll('.vibe-card, .forecast-card, .hourly-card').forEach(card => {
      card.addEventListener('mouseenter', playHover);
    });
    showHistory();
  }
}

//  FORECAST RENDERER 
function renderForecast(forecastDay) {
  const container = document.getElementById('forecastContainer');
  if (!container) return;
  let html = '';
  forecastDay.slice(1).forEach(day => {
    const d = new Date(day.date + 'T12:00:00');
    const dayName = currentLang === 'ko'
      ? ['일','월','화','수','목','금','토'][d.getDay()]
      : d.toLocaleDateString('en-US', { weekday: 'short' });
    const icon = day.day.condition.icon;
    const maxT = Math.round(day.day.maxtemp_c);
    const minT = Math.round(day.day.mintemp_c);
    const rain = day.day.daily_chance_of_rain;
    html += `<div class="forecast-list-item">
      <span class="f-day">${dayName}</span>
      <img src="https:${icon}" style="width:28px;height:28px;">
      <span style="font-size:0.7rem;opacity:0.6;margin:0 8px;">💧${rain}%</span>
      <span class="f-temps">${maxT}° <span>${minT}°</span></span>
    </div>`;
  });
  container.innerHTML = html;
}

//  HOURLY RENDERER 
function renderHourly(allHours, localTimeStr) {
  const container = document.getElementById('hourlyContainer');
  if (!container) return;
  const futureHours = allHours.filter(h => h.time > localTimeStr);
  const next12 = futureHours.slice(0, 12);
  let html = '';
  next12.forEach(h => {
    const timePart = h.time.split(' ')[1];
    const hHour = parseInt(timePart.split(':')[0]);
    let label;
    if (currentLang === 'ko') {
      label = hHour === 0 ? "자정" : hHour < 12 ? `오전${hHour}시` : hHour === 12 ? "정오" : `오후${hHour-12}시`;
    } else {
      label = hHour === 0 ? "12AM" : hHour < 12 ? `${hHour}AM` : hHour === 12 ? "12PM" : `${hHour-12}PM`;
    }
    const icon  = h.condition.icon;
    const hTemp = Math.round(h.temp_c);
    const rain  = h.chance_of_rain;
    const rainStyle = rain > 40 ? "color:#ff9a9e;font-weight:bold;opacity:1;" : "opacity:0.6;";
    html += `<div class="hourly-card">
      <p class="hourly-time">${label}</p>
      <img src="https:${icon}" style="width:30px;height:30px;">
      <p class="hourly-temp">${hTemp}°</p>
      <p style="font-size:0.55rem;margin-top:2px;${rainStyle}">💧${rain}%</p>
    </div>`;
  });
  container.innerHTML = html;
}

//  EVENT LISTENERS AND INTERACTIONS 
document.getElementById('searchBtn').onclick = () => {
  sounds.click.currentTime = 0; sounds.click.play().catch(() => {});
  const city = document.getElementById('cityInput').value.trim();
  if (city) getVibe(city);
};

document.getElementById('cityInput').onkeydown = (e) => {
  if (e.key === 'Enter') getVibe(e.target.value.trim());
};

document.getElementById('backBtn').onclick = () => {
  sounds.click.currentTime = 0; sounds.click.play().catch(() => {});
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('bgVideo').classList.add('hidden');
  document.getElementById('portal').classList.remove('hidden');
  document.getElementById('portalVideo').classList.remove('hidden');
};

document.getElementById('lastCity').onclick = () => {
  sounds.click.currentTime = 0; sounds.click.play().catch(() => {});
  const saved = localStorage.getItem('lastVibe');
  if (saved) { const d = JSON.parse(saved); getVibe(d.city); }
};

document.getElementById('geoBtn').onclick = () => {
  const btn = document.getElementById('geoBtn');
  if (!navigator.geolocation) {
    alert(currentLang === 'ko' ? '이 브라우저는 위치 서비스를 지원하지 않아요.' : 'Geolocation not supported.');
    return;
  }
  btn.innerText = currentLang === 'ko' ? '📍 위치 찾는 중...' : '📍 Finding location...';
  btn.disabled = true;
  sounds.click.currentTime = 0; sounds.click.play().catch(() => {});
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
      btn.innerText = currentLang === 'ko' ? '📍 내 위치 날씨 보기' : '📍 Use My Location';
      btn.disabled = false;
      getVibe(coords);
    },
    (err) => {
      btn.innerText = currentLang === 'ko' ? '📍 내 위치 날씨 보기' : '📍 Use My Location';
      btn.disabled = false;
      if (err.code === 1)
        alert(currentLang === 'ko' ? '위치 권한이 거부됐어요.' : 'Location permission denied.');
      else
        alert(currentLang === 'ko' ? '위치를 가져오지 못했어요.' : 'Could not get location. Please try again.');
    },
    { timeout: 10000, maximumAge: 60000 }
  );
};

document.getElementById('shareBtn').onclick = async () => {
  const city     = document.getElementById('cityName').innerText.replace(/[^\w\s,가-힣]/g, '').trim();
  const temp     = document.getElementById('temp').innerText;
  const desc     = document.getElementById('description').innerText;
  const feel     = document.getElementById('realFeelVal').innerText;
  const hum      = document.getElementById('humidityVal').innerText;
  const wind     = document.getElementById('windVal').innerText;

  const shareText = currentLang === 'ko'
    ? `🌤️ ${city} 날씨\n🌡️ ${temp} — ${desc}\n🤔 체감온도: ${feel}\n💧 습도: ${hum}\n💨 바람: ${wind}\n\nVibeWeather Pro에서 확인했어요`
    : `🌤️ Weather in ${city}\n🌡️ ${temp} — ${desc}\n🤔 Feels like: ${feel}\n💧 Humidity: ${hum}\n💨 Wind: ${wind}\n\nChecked on VibeWeather Pro`;

  const btn = document.getElementById('shareBtn');
  if (navigator.share) {
    await navigator.share({ title: 'VibeWeather Pro', text: shareText });
  } else {
    navigator.clipboard.writeText(shareText);
    btn.innerText = currentLang === 'ko' ? '✅ 클립보드에 복사됐어요!' : '✅ Copied to clipboard!';
    setTimeout(() => {
      btn.innerText = currentLang === 'ko' ? '📤 날씨 공유하기' : '📤 Share Weather';
    }, 2000);
  }
};

function initializeDefaultDate() {
  const seoulDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const dateEl = document.getElementById('todayDate');
  if (dateEl) dateEl.innerText = seoulDate.toLocaleDateString(
    currentLang === 'ko' ? 'ko-KR' : 'en-US',
    { weekday:'long', year:'numeric', month:'long', day:'numeric' }
  );
}

showHistory();
initializeDefaultDate();
