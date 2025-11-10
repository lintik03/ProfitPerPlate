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
    yield: {
        title: "Yield Percentage",
        content: "The usable percentage after preparation (e.g., peeling, trimming, cooking loss). 100% means all purchased quantity is usable. Not applicable to labor.",
        example: "Example: If you buy carrots but peel them, only 85% might be usable. For pre-cut vegetables, you might have 100% yield."
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
        title: "Cost Per Unit",
        content: "The calculated cost for one unit of measurement. Automatically calculated from purchase details.",
        example: "Example: Total recipe cost ₱100 for 500ml yield = ₱0.20 per ml. If cost unit is L, then ₱200 per L (₱0.20/ml * 1000)."
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
    // NEW: Batch scaling field definition
    batchScale: {
        title: "Batch Scaling Factor",
        content: "Multiply the entire recipe by this factor to calculate costs for multiple batches. Useful for production planning and bulk preparation.",
        example: "Example: Enter '4' to calculate costs for making 4 batches of this recipe. All ingredient quantities, labor time, and costs will be multiplied by 4."
    }
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

// Auth Button Elements
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");

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
    if (themeToggle) {
        themeToggle.checked = isDark;
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem("profitPerPlate_theme", isDark ? 'dark' : 'light');
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
    if (themeToggle) {
        themeToggle.addEventListener('change', toggleTheme);
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

    // Currency Selector
    currencySelect.addEventListener("change", () => {
        currency = currencySelect.value;
        userData.currency = currency;
        document
            .querySelectorAll(".unit-currency")
            .forEach((e) => (e.textContent = currency));
        recalc();
        saveUserData();
        
        // NEW: Update cost breakdown preview
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
    
    closeHelpBtn.addEventListener("click", closeHelpModal);
    helpModal.addEventListener("click", (e) => {
        if (e.target === helpModal) closeHelpModal();
    });

    // Print button
    printBtn.addEventListener("click", () => {
        generatePrintPreview();
        printPreviewModal.classList.remove("hidden");
    });

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

    // FIX FOR ISSUE 2: Login button now explicitly sets isSignUpMode to false
    loginBtn.addEventListener("click", () => {
        isSignUpMode = false;
        openAuthModal();
    });
    
    signupBtn.addEventListener("click", () => {
        isSignUpMode = true;
        openAuthModal();
    });
    
    logoutBtn.addEventListener("click", handleLogout);
    authSubmitBtn.addEventListener("click", handleAuth);
    authSwitchBtn.addEventListener("click", toggleAuthMode);

    // Escape key handler
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

// Save raw material function (example of modified function)
function saveRawMaterial() {
    const name = document
        .getElementById("modalRawMaterialName")
        .value.trim();
    const category = document.getElementById(
        "modalRawMaterialCategory"
    ).value;
    const price = parseFloat(
        document.getElementById("modalRawMaterialPrice").value
    );
    const quantity = parseFloat(
        document.getElementById("modalRawMaterialQuantity").value
    );
    const unit = document.getElementById("modalRawMaterialUnit").value;
    const costPerUnit = parseFloat(
        document.getElementById("modalCostPerUnit").value
    );
    const costUnit = document.getElementById("modalCostUnit").value;

    if (!name) {
        alert("Please enter a raw material name");
        return;
    }

    if (!category) {
        alert("Please select a category");
        return;
    }

    if (isNaN(price) || price <= 0) {
        alert("Please enter a valid purchase price");
        return;
    }

    if (isNaN(quantity) || quantity <= 0) {
        alert("Please enter a valid purchase quantity");
        return;
    }

    if (isNaN(costPerUnit) || costPerUnit <= 0) {
        alert("Please enter valid cost calculation details");
        return;
    }

    const rawMaterialData = {
        id: Date.now(),
        name,
        category,
        price: parseFloat(price.toFixed(2)),
        quantity: parseFloat(quantity.toFixed(2)),
        unit,
        costPerUnit: parseFloat(costPerUnit.toFixed(4)),
        costUnit
    };

    if (editingItem.type === 'rawMaterial' && editingItem.id) {
        showEditPrompt('rawMaterial', editingItem.id, name);
        return;
    }

    const rawMaterials = getCurrentRawMaterials();
    rawMaterials.push(rawMaterialData);
    setCurrentRawMaterials(rawMaterials);

    renderRawMaterials();
    populateUnifiedItemSelect();
    closeRawMaterialModal();
    
    // NEW: Update cost breakdown preview
    updateCostBreakdownPreview();

    alert("Raw material saved successfully!");
}

function deleteRawMaterial(id) {
    if (confirm("Are you sure you want to delete this raw material?")) {
        const rawMaterials = getCurrentRawMaterials();
        const updatedRawMaterials = rawMaterials.filter((item) => item.id !== id);
        setCurrentRawMaterials(updatedRawMaterials);
        renderRawMaterials();
        populateUnifiedItemSelect();
        
        // NEW: Update cost breakdown preview
        updateCostBreakdownPreview();
    }
}

function renderRawMaterials() {
    const tableBody = document.getElementById("rawMaterialsTable");
    const filteredRawMaterials = filterRawMaterials();

    tableBody.innerHTML = filteredRawMaterials
        .map(
            (rawMaterial) => `
                <tr>
                    <td data-label="Raw Material">${rawMaterial.name}</td>
                    <td data-label="Category">${rawMaterial.category}</td>
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

    if (editingItem.type === 'directLabor' && editingItem.id) {
        showEditPrompt('directLabor', editingItem.id, name);
        return;
    }

    const directLabor = getCurrentDirectLabor();
    directLabor.push(directLaborData);
    setCurrentDirectLabor(directLabor);

    renderDirectLabor();
    populateUnifiedItemSelect();
    populateDirectLaborSelect();
    closeDirectLaborModal();

    alert("Direct labor saved successfully!");
}

function deleteDirectLabor(id) {
    if (confirm("Are you sure you want to delete this direct labor item?")) {
        const directLabor = getCurrentDirectLabor();
        const updatedDirectLabor = directLabor.filter((item) => item.id !== id);
        setCurrentDirectLabor(updatedDirectLabor);
        renderDirectLabor();
        populateUnifiedItemSelect();
        populateDirectLaborSelect();
    }
}

function renderDirectLabor() {
    const tableBody = document.getElementById("directLaborTable");
    const filteredDirectLabor = filterDirectLabor();

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

// Populate unified item select dropdown
function populateUnifiedItemSelect() {
    const select = document.getElementById("unifiedItemSelect");
    const rawMaterialsGroup = select.querySelector('optgroup[label="Raw Materials"]');
    const subRecipesGroup = select.querySelector('optgroup[label="Sub-Recipes"]');
    
    rawMaterialsGroup.innerHTML = '';
    subRecipesGroup.innerHTML = '';
    
    // Add raw materials
    getCurrentRawMaterials().forEach(item => {
        const option = document.createElement('option');
        option.value = `rawMaterial-${item.id}`;
        option.textContent = `${item.name} (${formatCurrency(item.costPerUnit)}/${item.costUnit})`;
        rawMaterialsGroup.appendChild(option);
    });
    
    // Add sub-recipes
    const subRecipes = getCurrentRecipes().filter(recipe => recipe.type === 'sub');
    subRecipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = `subrecipe-${recipe.id}`;
        
        // FIXED: Use costPerUnit instead of unitCost
        const unitCost = recipe.costPerUnit || 0;
        const costUnit = recipe.costUnit || recipe.outputUnit || 'batch';
        
        option.textContent = `${recipe.name} (${formatCurrency(unitCost)}/${costUnit})`;
        subRecipesGroup.appendChild(option);
    });
}

// Populate direct labor select dropdown
function populateDirectLaborSelect() {
    const select = document.getElementById("directLaborSelect");
    select.innerHTML = '<option value="">Select direct labor...</option>';
    
    getCurrentDirectLabor().forEach(labor => {
        const option = document.createElement('option');
        option.value = labor.id;
        option.textContent = `${labor.name} (${formatCurrency(labor.costPerUnit)}/${labor.costUnit})`;
        select.appendChild(option);
    });
}

// Recipe Table Management
function addRow(
    name = "",
    qtyVal = "0",
    unit = "g",
    yieldVal = "100",
    unitCostVal = "0.00",
    type = "rawMaterial",
    subRecipeId = null
) {
    const tr = document.createElement("tr");
    if (type === 'sub-recipe') {
        tr.classList.add('sub-recipe-row');
    }
    
    tr.innerHTML = `
            <td data-label="Item">
                ${type === 'sub-recipe' ? `<span class="sub-recipe-badge">SUB</span> ` : ''}
                <input type="text" value="${escapeHtml(name)}" placeholder="Item" ${type === 'sub-recipe' ? 'readonly' : ''}>
            </td>
            <td data-label="Qty/Time">
                <div class="quantity-input-group">
                    <input type="number" value="${parseFloat(qtyVal).toFixed(2)}" step="0.01" placeholder="Qty/Time">
                    <span class="quantity-unit">${unit}</span>
                </div>
            </td>
            <td data-label="Yield %">
                <div class="yield-input-group">
                    <input type="number" value="${parseFloat(yieldVal).toFixed(1)}" placeholder="Yield %" min="0" max="100" step="0.1" ${type === 'directLabor' ? 'disabled' : ''}>
                    <span class="yield-percent">%</span>
                </div>
            </td>
            <td class="unit-cost-cell" data-label="Unit Cost">
                <span class="unit-currency">${currency}</span>
                <input type="number" value="${parseFloat(unitCostVal).toFixed(2)}" step="0.01" style="width:60%" ${type === 'sub-recipe' ? 'readonly' : ''}>
                <span class="unit-display">/${unit}</span>
            </td>
            <td data-label="Total Cost">
                <span class="unit-currency">${currency}</span>
                <span class="total-value">0.00</span>
                <span class="unit-suffix">/recipe</span>
            </td>
            <td data-label="Action"><button class="delRow" style="background:var(--danger);color:var(--surface);border:none;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-md);">🗑️</button></td>
        `;

    const qty = tr.children[1].querySelector("input");
    const yieldInput = tr.children[2].querySelector("input");
    const unitCostInput = tr.children[3].querySelector("input");
    const totalVal = tr.children[4].querySelector(".total-value");
    const delBtn = tr.querySelector(".delRow");

    tr.dataset.type = type;
    if (subRecipeId) {
        tr.dataset.subRecipeId = subRecipeId;
    }

    function updateRow() {
        const q = parseFloat(qty.value) || 0;
        const uc = parseFloat(unitCostInput.value) || 0;
        const y = parseFloat(yieldInput.value) || 100;
        totalVal.textContent = (q * uc * (y / 100)).toFixed(2);
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // NEW: Update cost breakdown preview
        updateCostBreakdownPreview();
    }

    [qty, yieldInput, unitCostInput].forEach((e) =>
        e.addEventListener("input", updateRow)
    );
    delBtn.addEventListener("click", () => {
        tr.remove();
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // NEW: Update cost breakdown preview
        updateCostBreakdownPreview();
    });

    recipeBody.appendChild(tr);
    updateRow();
    
    // Auto-save current recipe state
    saveCurrentRecipeState();
}

// Add direct labor row to recipe
function addDirectLaborToRecipe() {
    const laborId = directLaborSelect.value;
    const timeRequired = parseFloat(timeRequirement.value);

    if (!laborId || !timeRequired || timeRequired <= 0) {
        alert("Please select a direct labor item and enter a valid time requirement");
        return;
    }

    const labor = getCurrentDirectLabor().find(item => item.id === parseInt(laborId));
    if (!labor) return;

    const tr = document.createElement("tr");
    tr.classList.add('labor-row');
    
    tr.innerHTML = `
            <td data-label="Labor Item">
                <input type="text" value="${escapeHtml(labor.name)}" placeholder="Labor item" readonly>
            </td>
            <td data-label="Time Required">
                <div class="quantity-input-group">
                    <input type="number" value="${parseFloat(timeRequired).toFixed(2)}" step="0.01" placeholder="Time">
                    <span class="quantity-unit">${labor.costUnit}</span>
                </div>
            </td>
            <td data-label="Rate">
                <div class="input-with-unit">
                    <input type="number" value="${labor.costPerUnit.toFixed(2)}" step="0.01" placeholder="Rate" readonly>
                    <span class="unit-display-small">/${labor.costUnit}</span>
                </div>
            </td>
            <td data-label="Total Cost">
                <span class="unit-currency">${currency}</span>
                <span class="total-value">0.00</span>
            </td>
            <td data-label="Action"><button class="delDirectLaborRow" style="background:var(--danger);color:var(--surface);border:none;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-md);">🗑️</button></td>
        `;

    const timeInput = tr.children[1].querySelector("input");
    const rateInput = tr.children[2].querySelector("input");
    const totalVal = tr.children[3].querySelector(".total-value");
    const delBtn = tr.querySelector(".delDirectLaborRow");

    tr.dataset.laborId = labor.id;

    function updateRow() {
        const time = parseFloat(timeInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        totalVal.textContent = (time * rate).toFixed(2);
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // NEW: Update cost breakdown preview
        updateCostBreakdownPreview();
    }

    timeInput.addEventListener("input", updateRow);
    delBtn.addEventListener("click", () => {
        tr.remove();
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // NEW: Update cost breakdown preview
        updateCostBreakdownPreview();
    });

    directLaborRecipeBody.appendChild(tr);
    updateRow();
    
    // Auto-save current recipe state
    saveCurrentRecipeState();

    // Clear inputs
    directLaborSelect.value = "";
    timeRequirement.value = "";
    timeRequirementUnit.textContent = "hours";
}

// FIX FOR ISSUE 1: Enhanced addItemToRecipe function to properly handle sub-recipe cost calculation
function addItemToRecipe() {
    const selectedValue = unifiedItemSelect.value;
    const quantity = parseFloat(addIngredientQty.value);
    const yieldPercent = parseFloat(addIngredientYield.value) || 100;

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
        const unitCost = rawMaterial.costPerUnit;

        addRow(
            rawMaterial.name,
            quantity.toFixed(2),
            unit,
            yieldPercent.toFixed(1),
            unitCost.toFixed(2),
            'rawMaterial'
        );
    } else if (type === 'subrecipe') {
        const subRecipe = getCurrentRecipes().find(recipe => recipe.id === itemId);
        if (!subRecipe) {
            alert("Sub-recipe not found! It may have been deleted.");
            return;
        }

        // FIXED: Enhanced sub-recipe cost calculation
        let unitCost = subRecipe.costPerUnit || 0;
        let unit = subRecipe.costUnit || subRecipe.outputUnit || 'batch';
        
        // Debug logging
        console.log("Adding sub-recipe:", subRecipe.name);
        console.log("Sub-recipe cost data:", {
            costPerUnit: subRecipe.costPerUnit,
            costUnit: subRecipe.costUnit,
            outputUnit: subRecipe.outputUnit,
            calculatedUnitCost: unitCost,
            calculatedUnit: unit
        });

        // Ensure we have valid cost data
        if (unitCost <= 0) {
            console.warn("Sub-recipe has zero or invalid cost:", subRecipe);
            // Try to calculate cost from sub-recipe ingredients
            const subRecipeTotalCost = calculateSubRecipeTotalCost(subRecipe);
            if (subRecipeTotalCost > 0 && subRecipe.yieldQuantity > 0) {
                unitCost = subRecipeTotalCost / subRecipe.yieldQuantity;
                console.log("Calculated sub-recipe cost from ingredients:", unitCost);
            }
        }

        addRow(
            subRecipe.name,
            quantity.toFixed(2),
            unit,
            yieldPercent.toFixed(1),
            unitCost.toFixed(2),
            'sub-recipe',
            subRecipe.id
        );
    }

    unifiedItemSelect.value = "";
    addIngredientQty.value = "";
    addIngredientYield.value = "100";
    addIngredientUnit.textContent = "g";
    addIngredientYield.disabled = false;
    
    // FIXED: Force recalculation to ensure sub-recipe costs are included
    recalc();
}

// NEW: Helper function to calculate sub-recipe total cost from ingredients
function calculateSubRecipeTotalCost(subRecipe) {
    let totalCost = 0;
    
    // Calculate raw material costs
    if (subRecipe.rawMaterialItems) {
        subRecipe.rawMaterialItems.forEach(item => {
            const itemCost = item.quantity * item.unitCost * (item.yield / 100);
            totalCost += itemCost;
        });
    }
    
    // Calculate direct labor costs
    if (subRecipe.directLaborItems) {
        subRecipe.directLaborItems.forEach(item => {
            const itemCost = item.quantity * item.unitCost;
            totalCost += itemCost;
        });
    }
    
    return totalCost;
}

// FIXED: Open sub-recipe save modal - handles both new and edit cases
function openSubRecipeSaveModal() {
    const recipeName = document.getElementById('recipeName').value.trim();
    if (!recipeName) {
        alert('Please enter a recipe name before saving as sub-recipe');
        document.getElementById('recipeName').focus();
        return;
    }

    // Set the sub-recipe name in the modal
    document.getElementById('subRecipeNameDisplay').value = recipeName;
    
    // If we're editing, pre-fill with existing data, otherwise use defaults
    if (editingItem.type === 'subRecipe' && editingItem.data) {
        openSubRecipeSaveModalForEdit();
    } else {
        // Reset form to default values for new sub-recipe
        document.getElementById('subRecipeCategory').value = 'weight';
        document.getElementById('subRecipeYieldQuantity').value = '1';
        updateSubRecipeUnitOptions();
        updateSubRecipeCostDisplay();
        
        // Show the modal
        document.getElementById('subRecipeSaveModal').classList.remove('hidden');
    }
}

// FIXED: Function to open sub-recipe save modal for editing
function openSubRecipeSaveModalForEdit() {
    const recipeName = document.getElementById('recipeName').value.trim();
    if (!recipeName) {
        alert('Please enter a recipe name before saving as sub-recipe');
        document.getElementById('recipeName').focus();
        return;
    }

    // Set the sub-recipe name in the modal
    document.getElementById('subRecipeNameDisplay').value = recipeName;
    
    // If we're editing, pre-fill with existing sub-recipe data
    if (editingItem.type === 'subRecipe' && editingItem.data) {
        const subRecipe = editingItem.data;
        document.getElementById('subRecipeCategory').value = subRecipe.category || 'weight';
        document.getElementById('subRecipeYieldQuantity').value = subRecipe.yieldQuantity || 1;
        
        // Update unit options and set the values
        updateSubRecipeUnitOptions();
        
        // Set the unit values after a small delay to ensure options are populated
        setTimeout(() => {
            if (subRecipe.yieldUnit) {
                document.getElementById('subRecipeYieldUnit').value = subRecipe.yieldUnit;
            }
            if (subRecipe.costUnit) {
                document.getElementById('subRecipeCostUnit').value = subRecipe.costUnit;
            }
            updateSubRecipeCostDisplay();
        }, 100);
    } else {
        // Reset form to default values for new sub-recipe
        document.getElementById('subRecipeCategory').value = 'weight';
        document.getElementById('subRecipeYieldQuantity').value = '1';
        updateSubRecipeUnitOptions();
        updateSubRecipeCostDisplay();
    }
    
    // Show the modal
    document.getElementById('subRecipeSaveModal').classList.remove('hidden');
}

// FIXED: Save sub-recipe function - handles both new and edit cases
function saveSubRecipe() {
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
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        const type = row.dataset.type || 'rawMaterial';
        
        if (type === 'rawMaterial') {
            rawMaterialItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                yield: yieldPct,
                unitCost: unitCost,
                type: 'rawMaterial'
            });
        } else if (type === 'directLabor') {
            directLaborItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                yield: yieldPct,
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
            yield: 100,
            unitCost: rate,
            type: 'directLabor'
        });
    });

    // Create sub-recipe object
    const subRecipe = {
        id: editingItem.id || Date.now(), // Use existing ID if editing, otherwise create new
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

    // Add to saved recipes
    const recipes = getCurrentRecipes();
    
    if (editingItem.id) {
        // Replace existing recipe
        const existingIndex = recipes.findIndex(r => r.id === editingItem.id);
        if (existingIndex !== -1) {
            recipes[existingIndex] = subRecipe;
        } else {
            recipes.push(subRecipe);
        }
    } else {
        // Add new recipe
        recipes.push(subRecipe);
    }
    
    setCurrentRecipes(recipes);

    // Update displays
    renderRecipesList();
    populateUnifiedItemSelect();
    
    // Update summary recipe selector
    populateSummaryRecipeSelect();
    
    // Close modal
    closeSubRecipeSaveModal();
    
    // Reset editing state
    editingItem = { type: null, id: null, data: null };
    
    alert(`Sub-recipe "${name}" ${editingItem.id ? 'updated' : 'saved'} successfully!`);
}

// Close sub-recipe save modal
function closeSubRecipeSaveModal() {
    document.getElementById('subRecipeSaveModal').classList.add('hidden');
}

// FIX FOR ISSUE 1: Save main recipe function - now properly handles sub-recipe items
function saveRecipe(type) {
    const name = recipeNameInput.value.trim();
    if (!name) {
        alert("Please enter a recipe name");
        recipeNameInput.focus();
        return;
    }

    // Get current recipe items - FIXED: Include sub-recipe items
    const rawMaterialItems = [];
    const directLaborItems = [];
    const subRecipeItems = [];
    
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit").textContent;
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
                unitCost: unitCost,
                type: 'rawMaterial'
            });
        } else if (rowType === 'sub-recipe') {
            subRecipeItems.push({
                name: itemName,
                quantity: quantity,
                unit: unit,
                yield: yieldPct,
                unitCost: unitCost,
                type: 'sub-recipe',
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
            yield: 100,
            unitCost: rate,
            type: 'directLabor'
        });
    });

    // Create recipe object - FIXED: Include subRecipeItems for main recipes
    const recipe = {
        id: editingItem.id || Date.now(),
        name: name,
        type: type,
        rawMaterialItems: rawMaterialItems,
        directLaborItems: directLaborItems,
        subRecipeItems: subRecipeItems, // NEW: Include sub-recipe items
        totalCost: calculateCurrentRecipeTotalCost(),
        servings: parseFloat(servingsInput.value) || 1,
        createdAt: new Date().toISOString()
    };

    // Add to saved recipes
    const recipes = getCurrentRecipes();
    
    // Check if we're editing an existing recipe
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
    
    // NEW: Update summary recipe selector
    populateSummaryRecipeSelect();
    
    // Reset editing state
    editingItem = { type: null, id: null, data: null };
    
    alert(`Recipe "${name}" saved successfully!`);
}

// FIX FOR ISSUE 1: Render recipes list - now properly counts sub-recipe items
function renderRecipesList() {
    const recipes = getCurrentRecipes();
    const mainRecipes = recipes.filter(recipe => recipe.type === 'main');
    const subRecipes = recipes.filter(recipe => recipe.type === 'sub');

    // Render main recipes - FIXED: Include subRecipeItems in count
    mainRecipesList.innerHTML = mainRecipes.map(recipe => {
        // Calculate total items including sub-recipe items
        const totalItems = recipe.rawMaterialItems.length + 
                          recipe.directLaborItems.length + 
                          (recipe.subRecipeItems ? recipe.subRecipeItems.length : 0);
        
        return `
        <div class="recipe-item" onclick="loadRecipe(${recipe.id})">
            <h4>${escapeHtml(recipe.name)}</h4>
            <p>Total Cost: ${formatCurrency(recipe.totalCost)} • ${totalItems} items • ${recipe.servings || 1} servings</p>
            <div class="recipe-actions">
                <button class="btn-secondary small" onclick="editRecipe(${recipe.id}, event)">Edit</button>
                <button class="btn-danger small" onclick="deleteRecipe(${recipe.id}, event)">Delete</button>
            </div>
        </div>
    `}).join('');

    // Render sub-recipes
    subRecipesList.innerHTML = subRecipes.map(recipe => {
        const totalItems = recipe.rawMaterialItems.length + recipe.directLaborItems.length;
        return `
        <div class="recipe-item" onclick="loadSubRecipe(${recipe.id})">
            <h4>${escapeHtml(recipe.name)}</h4>
            <p>Cost: ${formatCurrency(recipe.costPerUnit)}/${recipe.costUnit} • ${totalItems} items</p>
            <div class="recipe-actions">
                <button class="btn-secondary small" onclick="editSubRecipe(${recipe.id}, event)">Edit</button>
                <button class="btn-danger small" onclick="deleteRecipe(${recipe.id}, event)">Delete</button>
            </div>
        </div>
    `}).join('');
}

// FIX FOR ISSUE 1: Load recipe into current recipe - now properly loads sub-recipe items
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
            item.yield,
            item.unitCost,
            'rawMaterial'
        );
    });

    // FIXED: Add sub-recipe items if they exist
    if (recipe.subRecipeItems) {
        recipe.subRecipeItems.forEach(item => {
            addRow(
                item.name,
                item.quantity,
                item.unit,
                item.yield,
                item.unitCost,
                'sub-recipe',
                item.subRecipeId
            );
        });
    }

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

// Add direct labor row helper
function addDirectLaborRow(name, timeRequired, timeUnit, rate) {
    const tr = document.createElement("tr");
    tr.classList.add('labor-row');
    
    tr.innerHTML = `
        <td data-label="Labor Item">
            <input type="text" value="${escapeHtml(name)}" placeholder="Labor item" readonly>
        </td>
        <td data-label="Time Required">
            <div class="quantity-input-group">
                <input type="number" value="${parseFloat(timeRequired).toFixed(2)}" step="0.01" placeholder="Time">
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
        <td data-label="Action"><button class="delDirectLaborRow" style="background:var(--danger);color:var(--surface);border:none;padding:var(--space-sm) var(--space-md);border-radius:var(--radius-md);">🗑️</button></td>
    `;

    const timeInput = tr.children[1].querySelector("input");
    const rateInput = tr.children[2].querySelector("input");
    const totalVal = tr.children[3].querySelector(".total-value");
    const delBtn = tr.querySelector(".delDirectLaborRow");

    function updateRow() {
        const time = parseFloat(timeInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        totalVal.textContent = (time * rate).toFixed(2);
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // NEW: Update cost breakdown preview
        updateCostBreakdownPreview();
    }

    timeInput.addEventListener("input", updateRow);
    delBtn.addEventListener("click", () => {
        tr.remove();
        recalc();
        
        // Auto-save current recipe state
        saveCurrentRecipeState();
        
        // NEW: Update cost breakdown preview
        updateCostBreakdownPreview();
    });

    directLaborRecipeBody.appendChild(tr);
    updateRow();
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
            item.yield,
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
}

// Show edit prompt
function showEditPrompt(type, id, name) {
    editPromptTitle.textContent = "Save Changes";
    editPromptMessage.innerHTML = `
        <p>A recipe named "<strong>${escapeHtml(name)}</strong>" already exists.</p>
        <p>Would you like to replace the existing recipe or save this as a new recipe?</p>
    `;
    
    editingItem = { type, id, data: null };
    editPromptModal.classList.remove("hidden");
}

// FIXED: Handle edit prompt choice - properly handles sub-recipe editing
function handleEditPromptChoice(choice) {
    closeEditPromptModal();
    
    if (choice === 'replace') {
        // Replace existing recipe - open sub-recipe save modal for editing
        if (editingItem.type === 'subRecipe') {
            openSubRecipeSaveModalForEdit();
        } else {
            saveRecipe(editingItem.type === 'mainRecipe' ? 'main' : 'sub');
        }
    } else if (choice === 'new') {
        // Save as new recipe (generate new ID) - open sub-recipe save modal
        editingItem.id = null;
        openSubRecipeSaveModal();
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

// FIX FOR ISSUE 1: Enhanced flattenSubRecipes function to ensure sub-recipe costs are properly calculated
function flattenSubRecipes(recipeItems, batchScale = 1) {
    const flattenedItems = [];
    
    recipeItems.forEach(item => {
        if (item.type === 'sub-recipe' && item.subRecipeId) {
            // Find the sub-recipe
            const subRecipe = getCurrentRecipes().find(r => r.id === item.subRecipeId);
            if (subRecipe) {
                // Calculate the scaling factor for this sub-recipe usage
                const subRecipeScaling = item.quantity / (subRecipe.yieldQuantity || 1);
                
                console.log(`Flattening sub-recipe: ${subRecipe.name}`, {
                    itemQuantity: item.quantity,
                    subRecipeYield: subRecipe.yieldQuantity,
                    scalingFactor: subRecipeScaling,
                    batchScale: batchScale
                });
                
                // Flatten raw materials from sub-recipe
                if (subRecipe.rawMaterialItems) {
                    subRecipe.rawMaterialItems.forEach(subItem => {
                        const scaledQuantity = subItem.quantity * subRecipeScaling * batchScale;
                        const totalCost = scaledQuantity * subItem.unitCost * (subItem.yield / 100);
                        
                        console.log(`  - Raw material: ${subItem.name}`, {
                            originalQuantity: subItem.quantity,
                            scaledQuantity: scaledQuantity,
                            unitCost: subItem.unitCost,
                            yield: subItem.yield,
                            totalCost: totalCost
                        });
                        
                        flattenedItems.push({
                            name: `${subItem.name} (from ${subRecipe.name})`,
                            quantity: scaledQuantity,
                            unit: subItem.unit,
                            yield: subItem.yield,
                            unitCost: subItem.unitCost,
                            type: 'rawMaterial',
                            isFromSubRecipe: true
                        });
                    });
                }
                
                // Flatten direct labor from sub-recipe
                if (subRecipe.directLaborItems) {
                    subRecipe.directLaborItems.forEach(subItem => {
                        const scaledQuantity = subItem.quantity * subRecipeScaling * batchScale;
                        const totalCost = scaledQuantity * subItem.unitCost;
                        
                        console.log(`  - Direct labor: ${subItem.name}`, {
                            originalQuantity: subItem.quantity,
                            scaledQuantity: scaledQuantity,
                            unitCost: subItem.unitCost,
                            totalCost: totalCost
                        });
                        
                        flattenedItems.push({
                            name: `${subItem.name} (from ${subRecipe.name})`,
                            quantity: scaledQuantity,
                            unit: subItem.unit,
                            yield: subItem.yield,
                            unitCost: subItem.unitCost,
                            type: 'directLabor',
                            isFromSubRecipe: true
                        });
                    });
                }
            } else {
                console.warn(`Sub-recipe with ID ${item.subRecipeId} not found`);
                // If sub-recipe not found, treat as regular item
                flattenedItems.push({
                    ...item,
                    quantity: item.quantity * batchScale,
                    isFromSubRecipe: false
                });
            }
        } else {
            // Regular item, just scale it
            flattenedItems.push({
                ...item,
                quantity: item.quantity * batchScale,
                isFromSubRecipe: false
            });
        }
    });
    
    console.log("Flattened items total:", flattenedItems.length);
    return flattenedItems;
}

// Recalculate totals
function recalc() {
    const batchScale = parseFloat(batchScaleInput.value) || 1;
    const servings = parseFloat(servingsInput.value) || 1;
    const scaledServings = servings * batchScale;
    
    let rawMaterialsTotal = 0;
    let directLaborTotal = 0;

    // Get all recipe items
    const recipeItems = [];
    recipeBody.querySelectorAll("tr").forEach((row) => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit").textContent;
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        const type = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        recipeItems.push({
            name: itemName,
            quantity: quantity,
            unit: unit,
            yield: yieldPct,
            unitCost: unitCost,
            type: type,
            subRecipeId: subRecipeId
        });
    });

    // FIX FOR ISSUE 1: Enhanced flattening with better debugging
    const flattenedItems = flattenSubRecipes(recipeItems, batchScale);

    // Calculate totals from flattened items
    flattenedItems.forEach(item => {
        if (item.type === 'rawMaterial' || item.type === 'sub-recipe') {
            const itemCost = item.quantity * item.unitCost * (item.yield / 100);
            rawMaterialsTotal += itemCost;
            
            console.log(`Raw material cost: ${item.name}`, {
                quantity: item.quantity,
                unitCost: item.unitCost,
                yield: item.yield,
                cost: itemCost,
                runningTotal: rawMaterialsTotal
            });
        } else if (item.type === 'directLabor') {
            const itemCost = item.quantity * item.unitCost;
            directLaborTotal += itemCost;
            
            console.log(`Direct labor cost: ${item.name}`, {
                quantity: item.quantity,
                unitCost: item.unitCost,
                cost: itemCost,
                runningTotal: directLaborTotal
            });
        }
    });

    // Calculate direct labor total (separate from flattened items)
    directLaborRecipeBody.querySelectorAll("tr").forEach((row) => {
        const time = parseFloat(row.children[1].querySelector("input").value) || 0;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        const laborCost = (time * rate) * batchScale;
        directLaborTotal += laborCost;
        
        console.log(`Direct labor table cost:`, {
            time: time,
            rate: rate,
            cost: laborCost,
            runningTotal: directLaborTotal
        });
    });

    const grandTotal = rawMaterialsTotal + directLaborTotal;

    console.log("Final totals:", {
        rawMaterialsTotal: rawMaterialsTotal,
        directLaborTotal: directLaborTotal,
        grandTotal: grandTotal
    });

    // Update display
    rawMaterialsTotalEl.textContent = `${currency}${rawMaterialsTotal.toFixed(2)}`;
    directLaborTotalEl.textContent = `${currency}${directLaborTotal.toFixed(2)}`;
    grandTotalEl.textContent = `${currency}${grandTotal.toFixed(2)}`;

    // Update summary
    updateSummary(rawMaterialsTotal, directLaborTotal, grandTotal, scaledServings);
    
    // NEW: Update cost breakdown preview
    updateCostBreakdownPreview();
}

// FIX FOR ISSUE 2: Update summary section - Tax/VAT isolation for batch profit calculations
function updateSummary(rawMaterialsCost, directLaborCost, totalCost, scaledServings) {
    const markup = parseFloat(markupInput.value) || 0;
    const tax = parseFloat(taxInput.value) || 0;
    const vat = parseFloat(vatInput.value) || 0;

    const costPerServing = totalCost / scaledServings;
    const sellingPriceBeforeTax = costPerServing * (1 + markup / 100);
    const sellingPrice = sellingPriceBeforeTax * (1 + (tax + vat) / 100);

    // FIX FOR ISSUE 2c: Calculate percentages based on selling price BEFORE tax (industry standard)
    const foodCostPercent = sellingPriceBeforeTax > 0 ? (rawMaterialsCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const laborCostPercent = sellingPriceBeforeTax > 0 ? (directLaborCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const totalCostPercent = sellingPriceBeforeTax > 0 ? (totalCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const grossProfitPercent = sellingPriceBeforeTax > 0 ? 100 - totalCostPercent : 0;

    // FIX FOR ISSUE 2: Calculate batch profit (using BEFORE-TAX selling price for revenue)
    const batchRevenue = sellingPriceBeforeTax * scaledServings; // CHANGED: Use before-tax price
    const batchProfit = batchRevenue - totalCost;
    const batchProfitMargin = batchRevenue > 0 ? (batchProfit / batchRevenue) * 100 : 0;

    // NEW: Update servings display
    summaryServingsDisplay.textContent = scaledServings;

    summaryRawMaterialsCost.textContent = `${currency}${rawMaterialsCost.toFixed(2)}`;
    summaryDirectLaborCost.textContent = `${currency}${directLaborCost.toFixed(2)}`;
    summaryTotalCost.textContent = `${currency}${totalCost.toFixed(2)}`;
    summaryCostServing.textContent = `${currency}${costPerServing.toFixed(2)}`;
    summarySellingPrice.textContent = `${currency}${sellingPrice.toFixed(2)}`;
    summaryFoodCost.textContent = `${foodCostPercent.toFixed(1)}%`;
    summaryLaborCostPercent.textContent = `${laborCostPercent.toFixed(1)}%`;
    summaryTotalCostPercent.textContent = `${totalCostPercent.toFixed(1)}%`;
    summaryGrossProfit.textContent = `${grossProfitPercent.toFixed(1)}%`;

    // NEW: Update batch profit analysis
    summaryBatchRevenue.textContent = `${currency}${batchRevenue.toFixed(2)}`;
    summaryBatchProfit.textContent = `${currency}${batchProfit.toFixed(2)}`;
    summaryBatchProfitMargin.textContent = `${batchProfitMargin.toFixed(1)}%`;
}

// Generate print preview
function generatePrintPreview() {
    const recipeName = recipeNameInput.value || "Unnamed Recipe";
    const totalCost = calculateCurrentRecipeTotalCost();
    const markup = parseFloat(markupInput.value) || 0;
    const tax = parseFloat(taxInput.value) || 0;
    const vat = parseFloat(vatInput.value) || 0;
    const servings = parseFloat(servingsInput.value) || 1;
    const batchScale = parseFloat(batchScaleInput.value) || 1;
    
    const scaledServings = servings * batchScale;
    
    // Calculate raw materials and direct labor totals
    let rawMaterialsCost = 0;
    let directLaborCost = 0;
    
    // Get all recipe items for flattening
    const recipeItems = [];
    recipeBody.querySelectorAll("tr").forEach((row) => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit").textContent;
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        const type = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        recipeItems.push({
            name: itemName,
            quantity: quantity,
            unit: unit,
            yield: yieldPct,
            unitCost: unitCost,
            type: type,
            subRecipeId: subRecipeId
        });
    });

    // Use flattened items for calculation
    const flattenedItems = flattenSubRecipes(recipeItems, batchScale);
    
    flattenedItems.forEach(item => {
        if (item.type === 'rawMaterial' || item.type === 'sub-recipe') {
            rawMaterialsCost += item.quantity * item.unitCost * (item.yield / 100);
        } else if (item.type === 'directLabor') {
            directLaborCost += item.quantity * item.unitCost;
        }
    });
    
    directLaborRecipeBody.querySelectorAll("tr").forEach((row) => {
        const time = parseFloat(row.children[1].querySelector("input").value) || 0;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        directLaborCost += (time * rate) * batchScale;
    });
    
    const costPerServing = totalCost / scaledServings;
    const sellingPriceBeforeTax = costPerServing * (1 + markup / 100);
    const sellingPrice = sellingPriceBeforeTax * (1 + (tax + vat) / 100);
    
    // FIX FOR ISSUE 2c: Use selling price before tax for percentages
    const foodCostPercent = sellingPriceBeforeTax > 0 ? (rawMaterialsCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const laborCostPercent = sellingPriceBeforeTax > 0 ? (directLaborCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const totalCostPercent = sellingPriceBeforeTax > 0 ? (totalCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const grossProfitPercent = sellingPriceBeforeTax > 0 ? 100 - totalCostPercent : 0;

    // FIX FOR ISSUE 2: Batch profit calculations (using before-tax selling price)
    const batchRevenue = sellingPriceBeforeTax * scaledServings; // CHANGED: Use before-tax price
    const batchProfit = batchRevenue - totalCost;
    const batchProfitMargin = batchRevenue > 0 ? (batchProfit / batchRevenue) * 100 : 0;

    let printHTML = `
        <div class="print-header">
            <h1>${escapeHtml(recipeName)} - Costing Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} • ${scaledServings} serving${scaledServings !== 1 ? 's' : ''} (${batchScale}x batch)</p>
        </div>

        <div class="print-section">
            <h3>Raw Materials</h3>
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

    // Add raw materials rows from flattened items
    const rawMaterialFlattened = flattenedItems.filter(item => item.type === 'rawMaterial' || item.type === 'sub-recipe');
    rawMaterialFlattened.forEach(item => {
        const totalCost = item.quantity * item.unitCost * (item.yield / 100);
        
        printHTML += `
            <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${item.quantity.toFixed(2)} ${item.unit}</td>
                <td>${parseFloat(item.yield).toFixed(1)}%</td>
                <td>${currency}${parseFloat(item.unitCost).toFixed(2)}/${item.unit}</td>
                <td>${currency}${totalCost.toFixed(2)}</td>
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
            <h3>Direct Labor</h3>
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

    // Add direct labor rows from flattened items
    const laborFlattened = flattenedItems.filter(item => item.type === 'directLabor');
    laborFlattened.forEach(item => {
        const totalCost = item.quantity * item.unitCost;
        
        printHTML += `
            <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${item.quantity.toFixed(2)} ${item.unit}</td>
                <td>${currency}${parseFloat(item.unitCost).toFixed(2)}/${item.unit}</td>
                <td>${currency}${totalCost.toFixed(2)}</td>
            </tr>
        `;
    });

    // Add direct labor from the direct labor table
    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const laborName = row.children[0].querySelector("input").value;
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const timeUnit = row.children[1].querySelector(".quantity-unit").textContent;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        const rateUnit = row.children[2].querySelector(".unit-display-small").textContent;
        const totalCost = (timeRequired * rate) * batchScale;
        
        printHTML += `
            <tr>
                <td>${escapeHtml(laborName)}</td>
                <td>${(timeRequired * batchScale).toFixed(2)} ${timeUnit}</td>
                <td>${currency}${parseFloat(rate).toFixed(2)}${rateUnit}</td>
                <td>${currency}${totalCost.toFixed(2)}</td>
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
                        <td>Servings:</td>
                        <td>${scaledServings}</td>
                    </tr>
                    <tr>
                        <td>Cost per Serving (Before Tax):</td>
                        <td>${currency}${costPerServing.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Selling Price (After Tax):</td>
                        <td>${currency}${sellingPrice.toFixed(2)}</td>
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
            <h3>Batch Production Analysis</h3>
            <table class="cost-breakdown">
                <tbody>
                    <tr>
                        <td>Batch Scale:</td>
                        <td>${batchScale}x</td>
                    </tr>
                    <tr>
                        <td>Total Servings:</td>
                        <td>${scaledServings}</td>
                    </tr>
                    <tr>
                        <td>Batch Revenue:</td>
                        <td>${currency}${batchRevenue.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Batch Cost:</td>
                        <td>${currency}${totalCost.toFixed(2)}</td>
                    </tr>
                    <tr class="summary-highlight">
                        <td><strong>Batch Profit:</strong></td>
                        <td><strong>${currency}${batchProfit.toFixed(2)}</strong></td>
                    </tr>
                    <tr class="summary-highlight">
                        <td><strong>Batch Profit Margin:</strong></td>
                        <td><strong>${batchProfitMargin.toFixed(1)}%</strong></td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="print-footer">
            <p>Generated by ProfitPerPlate - Know your profit in every plate</p>
        </div>
    `;

    printPreviewContent.innerHTML = printHTML;
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
    summaryRecipeSelect.innerHTML = '<option value="">Select a recipe to analyze...</option>';
    
    const mainRecipes = getCurrentRecipes().filter(recipe => recipe.type === 'main');
    mainRecipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.id;
        option.textContent = `${recipe.name} (${formatCurrency(recipe.totalCost)})`;
        summaryRecipeSelect.appendChild(option);
    });
}

// NEW: Load recipe for summary analysis - FIX FOR ISSUE 1
function loadRecipeForSummary() {
    const recipeId = summaryRecipeSelect.value;
    if (!recipeId) {
        alert("Please select a recipe to load");
        return;
    }

    const recipe = getCurrentRecipes().find(r => r.id === parseInt(recipeId));
    if (!recipe) return;

    loadedRecipeForSummary = recipe;
    
    // Update display
    currentRecipeNameDisplay.textContent = recipe.name;
    loadedRecipeTotalCost.textContent = `${currency}${recipe.totalCost.toFixed(2)}`;
    loadedRecipeServings.textContent = recipe.servings || 1;
    
    // FIX FOR ISSUE 1: Calculate total items including sub-recipe items
    const totalItems = recipe.rawMaterialItems.length + 
                      recipe.directLaborItems.length + 
                      (recipe.subRecipeItems ? recipe.subRecipeItems.length : 0);
    loadedRecipeItemCount.textContent = `${totalItems} items`;
    
    loadedRecipeDisplay.classList.remove('hidden');
    
    // FIX FOR ISSUE 1: Update summary with loaded recipe data
    updateSummaryWithLoadedRecipe(recipe);
}

// NEW: Update summary with loaded recipe data - FIX FOR ISSUE 1
function updateSummaryWithLoadedRecipe(recipe) {
    const batchScale = parseFloat(batchScaleInput.value) || 1;
    
    // FIX FOR ISSUE 1: Enhanced flattening for loaded recipes
    const allItems = [...recipe.rawMaterialItems, ...recipe.directLaborItems];
    const flattenedItems = flattenSubRecipes(allItems, batchScale);
    
    // Calculate totals from flattened items
    let rawMaterialsTotal = 0;
    let directLaborTotal = 0;
    
    flattenedItems.forEach(item => {
        if (item.type === 'rawMaterial' || item.type === 'sub-recipe') {
            rawMaterialsTotal += item.quantity * item.unitCost * (item.yield / 100);
        } else if (item.type === 'directLabor') {
            directLaborTotal += item.quantity * item.unitCost;
        }
    });
    
    const totalCost = rawMaterialsTotal + directLaborTotal;
    const servings = recipe.servings || 1;
    const scaledServings = servings * batchScale;
    
    // Calculate batch profit
    const markup = parseFloat(markupInput.value) || 0;
    const tax = parseFloat(taxInput.value) || 0;
    const vat = parseFloat(vatInput.value) || 0;
    
    const costPerServing = totalCost / scaledServings;
    const sellingPriceBeforeTax = costPerServing * (1 + markup / 100);
    const sellingPrice = sellingPriceBeforeTax * (1 + (tax + vat) / 100);
    
    // FIX FOR ISSUE 2: Use before-tax selling price for batch revenue
    const batchRevenue = sellingPriceBeforeTax * scaledServings;
    const batchProfit = batchRevenue - totalCost;
    const batchProfitMargin = batchRevenue > 0 ? (batchProfit / batchRevenue) * 100 : 0;
    
    // FIX FOR ISSUE 2c: Use selling price before tax for percentages
    const foodCostPercent = sellingPriceBeforeTax > 0 ? (rawMaterialsTotal / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const laborCostPercent = sellingPriceBeforeTax > 0 ? (directLaborTotal / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const totalCostPercent = sellingPriceBeforeTax > 0 ? (totalCost / scaledServings / sellingPriceBeforeTax) * 100 : 0;
    const grossProfitPercent = sellingPriceBeforeTax > 0 ? 100 - totalCostPercent : 0;
    
    // Update servings display
    summaryServingsDisplay.textContent = scaledServings;
    
    // Update summary with calculated values
    summaryRawMaterialsCost.textContent = `${currency}${rawMaterialsTotal.toFixed(2)}`;
    summaryDirectLaborCost.textContent = `${currency}${directLaborTotal.toFixed(2)}`;
    summaryTotalCost.textContent = `${currency}${totalCost.toFixed(2)}`;
    summaryCostServing.textContent = `${currency}${costPerServing.toFixed(2)}`;
    summarySellingPrice.textContent = `${currency}${sellingPrice.toFixed(2)}`;
    
    summaryFoodCost.textContent = `${foodCostPercent.toFixed(1)}%`;
    summaryLaborCostPercent.textContent = `${laborCostPercent.toFixed(1)}%`;
    summaryTotalCostPercent.textContent = `${totalCostPercent.toFixed(1)}%`;
    summaryGrossProfit.textContent = `${grossProfitPercent.toFixed(1)}%`;
    
    // Update batch profit analysis
    summaryBatchRevenue.textContent = `${currency}${batchRevenue.toFixed(2)}`;
    summaryBatchProfit.textContent = `${currency}${batchProfit.toFixed(2)}`;
    summaryBatchProfitMargin.textContent = `${batchProfitMargin.toFixed(1)}%`;
    
    // Update cost breakdown preview with loaded recipe
    updateCostBreakdownPreviewWithRecipe(recipe);
}

// NEW: Update cost breakdown preview with specific recipe
function updateCostBreakdownPreviewWithRecipe(recipe) {
    const batchScale = parseFloat(batchScaleInput.value) || 1;
    
    // FIX FOR ISSUE 1: Enhanced flattening for display
    const allItems = [...recipe.rawMaterialItems, ...recipe.directLaborItems];
    const flattenedItems = flattenSubRecipes(allItems, batchScale);
    
    // Separate flattened items by type
    const rawMaterialFlattened = flattenedItems.filter(item => item.type === 'rawMaterial' || item.type === 'sub-recipe');
    const directLaborFlattened = flattenedItems.filter(item => item.type === 'directLabor');
    
    // Update raw materials preview
    rawMaterialsCount.textContent = `${rawMaterialFlattened.length} items`;
    
    let rawMaterialsSubtotal = 0;
    rawMaterialsPreviewBody.innerHTML = '';
    
    rawMaterialFlattened.forEach(item => {
        const totalCost = item.quantity * item.unitCost * (item.yield / 100);
        
        const rowElement = document.createElement('tr');
        rowElement.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${item.quantity.toFixed(2)} ${item.unit}</td>
            <td>${parseFloat(item.yield).toFixed(1)}%</td>
            <td>${currency}${parseFloat(item.unitCost).toFixed(2)}/${item.unit}</td>
            <td>${currency}${totalCost.toFixed(2)}</td>
        `;
        rawMaterialsPreviewBody.appendChild(rowElement);
        
        rawMaterialsSubtotal += totalCost;
    });
    
    rawMaterialsPreviewTotal.textContent = `${currency}${rawMaterialsSubtotal.toFixed(2)}`;
    rawMaterialsPreviewSubtotal.textContent = `${currency}${rawMaterialsSubtotal.toFixed(2)}`;
    
    // Update direct labor preview
    directLaborCount.textContent = `${directLaborFlattened.length} items`;
    
    let directLaborSubtotal = 0;
    directLaborPreviewBody.innerHTML = '';
    
    directLaborFlattened.forEach(item => {
        const totalCost = item.quantity * item.unitCost;
        
        const rowElement = document.createElement('tr');
        rowElement.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${item.quantity.toFixed(2)} ${item.unit}</td>
            <td>${currency}${parseFloat(item.unitCost).toFixed(2)}/${item.unit}</td>
            <td>${currency}${totalCost.toFixed(2)}</td>
        `;
        directLaborPreviewBody.appendChild(rowElement);
        
        directLaborSubtotal += totalCost;
    });
    
    directLaborPreviewTotal.textContent = `${currency}${directLaborSubtotal.toFixed(2)}`;
    directLaborPreviewSubtotal.textContent = `${currency}${directLaborSubtotal.toFixed(2)}`;
}

// NEW: Update cost breakdown preview
function updateCostBreakdownPreview() {
    // If a recipe is loaded for summary, use that data
    if (loadedRecipeForSummary) {
        updateCostBreakdownPreviewWithRecipe(loadedRecipeForSummary);
        return;
    }
    
    // Otherwise use current recipe data
    const batchScale = parseFloat(batchScaleInput.value) || 1;
    
    // Get current recipe items for flattening
    const recipeItems = [];
    recipeBody.querySelectorAll("tr").forEach(row => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit").textContent;
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        const type = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        recipeItems.push({
            name: itemName,
            quantity: quantity,
            unit: unit,
            yield: yieldPct,
            unitCost: unitCost,
            type: type,
            subRecipeId: subRecipeId
        });
    });

    // FIX FOR ISSUE 1: Enhanced flattening for display
    const flattenedItems = flattenSubRecipes(recipeItems, batchScale);
    
    // Separate flattened items by type
    const rawMaterialFlattened = flattenedItems.filter(item => item.type === 'rawMaterial' || item.type === 'sub-recipe');
    const directLaborFlattened = flattenedItems.filter(item => item.type === 'directLabor');
    
    // Update raw materials preview
    rawMaterialsCount.textContent = `${rawMaterialFlattened.length} items`;
    
    let rawMaterialsSubtotal = 0;
    rawMaterialsPreviewBody.innerHTML = '';
    
    rawMaterialFlattened.forEach(item => {
        const totalCost = item.quantity * item.unitCost * (item.yield / 100);
        
        const rowElement = document.createElement('tr');
        rowElement.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${item.quantity.toFixed(2)} ${item.unit}</td>
            <td>${parseFloat(item.yield).toFixed(1)}%</td>
            <td>${currency}${parseFloat(item.unitCost).toFixed(2)}/${item.unit}</td>
            <td>${currency}${totalCost.toFixed(2)}</td>
        `;
        rawMaterialsPreviewBody.appendChild(rowElement);
        
        rawMaterialsSubtotal += totalCost;
    });
    
    rawMaterialsPreviewTotal.textContent = `${currency}${rawMaterialsSubtotal.toFixed(2)}`;
    rawMaterialsPreviewSubtotal.textContent = `${currency}${rawMaterialsSubtotal.toFixed(2)}`;
    
    // Update direct labor preview (include direct labor table items)
    const directLaborTableItems = [];
    directLaborRecipeBody.querySelectorAll("tr").forEach(row => {
        const laborName = row.children[0].querySelector("input").value;
        const timeRequired = parseFloat(row.children[1].querySelector("input").value) || 0;
        const timeUnit = row.children[1].querySelector(".quantity-unit").textContent;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        const totalCost = (timeRequired * rate) * batchScale;
        
        directLaborTableItems.push({
            name: laborName,
            quantity: timeRequired * batchScale,
            unit: timeUnit,
            unitCost: rate,
            totalCost: totalCost
        });
    });
    
    directLaborCount.textContent = `${directLaborFlattened.length + directLaborTableItems.length} items`;
    
    let directLaborSubtotal = 0;
    directLaborPreviewBody.innerHTML = '';
    
    // Add flattened direct labor items
    directLaborFlattened.forEach(item => {
        const totalCost = item.quantity * item.unitCost;
        
        const rowElement = document.createElement('tr');
        rowElement.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${item.quantity.toFixed(2)} ${item.unit}</td>
            <td>${currency}${parseFloat(item.unitCost).toFixed(2)}/${item.unit}</td>
            <td>${currency}${totalCost.toFixed(2)}</td>
        `;
        directLaborPreviewBody.appendChild(rowElement);
        
        directLaborSubtotal += totalCost;
    });
    
    // Add direct labor table items
    directLaborTableItems.forEach(item => {
        const rowElement = document.createElement('tr');
        rowElement.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${item.quantity.toFixed(2)} ${item.unit}</td>
            <td>${currency}${parseFloat(item.unitCost).toFixed(2)}/${item.unit}</td>
            <td>${currency}${item.totalCost.toFixed(2)}</td>
        `;
        directLaborPreviewBody.appendChild(rowElement);
        
        directLaborSubtotal += item.totalCost;
    });
    
    directLaborPreviewTotal.textContent = `${currency}${directLaborSubtotal.toFixed(2)}`;
    directLaborPreviewSubtotal.textContent = `${currency}${directLaborSubtotal.toFixed(2)}`;
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
        'purchaseUnit', 'costPerUnit', 'selectItem', 'quantity', 'yield', 'servings'
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
        'markup', 'tax', 'vat', 'batchScale', 'subRecipeName', 'subRecipeCategory',
        'subRecipeYieldQuantity'
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
    const category = subRecipeCategory.value;
    
    [subRecipeYieldUnit, subRecipeCostUnit].forEach(unitSelect => {
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
    subRecipeCostPerUnit.value = costPerUnit.toFixed(4);
    costPerOutputUnit.textContent = `${currency}${costPerUnit.toFixed(4)} per ${costUnit}`;
}

// Calculate current recipe total cost (raw materials + direct labor)
function calculateCurrentRecipeTotalCost() {
    const batchScale = parseFloat(batchScaleInput.value) || 1;
    
    let rawMaterialsTotal = 0;
    let directLaborTotal = 0;
    
    // Get recipe items for flattening
    const recipeItems = [];
    recipeBody.querySelectorAll("tr").forEach((row) => {
        const itemName = row.children[0].querySelector("input").value;
        const quantity = parseFloat(row.children[1].querySelector("input").value) || 0;
        const unit = row.children[1].querySelector(".quantity-unit").textContent;
        const yieldPct = parseFloat(row.children[2].querySelector("input").value) || 100;
        const unitCost = parseFloat(row.children[3].querySelector("input").value) || 0;
        const type = row.dataset.type || 'rawMaterial';
        const subRecipeId = row.dataset.subRecipeId || null;
        
        recipeItems.push({
            name: itemName,
            quantity: quantity,
            unit: unit,
            yield: yieldPct,
            unitCost: unitCost,
            type: type,
            subRecipeId: subRecipeId
        });
    });

    // Use flattened items for calculation
    const flattenedItems = flattenSubRecipes(recipeItems, batchScale);
    
    flattenedItems.forEach(item => {
        if (item.type === 'rawMaterial' || item.type === 'sub-recipe') {
            rawMaterialsTotal += item.quantity * item.unitCost * (item.yield / 100);
        } else if (item.type === 'directLabor') {
            directLaborTotal += item.quantity * item.unitCost;
        }
    });
    
    directLaborRecipeBody.querySelectorAll("tr").forEach((row) => {
        const time = parseFloat(row.children[1].querySelector("input").value) || 0;
        const rate = parseFloat(row.children[2].querySelector("input").value) || 0;
        directLaborTotal += (time * rate) * batchScale;
    });
    
    return parseFloat((rawMaterialsTotal + directLaborTotal).toFixed(2));
}

// Tab Management
function switchTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
    });

    document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.classList.toggle("active", tab.id === `${tabName}-tab`);
    });
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

// Calculate and display cost per unit for raw materials
function updateCostPerUnit() {
    const price =
        parseFloat(document.getElementById("modalRawMaterialPrice").value) ||
        0;
    const quantity =
        parseFloat(
            document.getElementById("modalRawMaterialQuantity").value
        ) || 1;
    const purchaseUnit = document.getElementById(
        "modalRawMaterialUnit"
    ).value;
    const costUnit = document.getElementById("modalCostUnit").value;

    let costPerUnit = 0;
    let calculationSteps = [];

    if (price > 0 && quantity > 0) {
        const costPerPurchaseUnit = price / quantity;
        calculationSteps.push(
            `Cost per ${purchaseUnit}: ${price.toFixed(2)} ${currency} ÷ ${quantity.toFixed(2)} = ${costPerPurchaseUnit.toFixed(4)} ${currency}/${purchaseUnit}`
        );

        if (purchaseUnit !== costUnit) {
            const conversionFactor =
                UNIT_CONVERSIONS[costUnit] / UNIT_CONVERSIONS[purchaseUnit];
            costPerUnit = costPerPurchaseUnit * conversionFactor;
            calculationSteps.push(
                `Convert to ${costUnit}: ${costPerPurchaseUnit.toFixed(4)} ${currency}/${purchaseUnit} × ${conversionFactor.toFixed(6)} = ${costPerUnit.toFixed(4)} ${currency}/${costUnit}`
            );
        } else {
            costPerUnit = costPerPurchaseUnit;
            calculationSteps.push(
                `No conversion needed (already in ${costUnit})`
            );
        }
    }

    document.getElementById("modalCostPerUnit").value =
        costPerUnit.toFixed(4);

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

    updateCostPerUnit();
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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);