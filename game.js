// game.js - לוגיקת המשחק הראשית

// אתחול הקנבס והקונטקסט
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// התאמת הקנבס לגודל החלון
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// משתני משחק
let gameRunning = false;
let gamePaused = false;
let score = 0;
let currentMonth = 0;
let isMoving = false; // בקרת תנועה
let moveTimer = null; // עבור תזמון הודעת תנועה

// יום/לילה משתנים
let currentHour = 5; // מתחיל ב-5:00 בבוקר
let currentMinute = 0;
let isDayTime = true;
let lastTimeUpdate = Date.now();

// כוכבים, עננים וציפורים
let stars = [];
let clouds = [];
let birds = [];

// משתני יום
const dayMilliseconds = {
    perfect: 10000, // 10 שניות ליממה במצב אופטימלי (90%+ בריאות)
    current: 10000   // יכול להשתנות בהתאם לבריאות
};

// שחקן
const player = {
    x: window.innerWidth * 0.2,
    y: window.innerHeight * 0.7,
    width: 50,
    height: 80,
    baseSpeed: 5, // מהירות בסיסית
    currentSpeed: 5, // מהירות נוכחית מושפעת ממצב השחקן
    powerUp: false,
    powerUpTime: 0,
    powerUpType: '',
    companion: false
};

// קרקע
const ground = {
    y: window.innerHeight * 0.8,
    width: window.innerWidth,
    height: window.innerHeight * 0.2
};

// נתונים סטטיסטיים למשחק
const stats = {
    monthsPlayed: 0,
    powerupsCollected: 0,
    obstaclesAvoided: 0,
    obstaclesFaced: 0,
    expenses: 0,
    income: 5000,  // משכורת התחלתית
    mentalHealth: 90, // בריאות מנטלית מתחילה ב-90%
    physicalHealth: 90 // בריאות פיזית מתחילה ב-90%
};

// מכשול נוכחי
let currentObstacle = null;
let lastObstacleTime = 0;
const minObstacleInterval = 5000; // מינימום זמן בין מכשולים (5 שניות)
let persuasionStage = 0; // שלב שכנוע נוכחי
let currentObstacleDialog = null; // המכשול המוצג בדיאלוג נוכחי

// מידע על חיזוק נוכחי
let currentBoost = null;
let boostFollowupIndex = 0;

// סך הכל חודשים בסימולציה
const totalMonths = 24; // מרץ 2025 עד מרץ 2027
const monthNames = [
    "מרץ 2025", "אפריל 2025", "מאי 2025", "יוני 2025", "יולי 2025", 
    "אוגוסט 2025", "ספטמבר 2025", "אוקטובר 2025", "נובמבר 2025", "דצמבר 2025",
    "ינואר 2026", "פברואר 2026", "מרץ 2026", "אפריל 2026", "מאי 2026", 
    "יוני 2026", "יולי 2026", "אוגוסט 2026", "ספטמבר 2026", "אוקטובר 2026", 
    "נובמבר 2026", "דצמבר 2026", "ינואר 2027", "פברואר 2027", "מרץ 2027"
];

// משך חודש - 5 דקות לחודש
const monthDuration = 300; // 5 דקות (300 שניות) לחודש
const framesPerSecond = 60;
const framesPerMonth = monthDuration * framesPerSecond;
let currentMonthFrame = 0;

// מעקב חודשי אחרי מכשולים וחיזוקים
let monthlyItemCounter = {
    obstacles: {
        'person': 0,
        'ad': 0,
        'unhealthy-food': 0,
        'eating-out': 0,
        'job-offer': 0,
        'knowledge': 0
    },
    boosts: {
        'money': 0,
        'earlyRise': 0,
        'earlySleep': 0,
        'healthyFood': 0,
        'exercise': 0,
        'companion': 0
    }
};

// אתחול המשחק
function initGame() {
    // התאמת הקנבס לגודל החלון
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // עדכון גודל הקרקע
    ground.y = canvas.height * 0.8;
    ground.width = canvas.width;
    ground.height = canvas.height * 0.2;
    
    // התאמת מיקום השחקן
    let scaleFactor = Math.min(window.innerWidth, window.innerHeight) / 500;
    scaleFactor = Math.max(0.5, Math.min(1.5, scaleFactor)); // הגבלה בין 0.5 ל-1.5
    
    player.width = 50 * scaleFactor;
    player.height = 80 * scaleFactor;
    player.x = window.innerWidth * 0.2;
    player.y = ground.y - player.height;
    player.baseSpeed = 5 * scaleFactor;
    player.currentSpeed = player.baseSpeed;
    
    // אתחול נתונים סטטיסטיים
    stats.monthsPlayed = 0;
    stats.powerupsCollected = 0;
    stats.obstaclesAvoided = 0;
    stats.obstaclesFaced = 0;
    stats.expenses = 0;
    stats.income = 5000;
    stats.mentalHealth = 90; // מתחיל ב-90%
    stats.physicalHealth = 90; // מתחיל ב-90%
    
    // איפוס חודש וניקוד
    currentMonth = 0;
    currentMonthFrame = 0;
    score = 0;
    
    // איפוס מעקב חודשי
    resetMonthlyItemCounter();
    
    // איפוס זמן יום
    currentHour = 5;
    currentMinute = 0;
    isDayTime = true;
    lastTimeUpdate = Date.now();
    
    // יצירת אלמנטים סביבתיים
    createEnvironmentalElements();
    
    // עדכון מד הבריאות
    updateHealthBars();
    
    // איפוס מהירות יום בהתאם למצב בריאות
    updateDaySpeed();
    
    // עדכון תצוגה
    updateDisplay();
}

// יצירת אלמנטים סביבתיים
function createEnvironmentalElements() {
    // יצירת כוכבים
    createStars();
    
    // יצירת עננים
    createClouds();
    
    // יצירת ציפורים
    createBirds();
}

// יצירת כוכבים
function createStars() {
    stars = [];
    const starCount = Math.min(50, Math.floor(window.innerWidth * window.innerHeight / 10000));
    
    for (let i = 0; i < starCount; i++) {
        const star = {
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.7),
            size: Math.random() * 2 + 1,
            twinkleSpeed: Math.random() * 2 + 1
        };
        stars.push(star);
    }
}

// יצירת עננים
function createClouds() {
    clouds = [];
    const cloudCount = Math.min(5, Math.floor(window.innerWidth / 400));
    
    for (let i = 0; i < cloudCount; i++) {
        createCloud();
    }
}

// יצירת ענן בודד
function createCloud() {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    
    // גודל ומיקום אקראיים
    const size = Math.random() * 40 + 60;
    const top = Math.random() * (canvas.height * 0.3) + 50;
    const left = Math.random() * canvas.width;
    
    cloud.style.width = `${size * 2}px`; // הוגדל פי 2
    cloud.style.height = `${size}px`; // הוגדל פי 2
    cloud.style.top = `${top}px`;
    cloud.style.left = `${left}px`;
    
    // הוספת צל
    cloud.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)'; // הוגדל פי 2
    
    // מהירות תנועה
    const speed = Math.random() * 0.05 + 0.01;
    cloud.dataset.speed = speed;
    cloud.dataset.position = left;
    
    document.getElementById('game-container').appendChild(cloud);
    clouds.push(cloud);
    
    // עדכון נראות לפי זמן יום
    updateCloudVisibility();
}

// יצירת ציפורים
function createBirds() {
    birds = [];
    const birdCount = Math.min(3, Math.floor(window.innerWidth / 500));
    
    for (let i = 0; i < birdCount; i++) {
        if (Math.random() < 0.7) {
            createBird();
        }
    }
}

// יצירת ציפור בודדת
function createBird() {
    const bird = document.createElement('div');
    bird.className = 'bird';
    
    // יצירת SVG לציפור
    const birdSize = Math.random() * 20 + 30; // הוגדל פי 2
    bird.innerHTML = `
        <svg width="${birdSize}" height="${birdSize}" viewBox="0 0 100 100">
            <path d="M10,50 Q30,30 50,50 Q70,30 90,50" stroke="#333" fill="transparent" stroke-width="5"/>
        </svg>
    `;
    
    // מיקום אקראי
    const top = Math.random() * (canvas.height * 0.4) + 50;
    const left = -birdSize;
    
    bird.style.top = `${top}px`;
    bird.style.left = `${left}px`;
    
    // מהירות תנועה
    const speed = Math.random() * 0.08 + 0.05;
    bird.dataset.speed = speed;
    bird.dataset.position = left;
    
    document.getElementById('game-container').appendChild(bird);
    birds.push(bird);
    
    // הציפורים מופיעות רק ביום
    bird.style.opacity = isDayTime ? '1' : '0';
}

// עדכון ראות העננים
function updateCloudVisibility() {
    const cloudOpacity = isDayTime ? 0.8 : 0.3; // פחות נראה בלילה
    
    clouds.forEach(cloud => {
        cloud.style.opacity = cloudOpacity;
        // שינוי צבע הענן בלילה
        if (isDayTime) {
            cloud.style.background = "rgba(255, 255, 255, 0.7)";
        } else {
            cloud.style.background = "rgba(200, 200, 220, 0.5)";
        }
    });
}

// עדכון ראות הציפורים
function updateBirdsVisibility() {
    birds.forEach(bird => {
        // ציפורים מופיעות רק ביום
        bird.style.opacity = isDayTime ? '1' : '0';
        
        // הסרת ציפורים בלילה
        if (!isDayTime) {
            setTimeout(() => {
                if (birds.includes(bird)) {
                    document.getElementById('game-container').removeChild(bird);
                    birds.splice(birds.indexOf(bird), 1);
                }
            }, 2000);
        }
    });
}

// עדכון מחזור היום/לילה
function updateDayNightCycle() {
    if (!isMoving) return; // עדכון רק כשהשחקן זז
    
    const now = Date.now();
    const deltaTime = now - lastTimeUpdate;
    lastTimeUpdate = now;
    
    // חישוב זמן בהתאם למהירות היום הנוכחית
    const secondsElapsed = deltaTime / 1000;
    const totalDayTimeInSeconds = dayMilliseconds.current / 1000;
    const hoursElapsed = secondsElapsed * (24 / totalDayTimeInSeconds);
    
    // עדכון דקות תחילה
    currentMinute += hoursElapsed * 60;
    
    // אם דקות עוברות 60, הגדלת שעה
    while (currentMinute >= 60) {
        currentMinute -= 60;
        currentHour++;
        
        // איפוס שעה אחרי 24
        if (currentHour >= 24) {
            currentHour = 0;
        }
        
        // בדיקת מעבר יום/לילה
        if (currentHour === 18) {
            transitionToNight();
        } else if (currentHour === 5) {
            transitionToDay();
        }
    }
    
    // עדכון תצוגת שעון
    updateClockDisplay();
}

// עדכון ותצוגת שעון
function updateClockDisplay() {
    const hours = String(Math.floor(currentHour)).padStart(2, '0');
    const minutes = String(Math.floor(currentMinute)).padStart(2, '0');
    document.getElementById('day-clock').textContent = `${hours}:${minutes}`;
    
    // אפקט ויזואלי בשינוי שעה
    if (Math.floor(currentMinute) === 0) {
        document.getElementById('day-clock').style.transform = 'scale(1.1)';
        setTimeout(() => {
            document.getElementById('day-clock').style.transform = 'scale(1)';
        }, 300);
    }
}

// מעבר ללילה
function transitionToNight() {
    if (isDayTime) {
        isDayTime = false;
        
        // אפקט מעבר חלק ללילה
        visualEffects.smoothDayNightTransition(false, 
            document.getElementById('day-night-overlay'), 
            document.getElementById('sun'), 
            document.getElementById('moon'));
    }
}

// מעבר ליום
function transitionToDay() {
    if (!isDayTime) {
        isDayTime = true;
        
        // אפקט מעבר חלק ליום
        visualEffects.smoothDayNightTransition(true, 
            document.getElementById('day-night-overlay'), 
            document.getElementById('sun'), 
            document.getElementById('moon'));
        
        // יצירת ציפורים חדשות ליום החדש
        if (birds.length < 2 && Math.random() < 0.5) {
            createBird();
        }
        
        // יורדת הבריאות הפיזית והמנטלית ב-5% בכל יום
        stats.physicalHealth = Math.max(20, stats.physicalHealth - 5);
        stats.mentalHealth = Math.max(20, stats.mentalHealth - 5);
        
        // עדכון מדי בריאות
        updateHealthBars();
        
        // עדכון מהירות יום בהתאם לבריאות
        updateDaySpeed();
    }
}

// עדכון מהירות היום בהתאם לבריאות
function updateDaySpeed() {
    // חישוב תוספת שניות בהתאם לירידה בבריאות
    // בריאות פיזית: כל נקודה מתחת ל-90 מוסיפה שנייה
    const physicalHealthPenalty = Math.max(0, 90 - stats.physicalHealth);
    
    // בריאות מנטלית: כל נקודה מתחת ל-90 מוסיפה שנייה
    const mentalHealthPenalty = Math.max(0, 90 - stats.mentalHealth);
    
    // חישוב זמן יום נוכחי
    dayMilliseconds.current = dayMilliseconds.perfect + (physicalHealthPenalty + mentalHealthPenalty) * 1000;
    
    // עדכון תצוגת מצב השחקן
    updatePlayerCondition();
}

// עדכון מצב השחקן (מהירות ותצוגה)
function updatePlayerCondition() {
    // השפעת בריאות פיזית על המהירות
    let physicalEffect = stats.physicalHealth / 100;
    
    // השפעת בריאות מנטלית על המהירות
    let mentalEffect = stats.mentalHealth / 100;
    
    // עדכון מהירות שחקן
    player.currentSpeed = player.baseSpeed * physicalEffect * mentalEffect;
    
    // עדכון מחוון מהירות
    const speedIndicator = document.getElementById('speed-indicator');
    if (player.currentSpeed < player.baseSpeed * 0.6) {
        speedIndicator.textContent = 'התקדמות: איטית מאוד';
        speedIndicator.style.backgroundColor = 'rgba(212, 91, 91, 0.9)';
    } else if (player.currentSpeed < player.baseSpeed * 0.8) {
        speedIndicator.textContent = 'התקדמות: איטית';
        speedIndicator.style.backgroundColor = 'rgba(211, 135, 62, 0.9)';
    } else if (player.currentSpeed < player.baseSpeed * 0.95) {
        speedIndicator.textContent = 'התקדמות: בינונית';
        speedIndicator.style.backgroundColor = 'rgba(214, 177, 45, 0.9)';
    } else {
        speedIndicator.textContent = 'התקדמות: אופטימלית';
        speedIndicator.style.backgroundColor = 'rgba(50, 50, 50, 0.8)';
    }
    
    // עדכון אינדיקטורים של מצב שחקן
    updatePlayerStatusIndicators();
}

// עדכון אינדיקטורים של מצב השחקן
function updatePlayerStatusIndicators() {
    // אינדיקטור מצב פיזי
    if (stats.physicalHealth < 40) {
        document.getElementById('status-weight').style.display = 'block';
        document.getElementById('status-weight').textContent = "מצב גופני: חמור";
    } else if (stats.physicalHealth < 60) {
        document.getElementById('status-weight').style.display = 'block';
        document.getElementById('status-weight').textContent = "מצב גופני: לקוי";
    } else if (stats.physicalHealth < 80) {
        document.getElementById('status-weight').style.display = 'block';
        document.getElementById('status-weight').textContent = "מצב גופני: ירוד";
    } else {
        document.getElementById('status-weight').style.display = 'none';
    }
    
    // אינדיקטור מצב מנטלי
    if (stats.mentalHealth < 40) {
        document.getElementById('status-negative').style.display = 'block';
        document.getElementById('status-negative').textContent = "מצב מנטלי: חמור";
    } else if (stats.mentalHealth < 60) {
        document.getElementById('status-negative').style.display = 'block';
        document.getElementById('status-negative').textContent = "מצב מנטלי: לקוי";
    } else if (stats.mentalHealth < 80) {
        document.getElementById('status-negative').style.display = 'block';
        document.getElementById('status-negative').textContent = "מצב מנטלי: ירוד";
    } else {
        document.getElementById('status-negative').style.display = 'none';
    }
}

// עדכון מדי בריאות
function updateHealthBars() {
    const physicalFill = document.getElementById('physical-health-fill');
    const mentalFill = document.getElementById('mental-health-fill');
    
    // שמירת הרוחב הנוכחי למעבר חלק
    const currentPhysicalWidth = parseFloat(physicalFill.style.width) || 90;
    const currentMentalWidth = parseFloat(mentalFill.style.width) || 90;
    
    // הוספת מעבר חלק אם יש שינוי משמעותי
    if (Math.abs(currentPhysicalWidth - stats.physicalHealth) > 5) {
        physicalFill.style.transition = 'width 0.5s ease';
        setTimeout(() => { physicalFill.style.transition = 'width 0.3s ease'; }, 500);
    }
    
    if (Math.abs(currentMentalWidth - stats.mentalHealth) > 5) {
        mentalFill.style.transition = 'width 0.5s ease';
        setTimeout(() => { mentalFill.style.transition = 'width 0.3s ease'; }, 500);
    }
    
    // הגדרת ערכים חדשים
    physicalFill.style.width = `${stats.physicalHealth}%`;
    mentalFill.style.width = `${stats.mentalHealth}%`;
    
    // עדכון צבע לפי רמת בריאות
    if (stats.physicalHealth < 40) {
        physicalFill.style.backgroundColor = 'var(--danger-color)';
    } else if (stats.physicalHealth < 70) {
        physicalFill.style.backgroundColor = 'var(--warning-color)';
    } else {
        physicalFill.style.backgroundColor = 'var(--success-color)';
    }
    
    if (stats.mentalHealth < 40) {
        mentalFill.style.backgroundColor = 'var(--danger-color)';
    } else if (stats.mentalHealth < 70) {
        mentalFill.style.backgroundColor = 'var(--warning-color)';
    } else {
        mentalFill.style.backgroundColor = 'var(--primary-color)';
    }
}

// איפוס מונה מכשולים וחיזוקים חודשי
function resetMonthlyItemCounter() {
    monthlyItemCounter = {
        obstacles: {
            'person': 0,
            'ad': 0,
            'unhealthy-food': 0,
            'eating-out': 0,
            'job-offer': 0,
            'knowledge': 0
        },
        boosts: {
            'money': 0,
            'earlyRise': 0,
            'earlySleep': 0,
            'healthyFood': 0,
            'exercise': 0,
            'companion': 0
        }
    };
}

// יצירת מכשול
function createObstacle() {
    // קבלת מכשול אקראי
    const obstacle = getRandomObstacle();
    
    if (!obstacle) return;
    
    // אם כבר יש מכשולים מסוג זה במהלך החודש, נחפש סוג אחר
    if (monthlyItemCounter.obstacles[obstacle.type] >= 2) {
        createObstacle(); // ניסיון חוזר
        return;
    }
    
    // עדכון ספירת מכשולים מסוג זה
    monthlyItemCounter.obstacles[obstacle.type]++;
    
    // הצגת דיאלוג המכשול עם המכשול הנבחר
    showObstacleDialog(obstacle);
}

// יצירת חיזוק חיובי
function createBoost() {
    // קבלת חיזוק אקראי
    const boost = getRandomBoost();
    
    if (!boost) return;
    
    // בדיקה שאין יותר מ-2 חיזוקים מאותו סוג בחודש
    if (monthlyItemCounter.boosts[boost.type] >= 2) {
        createBoost(); // ניסיון חוזר
        return;
    }
    
    // עדכון ספירת חיזוקים מסוג זה
    monthlyItemCounter.boosts[boost.type]++;
    
    // הצגת דיאלוג החיזוק
    showBoostDialog(boost);
}

// הצגת דיאלוג מכשול
function showObstacleDialog(obstacle) {
    // עצירת המשחק
    gamePaused = true;
    currentObstacle = obstacle;
    persuasionStage = 0; // איפוס שלב שכנוע
    
    // הגדרת תוכן הדיאלוג - שלב ראשוני
    document.getElementById('obstacle-title').textContent = obstacle.title;
    document.getElementById('obstacle-text').textContent = obstacle.text;
    
    // שינוי טקסט בכפתורים לייצג החלטה אמיתית
    document.getElementById('ignore-btn').textContent = "סירוב";
    document.getElementById('accept-btn').textContent = "הסכמה";
    
    // עיצוב ויזואלי בהתאם לסוג המכשול
    const dialogBox = document.getElementById('obstacle-dialog');
    
    // איפוס עיצוב קודם
    dialogBox.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.15)';
    
    // הוספת עיצוב לפי סוג
    switch (obstacle.type) {
        case 'person':
            dialogBox.style.boxShadow = '0 10px 40px rgba(100, 100, 150, 0.3)';
            break;
        case 'ad':
            dialogBox.style.boxShadow = '0 10px 40px rgba(73, 80, 87, 0.3)';
            break;
        case 'unhealthy-food':
            dialogBox.style.boxShadow = '0 10px 40px rgba(211, 135, 62, 0.3)';
            break;
        case 'eating-out':
            dialogBox.style.boxShadow = '0 10px 40px rgba(211, 135, 62, 0.3)';
            break;
        case 'job-offer':
            dialogBox.style.boxShadow = '0 10px 40px rgba(42, 100, 150, 0.3)';
            break;
        case 'knowledge':
            dialogBox.style.boxShadow = '0 10px 40px rgba(58, 122, 95, 0.3)';
            
            // תצוגה מיוחדת לשאלות ידע פיננסי - הצגת האפשרויות
            const options = document.getElementById('obstacle-text');
            options.innerHTML = `${obstacle.text}<br><br>
                <button id="knowledge-option1" class="knowledge-option">${obstacle.options[0]}</button>
                <button id="knowledge-option2" class="knowledge-option">${obstacle.options[1]}</button>`;
            
            // הוספת listener לכפתורי התשובה
            setTimeout(() => {
                document.getElementById('knowledge-option1').addEventListener('click', function() {
                    handleKnowledgeAnswer(obstacle, obstacle.options[0]);
                });
                document.getElementById('knowledge-option2').addEventListener('click', function() {
                    handleKnowledgeAnswer(obstacle, obstacle.options[1]);
                });
            }, 100);
            
            // הסתרת כפתורי דיאלוג רגילים בשאלות ידע
            document.getElementById('ignore-btn').style.display = 'none';
            document.getElementById('accept-btn').style.display = 'none';
            break;
    }
    
    // הצגת הדיאלוג
    dialogBox.style.display = 'block';
}

// טיפול בתשובה לשאלת ידע פיננסי
function handleKnowledgeAnswer(question, selectedAnswer) {
    const isCorrect = selectedAnswer === question.correctAnswer;
    
    if (isCorrect) {
        // תשובה נכונה
        visualEffects.showCorrectAnswerEffect();
        visualEffects.showPopupMessage("תשובה נכונה! " + question.explanation, 3000);
    } else {
        // תשובה שגויה
        visualEffects.showWrongAnswerEffect();
        visualEffects.showPopupMessage("תשובה שגויה. " + question.explanation, 3000);
        
        // פגיעה בבריאות המנטלית
        stats.mentalHealth = visualEffects.showWrongAnswerEffect();
        visualEffects.showPopupMessage("תשובה שגויה. " + question.explanation, 3000);
        
        // פגיעה בבריאות המנטלית
        stats.mentalHealth = Math.max(20, stats.mentalHealth - question.mentalEffect);
        
        // עדכון מדי בריאות
        updateHealthBars();
        
        // עדכון מהירות יום בהתאם לבריאות
        updateDaySpeed();
        
        // הראה אפקט פגיעה מנטלית
        visualEffects.showNegativeMentalEffect();
    }
    
    // הסתרת הדיאלוג לאחר 3 שניות
    setTimeout(() => {
        hideObstacleDialog();
    }, 3000);
}

// המשך לשלב שכנוע הבא במכשול
function continuePersuasion() {
    if (!currentObstacle) return;
    
    persuasionStage++;
    
    // בדיקה אם יש עוד טקסטים שכנועיים
    if (persuasionStage <= currentObstacle.persuasiveTexts.length) {
        // עדכון טקסט לשלב הנוכחי עם אנימציה
        const textElement = document.getElementById('obstacle-text');
        
        // הנעלמת הטקסט הנוכחי
        textElement.style.transition = 'opacity 0.2s, transform 0.2s';
        textElement.style.opacity = '0';
        textElement.style.transform = 'translateY(-10px)';
        
        // אחרי הנעלמה, עדכון טקסט והופעה מחדש
        setTimeout(() => {
            textElement.textContent = currentObstacle.persuasiveTexts[persuasionStage - 1];
            
            // הופעת הטקסט החדש
            textElement.style.transform = 'translateY(0)';
            textElement.style.opacity = '1';
        }, 200);
        
        // אם זה השלב האחרון, שינוי טקסט כפתור הסירוב
        if (persuasionStage === currentObstacle.persuasiveTexts.length) {
            document.getElementById('ignore-btn').textContent = "החלטה סופית: סירוב";
            document.getElementById('ignore-btn').style.fontWeight = 'bold';
            document.getElementById('ignore-btn').style.background = 'var(--success-color)';
        } else {
            document.getElementById('ignore-btn').textContent = "סירוב";
        }
    } else {
        // אם אין עוד טקסטים, סגירת הדיאלוג
        hideObstacleDialog();
        stats.obstaclesAvoided++; // הגדלת מונה ההתנגדות למכשולים
        
        // עליה קטנה בבריאות המנטלית על התנגדות מלאה
        stats.mentalHealth = Math.min(100, stats.mentalHealth + 5);
        updateHealthBars();
        updateDaySpeed();
        
        // הצגת הודעת התנגדות
        visualEffects.showPopupMessage("קבלת החלטה פיננסית מושכלת!", 2500);
        
        // הוספת חיזוק ויזואלי להחלטה טובה
        visualEffects.showPositiveDecisionEffect(player);
    }
}

// קבלת המכשול והשפעתו
function acceptObstacle() {
    if (!currentObstacle) return;
    
    // השפעות לפי סוג המכשול
    switch(currentObstacle.type) {
        case 'person':
            // השפעה שלילית על הבריאות המנטלית
            stats.mentalHealth = Math.max(20, stats.mentalHealth - currentObstacle.mentalEffect);
            visualEffects.showPopupMessage(`לחץ חברתי השפיע עליך: -${currentObstacle.mentalEffect} נקודות חוסן מנטלי`, 2500);
            visualEffects.showNegativeMentalEffect();
            break;
            
        case 'ad':
            // הוצאה כספית
            score -= currentObstacle.value;
            stats.expenses += currentObstacle.value;
            visualEffects.showPopupMessage(`הוצאה בלתי מתוכננת: -${currentObstacle.value} ש"ח`, 2000);
            visualEffects.showMoneyLossEffect(currentObstacle.value);
            break;
            
        case 'unhealthy-food':
            // השפעה על בריאות פיזית ומנטלית
            stats.physicalHealth = Math.max(20, stats.physicalHealth - currentObstacle.physicalEffect);
            stats.mentalHealth = Math.max(20, stats.mentalHealth - currentObstacle.mentalEffect);
            visualEffects.showPopupMessage(`אוכל לא בריא: -${currentObstacle.physicalEffect} נקודות בריאות פיזית, -${currentObstacle.mentalEffect} בריאות מנטלית`, 3000);
            visualEffects.showNegativePhysicalEffect();
            break;
            
        case 'eating-out':
            // הוצאה כספית על אוכל בחוץ
            score -= currentObstacle.value;
            stats.expenses += currentObstacle.value;
            visualEffects.showPopupMessage(`אכילה בחוץ: -${currentObstacle.value} ש"ח`, 2000);
            visualEffects.showMoneyLossEffect(currentObstacle.value);
            break;
            
        case 'job-offer':
            // סיום המשחק בהפסד
            gameOver("החלפת קריירה. איבדת את היציבות הפיננסית בתקופת המעבר.");
            return;
    }
    
    // עדכון אינטראקציות מכשולים
    stats.obstaclesFaced++;
    
    // עדכון מצב השחקן ומהירות היום
    updateHealthBars();
    updateDaySpeed();
    updateDisplay();
    
    // איפוס והמשך המשחק
    hideObstacleDialog();
    
    // בדיקה אם השחקן כעת בפשיטת רגל
    if (score < 0) {
        gameOver(`המאזן השלילי הוביל לקריסה פיננסית. הוצאת יותר מדי כסף`);
        return;
    }
    
    // בדיקה אם הבריאות המנטלית או הפיזית נמוכה מדי
    if (stats.mentalHealth <= 20) {
        gameOver("החוסן המנטלי שלך נפגע משמעותית. אינך מסוגל להמשיך.");
        return;
    }
    
    if (stats.physicalHealth <= 20) {
        gameOver("בריאותך הפיזית נפגעה באופן חמור. קשה לך להמשיך בדרך.");
        return;
    }
}

// הסתרת דיאלוג המכשול
function hideObstacleDialog() {
    // הסתרת הדיאלוג עם אנימציית יציאה
    const dialogBox = document.getElementById('obstacle-dialog');
    dialogBox.style.animation = 'obstacle-dialog-exit 0.3s ease forwards';
    
    // החזרת כפתורי הדיאלוג הרגילים (אם הוסתרו)
    document.getElementById('ignore-btn').style.display = 'inline-block';
    document.getElementById('accept-btn').style.display = 'inline-block';
    
    // הסתרת הדיאלוג לאחר האנימציה
    setTimeout(() => {
        dialogBox.style.display = 'none';
        currentObstacle = null;
        gamePaused = false;
        persuasionStage = 0;
        
        // איפוס טקסט וסגנון כפתור סירוב
        document.getElementById('ignore-btn').textContent = "סירוב";
        document.getElementById('ignore-btn').style.fontWeight = 'normal';
        document.getElementById('ignore-btn').style.background = 'var(--success-color)';
    }, 300);
}

// הצגת דיאלוג חיזוק
function showBoostDialog(boost) {
    gamePaused = true;
    currentBoost = boost;
    boostFollowupIndex = 0;
    
    // הגדרת שאלה בהתאם לסוג החיזוק
    const boostTitle = document.getElementById('powerup-title');
    boostTitle.textContent = boost.title;
    
    // הגדרת תוכן הדיאלוג
    document.getElementById('powerup-text').textContent = boost.text;
    
    // עיצוב מיוחד לפי סוג החיזוק
    const dialogBox = document.getElementById('powerup-dialog');
    
    // איפוס עיצוב קודם
    dialogBox.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.15)';
    
    // הוספת עיצוב לפי סוג
    switch(boost.type) {
        case 'exercise':
            dialogBox.style.boxShadow = '0 10px 40px rgba(211, 135, 62, 0.3)';
            break;
        case 'healthyFood':
            dialogBox.style.boxShadow = '0 10px 40px rgba(58, 122, 95, 0.3)';
            break;
        case 'money':
            dialogBox.style.boxShadow = '0 10px 40px rgba(42, 100, 150, 0.3)';
            break;
        case 'companion':
            dialogBox.style.boxShadow = '0 10px 40px rgba(42, 100, 150, 0.4)';
            break;
    }
    
    // הצגת הדיאלוג
    dialogBox.style.display = 'block';
}

// מענה חיובי לחיזוק
function boostYesResponse() {
    if (!currentBoost) return;
    
    // אם זה בונוס עם שאלות המשך
    if (currentBoost.type === 'money' && currentBoost.followupQuestions && 
        currentBoost.followupQuestions.length > 0 && boostFollowupIndex < currentBoost.followupQuestions.length) {
        if (boostFollowupIndex > 0) {
            // הצגת משוב חיובי
            visualEffects.showPopupMessage(currentBoost.followupQuestions[boostFollowupIndex - 1].positiveEffect, 2500);
        }
        
        // הצגת השאלה הבאה עם אנימציה
        const questionText = document.getElementById('powerup-text');
        questionText.style.opacity = '0';
        questionText.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            questionText.textContent = currentBoost.followupQuestions[boostFollowupIndex].question;
            questionText.style.opacity = '1';
            questionText.style.transform = 'translateY(0)';
        }, 300);
        
        boostFollowupIndex++;
        return;
    }
    
    // יישום השפעת החיזוק בהתאם לסוג
    stats.powerupsCollected++;
    
    switch(currentBoost.type) {
        case 'money':
            // בונוס כספי
            let bonusAmount = currentBoost.value;
            
            // אם השחקן ענה על שאלות המשך, הגדלת הבונוס
            if (currentBoost.followupQuestions && currentBoost.followupQuestions.length > 0) {
                bonusAmount = Math.round(bonusAmount * (1 + 0.2 * boostFollowupIndex));
            }
            
            score += bonusAmount;
            visualEffects.showCoinAnimation(bonusAmount);
            visualEffects.showPopupMessage(`קיבלת בונוס של ${bonusAmount} ש"ח!`, 2000);
            break;
            
        case 'earlyRise':
        case 'earlySleep':
            // שיפור בריאות מנטלית
            stats.mentalHealth = Math.min(100, stats.mentalHealth + currentBoost.mentalEffect);
            
            // שיפור בריאות פיזית (חצי מהשיפור המנטלי)
            stats.physicalHealth = Math.min(100, stats.physicalHealth + (currentBoost.mentalEffect / 2));
            
            visualEffects.showMentalBoostEffect();
            visualEffects.showPopupMessage(`שיפור בריאות מנטלית: +${currentBoost.mentalEffect} נקודות, שיפור בריאות פיזית: +${currentBoost.mentalEffect / 2} נקודות`, 3000);
            break;
            
        case 'healthyFood':
        case 'exercise':
            // שיפור בריאות פיזית
            stats.physicalHealth = Math.min(100, stats.physicalHealth + currentBoost.physicalEffect);
            
            // שיפור בריאות מנטלית (חצי מהשיפור הפיזי)
            stats.mentalHealth = Math.min(100, stats.mentalHealth + (currentBoost.physicalEffect / 2));
            
            visualEffects.showPhysicalBoostEffect();
            visualEffects.showPopupMessage(`שיפור בריאות פיזית: +${currentBoost.physicalEffect} נקודות, שיפור בריאות מנטלית: +${currentBoost.physicalEffect / 2} נקודות`, 3000);
            break;
            
        case 'companion':
            // חיזוק של תמיכה חברתית
            stats.mentalHealth = Math.min(100, stats.mentalHealth + currentBoost.mentalEffect);
            stats.physicalHealth = Math.min(100, stats.physicalHealth + currentBoost.physicalEffect);
            
            visualEffects.showMentalBoostEffect();
            visualEffects.showPopupMessage(`תמיכה חברתית מחזקת את החוסן האישי! +${currentBoost.mentalEffect} בריאות מנטלית, +${currentBoost.physicalEffect} בריאות פיזית`, 3000);
            break;
    }
    
    // עדכון מדי בריאות
    updateHealthBars();
    
    // עדכון מהירות היום בהתאם לבריאות
    updateDaySpeed();
    
    // סגירת הדיאלוג והמשך המשחק
    hideBoostDialog();
    
    // עדכון תצוגה
    updateDisplay();
}

// מענה שלילי לחיזוק
function boostNoResponse() {
    if (!currentBoost) return;
    
    // אם זה בונוס עם שאלות המשך
    if (currentBoost.type === 'money' && currentBoost.followupQuestions && 
        currentBoost.followupQuestions.length > 0 && boostFollowupIndex < currentBoost.followupQuestions.length) {
        if (boostFollowupIndex > 0) {
            // הצגת משוב שלילי
            visualEffects.showPopupMessage(currentBoost.followupQuestions[boostFollowupIndex - 1].negativeEffect, 2500);
        }
        
        // הצגת השאלה הבאה עם אנימציה
        const questionText = document.getElementById('powerup-text');
        questionText.style.opacity = '0';
        questionText.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            questionText.textContent = currentBoost.followupQuestions[boostFollowupIndex].question;
            questionText.style.opacity = '1';
            questionText.style.transform = 'translateY(0)';
        }, 300);
        
        boostFollowupIndex++;
        return;
    }
    
    // השפעה שלילית בהתאם לסוג
    switch (currentBoost.type) {
        case 'exercise':
        case 'healthyFood':
            // ירידה בבריאות הפיזית
            stats.physicalHealth = Math.max(20, stats.physicalHealth - 5);
            visualEffects.showPopupMessage("חוסר בפעילות גופנית/תזונה בריאה פוגע בבריאותך", 2500);
            visualEffects.showNegativePhysicalEffect();
            break;
            
        case 'earlyRise':
        case 'earlySleep':
            // ירידה בבריאות המנטלית
            stats.mentalHealth = Math.max(20, stats.mentalHealth - 5);
            visualEffects.showPopupMessage("חוסר איזון בשעות שינה/קימה פוגע בבריאותך המנטלית", 2500);
            visualEffects.showNegativeMentalEffect();
            break;
            
        case 'money':
            // הפסד הבונוס
            visualEffects.showPopupMessage("פספסת הזדמנות לשיפור מצבך הפיננסי", 2500);
            break;
            
        case 'companion':
            // ירידה קלה בבריאות המנטלית
            stats.mentalHealth = Math.max(20, stats.mentalHealth - 5);
            visualEffects.showPopupMessage("תמיכה חברתית חשובה ליציבות הנפשית", 2500);
            visualEffects.showNegativeMentalEffect();
            break;
    }
    
    // עדכון מדי בריאות
    updateHealthBars();
    
    // עדכון מהירות היום בהתאם לבריאות
    updateDaySpeed();
    
    // סגירת הדיאלוג
    hideBoostDialog();
    
    // עדכון תצוגה
    updateDisplay();
}

// הסתרת דיאלוג החיזוק
function hideBoostDialog() {
    // סגירת הדיאלוג עם אנימציית יציאה
    const dialogBox = document.getElementById('powerup-dialog');
    dialogBox.style.animation = 'powerup-dialog-exit 0.3s ease forwards';
    
    // הסתרת הדיאלוג לאחר האנימציה
    setTimeout(() => {
        dialogBox.style.display = 'none';
        currentBoost = null;
        gamePaused = false;
    }, 300);
}

// עדכון משחק
function updateGame() {
    if (!gameRunning || gamePaused) return;
    
    // עדכון מחזור יום/לילה
    updateDayNightCycle();
    
    // עדכון טיימר חודש רק אם השחקן נע
    if (isMoving) {
        // התקדמות במהירות המותאמת למצב השחקן
        currentMonthFrame += player.currentSpeed / player.baseSpeed;
        
        // טיפול בהוראות תנועה - הסתרת הודעה כשהשחקן זז
        if (moveTimer) {
            clearTimeout(moveTimer);
            moveTimer = null;
            document.getElementById('movement-instruction').style.display = 'none';
        }
    } else {
        // הצגת הוראות תנועה אם השחקן לא זז כמה שניות
        if (!moveTimer) {
            moveTimer = setTimeout(() => {
                document.getElementById('movement-instruction').style.display = 'block';
                // אפקט הבהוב להדגשת ההוראה
                let blinkCount = 0;
                const blinkInterval = setInterval(() => {
                    if (blinkCount >= 6 || isMoving) {
                        clearInterval(blinkInterval);
                        document.getElementById('movement-instruction').style.opacity = '1';
                        return;
                    }
                    
                    const elem = document.getElementById('movement-instruction');
                    elem.style.opacity = elem.style.opacity === '0.3' ? '1' : '0.3';
                    blinkCount++;
                }, 500);
            }, 2000);
        }
    }
    
    // בדיקה אם החודש הסתיים
    if (currentMonthFrame >= framesPerMonth) {
        endOfMonth();
    }
    
    // יצירת אפקט אבק בתנועה
    if (isMoving && Math.random() < 0.1) {
        visualEffects.createDustParticle(player, ground, isDayTime);
    }
    
    // אולי יצירת מכשול או חיזוק חדש
    maybeCreateObstacleOrBoost();
    
    // עדכון תצוגה ויזואלית
    renderGame();
}

// אולי יצירת מכשול או חיזוק חדש
function maybeCreateObstacleOrBoost() {
    if (!isMoving) return;
    
    // הגדלת הסיכוי ליצירת מכשול/חיזוק כשהשחקן זז
    
    // סיכוי למכשול - 0.5% בכל פריים כשזז
    if (Math.random() < 0.005) {
        createObstacle();
    }
    
    // סיכוי לחיזוק - 0.3% בכל פריים כשזז
    if (Math.random() < 0.003) {
        createBoost();
    }
}

// טיפול בסוף חודש
function endOfMonth() {
    currentMonthFrame = 0;
    currentMonth++;
    stats.monthsPlayed++;
    
    // הוספת הכנסה חודשית עם אנימציה
    score += stats.income;
    visualEffects.showMonthlyIncomeEffect(stats.income);
    
    // איפוס מונה חודשי
    resetMonthlyItemCounter();
    
    // בדיקת תנאי ניצחון
    if (score >= 100000) {
        winGame();
        return;
    }
    
    // עדכון תצוגה
    updateDisplay();
    
    // הצגת אנימציית מעבר חודש
    visualEffects.showMonthTransitionEffect(monthNames[currentMonth]);
}

// עדכון תצוגה
function updateDisplay() {
    // עדכון ניקוד עם אנימציה אם יש שינוי משמעותי
    const scoreDisplay = document.getElementById('score-display');
    const currentScoreText = scoreDisplay.textContent;
    const currentScore = parseInt(currentScoreText.match(/\d+/g).join(''));
    
    if (Math.abs(currentScore - score) > 100) {
        // אנימציית שינוי ניקוד
        animateScoreChange(currentScore, score);
    } else {
        // עדכון פשוט
        scoreDisplay.textContent = `סך נכסים פיננסיים: ${score.toLocaleString()} ש"ח`;
    }
    
    // עדכון תצוגת תאריך
    const dateDisplay = document.getElementById('date-display');
    
    if (dateDisplay.textContent !== monthNames[currentMonth]) {
        // שמירת טרנספורם מקורי
        const originalTransform = dateDisplay.style.transform;
        
        // הנעלמה
        dateDisplay.style.opacity = '0';
        dateDisplay.style.transform = 'translateY(-5px)';
        
        // אחרי הנעלמה, עדכון טקסט והופעה מחדש
        setTimeout(() => {
            dateDisplay.textContent = monthNames[currentMonth];
            dateDisplay.style.opacity = '1';
            dateDisplay.style.transform = originalTransform;
        }, 300);
    }
    
    // עדכון נתונים חודשיים
    document.getElementById('expenses').textContent = stats.expenses.toLocaleString();
    document.getElementById('income').textContent = stats.income.toLocaleString();
}

// אנימציית שינוי ניקוד
function animateScoreChange(startScore, endScore) {
    const scoreDisplay = document.getElementById('score-display');
    const duration = 1000; // אנימציה למשך שנייה
    const startTime = Date.now();
    const scoreChange = endScore - startScore;
    
    // הדגשה ויזואלית לפי כיוון השינוי
    if (scoreChange > 0) {
        scoreDisplay.style.color = 'var(--success-color)';
        scoreDisplay.style.textShadow = '0 0 5px rgba(58, 122, 95, 0.3)';
    } else if (scoreChange < 0) {
        scoreDisplay.style.color = 'var(--danger-color)';
        scoreDisplay.style.textShadow = '0 0 5px rgba(212, 91, 91, 0.3)';
    }
    
    // פונקציית אנימציה
    function animate() {
        const elapsedTime = Date.now() - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // פונקציית האטה לאנימציה חלקה
        const easedProgress = progress < 0.5 ? 
            4 * progress * progress * progress : 
            1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // חישוב הערך הנוכחי
        const currentValue = Math.round(startScore + scoreChange * easedProgress);
        
        // עדכון תצוגה
        scoreDisplay.textContent = `סך נכסים פיננסיים: ${currentValue.toLocaleString()} ש"ח`;
        
        // המשך האנימציה אם לא הסתיימה
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // איפוס סגנון אחרי האנימציה
            setTimeout(() => {
                scoreDisplay.style.color = 'var(--primary-color)';
                scoreDisplay.style.textShadow = 'none';
            }, 500);
        }
    }
    
    // התחלת האנימציה
    animate();
}

// ציור הרקע הדינמי בהתאם לזמן ביום
function drawDynamicBackground() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // מיקום השמש/ירח בקנבס
    const sunElement = document.getElementById('sun');
    const moonElement = document.getElementById('moon');
    const sunX = parseInt(sunElement.style.left || '0');
    const sunY = parseInt(sunElement.style.top || '0');
    const moonX = parseInt(moonElement.style.left || '0');
    const moonY = parseInt(moonElement.style.top || '0');
    
    // ציור השמיים בהתאם לזמן יום
    const hour = currentHour + (currentMinute / 60);
    let gradientColors;
    
    // שחר (5-6)
    if (hour >= 5 && hour < 6) {
        const progress = (hour - 5);
        gradientColors = {
            start: interpolateColor('#283655', '#87CEEB', progress),
            end: interpolateColor('#1a2238', '#ADD8E6', progress)
        };
    }
    // בוקר (6-10)
    else if (hour >= 6 && hour < 10) {
        gradientColors = {
            start: '#87CEEB',
            end: '#ADD8E6'
        };
    }
    // יום (10-16)
    else if (hour >= 10 && hour < 16) {
        gradientColors = {
            start: '#6CA6CD',
            end: '#87CEEB'
        };
    }
    // אחה"צ (16-18)
    else if (hour >= 16 && hour < 18) {
        const progress = (hour - 16) / 2;
        gradientColors = {
            start: interpolateColor('#6CA6CD', '#FF7F50', progress),
            end: interpolateColor('#87CEEB', '#FFD700', progress)
        };
    }
    // שקיעה (18-19)
    else if (hour >= 18 && hour < 19) {
        const progress = (hour - 18);
        gradientColors = {
            start: interpolateColor('#FF7F50', '#283655', progress),
            end: interpolateColor('#FFD700', '#1a2238', progress)
        };
    }
    // לילה (19-5)
    else {
        gradientColors = {
            start: '#1a2238',
            end: '#283655'
        };
    }
    
    // יצירת גרדיאנט
    const skyGradient = ctx.createLinearGradient(0, 0, 0, ground.y);
    skyGradient.addColorStop(0, gradientColors.start);
    skyGradient.addColorStop(1, gradientColors.end);
    
    // ציור השמיים
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // ציור כוכבים בלילה
    if (hour >= 19 || hour < 5) {
        drawStars();
    }
    
    // ציור שכבת ערפל/אובך קלה
    if (isDayTime) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.02)";
    } else {
        ctx.fillStyle = "rgba(0, 0, 30, 0.05)";
    }
    ctx.fillRect(0, 0, canvas.width, ground.y);
    
    // ציור הקרקע עם גרדיאנט
    const groundGradient = ctx.createLinearGradient(0, ground.y, 0, canvas.height);
    groundGradient.addColorStop(0, "#adb5bd");
    groundGradient.addColorStop(1, "#6c757d");
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, ground.y, ground.width, ground.height);
    
    // ציור "נתיב קריירה יציב" על הקרקע
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "bold 40px 'Open Sans', Arial"; // הוגדל פי 2
    ctx.textAlign = "center";
    const text = "נתיב קריירה יציב";
    
    // יצירת תבנית עם הטקסט חוזר לאורך הקרקע
    const textWidth = ctx.measureText(text).width;
    const repetitions = Math.ceil(canvas.width / (textWidth + 200)); // הוגדל פי 2
    
    for (let i = 0; i < repetitions; i++) {
        ctx.fillText(text, (textWidth + 200) * i + textWidth/2 + 100, ground.y + 80); // הוגדל פי 2
    }
    
    ctx.textAlign = "start";
    
    // ציור קצה הנתיב עם צל מודגש
    const pathGlow = isDayTime ? 'rgba(73, 80, 87, 0.7)' : 'rgba(73, 80, 87, 0.9)';
    ctx.fillStyle = pathGlow;
    ctx.fillRect(0, ground.y, ground.width, 10); // הוגדל פי 2
    
    // הוספת צל/הדגשה לקצה הנתיב בהתאם לזמן יום
    if (!isDayTime) {
        // צל לילה
        ctx.fillStyle = 'rgba(0, 0, 30, 0.3)';
        ctx.fillRect(0, ground.y + 10, ground.width, 6); // הוגדל פי 2
    } else {
        // הדגשת יום
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(0, ground.y - 2, ground.width, 2); // הוגדל פי 2
    }
    
    // ציור השחקן
    drawPlayer();
}

// ציור כוכבים בשמיים
function drawStars() {
    // ציור הכוכבים מתוך מערך הכוכבים שנוצר
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        
        // אפקט הבהוב
        const twinkle = 0.5 + Math.sin(Date.now() * 0.001 * star.twinkleSpeed) * 0.5;
        const size = star.size * (0.7 + twinkle * 0.3);
        
        // ציור הכוכב
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + twinkle * 0.5})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ציור השחקן עם אנימציות ואפקטים
function drawPlayer() {
    // שימוש בגורם בריאות להתאמת מראה השחקן
    const healthFactor = stats.physicalHealth / 100;
    const mentalFactor = stats.mentalHealth / 100;
    
    // חישוב צבע השחקן בהתאם לבריאות - שינוי עדין
    const r = Math.floor(73 + (1 - healthFactor) * 40);
    const g = Math.floor(80 + (1 - healthFactor) * 10);
    const b = Math.floor(87 + (healthFactor) * 10);
    const playerColor = `rgb(${r}, ${g}, ${b})`;
    
    // הוספת אנימציית נענוע קלה כשזז
    let playerY = player.y;
    if (isMoving) {
        playerY += Math.sin(Date.now() * 0.01) * 4; // הוגדל פי 2
    }
    
    // ציור צל מתחת לשחקן
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(player.x + player.width/2, ground.y, player.width/2, player.width/8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // ציור גוף השחקן - סגנון משופר
    ctx.fillStyle = playerColor;
    
    // אם לשחקן יש חיזוק, הוספת אפקט זוהר
    if (player.powerUp) {
        let glowColor;
        
        switch(player.powerUpType) {
            case 'earlyRise':
            case 'earlySleep':
                glowColor = 'rgba(58, 122, 95, 0.7)'; // ירוק-כחול
                break;
            case 'healthyFood':
                glowColor = 'rgba(58, 122, 95, 0.7)'; // ירוק
                break;
            case 'exercise':
                glowColor = 'rgba(211, 135, 62, 0.7)'; // כתום
                break;
            case 'companion':
                glowColor = 'rgba(42, 100, 150, 0.7)'; // כחול
                break;
            default:
                glowColor = 'rgba(73, 80, 87, 0.7)'; // אפור ברירת מחדל
        }
        
        // הוספת זוהר עם אנימציית פעימה
        const glowSize = 20 + Math.sin(Date.now() * 0.005) * 6; // הוגדל פי 2
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowSize;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }
    
    // גוף כמלבן מעוגל עם הטיה קלה קדימה כשנע
    if (isMoving) {
        // שמירת הקונטקסט לסיבוב הגוף
        ctx.save();
        ctx.translate(player.x + player.width/2, playerY + player.height/2);
        ctx.rotate(Math.PI * 0.03); // הטיה קדימה קלה
        ctx.translate(-(player.x + player.width/2), -(playerY + player.height/2));
    }
    
    roundRect(ctx, player.x, playerY, player.width, player.height, 20, true, false); // הוגדל פי 2
    
    if (isMoving) {
        ctx.restore();
    }
    
    // איפוס צל
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // ראש עם תזוזת ראש עדינה כשנע
    const headY = playerY + player.width/2;
    const headBob = isMoving ? Math.sin(Date.now() * 0.01) * 4 : 0; // הוגדל פי 2
    
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, headY + headBob, player.width/2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // הבעת פנים בהתאם לבריאות מנטלית - סגנון דינמי
    ctx.strokeStyle = "#e9ecef";
    ctx.lineWidth = 4; // הוגדל פי 2
    
    // עיניים עם מצמוץ מדי פעם
    const blinkState = Math.floor(Date.now() / 1000) % 5 === 0;
    
    if (blinkState) {
        // עיניים סגורות (מצמוץ)
        ctx.beginPath();
        ctx.moveTo(player.x + player.width/2 - 16, headY + headBob); // הוגדל פי 2
        ctx.lineTo(player.x + player.width/2 - 4, headY + headBob); // הוגדל פי 2
        
        ctx.moveTo(player.x + player.width/2 + 4, headY + headBob); // הוגדל פי 2
        ctx.lineTo(player.x + player.width/2 + 16, headY + headBob); // הוגדל פי 2
        ctx.stroke();
    } else {
        // עיניים פתוחות (לא מצמוץ)
        ctx.beginPath();
        ctx.arc(player.x + player.width/2 - 16, headY + headBob - 6, 4, 0, Math.PI * 2); // הוגדל פי 2
        ctx.arc(player.x + player.width/2 + 16, headY + headBob - 6, 4, 0, Math.PI * 2); // הוגדל פי 2
        ctx.stroke();
    }
    
    // פה בהתאם למצב מנטלי - מונפש
    const mouthCurveBase = mentalFactor < 0.5 ? -1 : 1; // עצוב או שמח
    
    // הוספת אנימציה קלה לעקומת הפה
    const mouthAnimate = isMoving ? 
        Math.sin(Date.now() * 0.01) * 0.3 : // אנימציה כשנע
        Math.sin(Date.now() * 0.002) * 0.1;  // אנימציה עדינה כשסטטי
    
    const mouthCurve = mouthCurveBase + mouthAnimate;
    
    // חישוב נקודות בקרה לעקומה
    const mouthWidth = player.width/5;
    const mouthX = player.x + player.width/2;
    const mouthY = headY + headBob + 10; // הוגדל פי 2
    
    if (mouthCurve < 0) {
        // הבעה עצובה
        ctx.beginPath();
        ctx.moveTo(mouthX - mouthWidth, mouthY);
        ctx.quadraticCurveTo(mouthX, mouthY + mouthWidth * Math.abs(mouthCurve), mouthX + mouthWidth, mouthY);
        ctx.stroke();
    } else {
        // הבעה שמחה/ניטרלית
        ctx.beginPath();
        ctx.moveTo(mouthX - mouthWidth, mouthY);
        ctx.quadraticCurveTo(mouthX, mouthY - mouthWidth * mouthCurve, mouthX + mouthWidth, mouthY);
        ctx.stroke();
    }
    
    // בועת מחשבה מדי פעם עם חכמת פיננסית
    if (Math.random() < 0.001 && !isMoving) {
        const thoughts = [
            "חיסכון קבוע מביא לביטחון פיננסי",
            "ההוצאות הקטנות מצטברות",
            "השקעה בעצמי היא ההשקעה הטובה ביותר",
            "סבלנות היא המפתח להצלחה פיננסית",
            "לתכנן מראש חוסך כסף בטווח הארוך"
        ];
        
        drawThoughtBubble(
            ctx,
            player.x + player.width + 20, // הוגדל פי 2
            playerY,
            thoughts[Math.floor(Math.random() * thoughts.length)],
            240, // הוגדל פי 2
            120  // הוגדל פי 2
        );
    }
    
    // ציור קווי תנועה אם השחקן נע
    if (isMoving) {
        // קווי תנועה מאחורי השחקן - עדינים יותר למראה בוגר
        ctx.strokeStyle = isDayTime ? "rgba(108, 117, 125, 0.4)" : "rgba(150, 150, 180, 0.4)";
        ctx.lineWidth = 3; // הוגדל פי 2
        
        const motionX = player.x - 60; // הוגדל פי 2
        
        for (let i = 0; i < 4; i++) {
            const lineY = player.y + 40 + i * 30; // הוגדל פי 2
            const lineLength = 16 + i * 8; // הוגדל פי 2
            
            // אנימציית אורך קווי תנועה בהתאם למהירות השחקן
            const animatedLength = lineLength * (0.8 + Math.sin(Date.now() * 0.01 + i) * 0.2);
            
            ctx.beginPath();
            ctx.moveTo(motionX, lineY);
            ctx.lineTo(motionX - animatedLength, lineY);
            ctx.stroke();
        }
    }
}

// ציור בועת מחשבה
function drawThoughtBubble(ctx, x, y, text, maxWidth, maxHeight) {
    // חישוב מטריקות טקסט וגודל בועה
    ctx.font = "24px 'Open Sans', Arial"; // הוגדל פי 2
    const words = text.split(' ');
    const lineHeight = 28; // הוגדל פי 2
    let lines = [];
    let currentLine = '';
    
    // פיצול טקסט לשורות
    words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    // הגבלת מספר השורות להתאמה לגובה המקסימלי
    if (lines.length * lineHeight > maxHeight) {
        lines = lines.slice(0, Math.floor(maxHeight / lineHeight) - 1);
        lines.push('...');
    }
    
    const bubbleWidth = maxWidth + 40; // הוגדל פי 2
    const bubbleHeight = lines.length * lineHeight + 40; // הוגדל פי 2
    const bubbleX = x;
    const bubbleY = y - bubbleHeight / 2;
    
    // ציור בועה עיקרית
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2; // הוגדל פי 2
    
    // מלבן מעוגל לבועה עם קצוות דמויי ענן
    roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 24, true, true); // הוגדל פי 2
    
    // ציור בועות מחברות
    const bubbleRadius = 16; // הוגדל פי 2
    
    // בועה מחברת ראשונה
    ctx.beginPath();
    ctx.arc(bubbleX - 30, bubbleY + bubbleHeight, bubbleRadius, 0, Math.PI * 2); // הוגדל פי 2
    ctx.fill();
    ctx.stroke();
    
    // בועה מחברת שנייה
    ctx.beginPath();
    ctx.arc(bubbleX - 50, bubbleY + bubbleHeight + 20, bubbleRadius * 0.7, 0, Math.PI * 2); // הוגדל פי 2
    ctx.fill();
    ctx.stroke();
    
    // בועה מחברת שלישית
    ctx.beginPath();
    ctx.arc(bubbleX - 70, bubbleY + bubbleHeight + 30, bubbleRadius * 0.4, 0, Math.PI * 2); // הוגדל פי 2
    ctx.fill();
    ctx.stroke();
    
    // ציור הטקסט
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.textAlign = 'right'; // התאמה לעברית
    
    lines.forEach((line, index) => {
        ctx.fillText(line, bubbleX + bubbleWidth - 20, bubbleY + 40 + (index * lineHeight)); // הוגדל פי 2
    });
    
    ctx.textAlign = 'start';
}

// פונקציית עזר למלבנים מעוגלים
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }
}

// ערבוב צבעים לאפקט שמיים
function interpolateColor(color1, color2, ratio) {
    // המרת הקסדצימלי או RGB לערכי RGB
    function getRGB(color) {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return [r, g, b];
        } else if (color.startsWith('rgb')) {
            return color.match(/\d+/g).map(Number);
        }
        return [0, 0, 0]; // ברירת מחדל
    }
    
    const rgb1 = getRGB(color1);
    const rgb2 = getRGB(color2);
    
    const r = Math.round(rgb1[0] * (1 - ratio) + rgb2[0] * ratio);
    const g = Math.round(rgb1[1] * (1 - ratio) + rgb2[1] * ratio);
    const b = Math.round(rgb1[2] * (1 - ratio) + rgb2[2] * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
}

// ציור משחק
function renderGame() {
    drawDynamicBackground();
}

// התחלת תנועה
function startMoving() {
    if (!isMoving) {
        isMoving = true;
        document.getElementById('movement-instruction').style.display = 'none';
        
        // משוב ויזואלי להתחלת תנועה
        player.y -= 4; // קפיצה קלה למעלה (הוגדל פי 2)
        
        // יצירת חלקיקי אבק ברגלי השחקן
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                visualEffects.createDustParticle(player, ground, isDayTime);
            }, i * 100);
        }
        
        if (moveTimer) {
            clearTimeout(moveTimer);
            moveTimer = null;
        }
    }
}

// עצירת תנועה
function stopMoving() {
    if (isMoving) {
        isMoving = false;
        player.y += 4; // חזרה למיקום המקורי (הוגדל פי 2)
        
        // יצירת אפקט אבק עצירה
        visualEffects.createDustParticle(player, ground, isDayTime);
    }
}

// סיום משחק (הפסד)
function gameOver(reason) {
    gameRunning = false;
    
    // עדכון סטטיסטיקות משחק
    document.getElementById('game-over-reason').textContent = reason;
    document.getElementById('final-score').textContent = score.toLocaleString();
    document.getElementById('months-played').textContent = stats.monthsPlayed;
    document.getElementById('powerups-collected').textContent = stats.powerupsCollected;
    document.getElementById('obstacles-avoided').textContent = stats.obstaclesAvoided;
    
    // הוספת אפקט סיום דרמטי
    visualEffects.gameOverEffect();
    
    // הצגת מסך סיום אחרי השהייה קצרה
    setTimeout(() => {
        document.getElementById('game-over').style.display = 'block';
    }, 800);
}

// ניצחון במשחק
function winGame() {
    gameRunning = false;
    
    // עדכון סטטיסטיקות ניצחון
    document.getElementById('win-months').textContent = stats.monthsPlayed;
    document.getElementById('win-powerups').textContent = stats.powerupsCollected;
    document.getElementById('win-obstacles').textContent = stats.obstaclesAvoided;
    
    // אפקט ניצחון
    visualEffects.winGameEffect();
    
    // הצגת מסך ניצחון אחרי השהייה קצרה
    setTimeout(() => {
        document.getElementById('win-screen').style.display = 'block';
    }, 1500);
}

// אתחול מחדש של המשחק
function resetGame() {
    // אפקט היעלמות מצב נוכחי
    const fadeOverlay = document.createElement('div');
    fadeOverlay.className = 'fade-overlay';
    fadeOverlay.style.position = 'absolute';
    fadeOverlay.style.top = '0';
    fadeOverlay.style.left = '0';
    fadeOverlay.style.width = '100%';
    fadeOverlay.style.height = '100%';
    fadeOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    fadeOverlay.style.transition = 'background-color 0.8s ease';
    fadeOverlay.style.zIndex = '150';
    
    document.getElementById('game-container').appendChild(fadeOverlay);
    
    // היעלמות ללבן
    setTimeout(() => {
        fadeOverlay.style.backgroundColor = 'rgba(255, 255, 255, 1)';
    }, 100);
    
    // אחרי היעלמות, איפוס מצב המשחק
    setTimeout(() => {
        // איפוס משתני משחק
        gameRunning = true;
        gamePaused = false;
        score = 0;
        currentMonth = 0;
        currentMonthFrame = 0;
        isMoving = false;
        
        // איפוס שעון ל-5:00 בבוקר
        currentHour = 5;
        currentMinute = 0;
        isDayTime = true;
        
        // ניקוי כל טיימר קיים
        if (moveTimer) {
            clearTimeout(moveTimer);
            moveTimer = null;
        }
        
        // איפוס סטטיסטיקות
        stats.monthsPlayed = 0;
        stats.powerupsCollected = 0;
        stats.obstaclesAvoided = 0;
        stats.obstaclesFaced = 0;
        stats.expenses = 0;
        stats.income = 5000;
        stats.mentalHealth = 90;
        stats.physicalHealth = 90;
        
        // איפוס מונה חודשי
        resetMonthlyItemCounter();
        
        // התאמת מיקום וגודל שחקן
        let scaleFactor = Math.min(window.innerWidth, window.innerHeight) / 500;
        scaleFactor = Math.max(0.5, Math.min(1.5, scaleFactor)); // הגבלה בין 0.5 ל-1.5
        
        player.width = 50 * scaleFactor;
        player.height = 80 * scaleFactor;
        
        // שמירת מיקום יחסי לקרקע
        player.y = ground.y - player.height;
        
        // התאמת מהירות בסיסית של השחקן לגודל המסך
        player.baseSpeed = 5 * scaleFactor;
        player.currentSpeed = player.baseSpeed;
        player.powerUp = false;
        player.powerUpTime = 0;
        player.companion = false;
        
        // עדכון תצוגות
        updateDisplay();
        updateHealthBars();
        updateDaySpeed();
        updateClockDisplay();
        
        // הסתרת סטטוס
        document.getElementById('status-negative').style.display = 'none';
        document.getElementById('status-weight').style.display = 'none';
        
        // הסתרת מד חיזוק
        document.getElementById('power-meter').style.display = 'none';
        
        // הסתרת כל הדיאלוגים
        document.getElementById('obstacle-dialog').style.display = 'none';
        document.getElementById('powerup-dialog').style.display = 'none';
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('win-screen').style.display = 'none';
        
        // איפוס והצגת מסך פתיחה
        document.getElementById('welcome-screen').style.display = 'flex';
        
        // יצירת אלמנטים סביבתיים חדשים
        createEnvironmentalElements();
        
        // חזרה בהדרגה
        setTimeout(() => {
            fadeOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
            
            // הסרת אוברליי אחרי סיום ההיעלמות
            setTimeout(() => {
                if (fadeOverlay.parentNode) {
                    fadeOverlay.parentNode.removeChild(fadeOverlay);
                }
            }, 800);
        }, 300);
    }, 900);
}

// טיפול בשינוי גודל חלון
function handleResize() {
    // שמירת מימדים ישנים לחישובי מעבר
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    const oldGroundY = ground.y;
    
    // עדכון מימדי קנבס
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // עדכון מיקום קרקע
    ground.y = canvas.height * 0.8;
    ground.width = canvas.width;
    ground.height = canvas.height * 0.2;
    
    // התאמת גודל ומיקום שחקן בהתאם למימדי מסך
    let scaleFactor = Math.min(window.innerWidth, window.innerHeight) / 500;
    scaleFactor = Math.max(0.5, Math.min(1.5, scaleFactor)); // הגבלה בין 0.5 ל-1.5
    
    player.width = 50 * scaleFactor;
    player.height = 80 * scaleFactor;
    
    // שמירת מיקום יחסי לקרקע
    player.y = ground.y - player.height;
    
    // קנה מידה למיקום X של השחקן באופן יחסי לרוחב החדש
    player.x = (player.x / oldWidth) * canvas.width;
    
    // התאמת מהירות בסיסית של השחקן לגודל מסך
    player.baseSpeed = 5 * scaleFactor;
    updatePlayerCondition(); // עדכון מהירות בהתאם לבריאות
    
    // יצירה מחדש של אלמנטים סביבתיים
    createStars();
    createClouds();
}
// ----------------- אירועים -----------------

// לחיצת מקשים - מקש רווח
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        if (gameRunning && !gamePaused) {
            startMoving();
        }
    }
});

document.addEventListener('keyup', function(event) {
    if (event.code === 'Space') {
        if (gameRunning && !gamePaused) {
            stopMoving();
        }
    }
});

// מגע במסך למכשירים ניידים
canvas.addEventListener('touchstart', function(event) {
    event.preventDefault();
    
    if (gameRunning && !gamePaused) {
        startMoving();
    }
});

canvas.addEventListener('touchend', function(event) {
    event.preventDefault();
    
    if (gameRunning && !gamePaused) {
        stopMoving();
    }
});

// אירועי עכבר
canvas.addEventListener('mousedown', function() {
    if (gameRunning && !gamePaused) {
        startMoving();
    }
});

canvas.addEventListener('mouseup', function() {
    if (gameRunning && !gamePaused) {
        stopMoving();
    }
});

// יציאה מהקנבס - עצירת תנועה אם הסמן עוזב את הקנבס
canvas.addEventListener('mouseleave', function() {
    if (gameRunning && !gamePaused) {
        stopMoving();
    }
});

// כפתורי דיאלוג מכשול
document.getElementById('ignore-btn').addEventListener('click', function() {
    continuePersuasion(); // המשך לשלב שכנוע הבא או סגירת דיאלוג
});

document.getElementById('accept-btn').addEventListener('click', function() {
    acceptObstacle(); // קבלת המכשול עם כל ההשלכות השליליות
});

// כפתורי דיאלוג חיזוק
document.getElementById('powerup-yes-btn').addEventListener('click', function() {
    boostYesResponse();
});

document.getElementById('powerup-no-btn').addEventListener('click', function() {
    boostNoResponse();
});

// לחיצה על כפתור התחלה
document.getElementById('start-btn').addEventListener('click', function() {
    // הוספת אנימציית לחיצה לכפתור
    const button = document.getElementById('start-btn');
    button.style.transform = 'scale(0.95)';
    button.style.backgroundColor = '#1e5180';
    
    // איפוס אחרי השהייה קצרה
    setTimeout(() => {
        button.style.transform = '';
        button.style.backgroundColor = '';
        
        // הסתרת מסך פתיחה בהדרגה
        document.getElementById('welcome-screen').style.display = 'none';
        gameRunning = true;
    }, 100);
});

// כפתורי סיום משחק
document.getElementById('restart-btn').addEventListener('click', function() {
    // אנימציית לחיצה
    const button = document.getElementById('restart-btn');
    button.style.transform = 'scale(0.95)';
    
    // איפוס אחרי השהייה קצרה
    setTimeout(() => {
        button.style.transform = '';
        resetGame();
    }, 100);
});

document.getElementById('play-again-btn').addEventListener('click', function() {
    // אנימציית לחיצה
    const button = document.getElementById('play-again-btn');
    button.style.transform = 'scale(0.95)';
    
    // איפוס אחרי השהייה קצרה
    setTimeout(() => {
        button.style.transform = '';
        resetGame();
    }, 100);
});

// אירוע שינוי גודל חלון
window.addEventListener('resize', handleResize);

// הפעלת המשחק
function startGame() {
    // אתחול המשחק
    initGame();
    
    // הצגת מסך פתיחה
    visualEffects.showWelcomeMessage();
    
    // לולאת משחק - פעילה ב-60 פריימים בשנייה
    const gameLoop = setInterval(() => {
        updateGame();
    }, 1000 / framesPerSecond);
}

// אתחול ראשוני בטעינת הדף
window.onload = function() {
    // התאמה למכשירים ניידים
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        // הפחתת אפקטים למכשירים ניידים לביצועים טובים יותר
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                #game-canvas {
                    image-rendering: optimizeSpeed;
                }
                
                /* הפחתת אפקטי חלקיקים בנייד */
                .dust-particle, .powerup-particle, .companion-particle {
                    opacity: 0.7 !important;
                }
                
                /* גופים שמימיים קטנים יותר */
                #sun, #moon {
                    width: 80px !important;
                    height: 80px !important;
                }
                
                /* פחות כוכבים לביצועים טובים יותר */
                .star {
                    opacity: 0.5 !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    startGame();
};
