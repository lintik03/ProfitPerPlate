// AdSense initialization and management for ProfitPerPlate

// Initialize ads after page load
function initializeAds() {
    console.log('Initializing AdSense ads...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleAdsInitialization);
    } else {
        // DOM already loaded
        setTimeout(handleAdsInitialization, 500);
    }
}

function handleAdsInitialization() {
    const adContainer = document.querySelector('.adsbygoogle');
    const fallback = document.querySelector('.ad-fallback');
    
    if (!adContainer) {
        console.warn('AdSense container not found');
        if (fallback) {
            fallback.classList.remove('hidden');
        }
        return;
    }
    
    // Check if AdSense script loaded
    if (typeof adsbygoogle === 'undefined') {
        console.warn('AdSense script not loaded');
        if (fallback) {
            fallback.classList.remove('hidden');
        }
        return;
    }
    
    // Monitor ad loading
    monitorAdLoading(adContainer, fallback);
    
    // Refresh ads on tab switch for better visibility
    setupAdRefreshOnTabSwitch();
}

function monitorAdLoading(adContainer, fallback) {
    let adLoaded = false;
    
    // Check initial state
    if (adContainer.offsetHeight > 0) {
        adLoaded = true;
        console.log('Ad initially loaded');
        if (fallback) {
            fallback.classList.add('hidden');
        }
    }
    
    // Monitor for changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                if (adContainer.offsetHeight > 0 && !adLoaded) {
                    adLoaded = true;
                    console.log('Ad loaded successfully');
                    if (fallback) {
                        fallback.classList.add('hidden');
                    }
                }
            }
        });
    });
    
    observer.observe(adContainer, { attributes: true });
    
    // Fallback timeout
    setTimeout(function() {
        if (!adLoaded) {
            console.log('Ad loading timeout - showing fallback');
            if (fallback) {
                fallback.classList.remove('hidden');
            }
        }
    }, 3000);
}

function setupAdRefreshOnTabSwitch() {
    // Refresh ads when user switches back to tab
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && typeof adsbygoogle !== 'undefined') {
            // Refresh ads after 1 second when tab becomes visible
            setTimeout(function() {
                try {
                    (adsbygoogle = window.adsbygoogle || []).push({});
                    console.log('Refreshed ads on tab switch');
                } catch (e) {
                    console.warn('Error refreshing ads:', e);
                }
            }, 1000);
        }
    });
    
    // Refresh ads when switching between app tabs
    const tabButtons = document.querySelectorAll('.tab-btn, .sidebar-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            setTimeout(refreshAds, 500);
        });
    });
}

function refreshAds() {
    if (typeof adsbygoogle !== 'undefined') {
        try {
            (adsbygoogle = window.adsbygoogle || []).push({});
            console.log('Refreshed ads on tab change');
        } catch (e) {
            console.warn('Error refreshing ads:', e);
        }
    }
}

// Ad blocker detection
function detectAdBlocker() {
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbygoogle';
    testAd.style.cssText = 'position:absolute;top:-100px;left:-100px;height:1px;width:1px;overflow:hidden;';
    document.body.appendChild(testAd);
    
    setTimeout(function() {
        const adBlocked = testAd.offsetHeight === 0;
        document.body.removeChild(testAd);
        
        if (adBlocked) {
            console.log('Ad blocker detected');
            const fallback = document.querySelector('.ad-fallback');
            if (fallback) {
                fallback.classList.remove('hidden');
            }
        }
    }, 100);
}

// Performance monitoring
function setupPerformanceMonitoring() {
    // Only run if Performance API is available
    if ('performance' in window) {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
            const navEntry = navEntries[0];
            const loadTime = navEntry.loadEventEnd - navEntry.startTime;
            
            if (loadTime > 3000) {
                console.warn('Page load time > 3s: ', loadTime);
                // Consider lazy loading ads on slow connections
            }
        }
    }
}

// Initialize everything when window loads
window.addEventListener('load', function() {
    // Small delay to ensure other scripts are loaded
    setTimeout(function() {
        initializeAds();
        detectAdBlocker();
        setupPerformanceMonitoring();
    }, 1000);
});

// Export functions for potential manual control
window.ProfitPerPlateAds = {
    refreshAds: refreshAds,
    initializeAds: initializeAds
};

// Handle errors gracefully
window.addEventListener('error', function(e) {
    if (e.message.includes('adsbygoogle')) {
        console.warn('AdSense error caught:', e.message);
        const fallback = document.querySelector('.ad-fallback');
        if (fallback) {
            fallback.classList.remove('hidden');
        }
    }
});