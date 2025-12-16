/**
 * legal-support.js
 * Handles the generation of the application footer, legal modals, and support links.
 * tailored for ProfitPerPlate (Cloud-Based/Log-In Only Architecture).
 * Now includes simplified GDPR/CCPA compliant cookie consent management.
 */

// =============================================================================
// LEGAL CONTENT DATA (Comprehensive)
// =============================================================================

const LEGAL_DOCS = {
    terms: {
        title: "Terms of Service",
        content: `
            <h4>1. Acceptance of Terms</h4>
            <p>By creating an account and accessing ProfitPerPlate ("the Service"), you agree to be bound by these Terms of Service. This Service is a cloud-based application requiring an active internet connection and user account for full functionality.</p>
            
            <h4>2. Service Description</h4>
            <p>ProfitPerPlate is a restaurant costing and profit calculation tool. While the Service may utilize local storage for performance caching, it is fundamentally a cloud-based service. <strong>You acknowledge that an active account and login are required to save, sync, and persistently access your data across devices.</strong> Data stored locally without being synced to the cloud via a logged-in session may be lost if browser cache is cleared.</p>

            <h4>3. User Accounts</h4>
            <p>You are responsible for maintaining the confidentiality of your login credentials. You are responsible for all activities that occur under your account.</p>

            <h4>4. Data Accuracy</h4>
            <p>The Service performs calculations based on data input by you (the User). You are solely responsible for verifying the accuracy of input data (ingredients, costs, quantities). ProfitPerPlate does not guarantee the accuracy of market prices or yields provided in examples.</p>

            <h4>5. Intellectual Property</h4>
            <p>The software, design, and calculation methodologies are the exclusive property of ProfitPerPlate. Your user-generated data (recipes, ingredient lists) remains your property.</p>

            <h4>6. Termination</h4>
            <p>We reserve the right to suspend or terminate accounts that violate these terms or engage in abuse of the Service.</p>
        `
    },
    disclaimer: {
        title: "Legal Disclaimer",
        content: `
            <h4>1. No Financial or Business Advice</h4>
            <p>ProfitPerPlate is a calculation tool designed to assist with food costing. <strong>The information and calculations provided by this Service do NOT constitute professional financial, accounting, or business advice.</strong></p>

            <h4>2. Limitation of Liability</h4>
            <p>In no event shall ProfitPerPlate, its developers, or affiliates be liable for any direct, indirect, incidental, or consequential damages arising from your use of the Service. This includes, but is not limited to, loss of profits, business interruption, or pricing errors resulting from reliance on the Service's calculations.</p>

            <h4>3. "As-Is" Service</h4>
            <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We disclaim all warranties, express or implied, regarding the accuracy, reliability, or availability of the Service.</p>

            <h4>4. Cloud Dependency</h4>
            <p>You acknowledge that as a cloud-based service, access may be subject to interruptions due to internet connectivity issues or server maintenance. We are not liable for data unavailability caused by connectivity failure.</p>
        `
    },
    privacy: {
        title: "Privacy Policy",
        content: `
            <h4>1. Data Collection</h4>
            <p>We collect information necessary to provide the cloud-based Service, including:
            <ul>
                <li><strong>Account Info:</strong> Email address (for authentication).</li>
                <li><strong>User Content:</strong> Recipes, ingredients, and labor data you save to the cloud database.</li>
                <li><strong>Usage Data:</strong> Metrics on feature usage to improve the Service.</li>
            </ul>
            </p>

            <h4>2. Data Storage & Security</h4>
            <p>Your data is stored securely in the cloud using industry-standard encryption (via Supabase). While we implement robust security measures, no internet transmission is 100% secure.</p>

            <h4>3. Local Storage</h4>
            <p>We use your browser's Local Storage to cache data for performance and offline resilience. However, the master copy of your data resides in our cloud servers associated with your User ID.</p>

            <h4>4. Third-Party Services</h4>
            <p>We may use third-party providers for specific functions (e.g., Payment Processing via Paddle, Authentication via Supabase). These parties act as data processors and have their own privacy policies.</p>

            <h4>5. Your Rights</h4>
            <p>You have the right to request a copy of your data or request deletion of your account and associated cloud data by contacting support at profitperplate@gmail.com.</p>
        `
    },
    cookies: {
        title: "Cookie Policy",
        content: `
            <h4>1. What Are Cookies?</h4>
            <p>Cookies are small text files stored on your device to help the Service function properly.</p>

            <h4>2. How We Use Cookies</h4>
            <p>We use cookies and similar local storage technologies for:
            <ul>
                <li><strong>Essential Functions:</strong> Maintaining your logged-in state (Authentication tokens) and ensuring secure access.</li>
                <li><strong>Preferences:</strong> Storing your UI preferences (e.g., Dark Mode, Currency choice).</li>
                <li><strong>Performance:</strong> Caching recipe data locally to speed up the application.</li>
                <li><strong>Analytics:</strong> Tracking anonymous usage statistics to improve the Service (only with your consent).</li>
            </ul>
            </p>

            <h4>3. Managing Cookies</h4>
            <p>You can manage your cookie preferences at any time via the Cookie Settings. Blocking Essential cookies may prevent you from logging in or saving data to the cloud.</p>
        `
    }
};

// =============================================================================
// COOKIE CONSENT MANAGEMENT (GDPR/CCPA Compliant)
// =============================================================================

const COOKIE_CATEGORIES = {
    essential: {
        id: 'essential',
        name: 'Essential Cookies',
        description: 'Required for login, cloud sync, security, and core functionality.',
        required: true,
        cookies: ['supabase-auth-token', 'ppp_session', 'currency_pref', 'theme_pref']
    },
    analytics: {
        id: 'analytics',
        name: 'Analytics Cookies',
        description: 'Help us improve by tracking anonymous usage statistics.',
        required: false,
        cookies: ['_ga', '_gid', '_gat', '_ga_*'] // Google Analytics patterns
    }
};

// Cookie consent state
let cookieConsentState = {
    essential: true,
    analytics: false,
    timestamp: null,
    version: '1.0'
};

// Analytics initialization status
let analyticsInitialized = false;

// =============================================================================
// ANALYTICS MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Load Google Analytics only if user has consented
 */
function loadAnalyticsIfConsented() {
    const prefs = getCurrentCookiePreferences();
    
    if (prefs.analytics && !analyticsInitialized) {
        console.log('Loading analytics (user consented)');
        
        // Google Analytics 4 (GA4) Implementation
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX'; // Replace with your GA4 ID
        
        script.onload = () => {
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX', { 
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false
            });
            
            // Track pageview
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_path: window.location.pathname
            });
            
            analyticsInitialized = true;
            console.log('Analytics initialized successfully');
        };
        
        document.head.appendChild(script);
        
        // Also add the gtag function definition
        window.gtag = window.gtag || function() {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push(arguments);
        };
        
    } else if (!prefs.analytics && analyticsInitialized) {
        console.log('Analytics disabled (user not consented)');
        // Analytics would be disabled by not loading the script
    }
}

/**
 * Unload/disable analytics tracking
 */
function unloadAnalytics() {
    if (analyticsInitialized) {
        console.log('Unloading analytics');
        
        // Clear Google Analytics cookies
        const gaCookies = ['_ga', '_gid', '_gat', '_ga_*'];
        gaCookies.forEach(cookiePattern => {
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
                const [name] = cookie.trim().split('=');
                if (name.match(new RegExp(cookiePattern.replace('*', '.*')))) {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
                }
            });
        });
        
        // Remove gtag from window
        delete window.gtag;
        delete window.dataLayer;
        
        // Remove GA script if present
        const gaScript = document.querySelector('script[src*="googletagmanager.com"]');
        if (gaScript) {
            gaScript.remove();
        }
        
        analyticsInitialized = false;
    }
}

/**
 * Apply cookie preferences (enable/disable tracking)
 */
function applyCookiePreferences() {
    const prefs = getCurrentCookiePreferences();
    
    // Always allow essential cookies (they're required for functionality)
    console.log('Applying cookie preferences:', prefs);
    
    // Handle analytics based on consent
    if (prefs.analytics) {
        loadAnalyticsIfConsented();
    } else {
        unloadAnalytics();
    }
    
    // Set a cookie to remember the consent (required by GDPR)
    document.cookie = `ppp_cookie_consent=${encodeURIComponent(JSON.stringify(prefs))}; max-age=31536000; path=/; SameSite=Lax`;
    
    // Dispatch event for other components to react
    const event = new CustomEvent('cookiePreferencesChanged', { detail: prefs });
    document.dispatchEvent(event);
}

/**
 * Check and enforce cookie consent
 */
function checkCookieConsent() {
    const prefs = getCurrentCookiePreferences();
    
    // Block non-essential cookies if not consented
    if (!prefs.analytics) {
        // Override cookie setting functions
        const originalSetCookie = document.__defineSetter__('cookie', function(cookie) {
            const [name] = cookie.split('=');
            const isEssential = COOKIE_CATEGORIES.essential.cookies.some(
                essentialCookie => name.includes(essentialCookie.replace('*', ''))
            );
            
            if (!isEssential && !COOKIE_CATEGORIES.analytics.cookies.some(
                analyticsCookie => name.match(new RegExp(analyticsCookie.replace('*', '.*')))
            )) {
                console.warn(`Blocked non-essential cookie: ${name}`);
                return;
            }
            
            // Call original setter
            Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').set.call(document, cookie);
        });
    }
}

/**
 * Get current cookie preferences
 */
function getCurrentCookiePreferences() {
    // Check URL param for consent (for CCPA "Do Not Sell" links)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('ccpa_opt_out')) {
        return {
            essential: true,
            analytics: false,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
    }
    
    // Check localStorage first
    const saved = localStorage.getItem('ppp_cookie_consent');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Error parsing saved cookie preferences:', e);
        }
    }
    
    // Return defaults
    return cookieConsentState;
}

/**
 * Show initial cookie consent banner if needed
 */
function showCookieConsentBanner() {
    const prefs = getCurrentCookiePreferences();
    
    // Don't show if already decided (has timestamp)
    if (prefs.timestamp) return;
    
    // Don't show if user came from CCPA opt-out link
    if (new URLSearchParams(window.location.search).has('ccpa_opt_out')) return;
    
    // Create banner
    const bannerHTML = `
        <div id="cookieConsentBanner" class="cookie-consent-banner">
            <div class="banner-content">
                <div class="banner-text">
                    <h4>Cookie Consent</h4>
                    <p>We use cookies to enhance your experience. Essential cookies are required for the site to function. Analytics cookies help us improve our service. By clicking "Accept All", you consent to all cookies. You can manage preferences at any time.</p>
                </div>
                <div class="banner-actions">
                    <button class="btn-secondary" onclick="window.LegalSystem.rejectAllCookies()">Reject Non-Essential</button>
                    <button class="btn-secondary" onclick="window.LegalSystem.openCookieSettings()">Customize</button>
                    <button class="btn-primary" onclick="window.LegalSystem.acceptAllCookies()">Accept All</button>
                </div>
            </div>
        </div>
    `;
    
    // Add CSS for banner
    if (!document.querySelector('#cookieConsentStyles')) {
        const style = document.createElement('style');
        style.id = 'cookieConsentStyles';
        style.textContent = `
            .cookie-consent-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--bg-primary);
                border-top: 1px solid var(--border);
                padding: var(--space-md);
                z-index: 999999;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            }
            .banner-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                flex-wrap: wrap;
                gap: var(--space-md);
                align-items: center;
                justify-content: space-between;
            }
            .banner-text {
                flex: 1;
                min-width: 300px;
            }
            .banner-text h4 {
                margin: 0 0 var(--space-xs) 0;
                color: var(--text-primary);
            }
            .banner-text p {
                margin: 0;
                font-size: 14px;
                color: var(--text-secondary);
                line-height: 1.4;
            }
            .banner-actions {
                display: flex;
                gap: var(--space-sm);
                flex-wrap: wrap;
            }
            @media (max-width: 768px) {
                .cookie-consent-banner {
                    padding: var(--space-sm);
                }
                .banner-content {
                    flex-direction: column;
                    align-items: stretch;
                }
                .banner-actions {
                    justify-content: center;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.insertAdjacentHTML('beforeend', bannerHTML);
}

/**
 * Hide cookie consent banner
 */
function hideCookieConsentBanner() {
    const banner = document.getElementById('cookieConsentBanner');
    if (banner) {
        banner.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(100%)';
        setTimeout(() => banner.remove(), 300);
    }
}

// =============================================================================
// FOOTER INJECTION LOGIC
// =============================================================================

function injectFooter() {
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;

    // Check if footer already exists to prevent duplicates
    if (document.getElementById('app-footer')) return;

    const footerHTML = `
        <footer id="app-footer" class="app-footer">
            <div class="footer-content">
                <div class="footer-links">
                    <button type="button" onclick="window.LegalSystem.openModal('terms')">Terms of Service</button>
                    <span class="separator">•</span>
                    <button type="button" onclick="window.LegalSystem.openModal('privacy')">Privacy Policy</button>
                    <span class="separator">•</span>
                    <button type="button" onclick="window.LegalSystem.openModal('disclaimer')">Legal Disclaimer</button>
                    <span class="separator">•</span>
                    <button type="button" onclick="window.LegalSystem.openModal('cookies')">Cookie Policy</button>
                    <span class="separator">•</span>
                    <button type="button" onclick="window.LegalSystem.openCookieSettings()">Cookie Settings</button>
                </div>
                
                <div class="footer-support">
                    <span>Need help?</span>
                    <a href="mailto:profitperplate@gmail.com" class="support-email">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        profitperplate@gmail.com
                    </a>
                </div>

                <div class="footer-copyright">
                    &copy; ${new Date().getFullYear()} ProfitPerPlate. All rights reserved.
                </div>
            </div>
        </footer>
    `;

    // Append to content area (below ad space)
    contentArea.insertAdjacentHTML('beforeend', footerHTML);
}

// =============================================================================
// MODAL MANAGEMENT
// =============================================================================

function createLegalModal() {
    // Create the modal container if it doesn't exist
    if (document.getElementById('legalModal')) return;

    const modalHTML = `
        <div id="legalModal" class="modal hidden">
            <div class="modal-content legal-modal-content">
                <div class="modal-header">
                    <h3 id="legalModalTitle">Legal Information</h3>
                    <button class="close-btn" onclick="window.LegalSystem.closeModal()">×</button>
                </div>
                <div id="legalModalBody" class="legal-text-body">
                    </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="window.LegalSystem.closeModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function createCookieSettingsModal() {
    if (document.getElementById('cookieSettingsModal')) return;

    const modalHTML = `
        <div id="cookieSettingsModal" class="modal hidden">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Cookie Settings</h3>
                    <button class="close-btn" onclick="window.LegalSystem.closeCookieSettings()">×</button>
                </div>
                <div class="cookie-settings-body">
                    <p class="cookie-intro">We use cookies to ensure the basic functionality of ProfitPerPlate (like logging in and saving your recipes). You can choose to enable optional cookies below.</p>
                    
                    <div class="cookie-option">
                        <div class="cookie-info">
                            <strong>Essential Cookies</strong>
                            <small>Required for login, cloud sync, and security.</small>
                        </div>
                        <div class="toggle-wrapper">
                            <input type="checkbox" checked disabled>
                            <span class="status-text">Always On</span>
                        </div>
                    </div>

                    <div class="cookie-option">
                        <div class="cookie-info">
                            <strong>Analytics Cookies</strong>
                            <small>Help us improve by tracking anonymous usage stats.</small>
                        </div>
                        <div class="toggle-wrapper">
                            <input type="checkbox" id="analyticsConsent">
                            <span class="status-text" id="analyticsStatus">Off</span>
                        </div>
                    </div>
                    
                    <div class="cookie-details" style="margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border);">
                        <h4>What each category does:</h4>
                        <ul style="margin: var(--space-sm) 0; padding-left: var(--space-lg);">
                            <li><strong>Essential:</strong> Authentication, session management, user preferences</li>
                            <li><strong>Analytics:</strong> Page views, feature usage, error tracking (anonymous)</li>
                        </ul>
                        <p style="font-size: 12px; color: var(--text-secondary); margin-top: var(--space-sm);">
                            Your current preferences are stored and will be applied immediately.
                        </p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="window.LegalSystem.rejectAllCookies()">Reject All Non-Essential</button>
                    <button class="btn-primary" onclick="window.LegalSystem.saveCookiePreferences()">Save Preferences</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// =============================================================================
// PUBLIC API
// =============================================================================

window.LegalSystem = {
    init: function() {
        injectFooter();
        createLegalModal();
        createCookieSettingsModal();
        this.loadCookiePreferences();
        applyCookiePreferences();
        checkCookieConsent();
        
        // Show cookie banner if no consent recorded
        setTimeout(() => {
            const prefs = getCurrentCookiePreferences();
            if (!prefs.timestamp) {
                showCookieConsentBanner();
            }
        }, 1000);
    },

    openModal: function(docKey) {
        const doc = LEGAL_DOCS[docKey];
        if (!doc) return;

        const titleEl = document.getElementById('legalModalTitle');
        const bodyEl = document.getElementById('legalModalBody');
        const modal = document.getElementById('legalModal');

        if (titleEl) titleEl.textContent = doc.title;
        if (bodyEl) bodyEl.innerHTML = doc.content;
        if (modal) {
            modal.classList.remove('hidden');
            // Reset scroll to top
            if(bodyEl) bodyEl.scrollTop = 0;
        }
    },

    closeModal: function() {
        const modal = document.getElementById('legalModal');
        if (modal) modal.classList.add('hidden');
    },

    openCookieSettings: function() {
        const modal = document.getElementById('cookieSettingsModal');
        if (modal) {
            modal.classList.remove('hidden');
            hideCookieConsentBanner();
        }
    },

    closeCookieSettings: function() {
        const modal = document.getElementById('cookieSettingsModal');
        if (modal) modal.classList.add('hidden');
    },

    saveCookiePreferences: function() {
        const analytics = document.getElementById('analyticsConsent').checked;
        const prefs = {
            essential: true,
            analytics: analytics,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        localStorage.setItem('ppp_cookie_consent', JSON.stringify(prefs));
        cookieConsentState = prefs;
        
        applyCookiePreferences();
        this.updateCookieStatusDisplay();
        this.closeCookieSettings();
        hideCookieConsentBanner();
        
        if(typeof window.showNotification === 'function') {
            window.showNotification("Cookie preferences saved", "success");
        }
    },

    loadCookiePreferences: function() {
        const prefs = getCurrentCookiePreferences();
        cookieConsentState = prefs;
        
        const checkbox = document.getElementById('analyticsConsent');
        if (checkbox) {
            checkbox.checked = prefs.analytics;
            this.updateCookieStatusDisplay();
        }
    },
    
    updateCookieStatusDisplay: function() {
        const prefs = getCurrentCookiePreferences();
        const statusEl = document.getElementById('analyticsStatus');
        if (statusEl) {
            statusEl.textContent = prefs.analytics ? 'On' : 'Off';
        }
    },
    
    acceptAllCookies: function() {
        const prefs = {
            essential: true,
            analytics: true,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        localStorage.setItem('ppp_cookie_consent', JSON.stringify(prefs));
        cookieConsentState = prefs;
        
        applyCookiePreferences();
        this.updateCookieStatusDisplay();
        hideCookieConsentBanner();
        
        if(typeof window.showNotification === 'function') {
            window.showNotification("All cookies accepted", "success");
        }
    },
    
    rejectAllCookies: function() {
        const prefs = {
            essential: true,
            analytics: false,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        localStorage.setItem('ppp_cookie_consent', JSON.stringify(prefs));
        cookieConsentState = prefs;
        
        applyCookiePreferences();
        this.updateCookieStatusDisplay();
        hideCookieConsentBanner();
        this.closeCookieSettings(); // FIXED: Close modal after rejecting
        
        if(typeof window.showNotification === 'function') {
            window.showNotification("Non-essential cookies rejected", "success");
        }
    },
    
    // Public method to check if analytics are allowed
    isAnalyticsAllowed: function() {
        return getCurrentCookiePreferences().analytics;
    },
    
    // Public method to get current preferences
    getCookiePreferences: function() {
        return getCurrentCookiePreferences();
    },
    
    // Public method to apply preferences programmatically
    applyCookiePreferences: function() {
        applyCookiePreferences();
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure main layout is rendered
    setTimeout(() => {
        window.LegalSystem.init();
    }, 500);
});

// Listen for privacy-related events
document.addEventListener('cookiePreferencesChanged', function(event) {
    console.log('Cookie preferences changed:', event.detail);
    // You can add additional reactions here if needed
});