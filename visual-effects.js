// visual-effects.js - אפקטים ויזואליים למשחק

// הגדרת אובייקט גלובלי לאפקטים ויזואליים
window.visualEffects = (function() {
    'use strict';
    
    // מאגר של אפקטים ויזואליים ואנימציות עבור המשחק
    const effects = {
        // יצירת אפקט הודעה קופצת
        showPopupMessage: function(message, duration = 2000) {
            const popup = document.getElementById('popup-message');
            if (!popup) {
                console.error('Popup message element not found');
                return;
            }
            
            popup.textContent = message;
            popup.style.opacity = '1';
            popup.style.transform = 'translateX(-50%) translateY(-10px)';
            
            setTimeout(() => {
                popup.style.opacity = '0';
                popup.style.transform = 'translateX(-50%) translateY(0px)';
            }, duration);
        },
        
        // אפקט בונוס כספי - אנימציית מטבעות
        showCoinAnimation: function(amount) {
            try {
                // מספר המטבעות תלוי בסכום
                const coinCount = Math.min(10, Math.max(5, Math.floor(amount / 500)));
                const gameContainer = document.getElementById('game-container');
                
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                for (let i = 0; i < coinCount; i++) {
                    const coin = document.createElement('div');
                    coin.className = 'animated-coin';
                    
                    // עיצוב המטבע
                    coin.style.position = 'absolute';
                    coin.style.width = '60px'; // הוגדל פי 2
                    coin.style.height = '60px'; // הוגדל פי 2
                    coin.style.borderRadius = '50%';
                    coin.style.backgroundColor = '#FFD700';
                    coin.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.7)';
                    coin.style.zIndex = '30';
                    coin.style.display = 'flex';
                    coin.style.justifyContent = 'center';
                    coin.style.alignItems = 'center';
                    coin.style.color = '#333';
                    coin.style.fontWeight = 'bold';
                    coin.style.fontSize = '32px'; // הוגדל פי 2
                    coin.textContent = '₪';
                    
                    // מיקום במרכז המסך
                    coin.style.top = '50%';
                    coin.style.left = '50%';
                    
                    // הוספה למשחק
                    gameContainer.appendChild(coin);
                    
                    // אנימציה רנדומלית
                    const randomX = Math.random() * 400 - 200; // -200 עד 200
                    const randomY = Math.random() * 200 - 300; // -300 עד -100 (כלפי מעלה)
                    const randomDelay = Math.random() * 200;
                    
                    // יצירת קיפריימס דינמיים
                    const keyframes = `
                        @keyframes coin-move-${i} {
                            0% {
                                transform: translate(-50%, -50%) scale(0.3);
                                opacity: 0;
                            }
                            10% {
                                transform: translate(-50%, -50%) scale(1);
                                opacity: 1;
                            }
                            60% {
                                transform: translate(calc(-50% + ${randomX}px), calc(-50% + ${randomY}px)) scale(1);
                                opacity: 1;
                            }
                            100% {
                                transform: translate(calc(-50% + ${randomX}px), calc(-50% + ${randomY - 50}px)) scale(0.5);
                                opacity: 0;
                            }
                        }
                    `;
                    
                    // הוספת סגנון לאנימציה זו
                    const style = document.createElement('style');
                    style.textContent = keyframes;
                    document.head.appendChild(style);
                    
                    // הפעלת האנימציה עם השהייה
                    setTimeout(() => {
                        coin.style.animation = `coin-move-${i} 1.5s ease-out forwards`;
                    }, randomDelay);
                    
                    // הסרת המטבע אחרי האנימציה
                    setTimeout(() => {
                        if (coin.parentNode) {
                            coin.parentNode.removeChild(coin);
                        }
                        if (style.parentNode) {
                            style.parentNode.removeChild(style);
                        }
                    }, 1800 + randomDelay);
                }
                
                // אנימציית טקסט לסכום הכולל
                const totalAmount = document.createElement('div');
                totalAmount.className = 'total-bonus';
                totalAmount.style.position = 'absolute';
                totalAmount.style.top = '40%';
                totalAmount.style.left = '50%';
                totalAmount.style.transform = 'translate(-50%, -50%)';
                totalAmount.style.fontSize = '72px'; // הוגדל פי 2
                totalAmount.style.fontWeight = 'bold';
                totalAmount.style.color = '#FFD700';
                totalAmount.style.textShadow = '0 0 20px rgba(255, 215, 0, 0.7), 0 0 10px rgba(0, 0, 0, 0.5)';
                totalAmount.style.zIndex = '31';
                totalAmount.style.opacity = '0';
                totalAmount.textContent = `+${amount} ₪`;
                
                gameContainer.appendChild(totalAmount);
                
                // אנימציית הופעה והיעלמות
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes total-bonus-anim {
                        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                        30% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                        70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        100% { opacity: 0; transform: translate(-50%, -100%) scale(1); }
                    }
                `;
                document.head.appendChild(style);
                
                setTimeout(() => {
                    totalAmount.style.animation = 'total-bonus-anim 2s ease-out forwards';
                }, 300);
                
                // הסרת האלמנטים אחרי האנימציה
                setTimeout(() => {
                    if (totalAmount.parentNode) {
                        totalAmount.parentNode.removeChild(totalAmount);
                    }
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, 2500);
            } catch (error) {
                console.error('Error in showCoinAnimation:', error);
            }
        },
        
        // אפקט הפסד כספי
        showMoneyLossEffect: function(amount) {
            try {
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                // טקסט של הפסד כספי
                const lossText = document.createElement('div');
                lossText.className = 'money-loss';
                lossText.style.position = 'absolute';
                lossText.style.top = '40%';
                lossText.style.left = '50%';
                lossText.style.transform = 'translate(-50%, -50%)';
                lossText.style.fontSize = '72px'; // הוגדל פי 2
                lossText.style.fontWeight = 'bold';
                lossText.style.color = '#d45b5b';
                lossText.style.textShadow = '0 0 20px rgba(212, 91, 91, 0.7), 0 0 10px rgba(0, 0, 0, 0.5)';
                lossText.style.zIndex = '30';
                lossText.style.opacity = '0';
                lossText.textContent = `-${amount} ₪`;
                
                gameContainer.appendChild(lossText);
                
                // אנימציה
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes money-loss-anim {
                        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                        30% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                        70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        100% { opacity: 0; transform: translate(-50%, 0) scale(1); }
                    }
                `;
                document.head.appendChild(style);
                
                lossText.style.animation = 'money-loss-anim 2s ease-out forwards';
                
                // "מטבעות נופלים" לסכומים גדולים
                if (amount > 1000) {
                    const coinCount = Math.min(8, Math.floor(amount / 500));
                    
                    for (let i = 0; i < coinCount; i++) {
                        const coin = document.createElement('div');
                        coin.className = 'falling-coin';
                        
                        // עיצוב המטבע
                        coin.style.position = 'absolute';
                        coin.style.width = '40px'; // הוגדל פי 2
                        coin.style.height = '40px'; // הוגדל פי 2
                        coin.style.borderRadius = '50%';
                        coin.style.backgroundColor = '#d45b5b';
                        coin.style.boxShadow = '0 0 10px rgba(212, 91, 91, 0.7)';
                        coin.style.zIndex = '29';
                        coin.style.display = 'flex';
                        coin.style.justifyContent = 'center';
                        coin.style.alignItems = 'center';
                        coin.style.color = '#fff';
                        coin.style.fontWeight = 'bold';
                        coin.style.fontSize = '24px'; // הוגדל פי 2
                        coin.textContent = '₪';
                        
                        // מיקום במרכז המסך
                        coin.style.top = '40%';
                        coin.style.left = '50%';
                        
                        gameContainer.appendChild(coin);
                        
                        // אנימציה דינמית
                        const fallDelay = Math.random() * 0.5;
                        const fallDuration = 1 + Math.random() * 0.5;
                        const horizontalOffset = (Math.random() * 400) - 200; // -200px to 200px, הוגדל פי 2
                        
                        // קיפריימס ספציפיים
                        const coinKeyframes = `
                            @keyframes coin-fall-${i} {
                                0% { 
                                    opacity: 1;
                                    transform: translate(-50%, -50%) scale(1); 
                                }
                                100% { 
                                    opacity: 0;
                                    transform: translate(calc(-50% + ${horizontalOffset}px), calc(-50% + 400px)) scale(0.5) rotate(${Math.random() * 360}deg); 
                                }
                            }
                        `;
                        
                        const coinStyle = document.createElement('style');
                        coinStyle.textContent = coinKeyframes;
                        document.head.appendChild(coinStyle);
                        
                        // הפעלת אנימציה עם השהייה
                        setTimeout(() => {
                            coin.style.animation = `coin-fall-${i} ${fallDuration}s ease-in forwards`;
                        }, fallDelay * 1000);
                        
                        // הסרת המטבע אחרי האנימציה
                        setTimeout(() => {
                            if (coin.parentNode) {
                                coin.parentNode.removeChild(coin);
                            }
                            if (coinStyle.parentNode) {
                                coinStyle.parentNode.removeChild(coinStyle);
                            }
                        }, (fallDelay + fallDuration + 0.1) * 1000);
                    }
                }
                
                // הסרת אלמנטים אחרי האנימציה
                setTimeout(() => {
                    if (lossText.parentNode) {
                        lossText.parentNode.removeChild(lossText);
                    }
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, 2000);
            } catch (error) {
                console.error('Error in showMoneyLossEffect:', error);
            }
        },
        // אפקט שיפור בריאות מנטלית
        showMentalBoostEffect: function() {
            try {
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                const effect = document.createElement('div');
                effect.className = 'mental-boost-effect';
                
                // עיצוב האפקט
                effect.style.position = 'absolute';
                effect.style.top = '0';
                effect.style.left = '0';
                effect.style.width = '100%';
                effect.style.height = '100%';
                effect.style.background = 'radial-gradient(circle at center, rgba(42, 100, 150, 0.3) 0%, rgba(42, 100, 150, 0) 70%)';
                effect.style.opacity = '0';
                effect.style.zIndex = '20';
                effect.style.pointerEvents = 'none';
                
                gameContainer.appendChild(effect);
                
                // אנימציה
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes mental-boost {
                        0% { opacity: 0; }
                        50% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
                
                effect.style.animation = 'mental-boost 1.5s ease-out forwards';
                
                // הסרת האלמנטים אחרי האנימציה
                setTimeout(() => {
                    if (effect.parentNode) {
                        effect.parentNode.removeChild(effect);
                    }
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, 1500);
            } catch (error) {
                console.error('Error in showMentalBoostEffect:', error);
            }
        },
        
        // אפקט שיפור בריאות פיזית
        showPhysicalBoostEffect: function() {
            try {
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                const effect = document.createElement('div');
                effect.className = 'physical-boost-effect';
                
                // עיצוב האפקט
                effect.style.position = 'absolute';
                effect.style.top = '0';
                effect.style.left = '0';
                effect.style.width = '100%';
                effect.style.height = '100%';
                effect.style.background = 'radial-gradient(circle at center, rgba(58, 122, 95, 0.3) 0%, rgba(58, 122, 95, 0) 70%)';
                effect.style.opacity = '0';
                effect.style.zIndex = '20';
                effect.style.pointerEvents = 'none';
                
                gameContainer.appendChild(effect);
                
                // אנימציה
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes physical-boost {
                        0% { opacity: 0; }
                        50% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
                
                effect.style.animation = 'physical-boost 1.5s ease-out forwards';
                
                // הסרת האלמנטים אחרי האנימציה
                setTimeout(() => {
                    if (effect.parentNode) {
                        effect.parentNode.removeChild(effect);
                    }
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, 1500);
            } catch (error) {
                console.error('Error in showPhysicalBoostEffect:', error);
            }
        },
        
        // אפקט פגיעה בבריאות מנטלית
        showNegativeMentalEffect: function() {
            try {
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                const effect = document.createElement('div');
                effect.className = 'negative-mental-effect';
                
                // עיצוב האפקט
                effect.style.position = 'absolute';
                effect.style.top = '0';
                effect.style.left = '0';
                effect.style.width = '100%';
                effect.style.height = '100%';
                effect.style.background = 'radial-gradient(circle at center, rgba(100, 100, 150, 0.2) 0%, rgba(100, 100, 150, 0) 70%)';
                effect.style.opacity = '0';
                effect.style.zIndex = '20';
                effect.style.pointerEvents = 'none';
                
                gameContainer.appendChild(effect);
                
                // אנימציה
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes negative-mental {
                        0% { opacity: 0; }
                        30% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
                
                effect.style.animation = 'negative-mental 1.5s ease-out forwards';
                
                // הסרת האלמנטים אחרי האנימציה
                setTimeout(() => {
                    if (effect.parentNode) {
                        effect.parentNode.removeChild(effect);
                    }
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, 1500);
            } catch (error) {
                console.error('Error in showNegativeMentalEffect:', error);
            }
        },
        
        // אפקט פגיעה בבריאות פיזית
        showNegativePhysicalEffect: function() {
            try {
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                const effect = document.createElement('div');
                effect.className = 'negative-physical-effect';
                
                // עיצוב האפקט
                effect.style.position = 'absolute';
                effect.style.top = '0';
                effect.style.left = '0';
                effect.style.width = '100%';
                effect.style.height = '100%';
                effect.style.background = 'radial-gradient(circle at center, rgba(212, 91, 91, 0.2) 0%, rgba(212, 91, 91, 0) 70%)';
                effect.style.opacity = '0';
                effect.style.zIndex = '20';
                effect.style.pointerEvents = 'none';
                
                gameContainer.appendChild(effect);
                
                // אנימציה
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes negative-physical {
                        0% { opacity: 0; }
                        50% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
                
                effect.style.animation = 'negative-physical 1.5s ease-out forwards';
                
                // הסרת האלמנטים אחרי האנימציה
                setTimeout(() => {
                    if (effect.parentNode) {
                        effect.parentNode.removeChild(effect);
                    }
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, 1500);
            } catch (error) {
                console.error('Error in showNegativePhysicalEffect:', error);
            }
        },
        
        // אפקט החלטה חיובית
        showPositiveDecisionEffect: function(player) {
            try {
                if (!player) {
                    console.error('Player object not provided to showPositiveDecisionEffect');
                    return;
                }
                
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                // אפקט מגן סביב השחקן
                const shield = document.createElement('div');
                shield.className = 'decision-shield';
                shield.style.position = 'absolute';
                shield.style.top = `${player.y + player.height / 2}px`;
                shield.style.left = `${player.x + player.width / 2}px`;
                shield.style.width = '0';
                shield.style.height = '0';
                shield.style.borderRadius = '50%';
                shield.style.background = 'radial-gradient(circle, rgba(58, 122, 95, 0.2) 0%, rgba(58, 122, 95, 0) 70%)';
                shield.style.transform = 'translate(-50%, -50%)';
                shield.style.zIndex = '15';
                
                gameContainer.appendChild(shield);
                
                // אנימציה למגן
                const shieldStyle = document.createElement('style');
                shieldStyle.textContent = `
                    @keyframes shield-expand {
                        0% { width: 0; height: 0; opacity: 0; }
                        50% { width: 400px; height: 400px; opacity: 0.7; } /* הוגדל פי 2 */
                        100% { width: 600px; height: 600px; opacity: 0; }  /* הוגדל פי 2 */
                    }
                `;
                document.head.appendChild(shieldStyle);
                
                shield.style.animation = 'shield-expand 1.5s ease-out forwards';
                
                // אייקון וי
                const checkmark = document.createElement('div');
                checkmark.className = 'decision-checkmark';
                checkmark.style.position = 'absolute';
                checkmark.style.top = `${player.y - 60}px`; // הוגדל פי 2
                checkmark.style.left = `${player.x + player.width / 2}px`;
                checkmark.style.transform = 'translate(-50%, -50%)';
                checkmark.style.fontSize = '60px'; // הוגדל פי 2
                checkmark.style.color = 'rgb(58, 122, 95)';
                checkmark.style.zIndex = '16';
                checkmark.style.opacity = '0';
                checkmark.textContent = '✓';
                
                gameContainer.appendChild(checkmark);
                
                // אנימציה לוי
                const checkStyle = document.createElement('style');
                checkStyle.textContent = `
                    @keyframes checkmark-appear {
                        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
                        100% { opacity: 0; transform: translate(-50%, -260%) scale(1); } /* הוגדל פי 2 */
                    }
                `;
                document.head.appendChild(checkStyle);
                
                checkmark.style.animation = 'checkmark-appear 1.5s ease-out forwards';
                
                // הסרת אלמנטים אחרי אנימציה
                setTimeout(() => {
                    if (shield.parentNode) {
                        shield.parentNode.removeChild(shield);
                    }
                    if (shieldStyle.parentNode) {
                        shieldStyle.parentNode.removeChild(shieldStyle);
                    }
                    if (checkmark.parentNode) {
                        checkmark.parentNode.removeChild(checkmark);
                    }
                    if (checkStyle.parentNode) {
                        checkStyle.parentNode.removeChild(checkStyle);
                    }
                }, 1500);
            } catch (error) {
                console.error('Error in showPositiveDecisionEffect:', error);
            }
        },
        // אפקט למעבר חודש
        showMonthTransitionEffect: function(monthName) {
            try {
                if (!monthName) {
                    console.warn('Month name not provided for transition effect');
                    monthName = 'חודש חדש';
                }
                
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                // אוברליי למעבר חודש
                const overlay = document.createElement('div');
                overlay.className = 'month-transition';
                overlay.style.position = 'absolute';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
                overlay.style.zIndex = '40';
                overlay.style.pointerEvents = 'none';
                overlay.style.display = 'flex';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';
                
                // טקסט החודש
                const monthText = document.createElement('div');
                monthText.style.fontSize = '96px'; // הוגדל פי 2
                monthText.style.fontWeight = 'bold';
                monthText.style.color = 'rgba(42, 100, 150, 0)';
                monthText.style.textShadow = '0 0 40px rgba(42, 100, 150, 0.5)'; // הוגדל פי 2
                monthText.style.opacity = '0';
                monthText.style.transform = 'scale(0.8)';
                monthText.style.transition = 'all 0.5s ease';
                monthText.textContent = monthName;
                
                overlay.appendChild(monthText);
                gameContainer.appendChild(overlay);
                
                // אנימציית מעבר
                setTimeout(() => {
                    overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                    monthText.style.opacity = '1';
                    monthText.style.color = 'rgba(42, 100, 150, 1)';
                    monthText.style.transform = 'scale(1.2)';
                }, 100);
                
                setTimeout(() => {
                    monthText.style.opacity = '0';
                    monthText.style.transform = 'scale(0.8)';
                    overlay.style.backgroundColor = 'rgba(255, 255, 255, 0)';
                }, 1500);
                
                // הסרת האוברליי אחרי האנימציה
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.parentNode.removeChild(overlay);
                    }
                }, 2000);
            } catch (error) {
                console.error('Error in showMonthTransitionEffect:', error);
            }
        },
        
        // אפקט הכנסה חודשית
        showMonthlyIncomeEffect: function(amount) {
            try {
                if (isNaN(amount)) {
                    console.error('Invalid amount for monthly income effect');
                    return;
                }
                
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                // אפקט טקסט
                const incomeText = document.createElement('div');
                incomeText.className = 'income-text';
                incomeText.style.position = 'absolute';
                incomeText.style.top = '40%';
                incomeText.style.left = '50%';
                incomeText.style.transform = 'translate(-50%, -50%)';
                incomeText.style.fontSize = '64px'; // הוגדל פי 2
                incomeText.style.fontWeight = 'bold';
                incomeText.style.color = '#3a7a5f';
                incomeText.style.textShadow = '0 0 20px rgba(58, 122, 95, 0.7), 0 0 10px rgba(0, 0, 0, 0.5)'; // הוגדל פי 2
                incomeText.style.zIndex = '30';
                incomeText.style.opacity = '0';
                incomeText.textContent = `+${amount.toLocaleString()} ש"ח משכורת חודשית`;
                
                gameContainer.appendChild(incomeText);
                
                // אנימציה
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes income-text-anim {
                        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                        30% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                        70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        100% { opacity: 0; transform: translate(-50%, -200%) scale(1); } /* הוגדל פי 2 */
                    }
                `;
                document.head.appendChild(style);
                
                incomeText.style.animation = 'income-text-anim 2.5s ease-out forwards';
                
                // הסרת אלמנטים אחרי אנימציה
                setTimeout(() => {
                    if (incomeText.parentNode) {
                        incomeText.parentNode.removeChild(incomeText);
                    }
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, 2500);
                
                // מטבעות נופלים
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        const coin = document.createElement('div');
                        coin.className = 'income-coin';
                        
                        // עיצוב המטבע
                        coin.style.position = 'absolute';
                        coin.style.width = '60px'; // הוגדל פי 2
                        coin.style.height = '60px'; // הוגדל פי 2
                        coin.style.borderRadius = '50%';
                        coin.style.backgroundColor = '#3a7a5f';
                        coin.style.boxShadow = '0 0 20px rgba(58, 122, 95, 0.7)'; // הוגדל פי 2
                        coin.style.zIndex = '29';
                        coin.style.display = 'flex';
                        coin.style.justifyContent = 'center';
                        coin.style.alignItems = 'center';
                        coin.style.color = '#fff';
                        coin.style.fontWeight = 'bold';
                        coin.style.fontSize = '36px'; // הוגדל פי 2
                        coin.textContent = '₪';
                        
                        // מיקום בחלק העליון של המסך
                        const startX = Math.random() * window.innerWidth;
                        coin.style.top = '-60px'; // הוגדל פי 2
                        coin.style.left = `${startX}px`;
                        
                        gameContainer.appendChild(coin);
                        
                        // אנימציה
                        const fallDuration = 1.5 + Math.random();
                        const fallDelay = Math.random() * 0.5;
                        const rotation = Math.random() * 360;
                        const endX = startX + (Math.random() * 400 - 200); // הוגדל פי 2
                        
                        const coinKeyframes = `
                            @keyframes coin-income-${i} {
                                0% { 
                                    opacity: 1;
                                    transform: translateY(0) rotate(0deg); 
                                }
                                80% {
                                    opacity: 1;
                                }
                                100% { 
                                    opacity: 0;
                                    transform: translateY(${window.innerHeight}px) translateX(${endX - startX}px) rotate(${rotation}deg); 
                                }
                            }
                        `;
                        
                        const coinStyle = document.createElement('style');
                        coinStyle.textContent = coinKeyframes;
                        document.head.appendChild(coinStyle);
                        
                        // הפעלת אנימציה עם השהייה
                        setTimeout(() => {
                            coin.style.animation = `coin-income-${i} ${fallDuration}s ease-in forwards`;
                        }, fallDelay * 1000);
                        
                        // הסרת המטבע אחרי האנימציה
                        setTimeout(() => {
                            if (coin.parentNode) {
                                coin.parentNode.removeChild(coin);
                            }
                            if (coinStyle.parentNode) {
                                coinStyle.parentNode.removeChild(coinStyle);
                            }
                        }, (fallDuration + fallDelay + 0.1) * 1000);
                    }, i * 100); // יצירה הדרגתית של מטבעות
                }
            } catch (error) {
                console.error('Error in showMonthlyIncomeEffect:', error);
            }
        },
        
        // עיצוב אפקט יום/לילה חלק יותר
        smoothDayNightTransition: function(isDayTime, dayNightOverlay, sunElement, moonElement) {
            try {
                if (!dayNightOverlay || !sunElement || !moonElement) {
                    console.error('Missing elements for day/night transition');
                    return;
                }
                
                // אפקט מעבר חלק יותר בין יום ולילה
                
                // אם עובר ליום
                if (isDayTime) {
                    // הבהרת המסך בהדרגה
                    dayNightOverlay.style.backgroundColor = 'rgba(0, 0, 30, 0)';
                    
                    // הופעת השמש בהדרגה
                    sunElement.style.opacity = '1';
                    
                    // היעלמות הירח בהדרגה
                    moonElement.style.opacity = '0';
                    
                    // הסתרת כוכבים בהדרגה
                    document.querySelectorAll('.star').forEach(star => {
                        star.style.opacity = '0';
                        star.style.transition = 'opacity 4s ease'; // מעבר איטי יותר - פי 2 זמן
                    });
                } 
                // אם עובר ללילה
                else {
                    // החשכת המסך בהדרגה
                    dayNightOverlay.style.backgroundColor = 'rgba(0, 0, 30, 0.3)';
                    
                    // היעלמות השמש בהדרגה
                    sunElement.style.opacity = '0';
                    
                    // הופעת הירח בהדרגה
                    moonElement.style.opacity = '1';
                    
                    // הופעת כוכבים בהדרגה
                    document.querySelectorAll('.star').forEach(star => {
                        star.style.opacity = '0.7';
                        star.style.transition = 'opacity 4s ease'; // מעבר איטי יותר - פי 2 זמן
                    });
                }
            } catch (error) {
                console.error('Error in smoothDayNightTransition:', error);
            }
        },
        
        // יצירת אפקט אבק בתנועה
        createDustParticle: function(player, ground, isDayTime) {
            try {
                if (!player || !ground) {
                    console.error('Missing player or ground for createDustParticle');
                    return;
                }
                
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                const particle = document.createElement('div');
                particle.className = 'dust-particle';
                
                // עיצוב חלקיק
                particle.style.position = 'absolute';
                particle.style.width = '8px'; // הוגדל פי 2
                particle.style.height = '8px'; // הוגדל פי 2
                particle.style.borderRadius = '50%';
                particle.style.backgroundColor = isDayTime ? 'rgba(200, 200, 200, 0.6)' : 'rgba(150, 150, 180, 0.6)';
                particle.style.zIndex = '12';
                
                // מיקום ברגלי השחקן
                particle.style.top = `${ground.y}px`;
                particle.style.left = `${player.x + player.width / 2}px`;
                
                gameContainer.appendChild(particle);
                
                // יצירת אנימציה
                const angle = Math.PI + (Math.random() * Math.PI * 0.5);
                const distance = 20 + Math.random() * 40; // הוגדל פי 2
                const duration = 0.5 + Math.random() * 0.5;
                
                const particleKeyframes = `
                    @keyframes dust-move-${Date.now()} {
                        0% { 
                            opacity: 0.8;
                            transform: translateX(0) translateY(0) scale(1);
                        }
                        100% { 
                            opacity: 0;
                            transform: translateX(${Math.cos(angle) * distance}px) translateY(${Math.sin(angle) * distance}px) scale(0.5);
                        }
                    }
                `;
                
                const style = document.createElement('style');
                style.textContent = particleKeyframes;
                document.head.appendChild(style);
                
                // הפעלת אנימציה
                particle.style.animation = `dust-move-${Date.now()} ${duration}s ease-out forwards`;
                
                // הסרת החלקיק אחרי האנימציה
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, duration * 1000 + 100);
            } catch (error) {
                console.error('Error in createDustParticle:', error);
            }
        },
        // אפקט הבזק עבור תשובה שגויה בשאלות ידע
        showWrongAnswerEffect: function() {
            try {
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                // אפקט הבזק אדום קל למסך
                const effect = document.createElement('div');
                effect.className = 'wrong-answer-effect';
                
                // עיצוב האפקט
                effect.style.position = 'absolute';
                effect.style.top = '0';
                effect.style.left = '0';
                effect.style.width = '100%';
                effect.style.height = '100%';
                effect.style.backgroundColor = 'rgba(212, 91, 91, 0.2)';
                effect.style.opacity = '0';
                effect.style.zIndex = '20';
                effect.style.pointerEvents = 'none';
                
                gameContainer.appendChild(effect);
                
                // אנימציה
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes wrong-answer {
                        0% { opacity: 0; }
                        25% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
                
                effect.style.animation = 'wrong-answer 0.8s ease-out forwards';
                
                // הסרת האלמנטים אחרי האנימציה
                setTimeout(() => {
                    if (effect.parentNode) {
                        effect.parentNode.removeChild(effect);
                    }
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, 800);
            } catch (error) {
                console.error('Error in showWrongAnswerEffect:', error);
            }
        },
        
        // אפקט הבזק עבור תשובה נכונה בשאלות ידע
        showCorrectAnswerEffect: function() {
            try {
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                // אפקט הבזק ירוק קל למסך
                const effect = document.createElement('div');
                effect.className = 'correct-answer-effect';
                
                // עיצוב האפקט
                effect.style.position = 'absolute';
                effect.style.top = '0';
                effect.style.left = '0';
                effect.style.width = '100%';
                effect.style.height = '100%';
                effect.style.backgroundColor = 'rgba(58, 122, 95, 0.2)';
                effect.style.opacity = '0';
                effect.style.zIndex = '20';
                effect.style.pointerEvents = 'none';
                
                gameContainer.appendChild(effect);
                
                // אנימציה
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes correct-answer {
                        0% { opacity: 0; }
                        25% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
                
                effect.style.animation = 'correct-answer 0.8s ease-out forwards';
                
                // הסרת האלמנטים אחרי האנימציה
                setTimeout(() => {
                    if (effect.parentNode) {
                        effect.parentNode.removeChild(effect);
                    }
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, 800);
            } catch (error) {
                console.error('Error in showCorrectAnswerEffect:', error);
            }
        },
        
        // אפקט ברוכים הבאים
        showWelcomeMessage: function() {
            try {
                const welcomeScreen = document.getElementById('welcome-screen');
                if (!welcomeScreen) {
                    console.error('Welcome screen element not found');
                    return;
                }
                
                // יצירת באנר ברוכים הבאים מונפש
                welcomeScreen.style.display = 'flex';
                welcomeScreen.style.opacity = '0';
                welcomeScreen.style.transition = 'opacity 0.5s ease';
                
                // אנימציית הופעה הדרגתית
                setTimeout(() => {
                    welcomeScreen.style.opacity = '1';
                }, 100);
            } catch (error) {
                console.error('Error in showWelcomeMessage:', error);
            }
        },
        
        // אפקט משחק נגמר
        gameOverEffect: function() {
            try {
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                // אפקט סיום משחק דרמטי
                const overlay = document.createElement('div');
                overlay.className = 'game-over-overlay';
                overlay.style.position = 'absolute';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.backgroundColor = 'rgba(0, 0, 0, 0)';
                overlay.style.transition = 'background-color 1.5s ease';
                overlay.style.zIndex = '90';
                
                gameContainer.appendChild(overlay);
                
                // החשכת המסך בהדרגה
                setTimeout(() => {
                    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
                }, 100);
                
                // אפקט סדק באדמה
                const crack = document.createElement('div');
                crack.className = 'ground-crack';
                crack.style.position = 'absolute';
                crack.style.top = `${window.innerHeight * 0.8 - 20}px`; // הוגדל פי 2
                crack.style.left = '50%';
                crack.style.transform = 'translateX(-50%)';
                crack.style.width = '0';
                crack.style.height = '40px'; // הוגדל פי 2
                crack.style.backgroundColor = '#333';
                crack.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 0, 0, 0.3)'; // הוגדל פי 2
                crack.style.zIndex = '91';
                
                gameContainer.appendChild(crack);
                
                // אנימציה לסדק
                const crackStyle = document.createElement('style');
                crackStyle.textContent = `
                    @keyframes crack-grow {
                        0% { width: 0; }
                        60% { width: 60%; }
                        100% { width: 50%; }
                    }
                `;
                document.head.appendChild(crackStyle);
                
                crack.style.animation = 'crack-grow 1.2s ease-out forwards';
            } catch (error) {
                console.error('Error in gameOverEffect:', error);
            }
        },
        
        // אפקט ניצחון
        winGameEffect: function() {
            try {
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                // אוברליי חגיגי
                const overlay = document.createElement('div');
                overlay.className = 'win-overlay';
                overlay.style.position = 'absolute';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.background = 'radial-gradient(circle, rgba(42, 100, 150, 0) 0%, rgba(42, 100, 150, 0.3) 100%)';
                overlay.style.transition = 'all 1.5s ease';
                overlay.style.zIndex = '90';
                overlay.style.opacity = '0';
                
                gameContainer.appendChild(overlay);
                
                // הופעת האוברליי
                setTimeout(() => {
                    overlay.style.opacity = '1';
                }, 100);
                
                // יצירת זיקוקים
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        this.createFirework();
                    }, i * 300);
                }
                
                // יצירת גשם של מטבעות זהב
                for (let i = 0; i < 30; i++) {
                    setTimeout(() => {
                        this.createGoldenRain();
                    }, Math.random() * 2000);
                }
            } catch (error) {
                console.error('Error in winGameEffect:', error);
            }
        },
        
        // יצירת זיקוק לאפקט ניצחון
        createFirework: function() {
            try {
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                // יצירת פיצוץ זיקוקים במיקום אקראי
                const explosionX = Math.random() * window.innerWidth;
                const explosionY = Math.random() * (window.innerHeight * 0.6);
                
                // צבע זיקוק אקראי
                const colors = [
                    '255, 215, 0',  // זהב
                    '42, 100, 150', // כחול
                    '58, 122, 95',  // ירוק
                    '255, 127, 80', // כתום
                    '147, 112, 219' // סגול
                ];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                // יצירת חלקיקים
                for (let i = 0; i < 30; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'firework-particle';
                    
                    // עיצוב החלקיק
                    particle.style.position = 'absolute';
                    particle.style.width = '8px'; // הוגדל פי 2
                    particle.style.height = '8px'; // הוגדל פי 2
                    particle.style.borderRadius = '50%';
                    particle.style.backgroundColor = `rgba(${color}, 0.8)`;
                    particle.style.boxShadow = `0 0 12px rgba(${color}, 0.5)`; // הוגדל פי 2
                    particle.style.zIndex = '92';
                    
                    // מיקום במרכז הפיצוץ
                    particle.style.top = `${explosionY}px`;
                    particle.style.left = `${explosionX}px`;
                    
                    gameContainer.appendChild(particle);
                    
                    // אנימציה ספציפית לחלקיק זה
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 100 + Math.random() * 300; // הוגדל פי 2
                    const duration = 0.8 + Math.random() * 0.6;
                    
                    const particleKeyframes = `
                        @keyframes firework-particle-${Date.now()}-${i} {
                            0% { 
                                opacity: 1;
                                transform: translate(-50%, -50%) scale(1.5); 
                            }
                            100% { 
                                opacity: 0;
                                transform: translate(
                                    calc(-50% + ${Math.cos(angle) * distance}px), 
                                    calc(-50% + ${Math.sin(angle) * distance}px)
                                ) scale(0.5); 
                            }
                        }
                    `;
                    
                    const particleStyle = document.createElement('style');
                    particleStyle.textContent = particleKeyframes;
                    document.head.appendChild(particleStyle);
                    
                    // הפעלת אנימציה
                    particle.style.animation = `firework-particle-${Date.now()}-${i} ${duration}s ease-out forwards`;
                    
                    // הסרת חלקיק אחרי אנימציה
                    setTimeout(() => {
                        if (particle.parentNode) {
                            particle.parentNode.removeChild(particle);
                        }
                        if (particleStyle.parentNode) {
                            particleStyle.parentNode.removeChild(particleStyle);
                        }
                    }, duration * 1000 + 100);
                }
            } catch (error) {
                console.error('Error in createFirework:', error);
            }
        },
        // יצירת גשם זהב לאפקט ניצחון
        createGoldenRain: function() {
            try {
                const gameContainer = document.getElementById('game-container');
                if (!gameContainer) {
                    console.error('Game container element not found');
                    return;
                }
                
                const coin = document.createElement('div');
                coin.className = 'golden-rain';
                
                // עיצוב מטבע
                coin.style.position = 'absolute';
                coin.style.fontSize = `${30 + Math.random() * 20}px`; // הוגדל פי 2
                coin.style.opacity = '0.9';
                coin.style.zIndex = '91';
                coin.style.color = '#FFD700';
                coin.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.7)'; // הוגדל פי 2
                coin.textContent = '₪';
                
                // מיקום למעלה עם מיקום אופקי אקראי
                const startX = Math.random() * window.innerWidth;
                coin.style.top = `-40px`; // הוגדל פי 2
                coin.style.left = `${startX}px`;
                
                gameContainer.appendChild(coin);
                
                // אנימציה
                const fallDuration = 3 + Math.random() * 2;
                const swayAmount = 100 + Math.random() * 100; // הוגדל פי 2
                const direction = Math.random() > 0.5 ? 1 : -1;
                const rotationAmount = Math.random() * 360;
                
                const keyframes = `
                    @keyframes golden-rain-${Date.now()} {
                        0% {
                            transform: translateY(0) rotate(0deg);
                            opacity: 0;
                        }
                        10% {
                            opacity: 0.9;
                        }
                        100% {
                            transform: translateY(${window.innerHeight + 100}px) 
                                       translateX(${swayAmount * direction}px) 
                                       rotate(${rotationAmount}deg);
                            opacity: 0.7;
                        }
                    }
                `;
                
                const style = document.createElement('style');
                style.textContent = keyframes;
                document.head.appendChild(style);
                
                // הפעלת אנימציה
                coin.style.animation = `golden-rain-${Date.now()} ${fallDuration}s ease-in forwards`;
                
                // הסרת אלמנטים אחרי אנימציה
                setTimeout(() => {
                    if (coin.parentNode) {
                        coin.parentNode.removeChild(coin);
                    }
                    if (style.parentNode) {
                        style.parentNode.removeChild(style);
                    }
                }, fallDuration * 1000 + 100);
            } catch (error) {
                console.error('Error in createGoldenRain:', error);
            }
        },
        
        // הוספת אנימציות חסרות ל-CSS
        addMissingAnimations: function() {
            try {
                const styleElement = document.createElement('style');
                styleElement.id = 'visual-effects-missing-animations';
                
                // הוספת האנימציות החסרות ב-CSS
                styleElement.textContent = `
                    @keyframes obstacle-dialog-exit {
                        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    }
                    
                    @keyframes powerup-dialog-exit {
                        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                        to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    }
                    
                    @keyframes status-effect-appear {
                        from { opacity: 0; transform: translate(-50%, 340px); }
                        to { opacity: 1; transform: translate(-50%, 300px); }
                    }
                    
                    @keyframes pulse {
                        from { transform: translate(-50%, -50%) scale(1); }
                        to { transform: translate(-50%, -50%) scale(1.05); }
                    }
                    
                    @keyframes fade-in {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    @keyframes scale-in {
                        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    }
                    
                    @keyframes dialog-appear {
                        from { opacity: 0; transform: translate(-50%, -40%); }
                        to { opacity: 1; transform: translate(-50%, -50%); }
                    }
                `;
                
                document.head.appendChild(styleElement);
                console.log('Missing animations added to CSS');
            } catch (error) {
                console.error('Error adding missing animations:', error);
            }
        }
    };
    
    // הפעלת פונקציית הוספת האנימציות החסרות בטעינה
    document.addEventListener('DOMContentLoaded', () => {
        try {
            effects.addMissingAnimations();
        } catch (error) {
            console.error('Failed to add missing animations:', error);
        }
    });
    
    // חזרה על האובייקט לייצוא
    return effects;
})();

// בדיקה שהאובייקט נוצר בהצלחה והודעה על טעינה מוצלחת
console.log('Visual effects module loaded successfully');

// עדכון על סיום טעינת המודול
if (window.gameModules && typeof window.gameModules.loaded === 'object') {
    window.gameModules.loaded['visual-effects.js'] = true;
}
