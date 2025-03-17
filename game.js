// game.js - לוגיקת המשחק הראשית

// ממתין לטעינת המודולים הנדרשים לפני אתחול המשחק
(function() {
    'use strict';
    
    // בדיקת זמינות של מודולים נדרשים
    function checkRequiredModules() {
        if (!window.visualEffects) {
            console.error('Visual effects module not loaded. Game initialization delayed.');
            setTimeout(checkRequiredModules, 500);
            return false;
        }
        
        // הסימון כטעון יתבצע בסוף הקובץ
        console.log('All required modules loaded. Initializing game...');
        return true;
    }
    
    // אתחול המשחק רק אם כל המודולים נטענו
    if (!checkRequiredModules()) {
        return;
    }
    
    // אתחול הקנבס והקונטקסט
    let canvas, ctx;
    
    function initCanvas() {
        canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Game canvas element not found!');
            return false;
        }
        
        ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context from canvas!');
            return false;
        }
        
        // התאמת הקנבס לגודל החלון
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        return true;
    }
    
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
    
    // משתני יום - עדכון לפי הבקשה: יום = 15 שניות, לילה = 15 שניות
    const dayMilliseconds = {
        perfect: 30000, // 30 שניות ליממה במצב אופטימלי (15 שניות יום + 15 שניות לילה)
        current: 30000   // יכול להשתנות בהתאם לבריאות
    };
    
    // שחקן
    const player = {
        x: 0, // יעודכן באתחול
        y: 0, // יעודכן באתחול
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
        y: 0, // יעודכן באתחול
        width: 0, // יעודכן באתחול
        height: 0 // יעודכן באתחול
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
        if (!initCanvas()) {
            showErrorMessage('שגיאה באתחול המשחק. נא לרענן את הדף.');
            return;
        }
        
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
    
    // פונקציה להצגת הודעת שגיאה
    function showErrorMessage(message) {
        const errorElement = document.createElement('div');
        errorElement.style.position = 'fixed';
        errorElement.style.top = '50%';
        errorElement.style.left = '50%';
        errorElement.style.transform = 'translate(-50%, -50%)';
        errorElement.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        errorElement.style.color = 'white';
        errorElement.style.padding = '20px';
        errorElement.style.borderRadius = '10px';
        errorElement.style.zIndex = '9999';
        errorElement.style.textAlign = 'center';
        errorElement.style.fontSize = '24px';
        errorElement.textContent = message;
        
        document.body.appendChild(errorElement);
        
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 5000);
    }
    // יצירת אלמנטים סביבתיים
    function createEnvironmentalElements() {
        try {
            // יצירת כוכבים
            createStars();
            
            // יצירת עננים
            createClouds();
            
            // יצירת ציפורים
            createBirds();
        } catch (error) {
            console.error('Error creating environmental elements:', error);
            // המשך למרות השגיאה כדי שהמשחק ימשיך לעבוד
        }
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
        try {
            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) {
                console.error('Game container element not found');
                return;
            }
            
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
            
            gameContainer.appendChild(cloud);
            clouds.push(cloud);
            
            // עדכון נראות לפי זמן יום
            updateCloudVisibility();
        } catch (error) {
            console.error('Error creating cloud:', error);
        }
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
        try {
            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) {
                console.error('Game container element not found');
                return;
            }
            
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
            
            gameContainer.appendChild(bird);
            birds.push(bird);
            
            // הציפורים מופיעות רק ביום
            bird.style.opacity = isDayTime ? '1' : '0';
        } catch (error) {
            console.error('Error creating bird:', error);
        }
    }
    
    // עדכון ראות העננים
    function updateCloudVisibility() {
        try {
            const cloudOpacity = isDayTime ? 0.8 : 0.3; // פחות נראה בלילה
            
            clouds.forEach(cloud => {
                if (cloud && cloud.style) {
                    cloud.style.opacity = cloudOpacity;
                    // שינוי צבע הענן בלילה
                    if (isDayTime) {
                        cloud.style.background = "rgba(255, 255, 255, 0.7)";
                    } else {
                        cloud.style.background = "rgba(200, 200, 220, 0.5)";
                    }
                }
            });
        } catch (error) {
            console.error('Error updating cloud visibility:', error);
        }
    }
    
    // עדכון ראות הציפורים
    function updateBirdsVisibility() {
        try {
            birds.forEach((bird, index) => {
                if (!bird || !bird.style) {
                    // הסרת ציפור לא תקינה מהמערך
                    birds.splice(index, 1);
                    return;
                }
                
                // ציפורים מופיעות רק ביום
                bird.style.opacity = isDayTime ? '1' : '0';
                
                // הסרת ציפורים בלילה
                if (!isDayTime) {
                    setTimeout(() => {
                        try {
                            if (birds.includes(bird)) {
                                const gameContainer = document.getElementById('game-container');
                                if (gameContainer && bird.parentNode === gameContainer) {
                                    gameContainer.removeChild(bird);
                                }
                                birds.splice(birds.indexOf(bird), 1);
                            }
                        } catch (removeError) {
                            console.error('Error removing bird:', removeError);
                        }
                    }, 2000);
                }
            });
        } catch (error) {
            console.error('Error updating birds visibility:', error);
        }
    }
    
    // עדכון מחזור היום/לילה
    function updateDayNightCycle() {
        if (!isMoving) return; // עדכון רק כשהשחקן זז
        
        try {
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
                } else if (currentHour === 6) { // שינוי מ-5 ל-6 לאיזון טוב יותר של זמני יום/לילה
                    transitionToDay();
                }
            }
            
            // עדכון תצוגת שעון
            updateClockDisplay();
        } catch (error) {
            console.error('Error updating day/night cycle:', error);
        }
    }
    
    // עדכון ותצוגת שעון
    function updateClockDisplay() {
        try {
            const clockElement = document.getElementById('day-clock');
            if (!clockElement) {
                console.error('Clock element not found');
                return;
            }
            
            const hours = String(Math.floor(currentHour)).padStart(2, '0');
            const minutes = String(Math.floor(currentMinute)).padStart(2, '0');
            clockElement.textContent = `${hours}:${minutes}`;
            
            // אפקט ויזואלי בשינוי שעה
            if (Math.floor(currentMinute) === 0) {
                clockElement.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    clockElement.style.transform = 'scale(1)';
                }, 300);
            }
        } catch (error) {
            console.error('Error updating clock display:', error);
        }
    }
    
    // מעבר ללילה
    function transitionToNight() {
        if (isDayTime) {
            isDayTime = false;
            
            try {
                // אפקט מעבר חלק ללילה
                const dayNightOverlay = document.getElementById('day-night-overlay');
                const sunElement = document.getElementById('sun');
                const moonElement = document.getElementById('moon');
                
                if (dayNightOverlay && sunElement && moonElement && window.visualEffects) {
                    window.visualEffects.smoothDayNightTransition(false, dayNightOverlay, sunElement, moonElement);
                }
                
                // עדכון ראות העננים והציפורים
                updateCloudVisibility();
                updateBirdsVisibility();
            } catch (error) {
                console.error('Error transitioning to night:', error);
            }
        }
    }
    // מעבר ליום
    function transitionToDay() {
        if (!isDayTime) {
            isDayTime = true;
            
            try {
                // אפקט מעבר חלק ליום
                const dayNightOverlay = document.getElementById('day-night-overlay');
                const sunElement = document.getElementById('sun');
                const moonElement = document.getElementById('moon');
                
                if (dayNightOverlay && sunElement && moonElement && window.visualEffects) {
                    window.visualEffects.smoothDayNightTransition(true, dayNightOverlay, sunElement, moonElement);
                }
                
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
                
                // עדכון ראות העננים והציפורים
                updateCloudVisibility();
                updateBirdsVisibility();
            } catch (error) {
                console.error('Error transitioning to day:', error);
            }
        }
    }
    
    // עדכון מהירות היום בהתאם לבריאות
    function updateDaySpeed() {
        try {
            // חישוב תוספת שניות בהתאם לירידה בבריאות
            // בריאות פיזית: כל נקודה מתחת ל-90 מוסיפה שנייה
            const physicalHealthPenalty = Math.max(0, 90 - stats.physicalHealth);
            
            // בריאות מנטלית: כל נקודה מתחת ל-90 מוסיפה שנייה
            const mentalHealthPenalty = Math.max(0, 90 - stats.mentalHealth);
            
            // חישוב זמן יום נוכחי
            dayMilliseconds.current = dayMilliseconds.perfect + (physicalHealthPenalty + mentalHealthPenalty) * 1000;
            
            // עדכון תצוגת מצב השחקן
            updatePlayerCondition();
        } catch (error) {
            console.error('Error updating day speed:', error);
            // במקרה של שגיאה, נשתמש בזמן ברירת המחדל
            dayMilliseconds.current = dayMilliseconds.perfect;
        }
    }
    
    // עדכון מצב השחקן (מהירות ותצוגה)
    function updatePlayerCondition() {
        try {
            // השפעת בריאות פיזית על המהירות
            let physicalEffect = stats.physicalHealth / 100;
            
            // השפעת בריאות מנטלית על המהירות
            let mentalEffect = stats.mentalHealth / 100;
            
            // עדכון מהירות שחקן
            player.currentSpeed = player.baseSpeed * physicalEffect * mentalEffect;
            
            // עדכון מחוון מהירות
            const speedIndicator = document.getElementById('speed-indicator');
            if (!speedIndicator) {
                console.error('Speed indicator element not found');
                return;
            }
            
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
        } catch (error) {
            console.error('Error updating player condition:', error);
        }
    }
    
    // עדכון אינדיקטורים של מצב השחקן
    function updatePlayerStatusIndicators() {
        try {
            const statusWeight = document.getElementById('status-weight');
            const statusNegative = document.getElementById('status-negative');
            
            if (!statusWeight || !statusNegative) {
                console.error('Status indicator elements not found');
                return;
            }
            
            // אינדיקטור מצב פיזי
            if (stats.physicalHealth < 40) {
                statusWeight.style.display = 'block';
                statusWeight.textContent = "מצב גופני: חמור";
            } else if (stats.physicalHealth < 60) {
                statusWeight.style.display = 'block';
                statusWeight.textContent = "מצב גופני: לקוי";
            } else if (stats.physicalHealth < 80) {
                statusWeight.style.display = 'block';
                statusWeight.textContent = "מצב גופני: ירוד";
            } else {
                statusWeight.style.display = 'none';
            }
            
            // אינדיקטור מצב מנטלי
            if (stats.mentalHealth < 40) {
                statusNegative.style.display = 'block';
                statusNegative.textContent = "מצב מנטלי: חמור";
            } else if (stats.mentalHealth < 60) {
                statusNegative.style.display = 'block';
                statusNegative.textContent = "מצב מנטלי: לקוי";
            } else if (stats.mentalHealth < 80) {
                statusNegative.style.display = 'block';
                statusNegative.textContent = "מצב מנטלי: ירוד";
            } else {
                statusNegative.style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating player status indicators:', error);
        }
    }
    
    // עדכון מדי בריאות
    function updateHealthBars() {
        try {
            const physicalFill = document.getElementById('physical-health-fill');
            const mentalFill = document.getElementById('mental-health-fill');
            
            if (!physicalFill || !mentalFill) {
                console.error('Health bar elements not found');
                return;
            }
            
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
        } catch (error) {
            console.error('Error updating health bars:', error);
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
        try {
            // בדיקה שהמודול של המכשולים נטען
            if (typeof getRandomObstacle !== 'function') {
                console.error('Obstacles module not loaded properly');
                return;
            }
            
            // קבלת מכשול אקראי
            const obstacle = getRandomObstacle();
            
            if (!obstacle) {
                console.warn('No obstacle returned from getRandomObstacle');
                return;
            }
            
            // אם כבר יש מכשולים מסוג זה במהלך החודש, נחפש סוג אחר
            if (monthlyItemCounter.obstacles[obstacle.type] >= 2) {
                createObstacle(); // ניסיון חוזר
                return;
            }
            
            // עדכון ספירת מכשולים מסוג זה
            monthlyItemCounter.obstacles[obstacle.type]++;
            
            // הצגת דיאלוג המכשול עם המכשול הנבחר
            showObstacleDialog(obstacle);
        } catch (error) {
            console.error('Error creating obstacle:', error);
        }
    }
    
    // יצירת חיזוק חיובי
    function createBoost() {
        try {
            // בדיקה שהמודול של החיזוקים נטען
            if (typeof getRandomBoost !== 'function') {
                console.error('Boosts module not loaded properly');
                return;
            }
            
            // קבלת חיזוק אקראי
            const boost = getRandomBoost();
            
            if (!boost) {
                console.warn('No boost returned from getRandomBoost');
                return;
            }
            
            // בדיקה שאין יותר מ-2 חיזוקים מאותו סוג בחודש
            if (monthlyItemCounter.boosts[boost.type] >= 2) {
                createBoost(); // ניסיון חוזר
                return;
            }
            
            // עדכון ספירת חיזוקים מסוג זה
            monthlyItemCounter.boosts[boost.type]++;
            
            // הצגת דיאלוג החיזוק
            showBoostDialog(boost);
        } catch (error) {
            console.error('Error creating boost:', error);
        }
    }
    
    // הצגת דיאלוג מכשול
    function showObstacleDialog(obstacle) {
        try {
            if (!obstacle) {
                console.error('No obstacle provided to showObstacleDialog');
                return;
            }
            
            // עצירת המשחק
            gamePaused = true;
            currentObstacle = obstacle;
            persuasionStage = 0; // איפוס שלב שכנוע
            
            // מציאת אלמנטי הדיאלוג
            const titleElement = document.getElementById('obstacle-title');
            const textElement = document.getElementById('obstacle-text');
            const ignoreBtn = document.getElementById('ignore-btn');
            const acceptBtn = document.getElementById('accept-btn');
            const dialogBox = document.getElementById('obstacle-dialog');
            
            if (!titleElement || !textElement || !ignoreBtn || !acceptBtn || !dialogBox) {
                console.error('Obstacle dialog elements not found');
                gamePaused = false;
                return;
            }
            
            // הגדרת תוכן הדיאלוג - שלב ראשוני
            titleElement.textContent = obstacle.title;
            textElement.textContent = obstacle.text;
            
            // שינוי טקסט בכפתורים לייצג החלטה אמיתית
            ignoreBtn.textContent = "סירוב";
            acceptBtn.textContent = "הסכמה";
            
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
                case 'eating-out':
                    dialogBox.style.boxShadow = '0 10px 40px rgba(211, 135, 62, 0.3)';
                    break;
                case 'job-offer':
                    dialogBox.style.boxShadow = '0 10px 40px rgba(42, 100, 150, 0.3)';
                    break;
                case 'knowledge':
                    dialogBox.style.boxShadow = '0 10px 40px rgba(58, 122, 95, 0.3)';
                    
                    // תצוגה מיוחדת לשאלות ידע פיננסי - הצגת האפשרויות
                    if (obstacle.options && obstacle.options.length >= 2) {
                        textElement.innerHTML = `${obstacle.text}<br><br>
                            <button id="knowledge-option1" class="knowledge-option">${obstacle.options[0]}</button>
                            <button id="knowledge-option2" class="knowledge-option">${obstacle.options[1]}</button>`;
                        
                        // הוספת listener לכפתורי התשובה
                        setTimeout(() => {
                            const option1 = document.getElementById('knowledge-option1');
                            const option2 = document.getElementById('knowledge-option2');
                            
                            if (option1 && option2) {
                                option1.addEventListener('click', function() {
                                    handleKnowledgeAnswer(obstacle, obstacle.options[0]);
                                });
                                option2.addEventListener('click', function() {
                                    handleKnowledgeAnswer(obstacle, obstacle.options[1]);
                                });
                            } else {
                                console.error('Knowledge option buttons not found');
                            }
                        }, 100);
                        
                        // הסתרת כפתורי דיאלוג רגילים בשאלות ידע
                        ignoreBtn.style.display = 'none';
                        acceptBtn.style.display = 'none';
                    }
                    break;
            }
            
            // הצגת הדיאלוג עם אנימציה
            dialogBox.style.animation = 'dialog-appear 0.3s ease-out forwards';
            dialogBox.style.display = 'block';
        } catch (error) {
            console.error('Error showing obstacle dialog:', error);
            // במקרה של שגיאה, המשך את המשחק
            gamePaused = false;
        }
    }
    
    // טיפול בתשובה לשאלת ידע פיננסי
    function handleKnowledgeAnswer(question, selectedAnswer) {
        try {
            if (!question || !selectedAnswer) {
                console.error('Invalid question or answer');
                hideObstacleDialog();
                return;
            }
            
            const isCorrect = selectedAnswer === question.correctAnswer;
            
            if (isCorrect) {
                // תשובה נכונה
                if (window.visualEffects) {
                    window.visualEffects.showCorrectAnswerEffect();
                }
                
                // הצגת הסבר
                if (window.visualEffects && question.explanation) {
                    window.visualEffects.showPopupMessage("תשובה נכונה! " + question.explanation, 3000);
                }
            } else {
                // תשובה שגויה
                if (window.visualEffects) {
                    window.visualEffects.showWrongAnswerEffect();
                }
                
                // הצגת הסבר
                if (window.visualEffects && question.explanation) {
                    window.visualEffects.showPopupMessage("תשובה שגויה. " + question.explanation, 3000);
                }
                
                // פגיעה בבריאות המנטלית - תיקון השגיאה בקוד המקורי
                if (question.mentalEffect) {
                    stats.mentalHealth = Math.max(20, stats.mentalHealth - question.mentalEffect);
                    
                    // עדכון מדי בריאות
                    updateHealthBars();
                    
                    // עדכון מהירות יום בהתאם לבריאות
                    updateDaySpeed();
                    
                    // הראה אפקט פגיעה מנטלית
                    if (window.visualEffects) {
                        window.visualEffects.showNegativeMentalEffect();
                    }
                }
            }
            
            // הסתרת הדיאלוג לאחר 3 שניות
            setTimeout(() => {
                hideObstacleDialog();
            }, 3000);
        } catch (error) {
            console.error('Error handling knowledge answer:', error);
            hideObstacleDialog();
        }
    }
    // המשך לשלב שכנוע הבא במכשול
    function continuePersuasion() {
        try {
            if (!currentObstacle) {
                console.error('No active obstacle for persuasion');
                return;
            }
            
            persuasionStage++;
            
            const textElement = document.getElementById('obstacle-text');
            const ignoreBtn = document.getElementById('ignore-btn');
            
            if (!textElement || !ignoreBtn) {
                console.error('Dialog elements not found');
                return;
            }
            
            // בדיקה אם יש עוד טקסטים שכנועיים
            if (persuasionStage <= (currentObstacle.persuasiveTexts ? currentObstacle.persuasiveTexts.length : 0)) {
                // עדכון טקסט לשלב הנוכחי עם אנימציה
                
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
                    ignoreBtn.textContent = "החלטה סופית: סירוב";
                    ignoreBtn.style.fontWeight = 'bold';
                    ignoreBtn.style.background = 'var(--success-color)';
                } else {
                    ignoreBtn.textContent = "סירוב";
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
                if (window.visualEffects) {
                    window.visualEffects.showPopupMessage("קבלת החלטה פיננסית מושכלת!", 2500);
                    
                    // הוספת חיזוק ויזואלי להחלטה טובה
                    window.visualEffects.showPositiveDecisionEffect(player);
                }
            }
        } catch (error) {
            console.error('Error continuing persuasion:', error);
            // במקרה של שגיאה, ננסה לסגור את הדיאלוג
            hideObstacleDialog();
        }
    }
    
    // קבלת המכשול והשפעתו
    function acceptObstacle() {
        try {
            if (!currentObstacle) {
                console.error('No active obstacle to accept');
                return;
            }
            
            // השפעות לפי סוג המכשול
            switch(currentObstacle.type) {
                case 'person':
                    // השפעה שלילית על הבריאות המנטלית
                    stats.mentalHealth = Math.max(20, stats.mentalHealth - currentObstacle.mentalEffect);
                    
                    if (window.visualEffects) {
                        window.visualEffects.showPopupMessage(`לחץ חברתי השפיע עליך: -${currentObstacle.mentalEffect} נקודות חוסן מנטלי`, 2500);
                        window.visualEffects.showNegativeMentalEffect();
                    }
                    break;
                    
                case 'ad':
                    // הוצאה כספית
                    score -= currentObstacle.value;
                    stats.expenses += currentObstacle.value;
                    
                    if (window.visualEffects) {
                        window.visualEffects.showPopupMessage(`הוצאה בלתי מתוכננת: -${currentObstacle.value} ש"ח`, 2000);
                        window.visualEffects.showMoneyLossEffect(currentObstacle.value);
                    }
                    break;
                    
                case 'unhealthy-food':
                    // השפעה על בריאות פיזית ומנטלית
                    stats.physicalHealth = Math.max(20, stats.physicalHealth - currentObstacle.physicalEffect);
                    stats.mentalHealth = Math.max(20, stats.mentalHealth - currentObstacle.mentalEffect);
                    
                    if (window.visualEffects) {
                        window.visualEffects.showPopupMessage(`אוכל לא בריא: -${currentObstacle.physicalEffect} נקודות בריאות פיזית, -${currentObstacle.mentalEffect} בריאות מנטלית`, 3000);
                        window.visualEffects.showNegativePhysicalEffect();
                    }
                    break;
                    
                case 'eating-out':
                    // הוצאה כספית על אוכל בחוץ
                    score -= currentObstacle.value;
                    stats.expenses += currentObstacle.value;
                    
                    if (window.visualEffects) {
                        window.visualEffects.showPopupMessage(`אכילה בחוץ: -${currentObstacle.value} ש"ח`, 2000);
                        window.visualEffects.showMoneyLossEffect(currentObstacle.value);
                    }
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
        } catch (error) {
            console.error('Error accepting obstacle:', error);
            hideObstacleDialog();
        }
    }
    
    // הסתרת דיאלוג המכשול
    function hideObstacleDialog() {
        try {
            // הסתרת הדיאלוג עם אנימציית יציאה
            const dialogBox = document.getElementById('obstacle-dialog');
            if (!dialogBox) {
                console.error('Obstacle dialog element not found');
                gamePaused = false;
                return;
            }
            
            const ignoreBtn = document.getElementById('ignore-btn');
            const acceptBtn = document.getElementById('accept-btn');
            
            dialogBox.style.animation = 'obstacle-dialog-exit 0.3s ease forwards';
            
            // החזרת כפתורי הדיאלוג הרגילים (אם הוסתרו)
            if (ignoreBtn) ignoreBtn.style.display = 'inline-block';
            if (acceptBtn) acceptBtn.style.display = 'inline-block';
            
            // הסתרת הדיאלוג לאחר האנימציה
            setTimeout(() => {
                dialogBox.style.display = 'none';
                currentObstacle = null;
                gamePaused = false;
                persuasionStage = 0;
                
                // איפוס טקסט וסגנון כפתור סירוב
                if (ignoreBtn) {
                    ignoreBtn.textContent = "סירוב";
                    ignoreBtn.style.fontWeight = 'normal';
                    ignoreBtn.style.background = 'var(--success-color)';
                }
            }, 300);
        } catch (error) {
            console.error('Error hiding obstacle dialog:', error);
            // במקרה של שגיאה חמורה, נבטיח שהמשחק ממשיך
            gamePaused = false;
            currentObstacle = null;
            persuasionStage = 0;
        }
    }
    // הצגת דיאלוג חיזוק
    function showBoostDialog(boost) {
        try {
            if (!boost) {
                console.error('No boost provided to showBoostDialog');
                return;
            }
            
            gamePaused = true;
            currentBoost = boost;
            boostFollowupIndex = 0;
            
            // מציאת אלמנטי הדיאלוג
            const boostTitle = document.getElementById('powerup-title');
            const boostText = document.getElementById('powerup-text');
            const dialogBox = document.getElementById('powerup-dialog');
            
            if (!boostTitle || !boostText || !dialogBox) {
                console.error('Boost dialog elements not found');
                gamePaused = false;
                return;
            }
            
            // הגדרת שאלה בהתאם לסוג החיזוק
            boostTitle.textContent = boost.title;
            
            // הגדרת תוכן הדיאלוג
            boostText.textContent = boost.text;
            
            // עיצוב מיוחד לפי סוג החיזוק
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
            
            // הצגת הדיאלוג עם אנימציה
            dialogBox.style.animation = 'dialog-appear 0.3s ease-out forwards';
            dialogBox.style.display = 'block';
        } catch (error) {
            console.error('Error showing boost dialog:', error);
            // במקרה של שגיאה, המשך את המשחק
            gamePaused = false;
        }
    }
    
    // מענה חיובי לחיזוק
    function boostYesResponse() {
        try {
            if (!currentBoost) {
                console.error('No active boost to respond to');
                return;
            }
            
            // אם זה בונוס עם שאלות המשך
            if (currentBoost.type === 'money' && currentBoost.followupQuestions && 
                currentBoost.followupQuestions.length > 0 && boostFollowupIndex < currentBoost.followupQuestions.length) {
                
                const questionText = document.getElementById('powerup-text');
                if (!questionText) {
                    console.error('Boost dialog text element not found');
                    hideBoostDialog();
                    return;
                }
                
                if (boostFollowupIndex > 0) {
                    // הצגת משוב חיובי
                    if (window.visualEffects && currentBoost.followupQuestions[boostFollowupIndex - 1].positiveEffect) {
                        window.visualEffects.showPopupMessage(currentBoost.followupQuestions[boostFollowupIndex - 1].positiveEffect, 2500);
                    }
                }
                
                // הצגת השאלה הבאה עם אנימציה
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
                    let bonusAmount = currentBoost.value || 0;
                    
                    // אם השחקן ענה על שאלות המשך, הגדלת הבונוס
                    if (currentBoost.followupQuestions && currentBoost.followupQuestions.length > 0) {
                        bonusAmount = Math.round(bonusAmount * (1 + 0.2 * boostFollowupIndex));
                    }
                    
                    score += bonusAmount;
                    
                    if (window.visualEffects) {
                        window.visualEffects.showCoinAnimation(bonusAmount);
                        window.visualEffects.showPopupMessage(`קיבלת בונוס של ${bonusAmount} ש"ח!`, 2000);
                    }
                    break;
                    
                case 'earlyRise':
                case 'earlySleep':
                    // שיפור בריאות מנטלית
                    const mentalBoost = currentBoost.mentalEffect || 10;
                    stats.mentalHealth = Math.min(100, stats.mentalHealth + mentalBoost);
                    
                    // שיפור בריאות פיזית (חצי מהשיפור המנטלי)
                    stats.physicalHealth = Math.min(100, stats.physicalHealth + (mentalBoost / 2));
                    
                    if (window.visualEffects) {
                        window.visualEffects.showMentalBoostEffect();
                        window.visualEffects.showPopupMessage(`שיפור בריאות מנטלית: +${mentalBoost} נקודות, שיפור בריאות פיזית: +${mentalBoost / 2} נקודות`, 3000);
                    }
                    break;
                    
                case 'healthyFood':
                case 'exercise':
                    // שיפור בריאות פיזית
                    const physicalBoost = currentBoost.physicalEffect || 15;
                    stats.physicalHealth = Math.min(100, stats.physicalHealth + physicalBoost);
                    
                    // שיפור בריאות מנטלית (חצי מהשיפור הפיזי)
                    stats.mentalHealth = Math.min(100, stats.mentalHealth + (physicalBoost / 2));
                    
                    if (window.visualEffects) {
                        window.visualEffects.showPhysicalBoostEffect();
                        window.visualEffects.showPopupMessage(`שיפור בריאות פיזית: +${physicalBoost} נקודות, שיפור בריאות מנטלית: +${physicalBoost / 2} נקודות`, 3000);
                    }
                    break;
                    
                case 'companion':
                    // חיזוק של תמיכה חברתית
                    const mentalCompanionBoost = currentBoost.mentalEffect || 15;
                    const physicalCompanionBoost = currentBoost.physicalEffect || 15;
                    
                    stats.mentalHealth = Math.min(100, stats.mentalHealth + mentalCompanionBoost);
                    stats.physicalHealth = Math.min(100, stats.physicalHealth + physicalCompanionBoost);
                    
                    if (window.visualEffects) {
                        window.visualEffects.showMentalBoostEffect();
                        window.visualEffects.showPopupMessage(`תמיכה חברתית מחזקת את החוסן האישי! +${mentalCompanionBoost} בריאות מנטלית, +${physicalCompanionBoost} בריאות פיזית`, 3000);
                    }
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
        } catch (error) {
            console.error('Error processing boost yes response:', error);
            hideBoostDialog();
        }
    }
    // מענה שלילי לחיזוק
    function boostNoResponse() {
        try {
            if (!currentBoost) {
                console.error('No active boost to respond to');
                return;
            }
            
            // אם זה בונוס עם שאלות המשך
            if (currentBoost.type === 'money' && currentBoost.followupQuestions && 
                currentBoost.followupQuestions.length > 0 && boostFollowupIndex < currentBoost.followupQuestions.length) {
                
                const questionText = document.getElementById('powerup-text');
                if (!questionText) {
                    console.error('Boost dialog text element not found');
                    hideBoostDialog();
                    return;
                }
                
                if (boostFollowupIndex > 0) {
                    // הצגת משוב שלילי
                    if (window.visualEffects && currentBoost.followupQuestions[boostFollowupIndex - 1].negativeEffect) {
                        window.visualEffects.showPopupMessage(currentBoost.followupQuestions[boostFollowupIndex - 1].negativeEffect, 2500);
                    }
                }
                
                // הצגת השאלה הבאה עם אנימציה
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
                    
                    if (window.visualEffects) {
                        window.visualEffects.showPopupMessage("חוסר בפעילות גופנית/תזונה בריאה פוגע בבריאותך", 2500);
                        window.visualEffects.showNegativePhysicalEffect();
                    }
                    break;
                    
                case 'earlyRise':
                case 'earlySleep':
                    // ירידה בבריאות המנטלית
                    stats.mentalHealth = Math.max(20, stats.mentalHealth - 5);
                    
                    if (window.visualEffects) {
                        window.visualEffects.showPopupMessage("חוסר איזון בשעות שינה/קימה פוגע בבריאותך המנטלית", 2500);
                        window.visualEffects.showNegativeMentalEffect();
                    }
                    break;
                    
                case 'money':
                    // הפסד הבונוס
                    if (window.visualEffects) {
                        window.visualEffects.showPopupMessage("פספסת הזדמנות לשיפור מצבך הפיננסי", 2500);
                    }
                    break;
                    
                case 'companion':
                    // ירידה קלה בבריאות המנטלית
                    stats.mentalHealth = Math.max(20, stats.mentalHealth - 5);
                    
                    if (window.visualEffects) {
                        window.visualEffects.showPopupMessage("תמיכה חברתית חשובה ליציבות הנפשית", 2500);
                        window.visualEffects.showNegativeMentalEffect();
                    }
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
        } catch (error) {
            console.error('Error processing boost no response:', error);
            hideBoostDialog();
        }
    }
    
    // הסתרת דיאלוג החיזוק
    function hideBoostDialog() {
        try {
            // סגירת הדיאלוג עם אנימציית יציאה
            const dialogBox = document.getElementById('powerup-dialog');
            if (!dialogBox) {
                console.error('Powerup dialog element not found');
                gamePaused = false;
                return;
            }
            
            dialogBox.style.animation = 'powerup-dialog-exit 0.3s ease forwards';
            
            // הסתרת הדיאלוג לאחר האנימציה
            setTimeout(() => {
                dialogBox.style.display = 'none';
                currentBoost = null;
                gamePaused = false;
            }, 300);
        } catch (error) {
            console.error('Error hiding boost dialog:', error);
            // במקרה של שגיאה חמורה, נבטיח שהמשחק ממשיך
            gamePaused = false;
            currentBoost = null;
        }
    }
    
    // עדכון משחק
    function updateGame() {
        if (!gameRunning || gamePaused) return;
        
        try {
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
                    
                    const movementInstruction = document.getElementById('movement-instruction');
                    if (movementInstruction) {
                        movementInstruction.style.display = 'none';
                    }
                }
            } else {
                // הצגת הוראות תנועה אם השחקן לא זז כמה שניות
                if (!moveTimer) {
                    moveTimer = setTimeout(() => {
                        const movementInstruction = document.getElementById('movement-instruction');
                        if (!movementInstruction) {
                            console.error('Movement instruction element not found');
                            return;
                        }
                        
                        movementInstruction.style.display = 'block';
                        
                        // אפקט הבהוב להדגשת ההוראה
                        let blinkCount = 0;
                        const blinkInterval = setInterval(() => {
                            if (blinkCount >= 6 || isMoving) {
                                clearInterval(blinkInterval);
                                if (movementInstruction) {
                                    movementInstruction.style.opacity = '1';
                                }
                                return;
                            }
                            
                            if (movementInstruction) {
                                movementInstruction.style.opacity = movementInstruction.style.opacity === '0.3' ? '1' : '0.3';
                            }
                            
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
            if (isMoving && Math.random() < 0.1 && window.visualEffects) {
                window.visualEffects.createDustParticle(player, ground, isDayTime);
            }
            
            // אולי יצירת מכשול או חיזוק חדש
            maybeCreateObstacleOrBoost();
            
            // עדכון תצוגה ויזואלית
            renderGame();
        } catch (error) {
            console.error('Error updating game:', error);
        }
    }
    
    // אולי יצירת מכשול או חיזוק חדש
    function maybeCreateObstacleOrBoost() {
        if (!isMoving) return;
        
        try {
            // הגדלת הסיכוי ליצירת מכשול/חיזוק כשהשחקן זז
            
            // סיכוי למכשול - 0.5% בכל פריים כשזז
            if (Math.random() < 0.005) {
                createObstacle();
            }
            
            // סיכוי לחיזוק - 0.3% בכל פריים כשזז
            if (Math.random() < 0.003) {
                createBoost();
            }
        } catch (error) {
            console.error('Error creating obstacle or boost:', error);
        }
    }
    // טיפול בסוף חודש
    function endOfMonth() {
        try {
            currentMonthFrame = 0;
            currentMonth++;
            stats.monthsPlayed++;
            
            // הוספת הכנסה חודשית עם אנימציה
            score += stats.income;
            
            if (window.visualEffects) {
                window.visualEffects.showMonthlyIncomeEffect(stats.income);
            }
            
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
            if (window.visualEffects && currentMonth < monthNames.length) {
                window.visualEffects.showMonthTransitionEffect(monthNames[currentMonth]);
            }
        } catch (error) {
            console.error('Error processing end of month:', error);
        }
    }
    
    // עדכון תצוגה
    function updateDisplay() {
        try {
            // עדכון ניקוד עם אנימציה אם יש שינוי משמעותי
            const scoreDisplay = document.getElementById('score-display');
            if (!scoreDisplay) {
                console.error('Score display element not found');
                return;
            }
            
            const currentScoreText = scoreDisplay.textContent;
            const currentScore = parseInt(currentScoreText.match(/\d+/g).join('')) || 0;
            
            if (Math.abs(currentScore - score) > 100) {
                // אנימציית שינוי ניקוד
                animateScoreChange(currentScore, score);
            } else {
                // עדכון פשוט
                scoreDisplay.textContent = `סך נכסים פיננסיים: ${score.toLocaleString()} ש"ח`;
            }
            
            // עדכון תצוגת תאריך
            const dateDisplay = document.getElementById('date-display');
            if (!dateDisplay) {
                console.error('Date display element not found');
                return;
            }
            
            if (currentMonth < monthNames.length && dateDisplay.textContent !== monthNames[currentMonth]) {
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
            const expensesElement = document.getElementById('expenses');
            const incomeElement = document.getElementById('income');
            
            if (expensesElement) {
                expensesElement.textContent = stats.expenses.toLocaleString();
            }
            
            if (incomeElement) {
                incomeElement.textContent = stats.income.toLocaleString();
            }
        } catch (error) {
            console.error('Error updating display:', error);
        }
    }
    
    // אנימציית שינוי ניקוד
    function animateScoreChange(startScore, endScore) {
        try {
            const scoreDisplay = document.getElementById('score-display');
            if (!scoreDisplay) {
                console.error('Score display element not found');
                return;
            }
            
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
                try {
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
                } catch (animateError) {
                    console.error('Error in animation frame:', animateError);
                    
                    // במקרה של שגיאה, עדכון מיידי של הערך הסופי
                    scoreDisplay.textContent = `סך נכסים פיננסיים: ${endScore.toLocaleString()} ש"ח`;
                    scoreDisplay.style.color = 'var(--primary-color)';
                    scoreDisplay.style.textShadow = 'none';
                }
            }
            
            // התחלת האנימציה
            animate();
        } catch (error) {
            console.error('Error animating score change:', error);
            
            // במקרה של שגיאה, עדכון מיידי של הערך הסופי
            const scoreDisplay = document.getElementById('score-display');
            if (scoreDisplay) {
                scoreDisplay.textContent = `סך נכסים פיננסיים: ${endScore.toLocaleString()} ש"ח`;
            }
        }
    }
    
    // ציור הרקע הדינמי בהתאם לזמן ביום
    function drawDynamicBackground() {
        try {
            if (!ctx) {
                console.error('Canvas context not available');
                return;
            }
            
            // ניקוי הקנבס
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // מיקום השמש/ירח בקנבס
            const sunElement = document.getElementById('sun');
            const moonElement = document.getElementById('moon');
            let sunX = 0, sunY = 0, moonX = 0, moonY = 0;
            
            if (sunElement) {
                sunX = parseInt(sunElement.style.left || '0');
                sunY = parseInt(sunElement.style.top || '0');
            }
            
            if (moonElement) {
                moonX = parseInt(moonElement.style.left || '0');
                moonY = parseInt(moonElement.style.top || '0');
            }
            
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
        } catch (error) {
            console.error('Error drawing dynamic background:', error);
        }
    }
    // ציור כוכבים בשמיים
    function drawStars() {
        try {
            if (!ctx) {
                console.error('Canvas context not available');
                return;
            }
            
            // בדיקה שמערך הכוכבים קיים
            if (!stars || !Array.isArray(stars) || stars.length === 0) {
                return;
            }
            
            // ציור הכוכבים מתוך מערך הכוכבים שנוצר
            for (let i = 0; i < stars.length; i++) {
                const star = stars[i];
                if (!star) continue;
                
                // אפקט הבהוב
                const twinkle = 0.5 + Math.sin(Date.now() * 0.001 * star.twinkleSpeed) * 0.5;
                const size = star.size * (0.7 + twinkle * 0.3);
                
                // ציור הכוכב
                ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + twinkle * 0.5})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        } catch (error) {
            console.error('Error drawing stars:', error);
        }
    }
    
    // ציור השחקן עם אנימציות ואפקטים
    function drawPlayer() {
        try {
            if (!ctx || !player) {
                console.error('Canvas context or player not available');
                return;
            }
            
            // שימוש בגורם בריאות להתאמת מראה השחקן
            const healthFactor = Math.max(0.2, Math.min(1, stats.physicalHealth / 100));
            const mentalFactor = Math.max(0.2, Math.min(1, stats.mentalHealth / 100));
            
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
        } catch (error) {
            console.error('Error drawing player:', error);
        }
    }
    
    // ציור בועת מחשבה
    function drawThoughtBubble(ctx, x, y, text, maxWidth, maxHeight) {
        try {
            if (!ctx) {
                console.error('Canvas context not available');
                return;
            }
            
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
        } catch (error) {
            console.error('Error drawing thought bubble:', error);
        }
    }
    // פונקציית עזר למלבנים מעוגלים
    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        try {
            if (!ctx) {
                console.error('Canvas context not available');
                return;
            }
            
            if (typeof stroke === 'undefined') {
                stroke = true;
            }
            if (typeof radius === 'undefined') {
                radius = 5;
            }
            
            // בדיקת תקינות של ערכים
            if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height) || isNaN(radius)) {
                console.error('Invalid parameters for roundRect', {x, y, width, height, radius});
                return;
            }
            
            // הגדרת מסלול
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
        } catch (error) {
            console.error('Error drawing rounded rectangle:', error);
        }
    }
    
    // ערבוב צבעים לאפקט שמיים
    function interpolateColor(color1, color2, ratio) {
        try {
            // המרת הקסדצימלי או RGB לערכי RGB
            function getRGB(color) {
                if (!color || typeof color !== 'string') return [0, 0, 0];
                
                if (color.startsWith('#')) {
                    const r = parseInt(color.slice(1, 3), 16);
                    const g = parseInt(color.slice(3, 5), 16);
                    const b = parseInt(color.slice(5, 7), 16);
                    return [r, g, b];
                } else if (color.startsWith('rgb')) {
                    const matches = color.match(/\d+/g);
                    if (matches && matches.length >= 3) {
                        return matches.slice(0, 3).map(Number);
                    }
                }
                return [0, 0, 0]; // ברירת מחדל
            }
            
            const rgb1 = getRGB(color1);
            const rgb2 = getRGB(color2);
            
            // וידוא שכל הערכים תקינים
            if (rgb1.some(isNaN) || rgb2.some(isNaN)) {
                console.error('Invalid color values', {color1, color2});
                return 'rgb(0, 0, 0)';
            }
            
            // מגביל את היחס בין 0 ל-1
            const safeRatio = Math.min(1, Math.max(0, ratio));
            
            const r = Math.round(rgb1[0] * (1 - safeRatio) + rgb2[0] * safeRatio);
            const g = Math.round(rgb1[1] * (1 - safeRatio) + rgb2[1] * safeRatio);
            const b = Math.round(rgb1[2] * (1 - safeRatio) + rgb2[2] * safeRatio);
            
            return `rgb(${r}, ${g}, ${b})`;
        } catch (error) {
            console.error('Error interpolating colors:', error);
            return 'rgb(0, 0, 0)'; // ברירת מחדל במקרה של שגיאה
        }
    }
    
    // ציור משחק
    function renderGame() {
        try {
            drawDynamicBackground();
        } catch (error) {
            console.error('Error rendering game:', error);
        }
    }
    
    // התחלת תנועה
    function startMoving() {
        try {
            if (!isMoving) {
                isMoving = true;
                
                const movementInstruction = document.getElementById('movement-instruction');
                if (movementInstruction) {
                    movementInstruction.style.display = 'none';
                }
                
                // משוב ויזואלי להתחלת תנועה
                player.y -= 4; // קפיצה קלה למעלה (הוגדל פי 2)
                
                // יצירת חלקיקי אבק ברגלי השחקן
                if (window.visualEffects) {
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            window.visualEffects.createDustParticle(player, ground, isDayTime);
                        }, i * 100);
                    }
                }
                
                if (moveTimer) {
                    clearTimeout(moveTimer);
                    moveTimer = null;
                }
            }
        } catch (error) {
            console.error('Error starting movement:', error);
        }
    }
    
    // עצירת תנועה
    function stopMoving() {
        try {
            if (isMoving) {
                isMoving = false;
                player.y += 4; // חזרה למיקום המקורי (הוגדל פי 2)
                
                // יצירת אפקט אבק עצירה
                if (window.visualEffects) {
                    window.visualEffects.createDustParticle(player, ground, isDayTime);
                }
            }
        } catch (error) {
            console.error('Error stopping movement:', error);
        }
    }
    
    // סיום משחק (הפסד)
    function gameOver(reason) {
        try {
            gameRunning = false;
            
            // עדכון סטטיסטיקות משחק
            const gameOverReasonElement = document.getElementById('game-over-reason');
            const finalScoreElement = document.getElementById('final-score');
            const monthsPlayedElement = document.getElementById('months-played');
            const powerupsCollectedElement = document.getElementById('powerups-collected');
            const obstaclesAvoidedElement = document.getElementById('obstacles-avoided');
            
            if (gameOverReasonElement) gameOverReasonElement.textContent = reason || 'סיבה לא ידועה';
            if (finalScoreElement) finalScoreElement.textContent = score.toLocaleString();
            if (monthsPlayedElement) monthsPlayedElement.textContent = stats.monthsPlayed;
            if (powerupsCollectedElement) powerupsCollectedElement.textContent = stats.powerupsCollected;
            if (obstaclesAvoidedElement) obstaclesAvoidedElement.textContent = stats.obstaclesAvoided;
            
            // הוספת אפקט סיום דרמטי
            if (window.visualEffects) {
                window.visualEffects.gameOverEffect();
            }
            
            // הצגת מסך סיום אחרי השהייה קצרה
            setTimeout(() => {
                const gameOverElement = document.getElementById('game-over');
                if (gameOverElement) {
                    gameOverElement.style.display = 'block';
                }
            }, 800);
        } catch (error) {
            console.error('Error processing game over:', error);
            // במקרה של שגיאה, נסיון להציג את המסך בכל מקרה
            const gameOverElement = document.getElementById('game-over');
            if (gameOverElement) {
                gameOverElement.style.display = 'block';
            }
        }
    }
    
    // ניצחון במשחק
    function winGame() {
        try {
            gameRunning = false;
            
            // עדכון סטטיסטיקות ניצחון
            const winMonthsElement = document.getElementById('win-months');
            const winPowerupsElement = document.getElementById('win-powerups');
            const winObstaclesElement = document.getElementById('win-obstacles');
            
            if (winMonthsElement) winMonthsElement.textContent = stats.monthsPlayed;
            if (winPowerupsElement) winPowerupsElement.textContent = stats.powerupsCollected;
            if (winObstaclesElement) winObstaclesElement.textContent = stats.obstaclesAvoided;
            
            // אפקט ניצחון
            if (window.visualEffects) {
                window.visualEffects.winGameEffect();
            }
            
            // הצגת מסך ניצחון אחרי השהייה קצרה
            setTimeout(() => {
                const winScreenElement = document.getElementById('win-screen');
                if (winScreenElement) {
                    winScreenElement.style.display = 'block';
                }
            }, 1500);
        } catch (error) {
            console.error('Error processing win game:', error);
            // במקרה של שגיאה, נסיון להציג את המסך בכל מקרה
            const winScreenElement = document.getElementById('win-screen');
            if (winScreenElement) {
                winScreenElement.style.display = 'block';
            }
        }
    }
    
    // אתחול מחדש של המשחק
    function resetGame() {
        try {
            // אפקט היעלמות מצב נוכחי
            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) {
                console.error('Game container not found');
                return;
            }
            
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
            
            gameContainer.appendChild(fadeOverlay);
            
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
                const statusNegative = document.getElementById('status-negative');
                const statusWeight = document.getElementById('status-weight');
                if (statusNegative) statusNegative.style.display = 'none';
                if (statusWeight) statusWeight.style.display = 'none';
                
                // הסתרת מד חיזוק
                const powerMeter = document.getElementById('power-meter');
                if (powerMeter) powerMeter.style.display = 'none';
                
                // הסתרת כל הדיאלוגים
                const obstacleDialog = document.getElementById('obstacle-dialog');
                const powerupDialog = document.getElementById('powerup-dialog');
                const gameOverScreen = document.getElementById('game-over');
                const winScreen = document.getElementById('win-screen');
                
                if (obstacleDialog) obstacleDialog.style.display = 'none';
                if (powerupDialog) powerupDialog.style.display = 'none';
                if (gameOverScreen) gameOverScreen.style.display = 'none';
                if (winScreen) winScreen.style.display = 'none';
                
                // איפוס והצגת מסך פתיחה
                const welcomeScreen = document.getElementById('welcome-screen');
                if (welcomeScreen) welcomeScreen.style.display = 'flex';
                
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
        } catch (error) {
            console.error('Error resetting game:', error);
            // במקרה של שגיאה חמורה, נסיון להציג את מסך הפתיחה בכל מקרה
            const welcomeScreen = document.getElementById('welcome-screen');
            if (welcomeScreen) welcomeScreen.style.display = 'flex';
        }
    }
    
    // טיפול בשינוי גודל חלון
    function handleResize() {
        try {
            if (!canvas) {
                console.error('Canvas not initialized');
                return;
            }
            
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
        } catch (error) {
            console.error('Error handling resize:', error);
        }
    }
    
    // ----------------- אירועים -----------------

    // רישום אירועים רק אם הדומיין כבר טעון
    function registerEventListeners() {
        try {
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
            if (canvas) {
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
            }
            
            // כפתורי דיאלוג מכשול
            const ignoreBtn = document.getElementById('ignore-btn');
            const acceptBtn = document.getElementById('accept-btn');
            
            if (ignoreBtn) {
                ignoreBtn.addEventListener('click', function() {
                    continuePersuasion(); // המשך לשלב שכנוע הבא או סגירת דיאלוג
                });
            }
            
            if (acceptBtn) {
                acceptBtn.addEventListener('click', function() {
                    acceptObstacle(); // קבלת המכשול עם כל ההשלכות השליליות
                });
            }
            
            // כפתורי דיאלוג חיזוק
            const powerupYesBtn = document.getElementById('powerup-yes-btn');
            const powerupNoBtn = document.getElementById('powerup-no-btn');
            
            if (powerupYesBtn) {
                powerupYesBtn.addEventListener('click', function() {
                    boostYesResponse();
                });
            }
            
            if (powerupNoBtn) {
                powerupNoBtn.addEventListener('click', function() {
                    boostNoResponse();
                });
            }
            
            // לחיצה על כפתור התחלה
            const startBtn = document.getElementById('start-btn');
            if (startBtn) {
                startBtn.addEventListener('click', function() {
                    // הוספת אנימציית לחיצה לכפתור
                    startBtn.style.transform = 'scale(0.95)';
                    startBtn.style.backgroundColor = '#1e5180';
                    
                    // איפוס אחרי השהייה קצרה
                    setTimeout(() => {
                        startBtn.style.transform = '';
                        startBtn.style.backgroundColor = '';
                        
                        // הסתרת מסך פתיחה בהדרגה
                        const welcomeScreen = document.getElementById('welcome-screen');
                        if (welcomeScreen) welcomeScreen.style.display = 'none';
                        gameRunning = true;
                    }, 100);
                });
            }
            
            // כפתורי סיום משחק
            const restartBtn = document.getElementById('restart-btn');
            const playAgainBtn = document.getElementById('play-again-btn');
            
            if (restartBtn) {
                restartBtn.addEventListener('click', function() {
                    // אנימציית לחיצה
                    restartBtn.style.transform = 'scale(0.95)';
                    
                    // איפוס אחרי השהייה קצרה
                    setTimeout(() => {
                        restartBtn.style.transform = '';
                        resetGame();
                    }, 100);
                });
            }
            
            if (playAgainBtn) {
                playAgainBtn.addEventListener('click', function() {
                    // אנימציית לחיצה
                    playAgainBtn.style.transform = 'scale(0.95)';
                    
                    // איפוס אחרי השהייה קצרה
                    setTimeout(() => {
                        playAgainBtn.style.transform = '';
                        resetGame();
                    }, 100);
                });
            }
            
            // אירוע שינוי גודל חלון
            window.addEventListener('resize', handleResize);
            
            console.log('Event listeners registered successfully');
        } catch (error) {
            console.error('Error registering event listeners:', error);
        }
    }
    
    // הפעלת המשחק
    function startGame() {
        try {
            // אתחול המשחק
            initGame();
            
            // הצגת מסך פתיחה
            if (window.visualEffects) {
                window.visualEffects.showWelcomeMessage();
            } else {
                // אם המודול טרם נטען, הצג את המסך בצורה פשוטה
                const welcomeScreen = document.getElementById('welcome-screen');
                if (welcomeScreen) welcomeScreen.style.display = 'flex';
            }
            
            // לולאת משחק - פעילה ב-60 פריימים בשנייה
            const gameLoop = setInterval(() => {
                if (!gameRunning && !gamePaused) {
                    // אם המשחק הסתיים, עצור את הלולאה
                    clearInterval(gameLoop);
                    return;
                }
                
                updateGame();
            }, 1000 / framesPerSecond);
            
            console.log('Game started successfully');
        } catch (error) {
            console.error('Error starting game:', error);
            showErrorMessage('שגיאה בהפעלת המשחק. נא לרענן את הדף.');
        }
    }
    
    // רישום אירועים ואתחול המשחק
    document.addEventListener('DOMContentLoaded', () => {
        try {
            registerEventListeners();
            
            // בדיקה והסתרת מסך הטעינה
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                // בדיקה אם כל המודולים נטענו
                if (window.gameModules && window.gameModules.ready) {
                    loadingScreen.style.opacity = '0';
                    loadingScreen.style.transition = 'opacity 0.5s ease';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        startGame();
                    }, 500);
                } else {
                    // המשך לבדוק אם המודולים נטענו
                    const checkModulesInterval = setInterval(() => {
                        if (window.gameModules && window.gameModules.ready) {
                            clearInterval(checkModulesInterval);
                            loadingScreen.style.opacity = '0';
                            loadingScreen.style.transition = 'opacity 0.5s ease';
                            setTimeout(() => {
                                loadingScreen.style.display = 'none';
                                startGame();
                            }, 500);
                        }
                    }, 100);
                    
                    // הגבלת זמן המתנה - אם לא נטען תוך 10 שניות, התחל בכל מקרה
                    setTimeout(() => {
                        clearInterval(checkModulesInterval);
                        if (loadingScreen.style.display !== 'none') {
                            loadingScreen.style.opacity = '0';
                            loadingScreen.style.transition = 'opacity 0.5s ease';
                            setTimeout(() => {
                                loadingScreen.style.display = 'none';
                                startGame();
                            }, 500);
                        }
                    }, 10000);
                }
            } else {
                // אם אין מסך טעינה, התחל את המשחק ישירות
                startGame();
            }
        } catch (error) {
            console.error('Error during initialization:', error);
            showErrorMessage('שגיאה באתחול המשחק. נא לרענן את הדף.');
        }
    });

    // סימון שהמודול נטען בהצלחה
    if (window.gameModules && typeof window.gameModules.loaded === 'object') {
        window.gameModules.loaded['game.js'] = true;
    }
    
    console.log('Game.js loaded successfully');
})(); // סיום ה-IIFE
