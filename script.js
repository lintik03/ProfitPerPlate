// Global State - Now using cloud storage
let userData = {
    rawMaterials: [],
    directLabor: [],
    recipes: [],
    currency: "₱",
    currentRecipeState: null
};

let editingItem = {
    type: null, // 'rawMaterial', 'directLabor', 'mainRecipe', 'subRecipe'
    id: null,
    data: null
};

// NEW: Track loaded recipe for summary
let loadedRecipeForSummary = null;

// Unit Conversion Factors (to base units)
const UNIT_CONVERSIONS = {
    // Weight (base unit: grams)
    kg: 1000,
    g: 1,
    mg: 0.001,
    lbs: 453.592,
    oz: 28.3495,

    // Volume (base unit: milliliters)
    L: 1000,
    ml: 1,
    cup: 236.588,
    tbsp: 14.7868,
    tsp: 4.92892,

    // Count (base unit: pieces)
    dozen: 12,
    pc: 1,

    // Time (base unit: minutes)
    hours: 60,
    minutes: 1
};

// Unit options by category
const categoryUnits = {
    weight: ["kg", "g", "mg", "lbs", "oz"],
    volume: ["L", "ml", "cup", "tbsp", "tsp"],
    count: ["dozen", "pc"],
    time: ["hours", "minutes"]
};

// Base units for each category
const baseUnits = {
    weight: "g",
    volume: "ml",
    count: "pc",
    time: "minutes"
};

// Field definitions for help modal with examples
const fieldDefinitions = {
    // ... field definitions remain the same ...
};

// DOM Elements
const recipeBody = document.getElementById("recipeBody");
const directLaborRecipeBody = document.getElementById("directLaborRecipeBody");
const rawMaterialsTotalEl = document.getElementById("rawMaterialsTotal");
const directLaborTotalEl = document.getElementById("directLaborTotal");
const grandTotalEl = document.getElementById("grandTotal");
const currencySelect = document.getElementById("currencySelect");
const recipeNameInput = document.getElementById("recipeName");
const resetBtn = document.getElementById("resetRecipe");
const saveMainRecipeBtn = document.getElementById("saveMainRecipeBtn");
const saveSubRecipeBtn = document.getElementById("saveSubRecipeBtn");

const summaryRawMaterialsCost = document.getElementById("summaryRawMaterialsCost");
const summaryDirectLaborCost = document.getElementById("summaryDirectLaborCost");
const summaryTotalCost = document.getElementById("summaryTotalCost");
const summaryCostServing = document.getElementById("summaryCostServing");
const summarySellingPrice = document.getElementById("summarySellingPrice");
const summaryFoodCost = document.getElementById("summaryFoodCost");
const summaryLaborCostPercent = document.getElementById("summaryLaborCostPercent");
const summaryTotalCostPercent = document.getElementById("summaryTotalCostPercent");
const summaryGrossProfit = document.getElementById("summaryGrossProfit");
const markupInput = document.getElementById("markup");
const taxInput = document.getElementById("tax");
const vatInput = document.getElementById("vat");
// MOVED: servingsInput is now in Recipe Calculator tab
const servingsInput = document.getElementById("servings");

// NEW: Batch scaling input
const batchScaleInput = document.getElementById("batchScale");

// NEW: Servings display element
const summaryServingsDisplay = document.getElementById("summaryServingsDisplay");

const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const helpModalTitle = document.getElementById("helpModalTitle");
const helpModalContent = document.getElementById("helpModalContent");
const closeHelpBtn = document.getElementById("closeHelp");
const printBtn = document.getElementById("printBtn");
const printPreviewModal = document.getElementById("printPreviewModal");
const printPreviewContent = document.getElementById("printPreviewContent");

// Unified Item Select Elements
const unifiedItemSelect = document.getElementById("unifiedItemSelect");
const addIngredientQty = document.getElementById("addIngredientQty");
const addIngredientYield = document.getElementById("addIngredientYield");
const addIngredientUnit = document.getElementById("addIngredientUnit");

// Direct Labor Select Elements
const directLaborSelect = document.getElementById("directLaborSelect");
const timeRequirement = document.getElementById("timeRequirement");
const timeRequirementUnit = document.getElementById("timeRequirementUnit");

// Sub-Recipe Save Modal Elements
const subRecipeSaveModal = document.getElementById("subRecipeSaveModal");
const subRecipeNameDisplay = document.getElementById("subRecipeNameDisplay");
const subRecipeCategory = document.getElementById("subRecipeCategory");
const subRecipeYieldQuantity = document.getElementById("subRecipeYieldQuantity");
const subRecipeYieldUnit = document.getElementById("subRecipeYieldUnit");
const subRecipeCostPerUnit = document.getElementById("subRecipeCostPerUnit");
const subRecipeCostUnit = document.getElementById("subRecipeCostUnit");
const currentRecipeCostDisplay = document.getElementById("currentRecipeCostDisplay");
const costPerOutputUnit = document.getElementById("costPerOutputUnit");

// Recipe list elements
const mainRecipesList = document.getElementById("mainRecipesList");
const subRecipesList = document.getElementById("subRecipesList");

// Edit prompt modal elements
const editPromptModal = document.getElementById("editPromptModal");
const editPromptTitle = document.getElementById("editPromptTitle");
const editPromptMessage = document.getElementById("editPromptMessage");

// Auth Modal Elements
const authModal = document.getElementById("authModal");
const authModalTitle = document.getElementById("authModalTitle");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authError = document.getElementById("authError");
const authSwitchBtn = document.getElementById("authSwitchBtn");
const authSwitchText = document.getElementById("authSwitchText");

// NEW: Password toggle element
const togglePassword = document.getElementById("togglePassword");

// Auth Button Elements - REMOVED: loginBtn, signupBtn, logoutBtn since user menu is removed
// const loginBtn = document.getElementById("loginBtn");
// const signupBtn = document.getElementById("signupBtn");
// const logoutBtn = document.getElementById("logoutBtn");

// NEW: Cost Breakdown Preview Elements
const rawMaterialsPreviewBody = document.getElementById("rawMaterialsPreviewBody");
const directLaborPreviewBody = document.getElementById("directLaborPreviewBody");
const rawMaterialsCount = document.getElementById("rawMaterialsCount");
const directLaborCount = document.getElementById("directLaborCount");
const rawMaterialsPreviewTotal = document.getElementById("rawMaterialsPreviewTotal");
const directLaborPreviewTotal = document.getElementById("directLaborPreviewTotal");
const rawMaterialsPreviewSubtotal = document.getElementById("rawMaterialsPreviewSubtotal");
const directLaborPreviewSubtotal = document.getElementById("directLaborPreviewSubtotal");

// NEW: Summary Recipe Loader Elements
const summaryRecipeSelect = document.getElementById("summaryRecipeSelect");
const loadedRecipeDisplay = document.getElementById("loadedRecipeDisplay");
const currentRecipeNameDisplay = document.getElementById("currentRecipeNameDisplay");
const loadedRecipeTotalCost = document.getElementById("loadedRecipeTotalCost");
const loadedRecipeServings = document.getElementById("loadedRecipeServings");
const loadedRecipeItemCount = document.getElementById("loadedRecipeItemCount");

// NEW: Batch Profit Analysis Elements
const summaryBatchRevenue = document.getElementById("summaryBatchRevenue");
const summaryBatchProfit = document.getElementById("summaryBatchProfit");
const summaryBatchProfitMargin = document.getElementById("summaryBatchProfitMargin");

// NEW: Mobile Menu Elements
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileUserMenuModal = document.getElementById("mobileUserMenuModal");
const mobileThemeToggle = document.getElementById("mobileThemeToggle");
const mobileCurrencySelect = document.getElementById("mobileCurrencySelect");
const mobileLoginBtn = document.getElementById("mobileLoginBtn");
const mobileSignupBtn = document.getElementById("mobileSignupBtn");
const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
const mobileUserEmail = document.getElementById("mobileUserEmail");
const mobileUserInfo = document.getElementById("mobileUserInfo");
const mobileAuthButtons = document.getElementById("mobileAuthButtons");
const mobileHelpBtn = document.getElementById("mobileHelpBtn");

// NEW: Sidebar Navigation Elements
const sidebarNav = document.querySelector('.sidebar-nav');
const sidebarTabBtns = document.querySelectorAll('.sidebar-tab-btn');

// Currency
let currency = "₱";

// Auth state
let isSignUpMode = false;

// Initialize Application
async function initApp() {
    // Load dark mode preference
    loadTheme();
    
    // Check auth state
    await window.supabaseClient.checkAuthState();
    
    // Add dark mode CSS fixes
    addDarkModeCSSFixes();
    
    setupEventListeners();
    renderAllData();
    recalc();
    populateUnifiedItemSelect();
    populateDirectLaborSelect();
    updateSubRecipeUnitOptions();
    
    // NEW: Populate summary recipe selector
    populateSummaryRecipeSelect();
    
    // Generate complete help content
    helpModalContent.innerHTML = generateCompleteHelpContent();
    
    // NEW: Update cost breakdown preview
    updateCostBreakdownPreview();
    
    // NEW: Initialize sidebar layout based on screen size
    initSidebarLayout();
}

// NEW: Initialize sidebar layout
function initSidebarLayout() {
    const isDesktop = window.innerWidth >= 1025;
    
    if (isDesktop) {
        document.body.classList.add('with-sidebar');
        document.querySelector('.app-layout').classList.add('with-sidebar');
        document.querySelector('.global-notice').classList.add('with-sidebar');
    } else {
        document.body.classList.remove('with-sidebar');
        document.querySelector('.app-layout').classList.remove('with-sidebar');
        document.querySelector('.global-notice').classList.remove('with-sidebar');
    }
}

// Add dark mode CSS fixes
function addDarkModeCSSFixes() {
    const style = document.createElement('style');
    style.textContent = `
        /* Fix dark mode input backgrounds */
        body.dark-mode #recipeName,
        body.dark-mode #authEmail,
        body.dark-mode #authPassword,
        body.dark-mode .recipe-header-controls input,
        body.dark-mode .modal input[type="text"],
        body.dark-mode .modal input[type="email"],
        body.dark-mode .modal input[type="password"],
        body.dark-mode .modal input[type="number"],
        body.dark-mode .modal select {
            background: var(--surface) !important;
            color: var(--text-primary) !important;
            border-color: var(--border) !important;
        }
        
        body.dark-mode #recipeName:focus,
        body.dark-mode #authEmail:focus,
        body.dark-mode #authPassword:focus,
        body.dark-mode .recipe-header-controls input:focus,
        body.dark-mode .modal input[type="text"]:focus,
        body.dark-mode .modal input[type="email"]:focus,
        body.dark-mode .modal input[type="password"]:focus,
        body.dark-mode .modal input[type="number"]:focus,
        body.dark-mode .modal select:focus {
            background: var(--surface) !important;
            color: var(--text-primary) !important;
            border-color: var(--primary) !important;
            box-shadow: 0 0 0 3px rgba(110, 215, 157, 0.15) !important;
        }
        
        /* Ensure readonly inputs also have proper dark mode styling */
        body.dark-mode .readonly-input {
            background: var(--surface-elevated) !important;
            color: var(--text-secondary) !important;
        }
    `;
    document.head.appendChild(style);
}

// Render all data
function renderAllData() {
    renderRawMaterials();
    renderDirectLabor();
    renderRecipesList();
}

// Dark Mode Functions
function loadTheme() {
    const savedTheme = localStorage.getItem("profitPerPlate_theme");
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    document.body.classList.toggle('dark-mode', isDark);
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    if (themeToggle) {
        themeToggle.checked = isDark;
    }
    if (mobileThemeToggle) {
        mobileThemeToggle.checked = isDark;
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem("profitPerPlate_theme", isDark ? 'dark' : 'light');
    
    // Sync both theme toggles
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    if (themeToggle) {
        themeToggle.checked = isDark;
    }
    if (mobileThemeToggle) {
        mobileThemeToggle.checked = isDark;
    }
}

// REMOVED: User Menu Functions (toggleUserMenu, closeUserMenu)

function openMobileUserMenu() {
    mobileUserMenuModal.classList.remove('hidden');
}

function closeMobileUserMenu() {
    mobileUserMenuModal.classList.add('hidden');
}

// NEW: Sidebar Navigation Functions
function setupSidebarNavigation() {
    sidebarTabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Update active states
            sidebarTabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Switch to the tab
            switchTab(tabName);
        });
    });
}

// Auth Functions
function openAuthModal() {
    authModal.classList.remove("hidden");
    updateAuthModal();
}

function closeAuthModal() {
    authModal.classList.add("hidden");
    authForm.reset();
    authError.classList.add("hidden");
    // Reset password visibility
    authPassword.type = 'password';
    if (togglePassword) {
        togglePassword.textContent = '👁️';
    }
}

function updateAuthModal() {
    if (isSignUpMode) {
        authModalTitle.textContent = "Sign Up for ProfitPerPlate";
        authSubmitBtn.textContent = "Sign Up";
        authSwitchText.textContent = "Already have an account? ";
        authSwitchBtn.textContent = "Login";
    } else {
        authModalTitle.textContent = "Login to ProfitPerPlate";
        authSubmitBtn.textContent = "Login";
        authSwitchText.textContent = "Don't have an account? ";
        authSwitchBtn.textContent = "Sign up";
    }
}

// NEW: Toggle password visibility
function togglePasswordVisibility() {
    if (authPassword.type === 'password') {
        authPassword.type = 'text';
        togglePassword.textContent = '🔒';
    } else {
        authPassword.type = 'password';
        togglePassword.textContent = '👁️';
    }
}

async function handleAuth() {
    const email = authEmail.value.trim();
    const password = authPassword.value;
    
    if (!email || !password) {
        showAuthError("Please enter both email and password");
        return;
    }
    
    if (password.length < 6) {
        showAuthError("Password must be at least 6 characters long");
        return;
    }
    
    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = isSignUpMode ? "Signing Up..." : "Logging In...";
    
    let result;
    if (isSignUpMode) {
        result = await window.supabaseClient.signUp(email, password);
    } else {
        result = await window.supabaseClient.signIn(email, password);
    }
    
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = isSignUpMode ? "Sign Up" : "Login";
    
    if (result.success) {
        closeAuthModal();
        if (isSignUpMode) {
            alert("Account created successfully! Please check your email for verification.");
        }
    } else {
        showAuthError(result.error);
    }
}

function showAuthError(message) {
    authError.textContent = message;
    authError.classList.remove("hidden");
}

function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    updateAuthModal();
    authError.classList.add("hidden");
}

async function handleLogout() {
    const result = await window.supabaseClient.signOut();
    if (result.success) {
        alert("Logged out successfully");
    } else {
        alert("Error logging out: " + result.error);
    }
}

// NEW: Update mobile auth display
function updateMobileAuthDisplay(user) {
    if (user) {
        mobileAuthButtons.classList.add('hidden');
        mobileUserInfo.classList.remove('hidden');
        mobileUserEmail.textContent = user.email;
    } else {
        mobileAuthButtons.classList.remove('hidden');
        mobileUserInfo.classList.add('hidden');
    }
}

// Data saving and loading
async function saveUserData() {
    const result = await window.supabaseClient.saveUserData(userData);
    if (!result.success) {
        console.error("Failed to save data:", result.error);
    }
}

async function loadUserData() {
    const data = await window.supabaseClient.loadUserData();
    if (data) {
        userData = data;
        currency = userData.currency || "₱";
        currencySelect.value = currency;
        mobileCurrencySelect.value = currency;
        
        // Update UI
        renderAllData();
        populateUnifiedItemSelect();
        populateDirectLaborSelect();
        populateSummaryRecipeSelect();
        
        // Load current recipe state
        loadCurrentRecipeState();
        
        recalc();
        updateCostBreakdownPreview();
    }
}

// Auto-save current recipe state
function saveCurrentRecipeState() {
    // Get current recipe items
    const rawMaterialItems = [];
    const directLaborItems = [];
    const subRecipeItems = [];
    
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit")?.textContent || "g";
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        const type = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        if (type === 'rawMaterial') {
            rawMaterialItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                yield: yieldPct,
                unitCost: unitCost,
                type: type
            });
        } else if (type === 'sub-recipe') {
            subRecipeItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                yield: yieldPct,
                unitCost: unitCost,
                type: type,
                subRecipeId: subRecipeId
            });
        }
    });
    
    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const laborName = row.children[0].querySelector("input").value;
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const timeUnit = row.children[1].querySelector(".quantity-unit")?.textContent || "hours";
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        
        directLaborItems.push({
            name: laborName,
            quantity: timeRequired,
            unit: timeUnit,
            rate: rate
        });
    });
    
    // Save current recipe state
    userData.currentRecipeState = {
        recipeName: recipeNameInput.value || "",
        rawMaterialItems: rawMaterialItems,
        directLaborItems: directLaborItems,
        subRecipeItems: subRecipeItems,
        markup: parseFloat(markupInput.value) || 40,
        tax: parseFloat(taxInput.value) || 0,
        vat: parseFloat(vatInput.value) || 0,
        servings: parseFloat(servingsInput.value) || 1
    };
    
    saveUserData();
}

// Load current recipe state
function loadCurrentRecipeState() {
    if (!userData.currentRecipeState) return;
    
    const state = userData.currentRecipeState;
    
    // Restore recipe name and summary inputs
    recipeNameInput.value = state.recipeName || "";
    markupInput.value = state.markup || 40;
    taxInput.value = state.tax || 0;
    vatInput.value = state.vat || 0;
    servingsInput.value = state.servings || 1;
    
    // Clear current recipe tables
    recipeBody.innerHTML = "";
    directLaborRecipeBody.innerHTML = "";
    
    // Restore raw material items
    if (state.rawMaterialItems) {
        state.rawMaterialItems.forEach(item => {
            addRow(
                item.name,
                item.quantity.toString(),
                item.unit,
                item.yield.toString(),
                item.unitCost.toString(),
                'rawMaterial'
            );
        });
    }
    
    // Restore sub-recipe items
    if (state.subRecipeItems) {
        state.subRecipeItems.forEach(item => {
            addRow(
                item.name,
                item.quantity.toString(),
                item.unit,
                item.yield.toString(),
                item.unitCost.toString(),
                'sub-recipe',
                item.subRecipeId
            );
        });
    }
    
    // Restore direct labor items
    if (state.directLaborItems) {
        state.directLaborItems.forEach(item => {
            const labor = userData.directLabor.find(l => l.name === item.name);
            if (labor) {
                addDirectLaborRow(
                    item.name,
                    item.quantity.toString(),
                    item.unit,
                    item.rate.toString()
                );
            }
        });
    }
}

function setupEventListeners() {
    // Dark Mode Toggle
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('change', toggleTheme);
    }
    if (mobileThemeToggle) {
        mobileThemeToggle.addEventListener('change', toggleTheme);
    }
    
    // Tab Navigation
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            switchTab(e.target.dataset.tab);
            // NEW: Update cost breakdown preview when switching to summary tab
            if (e.target.dataset.tab === 'summary') {
                updateCostBreakdownPreview();
            }
        });
    });

    // NEW: Sidebar Navigation
    setupSidebarNavigation();

    // Currency Selector
    currencySelect.addEventListener("change", () => {
        currency = currencySelect.value;
        userData.currency = currency;
        mobileCurrencySelect.value = currency;
        document
            .querySelectorAll(".unit-currency")
            .forEach((e) => (e.textContent = currency));
        recalc();
        saveUserData();
        
        // NEW: Update cost breakdown preview
        updateCostBreakdownPreview();
    });

    // NEW: Mobile Currency Selector
    mobileCurrencySelect.addEventListener("change", () => {
        currency = mobileCurrencySelect.value;
        userData.currency = currency;
        currencySelect.value = currency;
        document
            .querySelectorAll(".unit-currency")
            .forEach((e) => (e.textContent = currency));
        recalc();
        saveUserData();
        updateCostBreakdownPreview();
    });

    // Recipe inputs
    [
        markupInput,
        taxInput,
        vatInput,
        servingsInput,
        recipeNameInput,
        // NEW: Batch scaling input
        batchScaleInput
    ].forEach((el) => {
        el.addEventListener("input", () => {
            recalc();
            saveCurrentRecipeState();
        });
    });

    // Reset button
    resetBtn.addEventListener("click", () => {
        if (!confirm("Reset entire recipe?")) return;
        recipeBody.innerHTML = "";
        directLaborRecipeBody.innerHTML = "";
        recipeNameInput.value = "";
        editingItem = { type: null, id: null, data: null };
        recalc();
        
        // NEW: Update cost breakdown preview
        updateCostBreakdownPreview();
    });

    // Save Recipe buttons
    saveMainRecipeBtn.addEventListener("click", () => {
        if (!recipeNameInput.value.trim()) {
            alert("Please enter a recipe name before saving");
            recipeNameInput.focus();
            return;
        }
        
        if (editingItem.type === 'mainRecipe' && editingItem.id) {
            showEditPrompt('mainRecipe', editingItem.id, recipeNameInput.value);
        } else {
            saveRecipe('main');
        }
    });
    
    // FIX FOR ISSUE 1: Check for sub-recipe editing when saving
    saveSubRecipeBtn.addEventListener("click", () => {
        if (!recipeNameInput.value.trim()) {
            alert("Please enter a recipe name before saving as sub-recipe");
            recipeNameInput.focus();
            return;
        }
        
        // FIXED: Check if we're editing a sub-recipe and show edit prompt
        if (editingItem.type === 'subRecipe' && editingItem.id) {
            showEditPrompt('subRecipe', editingItem.id, recipeNameInput.value);
        } else {
            openSubRecipeSaveModal();
        }
    });

    // Save Raw Material button
    document
        .getElementById("saveRawMaterialBtn")
        .addEventListener("click", saveRawMaterial);

    // Save Direct Labor button
    document
        .getElementById("saveDirectLaborBtn")
        .addEventListener("click", saveDirectLabor);

    // Help modal
    helpBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        helpModalTitle.textContent = "Complete Field Guide — ProfitPerPlate";
        helpModalContent.innerHTML = generateCompleteHelpContent();
        helpModal.classList.remove("hidden");
    });
    
    // NEW: Mobile Help button
    mobileHelpBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        helpModalTitle.textContent = "Complete Field Guide — ProfitPerPlate";
        helpModalContent.innerHTML = generateCompleteHelpContent();
        helpModal.classList.remove("hidden");
        closeMobileUserMenu();
    });
    
    closeHelpBtn.addEventListener("click", closeHelpModal);
    helpModal.addEventListener("click", (e) => {
        if (e.target === helpModal) closeHelpModal();
    });

    // Print button
    printBtn.addEventListener("click", () => {
        generatePrintPreview();
        printPreviewModal.classList.remove("hidden");
    });

    // REMOVED: User Menu Events (userMenuBtn, document click for closing user menu)

    // NEW: Mobile Menu Events
    mobileMenuBtn.addEventListener("click", openMobileUserMenu);

    // NEW: Mobile Auth Events
    mobileLoginBtn.addEventListener("click", () => {
        isSignUpMode = false;
        closeMobileUserMenu();
        openAuthModal();
    });

    mobileSignupBtn.addEventListener("click", () => {
        isSignUpMode = true;
        closeMobileUserMenu();
        openAuthModal();
    });

    mobileLogoutBtn.addEventListener("click", handleLogout);

    // Close modal on background click
    document
        .getElementById("rawMaterialModal")
        .addEventListener("click", (e) => {
            if (e.target.id === "rawMaterialModal") {
                closeRawMaterialModal();
            }
        });

    document
        .getElementById("directLaborModal")
        .addEventListener("click", (e) => {
            if (e.target.id === "directLaborModal") {
                closeDirectLaborModal();
            }
        });

    document.getElementById("printPreviewModal").addEventListener("click", (e) => {
        if (e.target.id === "printPreviewModal") {
            closePrintPreview();
        }
    });

    document.getElementById("subRecipeSaveModal").addEventListener("click", (e) => {
        if (e.target.id === "subRecipeSaveModal") {
            closeSubRecipeSaveModal();
        }
    });
    
    document.getElementById("editPromptModal").addEventListener("click", (e) => {
        if (e.target.id === "editPromptModal") {
            closeEditPromptModal();
        }
    });

    document.getElementById("authModal").addEventListener("click", (e) => {
        if (e.target.id === "authModal") {
            closeAuthModal();
        }
    });

    document.getElementById("mobileUserMenuModal").addEventListener("click", (e) => {
        if (e.target.id === "mobileUserMenuModal") {
            closeMobileUserMenu();
        }
    });

    // NEW: Password visibility toggle
    if (togglePassword) {
        togglePassword.addEventListener("click", togglePasswordVisibility);
    }

    // Update unit display when item is selected in unified dropdown
    unifiedItemSelect.addEventListener("change", function () {
        const value = this.value;
        if (!value) {
            addIngredientUnit.textContent = "g";
            addIngredientYield.disabled = false;
            return;
        }

        const [type, id] = value.split('-');
        if (type === 'rawMaterial') {
            const rawMaterial = userData.rawMaterials.find(item => item.id === parseInt(id));
            if (rawMaterial) {
                addIngredientUnit.textContent = rawMaterial.costUnit;
                addIngredientYield.disabled = false;
            }
        } else if (type === 'subrecipe') {
            const subRecipe = userData.recipes.find(recipe => recipe.id === parseInt(id));
            if (subRecipe && subRecipe.type === 'sub') {
                addIngredientUnit.textContent = subRecipe.costUnit || subRecipe.outputUnit || 'batch';
                addIngredientYield.disabled = false;
            }
        }
    });

    // Update time requirement unit when direct labor item is selected
    directLaborSelect.addEventListener("change", function() {
        const value = this.value;
        if (!value) {
            timeRequirementUnit.textContent = "hours";
            return;
        }

        const labor = userData.directLabor.find(item => item.id === parseInt(value));
        if (labor) {
            timeRequirementUnit.textContent = labor.costUnit;
        }
    });

    // Update sub-recipe cost calculation when inputs change
    subRecipeYieldQuantity.addEventListener('input', updateSubRecipeCostDisplay);
    subRecipeYieldUnit.addEventListener('change', updateSubRecipeCostDisplay);
    subRecipeCostUnit.addEventListener('change', updateSubRecipeCostDisplay);
    subRecipeCategory.addEventListener('change', updateSubRecipeCostDisplay);

    // NEW: Cost breakdown collapsible sections - FIXED: Now working properly
    document.querySelectorAll('.breakdown-header').forEach(header => {
        header.addEventListener('click', function() {
            const section = this.dataset.section;
            const content = document.getElementById(`${section}Preview`);
            const chevron = this.querySelector('span');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                chevron.textContent = '▾';
                this.classList.remove('collapsed');
            } else {
                content.style.display = 'none';
                chevron.textContent = '▸';
                this.classList.add('collapsed');
            }
        });
    });

    // NEW: Initialize breakdown sections as expanded
    document.querySelectorAll('.breakdown-content').forEach(content => {
        content.style.display = 'block';
    });

    // REMOVED: Desktop auth button events (loginBtn, signupBtn, logoutBtn)
    
    authSubmitBtn.addEventListener("click", handleAuth);
    authSwitchBtn.addEventListener("click", toggleAuthMode);

    // NEW: Window resize handler for responsive sidebar
    window.addEventListener('resize', initSidebarLayout);

    // Escape key handler - REMOVED: userMenuDropdown from escape key handler
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (!helpModal.classList.contains("hidden")) {
                closeHelpModal();
            } else if (!document.getElementById("rawMaterialModal").classList.contains("hidden")) {
                closeRawMaterialModal();
            } else if (!document.getElementById("directLaborModal").classList.contains("hidden")) {
                closeDirectLaborModal();
            } else if (!document.getElementById("authModal").classList.contains("hidden")) {
                closeAuthModal();
            } else if (!document.getElementById("printPreviewModal").classList.contains("hidden")) {
                closePrintPreview();
            } else if (!document.getElementById("subRecipeSaveModal").classList.contains("hidden")) {
                closeSubRecipeSaveModal();
            } else if (!document.getElementById("editPromptModal").classList.contains("hidden")) {
                closeEditPromptModal();
            } else if (!document.getElementById("mobileUserMenuModal").classList.contains("hidden")) {
                closeMobileUserMenu();
            }
        }
    });

    // Stop propagation for all help icons to prevent modal closing
    document.querySelectorAll('.help-icon, .field-help').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
        });
    });
}

// Tab switching function
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll(".tab-content").forEach(tab => {
        tab.classList.add("hidden");
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    
    // Show selected tab content
    document.getElementById(`${tabName}Tab`).classList.remove("hidden");
    
    // Activate selected tab button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
    
    // Special handling for summary tab
    if (tabName === 'summary') {
        updateCostBreakdownPreview();
    }
}

// Close help modal
function closeHelpModal() {
    helpModal.classList.add("hidden");
}

// Generate complete help content
function generateCompleteHelpContent() {
    return `
        <div class="help-content">
            <h3>Complete Field Guide</h3>
            <p>This guide explains all the fields and calculations in ProfitPerPlate.</p>
            
            <div class="help-section">
                <h4>Raw Materials</h4>
                <ul>
                    <li><strong>Name:</strong> The name of the ingredient</li>
                    <li><strong>Quantity:</strong> Amount used in the recipe</li>
                    <li><strong>Unit:</strong> Measurement unit (grams, liters, pieces, etc.)</li>
                    <li><strong>Yield %:</strong> Edible percentage after preparation losses</li>
                    <li><strong>Unit Cost:</strong> Cost per unit of measurement</li>
                </ul>
            </div>
            
            <div class="help-section">
                <h4>Direct Labor</h4>
                <ul>
                    <li><strong>Task Name:</strong> Description of the labor task</li>
                    <li><strong>Time Required:</strong> How long the task takes</li>
                    <li><strong>Rate:</strong> Cost per time unit</li>
                </ul>
            </div>
            
            <div class="help-section">
                <h4>Recipe Summary</h4>
                <ul>
                    <li><strong>Markup %:</strong> Desired profit margin percentage</li>
                    <li><strong>Tax %:</strong> Applicable tax percentage</li>
                    <li><strong>VAT %:</strong> Value Added Tax percentage</li>
                    <li><strong>Servings:</strong> Number of servings the recipe makes</li>
                </ul>
            </div>
            
            <div class="help-tip">
                <strong>Tip:</strong> All calculations update automatically as you make changes.
            </div>
        </div>
    `;
}

// Add row to recipe table
function addRow(name, qty, unit, yieldPct, unitCost, type = 'rawMaterial', subRecipeId = null) {
    const row = document.createElement("tr");
    if (type === 'sub-recipe') {
        row.dataset.type = 'sub-recipe';
        row.dataset.subRecipeId = subRecipeId;
    }
    
    row.innerHTML = `
        <td><input type="text" value="${name}" readonly></td>
        <td class="quantity-cell">
            <input type="number" value="${qty}" step="0.001" min="0">
            <span class="quantity-unit">${unit}</span>
        </td>
        <td><input type="number" value="${yieldPct}" step="1" min="0" max="100" class="yield-input"></td>
        <td class="cost-cell">
            <span class="unit-currency">${currency}</span>
            <input type="number" value="${unitCost}" step="0.001" min="0" class="cost-input">
        </td>
        <td class="actions-cell">
            <button class="btn-icon delete-row" title="Remove item">🗑️</button>
        </td>
    `;
    
    recipeBody.appendChild(row);
    
    // Add event listeners for the new row
    const inputs = row.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            recalc();
            saveCurrentRecipeState();
        });
    });
    
    row.querySelector('.delete-row').addEventListener('click', () => {
        row.remove();
        recalc();
        saveCurrentRecipeState();
        updateCostBreakdownPreview();
    });
    
    recalc();
    saveCurrentRecipeState();
}

// Add direct labor row
function addDirectLaborRow(name, time, unit, rate) {
    const row = document.createElement("tr");
    
    row.innerHTML = `
        <td><input type="text" value="${name}" readonly></td>
        <td class="quantity-cell">
            <input type="number" value="${time}" step="0.001" min="0">
            <span class="quantity-unit">${unit}</span>
        </td>
        <td class="cost-cell">
            <span class="unit-currency">${currency}</span>
            <input type="number" value="${rate}" step="0.001" min="0" class="cost-input">
        </td>
        <td class="actions-cell">
            <button class="btn-icon delete-row" title="Remove labor">🗑️</button>
        </td>
    `;
    
    directLaborRecipeBody.appendChild(row);
    
    // Add event listeners
    const inputs = row.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            recalc();
            saveCurrentRecipeState();
        });
    });
    
    row.querySelector('.delete-row').addEventListener('click', () => {
        row.remove();
        recalc();
        saveCurrentRecipeState();
        updateCostBreakdownPreview();
    });
    
    recalc();
    saveCurrentRecipeState();
}

// Recalculate all costs
function recalc() {
    let rawMaterialsTotal = 0;
    let directLaborTotal = 0;
    
    // Calculate raw materials total
    recipeBody.querySelectorAll("tr").forEach(row => {
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        
        const adjustedCost = (quantity * unitCost) * (yieldPct / 100);
        rawMaterialsTotal += adjustedCost;
    });
    
    // Calculate direct labor total
    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        
        directLaborTotal += timeRequired * rate;
    });
    
    const grandTotal = rawMaterialsTotal + directLaborTotal;
    const servings = parseFloat(servingsInput.value) || 1;
    const markup = parseFloat(markupInput.value) || 0;
    const tax = parseFloat(taxInput.value) || 0;
    const vat = parseFloat(vatInput.value) || 0;
    
    // Update display
    rawMaterialsTotalEl.textContent = formatCurrency(rawMaterialsTotal);
    directLaborTotalEl.textContent = formatCurrency(directLaborTotal);
    grandTotalEl.textContent = formatCurrency(grandTotal);
    
    // Update summary
    updateSummaryDisplay(rawMaterialsTotal, directLaborTotal, grandTotal, servings, markup, tax, vat);
}

// Update summary display
function updateSummaryDisplay(rawMaterialsTotal, directLaborTotal, grandTotal, servings, markup, tax, vat) {
    const costPerServing = grandTotal / servings;
    
    // Calculate selling price with markup, tax, and VAT
    const basePrice = costPerServing * (1 + markup / 100);
    const priceWithTax = basePrice * (1 + tax / 100);
    const finalSellingPrice = priceWithTax * (1 + vat / 100);
    
    const foodCostPercent = (costPerServing / finalSellingPrice) * 100;
    const laborCostPercent = (directLaborTotal / grandTotal) * 100;
    const totalCostPercent = 100; // Base reference
    const grossProfit = finalSellingPrice - costPerServing;
    
    // Update summary elements
    summaryRawMaterialsCost.textContent = formatCurrency(rawMaterialsTotal);
    summaryDirectLaborCost.textContent = formatCurrency(directLaborTotal);
    summaryTotalCost.textContent = formatCurrency(grandTotal);
    summaryCostServing.textContent = formatCurrency(costPerServing);
    summarySellingPrice.textContent = formatCurrency(finalSellingPrice);
    summaryFoodCost.textContent = foodCostPercent.toFixed(1) + "%";
    summaryLaborCostPercent.textContent = laborCostPercent.toFixed(1) + "%";
    summaryTotalCostPercent.textContent = totalCostPercent.toFixed(1) + "%";
    summaryGrossProfit.textContent = formatCurrency(grossProfit);
    
    // Update servings display
    summaryServingsDisplay.textContent = servings;
    
    // Update batch profit analysis
    const batchScale = parseFloat(batchScaleInput.value) || 1;
    const batchRevenue = finalSellingPrice * servings * batchScale;
    const batchCost = grandTotal * batchScale;
    const batchProfit = batchRevenue - batchCost;
    const batchProfitMargin = (batchProfit / batchRevenue) * 100;
    
    summaryBatchRevenue.textContent = formatCurrency(batchRevenue);
    summaryBatchProfit.textContent = formatCurrency(batchProfit);
    summaryBatchProfitMargin.textContent = batchProfitMargin.toFixed(1) + "%";
}

// Format currency
function formatCurrency(amount) {
    return currency + amount.toFixed(2);
}

// Populate unified item select
function populateUnifiedItemSelect() {
    unifiedItemSelect.innerHTML = '<option value="">Select an item...</option>';
    
    // Add raw materials
    userData.rawMaterials.forEach(item => {
        const option = document.createElement('option');
        option.value = `rawMaterial-${item.id}`;
        option.textContent = `📦 ${item.name} (${formatCurrency(item.unitCost)}/${item.costUnit})`;
        unifiedItemSelect.appendChild(option);
    });
    
    // Add sub-recipes
    userData.recipes.filter(recipe => recipe.type === 'sub').forEach(recipe => {
        const option = document.createElement('option');
        option.value = `subrecipe-${recipe.id}`;
        option.textContent = `🍳 ${recipe.name} (${formatCurrency(recipe.costPerUnit)}/${recipe.costUnit || recipe.outputUnit || 'batch'})`;
        unifiedItemSelect.appendChild(option);
    });
}

// Populate direct labor select
function populateDirectLaborSelect() {
    directLaborSelect.innerHTML = '<option value="">Select labor task...</option>';
    
    userData.directLabor.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `👨‍🍳 ${item.name} (${formatCurrency(item.rate)}/${item.costUnit})`;
        directLaborSelect.appendChild(option);
    });
}

// Add ingredient from unified select
function addIngredient() {
    const selectedValue = unifiedItemSelect.value;
    if (!selectedValue) {
        alert("Please select an item first");
        return;
    }
    
    const [type, id] = selectedValue.split('-');
    const quantity = addIngredientQty.value || "1";
    const yieldPct = addIngredientYield.value || "100";
    
    if (type === 'rawMaterial') {
        const rawMaterial = userData.rawMaterials.find(item => item.id === parseInt(id));
        if (rawMaterial) {
            addRow(
                rawMaterial.name,
                quantity,
                rawMaterial.costUnit,
                yieldPct,
                rawMaterial.unitCost.toString(),
                'rawMaterial'
            );
        }
    } else if (type === 'subrecipe') {
        const subRecipe = userData.recipes.find(recipe => recipe.id === parseInt(id));
        if (subRecipe && subRecipe.type === 'sub') {
            addRow(
                subRecipe.name,
                quantity,
                subRecipe.costUnit || subRecipe.outputUnit || 'batch',
                yieldPct,
                subRecipe.costPerUnit.toString(),
                'sub-recipe',
                subRecipe.id
            );
        }
    }
    
    // Reset form
    unifiedItemSelect.value = "";
    addIngredientQty.value = "";
    addIngredientYield.value = "100";
    addIngredientUnit.textContent = "g";
}

// Add direct labor from select
function addDirectLabor() {
    const selectedId = directLaborSelect.value;
    if (!selectedId) {
        alert("Please select a labor task first");
        return;
    }
    
    const labor = userData.directLabor.find(item => item.id === parseInt(selectedId));
    if (labor) {
        addDirectLaborRow(
            labor.name,
            timeRequirement.value || "1",
            labor.costUnit,
            labor.rate.toString()
        );
    }
    
    // Reset form
    directLaborSelect.value = "";
    timeRequirement.value = "";
    timeRequirementUnit.textContent = "hours";
}

// Save raw material
function saveRawMaterial() {
    const name = document.getElementById("rawMaterialName").value.trim();
    const category = document.getElementById("rawMaterialCategory").value;
    const unitCost = parseFloat(document.getElementById("rawMaterialUnitCost").value) || 0;
    const costUnit = document.getElementById("rawMaterialCostUnit").value;
    
    if (!name) {
        alert("Please enter a name for the raw material");
        return;
    }
    
    const rawMaterial = {
        id: Date.now(),
        name,
        category,
        unitCost,
        costUnit,
        createdAt: new Date().toISOString()
    };
    
    if (editingItem.type === 'rawMaterial' && editingItem.id) {
        // Update existing raw material
        const index = userData.rawMaterials.findIndex(item => item.id === editingItem.id);
        if (index !== -1) {
            userData.rawMaterials[index] = { ...userData.rawMaterials[index], ...rawMaterial };
        }
        editingItem = { type: null, id: null, data: null };
    } else {
        // Add new raw material
        userData.rawMaterials.push(rawMaterial);
    }
    
    saveUserData();
    renderRawMaterials();
    populateUnifiedItemSelect();
    closeRawMaterialModal();
}

// Save direct labor
function saveDirectLabor() {
    const name = document.getElementById("directLaborName").value.trim();
    const rate = parseFloat(document.getElementById("directLaborRate").value) || 0;
    const costUnit = document.getElementById("directLaborCostUnit").value;
    
    if (!name) {
        alert("Please enter a name for the direct labor task");
        return;
    }
    
    const directLabor = {
        id: Date.now(),
        name,
        rate,
        costUnit,
        createdAt: new Date().toISOString()
    };
    
    if (editingItem.type === 'directLabor' && editingItem.id) {
        // Update existing direct labor
        const index = userData.directLabor.findIndex(item => item.id === editingItem.id);
        if (index !== -1) {
            userData.directLabor[index] = { ...userData.directLabor[index], ...directLabor };
        }
        editingItem = { type: null, id: null, data: null };
    } else {
        // Add new direct labor
        userData.directLabor.push(directLabor);
    }
    
    saveUserData();
    renderDirectLabor();
    populateDirectLaborSelect();
    closeDirectLaborModal();
}

// Render raw materials list
function renderRawMaterials() {
    const tbody = document.getElementById("rawMaterialsList");
    tbody.innerHTML = "";
    
    userData.rawMaterials.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${formatCurrency(item.unitCost)}/${item.costUnit}</td>
            <td>
                <button class="btn-icon edit-raw-material" data-id="${item.id}">✏️</button>
                <button class="btn-icon delete-raw-material" data-id="${item.id}">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners for edit and delete buttons
    tbody.querySelectorAll('.edit-raw-material').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            editRawMaterial(id);
        });
    });
    
    tbody.querySelectorAll('.delete-raw-material').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            deleteRawMaterial(id);
        });
    });
}

// Render direct labor list
function renderDirectLabor() {
    const tbody = document.getElementById("directLaborList");
    tbody.innerHTML = "";
    
    userData.directLabor.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${formatCurrency(item.rate)}/${item.costUnit}</td>
            <td>
                <button class="btn-icon edit-direct-labor" data-id="${item.id}">✏️</button>
                <button class="btn-icon delete-direct-labor" data-id="${item.id}">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners for edit and delete buttons
    tbody.querySelectorAll('.edit-direct-labor').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            editDirectLabor(id);
        });
    });
    
    tbody.querySelectorAll('.delete-direct-labor').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            deleteDirectLabor(id);
        });
    });
}

// Edit raw material
function editRawMaterial(id) {
    const rawMaterial = userData.rawMaterials.find(item => item.id === id);
    if (!rawMaterial) return;
    
    document.getElementById("rawMaterialName").value = rawMaterial.name;
    document.getElementById("rawMaterialCategory").value = rawMaterial.category;
    document.getElementById("rawMaterialUnitCost").value = rawMaterial.unitCost;
    document.getElementById("rawMaterialCostUnit").value = rawMaterial.costUnit;
    
    editingItem = { type: 'rawMaterial', id: id, data: rawMaterial };
    openRawMaterialModal();
}

// Edit direct labor
function editDirectLabor(id) {
    const directLabor = userData.directLabor.find(item => item.id === id);
    if (!directLabor) return;
    
    document.getElementById("directLaborName").value = directLabor.name;
    document.getElementById("directLaborRate").value = directLabor.rate;
    document.getElementById("directLaborCostUnit").value = directLabor.costUnit;
    
    editingItem = { type: 'directLabor', id: id, data: directLabor };
    openDirectLaborModal();
}

// Delete raw material
function deleteRawMaterial(id) {
    if (!confirm("Are you sure you want to delete this raw material?")) return;
    
    userData.rawMaterials = userData.rawMaterials.filter(item => item.id !== id);
    saveUserData();
    renderRawMaterials();
    populateUnifiedItemSelect();
}

// Delete direct labor
function deleteDirectLabor(id) {
    if (!confirm("Are you sure you want to delete this direct labor task?")) return;
    
    userData.directLabor = userData.directLabor.filter(item => item.id !== id);
    saveUserData();
    renderDirectLabor();
    populateDirectLaborSelect();
}

// Open raw material modal
function openRawMaterialModal() {
    document.getElementById("rawMaterialModal").classList.remove("hidden");
}

// Close raw material modal
function closeRawMaterialModal() {
    document.getElementById("rawMaterialModal").classList.add("hidden");
    document.getElementById("rawMaterialForm").reset();
    editingItem = { type: null, id: null, data: null };
}

// Open direct labor modal
function openDirectLaborModal() {
    document.getElementById("directLaborModal").classList.remove("hidden");
}

// Close direct labor modal
function closeDirectLaborModal() {
    document.getElementById("directLaborModal").classList.add("hidden");
    document.getElementById("directLaborForm").reset();
    editingItem = { type: null, id: null, data: null };
}

// Update sub-recipe unit options based on category
function updateSubRecipeUnitOptions() {
    const category = subRecipeCategory.value;
    const yieldUnitSelect = subRecipeYieldUnit;
    const costUnitSelect = subRecipeCostUnit;
    
    // Clear existing options
    yieldUnitSelect.innerHTML = '';
    costUnitSelect.innerHTML = '';
    
    // Add units based on category
    let units = [];
    if (category === 'weight') units = categoryUnits.weight;
    else if (category === 'volume') units = categoryUnits.volume;
    else if (category === 'count') units = categoryUnits.count;
    else if (category === 'time') units = categoryUnits.time;
    
    units.forEach(unit => {
        const yieldOption = document.createElement('option');
        yieldOption.value = unit;
        yieldOption.textContent = unit;
        yieldUnitSelect.appendChild(yieldOption);
        
        const costOption = document.createElement('option');
        costOption.value = unit;
        costOption.textContent = unit;
        costUnitSelect.appendChild(costOption);
    });
    
    // Update cost display
    updateSubRecipeCostDisplay();
}

// Update sub-recipe cost display
function updateSubRecipeCostDisplay() {
    const currentCost = calculateCurrentRecipeCost();
    const yieldQuantity = parseFloat(subRecipeYieldQuantity.value) || 1;
    const yieldUnit = subRecipeYieldUnit.value;
    const costUnit = subRecipeCostUnit.value;
    
    // For now, just display the current recipe cost
    // In a real implementation, you would convert between units
    currentRecipeCostDisplay.textContent = formatCurrency(currentCost);
    costPerOutputUnit.textContent = `${formatCurrency(currentCost / yieldQuantity)} per ${yieldUnit}`;
}

// Calculate current recipe cost
function calculateCurrentRecipeCost() {
    let totalCost = 0;
    
    // Calculate raw materials cost
    recipeBody.querySelectorAll("tr").forEach(row => {
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        
        const adjustedCost = (quantity * unitCost) * (yieldPct / 100);
        totalCost += adjustedCost;
    });
    
    return totalCost;
}

// Open sub-recipe save modal
function openSubRecipeSaveModal() {
    const recipeName = recipeNameInput.value.trim();
    if (!recipeName) {
        alert("Please enter a recipe name first");
        return;
    }
    
    subRecipeNameDisplay.textContent = recipeName;
    updateSubRecipeCostDisplay();
    subRecipeSaveModal.classList.remove("hidden");
}

// Close sub-recipe save modal
function closeSubRecipeSaveModal() {
    subRecipeSaveModal.classList.add("hidden");
    subRecipeCategory.value = "weight";
    subRecipeYieldQuantity.value = "1";
    updateSubRecipeUnitOptions();
}

// Save recipe (main or sub)
function saveRecipe(type) {
    const recipeName = recipeNameInput.value.trim();
    if (!recipeName) {
        alert("Please enter a recipe name");
        return;
    }
    
    // Collect recipe items
    const rawMaterialItems = [];
    const directLaborItems = [];
    const subRecipeItems = [];
    
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit")?.textContent || "g";
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        const rowType = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        if (rowType === 'rawMaterial') {
            rawMaterialItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                yield: yieldPct,
                unitCost: unitCost
            });
        } else if (rowType === 'sub-recipe') {
            subRecipeItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                yield: yieldPct,
                unitCost: unitCost,
                subRecipeId: subRecipeId
            });
        }
    });
    
    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const laborName = row.children[0].querySelector("input").value;
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const timeUnit = row.children[1].querySelector(".quantity-unit")?.textContent || "hours";
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        
        directLaborItems.push({
            name: laborName,
            timeRequired: timeRequired,
            timeUnit: timeUnit,
            rate: rate
        });
    });
    
    const totalCost = calculateCurrentRecipeCost();
    const servings = parseFloat(servingsInput.value) || 1;
    const costPerServing = totalCost / servings;
    
    const recipe = {
        id: editingItem.type === 'mainRecipe' || editingItem.type === 'subRecipe' ? editingItem.id : Date.now(),
        name: recipeName,
        type: type === 'main' ? 'main' : 'sub',
        rawMaterialItems: rawMaterialItems,
        directLaborItems: directLaborItems,
        subRecipeItems: subRecipeItems,
        totalCost: totalCost,
        servings: servings,
        costPerServing: costPerServing,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    // For sub-recipes, add additional fields from the modal
    if (type === 'sub') {
        recipe.category = subRecipeCategory.value;
        recipe.outputQuantity = parseFloat(subRecipeYieldQuantity.value) || 1;
        recipe.outputUnit = subRecipeYieldUnit.value;
        recipe.costPerUnit = totalCost / recipe.outputQuantity;
        recipe.costUnit = subRecipeCostUnit.value;
    }
    
    if (editingItem.type === 'mainRecipe' && editingItem.id) {
        // Update existing main recipe
        const index = userData.recipes.findIndex(item => item.id === editingItem.id);
        if (index !== -1) {
            userData.recipes[index] = { ...userData.recipes[index], ...recipe };
        }
    } else if (editingItem.type === 'subRecipe' && editingItem.id) {
        // Update existing sub-recipe
        const index = userData.recipes.findIndex(item => item.id === editingItem.id);
        if (index !== -1) {
            userData.recipes[index] = { ...userData.recipes[index], ...recipe };
        }
    } else {
        // Add new recipe
        userData.recipes.push(recipe);
    }
    
    saveUserData();
    renderRecipesList();
    populateUnifiedItemSelect();
    populateSummaryRecipeSelect();
    
    if (type === 'sub') {
        closeSubRecipeSaveModal();
    }
    
    editingItem = { type: null, id: null, data: null };
    
    alert(`${type === 'main' ? 'Main recipe' : 'Sub-recipe'} saved successfully!`);
}

// Render recipes list
function renderRecipesList() {
    const mainRecipes = userData.recipes.filter(recipe => recipe.type === 'main');
    const subRecipes = userData.recipes.filter(recipe => recipe.type === 'sub');
    
    // Render main recipes
    mainRecipesList.innerHTML = "";
    mainRecipes.forEach(recipe => {
        const li = document.createElement("li");
        li.className = "recipe-item";
        li.innerHTML = `
            <div class="recipe-item-header">
                <span class="recipe-name">${recipe.name}</span>
                <span class="recipe-cost">${formatCurrency(recipe.costPerServing)}/serving</span>
            </div>
            <div class="recipe-item-details">
                <span>${recipe.servings} servings</span>
                <span>${formatCurrency(recipe.totalCost)} total</span>
            </div>
            <div class="recipe-item-actions">
                <button class="btn-sm btn-primary load-recipe" data-id="${recipe.id}">Load</button>
                <button class="btn-sm btn-secondary edit-recipe" data-id="${recipe.id}">Edit</button>
                <button class="btn-sm btn-danger delete-recipe" data-id="${recipe.id}">Delete</button>
            </div>
        `;
        mainRecipesList.appendChild(li);
    });
    
    // Render sub-recipes
    subRecipesList.innerHTML = "";
    subRecipes.forEach(recipe => {
        const li = document.createElement("li");
        li.className = "recipe-item";
        li.innerHTML = `
            <div class="recipe-item-header">
                <span class="recipe-name">${recipe.name}</span>
                <span class="recipe-cost">${formatCurrency(recipe.costPerUnit)}/${recipe.costUnit || recipe.outputUnit || 'batch'}</span>
            </div>
            <div class="recipe-item-details">
                <span>${recipe.outputQuantity} ${recipe.outputUnit}</span>
                <span>${formatCurrency(recipe.totalCost)} total</span>
            </div>
            <div class="recipe-item-actions">
                <button class="btn-sm btn-primary use-subrecipe" data-id="${recipe.id}">Use</button>
                <button class="btn-sm btn-secondary edit-recipe" data-id="${recipe.id}">Edit</button>
                <button class="btn-sm btn-danger delete-recipe" data-id="${recipe.id}">Delete</button>
            </div>
        `;
        subRecipesList.appendChild(li);
    });
    
    // Add event listeners
    document.querySelectorAll('.load-recipe').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            loadRecipe(id);
        });
    });
    
    document.querySelectorAll('.use-subrecipe').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            useSubRecipe(id);
        });
    });
    
    document.querySelectorAll('.edit-recipe').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            editRecipe(id);
        });
    });
    
    document.querySelectorAll('.delete-recipe').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            deleteRecipe(id);
        });
    });
}

// Load recipe
function loadRecipe(id) {
    const recipe = userData.recipes.find(item => item.id === id);
    if (!recipe) return;
    
    // Clear current recipe
    recipeBody.innerHTML = "";
    directLaborRecipeBody.innerHTML = "";
    
    // Set recipe name
    recipeNameInput.value = recipe.name;
    
    // Load raw material items
    recipe.rawMaterialItems.forEach(item => {
        addRow(
            item.name,
            item.quantity.toString(),
            item.unit,
            item.yield.toString(),
            item.unitCost.toString(),
            'rawMaterial'
        );
    });
    
    // Load sub-recipe items
    recipe.subRecipeItems.forEach(item => {
        addRow(
            item.name,
            item.quantity.toString(),
            item.unit,
            item.yield.toString(),
            item.unitCost.toString(),
            'sub-recipe',
            item.subRecipeId
        );
    });
    
    // Load direct labor items
    recipe.directLaborItems.forEach(item => {
        addDirectLaborRow(
            item.name,
            item.timeRequired.toString(),
            item.timeUnit,
            item.rate.toString()
        );
    });
    
    // Set servings
    servingsInput.value = recipe.servings || 1;
    
    // Set editing state
    editingItem = { type: recipe.type === 'main' ? 'mainRecipe' : 'subRecipe', id: recipe.id, data: recipe };
    
    recalc();
    updateCostBreakdownPreview();
    
    // Switch to calculator tab
    switchTab('calculator');
}

// Use sub-recipe
function useSubRecipe(id) {
    const recipe = userData.recipes.find(item => item.id === id);
    if (!recipe) return;
    
    addRow(
        recipe.name,
        "1",
        recipe.costUnit || recipe.outputUnit || 'batch',
        "100",
        recipe.costPerUnit.toString(),
        'sub-recipe',
        recipe.id
    );
    
    // Switch to calculator tab
    switchTab('calculator');
}

// Edit recipe
function editRecipe(id) {
    const recipe = userData.recipes.find(item => item.id === id);
    if (!recipe) return;
    
    // Check if we're already editing this recipe
    if (editingItem.id === id) {
        // Already loaded, just switch to calculator tab
        switchTab('calculator');
        return;
    }
    
    // Load the recipe for editing
    loadRecipe(id);
}

// Delete recipe
function deleteRecipe(id) {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    
    userData.recipes = userData.recipes.filter(item => item.id !== id);
    saveUserData();
    renderRecipesList();
    populateUnifiedItemSelect();
    populateSummaryRecipeSelect();
}

// Show edit prompt
function showEditPrompt(type, id, name) {
    editPromptTitle.textContent = `Edit ${type === 'mainRecipe' ? 'Main Recipe' : 'Sub-Recipe'}`;
    editPromptMessage.textContent = `A ${type === 'mainRecipe' ? 'main recipe' : 'sub-recipe'} named "${name}" already exists. Do you want to update it?`;
    
    editPromptModal.classList.remove("hidden");
    
    // Set up confirm button
    const confirmBtn = document.getElementById("editPromptConfirm");
    confirmBtn.onclick = () => {
        if (type === 'mainRecipe') {
            saveRecipe('main');
        } else {
            saveRecipe('sub');
        }
        closeEditPromptModal();
    };
}

// Close edit prompt modal
function closeEditPromptModal() {
    editPromptModal.classList.add("hidden");
}

// Generate print preview
function generatePrintPreview() {
    const recipeName = recipeNameInput.value || "Unnamed Recipe";
    const servings = servingsInput.value || 1;
    const rawMaterialsTotal = parseFloat(rawMaterialsTotalEl.textContent.replace(currency, "")) || 0;
    const directLaborTotal = parseFloat(directLaborTotalEl.textContent.replace(currency, "")) || 0;
    const grandTotal = parseFloat(grandTotalEl.textContent.replace(currency, "")) || 0;
    const costPerServing = grandTotal / servings;
    
    let content = `
        <div class="print-header">
            <h1>${recipeName}</h1>
            <p>Recipe Cost Analysis</p>
        </div>
        
        <div class="print-section">
            <h2>Cost Summary</h2>
            <table class="print-table">
                <tr>
                    <td>Raw Materials Total:</td>
                    <td>${formatCurrency(rawMaterialsTotal)}</td>
                </tr>
                <tr>
                    <td>Direct Labor Total:</td>
                    <td>${formatCurrency(directLaborTotal)}</td>
                </tr>
                <tr>
                    <td><strong>Grand Total:</strong></td>
                    <td><strong>${formatCurrency(grandTotal)}</strong></td>
                </tr>
                <tr>
                    <td>Servings:</td>
                    <td>${servings}</td>
                </tr>
                <tr>
                    <td>Cost per Serving:</td>
                    <td>${formatCurrency(costPerServing)}</td>
                </tr>
            </table>
        </div>
    `;
    
    // Add raw materials section if there are any
    if (recipeBody.querySelectorAll("tr").length > 0) {
        content += `
            <div class="print-section">
                <h2>Raw Materials</h2>
                <table class="print-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Yield %</th>
                            <th>Unit Cost</th>
                            <th>Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        recipeBody.querySelectorAll("tr").forEach(row => {
            const itemName = row.children[0].querySelector("input").value;
            const quantity = row.children[1].querySelector("input").value;
            const unit = row.children[1].querySelector(".quantity-unit").textContent;
            const yieldPct = row.children[2].querySelector("input").value;
            const unitCost = row.children[3].querySelector("input").value;
            const totalCost = (parseFloat(quantity) * parseFloat(unitCost) * (parseFloat(yieldPct) / 100)).toFixed(2);
            
            content += `
                <tr>
                    <td>${itemName}</td>
                    <td>${quantity} ${unit}</td>
                    <td>${yieldPct}%</td>
                    <td>${formatCurrency(parseFloat(unitCost))}</td>
                    <td>${formatCurrency(parseFloat(totalCost))}</td>
                </tr>
            `;
        });
        
        content += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Add direct labor section if there are any
    if (directLaborRecipeBody.querySelectorAll("tr").length > 0) {
        content += `
            <div class="print-section">
                <h2>Direct Labor</h2>
                <table class="print-table">
                    <thead>
                        <tr>
                            <th>Task</th>
                            <th>Time</th>
                            <th>Rate</th>
                            <th>Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
            const taskName = row.children[0].querySelector("input").value;
            const time = row.children[1].querySelector("input").value;
            const timeUnit = row.children[1].querySelector(".quantity-unit").textContent;
            const rate = row.children[2].querySelector("input").value;
            const totalCost = (parseFloat(time) * parseFloat(rate)).toFixed(2);
            
            content += `
                <tr>
                    <td>${taskName}</td>
                    <td>${time} ${timeUnit}</td>
                    <td>${formatCurrency(parseFloat(rate))}/${timeUnit}</td>
                    <td>${formatCurrency(parseFloat(totalCost))}</td>
                </tr>
            `;
        });
        
        content += `
                    </tbody>
                </table>
            </div>
        `;
    }
    
    // Add summary section
    const markup = parseFloat(markupInput.value) || 0;
    const tax = parseFloat(taxInput.value) || 0;
    const vat = parseFloat(vatInput.value) || 0;
    
    const basePrice = costPerServing * (1 + markup / 100);
    const priceWithTax = basePrice * (1 + tax / 100);
    const finalSellingPrice = priceWithTax * (1 + vat / 100);
    const foodCostPercent = (costPerServing / finalSellingPrice) * 100;
    const grossProfit = finalSellingPrice - costPerServing;
    
    content += `
        <div class="print-section">
            <h2>Pricing Analysis</h2>
            <table class="print-table">
                <tr>
                    <td>Cost per Serving:</td>
                    <td>${formatCurrency(costPerServing)}</td>
                </tr>
                <tr>
                    <td>Markup (${markup}%):</td>
                    <td>${formatCurrency(costPerServing * (markup / 100))}</td>
                </tr>
                <tr>
                    <td>Tax (${tax}%):</td>
                    <td>${formatCurrency(basePrice * (tax / 100))}</td>
                </tr>
                <tr>
                    <td>VAT (${vat}%):</td>
                    <td>${formatCurrency(priceWithTax * (vat / 100))}</td>
                </tr>
                <tr>
                    <td><strong>Selling Price:</strong></td>
                    <td><strong>${formatCurrency(finalSellingPrice)}</strong></td>
                </tr>
                <tr>
                    <td>Food Cost %:</td>
                    <td>${foodCostPercent.toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Gross Profit:</td>
                    <td>${formatCurrency(grossProfit)}</td>
                </tr>
            </table>
        </div>
        
        <div class="print-footer">
            <p>Generated by ProfitPerPlate on ${new Date().toLocaleDateString()}</p>
        </div>
    `;
    
    printPreviewContent.innerHTML = content;
}

// Close print preview
function closePrintPreview() {
    printPreviewModal.classList.add("hidden");
}

// Print the preview
function printPreview() {
    window.print();
}

// NEW: Update cost breakdown preview
function updateCostBreakdownPreview() {
    // Update raw materials preview
    updateRawMaterialsPreview();
    
    // Update direct labor preview
    updateDirectLaborPreview();
    
    // Update counts and totals
    updateCostBreakdownTotals();
}

// NEW: Update raw materials preview
function updateRawMaterialsPreview() {
    rawMaterialsPreviewBody.innerHTML = "";
    
    let itemCount = 0;
    let subtotal = 0;
    
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit")?.textContent || "g";
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        
        const adjustedCost = (quantity * unitCost) * (yieldPct / 100);
        subtotal += adjustedCost;
        itemCount++;
        
        const previewRow = document.createElement("tr");
        previewRow.innerHTML = `
            <td>${itemName}</td>
            <td>${quantity} ${unit}</td>
            <td>${yieldPct}%</td>
            <td>${formatCurrency(adjustedCost)}</td>
        `;
        rawMaterialsPreviewBody.appendChild(previewRow);
    });
    
    rawMaterialsCount.textContent = itemCount;
    rawMaterialsPreviewSubtotal.textContent = formatCurrency(subtotal);
}

// NEW: Update direct labor preview
function updateDirectLaborPreview() {
    directLaborPreviewBody.innerHTML = "";
    
    let itemCount = 0;
    let subtotal = 0;
    
    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const laborName = row.children[0].querySelector("input").value;
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const timeUnit = row.children[1].querySelector(".quantity-unit")?.textContent || "hours";
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        
        const laborCost = timeRequired * rate;
        subtotal += laborCost;
        itemCount++;
        
        const previewRow = document.createElement("tr");
        previewRow.innerHTML = `
            <td>${laborName}</td>
            <td>${timeRequired} ${timeUnit}</td>
            <td>${formatCurrency(rate)}/${timeUnit}</td>
            <td>${formatCurrency(laborCost)}</td>
        `;
        directLaborPreviewBody.appendChild(previewRow);
    });
    
    directLaborCount.textContent = itemCount;
    directLaborPreviewSubtotal.textContent = formatCurrency(subtotal);
}

// NEW: Update cost breakdown totals
function updateCostBreakdownTotals() {
    const rawMaterialsTotal = parseFloat(rawMaterialsTotalEl.textContent.replace(currency, "")) || 0;
    const directLaborTotal = parseFloat(directLaborTotalEl.textContent.replace(currency, "")) || 0;
    const grandTotal = parseFloat(grandTotalEl.textContent.replace(currency, "")) || 0;
    
    rawMaterialsPreviewTotal.textContent = formatCurrency(rawMaterialsTotal);
    directLaborPreviewTotal.textContent = formatCurrency(directLaborTotal);
}

// NEW: Populate summary recipe selector
function populateSummaryRecipeSelect() {
    summaryRecipeSelect.innerHTML = '<option value="">Select a recipe to load...</option>';
    
    userData.recipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.id;
        option.textContent = `${recipe.type === 'main' ? '🍽️' : '🍳'} ${recipe.name} (${formatCurrency(recipe.totalCost)} total)`;
        summaryRecipeSelect.appendChild(option);
    });
}

// NEW: Load recipe for summary
function loadRecipeForSummary() {
    const selectedId = summaryRecipeSelect.value;
    if (!selectedId) return;
    
    const recipe = userData.recipes.find(item => item.id === parseInt(selectedId));
    if (!recipe) return;
    
    loadedRecipeForSummary = recipe;
    
    // Update display
    loadedRecipeDisplay.classList.remove('hidden');
    currentRecipeNameDisplay.textContent = recipe.name;
    loadedRecipeTotalCost.textContent = formatCurrency(recipe.totalCost);
    loadedRecipeServings.textContent = recipe.servings || 1;
    loadedRecipeItemCount.textContent = 
        (recipe.rawMaterialItems?.length || 0) + 
        (recipe.directLaborItems?.length || 0) + 
        (recipe.subRecipeItems?.length || 0);
    
    // Update summary with loaded recipe data
    updateSummaryWithLoadedRecipe();
}

// NEW: Update summary with loaded recipe data
function updateSummaryWithLoadedRecipe() {
    if (!loadedRecipeForSummary) return;
    
    const recipe = loadedRecipeForSummary;
    const servings = parseFloat(servingsInput.value) || 1;
    const markup = parseFloat(markupInput.value) || 0;
    const tax = parseFloat(taxInput.value) || 0;
    const vat = parseFloat(vatInput.value) || 0;
    
    updateSummaryDisplay(
        recipe.totalCost,
        0, // Direct labor not included in loaded recipe summary
        recipe.totalCost,
        servings,
        markup,
        tax,
        vat
    );
}

// NEW: Clear loaded recipe
function clearLoadedRecipe() {
    loadedRecipeForSummary = null;
    loadedRecipeDisplay.classList.add('hidden');
    recalc(); // Recalculate with current recipe
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);