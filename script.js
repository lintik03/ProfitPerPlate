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

// NEW: Track currently editing rows
window.currentEditingRow = null;
window.currentEditingLaborRow = null;

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
    selectItem: {
        title: "Select Item",
        content: "Choose a raw material from your master list, a direct labor item, or a saved sub-recipe to add to the current recipe.",
        example: "Example: Select 'Beef Brisket' from raw materials or 'Kitchen Work' from direct labor to add to your burger recipe."
    },
    quantity: {
        title: "Quantity/Time",
        content: "The amount of the selected item needed for this recipe. For raw materials: quantity in units. For labor: time required in the selected unit.",
        example: "Example: For a burger recipe, you might use 0.15 kg of beef patty or 0.5 hours of kitchen work."
    },
    yieldPercentage: {
        title: "Yield Percentage",
        content: "The usable percentage after preparation (e.g., peeling, trimming, cooking loss). This automatically increases the cost per unit to reflect the true cost of usable product.",
        example: "Example: Carrots with 85% yield: $1000 for 1kg → $1.18/g (not $1.00/g) because only 850g is usable."
    },
    markup: {
        title: "Mark-up Percentage",
        content: "The profit percentage added to the cost price to determine the selling price before taxes.",
        example: "Example: If your burger costs ₱50 to make and you add 40% markup, the price before tax would be ₱70 (₱50 + 40%)."
    },
    tax: {
        title: "Regular Tax Percentage",
        content: "Local sales tax percentage applied to the selling price.",
        example: "Example: If your local sales tax is 8% and your burger sells for ₱70, the tax would be ₱5.60."
    },
    vat: {
        title: "VAT Percentage",
        content: "Value Added Tax percentage applied to the selling price.",
        example: "Example: If VAT is 12% and your burger sells for ₱70, the VAT would be ₱8.40."
    },
    servings: {
        title: "Servings",
        content: "The number of portions this recipe produces. Used to calculate cost per serving.",
        example: "Example: A large pot of soup that makes 8 bowls would have 8 servings. A cake cut into 12 slices would have 12 servings."
    },
    subRecipeName: {
        title: "Sub-Recipe Name",
        content: "A descriptive name for your sub-recipe (e.g., 'Mayonnaise', 'Tomato Sauce').",
        example: "Example: 'Secret Burger Sauce', 'House Marinade', or 'Signature Spice Blend'."
    },
    subRecipeCategory: {
        title: "Category of Measurement",
        content: "The type of output this sub-recipe produces: Weight (grams, kg), Volume (ml, L), or Count (pieces).",
        example: "Example: Sauces are usually Volume, spice blends are Weight, and pre-made items like meatballs could be Count."
    },
    subRecipeYieldQuantity: {
        title: "Total Yield per Batch",
        content: "The total amount this sub-recipe produces in one batch. Used to calculate cost per unit.",
        example: "Example: If your sauce recipe makes 500ml total, enter 500. If your spice blend makes 200g total, enter 200."
    },
    ingredientName: {
        title: "Raw Material Name",
        content: "The common name of the raw material (e.g., 'Beef Brisket', 'Olive Oil').",
        example: "Example: 'Ground Beef 80/20', 'Extra Virgin Olive Oil', 'Roma Tomatoes'."
    },
    ingredientCategory: {
        title: "Raw Material Category",
        content: "Classification: Weight (solid items), Volume (liquids), Count (individual items).",
        example: "Example: Flour = Weight, Milk = Volume, Eggs = Count."
    },
    purchasePrice: {
        title: "Purchase Price",
        content: "The total cost you paid for the purchased quantity of this raw material.",
        example: "Example: You paid ₱650 for 1kg of beef brisket, so enter 650."
    },
    purchaseQuantity: {
        title: "Purchase Quantity",
        content: "The amount you bought for the purchase price. Used to calculate cost per unit.",
        example: "Example: You bought 1kg of beef for ₱650, so enter 1. You bought 50 eggs for ₱500, so enter 50."
    },
    purchaseUnit: {
        title: "Purchase Unit",
        content: "The unit of measurement for the purchased quantity (e.g., kg, L, pieces).",
        example: "Example: For the 1kg beef package, select 'kg'. For the 50 eggs, select 'pc'. For 1L milk, select 'L'."
    },
    costPerUnit: {
        title: "Cost Per Unit (Yield-Inclusive)",
        content: "The calculated cost for one unit of measurement INCLUDING yield loss. Automatically calculated from purchase details and yield percentage.",
        example: "Example: Total recipe cost ₱100 for 500ml yield = ₱0.20 per ml. With 80% yield, cost becomes ₱0.25 per ml."
    },
    laborName: {
        title: "Direct Labor Name",
        content: "A descriptive name for the labor task (e.g., 'Kitchen Work', 'Prep Chef', 'Line Cook').",
        example: "Example: 'Kitchen Work', 'Prep Chef', 'Line Cook', 'Dishwasher'."
    },
    shiftRate: {
        title: "Shift Rate",
        content: "The total cost for one complete shift of this labor type.",
        example: "Example: If a kitchen worker costs ₱200 per 8-hour shift, enter 200."
    },
    shiftDuration: {
        title: "Shift Duration",
        content: "The length of one shift in the selected time unit.",
        example: "Example: For an 8-hour shift, enter 8 and select 'hours'. For a 480-minute shift, enter 480 and select 'minutes'."
    },
    timeUnit: {
        title: "Time Unit",
        content: "The unit of measurement for the shift duration (hours or minutes).",
        example: "Example: Select 'hours' for shifts measured in hours, 'minutes' for shifts measured in minutes."
    },
    costUnit: {
        title: "Cost Unit",
        content: "The unit of measurement for displaying the cost per unit (hours or minutes).",
        example: "Example: Select 'hours' to see cost per hour, 'minutes' to see cost per minute."
    },
    // REPLACED: Batch scaling with serving scale
    servingScale: {
        title: "Serving Scale",
        content: "The target number of servings you want to produce. The total cost will be calculated as: (Base Recipe Cost ÷ Base Servings) × Serving Scale. When loading a saved recipe, this automatically sets to match the recipe's base servings.",
        example: "Example: If your beef stew recipe costs $20.00 for 10 servings and you want to make 50 servings, enter 50. The cost will be calculated as ($20.00 ÷ 10) × 50 = $100.00 for 50 servings. When loading a 15-serving recipe, this automatically sets to 15."
    }
};

// DOM Elements - Will be initialized in initApp
let recipeBody, directLaborRecipeBody, rawMaterialsTotalEl, directLaborTotalEl, grandTotalEl, currencySelect;
let recipeNameInput, resetBtn, saveMainRecipeBtn, saveSubRecipeBtn;
let summaryRawMaterialsCost, summaryDirectLaborCost, summaryTotalCost, summaryCostServing, summarySellingPrice;
let summaryFoodCost, summaryLaborCostPercent, summaryTotalCostPercent, summaryGrossProfit;
let markupInput, taxInput, vatInput, servingsInput, servingScaleInput;
let summaryServingsDisplay, helpBtn, helpModal, helpModalTitle, helpModalContent, closeHelpBtn;
let printBtn, printPreviewModal, printPreviewContent;
let unifiedItemSelect, addIngredientQty, addIngredientUnit;
let directLaborSelect, timeRequirement, timeRequirementUnit;
let subRecipeSaveModal, subRecipeNameDisplay, subRecipeCategory, subRecipeYieldQuantity;
let subRecipeYieldUnit, subRecipeCostPerUnit, subRecipeCostUnit, currentRecipeCostDisplay, costPerOutputUnit;
let mainRecipesList, subRecipesList, editPromptModal, editPromptTitle, editPromptMessage;
let rawMaterialEditPromptModal, rawMaterialEditName, directLaborEditPromptModal, directLaborEditName;
let authModal, authModalTitle, authForm, authEmail, authPassword, authSubmitBtn, authError;
let authSwitchBtn, authSwitchText, forgotPasswordModal, forgotPasswordBtn, forgotPasswordEmail;
let forgotPasswordError, forgotPasswordSuccess, sendResetEmailBtn, togglePassword;
let loginBtn, logoutBtn, rawMaterialsPreviewBody, directLaborPreviewBody;
let rawMaterialsCount, directLaborCount, rawMaterialsPreviewTotal, directLaborPreviewTotal;
let rawMaterialsPreviewSubtotal, directLaborPreviewSubtotal, summaryRecipeSelect;
let loadedRecipeDisplay, currentRecipeNameDisplay, loadedRecipeTotalCost, loadedRecipeServings;
let loadedRecipeItemCount, summaryBatchRevenue, summaryBatchProfit;
let sidebarBtns, mobileTabBtns;

// Currency
let currency = "₱";

// Auth state
let isSignUpMode = false;

// FIX: Enhanced auth initialization with retry logic
async function initAuthSystem() {
    try {
        console.log("Initializing auth system...");
        
        // Wait for Supabase client to be ready
        if (!window.supabaseClient) {
            console.warn("Supabase client not ready, retrying...");
            setTimeout(initAuthSystem, 100);
            return;
        }
        
        // Setup auth event listeners
        setupAuthEventListeners();
        
        // Check current auth state
        await window.supabaseClient.checkAuthState();
        
        // Check for password reset tokens
        await window.supabaseClient.handlePasswordReset();
        
        console.log("✓ Auth system initialized");
    } catch (error) {
        console.error("✗ Auth initialization failed:", error);
        // Continue without auth - app should work locally
        updateAuthUI();
    }
}

// FIX: Enhanced auth event listeners
function setupAuthEventListeners() {
    console.log("Setting up auth event listeners...");
    
    // Login button
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', openAuthModal);
        console.log("✓ Login button listener attached");
    } else {
        console.error("✗ Login button not found!");
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Auth modal submit
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    if (authSubmitBtn) {
        authSubmitBtn.addEventListener('click', handleAuth);
    }

    // Auth mode toggle
    const authSwitchBtn = document.getElementById('authSwitchBtn');
    if (authSwitchBtn) {
        authSwitchBtn.addEventListener('click', toggleAuthMode);
    }

    // Forgot password
    const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', openForgotPasswordModal);
    }

    // Password reset submission
    const sendResetEmailBtn = document.getElementById('sendResetEmailBtn');
    if (sendResetEmailBtn) {
        sendResetEmailBtn.addEventListener('click', sendPasswordReset);
    }

    // Password visibility toggles
    setupPasswordToggles();
}

// NEW: Setup all password visibility toggles
function setupPasswordToggles() {
    // Auth modal password toggle
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            togglePasswordVisibilityGeneric('authPassword', this);
        });
    }

    // Reset password modal toggles
    const resetToggles = document.querySelectorAll('#resetPasswordModal .password-toggle');
    resetToggles.forEach((toggle, index) => {
        const fieldId = index === 0 ? 'newPassword' : 'confirmPassword';
        toggle.addEventListener('click', function() {
            togglePasswordVisibilityGeneric(fieldId, this);
        });
    });
}

// FIX: Enhanced navigation initialization
function setupNavigation() {
    console.log("Setting up navigation...");
    
    // Desktop sidebar navigation
    const sidebarBtns = document.querySelectorAll(".sidebar-btn");
    if (sidebarBtns.length > 0) {
        sidebarBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.currentTarget.dataset.tab;
                console.log("Sidebar navigation to:", tab);
                switchTab(tab);
            });
        });
        console.log("✓ Sidebar navigation initialized");
    } else {
        console.warn("✗ No sidebar buttons found");
    }

    // Mobile tabs navigation
    const mobileTabBtns = document.querySelectorAll(".mobile-tabs .tab-btn");
    if (mobileTabBtns.length > 0) {
        mobileTabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.currentTarget.dataset.tab;
                console.log("Mobile navigation to:", tab);
                switchTab(tab);
            });
        });
        console.log("✓ Mobile navigation initialized");
    } else {
        console.warn("✗ No mobile tab buttons found");
    }

    // Ensure first tab is active on load
    setTimeout(() => {
        const firstTab = document.querySelector('.tab-content.active');
        if (!firstTab) {
            switchTab('raw-materials');
        }
    }, 100);
}

// FIX: Comprehensive modal system
function setupModalSystem() {
    console.log("Setting up modal system...");
    
    const modals = [
        { id: "rawMaterialModal", closeFn: closeRawMaterialModal },
        { id: "directLaborModal", closeFn: closeDirectLaborModal },
        { id: "printPreviewModal", closeFn: closePrintPreview },
        { id: "subRecipeSaveModal", closeFn: closeSubRecipeSaveModal },
        { id: "editPromptModal", closeFn: closeEditPromptModal },
        { id: "rawMaterialEditPromptModal", closeFn: closeRawMaterialEditPromptModal },
        { id: "directLaborEditPromptModal", closeFn: closeDirectLaborEditPromptModal },
        { id: "authModal", closeFn: closeAuthModal },
        { id: "forgotPasswordModal", closeFn: closeForgotPasswordModal },
        { id: "resetPasswordModal", closeFn: closeResetPasswordModal },
        { id: "helpModal", closeFn: closeHelpModal }
    ];

    modals.forEach(modalConfig => {
        const modal = document.getElementById(modalConfig.id);
        if (modal) {
            // Background click to close
            modal.addEventListener("click", (e) => {
                if (e.target === modal) {
                    modalConfig.closeFn();
                }
            });

            // Escape key to close
            document.addEventListener("keydown", (e) => {
                if (e.key === "Escape" && modal.classList.contains('hidden') === false) {
                    modalConfig.closeFn();
                }
            });

            console.log(`✓ Modal ${modalConfig.id} initialized`);
        } else {
            console.warn(`✗ Modal ${modalConfig.id} not found`);
        }
    });

    // Help modal specific setup
    const helpBtn = document.getElementById('helpBtn');
    const closeHelpBtn = document.getElementById('closeHelp');
    
    if (helpBtn && closeHelpBtn) {
        helpBtn.addEventListener('click', openHelpModal);
        closeHelpBtn.addEventListener('click', closeHelpModal);
    }
    
    // ADD GLOBAL MODAL CLOSE FUNCTION
    window.closeAllModals = function() {
        modals.forEach(modalConfig => {
            const modal = document.getElementById(modalConfig.id);
            if (modal) modal.classList.add('hidden');
        });
    };
}

// NEW: Event delegation for dynamic content
function setupEventDelegation() {
    console.log("Setting up event delegation...");
    
    // Delegate for dynamically created delete buttons
    document.addEventListener('click', function(e) {
        // Recipe row delete buttons
        if (e.target.classList.contains('delRow')) {
            const row = e.target.closest('tr');
            if (row) {
                row.remove();
                recalc();
                saveCurrentRecipeState();
            }
        }
        
        // Direct labor row delete buttons
        if (e.target.classList.contains('delDirectLaborRow')) {
            const row = e.target.closest('tr');
            if (row) {
                row.remove();
                recalc();
                saveCurrentRecipeState();
            }
        }
        
        // Edit buttons
        if (e.target.classList.contains('edit-recipe-btn')) {
            const row = e.target.closest('tr');
            if (row) {
                const rowId = row.id;
                editRecipeRow(rowId);
            }
        }
        
        if (e.target.classList.contains('edit-labor-btn')) {
            const row = e.target.closest('tr');
            if (row) {
                const rowId = row.id;
                editDirectLaborRow(rowId);
            }
        }
    });
    
    // Input change delegation
    document.addEventListener('input', function(e) {
        if (e.target.matches('#recipeBody input[type="number"], #directLaborRecipeBody input[type="number"]')) {
            recalc();
            saveCurrentRecipeState();
        }
    });
}

// NEW: Open help modal function
function openHelpModal() {
    const helpModal = document.getElementById('helpModal');
    const helpModalContent = document.getElementById('helpModalContent');
    
    if (helpModal && helpModalContent) {
        helpModalContent.innerHTML = generateCompleteHelpContent();
        helpModal.classList.remove('hidden');
    }
}

// FIX: Comprehensive button initialization
function setupButtonHandlers() {
    console.log("Setting up button handlers...");
    
    // Raw Material buttons
    const saveRawMaterialBtn = document.getElementById('saveRawMaterialBtn');
    if (saveRawMaterialBtn) {
        saveRawMaterialBtn.addEventListener('click', saveRawMaterial);
    }

    // Direct Labor buttons
    const saveDirectLaborBtn = document.getElementById('saveDirectLaborBtn');
    if (saveDirectLaborBtn) {
        saveDirectLaborBtn.addEventListener('click', saveDirectLabor);
    }

    // Recipe buttons
    const saveMainRecipeBtn = document.getElementById('saveMainRecipeBtn');
    const saveSubRecipeBtn = document.getElementById('saveSubRecipeBtn');
    const resetBtn = document.getElementById('resetRecipe');
    
    if (saveMainRecipeBtn) {
        saveMainRecipeBtn.addEventListener('click', () => {
            if (!recipeNameInput?.value?.trim()) {
                alert("Please enter a recipe name before saving");
                recipeNameInput?.focus();
                return;
            }
            saveRecipe('main');
        });
    }
    
    if (saveSubRecipeBtn) {
        saveSubRecipeBtn.addEventListener('click', openSubRecipeSaveModal);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetRecipe);
    }

    // Print button
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', generatePrintPreview);
    }

    // Summary recipe load button
    const loadRecipeBtn = document.querySelector('.load-recipe-controls button');
    if (loadRecipeBtn) {
        loadRecipeBtn.addEventListener('click', loadRecipeForSummary);
    }

    console.log("✓ Button handlers initialized");
}

// FIX: Enhanced app initialization
async function initApp() {
    console.log("🚀 Initializing ProfitPerPlate...");
    
    try {
        // Phase 1: DOM Initialization
        console.log("Phase 1: DOM Initialization");
        initializeDOMElements();
        
        // Phase 2: Theme & UI
        console.log("Phase 2: Theme & UI");
        loadTheme();
        setupDarkModeToggle();
        
        // Phase 3: Core Systems
        console.log("Phase 3: Core Systems");
        await initAuthSystem();
        setupNavigation();
        setupModalSystem();
        setupEventDelegation(); // NEW: Added event delegation
        setupButtonHandlers();
        
        // Phase 4: Data & Content
        console.log("Phase 4: Data & Content");
        await loadUserData();
        renderAllData();
        populateUnifiedItemSelect();
        populateDirectLaborSelect();
        populateSummaryRecipeSelect();
        
        // Phase 5: Final Setup
        console.log("Phase 5: Final Setup");
        setupBeforeUnloadListener();
        changeSummaryTerminology();
        
        // Load current recipe state LAST
        loadCurrentRecipeState();
        
        console.log("✅ App initialization completed successfully");
        
    } catch (error) {
        console.error("❌ App initialization failed:", error);
        showNotification("App initialization failed. Some features may not work.", "error");
    }
}

// NEW: Dark mode toggle setup
function setupDarkModeToggle() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleTheme);
        console.log("✓ Dark mode toggle initialized");
    }
}

// NEW: Change Summary Tab terminology
function changeSummaryTerminology() {
    // Change labels for Total Revenue and Total Profit
    const batchProfitAnalysisLabels = document.querySelectorAll('.batch-profit-analysis label');
    if (batchProfitAnalysisLabels.length >= 2) {
        batchProfitAnalysisLabels[0].textContent = 'Total Revenue:';
        batchProfitAnalysisLabels[1].textContent = 'Total Profit:';
    }
    // Remove the batch profit margin row
    const batchProfitMarginRow = document.querySelector('.batch-profit-analysis:nth-child(3)');
    if (batchProfitMarginRow) {
        batchProfitMarginRow.remove();
    }
}

// NEW: Setup beforeunload listener for final save
function setupBeforeUnloadListener() {
    window.addEventListener('beforeunload', (event) => {
        // Save current state before leaving
        saveCurrentRecipeState();
    });
}

// NEW: Get current active tab
function getCurrentActiveTab() {
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        return activeTab.id.replace('-tab', '');
    }
    return 'raw-materials'; // Default tab
}

// =============================================================================
// FIX: CORRECTED DOM ELEMENT INITIALIZATION WITH FALLBACK FOR servingScaleInput
// =============================================================================
function initializeDOMElements() {
    console.log("Initializing DOM elements...");
    
    try {
        // Core recipe elements
        recipeBody = document.getElementById("recipeBody");
        if (!recipeBody) console.warn("recipeBody not found");
        
        directLaborRecipeBody = document.getElementById("directLaborRecipeBody");
        rawMaterialsTotalEl = document.getElementById("rawMaterialsTotal");
        directLaborTotalEl = document.getElementById("directLaborTotal");
        grandTotalEl = document.getElementById("grandTotal");
        currencySelect = document.getElementById("currencySelect");
        recipeNameInput = document.getElementById("recipeName");
        resetBtn = document.getElementById("resetRecipe");
        saveMainRecipeBtn = document.getElementById("saveMainRecipeBtn");
        saveSubRecipeBtn = document.getElementById("saveSubRecipeBtn");

        // Summary display elements
        summaryRawMaterialsCost = document.getElementById("summaryRawMaterialsCost");
        summaryDirectLaborCost = document.getElementById("summaryDirectLaborCost");
        summaryTotalCost = document.getElementById("summaryTotalCost");
        summaryCostServing = document.getElementById("summaryCostServing");
        summarySellingPrice = document.getElementById("summarySellingPrice");
        summaryFoodCost = document.getElementById("summaryFoodCost");
        summaryLaborCostPercent = document.getElementById("summaryLaborCostPercent");
        summaryTotalCostPercent = document.getElementById("summaryTotalCostPercent");
        summaryGrossProfit = document.getElementById("summaryGrossProfit");
        
        // Input controls
        markupInput = document.getElementById("markup");
        taxInput = document.getElementById("tax");
        vatInput = document.getElementById("vat");
        servingsInput = document.getElementById("servings");
        
        // CRITICAL FIX: Ensure servingScale input exists with fallback
        servingScaleInput = document.getElementById("servingScale");
        if (!servingScaleInput) {
            console.error("servingScale input not found - creating fallback");
            servingScaleInput = document.createElement('input');
            servingScaleInput.id = 'servingScale';
            servingScaleInput.type = 'number';
            servingScaleInput.value = '1';
            servingScaleInput.min = '1';
            servingScaleInput.className = 'hidden';
            document.body.appendChild(servingScaleInput);
        }
        
        summaryServingsDisplay = document.getElementById("summaryServingsDisplay");

        // Modal and UI elements
        helpBtn = document.getElementById("helpBtn");
        helpModal = document.getElementById("helpModal");
        helpModalTitle = document.getElementById("helpModalTitle");
        helpModalContent = document.getElementById("helpModalContent");
        closeHelpBtn = document.getElementById("closeHelp");
        printBtn = document.getElementById("printBtn");
        printPreviewModal = document.getElementById("printPreviewModal");
        printPreviewContent = document.getElementById("printPreviewContent");

        // Recipe ingredient selection
        unifiedItemSelect = document.getElementById("unifiedItemSelect");
        addIngredientQty = document.getElementById("addIngredientQty");
        addIngredientUnit = document.getElementById("addIngredientUnit");

        // Direct labor selection
        directLaborSelect = document.getElementById("directLaborSelect");
        timeRequirement = document.getElementById("timeRequirement");
        timeRequirementUnit = document.getElementById("timeRequirementUnit");

        // Sub-recipe modal
        subRecipeSaveModal = document.getElementById("subRecipeSaveModal");
        subRecipeNameDisplay = document.getElementById("subRecipeNameDisplay");
        subRecipeCategory = document.getElementById("subRecipeCategory");
        subRecipeYieldQuantity = document.getElementById("subRecipeYieldQuantity");
        subRecipeYieldUnit = document.getElementById("subRecipeYieldUnit");
        subRecipeCostPerUnit = document.getElementById("subRecipeCostPerUnit");
        subRecipeCostUnit = document.getElementById("subRecipeCostUnit");
        currentRecipeCostDisplay = document.getElementById("currentRecipeCostDisplay");
        costPerOutputUnit = document.getElementById("costPerOutputUnit");

        // Recipe lists
        mainRecipesList = document.getElementById("mainRecipesList");
        subRecipesList = document.getElementById("subRecipesList");

        // Edit prompts
        editPromptModal = document.getElementById("editPromptModal");
        editPromptTitle = document.getElementById("editPromptTitle");
        editPromptMessage = document.getElementById("editPromptMessage");

        rawMaterialEditPromptModal = document.getElementById("rawMaterialEditPromptModal");
        rawMaterialEditName = document.getElementById("rawMaterialEditName");

        directLaborEditPromptModal = document.getElementById("directLaborEditPromptModal");
        directLaborEditName = document.getElementById("directLaborEditName");

        // Auth elements
        authModal = document.getElementById("authModal");
        authModalTitle = document.getElementById("authModalTitle");
        authForm = document.getElementById("authForm");
        authEmail = document.getElementById("authEmail");
        authPassword = document.getElementById("authPassword");
        authSubmitBtn = document.getElementById("authSubmitBtn");
        authError = document.getElementById("authError");
        authSwitchBtn = document.getElementById("authSwitchBtn");
        authSwitchText = document.getElementById("authSwitchText");

        // Password reset
        forgotPasswordModal = document.getElementById("forgotPasswordModal");
        forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
        forgotPasswordEmail = document.getElementById("forgotPasswordEmail");
        forgotPasswordError = document.getElementById("forgotPasswordError");
        forgotPasswordSuccess = document.getElementById("forgotPasswordSuccess");
        sendResetEmailBtn = document.getElementById("sendResetEmailBtn");

        togglePassword = document.getElementById("togglePassword");

        // Auth buttons - ONLY INITIALIZE EXISTING ELEMENTS
        loginBtn = document.getElementById("loginBtn");
        logoutBtn = document.getElementById("logoutBtn");

        // Cost breakdown preview
        rawMaterialsPreviewBody = document.getElementById("rawMaterialsPreviewBody");
        directLaborPreviewBody = document.getElementById("directLaborPreviewBody");
        rawMaterialsCount = document.getElementById("rawMaterialsCount");
        directLaborCount = document.getElementById("directLaborCount");
        rawMaterialsPreviewTotal = document.getElementById("rawMaterialsPreviewTotal");
        directLaborPreviewTotal = document.getElementById("directLaborPreviewTotal");
        rawMaterialsPreviewSubtotal = document.getElementById("rawMaterialsPreviewSubtotal");
        directLaborPreviewSubtotal = document.getElementById("directLaborPreviewSubtotal");

        // Summary recipe selection
        summaryRecipeSelect = document.getElementById("summaryRecipeSelect");
        loadedRecipeDisplay = document.getElementById("loadedRecipeDisplay");
        currentRecipeNameDisplay = document.getElementById("currentRecipeNameDisplay");
        loadedRecipeTotalCost = document.getElementById("loadedRecipeTotalCost");
        loadedRecipeServings = document.getElementById("loadedRecipeServings");
        loadedRecipeItemCount = document.getElementById("loadedRecipeItemCount");

        // Batch analysis - ONLY INITIALIZE EXISTING ELEMENTS
        summaryBatchRevenue = document.getElementById("summaryBatchRevenue");
        summaryBatchProfit = document.getElementById("summaryBatchProfit");

        // Navigation
        sidebarBtns = document.querySelectorAll(".sidebar-btn");
        mobileTabBtns = document.querySelectorAll(".mobile-tabs .tab-btn");
        
        console.log("DOM element initialization completed");
    } catch (error) {
        console.error("DOM initialization failed:", error);
        showNotification("UI initialization failed - some features may not work", "error");
    }
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
    
    // Set initial dark mode icon
    const darkModeIcon = document.querySelector('#darkModeToggle svg');
    if (darkModeIcon) {
        if (isDark) {
            darkModeIcon.innerHTML = '<path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
        } else {
            darkModeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
        }
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem("profitPerPlate_theme", isDark ? 'dark' : 'light');
    
    // Update dark mode icon
    const darkModeIcon = document.querySelector('#darkModeToggle svg');
    if (isDark) {
        // Switch to sun icon for light mode
        darkModeIcon.innerHTML = '<path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    } else {
        // Switch to moon icon for dark mode
        darkModeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    }
}

// NEW: Password Toggle Function
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('authPassword');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Update icon
    const icon = togglePassword.querySelector('svg');
    if (type === 'text') {
        icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
        icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
}

// NEW: Enhanced password toggle function for multiple fields
function togglePasswordVisibilityGeneric(fieldId, button) {
    const passwordInput = document.getElementById(fieldId);
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Update icon
    const icon = button.querySelector('svg');
    if (type === 'text') {
        icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
    } else {
        icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
    }
}

// NEW: Forgot Password Functions
function openForgotPasswordModal() {
    closeAuthModal();
    forgotPasswordModal.classList.remove("hidden");
}

function closeForgotPasswordModal() {
    forgotPasswordModal.classList.add("hidden");
    forgotPasswordEmail.value = '';
    forgotPasswordError.classList.add("hidden");
    forgotPasswordSuccess.classList.add("hidden");
}

async function sendPasswordReset() {
    const email = forgotPasswordEmail.value.trim();
    
    if (!email) {
        showForgotPasswordError("Please enter your email address");
        return;
    }
    
    sendResetEmailBtn.disabled = true;
    sendResetEmailBtn.textContent = "Sending...";
    
    const result = await window.supabaseClient.resetPassword(email);
    
    sendResetEmailBtn.disabled = false;
    sendResetEmailBtn.textContent = "Send Reset Link";
    
    if (result.success) {
        forgotPasswordSuccess.textContent = "Password reset email sent! Check your inbox for further instructions.";
        forgotPasswordSuccess.classList.remove("hidden");
        forgotPasswordError.classList.add("hidden");
    } else {
        showForgotPasswordError(result.error);
    }
}

function showForgotPasswordError(message) {
    forgotPasswordError.textContent = message;
    forgotPasswordError.classList.remove("hidden");
    forgotPasswordSuccess.classList.add("hidden");
}

// NEW: Reset Password Modal Functions
function showResetPasswordModal() {
    closeAllModals();
    document.getElementById('resetPasswordModal').classList.remove('hidden');
}

function closeResetPasswordModal() {
    document.getElementById('resetPasswordModal').classList.add('hidden');
    document.getElementById('resetPasswordForm').reset();
    document.getElementById('resetPasswordError').classList.add('hidden');
    document.getElementById('resetPasswordSuccess').classList.add('hidden');
}

// Handle password reset submission
async function handlePasswordReset() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!newPassword || !confirmPassword) {
        showResetPasswordError('Please enter both fields');
        return;
    }
    
    if (newPassword.length < 6) {
        showResetPasswordError('Password must be at least 6 characters long');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showResetPasswordError('Passwords do not match');
        return;
    }
    
    const submitBtn = document.getElementById('submitResetPasswordBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = "Resetting...";
    
    // Use Supabase to update the password
    const { data, error } = await window.supabaseClient.supabase.auth.updateUser({
        password: newPassword
    });
    
    submitBtn.disabled = false;
    submitBtn.textContent = "Reset Password";
    
    if (error) {
        showResetPasswordError(error.message);
    } else {
        document.getElementById('resetPasswordError').classList.add('hidden');
        document.getElementById('resetPasswordSuccess').textContent = 'Password reset successfully! You can now log in with your new password.';
        document.getElementById('resetPasswordSuccess').classList.remove('hidden');
        
        // Close the modal after a delay
        setTimeout(() => {
            closeResetPasswordModal();
            // Show login modal
            openAuthModal();
        }, 2000);
    }
}

function showResetPasswordError(message) {
    const errorEl = document.getElementById('resetPasswordError');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    document.getElementById('resetPasswordSuccess').classList.add('hidden');
}

// Utility function to close all modals
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
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
        
        // Update UI
        renderAllData();
        populateUnifiedItemSelect();
        populateDirectLaborSelect();
        populateSummaryRecipeSelect();
        
        // Load current recipe state
        loadCurrentRecipeState();
        
        recalc();
        
        // NEW: Clear cost breakdown preview on load
        clearCostBreakdownPreview();
    }
}

// =============================================================================
// FIX: ENHANCED STATE PERSISTENCE FOR SUMMARY TAB
// =============================================================================
function saveCurrentRecipeState() {
    // Get current recipe items
    const rawMaterialItems = [];
    const directLaborItems = [];
    
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit")?.textContent || "g";
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0; // FIXED: Index 3 for unit cost (after yield column)
        const type = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        if (type === 'rawMaterial' || type === 'sub-recipe') {
            rawMaterialItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
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
    
    // ENHANCED: Save current recipe state with additional UI state and loaded recipe
    userData.currentRecipeState = {
        recipeName: recipeNameInput.value || "",
        rawMaterialItems: rawMaterialItems,
        directLaborItems: directLaborItems,
        markup: parseFloat(markupInput.value) || 40,
        tax: parseFloat(taxInput.value) || 0,
        vat: parseFloat(vatInput.value) || 0,
        servings: parseFloat(servingsInput.value) || 1,
        servingScale: parseFloat(servingScaleInput.value) || 1,
        currentTab: getCurrentActiveTab(),
        loadedRecipeForSummary: loadedRecipeForSummary, // NEW: Persist loaded recipe
        lastSaved: new Date().toISOString()
    };
    
    saveUserData();
}

// =============================================================================
// FIX: ENHANCED LOAD FUNCTION WITH NaN PREVENTION
// =============================================================================
function loadCurrentRecipeState() {
    if (!userData.currentRecipeState) return;
    
    const state = userData.currentRecipeState;
    
    // Restore recipe name and summary inputs with validation
    recipeNameInput.value = state.recipeName || "";
    markupInput.value = state.markup || 40;
    taxInput.value = state.tax || 0;
    vatInput.value = state.vat || 0;
    servingsInput.value = state.servings || 1;
    servingScaleInput.value = state.servingScale || 1;
    
    // NEW: Restore loaded recipe for summary if it exists
    if (state.loadedRecipeForSummary) {
        loadedRecipeForSummary = state.loadedRecipeForSummary;
        // Update summary display to reflect loaded recipe
        updateLoadedRecipeDisplay();
    }
    
    // Clear current recipe tables
    recipeBody.innerHTML = "";
    directLaborRecipeBody.innerHTML = "";
    
    // Restore raw material items with validation
    if (state.rawMaterialItems) {
        state.rawMaterialItems.forEach(item => {
            // Validate data before adding
            if (item.name && !isNaN(item.quantity) && !isNaN(item.unitCost)) {
                addRow(
                    item.name,
                    item.quantity,
                    item.unit,
                    item.unitCost,
                    item.type || 'rawMaterial',
                    item.subRecipeId || null
                );
            }
        });
    }
    
    // Restore direct labor items with validation
    if (state.directLaborItems) {
        state.directLaborItems.forEach(item => {
            // Validate data before adding
            if (item.name && !isNaN(item.quantity) && !isNaN(item.rate)) {
                const labor = userData.directLabor.find(l => l.name === item.name);
                if (labor) {
                    addDirectLaborRow(
                        item.name,
                        item.quantity,
                        item.unit,
                        item.rate
                    );
                }
            }
        });
    }
    
    // Restore active tab if available
    if (state.currentTab) {
        setTimeout(() => {
            switchTab(state.currentTab);
        }, 100);
    }
    
    // Recalculate after loading
    recalc();
    
    // Update cost breakdown preview if recipe is loaded
    if (loadedRecipeForSummary) {
        updateCostBreakdownPreview();
    }
}

// =============================================================================
// FIX: ENHANCED DUPLICATE DETECTION HELPER FUNCTION
// =============================================================================
function checkForDuplicateName(name, items, currentId = null) {
    if (!name || !items || !Array.isArray(items)) {
        console.warn("Invalid parameters for duplicate check:", { name, items, currentId });
        return null;
    }
    
    const normalizedSearchName = name.toLowerCase().trim();
    
    return items.find(item => {
        if (!item || !item.name) return false;
        
        const normalizedItemName = item.name.toLowerCase().trim();
        const isSameId = currentId ? item.id === currentId : false;
        
        return normalizedItemName === normalizedSearchName && !isSameId;
    });
}

// ENHANCED: Reset Function
function resetRecipe() {
    if (!confirm("Reset entire recipe? This will clear all items and reset servings to 1.")) return;
    
    // Clear recipe tables
    recipeBody.innerHTML = "";
    directLaborRecipeBody.innerHTML = "";
    
    // Reset recipe name
    recipeNameInput.value = "";
    
    // Reset servings to 1
    servingsInput.value = "1";
    
    // Clear editing state
    editingItem = { type: null, id: null, data: null };
    
    // Clear current editing rows
    window.currentEditingRow = null;
    window.currentEditingLaborRow = null;
    
    // Reset add buttons to normal state
    const addRecipeButton = document.querySelector('.add-ingredient-section .btn-primary');
    if (addRecipeButton) {
        addRecipeButton.textContent = 'Add to Recipe';
        addRecipeButton.onclick = addItemToRecipe;
    }
    
    const addLaborButton = document.querySelector('.add-labor-section .btn-primary');
    if (addLaborButton) {
        addLaborButton.textContent = 'Add Direct Labor';
        addLaborButton.onclick = addDirectLaborToRecipe;
    }
    
    // Recalculate
    recalc();
    
    // Clear cost breakdown preview if no recipe is loaded
    if (!loadedRecipeForSummary) {
        clearCostBreakdownPreview();
    }
    
    // Auto-save cleared state
    saveCurrentRecipeState();
    
    // Show confirmation
    showNotification("Recipe reset successfully");
}

// NEW: Auto-Reset After Save
function autoResetAfterSave() {
    setTimeout(() => {
        resetRecipe();
    }, 500);
}

// NEW: Dependency Tracking System
function updateRecipesUsingIngredient(updatedItem, itemType) {
    const recipes = getCurrentRecipes();
    let updatedRecipes = [];
    let hasUpdates = false;
    let updatedCount = 0;

    recipes.forEach(recipe => {
        let recipeUpdated = false;
        
        // Update raw material items in recipes
        if (recipe.rawMaterialItems) {
            recipe.rawMaterialItems.forEach(item => {
                if (item.type === itemType && item.name === updatedItem.name) {
                    item.unitCost = updatedItem.costPerUnit;
                    recipeUpdated = true;
                }
                
                // Also update sub-recipes that use this ingredient
                if (item.type === 'sub-recipe') {
                    const subRecipe = recipes.find(r => r.id === item.subRecipeId);
                    if (subRecipe && subRecipe.rawMaterialItems) {
                        subRecipe.rawMaterialItems.forEach(subItem => {
                            if (subItem.name === updatedItem.name) {
                                subItem.unitCost = updatedItem.costPerUnit;
                                recipeUpdated = true;
                            }
                        });
                    }
                }
            });
        }
        
        // Update direct labor items in recipes
        if (recipe.directLaborItems) {
            recipe.directLaborItems.forEach(item => {
                if (item.name === updatedItem.name) {
                    item.unitCost = updatedItem.costPerUnit;
                    recipeUpdated = true;
                }
            });
        }
        
        // Recalculate total cost if recipe was updated
        if (recipeUpdated) {
            recipe.totalCost = calculateRecipeTotalCost(recipe);
            hasUpdates = true;
            updatedCount++;
        }
        
        updatedRecipes.push(recipe);
    });

    if (hasUpdates) {
        setCurrentRecipes(updatedRecipes);
        renderRecipesList();
        populateUnifiedItemSelect();
        populateSummaryRecipeSelect();
        
        // Show notification
        showNotification(`Automatically updated ${updatedCount} recipe(s) using "${updatedItem.name}"`);
        
        // Update summary if the loaded recipe was affected
        if (loadedRecipeForSummary) {
            const loadedRecipe = updatedRecipes.find(r => r.id === loadedRecipeForSummary.id);
            if (loadedRecipe) {
                loadedRecipeForSummary = loadedRecipe;
                updateLoadedRecipeSummary();
                updateCostBreakdownPreview();
            }
        }
    }
}

// NEW: Calculate total cost for a recipe object
function calculateRecipeTotalCost(recipe) {
    let totalCost = 0;
    
    // Sum raw material costs (yield-inclusive costs)
    if (recipe.rawMaterialItems) {
        recipe.rawMaterialItems.forEach(item => {
            totalCost += item.quantity * item.unitCost; // Unit cost already includes yield
        });
    }
    
    // Sum direct labor costs
    if (recipe.directLaborItems) {
        recipe.directLaborItems.forEach(item => {
            totalCost += item.quantity * item.unitCost;
        });
    }
    
    return parseFloat(totalCost.toFixed(2));
}

// NEW: Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.global-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `global-notification ${type}`;
    
    // Add network status indicator for offline messages
    const networkIcon = !window.supabaseClient.isOnline() ? '📶 ' : '';
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${networkIcon}${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .global-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: var(--radius-lg);
                padding: var(--space-md);
                box-shadow: var(--shadow-xl);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                max-width: 400px;
            }
            
            .global-notification.success {
                border-left: 4px solid var(--success);
            }
            
            .global-notification.info {
                border-left: 4px solid var(--accent-blue);
            }
            
            .global-notification.warning {
                border-left: 4px solid var(--warning);
            }
            
            .global-notification.error {
                border-left: 4px solid var(--danger);
            }
            
            .notification-content {
                display: flex;
                align-items: flex-start;
                gap: var(--space-sm);
            }
            
            .notification-message {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--radius-sm);
            }
            
            .notification-close:hover {
                background: var(--primary-light);
                color: var(--text-primary);
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after appropriate time
    const duration = type === 'info' ? 3000 : 5000;
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

// Helper functions to get current data
function getCurrentRawMaterials() {
    return userData.rawMaterials || [];
}

function getCurrentDirectLabor() {
    return userData.directLabor || [];
}

function getCurrentRecipes() {
    return userData.recipes || [];
}

function setCurrentRawMaterials(rawMaterials) {
    userData.rawMaterials = rawMaterials;
    saveUserData();
}

function setCurrentDirectLabor(directLabor) {
    userData.directLabor = directLabor;
    saveUserData();
}

function setCurrentRecipes(recipes) {
    userData.recipes = recipes;
    saveUserData();
}

// NEW: Raw Material Edit Prompt Functions
function showRawMaterialEditPrompt(id, name) {
    rawMaterialEditName.textContent = name;
    editingItem = { type: 'rawMaterial', id: id, data: null };
    rawMaterialEditPromptModal.classList.remove("hidden");
}

function closeRawMaterialEditPromptModal() {
    rawMaterialEditPromptModal.classList.add("hidden");
}

function handleRawMaterialEditChoice(choice) {
    closeRawMaterialEditPromptModal();
    
    if (choice === 'replace') {
        // Replace existing raw material
        updateRawMaterial();
    } else if (choice === 'new') {
        // Save as new raw material (generate new ID)
        editingItem.id = null;
        saveRawMaterial();
    }
}

// NEW: Direct Labor Edit Prompt Functions
function showDirectLaborEditPrompt(id, name) {
    directLaborEditName.textContent = name;
    editingItem = { type: 'directLabor', id: id, data: null };
    directLaborEditPromptModal.classList.remove("hidden");
}

function closeDirectLaborEditPromptModal() {
    directLaborEditPromptModal.classList.add("hidden");
}

function handleDirectLaborEditChoice(choice) {
    closeDirectLaborEditPromptModal();
    
    if (choice === 'replace') {
        // Replace existing direct labor
        updateDirectLabor();
    } else if (choice === 'new') {
        // Save as new direct labor (generate new ID)
        editingItem.id = null;
        saveDirectLabor();
    }
}

// =============================================================================
// FIX: ENHANCED SAVE RAW MATERIAL WITH AUTOMATIC DUPLICATE DETECTION
// =============================================================================
function saveRawMaterial() {
    const name = document.getElementById("modalRawMaterialName").value.trim();
    const category = document.getElementById("modalRawMaterialCategory").value;
    const price = parseFloat(document.getElementById("modalRawMaterialPrice").value);
    const quantity = parseFloat(document.getElementById("modalRawMaterialQuantity").value);
    const unit = document.getElementById("modalRawMaterialUnit").value;
    const costPerUnit = parseFloat(document.getElementById("modalCostPerUnit").value);
    const costUnit = document.getElementById("modalCostUnit").value;
    const yieldPercentage = parseFloat(document.getElementById("modalRawMaterialYield").value) || 100;

    // Validation
    if (!name || !category || isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
        alert("Please fill in all required fields with valid values");
        return;
    }

    const rawMaterialData = {
        id: Date.now(),
        name,
        category,
        price: parseFloat(price.toFixed(2)),
        quantity: parseFloat(quantity.toFixed(2)),
        unit,
        costPerUnit: parseFloat(costPerUnit.toFixed(6)),
        costUnit,
        yieldPercentage: parseFloat(yieldPercentage.toFixed(1))
    };

    // Save to data store
    const rawMaterials = getCurrentRawMaterials();
    
    // NEW: Automatic duplicate detection and handling
    const existingItem = checkForDuplicateName(name, rawMaterials, editingItem.id);
    
    if (existingItem && !editingItem.id) {
        // Show duplicate prompt for new items
        showRawMaterialEditPrompt(existingItem.id, name);
        return;
    }
    
    if (editingItem.type === 'rawMaterial' && editingItem.id) {
        // Update existing
        const index = rawMaterials.findIndex(item => item.id === editingItem.id);
        if (index !== -1) {
            rawMaterials[index] = rawMaterialData;
            showNotification(`Updated "${name}" with ${yieldPercentage}% yield`, "success");
        }
    } else {
        // Add new
        rawMaterials.push(rawMaterialData);
        showNotification(`Added "${name}" with ${yieldPercentage}% yield`, "success");
    }
    
    setCurrentRawMaterials(rawMaterials);
    renderRawMaterials();
    populateUnifiedItemSelect();
    closeRawMaterialModal();
    
    // Show cost impact explanation for non-100% yields
    if (yieldPercentage !== 100) {
        const baseCost = (price / quantity).toFixed(4);
        const effectiveCost = costPerUnit.toFixed(4);
        console.log(`Yield impact: ${baseCost} → ${effectiveCost} (${yieldPercentage}% yield)`);
    }
}

// NEW: Update raw material function
function updateRawMaterial() {
    const name = document.getElementById("modalRawMaterialName").value.trim();
    const category = document.getElementById("modalRawMaterialCategory").value;
    const price = parseFloat(document.getElementById("modalRawMaterialPrice").value);
    const quantity = parseFloat(document.getElementById("modalRawMaterialQuantity").value);
    const unit = document.getElementById("modalRawMaterialUnit").value;
    const costPerUnit = parseFloat(document.getElementById("modalCostPerUnit").value);
    const costUnit = document.getElementById("modalCostUnit").value;
    const yieldPercentage = parseFloat(document.getElementById("modalRawMaterialYield").value) || 100;

    const rawMaterials = getCurrentRawMaterials();
    const index = rawMaterials.findIndex(item => item.id === editingItem.id);
    
    if (index !== -1) {
        const updatedItem = {
            id: editingItem.id,
            name,
            category,
            price: parseFloat(price.toFixed(2)),
            quantity: parseFloat(quantity.toFixed(2)),
            unit,
            costPerUnit: parseFloat(costPerUnit.toFixed(6)),
            costUnit,
            yieldPercentage: parseFloat(yieldPercentage.toFixed(1))
        };
        
        rawMaterials[index] = updatedItem;
        setCurrentRawMaterials(rawMaterials);
        
        renderRawMaterials();
        populateUnifiedItemSelect();
        closeRawMaterialModal();
        
        // Update recipes using this ingredient
        updateRecipesUsingIngredient(updatedItem, 'rawMaterial');
        
        showNotification(`Updated "${name}" with ${yieldPercentage}% yield`, "success");
    }
}

function deleteRawMaterial(id) {
    if (confirm("Are you sure you want to delete this raw material?")) {
        const rawMaterials = getCurrentRawMaterials();
        const updatedRawMaterials = rawMaterials.filter((item) => item.id !== id);
        setCurrentRawMaterials(updatedRawMaterials);
        renderRawMaterials();
        populateUnifiedItemSelect();
        
        // NEW: Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
        
        showNotification("Raw material deleted successfully!", "success");
    }
}

// ENHANCED: Render raw materials with alphabetical sorting and yield column
function renderRawMaterials() {
    const tableBody = document.getElementById("rawMaterialsTable");
    let filteredRawMaterials = filterRawMaterials();
  
    // NEW: Apply alphabetical sorting
    filteredRawMaterials = sortRawMaterialsAlphabetically(filteredRawMaterials);

    tableBody.innerHTML = filteredRawMaterials
        .map(
            (rawMaterial) => `
                <tr>
                    <td data-label="Raw Material">${rawMaterial.name}</td>
                    <td data-label="Category">${rawMaterial.category}</td>
                    <td data-label="Yield">${rawMaterial.yieldPercentage || 100}%</td> <!-- NEW: Display yield -->
                    <td data-label="Cost/Unit">${formatCurrency(
                        rawMaterial.costPerUnit
                    )}/${rawMaterial.costUnit}</td>
                    <td data-label="Actions">
                        <button class="btn-secondary small" onclick="openRawMaterialModal(${JSON.stringify(
                            rawMaterial
                        ).replace(/"/g, "&quot;")})">Edit</button>
                        <button class="btn-danger small" onclick="deleteRawMaterial(${
                            rawMaterial.id
                        })">Delete</button>
                    </td>
                </tr>
            `
        )
        .join("");
}

function filterRawMaterials() {
    const searchTerm = document
        .getElementById("rawMaterialSearch")
        .value.toLowerCase();
    const rawMaterials = getCurrentRawMaterials();
    return rawMaterials.filter(
        (rawMaterial) =>
            rawMaterial.name.toLowerCase().includes(searchTerm) ||
            rawMaterial.category.toLowerCase().includes(searchTerm)
    );
}

// Direct Labor Management
function openDirectLaborModal(directLabor = null) {
    const modal = document.getElementById("directLaborModal");
    const title = document.getElementById("directLaborModalTitle");

    if (directLabor) {
        title.textContent = "Edit Direct Labor";
        populateDirectLaborForm(directLabor);
        editingItem = { type: 'directLabor', id: directLabor.id, data: directLabor };
    } else {
        title.textContent = "Add New Direct Labor";
        document.getElementById("directLaborForm").reset();
        updateLaborCostPerUnit();
        editingItem = { type: null, id: null, data: null };
    }

    modal.classList.remove("hidden");
}

function closeDirectLaborModal() {
    document.getElementById("directLaborModal").classList.add("hidden");
    document.getElementById("directLaborForm").reset();
    editingItem = { type: null, id: null, data: null };
}

// Calculate and display cost per unit for direct labor
function updateLaborCostPerUnit() {
    const shiftRate =
        parseFloat(document.getElementById("modalShiftRate").value) || 0;
    const shiftDuration =
        parseFloat(document.getElementById("modalShiftDuration").value) || 1;
    const timeUnit = document.getElementById("modalTimeUnit").value;
    const costUnit = document.getElementById("modalCostUnitLabor").value;

    let costPerUnit = 0;
    let calculationSteps = [];

    if (shiftRate > 0 && shiftDuration > 0) {
        const costPerTimeUnit = shiftRate / shiftDuration;
        calculationSteps.push(
            `Cost per ${timeUnit}: ${shiftRate.toFixed(2)} ${currency} ÷ ${shiftDuration.toFixed(2)} = ${costPerTimeUnit.toFixed(4)} ${currency}/${timeUnit}`
        );

        if (timeUnit !== costUnit) {
            const conversionFactor = UNIT_CONVERSIONS[costUnit] / UNIT_CONVERSIONS[timeUnit];
            costPerUnit = costPerTimeUnit * conversionFactor;
            calculationSteps.push(
                `Convert to ${costUnit}: ${costPerTimeUnit.toFixed(4)} ${currency}/${timeUnit} × ${conversionFactor.toFixed(6)} = ${costPerUnit.toFixed(4)} ${currency}/${costUnit}`
            );
        } else {
            costPerUnit = costPerTimeUnit;
            calculationSteps.push(
                `No conversion needed (already in ${costUnit})`
            );
        }
    }

    document.getElementById("modalCostPerUnitLabor").value = costPerUnit.toFixed(4);

    updateLaborCalculationDisplay(calculationSteps, costPerUnit, costUnit);
}

// Update the labor calculation display with step-by-step breakdown
function updateLaborCalculationDisplay(steps, finalCost, costUnit) {
    const calculationDetails = document.getElementById(
        "laborCostCalculationDetails"
    );

    if (steps.length > 0) {
        let html = `<div><strong>Calculation Steps:</strong></div>`;
        steps.forEach((step) => {
            html += `<div style="margin: var(--space-xs) 0; padding-left: var(--space-md);">• ${step}</div>`;
        });
        html += `<div style="margin-top: var(--space-sm); font-weight: bold;">Final Cost: ${finalCost.toFixed(4)} ${currency}/${costUnit}</div>`;
        calculationDetails.innerHTML = html;
    } else {
        calculationDetails.textContent =
            "Enter shift details to see calculation";
    }
}

function populateDirectLaborForm(directLabor) {
    document.getElementById("modalLaborName").value = directLabor.name;
    document.getElementById("modalShiftRate").value = directLabor.shiftRate.toFixed(2);
    document.getElementById("modalShiftDuration").value = directLabor.shiftDuration.toFixed(2);
    document.getElementById("modalTimeUnit").value = directLabor.timeUnit;
    document.getElementById("modalCostUnitLabor").value = directLabor.costUnit;

    updateLaborCostPerUnit();
}

// =============================================================================
// FIX: ENHANCED SAVE DIRECT LABOR WITH AUTOMATIC DUPLICATE DETECTION
// =============================================================================
function saveDirectLabor() {
    const name = document
        .getElementById("modalLaborName")
        .value.trim();
    const shiftRate = parseFloat(
        document.getElementById("modalShiftRate").value
    );
    const shiftDuration = parseFloat(
        document.getElementById("modalShiftDuration").value
    );
    const timeUnit = document.getElementById("modalTimeUnit").value;
    const costUnit = document.getElementById("modalCostUnitLabor").value;

    if (!name) {
        alert("Please enter a labor name");
        return;
    }

    if (isNaN(shiftRate) || shiftRate <= 0) {
        alert("Please enter a valid shift rate");
        return;
    }

    if (isNaN(shiftDuration) || shiftDuration <= 0) {
        alert("Please enter a valid shift duration");
        return;
    }

    // Calculate cost per unit
    let costPerUnit = 0;
    if (shiftRate > 0 && shiftDuration > 0) {
        const costPerTimeUnit = shiftRate / shiftDuration;
        if (timeUnit !== costUnit) {
            const conversionFactor = UNIT_CONVERSIONS[costUnit] / UNIT_CONVERSIONS[timeUnit];
            costPerUnit = costPerTimeUnit * conversionFactor;
        } else {
            costPerUnit = costPerTimeUnit;
        }
    }

    const directLaborData = {
        id: Date.now(),
        name,
        shiftRate: parseFloat(shiftRate.toFixed(2)),
        shiftDuration: parseFloat(shiftDuration.toFixed(2)),
        timeUnit,
        costPerUnit: parseFloat(costPerUnit.toFixed(4)),
        costUnit
    };

    // NEW: Automatic duplicate detection and handling
    const directLabor = getCurrentDirectLabor();
    const existingItem = checkForDuplicateName(name, directLabor, editingItem.id);
    
    if (existingItem && !editingItem.id) {
        showDirectLaborEditPrompt(existingItem.id, name);
        return;
    }

    if (editingItem.type === 'directLabor' && editingItem.id) {
        // Update existing
        const index = directLabor.findIndex(item => item.id === editingItem.id);
        if (index !== -1) {
            directLabor[index] = directLaborData;
            showNotification("Direct labor updated successfully!", "success");
        }
    } else {
        // Add new
        directLabor.push(directLaborData);
        showNotification("Direct labor saved successfully!", "success");
    }

    setCurrentDirectLabor(directLabor);

    renderDirectLabor();
    populateUnifiedItemSelect();
    populateDirectLaborSelect();
    closeDirectLaborModal();

    // NEW: Update recipes using this labor item
    updateRecipesUsingIngredient(directLaborData, 'directLabor');

    showNotification("Direct labor saved successfully!", "success");
}

// NEW: Update direct labor function
function updateDirectLabor() {
    const name = document.getElementById("modalLaborName").value.trim();
    const shiftRate = parseFloat(document.getElementById("modalShiftRate").value);
    const shiftDuration = parseFloat(document.getElementById("modalShiftDuration").value);
    const timeUnit = document.getElementById("modalTimeUnit").value;
    const costUnit = document.getElementById("modalCostUnitLabor").value;

    // Calculate cost per unit
    let costPerUnit = 0;
    if (shiftRate > 0 && shiftDuration > 0) {
        const costPerTimeUnit = shiftRate / shiftDuration;
        if (timeUnit !== costUnit) {
            const conversionFactor = UNIT_CONVERSIONS[costUnit] / UNIT_CONVERSIONS[timeUnit];
            costPerUnit = costPerTimeUnit * conversionFactor;
        } else {
            costPerUnit = costPerTimeUnit;
        }
    }

    const directLabor = getCurrentDirectLabor();
    const index = directLabor.findIndex(item => item.id === editingItem.id);
    
    if (index !== -1) {
        const updatedItem = {
            id: editingItem.id,
            name,
            shiftRate: parseFloat(shiftRate.toFixed(2)),
            shiftDuration: parseFloat(shiftDuration.toFixed(2)),
            timeUnit,
            costPerUnit: parseFloat(costPerUnit.toFixed(4)),
            costUnit
        };
        
        directLabor[index] = updatedItem;
        setCurrentDirectLabor(directLabor);
        
        renderDirectLabor();
        populateUnifiedItemSelect();
        populateDirectLaborSelect();
        closeDirectLaborModal();

        // Update recipes using this labor item
        updateRecipesUsingIngredient(updatedItem, 'directLabor');
        
        showNotification("Direct labor updated successfully!", "success");
    }
}

function deleteDirectLabor(id) {
    if (confirm("Are you sure you want to delete this direct labor item?")) {
        const directLabor = getCurrentDirectLabor();
        const updatedDirectLabor = directLabor.filter((item) => item.id !== id);
        setCurrentDirectLabor(updatedDirectLabor);
        renderDirectLabor();
        populateUnifiedItemSelect();
        populateDirectLaborSelect();
        
        showNotification("Direct labor deleted successfully!", "success");
    }
}

// ENHANCED: Render direct labor with alphabetical sorting
function renderDirectLabor() {
    const tableBody = document.getElementById("directLaborTable");
    let filteredDirectLabor = filterDirectLabor();
  
    // NEW: Apply alphabetical sorting
    filteredDirectLabor = sortDirectLaborAlphabetically(filteredDirectLabor);

    tableBody.innerHTML = filteredDirectLabor
        .map(
            (labor) => `
                <tr>
                    <td data-label="Labor Name">${labor.name}</td>
                    <td data-label="Shift Rate">${formatCurrency(labor.shiftRate)}/shift</td>
                    <td data-label="Shift Duration">${labor.shiftDuration} ${labor.timeUnit}</td>
                    <td data-label="Cost/Unit">${formatCurrency(labor.costPerUnit)}/${labor.costUnit}</td>
                    <td data-label="Actions">
                        <button class="btn-secondary small" onclick="openDirectLaborModal(${JSON.stringify(
                            labor
                        ).replace(/"/g, "&quot;")})">Edit</button>
                        <button class="btn-danger small" onclick="deleteDirectLabor(${
                            labor.id
                        })">Delete</button>
                    </td>
                </tr>
            `
        )
        .join("");
}

function filterDirectLabor() {
    const searchTerm = document
        .getElementById("directLaborSearch")
        .value.toLowerCase();
    const directLabor = getCurrentDirectLabor();
    return directLabor.filter(
        (labor) => labor.name.toLowerCase().includes(searchTerm)
    );
}

// ENHANCED: Populate unified item select with alphabetical sorting and yield display
function populateUnifiedItemSelect() {
    const select = document.getElementById("unifiedItemSelect");
    const rawMaterialsGroup = select.querySelector('optgroup[label="Raw Materials"]');
    const subRecipesGroup = select.querySelector('optgroup[label="Sub-Recipes"]');
    
    rawMaterialsGroup.innerHTML = '';
    subRecipesGroup.innerHTML = '';
    
    // NEW: Sort raw materials alphabetically and show yield percentage
    const sortedRawMaterials = sortRawMaterialsAlphabetically(getCurrentRawMaterials());
    sortedRawMaterials.forEach(item => {
        const option = document.createElement('option');
        option.value = `rawMaterial-${item.id}`;
        const yieldText = item.yieldPercentage !== 100 ? ` (${item.yieldPercentage}% yield)` : '';
        option.textContent = `${item.name} (${formatCurrency(item.costPerUnit)}/${item.costUnit}${yieldText})`;
        option.dataset.yield = item.yieldPercentage || 100;
        rawMaterialsGroup.appendChild(option);
    });
    
    // NEW: Sort sub-recipes alphabetically
    const subRecipes = getCurrentRecipes().filter(recipe => recipe.type === 'sub');
    const sortedSubRecipes = sortRecipesAlphabetically(subRecipes);
    sortedSubRecipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = `subrecipe-${recipe.id}`;
        const unitCost = recipe.costPerUnit || 0;
        const costUnit = recipe.costUnit || recipe.outputUnit || 'batch';
        option.textContent = `${recipe.name} (${formatCurrency(unitCost)}/${costUnit})`;
        subRecipesGroup.appendChild(option);
    });
}

// ENHANCED: Populate direct labor select with alphabetical sorting
function populateDirectLaborSelect() {
    const select = document.getElementById("directLaborSelect");
    select.innerHTML = '<option value="">Select direct labor...</option>';
    
    // NEW: Sort direct labor alphabetically
    const sortedDirectLabor = sortDirectLaborAlphabetically(getCurrentDirectLabor());
    sortedDirectLabor.forEach(labor => {
        const option = document.createElement('option');
        option.value = labor.id;
        option.textContent = `${labor.name} (${formatCurrency(labor.costPerUnit)}/${labor.costUnit})`;
        option.dataset.unit = labor.costUnit; // Store unit for dynamic updates
        select.appendChild(option);
    });
}

// =============================================================================
// FIX: ENHANCED DIRECT LABOR RATE DISPLAY IN RECIPE CALCULATOR
// =============================================================================
function addDirectLaborToRecipe() {
    const laborId = directLaborSelect.value;
    const timeRequired = parseFloat(timeRequirement.value);

    if (!laborId || !timeRequired || timeRequired <= 0) {
        alert("Please select a direct labor item and enter a valid time requirement");
        return;
    }

    const labor = getCurrentDirectLabor().find(item => item.id === parseInt(laborId));
    if (!labor) {
        console.error("Direct labor item not found:", laborId);
        alert("Selected direct labor item not found. Please refresh the list.");
        return;
    }

    // DEBUG: Log labor data to verify rate
    console.log("Adding direct labor:", {
        name: labor.name,
        costPerUnit: labor.costPerUnit,
        costUnit: labor.costUnit,
        timeRequired: timeRequired
    });

    // Check if we're updating an existing row
    if (window.currentEditingLaborRow) {
        addDirectLaborRow(
            labor.name,
            timeRequired,
            labor.costUnit,
            labor.costPerUnit // Use the pre-calculated costPerUnit
        );
        
        // Clear editing state
        window.currentEditingLaborRow = null;
        
        // Reset button text and function
        const addButton = document.querySelector('.add-labor-section .btn-primary');
        addButton.textContent = 'Add Direct Labor';
        addButton.onclick = addDirectLaborToRecipe;
    } else {
        // Create new row
        addDirectLaborRow(
            labor.name,
            timeRequired,
            labor.costUnit,
            labor.costPerUnit // Use the pre-calculated costPerUnit
        );
    }

    // Clear inputs
    directLaborSelect.value = "";
    timeRequirement.value = "";
    timeRequirementUnit.textContent = "hours"; // Reset to default
    
    // Force recalculation to update display
    recalc();
}

// =============================================================================
// FIX: CORRECT RECIPE TABLE COLUMN INDEXES AFTER YIELD COLUMN ADDITION
// =============================================================================
function addRow(
    name = "",
    qtyVal = "0",
    unit = "g",
    unitCostVal = "0.00",
    type = "rawMaterial",
    subRecipeId = null
) {
    const tr = document.createElement("tr");
    const rowId = 'row-' + Date.now(); // Unique ID for each row
    
    if (type === 'sub-recipe') {
        tr.classList.add('sub-recipe-row');
    }
    
    // NEW: Get yield percentage for display
    let yieldPercentage = "N/A";
    if (type === 'rawMaterial') {
        const rawMaterial = getCurrentRawMaterials().find(item => item.name === name);
        yieldPercentage = rawMaterial ? (rawMaterial.yieldPercentage || 100) + "%" : "100%";
    }

    // FIXED COLUMN STRUCTURE: 0:Item, 1:Qty, 2:Yield%, 3:UnitCost, 4:TotalCost, 5:Actions
    tr.innerHTML = `
            <td data-label="Item">
                ${type === 'sub-recipe' ? `<span class="sub-recipe-badge">SUB</span> ` : ''}
                <input type="text" value="${escapeHtml(name)}" placeholder="Item" readonly>
            </td>
            <td data-label="Qty">
                <div class="quantity-input-group">
                    <input type="number" value="${parseFloat(qtyVal).toFixed(2)}" step="0.01" placeholder="Qty" readonly>
                    <span class="quantity-unit">${unit}</span>
                </div>
            </td>
            <!-- NEW: Yield % Column (Index 2) -->
            <td class="yield-display-cell" data-label="Yield %">
                <span class="yield-value">${yieldPercentage}</span>
            </td>
            <!-- Unit Cost Column (NOW Index 3) -->
            <td class="unit-cost-cell" data-label="Unit Cost">
                <span class="unit-currency">${currency}</span>
                <input type="number" value="${parseFloat(unitCostVal).toFixed(2)}" step="0.01" style="width:60%" readonly>
                <span class="unit-display">/${unit}</span>
            </td>
            <!-- Total Cost Column (NOW Index 4) -->
            <td data-label="Total Cost">
                <span class="unit-currency">${currency}</span>
                <span class="total-value">0.00</span>
                <span class="unit-suffix">/recipe</span>
            </td>
            <!-- Actions Column (NOW Index 5) -->
            <td data-label="Actions">
                <!-- ADDED: Edit button -->
                <button class="btn-secondary small edit-recipe-btn" onclick="editRecipeRow('${rowId}')">Edit</button>
                <button class="btn-danger small delRow">🗑️</button>
            </td>
        `;

    tr.id = rowId;
    
    // FIXED: Correct column indexes after adding yield column
    const qty = tr.children[1].querySelector("input"); // Index 1: Quantity
    const unitCostInput = tr.children[3].querySelector("input"); // Index 3: Unit Cost (was 2)
    const totalVal = tr.children[4].querySelector(".total-value"); // Index 4: Total Cost (was 3)
    const delBtn = tr.querySelector(".delRow");

    tr.dataset.type = type;
    if (subRecipeId) {
        tr.dataset.subRecipeId = subRecipeId;
    }

    function updateRow() {
        const q = parseFloat(qty.value) || 0;
        const uc = parseFloat(unitCostInput.value) || 0;
        
        // SIMPLIFIED: No yield calculation needed - cost already includes yield
        totalVal.textContent = (q * uc).toFixed(2);
        recalc();
        saveCurrentRecipeState();
        
        // NEW: Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
    }

    [qty, unitCostInput].forEach((e) =>
        e.addEventListener("input", updateRow)
    );
    delBtn.addEventListener("click", () => {
        tr.remove();
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // NEW: Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
    });
    recipeBody.appendChild(tr);
    updateRow();
    
    // Auto-save current recipe state
    saveCurrentRecipeState();
}

// MODIFIED: Add direct labor row to recipe - readonly with Edit button
function addDirectLaborRow(name, timeRequired, timeUnit, rate) {
    const tr = document.createElement("tr");
    const rowId = 'labor-row-' + Date.now(); // Unique ID for each labor row
    
    tr.classList.add('labor-row');
    
    // MODIFIED: Made all inputs readonly and added Edit button
    tr.innerHTML = `
        <td data-label="Labor Item">
            <input type="text" value="${escapeHtml(name)}" placeholder="Labor item" readonly>
        </td>
        <td data-label="Time Required">
            <div class="quantity-input-group">
                <input type="number" value="${parseFloat(timeRequired).toFixed(2)}" step="0.01" placeholder="Time" readonly>
                <span class="quantity-unit">${timeUnit}</span>
            </div>
        </td>
        <td data-label="Rate">
            <div class="input-with-unit">
                <input type="number" value="${parseFloat(rate).toFixed(2)}" step="0.01" placeholder="Rate" readonly>
                <span class="unit-display-small">/${timeUnit}</span>
            </div>
        </td>
        <td data-label="Total Cost">
            <span class="unit-currency">${currency}</span>
            <span class="total-value">0.00</span>
        </td>
        <td data-label="Actions">
            <!-- ADDED: Edit button -->
            <button class="btn-secondary small edit-labor-btn" onclick="editDirectLaborRow('${rowId}')">Edit</button>
            <button class="btn-danger small delDirectLaborRow">🗑️</button>
        </td>
    `;

    tr.id = rowId;
    const timeInput = tr.children[1].querySelector("input");
    const rateInput = tr.children[2].querySelector("input");
    const totalVal = tr.children[3].querySelector(".total-value");
    const delBtn = tr.querySelector(".delDirectLaborRow");

    tr.dataset.laborId = name; // Store labor name for editing

    function updateRow() {
        const time = parseFloat(timeInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        totalVal.textContent = (time * rate).toFixed(2);
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
    }

    timeInput.addEventListener("input", updateRow);
    delBtn.addEventListener("click", () => {
        tr.remove();
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // Update cost breakdown preview if recipe is loaded
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        }
    });
    directLaborRecipeBody.appendChild(tr);
    updateRow();
    
    // Auto-save current recipe state
    saveCurrentRecipeState();
}

// MODIFIED: Add direct labor to recipe with editing support
function addDirectLaborToRecipe() {
    const laborId = directLaborSelect.value;
    const timeRequired = parseFloat(timeRequirement.value);

    if (!laborId || !timeRequired || timeRequired <= 0) {
        alert("Please select a direct labor item and enter a valid time requirement");
        return;
    }

    const labor = getCurrentDirectLabor().find(item => item.id === parseInt(laborId));
    if (!labor) return;

    // Check if we're updating an existing row
    if (window.currentEditingLaborRow) {
        // Remove the old row (it was already removed when editing started)
        // Just create the updated row
        addDirectLaborRow(
            labor.name,
            timeRequired,
            labor.costUnit,
            labor.costPerUnit
        );
        
        // Clear editing state
        window.currentEditingLaborRow = null;
        
        // Reset button text and function
        const addButton = document.querySelector('.add-labor-section .btn-primary');
        addButton.textContent = 'Add Direct Labor';
        addButton.onclick = addDirectLaborToRecipe;
    } else {
        // Create new row
        addDirectLaborRow(
            labor.name,
            timeRequired,
            labor.costUnit,
            labor.costPerUnit
        );
    }

    // Clear inputs
    directLaborSelect.value = "";
    timeRequirement.value = "";
    timeRequirementUnit.textContent = "hours"; // Reset to default
}

// NEW: Function to edit recipe row
function editRecipeRow(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    
    // Get current row data
    const name = row.children[0].querySelector("input").value;
    const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
    const unit = row.children[1].querySelector(".quantity-unit").textContent;
    const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0; // FIXED: Index 3 for unit cost
    const type = row.dataset.type || 'rawMaterial';
    const subRecipeId = row.dataset.subRecipeId || null;
    
    // Store editing state
    window.currentEditingRow = {
        rowId: rowId,
        type: type,
        subRecipeId: subRecipeId
    };
    
    // Remove the row temporarily (will be re-added after editing)
    row.remove();
    
    // Populate the add item form with current values
    populateRecipeFormForEditing(name, quantity, unit, unitCost, type, subRecipeId);
    
    // Update button text to indicate edit mode
    const addButton = document.querySelector('.add-ingredient-section .btn-primary');
    addButton.textContent = 'Update Item';
    addButton.onclick = updateRecipeRow;
    
    // Recalculate totals
    recalc();
}

// NEW: Function to populate recipe form for editing
function populateRecipeFormForEditing(name, quantity, unit, unitCost, type, subRecipeId) {
    // Find the item in the unified select dropdown
    if (type === 'rawMaterial') {
        const rawMaterial = getCurrentRawMaterials().find(item => item.name === name);
        if (rawMaterial) {
            unifiedItemSelect.value = `rawMaterial-${rawMaterial.id}`;
            onUnifiedItemSelectChange(); // Update unit display
        }
    } else if (type === 'sub-recipe') {
        const subRecipe = getCurrentRecipes().find(recipe => recipe.name === name);
        if (subRecipe) {
            unifiedItemSelect.value = `subrecipe-${subRecipe.id}`;
            onUnifiedItemSelectChange(); // Update unit display
        }
    }
    
    // Populate form fields
    addIngredientQty.value = quantity;
    
    // Note: Unit cost is automatically set based on selection
}

// NEW: Function to update recipe row after editing
function updateRecipeRow() {
    if (!window.currentEditingRow) {
        addItemToRecipe(); // Fallback to normal add
        return;
    }
    
    // Use the normal add function but with the edited data
    addItemToRecipe();
    
    // Reset button text and function
    const addButton = document.querySelector('.add-ingredient-section .btn-primary');
    addButton.textContent = 'Add to Recipe';
    addButton.onclick = addItemToRecipe;
    
    // Clear editing state
    window.currentEditingRow = null;
}

// NEW: Helper function to update unit when unified item selection changes
function onUnifiedItemSelectChange() {
    const selectedValue = unifiedItemSelect.value;
    if (!selectedValue) {
        addIngredientUnit.textContent = "g"; // Default unit
        return;
    }
    
    const [type, id] = selectedValue.split('-');
    const itemId = parseInt(id);
    
    if (type === 'rawMaterial') {
        const rawMaterial = getCurrentRawMaterials().find(item => item.id === itemId);
        if (rawMaterial) {
            addIngredientUnit.textContent = rawMaterial.costUnit;
        }
    } else if (type === 'subrecipe') {
        const subRecipe = getCurrentRecipes().find(recipe => recipe.id === itemId);
        if (subRecipe) {
            addIngredientUnit.textContent = subRecipe.costUnit || subRecipe.outputUnit || 'batch';
        }
    }
}

// NEW: Function to edit direct labor row
function editDirectLaborRow(rowId) {
    const row = document.getElementById(rowId);
    if (!row) return;
    
    // Get current row data
    const name = row.children[0].querySelector("input").value;
    const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
    const timeUnit = row.children[1].querySelector(".quantity-unit").textContent;
    const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
    
    // Store editing state
    window.currentEditingLaborRow = {
        rowId: rowId,
        laborName: name
    };
    
    // Remove the row temporarily
    row.remove();
    
    // Populate the direct labor form with current values
    populateDirectLaborFormForEditing(name, timeRequired, timeUnit, rate);
    
    // Update button text to indicate edit mode
    const addButton = document.querySelector('.add-labor-section .btn-primary');
    addButton.textContent = 'Update Labor';
    addButton.onclick = updateDirectLaborRow;
    
    // Recalculate totals
    recalc();
}

// NEW: Function to populate direct labor form for editing
function populateDirectLaborFormForEditing(name, timeRequired, timeUnit, rate) {
    // Find and select the labor item
    const labor = getCurrentDirectLabor().find(item => item.name === name);
    if (labor) {
        directLaborSelect.value = labor.id;
        // Trigger the change event to update the time unit
        const event = new Event('change');
        directLaborSelect.dispatchEvent(event);
    }
    
    // Populate time requirement
    timeRequirement.value = timeRequired;
}

// NEW: Function to update direct labor row after editing
function updateDirectLaborRow() {
    if (!window.currentEditingLaborRow) {
        addDirectLaborToRecipe(); // Fallback to normal add
        return;
    }
    
    // Use the normal add function but with the edited data
    addDirectLaborToRecipe();
}

// MODIFIED: Simplified function to add items to recipe - uses yield-inclusive costs
function addItemToRecipe() {
    const selectedValue = unifiedItemSelect.value;
    const quantity = parseFloat(addIngredientQty.value);

    if (!selectedValue || !quantity) {
        alert("Please select an item and enter quantity/time");
        return;
    }

    const [type, id] = selectedValue.split('-');
    const itemId = parseInt(id);

    if (type === 'rawMaterial') {
        const rawMaterial = getCurrentRawMaterials().find(item => item.id === itemId);
        if (!rawMaterial) return;

        const unit = rawMaterial.costUnit;
        const unitCost = rawMaterial.costPerUnit; // Already yield-inclusive

        // Check if we're updating an existing row
        if (window.currentEditingRow) {
            // Remove the old row (it was already removed when editing started)
            // Just create the updated row
            addRow(
                rawMaterial.name,
                quantity.toFixed(2),
                unit,
                unitCost.toFixed(2),
                'rawMaterial'
            );
            
            // Clear editing state
            window.currentEditingRow = null;
            
            // Reset button text and function
            const addButton = document.querySelector('.add-ingredient-section .btn-primary');
            addButton.textContent = 'Add to Recipe';
            addButton.onclick = addItemToRecipe;
        } else {
            // Create new row
            addRow(
                rawMaterial.name,
                quantity.toFixed(2),
                unit,
                unitCost.toFixed(2),
                'rawMaterial'
            );
        }
    } else if (type === 'subrecipe') {
        const subRecipe = getCurrentRecipes().find(recipe => recipe.id === itemId);
        if (!subRecipe) return;

        // Use costPerUnit instead of unitCost
        const unitCost = subRecipe.costPerUnit || 0;
        const unit = subRecipe.costUnit || subRecipe.outputUnit || 'batch';

        // Check if we're updating an existing row
        if (window.currentEditingRow) {
            // Remove the old row (it was already removed when editing started)
            // Just create the updated row
            addRow(
                subRecipe.name,
                quantity.toFixed(2),
                unit,
                unitCost.toFixed(2),
                'sub-recipe',
                subRecipe.id
            );
            
            // Clear editing state
            window.currentEditingRow = null;
            
            // Reset button text and function
            const addButton = document.querySelector('.add-ingredient-section .btn-primary');
            addButton.textContent = 'Add to Recipe';
            addButton.onclick = addItemToRecipe;
        } else {
            // Create new row
            addRow(
                subRecipe.name,
                quantity.toFixed(2),
                unit,
                unitCost.toFixed(2),
                'sub-recipe',
                subRecipe.id
            );
        }
    }

    unifiedItemSelect.value = "";
    addIngredientQty.value = "";
    addIngredientUnit.textContent = "g";
}

// Open sub-recipe save modal
function openSubRecipeSaveModal() {
    const recipeName = document.getElementById('recipeName').value.trim();
    if (!recipeName) {
        alert('Please enter a recipe name before saving as sub-recipe');
        document.getElementById('recipeName').focus();
        return;
    }

    // Set the sub-recipe name in the modal
    document.getElementById('subRecipeNameDisplay').value = recipeName;
    
    // Reset form to default values
    document.getElementById('subRecipeCategory').value = 'weight';
    document.getElementById('subRecipeYieldQuantity').value = '1';
    
    // Update unit options and cost display
    updateSubRecipeUnitOptions();
    updateSubRecipeCostDisplay();
    
    // Show the modal
    document.getElementById('subRecipeSaveModal').classList.remove('hidden');
}

// =============================================================================
// FIX: SUB-RECIPE DUPLICATE PREVENTION - ENHANCED
// =============================================================================

// MODIFIED: Enhanced saveSubRecipe function with proper duplicate detection
function saveSubRecipe() {
    const servingScale = parseFloat(servingScaleInput.value) || 1;
    
    // Informational log for debugging
    if (servingScale !== 1) {
        console.log(`INFO: Saving sub-recipe with Serving Scale = ${servingScale}. Sub-recipe costs use yield system, Serving Scale ignored.`);
    }
    
    const name = document.getElementById('subRecipeNameDisplay').value;
    const category = document.getElementById('subRecipeCategory').value;
    const yieldQuantity = parseFloat(document.getElementById('subRecipeYieldQuantity').value);
    const yieldUnit = document.getElementById('subRecipeYieldUnit').value;
    const costPerUnit = parseFloat(document.getElementById('subRecipeCostPerUnit').value);
    const costUnit = document.getElementById('subRecipeCostUnit').value;

    if (!name) {
        alert('Please enter a sub-recipe name');
        return;
    }

    if (isNaN(yieldQuantity) || yieldQuantity <= 0) {
        alert('Please enter a valid yield quantity');
        return;
    }

    // Get current recipe items
    const rawMaterialItems = [];
    const directLaborItems = [];
    
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit").textContent;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0; // FIXED: Index 3
        const type = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        if (type === 'rawMaterial' || type === 'sub-recipe') {
            rawMaterialItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                unitCost: unitCost,
                type: type,
                subRecipeId: subRecipeId
            });
        }
    });

    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const laborName = row.children[0].querySelector("input").value;
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const timeUnit = row.children[1].querySelector(".quantity-unit").textContent;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        
        directLaborItems.push({
            name: laborName,
            quantity: timeRequired,
            unit: timeUnit,
            rate: rate
        });
    });

    // Create sub-recipe object
    const subRecipe = {
        id: Date.now(),
        name: name,
        type: 'sub',
        category: category,
        yieldQuantity: yieldQuantity,
        yieldUnit: yieldUnit,
        costPerUnit: costPerUnit,
        costUnit: costUnit,
        rawMaterialItems: rawMaterialItems,
        directLaborItems: directLaborItems,
        totalCost: calculateCurrentRecipeTotalCost()
    };

    // FIXED: Enhanced duplicate detection for sub-recipes
    const recipes = getCurrentRecipes();
    
    // Filter only sub-recipes for duplicate checking
    const subRecipes = recipes.filter(recipe => recipe.type === 'sub');
    const existingSubRecipe = checkForDuplicateName(name, subRecipes, editingItem.id);
    
    // DEBUG: Log duplicate detection results
    console.log("Sub-recipe duplicate check:", {
        name: name,
        existingSubRecipe: existingSubRecipe,
        editingItem: editingItem,
        subRecipesCount: subRecipes.length
    });
    
    if (existingSubRecipe && !editingItem.id) {
        console.log("Duplicate sub-recipe detected, showing prompt");
        showEditPrompt('subRecipe', existingSubRecipe.id, name);
        return;
    }

    // Add to saved recipes
    recipes.push(subRecipe);
    setCurrentRecipes(recipes);

    // Update displays
    renderRecipesList();
    populateUnifiedItemSelect();
    populateSummaryRecipeSelect();
    
    // Close modal
    closeSubRecipeSaveModal();
    
    // Auto-reset after save
    autoResetAfterSave();
    
    showNotification(`Sub-recipe "${name}" saved successfully!`, "success");
}

// =============================================================================
// NEW: FUNCTION TO UPDATE EXISTING SUB-RECIPE
// =============================================================================
function updateExistingSubRecipe() {
    const name = document.getElementById('subRecipeNameDisplay').value;
    const category = document.getElementById('subRecipeCategory').value;
    const yieldQuantity = parseFloat(document.getElementById('subRecipeYieldQuantity').value);
    const yieldUnit = document.getElementById('subRecipeYieldUnit').value;
    const costPerUnit = parseFloat(document.getElementById('subRecipeCostPerUnit').value);
    const costUnit = document.getElementById('subRecipeCostUnit').value;

    // Get current recipe items
    const rawMaterialItems = [];
    const directLaborItems = [];
    
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit").textContent;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0; // FIXED: Index 3
        const type = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        if (type === 'rawMaterial' || type === 'sub-recipe') {
            rawMaterialItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                unitCost: unitCost,
                type: type,
                subRecipeId: subRecipeId
            });
        }
    });

    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const laborName = row.children[0].querySelector("input").value;
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const timeUnit = row.children[1].querySelector(".quantity-unit").textContent;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        
        directLaborItems.push({
            name: laborName,
            quantity: timeRequired,
            unit: timeUnit,
            rate: rate
        });
    });

    // Create updated sub-recipe object
    const updatedSubRecipe = {
        id: editingItem.id, // Keep the same ID
        name: name,
        type: 'sub',
        category: category,
        yieldQuantity: yieldQuantity,
        yieldUnit: yieldUnit,
        costPerUnit: costPerUnit,
        costUnit: costUnit,
        rawMaterialItems: rawMaterialItems,
        directLaborItems: directLaborItems,
        totalCost: calculateCurrentRecipeTotalCost()
    };

    // Update the existing sub-recipe
    const recipes = getCurrentRecipes();
    const index = recipes.findIndex(recipe => recipe.id === editingItem.id);
    
    if (index !== -1) {
        recipes[index] = updatedSubRecipe;
        setCurrentRecipes(recipes);
        
        // Update displays
        renderRecipesList();
        populateUnifiedItemSelect();
        populateSummaryRecipeSelect();
        
        // Close modal
        closeSubRecipeSaveModal();
        
        // Auto-reset after save
        autoResetAfterSave();
        
        showNotification(`Sub-recipe "${name}" updated successfully!`, "success");
    } else {
        console.error("Could not find sub-recipe to update:", editingItem.id);
        alert("Error: Could not find the existing sub-recipe to update. It may have been deleted.");
    }
}

// =============================================================================
// FIX: CORRECT calculateCurrentRecipeTotalCost FUNCTION - BASE COSTS ONLY
// =============================================================================
function calculateCurrentRecipeTotalCost() {
    let rawMaterialsTotal = 0;
    let directLaborTotal = 0;
    
    // Calculate raw materials total from current recipe table (BASE calculation)
    recipeBody.querySelectorAll("tr").forEach((row) => {
        const q = parseFloat(row.children[1].querySelector("input").value) || 0;
        const uc = parseFloat(row.children[3].querySelector("input").value) || 0; // FIXED: Index 3 for unit cost
        
        // SIMPLIFIED: No yield calculation needed - cost already includes yield
        rawMaterialsTotal += q * uc; // BASE cost - no scaling
    });
    
    // Calculate direct labor total from current labor table (BASE calculation)  
    directLaborRecipeBody.querySelectorAll("tr").forEach((row) => {
        const time = parseFloat(row.children[1].querySelector("input").value) || 0;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        directLaborTotal += time * rate; // BASE cost - no scaling
    });
    
    // RETURN: Base total cost without serving scale contamination
    return parseFloat((rawMaterialsTotal + directLaborTotal).toFixed(2));
}

// Close sub-recipe save modal
function closeSubRecipeSaveModal() {
    document.getElementById('subRecipeSaveModal').classList.add('hidden');
}

// =============================================================================
// FIX: ENHANCED SERVING SCALE ISOLATION
// =============================================================================
function calculateScaledCostsForSummary(baseRawMaterialsCost, baseDirectLaborCost, baseServings) {
    const servingScale = parseFloat(servingScaleInput.value) || 1;
    
    // Apply serving scale formula: (Base Cost ÷ Base Servings) × Target Servings
    const scaledRawMaterialsCost = baseServings > 0 ? 
        (baseRawMaterialsCost / baseServings) * servingScale : 0;
    const scaledDirectLaborCost = baseServings > 0 ? 
        (baseDirectLaborCost / baseServings) * servingScale : 0;
    const scaledTotalCost = scaledRawMaterialsCost + scaledDirectLaborCost;
    
    return {
        scaledRawMaterialsCost,
        scaledDirectLaborCost, 
        scaledTotalCost,
        targetServings: servingScale
    };
}

// =============================================================================
// FIX: ENHANCED SAVE RECIPE WITH AUTOMATIC DUPLICATE DETECTION
// =============================================================================
function saveRecipe(type) {
    const servingScale = parseFloat(servingScaleInput.value) || 1;
    
    // Show warning if Serving Scale ≠ 1 when saving (informational only)
    if (servingScale !== 1) {
        console.log(`INFO: Saving recipe with Serving Scale = ${servingScale}. This affects Summary analysis but NOT saved recipe costs.`);
    }
    
    const name = recipeNameInput.value.trim();
    if (!name) {
        alert("Please enter a recipe name");
        recipeNameInput.focus();
        return;
    }

    // Get current recipe items (BASE costs)
    const rawMaterialItems = [];
    const directLaborItems = [];
    
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit").textContent;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0; // FIXED: Index 3
        const type = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        if (type === 'rawMaterial' || type === 'sub-recipe') {
            rawMaterialItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                unitCost: unitCost,
                type: type,
                subRecipeId: subRecipeId
            });
        } else if (type === 'directLabor') {
            directLaborItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                unitCost: unitCost,
                type: 'directLabor'
            });
        }
    });

    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const laborName = row.children[0].querySelector("input").value;
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const timeUnit = row.children[1].querySelector(".quantity-unit").textContent;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        
        directLaborItems.push({
            name: laborName,
            quantity: timeRequired,
            unit: timeUnit,
            rate: rate,
            type: 'directLabor'
        });
    });

    // Create recipe object with BASE costs
    const recipe = {
        id: Date.now(),
        name: name,
        type: type,
        rawMaterialItems: rawMaterialItems,
        directLaborItems: directLaborItems,
        totalCost: calculateCurrentRecipeTotalCost(), // BASE cost only
        servings: parseFloat(servingsInput.value) || 1,
        createdAt: new Date().toISOString()
    };

    // NEW: Automatic duplicate detection and handling
    const recipes = getCurrentRecipes();
    const existingRecipe = checkForDuplicateName(name, recipes, editingItem.id);
    
    if (existingRecipe && !editingItem.id) {
        showEditPrompt(type === 'main' ? 'mainRecipe' : 'subRecipe', existingRecipe.id, name);
        return;
    }

    // Add to saved recipes
    if (editingItem.type === 'mainRecipe' && editingItem.id) {
        const existingIndex = recipes.findIndex(r => r.id === editingItem.id);
        if (existingIndex !== -1) {
            recipes[existingIndex] = recipe;
        }
    } else if (editingItem.type === 'subRecipe' && editingItem.id) {
        const existingIndex = recipes.findIndex(r => r.id === editingItem.id);
        if (existingIndex !== -1) {
            recipes[existingIndex] = recipe;
        }
    } else {
        recipes.push(recipe);
    }

    setCurrentRecipes(recipes);

    // Update displays
    renderRecipesList();
    populateSummaryRecipeSelect();
    
    // Reset editing state
    editingItem = { type: null, id: null, data: null };
    
    // Auto-reset after save
    autoResetAfterSave();
    
    showNotification(`Recipe "${name}" saved successfully!`, "success");
}

// ENHANCED: Render recipes list with alphabetical sorting
function renderRecipesList() {
    const recipes = getCurrentRecipes();
    
    // NEW: Apply alphabetical sorting
    const mainRecipes = sortRecipesAlphabetically(recipes.filter(recipe => recipe.type === 'main'));
    const subRecipes = sortRecipesAlphabetically(recipes.filter(recipe => recipe.type === 'sub'));

    // Render main recipes
    mainRecipesList.innerHTML = mainRecipes.map(recipe => `
        <div class="recipe-item" onclick="loadRecipe(${recipe.id})">
            <h4>${escapeHtml(recipe.name)}</h4>
            <p>Total Cost: ${formatCurrency(recipe.totalCost)} • ${recipe.rawMaterialItems.length + recipe.directLaborItems.length} items • ${recipe.servings || 1} servings</p>
            <div class="recipe-actions">
                <button class="btn-secondary small" onclick="editRecipe(${recipe.id}, event)">Edit</button>
                <button class="btn-danger small" onclick="deleteRecipe(${recipe.id}, event)">Delete</button>
            </div>
        </div>
    `).join('');

    // Render sub-recipes
    subRecipesList.innerHTML = subRecipes.map(recipe => `
        <div class="recipe-item" onclick="loadSubRecipe(${recipe.id})">
            <h4>${escapeHtml(recipe.name)}</h4>
            <p>Cost: ${formatCurrency(recipe.costPerUnit)}/${recipe.costUnit} • ${recipe.rawMaterialItems.length + recipe.directLaborItems.length} items</p>
            <div class="recipe-actions">
                <button class="btn-secondary small" onclick="editSubRecipe(${recipe.id}, event)">Edit</button>
                <button class="btn-danger small" onclick="deleteRecipe(${recipe.id}, event)">Delete</button>
            </div>
        </div>
    `).join('');
}

// Load recipe into current recipe
function loadRecipe(recipeId) {
    const recipes = getCurrentRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // Clear current recipe
    recipeBody.innerHTML = "";
    directLaborRecipeBody.innerHTML = "";

    // Set recipe name
    recipeNameInput.value = recipe.name;

    // Set servings
    servingsInput.value = recipe.servings || 1;

    // Add raw material items
    recipe.rawMaterialItems.forEach(item => {
        addRow(
            item.name,
            item.quantity,
            item.unit,
            item.unitCost,
            item.type || 'rawMaterial',
            item.subRecipeId || null
        );
    });

    // Add direct labor items
    recipe.directLaborItems.forEach(item => {
        addDirectLaborRow(
            item.name,
            item.quantity,
            item.unit,
            item.unitCost
        );
    });

    // Set editing state
    editingItem = { type: 'mainRecipe', id: recipeId, data: recipe };

    // Switch to recipes tab
    switchTab('recipes');
    
    // Recalculate
    recalc();
}

// Load sub-recipe into current recipe
function loadSubRecipe(recipeId) {
    const recipes = getCurrentRecipes();
    const recipe = recipes.find(r => r.id === recipeId && r.type === 'sub');
    if (!recipe) return;

    // Clear current recipe
    recipeBody.innerHTML = "";
    directLaborRecipeBody.innerHTML = "";

    // Set recipe name
    recipeNameInput.value = recipe.name;

    // Add raw material items from sub-recipe
    recipe.rawMaterialItems.forEach(item => {
        addRow(
            item.name,
            item.quantity,
            item.unit,
            item.unitCost,
            'rawMaterial'
        );
    });

    // Add direct labor items from sub-recipe
    recipe.directLaborItems.forEach(item => {
        addDirectLaborRow(
            item.name,
            item.quantity,
            item.unit,
            item.unitCost
        );
    });

    // Set editing state
    editingItem = { type: 'subRecipe', id: recipeId, data: recipe };

    // Switch to recipes tab
    switchTab('recipes');
    
    // Recalculate
    recalc();
}

// Edit recipe
function editRecipe(recipeId, event) {
    if (event) event.stopPropagation();
    const recipes = getCurrentRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // Load the recipe
    loadRecipe(recipeId);
    
    // Set editing state
    editingItem = { type: 'mainRecipe', id: recipeId, data: recipe };
}

// Edit sub-recipe
function editSubRecipe(recipeId, event) {
    if (event) event.stopPropagation();
    const recipes = getCurrentRecipes();
    const recipe = recipes.find(r => r.id === recipeId && r.type === 'sub');
    if (!recipe) return;

    // Load the sub-recipe
    loadSubRecipe(recipeId);
    
    // Set editing state
    editingItem = { type: 'subRecipe', id: recipeId, data: recipe };
}

// Delete recipe
function deleteRecipe(recipeId, event) {
    if (event) event.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    const recipes = getCurrentRecipes();
    const updatedRecipes = recipes.filter(recipe => recipe.id !== recipeId);
    setCurrentRecipes(updatedRecipes);

    // Update displays
    renderRecipesList();
    populateUnifiedItemSelect();
    
    // NEW: Update summary recipe selector
    populateSummaryRecipeSelect();
    
    // If we're editing the deleted recipe, clear editing state
    if (editingItem.id === recipeId) {
        editingItem = { type: null, id: null, data: null };
    }
    
    // NEW: If the deleted recipe was loaded for summary, clear it
    if (loadedRecipeForSummary && loadedRecipeForSummary.id === recipeId) {
        loadedRecipeForSummary = null;
        loadedRecipeDisplay.classList.add('hidden');
        clearCostBreakdownPreview();
    }
    
    showNotification("Recipe deleted successfully!", "success");
}

// =============================================================================
// FIX: ENHANCED EDIT PROMPT FOR SUB-RECIPES
// =============================================================================

// MODIFIED: Enhanced showEditPrompt function for sub-recipes
function showEditPrompt(type, id, name) {
    console.log("Showing edit prompt for:", { type, id, name });
    
    let title = "Save Changes";
    let message = '';
    
    switch(type) {
        case 'mainRecipe':
            title = "Save Main Recipe";
            message = `A main recipe named "<strong>${escapeHtml(name)}</strong>" already exists.`;
            break;
        case 'subRecipe':
            title = "Save Sub-Recipe"; 
            message = `A sub-recipe named "<strong>${escapeHtml(name)}</strong>" already exists.`;
            break;
        case 'rawMaterial':
            title = "Save Raw Material";
            message = `A raw material named "<strong>${escapeHtml(name)}</strong>" already exists.`;
            break;
        case 'directLabor':
            title = "Save Direct Labor";
            message = `A direct labor item named "<strong>${escapeHtml(name)}</strong>" already exists.`;
            break;
        default:
            message = `An item named "<strong>${escapeHtml(name)}</strong>" already exists.`;
    }
    
    message += `<p>Would you like to replace the existing item or save this as a new item?</p>`;
    
    editPromptTitle.textContent = title;
    editPromptMessage.innerHTML = message;
    
    // Store editing context
    editingItem = { type, id, data: null };
    
    editPromptModal.classList.remove("hidden");
}

// MODIFIED: Enhanced handleEditPromptChoice for sub-recipes
function handleEditPromptChoice(choice) {
    console.log("Edit prompt choice:", choice, "for:", editingItem);
    
    closeEditPromptModal();
    
    if (choice === 'replace') {
        // Replace existing item based on type
        switch(editingItem.type) {
            case 'mainRecipe':
                saveRecipe('main');
                break;
            case 'subRecipe':
                // For sub-recipes, we need to update the existing one
                updateExistingSubRecipe();
                break;
            case 'rawMaterial':
                updateRawMaterial();
                break;
            case 'directLabor':
                updateDirectLabor();
                break;
        }
    } else if (choice === 'new') {
        // Save as new item (generate new ID)
        editingItem.id = null;
        
        switch(editingItem.type) {
            case 'mainRecipe':
                saveRecipe('main');
                break;
            case 'subRecipe':
                saveSubRecipe();
                break;
            case 'rawMaterial':
                saveRawMaterial();
                break;
            case 'directLabor':
                saveDirectLabor();
                break;
        }
    }
}

// Close help modal
function closeHelpModal() {
    helpModal.classList.add("hidden");
}

// Close print preview
function closePrintPreview() {
    printPreviewModal.classList.add("hidden");
}

// Close edit prompt modal
function closeEditPromptModal() {
    editPromptModal.classList.add("hidden");
}

// =============================================================================
// FIX: UPDATE RECALC FUNCTION WITH CLEAR SEPARATION
// =============================================================================
function recalc() {
    // Recipe Calculator Tab calculations remain exactly the same - BASE costs only
    const servings = parseFloat(servingsInput.value) || 1;
    
    let rawMaterialsTotal = 0;
    let directLaborTotal = 0;

    // Calculate base recipe totals (UNCHANGED - no scaling)
    recipeBody.querySelectorAll("tr").forEach((row) => {
        const q = parseFloat(row.children[1].querySelector("input").value) || 0;
        const uc = parseFloat(row.children[3].querySelector("input").value) || 0; // FIXED: Index 3 for unit cost
        
        // SIMPLIFIED: No yield calculation needed - cost already includes yield
        rawMaterialsTotal += q * uc; // BASE calculation
    });

    directLaborRecipeBody.querySelectorAll("tr").forEach((row) => {
        const time = parseFloat(row.children[1].querySelector("input").value) || 0;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        directLaborTotal += time * rate; // BASE calculation
    });

    // Recipe Calculator Tab displays BASE totals (UNCHANGED)
    const grandTotal = rawMaterialsTotal + directLaborTotal;

    // Update Recipe Calculator Tab display (UNCHANGED)
    rawMaterialsTotalEl.textContent = `${currency}${rawMaterialsTotal.toFixed(2)}`;
    directLaborTotalEl.textContent = `${currency}${directLaborTotal.toFixed(2)}`;
    grandTotalEl.textContent = `${currency}${grandTotal.toFixed(2)}`;

    // Only update summary when no recipe is loaded for analysis
    if (!loadedRecipeForSummary) {
        updateSummary(rawMaterialsTotal, directLaborTotal, grandTotal, servings);
    }
    
    // Update cost breakdown preview if a recipe is loaded for summary
    if (loadedRecipeForSummary) {
        updateCostBreakdownPreview();
    }
}

// =============================================================================
// FIX: ENHANCED UPDATE SUMMARY FUNCTION WITH NaN PREVENTION
// =============================================================================
function updateSummary(rawMaterialsCost, directLaborCost, totalCost, baseServings) {
    // VALIDATION: Ensure all inputs are valid numbers
    rawMaterialsCost = Number(rawMaterialsCost) || 0;
    directLaborCost = Number(directLaborCost) || 0;
    totalCost = Number(totalCost) || 0;
    baseServings = Number(baseServings) || 1;
    
    // Get serving scale with validation
    const servingScale = parseFloat(servingScaleInput.value) || 1;
    const markup = parseFloat(markupInput.value) || 0;
    const tax = parseFloat(taxInput.value) || 0;
    const vat = parseFloat(vatInput.value) || 0;

    // Use the enhanced scaling function for Summary Tab
    const scaledCosts = calculateScaledCostsForSummary(rawMaterialsCost, directLaborCost, baseServings);
    
    const scaledRawMaterialsCost = scaledCosts.scaledRawMaterialsCost;
    const scaledDirectLaborCost = scaledCosts.scaledDirectLaborCost;
    const scaledTotalCost = scaledCosts.scaledTotalCost;
    const targetServings = scaledCosts.targetServings;

    // Calculate cost per serving with zero division protection
    const costPerServing = targetServings > 0 ? scaledTotalCost / targetServings : 0;
    
    // Calculate selling prices with validation
    const sellingPriceBeforeTax = costPerServing * (1 + markup / 100);
    const sellingPriceAfterTax = sellingPriceBeforeTax * (1 + (tax + vat) / 100);

    // Calculate percentages with zero division protection
    const foodCostPercent = sellingPriceBeforeTax > 0 ? (scaledRawMaterialsCost / targetServings / sellingPriceBeforeTax) * 100 : 0;
    const laborCostPercent = sellingPriceBeforeTax > 0 ? (scaledDirectLaborCost / targetServings / sellingPriceBeforeTax) * 100 : 0;
    const totalCostPercent = sellingPriceBeforeTax > 0 ? (scaledTotalCost / targetServings / sellingPriceBeforeTax) * 100 : 0;
    const grossProfitPercent = sellingPriceBeforeTax > 0 ? 100 - totalCostPercent : 0;

    // Update terminology and calculations
    const totalRevenue = sellingPriceBeforeTax * targetServings;
    const totalProfit = totalRevenue - scaledTotalCost;

    // UPDATE: Show target servings
    if (summaryServingsDisplay) {
        summaryServingsDisplay.textContent = targetServings;
    }

    // Update Summary Tab with SCALED costs - with null checks
    if (summaryRawMaterialsCost) summaryRawMaterialsCost.textContent = `${currency}${scaledRawMaterialsCost.toFixed(2)}`;
    if (summaryDirectLaborCost) summaryDirectLaborCost.textContent = `${currency}${scaledDirectLaborCost.toFixed(2)}`;
    if (summaryTotalCost) summaryTotalCost.textContent = `${currency}${scaledTotalCost.toFixed(2)}`;
    if (summaryCostServing) summaryCostServing.textContent = `${currency}${costPerServing.toFixed(2)}`;
    if (summarySellingPrice) summarySellingPrice.textContent = `${currency}${sellingPriceAfterTax.toFixed(2)}`;
    
    if (summaryFoodCost) summaryFoodCost.textContent = `${foodCostPercent.toFixed(1)}%`;
    if (summaryLaborCostPercent) summaryLaborCostPercent.textContent = `${laborCostPercent.toFixed(1)}%`;
    if (summaryTotalCostPercent) summaryTotalCostPercent.textContent = `${totalCostPercent.toFixed(1)}%`;
    if (summaryGrossProfit) summaryGrossProfit.textContent = `${grossProfitPercent.toFixed(1)}%`;

    // Update batch profit analysis with null checks
    if (summaryBatchRevenue) summaryBatchRevenue.textContent = `${currency}${totalRevenue.toFixed(2)}`;
    if (summaryBatchProfit) summaryBatchProfit.textContent = `${currency}${totalProfit.toFixed(2)}`;
}

// =============================================================================
// FIX: ENHANCED LOADED RECIPE DISPLAY UPDATE
// =============================================================================
function updateLoadedRecipeDisplay() {
    if (!loadedRecipeForSummary || !loadedRecipeDisplay) return;
    
    currentRecipeNameDisplay.textContent = loadedRecipeForSummary.name || "Unnamed Recipe";
    loadedRecipeTotalCost.textContent = `${currency}${(loadedRecipeForSummary.totalCost || 0).toFixed(2)}`;
    loadedRecipeServings.textContent = loadedRecipeForSummary.servings || 1;
    loadedRecipeItemCount.textContent = `${(loadedRecipeForSummary.rawMaterialItems?.length || 0) + (loadedRecipeForSummary.directLaborItems?.length || 0)} items`;
    
    loadedRecipeDisplay.classList.remove('hidden');
}

// PURPOSE: Update loaded recipe summary with serving scale
function updateSummaryWithLoadedRecipe(recipe) {
    // NEW: Use serving scale instead of batch scale
    const servingScale = parseFloat(servingScaleInput.value) || 1;
    
    // Calculate base totals from the loaded recipe (UNCHANGED)
    let rawMaterialsTotal = recipe.rawMaterialItems.reduce((total, item) => {
        // SIMPLIFIED: No yield calculation needed - cost already includes yield
        return total + (item.quantity * item.unitCost);
    }, 0);

    let directLaborTotal = recipe.directLaborItems.reduce((total, item) => {
        return total + (item.quantity * item.unitCost);
    }, 0);

    const baseServings = recipe.servings || 1;
    const totalCost = rawMaterialsTotal + directLaborTotal;
    
    // Call updateSummary with serving scale applied
    updateSummary(rawMaterialsTotal, directLaborTotal, totalCost, baseServings);
}

// NEW: Separate function to update loaded recipe summary
function updateLoadedRecipeSummary() {
    if (loadedRecipeForSummary) {
        updateSummaryWithLoadedRecipe(loadedRecipeForSummary);
    }
}

// =============================================================================
// PURPOSE: NEW - Auto-set Serving Scale when loading recipes in Summary Tab
// =============================================================================
function loadRecipeForSummary() {
    const recipeId = summaryRecipeSelect.value;
    if (!recipeId) {
        alert("Please select a recipe to load");
        return;
    }

    const recipe = getCurrentRecipes().find(r => r.id === parseInt(recipeId));
    if (!recipe) return;

    loadedRecipeForSummary = recipe;
    
    // NEW: Automatically set serving scale to match the loaded recipe's base servings
    const baseServings = recipe.servings || 1;
    servingScaleInput.value = baseServings;
    
    // Update display
    updateLoadedRecipeDisplay();
    
    // Update summary with loaded recipe data (now using the correct serving scale)
    updateSummaryWithLoadedRecipe(recipe);
    
    // Update cost breakdown preview with loaded recipe
    updateCostBreakdownPreview();
    
    // NEW: Show notification about auto-setting
    showNotification(`Automatically set Serving Scale to ${baseServings} to match loaded recipe`, "info");
}

// =============================================================================
// PURPOSE: Update cost breakdown preview with serving scale and alphabetical sorting
// =============================================================================
function updateCostBreakdownPreviewWithRecipe(recipe) {
    // NEW: Use serving scale instead of batch scale
    const servingScale = parseFloat(servingScaleInput.value) || 1;
    const baseServings = recipe.servings || 1;
    
    // NEW: Calculate scaling factor using serving scale formula
    const scaleFactor = baseServings > 0 ? servingScale / baseServings : 0;
    
    // Use recipe items directly
    const rawMaterialItems = recipe.rawMaterialItems || [];
    const directLaborItems = recipe.directLaborItems || [];
    
    // NEW: Sort items alphabetically for display
    const sortedRawMaterialItems = sortRecipeItemsAlphabetically([...rawMaterialItems]);
    const sortedDirectLaborItems = sortRecipeItemsAlphabetically([...directLaborItems]);
    
    // Update raw materials preview with SCALED quantities for Summary Tab
    rawMaterialsCount.textContent = `${sortedRawMaterialItems.length} items`;
    
    let rawMaterialsSubtotal = 0;
    rawMaterialsPreviewBody.innerHTML = '';
    
    sortedRawMaterialItems.forEach(item => {
        // NEW: Scale quantity using serving scale factor
        const scaledQuantity = item.quantity * scaleFactor; // SCALED for Summary Tab
        
        // MODIFIED: Get yield from raw material for display only (costs already yield-inclusive)
        let yieldPct = 100;
        if (item.type === 'rawMaterial') {
            const rawMaterial = getCurrentRawMaterials().find(rm => rm.name === item.name);
            if (rawMaterial && rawMaterial.yieldPercentage) {
                yieldPct = rawMaterial.yieldPercentage;
            }
        } else if (item.type === 'sub-recipe') {
            // Sub-recipes already account for yield in their cost
            yieldPct = 100;
        }
        
        // SIMPLIFIED: No yield calculation needed - cost already includes yield
        const totalCost = scaledQuantity * item.unitCost;
        rawMaterialsSubtotal += totalCost;
        
        const rowElement = document.createElement('tr');
        rowElement.innerHTML = `
            <td>${escapeHtml(item.name)}${item.type === 'sub-recipe' ? ' <span class="sub-recipe-badge">SUB</span>' : ''}</td>
            <td>${scaledQuantity.toFixed(2)} ${item.unit}</td> <!-- SCALED quantity -->
            <td>${parseFloat(yieldPct).toFixed(1)}%</td> <!-- Display yield from raw material -->
            <td>${currency}${parseFloat(item.unitCost).toFixed(2)}/${item.unit}</td>
            <td>${currency}${totalCost.toFixed(2)}</td>
        `;
        rawMaterialsPreviewBody.appendChild(rowElement);
    });
    
    rawMaterialsPreviewTotal.textContent = `${currency}${rawMaterialsSubtotal.toFixed(2)}`;
    rawMaterialsPreviewSubtotal.textContent = `${currency}${rawMaterialsSubtotal.toFixed(2)}`;
    
    // Update direct labor preview with SCALED quantities for Summary Tab
    directLaborCount.textContent = `${sortedDirectLaborItems.length} items`;
    
    let directLaborSubtotal = 0;
    directLaborPreviewBody.innerHTML = '';
    
    sortedDirectLaborItems.forEach(item => {
        // NEW: Scale time using serving scale factor
        const scaledTime = item.quantity * scaleFactor; // SCALED for Summary Tab
        const totalCost = scaledTime * item.unitCost;
        directLaborSubtotal += totalCost;
        
        const rowElement = document.createElement('tr');
        rowElement.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${scaledTime.toFixed(2)} ${item.unit}</td> <!-- SCALED time -->
            <td>${currency}${parseFloat(item.unitCost).toFixed(2)}/${item.unit}</td>
            <td>${currency}${totalCost.toFixed(2)}</td>
        `;
        directLaborPreviewBody.appendChild(rowElement);
    });
    
    directLaborPreviewTotal.textContent = `${currency}${directLaborSubtotal.toFixed(2)}`;
    directLaborPreviewSubtotal.textContent = `${currency}${directLaborSubtotal.toFixed(2)}`;
}

// NEW: Update cost breakdown preview (only shows loaded recipe, not current recipe)
function updateCostBreakdownPreview() {
    // Only show data when a recipe is loaded for summary
    if (loadedRecipeForSummary) {
        updateCostBreakdownPreviewWithRecipe(loadedRecipeForSummary);
    } else {
        clearCostBreakdownPreview();
    }
}

// NEW: Clear cost breakdown preview
function clearCostBreakdownPreview() {
    if (!rawMaterialsCount) return;
    
    rawMaterialsCount.textContent = "0 items";
    directLaborCount.textContent = "0 items";
    rawMaterialsPreviewTotal.textContent = `${currency}0.00`;
    directLaborPreviewTotal.textContent = `${currency}0.00`;
    rawMaterialsPreviewSubtotal.textContent = `${currency}0.00`;
    directLaborPreviewSubtotal.textContent = `${currency}0.00`;
    rawMaterialsPreviewBody.innerHTML = '';
    directLaborPreviewBody.innerHTML = '';
}

// =============================================================================
// FIX: ENHANCE PRINT PREVIEW WITH COMPREHENSIVE ERROR HANDLING
// =============================================================================
function generatePrintPreview() {
    console.log("Starting print preview generation...");
    
    try {
        // Check if there's any data to print
        const hasLoadedRecipe = loadedRecipeForSummary !== null;
        const hasCurrentRecipe = recipeBody.children.length > 0 || directLaborRecipeBody.children.length > 0;
        
        if (!hasLoadedRecipe && !hasCurrentRecipe) {
            throw new Error("No recipe data available to print. Please either:\n\n1. Add items to your current recipe, OR\n2. Load a saved recipe in the Summary tab for analysis");
        }

        // Determine which recipe to print
        let recipeToPrint;
        let recipeName;
        let baseServings;
        
        if (loadedRecipeForSummary) {
            // Use the loaded recipe from summary analysis
            recipeToPrint = loadedRecipeForSummary;
            recipeName = recipeToPrint.name || "Unnamed Recipe";
            baseServings = recipeToPrint.servings || 1;
            
            // Validate loaded recipe data
            if (!recipeToPrint.rawMaterialItems && !recipeToPrint.directLaborItems) {
                throw new Error("Loaded recipe has no valid data. Please reload the recipe.");
            }
        } else {
            // Fall back to current recipe in calculator
            recipeName = recipeNameInput.value || "Current Recipe";
            baseServings = parseFloat(servingsInput.value) || 1;
        }
        
        const servingScale = parseFloat(servingScaleInput.value) || 1;
        
        // Calculate scaling factor with validation
        const scaleFactor = baseServings > 0 ? servingScale / baseServings : 0;
        const targetServings = servingScale;
        
        // Validate scaling configuration
        if (targetServings <= 0) {
            throw new Error("Invalid servings configuration. Serving scale must be greater than zero.");
        }

        // Generate print HTML with enhanced error handling
        let printHTML = `
            <div class="print-header">
                <h1>${escapeHtml(recipeName)} - Costing Report</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
                <div style="background: #f0f8f0; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    <strong>Scaling Information:</strong><br>
                    • Base Servings: ${baseServings}<br>
                    • Serving Scale: ${servingScale}x<br>
                    • Total Servings: ${targetServings}<br>
                    • <em>All costs below are SCALED for analysis</em>
                </div>
                ${loadedRecipeForSummary ? '<p style="color: #666; font-style: italic;">Printed from Saved Recipe Analysis</p>' : ''}
            </div>
        `;
        
        // Calculate costs with validation
        let rawMaterialsCost = 0;
        let rawMaterialItems = [];
        let directLaborCost = 0;
        let laborItems = [];
        
        if (loadedRecipeForSummary) {
            // Calculate from loaded recipe with serving scale for print
            rawMaterialItems = recipeToPrint.rawMaterialItems || [];
            laborItems = recipeToPrint.directLaborItems || [];
            
            rawMaterialsCost = rawMaterialItems.reduce((total, item) => {
                const scaledQuantity = (item.quantity || 0) * scaleFactor;
                const unitCost = item.unitCost || 0;
                return total + (scaledQuantity * unitCost);
            }, 0);
            
            directLaborCost = laborItems.reduce((total, item) => {
                const scaledTime = (item.quantity || 0) * scaleFactor;
                const unitCost = item.unitCost || 0;
                return total + (scaledTime * unitCost);
            }, 0);
        } else {
            // Calculate from current recipe with serving scale for print
            recipeBody.querySelectorAll("tr").forEach((row) => {
                try {
                    const q = parseFloat(row.children[1].querySelector("input").value) || 0;
                    const uc = parseFloat(row.children[3].querySelector("input").value) || 0; // FIXED: Index 3
                    const itemName = row.children[0].querySelector("input").value;
                    const type = row.dataset.type || 'rawMaterial';
                    const scaledQuantity = q * scaleFactor;
                    
                    // Get yield for display only
                    let yieldPct = 100;
                    if (type === 'rawMaterial') {
                        const rawMaterial = getCurrentRawMaterials().find(rm => rm.name === itemName);
                        if (rawMaterial && rawMaterial.yieldPercentage) {
                            yieldPct = rawMaterial.yieldPercentage;
                        }
                    }
                    
                    const itemCost = scaledQuantity * uc;
                    rawMaterialsCost += itemCost;
                    
                    rawMaterialItems.push({
                        name: itemName,
                        quantity: scaledQuantity,
                        unit: row.children[1].querySelector(".quantity-unit").textContent,
                        yield: yieldPct,
                        unitCost: uc,
                        totalCost: itemCost
                    });
                } catch (error) {
                    console.warn("Error processing recipe row for print:", error);
                }
            });
            
            directLaborRecipeBody.querySelectorAll("tr").forEach((row) => {
                try {
                    const time = parseFloat(row.children[1].querySelector("input").value) || 0;
                    const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
                    const scaledTime = time * scaleFactor;
                    const itemCost = scaledTime * rate;
                    directLaborCost += itemCost;
                    
                    laborItems.push({
                        name: row.children[0].querySelector("input").value,
                        timeRequired: scaledTime,
                        timeUnit: row.children[1].querySelector(".quantity-unit").textContent,
                        rate: rate,
                        totalCost: itemCost
                    });
                } catch (error) {
                    console.warn("Error processing labor row for print:", error);
                }
            });
        }
        
        const totalCost = rawMaterialsCost + directLaborCost;
        const costPerServing = targetServings > 0 ? totalCost / targetServings : 0;
        
        // Calculate selling prices
        const sellingPriceBeforeTax = costPerServing * (1 + (parseFloat(markupInput.value) || 0) / 100);
        const sellingPriceAfterTax = sellingPriceBeforeTax * (1 + ((parseFloat(taxInput.value) || 0) + (parseFloat(vatInput.value) || 0)) / 100);
        
        // Calculate percentages with zero division protection
        const foodCostPercent = sellingPriceBeforeTax > 0 ? (rawMaterialsCost / targetServings / sellingPriceBeforeTax) * 100 : 0;
        const laborCostPercent = sellingPriceBeforeTax > 0 ? (directLaborCost / targetServings / sellingPriceBeforeTax) * 100 : 0;
        const totalCostPercent = sellingPriceBeforeTax > 0 ? (totalCost / targetServings / sellingPriceBeforeTax) * 100 : 0;
        const grossProfitPercent = sellingPriceBeforeTax > 0 ? 100 - totalCostPercent : 0;

        // Update terminology in print preview
        const totalRevenue = sellingPriceBeforeTax * targetServings;
        const totalProfit = totalRevenue - totalCost;

        printHTML += `
            <div class="print-section">
                <h3>Serving Scale Analysis</h3>
                <table class="cost-breakdown">
                    <tbody>
                        <tr>
                            <td>Base Servings:</td>
                            <td>${baseServings}</td>
                        </tr>
                        <tr>
                            <td>Target Servings:</td>
                            <td>${targetServings}</td>
                        </tr>
                        <tr>
                            <td>Scaling Factor:</td>
                            <td>${scaleFactor.toFixed(2)}x</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="print-section">
                <h3>Raw Materials (Scaled)</h3>
                <table class="cost-breakdown">
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

        // Add raw materials rows with SCALED quantities
        rawMaterialItems.forEach(item => {
            printHTML += `
                <tr>
                    <td>${escapeHtml(item.name)}${item.type === 'sub-recipe' ? ' <span class="sub-recipe-badge">SUB</span>' : ''}</td>
                    <td>${item.quantity.toFixed(2)} ${item.unit}</td>
                    <td>${parseFloat(item.yield).toFixed(1)}%</td>
                    <td>${currency}${parseFloat(item.unitCost).toFixed(2)}/${item.unit}</td>
                    <td>${currency}${item.totalCost.toFixed(2)}</td>
                </tr>
            `;
        });

        printHTML += `
                    </tbody>
                    <tfoot>
                        <tr class="summary-highlight">
                            <td colspan="4">Raw Materials Subtotal</td>
                            <td>${currency}${rawMaterialsCost.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="print-section">
                <h3>Direct Labor (Scaled)</h3>
                <table class="cost-breakdown">
                    <thead>
                        <tr>
                            <th>Labor Item</th>
                            <th>Time Required</th>
                            <th>Rate</th>
                            <th>Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Add direct labor rows with SCALED quantities
        laborItems.forEach(item => {
            printHTML += `
                <tr>
                    <td>${escapeHtml(item.name)}</td>
                    <td>${item.timeRequired.toFixed(2)} ${item.timeUnit}</td>
                    <td>${currency}${parseFloat(item.rate).toFixed(2)}/${item.timeUnit}</td>
                    <td>${currency}${item.totalCost.toFixed(2)}</td>
                </tr>
            `;
        });

        printHTML += `
                    </tbody>
                    <tfoot>
                        <tr class="summary-highlight">
                            <td colspan="3">Direct Labor Subtotal</td>
                            <td>${currency}${directLaborCost.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div class="print-section">
                <h3>Cost Summary</h3>
                <table class="cost-breakdown">
                    <tbody>
                        <tr>
                            <td>Raw Materials Cost:</td>
                            <td>${currency}${rawMaterialsCost.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Direct Labor Cost:</td>
                            <td>${currency}${directLaborCost.toFixed(2)}</td>
                        </tr>
                        <tr class="totals-row">
                            <td><strong>Total Recipe Cost:</strong></td>
                            <td><strong>${currency}${totalCost.toFixed(2)}</strong></td>
                        </tr>
                        <tr>
                            <td>Target Servings:</td>
                            <td>${targetServings}</td>
                        </tr>
                        <tr>
                            <td>Cost per Serving (Before Tax):</td>
                            <td>${currency}${costPerServing.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Selling Price (After Tax):</td>
                            <td>${currency}${sellingPriceAfterTax.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="print-section">
                <h3>Profit Analysis</h3>
                <table class="cost-breakdown">
                    <tbody>
                        <tr>
                            <td>Food Cost %:</td>
                            <td>${foodCostPercent.toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td>Labor Cost %:</td>
                            <td>${laborCostPercent.toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td>Total Cost %:</td>
                            <td>${totalCostPercent.toFixed(1)}%</td>
                        </tr>
                        <tr class="summary-highlight">
                            <td><strong>Gross Profit Margin %:</strong></td>
                            <td><strong>${grossProfitPercent.toFixed(1)}%</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="print-section">
                <h3>Production Analysis</h3>
                <table class="cost-breakdown">
                    <tbody>
                        <tr>
                            <td>Serving Scale:</td>
                            <td>${servingScale}x</td>
                        </tr>
                        <tr>
                            <td>Total Servings:</td>
                            <td>${targetServings}</td>
                        </tr>
                        <tr>
                            <td>Total Revenue (Before Tax):</td>
                            <td>${currency}${totalRevenue.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>Total Cost:</td>
                            <td>${currency}${totalCost.toFixed(2)}</td>
                        </tr>
                        <tr class="summary-highlight">
                            <td><strong>Total Profit:</strong></td>
                            <td><strong>${currency}${totalProfit.toFixed(2)}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="print-footer">
                <p>Generated by ProfitPerPlate - Know your profit in every plate</p>
            </div>
        `;

        printPreviewContent.innerHTML = printHTML;
        console.log("Print preview generated successfully");
        
    } catch (error) {
        console.error("Error generating print preview:", error);
        
        // Create user-friendly error message
        const errorHTML = `
            <div class="print-header">
                <h2 style="color: #ff3b30;">Error Generating Print Preview</h2>
                <p><strong>What happened:</strong> ${error.message}</p>
                <div style="background: #fff0f0; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <h4>Possible Solutions:</h4>
                    <ul>
                        <li>Ensure you have recipe data (either loaded or in current recipe)</li>
                        <li>Check that all recipe items have valid quantities and costs</li>
                        <li>Verify serving scale is greater than zero</li>
                        <li>Try refreshing the page and reloading your recipe</li>
                    </ul>
                </div>
                <p><em>Technical details have been logged to the console for debugging.</em></p>
            </div>
        `;
        
        printPreviewContent.innerHTML = errorHTML;
        throw error; // Re-throw to allow modal to handle it
    }
}

// Print costing report
function printCostingReport() {
    // Close modal first
    closePrintPreview();
    
    // Wait a moment for modal to close, then print
    setTimeout(() => {
        // Create a new window with the print content
        const printWindow = window.open('', '_blank');
        const printContent = printPreviewContent.innerHTML;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Recipe Costing Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .print-header { text-align: center; border-bottom: 2px solid #2D5A3D; padding-bottom: 10px; margin-bottom: 20px; }
                    .print-section { margin-bottom: 20px; page-break-inside: avoid; }
                    .print-section h3 { background: #f5f7fa; padding: 8px; margin: 0 0 10px 0; border-left: 4px solid #2D5A3D; }
                    .cost-breakdown { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    .cost-breakdown th { background: #f5f7fa; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
                    .cost-breakdown td { padding: 8px; border: 1px solid #ddd; }
                    .summary-highlight { background: #f5f7fa !important; font-weight: bold; }
                    .totals-row { border-top: 2px solid #000 !important; font-weight: bold; }
                    .print-footer { margin-top: 30px; font-size: 10pt; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
                    @media print {
                        body { margin: 0; padding: 15px; }
                        .print-section { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Wait for content to load, then print
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }, 100);
}

// NEW: Populate summary recipe selector
function populateSummaryRecipeSelect() {
    if (!summaryRecipeSelect) return;
    
    summaryRecipeSelect.innerHTML = '<option value="">Select a recipe to analyze...</option>';
    
    const mainRecipes = getCurrentRecipes().filter(recipe => recipe.type === 'main');
    mainRecipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.id;
        option.textContent = `${recipe.name} (${formatCurrency(recipe.totalCost)})`;
        summaryRecipeSelect.appendChild(option);
    });
}

// Generate comprehensive help content
function generateCompleteHelpContent() {
    let html = `
        <div style="margin-bottom: var(--space-xl);">
            <p><strong>Welcome to ProfitPerPlate!</strong> This complete guide explains every field in simple terms with practical examples for beginners.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-xl);">
            <div>
                <h4 style="color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">Raw Materials & Recipe Fields</h4>
    `;

    // Add raw material and recipe fields
    const rawMaterialFields = [
        'ingredientName', 'ingredientCategory', 'purchasePrice', 'purchaseQuantity', 
        'purchaseUnit', 'costPerUnit', 'selectItem', 'quantity', 'servings'
    ];
    
    rawMaterialFields.forEach(fieldKey => {
        const field = fieldDefinitions[fieldKey];
        if (field) {
            html += `
                <div style="margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px dashed var(--border);">
                    <strong>${field.title}</strong>
                    <p style="margin: var(--space-sm) 0; font-size: 13px;">${field.content}</p>
                    <div class="field-example">
                        <strong>Example:</strong> ${field.example}
                    </div>
                </div>
            `;
        }
    });

    html += `
            </div>
            <div>
                <h4 style="color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">Direct Labor & Business Fields</h4>
    `;

    // Add direct labor and business fields
    const laborFields = [
        'laborName', 'shiftRate', 'shiftDuration', 'timeUnit', 'costUnit',
        'markup', 'tax', 'vat', 'servingScale', 'subRecipeName', 'subRecipeCategory',
        'subRecipeYieldQuantity', 'yieldPercentage'
    ];
    
    laborFields.forEach(fieldKey => {
        const field = fieldDefinitions[fieldKey];
        if (field) {
            html += `
                <div style="margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px dashed var(--border);">
                    <strong>${field.title}</strong>
                    <p style="margin: var(--space-sm) 0; font-size: 13px;">${field.content}</p>
                    <div class="field-example">
                        <strong>Example:</strong> ${field.example}
                    </div>
                </div>
            `;
        }
    });

    html += `
            </div>
        </div>

        <div style="margin-top: var(--space-xl); padding: var(--space-lg); background: var(--background); border-radius: var(--radius-lg);">
            <h4 style="color: var(--primary); margin-top: 0;">Quick Tip for Beginners</h4>
            <p>Start by adding your raw materials with their purchase details and direct labor items with shift details. Then create recipes by adding those items with the quantities or time required. Finally, set your desired markup and number of servings to see your profit per plate!</p>
            <p><strong>Remember:</strong> Accurate costs for both materials and labor lead to accurate profit calculations. Don't forget to account for yield (waste) for raw materials.</p>
        </div>
    `;

    return html;
}

// Show field-specific help with examples
function showFieldHelp(fieldKey, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const definition = fieldDefinitions[fieldKey];
    if (definition) {
        helpModalTitle.textContent = definition.title + " - Field Definition";
        helpModalContent.innerHTML = `
            <p><strong>${definition.title}</strong> — ${definition.content}</p>
            <div class="field-example">
                <strong>Example:</strong> ${definition.example}
            </div>
            <div style="margin-top: var(--space-lg); padding: var(--space-md); background: rgba(45, 90, 61, 0.05); border-radius: var(--radius-md);">
                <strong>💡 Tip:</strong> Look for the "?" buttons next to other fields for more explanations. 
                Use the main "?" button in the header for a complete field guide.
            </div>
        `;
    } else {
        helpModalTitle.textContent = "Field Definitions";
        helpModalContent.innerHTML = `<p>Definition not found for "${fieldKey}". Please refer to the general help.</p>`;
    }
    helpModal.classList.remove("hidden");
}

// Update sub-recipe unit options based on category
function updateSubRecipeUnitOptions() {
    if (!subRecipeCategory) return;
    
    const category = subRecipeCategory.value;
    
    [subRecipeYieldUnit, subRecipeCostUnit].forEach(unitSelect => {
        if (!unitSelect) return;
        
        unitSelect.innerHTML = '';
        
        categoryUnits[category].forEach((unit) => {
            const option = document.createElement("option");
            option.value = unit;
            option.textContent = unit;
            unitSelect.appendChild(option);
        });
    });
    
    updateSubRecipeCostDisplay();
}

// Update sub-recipe cost display
function updateSubRecipeCostDisplay() {
    if (!currentRecipeCostDisplay) return;
    
    const totalCost = calculateCurrentRecipeTotalCost();
    const yieldQty = parseFloat(subRecipeYieldQuantity.value) || 1;
    const yieldUnit = subRecipeYieldUnit.value;
    const costUnit = subRecipeCostUnit.value;
    
    let costPerUnit = 0;
    
    if (yieldQty > 0) {
        const costPerBaseUnit = totalCost / (yieldQty * UNIT_CONVERSIONS[yieldUnit]);
        costPerUnit = costPerBaseUnit * UNIT_CONVERSIONS[costUnit];
    }
    
    currentRecipeCostDisplay.textContent = `${currency}${totalCost.toFixed(2)}`;
    if (subRecipeCostPerUnit) {
        subRecipeCostPerUnit.value = costPerUnit.toFixed(4);
    }
    if (costPerOutputUnit) {
        costPerOutputUnit.textContent = `${currency}${costPerUnit.toFixed(4)} per ${costUnit}`;
    }
}

// Raw Material Management
function openRawMaterialModal(rawMaterial = null) {
    const modal = document.getElementById("rawMaterialModal");
    const title = document.getElementById("rawMaterialModalTitle");

    updateUnitOptions();

    if (rawMaterial) {
        title.textContent = "Edit Raw Material";
        populateRawMaterialForm(rawMaterial);
        editingItem = { type: 'rawMaterial', id: rawMaterial.id, data: rawMaterial };
    } else {
        title.textContent = "Add New Raw Material";
        document.getElementById("rawMaterialForm").reset();
        updateCostPerUnit();
        editingItem = { type: null, id: null, data: null };
    }

    modal.classList.remove("hidden");
}

function closeRawMaterialModal() {
    document.getElementById("rawMaterialModal").classList.add("hidden");
    document.getElementById("rawMaterialForm").reset();
    editingItem = { type: null, id: null, data: null };
}

// Update unit options based on selected category
function updateUnitOptions() {
    const category = document.getElementById(
        "modalRawMaterialCategory"
    ).value;
    const unitSelect = document.getElementById("modalRawMaterialUnit");
    const costUnitSelect = document.getElementById("modalCostUnit");

    if (!unitSelect || !costUnitSelect) return;

    unitSelect.innerHTML = "";
    costUnitSelect.innerHTML = "";

    categoryUnits[category].forEach((unit) => {
        const option = document.createElement("option");
        option.value = unit;
        option.textContent = unit;
        unitSelect.appendChild(option);

        const costOption = document.createElement("option");
        costOption.value = unit;
        costOption.textContent = unit;
        costUnitSelect.appendChild(costOption);
    });

    updateCostPerUnit();
}

// UPDATED: Calculate and display cost per unit for raw materials with yield-inclusive calculation
function updateCostPerUnit() {
    const price = parseFloat(document.getElementById("modalRawMaterialPrice").value) || 0;
    const quantity = parseFloat(document.getElementById("modalRawMaterialQuantity").value) || 1;
    const purchaseUnit = document.getElementById("modalRawMaterialUnit").value;
    const costUnit = document.getElementById("modalCostUnit").value;
    const yieldPercentage = parseFloat(document.getElementById("modalRawMaterialYield").value) || 100;

    let costPerUnit = 0;
    let calculationSteps = [];

    if (price > 0 && quantity > 0) {
        // NEW: Apply yield directly to cost calculation
        const baseCostPerUnit = price / quantity;
        calculationSteps.push(
            `Base cost: ${price.toFixed(2)} ${currency} ÷ ${quantity.toFixed(2)} = ${baseCostPerUnit.toFixed(4)} ${currency}/${purchaseUnit}`
        );

        // Apply yield adjustment
        const yieldAdjustedCost = baseCostPerUnit * (100 / yieldPercentage);
        calculationSteps.push(
            `With ${yieldPercentage}% yield: ${baseCostPerUnit.toFixed(4)} × (100 ÷ ${yieldPercentage}) = ${yieldAdjustedCost.toFixed(4)} ${currency}/${purchaseUnit}`
        );

        if (purchaseUnit !== costUnit) {
            const conversionFactor = UNIT_CONVERSIONS[costUnit] / UNIT_CONVERSIONS[purchaseUnit];
            costPerUnit = yieldAdjustedCost * conversionFactor;
            calculationSteps.push(
                `Convert to ${costUnit}: ${yieldAdjustedCost.toFixed(4)} × ${conversionFactor.toFixed(6)} = ${costPerUnit.toFixed(4)} ${currency}/${costUnit}`
            );
        } else {
            costPerUnit = yieldAdjustedCost;
            calculationSteps.push(`No conversion needed (already in ${costUnit})`);
        }
    }

    document.getElementById("modalCostPerUnit").value = costPerUnit.toFixed(6);
    updateCalculationDisplay(calculationSteps, costPerUnit, costUnit);
}

// Update cost per unit when user changes the cost unit
function updateCostPerUnitValue() {
    updateCostPerUnit();
}

// Update the calculation display with step-by-step breakdown
function updateCalculationDisplay(steps, finalCost, costUnit) {
    const calculationDetails = document.getElementById(
        "costCalculationDetails"
    );

    if (steps.length > 0) {
        let html = `<div><strong>Calculation Steps:</strong></div>`;
        steps.forEach((step) => {
            html += `<div style="margin: var(--space-xs) 0; padding-left: var(--space-md);">• ${step}</div>`;
        });
        html += `<div style="margin-top: var(--space-sm); font-weight: bold;">Final Cost: ${finalCost.toFixed(4)} ${currency}/${costUnit}</div>`;
        calculationDetails.innerHTML = html;
    } else {
        calculationDetails.textContent =
            "Enter purchase details to see calculation";
    }
}

// ENHANCED: Populate raw material form with yield field
function populateRawMaterialForm(rawMaterial) {
    document.getElementById("modalRawMaterialName").value = rawMaterial.name;
    document.getElementById("modalRawMaterialCategory").value =
        rawMaterial.category;

    updateUnitOptions();

    document.getElementById("modalRawMaterialPrice").value =
        rawMaterial.price.toFixed(2);
    document.getElementById("modalRawMaterialQuantity").value =
        rawMaterial.quantity.toFixed(2);
    document.getElementById("modalRawMaterialUnit").value = rawMaterial.unit;
    document.getElementById("modalCostPerUnit").value =
        rawMaterial.costPerUnit.toFixed(4);
    document.getElementById("modalCostUnit").value = rawMaterial.costUnit;
    document.getElementById("modalRawMaterialYield").value = rawMaterial.yieldPercentage || 100; // NEW: Populate yield

    updateCostPerUnit();
}

// =============================================================================
// NEW: ALPHABETICAL SORTING FUNCTIONS
// =============================================================================

// NEW: Alphabetical Sorting Functions
function sortRawMaterialsAlphabetically(rawMaterials) {
    return [...rawMaterials].sort((a, b) => a.name.localeCompare(b.name));
}

function sortDirectLaborAlphabetically(directLabor) {
    return [...directLabor].sort((a, b) => a.name.localeCompare(b.name));
}

function sortRecipesAlphabetically(recipes) {
    return [...recipes].sort((a, b) => a.name.localeCompare(b.name));
}

function sortRecipeItemsAlphabetically(items) {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

// =============================================================================
// FIX: ADD SERVING SCALE RESET ON TAB SWITCH
// =============================================================================
function switchTab(tabName) {
    // Update desktop sidebar
    document.querySelectorAll(".sidebar-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    // Update mobile tabs
    document.querySelectorAll(".mobile-tabs .tab-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.classList.toggle("active", tab.id === `${tabName}-tab`);
    });

    // NEW: Reset Serving Scale to 1 when leaving Summary tab to prevent confusion
    if (tabName !== 'summary' && servingScaleInput) {
        const currentScale = parseFloat(servingScaleInput.value) || 1;
        if (currentScale !== 1) {
            console.log(`INFO: Auto-resetting Serving Scale from ${currentScale} to 1 when leaving Summary tab`);
            servingScaleInput.value = 1;
            
            // If we have a loaded recipe, update the display with reset scale
            if (loadedRecipeForSummary) {
                updateLoadedRecipeSummary();
                updateCostBreakdownPreview();
            }
        }
    }

    // Update cost breakdown preview when switching to summary tab if a recipe is loaded
    if (tabName === 'summary') {
        if (loadedRecipeForSummary) {
            updateCostBreakdownPreview();
        } else {
            clearCostBreakdownPreview();
        }
    }
    
    // Save current tab state
    saveCurrentRecipeState();
}

// Utility functions
function formatCurrency(amount) {
    return `${currency}${parseFloat(amount).toFixed(2)}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Add auth state update function
function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');
    
    if (currentUser) {
        if (authButtons) authButtons.classList.add('hidden');
        if (userInfo) userInfo.classList.remove('hidden');
        if (userEmail) userEmail.textContent = currentUser.email;
        
        // Load user data
        loadUserData();
    } else {
        if (authButtons) authButtons.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
        
        // Clear data when logged out
        clearLocalData();
    }
}

// =============================================================================
// FIX: COMPREHENSIVE GLOBAL FUNCTION EXPORTS
// =============================================================================

// Auth and Password Functions
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.handleAuth = handleAuth;
window.handleLogout = handleLogout;
window.toggleAuthMode = toggleAuthMode;
window.openForgotPasswordModal = openForgotPasswordModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.sendPasswordReset = sendPasswordReset;
window.showResetPasswordModal = showResetPasswordModal;
window.closeResetPasswordModal = closeResetPasswordModal;
window.togglePasswordVisibilityGeneric = togglePasswordVisibilityGeneric;
window.handlePasswordReset = handlePasswordReset;
window.showResetPasswordError = showResetPasswordError;
window.closeAllModals = closeAllModals;

// Raw Material Functions
window.openRawMaterialModal = openRawMaterialModal;
window.closeRawMaterialModal = closeRawMaterialModal;
window.saveRawMaterial = saveRawMaterial;
window.deleteRawMaterial = deleteRawMaterial;
window.updateCostPerUnit = updateCostPerUnit;
window.updateCostPerUnitValue = updateCostPerUnitValue;
window.updateUnitOptions = updateUnitOptions;

// Direct Labor Functions
window.openDirectLaborModal = openDirectLaborModal;
window.closeDirectLaborModal = closeDirectLaborModal;
window.saveDirectLabor = saveDirectLabor;
window.deleteDirectLabor = deleteDirectLabor;
window.updateLaborCostPerUnit = updateLaborCostPerUnit;

// Recipe Calculator Functions
window.addItemToRecipe = addItemToRecipe;
window.addDirectLaborToRecipe = addDirectLaborToRecipe;
window.editRecipeRow = editRecipeRow;
window.editDirectLaborRow = editDirectLaborRow;
window.updateRecipeRow = updateRecipeRow;
window.updateDirectLaborRow = updateDirectLaborRow;

// Recipe Management Functions
window.saveRecipe = saveRecipe;
window.deleteRecipe = deleteRecipe;
window.editRecipe = editRecipe;
window.editSubRecipe = editSubRecipe;
window.loadRecipe = loadRecipe;
window.loadSubRecipe = loadSubRecipe;

// Sub-Recipe Functions
window.openSubRecipeSaveModal = openSubRecipeSaveModal;
window.closeSubRecipeSaveModal = closeSubRecipeSaveModal;
window.saveSubRecipe = saveSubRecipe;
window.updateSubRecipeUnitOptions = updateSubRecipeUnitOptions;
window.updateSubRecipeCostDisplay = updateSubRecipeCostDisplay;

// Summary and Analysis Functions
window.loadRecipeForSummary = loadRecipeForSummary;
window.switchTab = switchTab;
window.recalc = recalc;

// Print and Export Functions
window.printCostingReport = printCostingReport;
window.closePrintPreview = closePrintPreview;
window.generatePrintPreview = generatePrintPreview;

// Help System Functions
window.showFieldHelp = showFieldHelp;
window.closeHelpModal = closeHelpModal;

// Edit Prompt Functions
window.handleEditPromptChoice = handleEditPromptChoice;
window.handleRawMaterialEditChoice = handleRawMaterialEditChoice;
window.handleDirectLaborEditChoice = handleDirectLaborEditChoice;

// Utility Functions
window.renderRawMaterials = renderRawMaterials;
window.renderDirectLabor = renderDirectLabor;
window.filterRawMaterials = filterRawMaterials;
window.filterDirectLabor = filterDirectLabor;

// ADD MISSING GLOBAL EXPORTS
window.closeRawMaterialModal = closeRawMaterialModal;
window.closeDirectLaborModal = closeDirectLaborModal;
window.closeSubRecipeSaveModal = closeSubRecipeSaveModal;
window.closeEditPromptModal = closeEditPromptModal;
window.closeHelpModal = closeHelpModal;
window.closeRawMaterialEditPromptModal = closeRawMaterialEditPromptModal;
window.closeDirectLaborEditPromptModal = closeDirectLaborEditPromptModal;
window.onUnifiedItemSelectChange = onUnifiedItemSelectChange;

// COMPREHENSIVE EXPORT BLOCK FOR HTML ONCLICK HANDLERS
window.ProfitPerPlate = {
    // Core Functions
    initApp,
    recalc,
    switchTab,
    
    // Modal Functions
    openRawMaterialModal,
    closeRawMaterialModal,
    openDirectLaborModal,
    closeDirectLaborModal,
    openSubRecipeSaveModal,
    closeSubRecipeSaveModal,
    
    // Data Management
    saveRawMaterial,
    saveDirectLabor,
    deleteRawMaterial,
    deleteDirectLabor,
    
    // Recipe Functions
    addItemToRecipe,
    addDirectLaborToRecipe,
    resetRecipe,
    saveRecipe,
    saveSubRecipe,
    
    // Auth Functions
    openAuthModal,
    closeAuthModal,
    handleAuth,
    handleLogout
};

console.log("Global functions exported successfully");