/**
 * legal-support.js
 * Handles the generation of the application footer, legal modals, and support links.
 * tailored for ProfitPerPlate (Cloud-Based/Log-In Only Architecture).
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
            <p>You have the right to request a copy of your data or request deletion of your account and associated cloud data by contacting support.</p>
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
            </ul>
            </p>

            <h4>3. Managing Cookies</h4>
            <p>Since this is a web application, blocking Essential cookies may prevent you from logging in or saving data to the cloud. You can manage non-essential preferences in the Cookie Settings.</p>
        `
    }
};

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
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
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
        if (modal) modal.classList.remove('hidden');
    },

    closeCookieSettings: function() {
        const modal = document.getElementById('cookieSettingsModal');
        if (modal) modal.classList.add('hidden');
    },

    saveCookiePreferences: function() {
        const analytics = document.getElementById('analyticsConsent').checked;
        localStorage.setItem('ppp_cookie_consent', JSON.stringify({
            analytics: analytics,
            timestamp: new Date().toISOString()
        }));
        this.closeCookieSettings();
        if(typeof window.showNotification === 'function') {
            window.showNotification("Cookie preferences saved", "success");
        }
    },

    loadCookiePreferences: function() {
        const prefs = JSON.parse(localStorage.getItem('ppp_cookie_consent') || '{"analytics": false}');
        const checkbox = document.getElementById('analyticsConsent');
        if (checkbox) checkbox.checked = prefs.analytics;
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure main layout is rendered
    setTimeout(() => {
        window.LegalSystem.init();
    }, 500);
});