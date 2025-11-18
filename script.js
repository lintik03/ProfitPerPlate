let e = {
    rawMaterials: [],
    directLabor: [],
    recipes: [],
    currency: "₱",
    currentRecipeState: null
  },
  t = { type: null, id: null, data: null },
  n = null;
(window.currentEditingRow = null), (window.currentEditingLaborRow = null);
let o = null;
const a = {
    kg: 1e3,
    g: 1,
    mg: 0.001,
    lbs: 453.592,
    oz: 28.3495,
    L: 1e3,
    ml: 1,
    cup: 236.588,
    tbsp: 14.7868,
    tsp: 4.92892,
    dozen: 12,
    pc: 1,
    hours: 60,
    minutes: 1
  },
  i = {
    weight: ["kg", "g", "mg", "lbs", "oz"],
    volume: ["L", "ml", "cup", "tbsp", "tsp"],
    count: ["dozen", "pc"],
    time: ["hours", "minutes"]
  },
  r = "g";
function l(e) {
  return e && "object" == typeof e
    ? ((e.rawMaterialItems = Array.isArray(e.rawMaterialItems)
        ? e.rawMaterialItems.map((e) => {
            const t = { ...e },
              n = Number(
                t.unitCost ?? t.costPerUnit ?? t.cost_per_unit ?? t.cost ?? 0
              );
            return (
              (t.unitCost = isFinite(n) ? n : 0),
              (t.unit = t.unit ?? t.costUnit ?? t.outputUnit ?? r),
              (t.quantity = Number(t.quantity ?? t.qty ?? 0)),
              (t.type = t.type ?? "rawMaterial"),
              t
            );
          })
        : []),
      (e.directLaborItems = Array.isArray(e.directLaborItems)
        ? e.directLaborItems.map((e) => {
            const t = { ...e },
              n = Number(t.unitCost ?? t.rate ?? t.costPerUnit ?? t.cost ?? 0);
            return (
              (t.unitCost = isFinite(n) ? n : 0),
              (t.unit = t.unit ?? t.timeUnit ?? t.costUnit ?? "hours"),
              (t.quantity = Number(t.quantity ?? t.timeRequired ?? 0)),
              t
            );
          })
        : []),
      (e.totalCost = Number(e.totalCost ?? 0)),
      (e.servings = Number(e.servings ?? 1)),
      (e.type = e.type ?? "main"),
      e)
    : e || {};
}
function s(e) {
  if (!e || "object" != typeof e)
    return {
      rawMaterials: [],
      directLabor: [],
      recipes: [],
      currency: "₱",
      currentRecipeState: null
    };
  return {
    rawMaterials: Array.isArray(e.rawMaterials)
      ? e.rawMaterials.map((e) => {
          const t = { ...e };
          return (
            (t.unitCost = Number(t.unitCost ?? t.costPerUnit ?? t.cost ?? 0)),
            (t.costUnit = t.costUnit ?? t.unit ?? "g"),
            (t.yieldPercentage = Number(t.yieldPercentage ?? t.yield ?? 100)),
            (t.name = t.name ?? "Unnamed"),
            (t.id = t.id ?? Date.now() + Math.floor(1e3 * Math.random())),
            t
          );
        })
      : [],
    directLabor: Array.isArray(e.directLabor)
      ? e.directLabor.map((e) => {
          const t = { ...e };
          return (
            (t.unitCost = Number(t.unitCost ?? t.costPerUnit ?? t.rate ?? 0)),
            (t.costUnit = t.costUnit ?? t.timeUnit ?? "hours"),
            (t.id = t.id ?? Date.now() + Math.floor(1e3 * Math.random())),
            (t.name = t.name ?? "Unnamed Labor"),
            t
          );
        })
      : [],
    recipes: Array.isArray(e.recipes) ? e.recipes.map((e) => l(e)) : [],
    currency: e.currency ?? "₱",
    currentRecipeState: e.currentRecipeState ?? null
  };
}
function c() {
  const t = s(e);
  return (t.dataVersion = 2), t;
}
const d = {
  selectItem: {
    title: "Select Item",
    content:
      "Choose a raw material from your master list, a direct labor item, or a saved sub-recipe to add to the current recipe.",
    example:
      "Example: Select 'Beef Brisket' from raw materials or 'Kitchen Work' from direct labor to add to your burger recipe."
  },
  quantity: {
    title: "Quantity/Time",
    content:
      "The amount of the selected item needed for this recipe. For raw materials: quantity in units. For labor: time required in the selected unit.",
    example:
      "Example: For a burger recipe, you might use 0.15 kg of beef patty or 0.5 hours of kitchen work."
  },
  yieldPercentage: {
    title: "Yield Percentage",
    content:
      "The usable percentage after preparation (e.g., peeling, trimming, cooking loss). 100% means all purchased quantity is usable. This applies to all recipes using this ingredient.",
    example:
      "Example: If you buy carrots but peel them, only 85% might be usable. For pre-cut vegetables, you might have 100% yield."
  },
  markup: {
    title: "Mark-up Percentage",
    content:
      "The profit percentage added to the cost price to determine the selling price before taxes.",
    example:
      "Example: If your burger costs ₱50 to make and you add 40% markup, the price before tax would be ₱70 (₱50 + 40%)."
  },
  tax: {
    title: "Regular Tax Percentage",
    content: "Local sales tax percentage applied to the selling price.",
    example:
      "Example: If your local sales tax is 8% and your burger sells for ₱70, the tax would be ₱5.60."
  },
  vat: {
    title: "VAT Percentage",
    content: "Value Added Tax percentage applied to the selling price.",
    example:
      "Example: If VAT is 12% and your burger sells for ₱70, the VAT would be ₱8.40."
  },
  servings: {
    title: "Servings",
    content:
      "The number of portions this recipe produces. Used to calculate cost per serving.",
    example:
      "Example: A large pot of soup that makes 8 bowls would have 8 servings. A cake cut into 12 slices would have 12 servings."
  },
  subRecipeName: {
    title: "Sub-Recipe Name",
    content:
      "A descriptive name for your sub-recipe (e.g., 'Mayonnaise', 'Tomato Sauce').",
    example:
      "Example: 'Secret Burger Sauce', 'House Marinade', or 'Signature Spice Blend'."
  },
  subRecipeCategory: {
    title: "Category of Measurement",
    content:
      "The type of output this sub-recipe produces: Weight (grams, kg), Volume (ml, L), or Count (pieces).",
    example:
      "Example: Sauces are usually Volume, spice blends are Weight, and pre-made items like meatballs could be Count."
  },
  subRecipeYieldQuantity: {
    title: "Total Yield per Batch",
    content:
      "The total amount this sub-recipe produces in one batch. Used to calculate cost per unit.",
    example:
      "Example: If your sauce recipe makes 500ml total, enter 500. If your spice blend makes 200g total, enter 200."
  },
  ingredientName: {
    title: "Raw Material Name",
    content:
      "The common name of the raw material (e.g., 'Beef Brisket', 'Olive Oil').",
    example:
      "Example: 'Ground Beef 80/20', 'Extra Virgin Olive Oil', 'Roma Tomatoes'."
  },
  ingredientCategory: {
    title: "Raw Material Category",
    content:
      "Classification: Weight (solid items), Volume (liquids), Count (individual items).",
    example: "Example: Flour = Weight, Milk = Volume, Eggs = Count."
  },
  purchasePrice: {
    title: "Purchase Price",
    content:
      "The total cost you paid for the purchased quantity of this raw material.",
    example: "Example: You paid ₱650 for 1kg of beef brisket, so enter 650."
  },
  purchaseQuantity: {
    title: "Purchase Quantity",
    content:
      "The amount you bought for the purchase price. Used to calculate cost per unit.",
    example:
      "Example: You bought 1kg of beef for ₱650, so enter 1. You bought 50 eggs for ₱500, so enter 50."
  },
  purchaseUnit: {
    title: "Purchase Unit",
    content:
      "The unit of measurement for the purchased quantity (e.g., kg, L, pieces).",
    example:
      "Example: For the 1kg beef package, select 'kg'. For the 50 eggs, select 'pc'. For 1L milk, select 'L'."
  },
  costPerUnit: {
    title: "Cost Per Unit",
    content:
      "The calculated cost for one unit of measurement. Automatically calculated from purchase details.",
    example:
      "Example: Total recipe cost ₱100 for 500ml yield = ₱0.20 per ml. If cost unit is L, then ₱200 per L (₱0.20/ml * 1000)."
  },
  laborName: {
    title: "Direct Labor Name",
    content:
      "A descriptive name for the labor task (e.g., 'Kitchen Work', 'Prep Chef', 'Line Cook').",
    example: "Example: 'Kitchen Work', 'Prep Chef', 'Line Cook', 'Dishwasher'."
  },
  shiftRate: {
    title: "Shift Rate",
    content: "The total cost for one complete shift of this labor type.",
    example:
      "Example: If a kitchen worker costs ₱200 per 8-hour shift, enter 200."
  },
  shiftDuration: {
    title: "Shift Duration",
    content: "The length of one shift in the selected time unit.",
    example:
      "Example: For an 8-hour shift, enter 8 and select 'hours'. For a 480-minute shift, enter 480 and select 'minutes'."
  },
  timeUnit: {
    title: "Time Unit",
    content:
      "The unit of measurement for the shift duration (hours or minutes).",
    example:
      "Example: Select 'hours' for shifts measured in hours, 'minutes' for shifts measured in minutes."
  },
  costUnit: {
    title: "Cost Unit",
    content:
      "The unit of measurement for displaying the cost per unit (hours or minutes).",
    example:
      "Example: Select 'hours' to see cost per hour, 'minutes' to see cost per minute."
  },
  servingScale: {
    title: "Serving Scale",
    content:
      "The target number of servings you want to produce. The total cost will be calculated as: (Base Recipe Cost ÷ Base Servings) × Serving Scale. When loading a saved recipe, this automatically sets to match the recipe's base servings.",
    example:
      "Example: If your beef stew recipe costs $20.00 for 10 servings and you want to make 50 servings, enter 50. The cost will be calculated as ($20.00 ÷ 10) × 50 = $100.00 for 50 servings. When loading a 15-serving recipe, this automatically sets to 15."
  },
  selectedLaborRate: {
    title: "Displayed Labor Rate (Read-only)",
    content:
      "This read-only field shows the calculated labor cost per time unit (hour/minute) for the selected direct labor item. It is computed from the Shift Rate ÷ Shift Duration and converted to the selected display time unit.",
    example:
      "Example: Shift Rate ₱200 ÷ 8 hours = ₱25.00 per hour. If the display unit is minutes, it will show ₱0.42 per minute."
  }
};
function u(e, t) {
  let n = [];

  // Get the appropriate list based on item type
  switch (t) {
    case "rawMaterial":
      n = Yt();
      break;
    case "directLabor":
      n = Vt();
      break;
    case "mainRecipe":
      n = Gt().filter((e) => "main" === e.type);
      break;
    case "subRecipe":
      n = Gt().filter((e) => "sub" === e.type);
  }

  // Generate unique name with proper copy numbering
  const existingNames = n.map(item => item.name.toLowerCase());
  
  let baseName = e;
  let newName = baseName;
  let copyNumber = 1;

  while (existingNames.includes(newName.toLowerCase())) {
    newName = `${baseName} - copy${copyNumber > 1 ? ` ${copyNumber}` : ''}`;
    copyNumber++;
  }

  return newName;
}
function p(e, t, n = null, o) {
  let a = null,
    i = [];
  switch (t) {
    case "rawMaterial":
      (i = Yt()),
        (a = i.find(
          (t) => t.name.toLowerCase() === e.toLowerCase() && t.id !== n
        ));
      break;
    case "directLabor":
      (i = Vt()),
        (a = i.find(
          (t) => t.name.toLowerCase() === e.toLowerCase() && t.id !== n
        ));
      break;
    case "mainRecipe":
      (i = Gt().filter((e) => "main" === e.type)),
        (a = i.find(
          (t) => t.name.toLowerCase() === e.toLowerCase() && t.id !== n
        ));
      break;
    case "subRecipe":
      (i = Gt().filter((e) => "sub" === e.type)),
        (a = i.find(
          (t) => t.name.toLowerCase() === e.toLowerCase() && t.id !== n
        ));
  }
  return (
    !!a &&
    ((function (e, t, n, o) {
      window.unifiedPromptContext = {
        itemType: e,
        existingItem: t,
        newName: n,
        saveCallback: o
      };
      const a = {
          rawMaterial: "Raw Material",
          directLabor: "Direct Labor",
          mainRecipe: "Main Recipe",
          subRecipe: "Sub-Recipe"
        },
        i = document.getElementById("unifiedEditPromptModal"),
        r = document.getElementById("unifiedEditPromptTitle"),
        l = document.getElementById("unifiedEditPromptMessage");
      if (!i || !r || !l) {
        console.error("Unified prompt modal elements not found");
        return void m(
          confirm(
            `A ${a[e].toLowerCase()} named "${
              t.name
            }" already exists. Click OK to replace, Cancel to save as new.`
          )
            ? "replace"
            : "new"
        );
      }
      (r.textContent = `Save ${a[e]}`),
        (l.innerHTML = `\n        <p>A ${a[
          e
        ].toLowerCase()} named "<strong>${po(
          t.name
        )}</strong>" already exists.</p>\n        <p>Would you like to replace the existing item or save this as a new item?</p>\n        <div class="unified-prompt-item">\n            <div class="item-name">Existing: ${po(
          t.name
        )}</div>\n            <div class="item-details">\n                ${
          t.category ? `Category: ${t.category} • ` : ""
        }\n                ${
          t.costPerUnit
            ? `Cost: ${uo(t.costPerUnit)}/${t.costUnit || "unit"}`
            : ""
        }\n                ${
          t.totalCost ? `Total: ${uo(t.totalCost)}` : ""
        }\n                ${
          t.servings ? `Servings: ${t.servings}` : ""
        }\n            </div>\n        </div>\n        <div class="auto-rename-notice hidden" id="autoRenameNotice">\n            <strong>Note:</strong> When saving as new, the name will be automatically changed to "<span id="newNamePreview"></span>" to avoid conflicts.\n        </div>\n    `);
      const s = document.getElementById("autoRenameNotice"),
        c = document.getElementById("newNamePreview");
      if (n.toLowerCase() === t.name.toLowerCase() && s && c) {
        const t = u(n, e);
        (c.textContent = t), s.classList.remove("hidden");
      }
      i.classList.remove("hidden");
    })(t, a, e, o),
    !0)
  );
}
function m(e) {
  const t = window.unifiedPromptContext;
  if (t && t.saveCallback)
    if ((g(), "replace" === e)) t.saveCallback("replace");
    else {
      let e = t.newName;
      // FIX: Always generate new name without excluding the duplicate item
      e.toLowerCase() === t.existingItem.name.toLowerCase() &&
        (e = u(e, t.itemType)), // Now only two arguments
      t.saveCallback("new", e);
    }
  else console.error("No prompt context found");
}
function g() {
  const e = document.getElementById("unifiedEditPromptModal");
  e && e.classList.add("hidden"),
    (window.unifiedPromptContext = {
      itemType: null,
      existingItem: null,
      newName: null,
      saveCallback: null
    });
}
let f,
  y,
  b,
  v,
  h,
  w,
  x,
  C,
  E,
  L,
  S,
  P,
  $,
  R,
  I,
  M,
  F,
  k,
  B,
  U,
  T,
  q,
  D,
  A,
  N,
  H,
  O,
  z,
  W,
  Q,
  Y,
  V,
  G,
  _,
  J,
  j,
  K,
  X,
  Z,
  ee,
  te,
  ne,
  oe,
  ae,
  ie,
  re,
  le,
  se,
  ce,
  de,
  ue,
  pe,
  me,
  ge,
  fe,
  ye,
  be,
  ve,
  he,
  we,
  xe,
  Ce,
  Ee,
  Le,
  Se,
  Pe,
  $e,
  Re,
  Ie,
  Me,
  Fe,
  ke,
  Be,
  Ue,
  Te,
  qe,
  De,
  Ae,
  Ne,
  He,
  Oe,
  ze,
  We,
  Qe,
  Ye,
  Ve,
  Ge,
  _e,
  Je,
  je,
  Ke,
  Xe,
  Ze,
  et;
window.unifiedPromptContext = {
  itemType: null,
  existingItem: null,
  newName: null,
  saveCallback: null
};
let tt = "₱",
  nt = !1;

// =============================================================================
// ENHANCED DATA RECOVERY & PROTECTION FUNCTIONS
// =============================================================================

// CRITICAL FIX: Enhanced data validation function
function hasMeaningfulData(data) {
    if (!data) return false;
    
    // Check for actual content in all data sections
    const hasRawMaterials = data.rawMaterials?.length > 0 && 
        data.rawMaterials.some(item => item.name && item.name.trim() !== '');

    const hasRecipes = data.recipes?.length > 0 && 
        data.recipes.some(recipe => recipe.name && recipe.name.trim() !== '');

    const hasDirectLabor = data.directLabor?.length > 0 && 
        data.directLabor.some(labor => labor.name && labor.name.trim() !== '');

    const hasCurrentRecipe = data.currentRecipeState && (
        (data.currentRecipeState.rawMaterialItems?.length > 0 && 
         data.currentRecipeState.rawMaterialItems.some(item => item.name && item.name.trim() !== '')) ||
        (data.currentRecipeState.directLaborItems?.length > 0 && 
         data.currentRecipeState.directLaborItems.some(item => item.name && item.name.trim() !== ''))
    );

    return hasRawMaterials || hasRecipes || hasDirectLabor || hasCurrentRecipe;
}

// CRITICAL FIX: Data recovery mechanism
function attemptDataRecovery() {
    console.log("🔄 Attempting data recovery...");
    
    try {
        // Check for backup in localStorage
        const backupData = localStorage.getItem('profitPerPlate_userData_backup');
        const currentData = localStorage.getItem('profitPerPlate_userData');
        
        const backupValid = backupData && backupData !== '{}' && backupData !== 'null';
        const currentEmpty = !currentData || currentData === '{}' || currentData === 'null';
        
        if (backupValid && currentEmpty) {
            console.log("✅ Restoring from backup - current data is empty");
            localStorage.setItem('profitPerPlate_userData', backupData);
            return { success: true, recovered: true };
        }
        
        if (backupValid && currentData) {
            const currentParsed = JSON.parse(currentData);
            const backupParsed = JSON.parse(backupData);
            
            const currentHasData = hasMeaningfulData(currentParsed);
            const backupHasData = hasMeaningfulData(backupParsed);
            
            if (backupHasData && !currentHasData) {
                console.log("✅ Restoring from backup - backup has meaningful data, current doesn't");
                localStorage.setItem('profitPerPlate_userData', backupData);
                return { success: true, recovered: true };
            }
        }
        
        console.log("📝 No recovery needed or backup unavailable");
        return { success: true, recovered: false };
    } catch (error) {
        console.error("❌ Data recovery failed:", error);
        return { success: false, error: error.message };
    }
}

// Enhanced initialization with data protection
async function initializeWithDataProtection() {
    console.log("🛡️ Initializing with enhanced data protection...");
    
    try {
        // Attempt data recovery before any operations
        if (window.supabaseClient && window.supabaseClient.attemptDataRecovery) {
            const recoveryResult = await window.supabaseClient.attemptDataRecovery();
            if (recoveryResult.recovered) {
                console.log("✅ Data recovery completed during initialization");
                if (window.showNotification) {
                    window.showNotification("🔄 Recovered data from backup", "success");
                }
            }
        }
        
        // Continue with normal initialization
        await normalInitialization();
        
    } catch (error) {
        console.error("💥 Protected initialization failed:", error);
        // Fall back to normal initialization
        await normalInitialization();
    }
}

// Enhanced auto-save with backup protection
function setupEnhancedAutoSave() {
    console.log("🔧 Setting up enhanced auto-save with backup protection...");
    
    // Backup before any save operation
    const originalSaveUserData = window.supabaseClient ? window.supabaseClient.saveUserData : null;
    if (originalSaveUserData) {
        window.supabaseClient.saveUserData = function(data) {
            // Create immediate backup
            try {
                const currentData = localStorage.getItem('profitPerPlate_userData');
                if (currentData) {
                    localStorage.setItem('profitPerPlate_userData_autosave_backup', currentData);
                }
            } catch (e) {
                console.warn("⚠️ Auto-save backup failed:", e);
            }
            
            return originalSaveUserData.call(this, data);
        };
    }
    
    // Existing auto-save setup...
    ["input", "change", "click", "blur"].forEach((e) => {
        document.addEventListener(e, function(e) {
            var t;
            (t = e.target),
            [
                "#darkModeToggle",
                "#helpBtn", 
                ".close-btn",
                ".modal",
                ".tab-btn",
                ".sidebar-btn",
                "#printBtn"
            ].some((e) => t.closest(e)) || dt();
        });
    });
    
    window.addEventListener("beforeunload", pt);
    setInterval(() => {
        ut() && ct();
    }, 15e3);
    
    console.log("✅ Enhanced auto-save with backup protection initialized");
}

// Monitor data state changes
function setupDataStateMonitoring() {
    let lastDataState = null;
    
    setInterval(() => {
        const currentData = localStorage.getItem('profitPerPlate_userData');
        if (lastDataState !== currentData) {
            console.log("🔍 Data state changed - creating monitoring backup");
            lastDataState = currentData;
            
            // Create monitoring backup
            try {
                if (currentData) {
                    localStorage.setItem('profitPerPlate_userData_monitoring', currentData);
                }
            } catch (e) {
                console.warn("⚠️ Monitoring backup failed:", e);
            }
        }
    }, 30000); // Check every 30 seconds
}

// Enhanced notification for data operations
function showDataOperationNotification(message, type = "info") {
    console.log(`📊 Data Operation: ${message}`);
    Wt(message, type);
}

// Update data state indicator
function updateDataStateIndicator(state = "protected") {
    const indicator = document.getElementById("dataStateIndicator");
    if (!indicator) return;
    
    indicator.className = `data-state-indicator ${state}`;
    
    switch(state) {
        case "protected":
            indicator.innerHTML = '<span class="data-state-icon">🛡️</span><span class="data-state-text">Data Protected</span>';
            break;
        case "syncing":
            indicator.innerHTML = '<span class="data-state-icon">🔄</span><span class="data-state-text">Syncing...</span>';
            break;
        case "error":
            indicator.innerHTML = '<span class="data-state-icon">⚠️</span><span class="data-state-text">Backup Issue</span>';
            break;
    }
}

// =============================================================================
// ORIGINAL FUNCTIONS CONTINUE...
// =============================================================================

function ot() {
  console.log("🔧 Setting up comprehensive navigation system..."),
    document.addEventListener("click", function (e) {
      const t = e.target.closest(".sidebar-btn");
      if (t && t.dataset.tab)
        return (
          e.preventDefault(),
          e.stopPropagation(),
          console.log("🖱️ Sidebar navigation clicked:", t.dataset.tab),
          void it(t.dataset.tab)
        );
      const n = e.target.closest(".mobile-tabs .tab-btn");
      return n && n.dataset.tab
        ? (e.preventDefault(),
          e.stopPropagation(),
          console.log("📱 Mobile navigation clicked:", n.dataset.tab),
          void it(n.dataset.tab))
        : void 0;
    }),
    at(),
    console.log("✅ Navigation system setup completed");
}
function at() {
  Ze &&
    Ze.length > 0 &&
    (Ze.forEach((e) => {
      const t = e.cloneNode(!0);
      e.parentNode.replaceChild(t, e);
      t.addEventListener("click", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("💻 Direct sidebar click:", this.dataset.tab),
          it(this.dataset.tab);
      });
    }),
    (Ze = document.querySelectorAll(".sidebar-btn"))),
    et &&
      et.length > 0 &&
      (et.forEach((e) => {
        const t = e.cloneNode(!0);
        e.parentNode.replaceChild(t, e);
        t.addEventListener("click", function (e) {
          e.preventDefault(),
            e.stopPropagation(),
            console.log("📱 Direct mobile tab click:", this.dataset.tab),
            it(this.dataset.tab);
        });
      }),
      (et = document.querySelectorAll(".mobile-tabs .tab-btn")));
}
function it(e) {
  console.log("🔄 Switching to tab:", e);
  if (["raw-materials", "direct-labor", "recipes", "summary"].includes(e)) {
    if (
      (document.querySelectorAll(".sidebar-btn").forEach((t) => {
        t.classList.toggle("active", t.dataset.tab === e);
      }),
      document.querySelectorAll(".mobile-tabs .tab-btn").forEach((t) => {
        t.classList.toggle("active", t.dataset.tab === e);
      }),
      document.querySelectorAll(".tab-content").forEach((t) => {
        t.classList.toggle("active", t.id === `${e}-tab`);
      }),
      "summary" !== e && A)
    ) {
      const e = parseFloat(A.value) || 1;
      1 !== e &&
        (console.log(
          `INFO: Auto-resetting Serving Scale from ${e} to 1 when leaving Summary tab`
        ),
        (A.value = 1),
        n && (Yn(), Gn()));
    }
    "summary" === e && (n ? Gn() : _n()),
      dt(),
      console.log("✅ Successfully switched to tab:", e);
  } else console.error("❌ Invalid tab name:", e);
}
function rt() {
  try {
    console.log("📥 Attempting to load data from local storage...");
    const t = localStorage.getItem("profitPerPlate_userData");
    if (t) {
      const n = JSON.parse(t);
      console.log("✅ Loaded user data from local storage");
      const o = s(n);
      return (
        (e = {
          rawMaterials: [],
          directLabor: [],
          recipes: [],
          currency: "₱",
          currentRecipeState: null,
          ...o
        }),
        (tt = e.currency || "₱"),
        w && (w.value = tt),
        vt(),
        mn(),
        In(),
        Kn(),
        At(),
        zn(),
        e
      );
    }
    return console.log("📝 No existing local data found"), null;
  } catch (e) {
    return console.error("❌ Error loading from local storage:", e), null;
  }
}
function lt() {
  console.log("🧹 Performing safe local data clearance...");
  const t = mt();
  ["profitPerPlate_userData"].forEach((e) => {
    localStorage.removeItem(e);
  }),
    (e = {
      rawMaterials: [],
      directLabor: [],
      recipes: [],
      currency: tt,
      currentRecipeState: t
    }),
    vt(),
    mn(),
    In(),
    Kn(),
    console.log("✅ Safe data clearance completed - current work preserved");
}
function st() {
  console.log("🔧 Setting up enhanced auto-save system...");
  
  // Create initial backup
  try {
    const currentData = localStorage.getItem('profitPerPlate_userData');
    if (currentData) {
      localStorage.setItem('profitPerPlate_userData_initial_backup', currentData);
      console.log("💾 Initial backup created");
    }
  } catch (e) {
    console.warn("⚠️ Initial backup failed:", e);
  }
  
  ["input", "change", "click", "blur"].forEach((e) => {
    document.addEventListener(e, function (e) {
      var t;
      (t = e.target),
        [
          "#darkModeToggle",
          "#helpBtn",
          ".close-btn",
          ".modal",
          ".tab-btn",
          ".sidebar-btn",
          "#printBtn"
        ].some((e) => t.closest(e)) || dt();
    });
  }),
    window.addEventListener("beforeunload", pt),
    setInterval(() => {
      ut() && ct();
    }, 15e3),
    
    // Setup data state monitoring
    setupDataStateMonitoring(),
    
    console.log("✅ Enhanced auto-save system initialized");
}
function ct() {
  const t = mt();
  (e.currentRecipeState = t),
    localStorage.setItem(
      "profitPerPlate_recipeState",
      JSON.stringify({
        ...t,
        lastSaved: new Date().toISOString(),
        savedSync: !0
      })
    );
  const n = c();
  window.supabaseClient &&
    window.supabaseClient.isAuthenticated() &&
    setTimeout(() => {
      (async function (e, t = 3) {
        for (let n = 1; n <= t; n++)
          try {
            console.log(`🔄 Cloud save attempt ${n}/${t}...`),
              Qt("Saving…", "sync");
            const o = await window.supabaseClient.saveUserData(e);
            if (o && !0 === o.cloud)
              return (
                console.log(`✅ Cloud save successful on attempt ${n}`),
                Qt("Synced", "success"),
                o.queuedCount &&
                  Wt(
                    `Saved to cloud. ${o.queuedCount} queued item(s) remain.`,
                    "info"
                  ),
                o
              );
            if (o && !0 === o.queued)
              return (
                console.warn(
                  "⚠️ Cloud save failed, payload queued for retry:",
                  o
                ),
                Qt("Saved locally (queued for sync)", "warning"),
                o
              );
            if (o && !0 === o.local && !o.queued)
              return (
                console.warn("⚠️ Saved locally only (cloud unavailable)"),
                Qt("Saved locally (cloud unavailable)", "warning"),
                o
              );
            if (!(n < t))
              throw (
                (console.error(`❌ Cloud save failed after ${t} attempts`),
                new Error("Cloud save failed after retries"))
              );
            {
              const e = 1e3 * Math.pow(2, n);
              console.log(`⏳ Cloud save failed, retrying in ${e}ms...`),
                await new Promise((t) => setTimeout(t, e));
            }
          } catch (o) {
            if (
              (console.error(`💥 Cloud save error on attempt ${n}:`, o),
              n === t)
            ) {
              console.log("💾 Falling back to local storage");
              try {
                localStorage.setItem(
                  "profitPerPlate_userData",
                  JSON.stringify({
                    ...e,
                    savedLocally: !0,
                    cloudSaveFailed: !0,
                    lastSaved: new Date().toISOString()
                  })
                ),
                  Qt(
                    "Saved locally (cloud sync failed). Retry will be attempted automatically.",
                    "warning"
                  );
              } catch (e) {
                console.error("Failed to write local fallback:", e),
                  Qt("Local save failed (see console)", "error");
              }
              return { success: !0, local: !0, cloudFailed: !0 };
            }
          }
      })(n).then((e) => {
        e.cloudFailed
          ? Wt("⚠️ Saved locally (cloud sync failed)", "warning")
          : console.log("✅ Cloud save completed successfully");
      });
    }, 100);
}
function dt() {
  o && clearTimeout(o),
    (o = setTimeout(() => {
      ct(), (o = null);
    }, 500));
}
function ut() {
  const e = mt(),
    t = JSON.parse(localStorage.getItem("profitPerPlate_recipeState") || "{}");
  return JSON.stringify(e) !== JSON.stringify(t);
}
function pt(e) {
  ut() &&
    (function () {
      const e = mt();
      localStorage.setItem(
        "profitPerPlate_recipeState",
        JSON.stringify({
          ...e,
          lastSaved: new Date().toISOString(),
          savedSync: !0
        })
      );
      const t = c();
      window.supabaseClient &&
        window.supabaseClient.isAuthenticated() &&
        setTimeout(() => window.supabaseClient.saveUserData(t), 100);
    })();
}
function mt() {
  const e = [],
    t = [];
  return (
    f &&
      f.querySelectorAll("tr").forEach((t) => {
        const n = t.children[0].querySelector("input").value,
          o = parseFloat(t.children[1].querySelector("input").value) || 0,
          a = t.children[1].querySelector(".quantity-unit")?.textContent || "g",
          i = parseFloat(t.children[2].querySelector("input").value) || 0,
          r = t.dataset.type || "rawMaterial",
          l = t.dataset.subRecipeId || null;
        ("rawMaterial" !== r && "sub-recipe" !== r) ||
          e.push({
            name: n,
            quantity: o,
            unit: a,
            unitCost: i,
            type: r,
            subRecipeId: l
          });
      }),
    y &&
      y.querySelectorAll("tr").forEach((e) => {
        const n = e.children[0].querySelector("input").value,
          o = parseFloat(e.children[1].querySelector("input").value) || 0,
          a =
            e.children[1].querySelector(".quantity-unit")?.textContent ||
            "hours",
          i = parseFloat(e.children[2].querySelector("input").value) || 0;
        t.push({ name: n, quantity: o, unit: a, unitCost: i });
      }),
    {
      recipeName: x ? x.value : "",
      rawMaterialItems: e,
      directLaborItems: t,
      markup: parseFloat(U ? U.value : 40) || 40,
      tax: parseFloat(T ? T.value : 0) || 0,
      vat: parseFloat(q ? q.value : 0) || 0,
      servings: parseFloat(D ? D.value : 1) || 1,
      servingScale: parseFloat(A ? A.value : 1) || 1,
      currentTab: bt(),
      lastSaved: new Date().toISOString(),
      version: "2.0"
    }
  );
}
function gt() {
  if (
    (console.log("📥 Loading recipe state with fallback..."),
    window.supabaseClient && window.supabaseClient.isAuthenticated())
  )
    Dt();
  else {
    const e = localStorage.getItem("profitPerPlate_recipeState");
    if (e)
      try {
        !(function (e) {
          if (!e) return;
          x && (x.value = e.recipeName || "");
          U && (U.value = e.markup || 40);
          T && (T.value = e.tax || 0);
          q && (q.value = e.vat || 0);
          D && (D.value = e.servings || 1);
          A && (A.value = e.servingScale || 1);
          f && (f.innerHTML = "");
          y && (y.innerHTML = "");
          e.rawMaterialItems &&
            e.rawMaterialItems.forEach((e) => {
              gn(
                e.name,
                e.quantity,
                e.unit,
                e.unitCost,
                e.type || "rawMaterial",
                e.subRecipeId || null
              );
            });
          e.directLaborItems &&
            e.directLaborItems.forEach((e) => {
              const t = e.unitCost ?? e.rate ?? 0,
                n = e.unit ?? e.timeUnit ?? "hours";
              fn(e.name, e.quantity, n, t);
            });
          zn();
        })(JSON.parse(e)),
          console.log("✅ Loaded recipe state from local storage");
      } catch (e) {
        console.error("❌ Error loading from local storage:", e), ft();
      }
    else ft();
  }
}
function ft() {
  console.log("📝 Loading default recipe state"),
    x && (x.value = ""),
    D && (D.value = "1"),
    A && (A.value = "1"),
    U && (U.value = "40"),
    T && (T.value = "0"),
    q && (q.value = "0"),
    f && (f.innerHTML = ""),
    y && (y.innerHTML = ""),
    zn();
}
function yt(e) {
  const t = document.getElementById(e);
  return t || console.warn(`⚠️ DOM element not found: ${e}`), t;
}
function bt() {
  const e = document.querySelector(".tab-content.active");
  return e ? e.id.replace("-tab", "") : "raw-materials";
}
function vt() {
  en(), un(), Fn();
}
function ht() {
  const e = document.body.classList.toggle("dark-mode");
  localStorage.setItem("profitPerPlate_theme", e ? "dark" : "light");
  const t = document.querySelector("#darkModeToggle svg");
  t.innerHTML = e
    ? '<path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
    : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
}
function wt() {
  kt(), $e.classList.remove("hidden");
}
function xt() {
  $e.classList.add("hidden"),
    (Ie.value = ""),
    Me.classList.add("hidden"),
    Fe.classList.add("hidden");
}
async function Ct() {
  const e = Ie.value.trim();
  if (!e) return void Et("Please enter your email address");
  (ke.disabled = !0), (ke.textContent = "Sending...");
  const t = await window.supabaseClient.resetPassword(e);
  (ke.disabled = !1),
    (ke.textContent = "Send Reset Link"),
    t.success
      ? ((Fe.textContent =
          "Password reset email sent! Check your inbox for further instructions."),
        Fe.classList.remove("hidden"),
        Me.classList.add("hidden"))
      : Et(t.error);
}
function Et(e) {
  (Me.textContent = e),
    Me.classList.remove("hidden"),
    Fe.classList.add("hidden");
}
function Lt() {
  Rt(),
    document.getElementById("resetPasswordModal").classList.remove("hidden");
}
function St() {
  document.getElementById("resetPasswordModal").classList.add("hidden"),
    document.getElementById("resetPasswordForm").reset(),
    document.getElementById("resetPasswordError").classList.add("hidden"),
    document.getElementById("resetPasswordSuccess").classList.add("hidden");
}
async function Pt() {
  const e = document.getElementById("newPassword").value,
    t = document.getElementById("confirmPassword").value;
  if (!e || !t) return void $t("Please enter both fields");
  if (e.length < 6)
    return void $t("Password must be at least 6 characters long");
  if (e !== t) return void $t("Passwords do not match");
  const n = document.getElementById("submitResetPasswordBtn");
  (n.disabled = !0), (n.textContent = "Resetting...");
  const { data: o, error: a } =
    await window.supabaseClient.supabase.auth.updateUser({ password: e });
  (n.disabled = !1),
    (n.textContent = "Reset Password"),
    a
      ? $t(a.message)
      : (document.getElementById("resetPasswordError").classList.add("hidden"),
        (document.getElementById("resetPasswordSuccess").textContent =
          "Password reset successfully! You can now log in with your new password."),
        document
          .getElementById("resetPasswordSuccess")
          .classList.remove("hidden"),
        setTimeout(() => {
          St(), Mt();
        }, 2e3));
}
function $t(e) {
  const t = document.getElementById("resetPasswordError");
  (t.textContent = e),
    t.classList.remove("hidden"),
    document.getElementById("resetPasswordSuccess").classList.add("hidden");
}
function Rt() {
  document.querySelectorAll(".modal").forEach((e) => {
    e.classList.add("hidden");
  });
}
function It() {
  console.log("🚀 Initializing authentication system..."),
    Ue
      ? (console.log("🔧 Setting up login button..."),
        Ue.replaceWith(Ue.cloneNode(!0)),
        (Ue = document.getElementById("loginBtn")),
        Ue.addEventListener("click", function (e) {
          e.preventDefault(),
            e.stopPropagation(),
            console.log("🔑 Login button clicked"),
            (nt = !1),
            Mt();
        }),
        console.log("✅ Login button listener attached successfully"))
      : console.warn("⚠️ Login button not found during auth initialization"),
    qe
      ? (console.log("🔧 Setting up signup button..."),
        qe.replaceWith(qe.cloneNode(!0)),
        (qe = document.getElementById("signupBtn")),
        qe.addEventListener("click", function (e) {
          e.preventDefault(),
            e.stopPropagation(),
            console.log("📝 Signup button clicked"),
            (nt = !0),
            Mt();
        }),
        console.log("✅ Signup button listener attached successfully"))
      : console.warn("⚠️ Signup button not found during auth initialization"),
    we &&
      (console.log("🔧 Setting up auth form..."),
      we.removeEventListener("submit", Ft),
      we.addEventListener("submit", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("📨 Auth form submitted"),
          Ft();
      }),
      console.log("✅ Auth form listener attached successfully")),
    Ee &&
      (console.log("🔧 Setting up auth submit button..."),
      Ee.removeEventListener("click", Ft),
      Ee.addEventListener("click", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("🔄 Auth submit button clicked"),
          Ft();
      }),
      console.log("✅ Auth submit button listener attached successfully")),
    Se &&
      Se.addEventListener("click", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("🔄 Toggling auth mode"),
          Tt();
      }),
    Re &&
      Re.addEventListener("click", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("🔓 Forgot password clicked"),
          wt();
      }),
    ke &&
      ke.addEventListener("click", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("📧 Send reset email clicked"),
          Ct();
      });
  const e = document.getElementById("submitResetPasswordBtn");
  e &&
    e.addEventListener("click", function (e) {
      e.preventDefault(),
        e.stopPropagation(),
        console.log("🔄 Reset password submission"),
        Pt();
    }),
    Te &&
      Te.addEventListener("click", function (e) {
        e.preventDefault(),
          e.stopPropagation(),
          console.log("🚪 Logout clicked"),
          qt();
      }),
    console.log("🎉 Auth initialization completed successfully");
}
function Mt() {
  console.log("Opening auth modal in mode:", nt ? "SIGN UP" : "LOGIN"),
    ve.classList.remove("hidden"),
    Bt(),
    setTimeout(() => {
      xe && xe.focus();
    }, 100);
}
async function Ft() {
  const e = xe.value.trim(),
    t = Ce.value;
  if (
    (console.log("🔐 Auth attempt for:", e, "Mode:", nt ? "Sign Up" : "Login"),
    !e)
  )
    return void Ut("Please enter your email address"), void xe.focus();
  if (!t) return void Ut("Please enter your password"), void Ce.focus();
  if (t.length < 6)
    return void Ut("Password must be at least 6 characters long"), void Ce.focus();
  Ee.disabled = !0;
  const n = Ee.textContent;
  Ee.textContent = nt ? "Creating Account..." : "Logging In...";
  try {
    let n;
    nt
      ? (console.log("📝 Attempting sign up..."),
        (n = await window.supabaseClient.signUp(e, t)))
      : (console.log("🔑 Attempting sign in..."),
        (n = await window.supabaseClient.signIn(e, t))),
      n.success
        ? (console.log("✅ Auth successful for:", e),
          kt(),
          nt
            ? (Wt(
                "🎉 Account created successfully! Please check your email for verification.",
                "success"
              ),
              (nt = !1),
              Bt())
            : Wt("✅ Login successful! Welcome back!", "success"),
          setTimeout(() => {
            window.loadUserData && window.loadUserData();
          }, 1e3))
        : (console.error("❌ Auth failed:", n.error),
          Ut(n.error || "Authentication failed. Please try again."));
  } catch (e) {
    console.error("💥 Auth error:", e),
      Ut("An unexpected error occurred. Please try again.");
  } finally {
    (Ee.disabled = !1), (Ee.textContent = n);
  }
}
function kt() {
  ve.classList.add("hidden"), we.reset(), Le.classList.add("hidden");
}
function Bt() {
  nt
    ? ((he.textContent = "Sign Up for ProfitPerPlate"),
      (Ee.textContent = "Sign Up"),
      (Pe.textContent = "Already have an account? "),
      (Se.textContent = "Login"))
    : ((he.textContent = "Login to ProfitPerPlate"),
      (Ee.textContent = "Login"),
      (Pe.textContent = "Don't have an account? "),
      (Se.textContent = "Sign up"));
}
function Ut(e) {
  (Le.textContent = e), Le.classList.remove("hidden");
}
function Tt() {
  (nt = !nt), Bt(), Le.classList.add("hidden");
}
async function qt() {
  const e = await window.supabaseClient.signOut();
  e.success
    ? alert("Logged out successfully")
    : alert("Error logging out: " + e.error);
}
async function Dt() {
  const t = await window.supabaseClient.loadUserData();
  if (t) {
    const n = s(t);
    (e = {
      ...n,
      currency: n.currency || "₱",
      currentRecipeState: n.currentRecipeState || null
    }),
      (tt = e.currency || "₱"),
      (w.value = tt),
      vt(),
      mn(),
      In(),
      Kn(),
      At(),
      zn(),
      _n();
  }
}
function At() {
  if (!e.currentRecipeState) return;
  const t = e.currentRecipeState;
  x && (x.value = t.recipeName || ""),
    U && (U.value = t.markup || 40),
    T && (T.value = t.tax || 0),
    q && (q.value = t.vat || 0),
    D && (D.value = t.servings || 1),
    A && (A.value = t.servingScale || 1),
    f && (f.innerHTML = ""),
    y && (y.innerHTML = ""),
    t.rawMaterialItems &&
      t.rawMaterialItems.forEach((e) => {
        gn(
          e.name,
          e.quantity,
          e.unit,
          e.unitCost,
          e.type || "rawMaterial",
          e.subRecipeId || null
        );
      }),
    t.directLaborItems &&
      t.directLaborItems.forEach((t) => {
        const n = t.unitCost ?? t.rate ?? 0,
          o = t.unit ?? t.timeUnit ?? "hours";
        e.directLabor.find((e) => e.name === t.name) &&
          fn(t.name, t.quantity, o, n);
      }),
    t.currentTab &&
      setTimeout(() => {
        it(t.currentTab);
      }, 100),
    zn();
}
function Nt() {
  if (
    !confirm(
      "Reset entire recipe? This will clear all items and reset servings to 1."
    )
  )
    return;
  f && (f.innerHTML = ""),
    y && (y.innerHTML = ""),
    x && (x.value = ""),
    D && (D.value = "1"),
    A && (A.value = "1"),
    (t = { type: null, id: null, data: null }),
    (window.currentEditingRow = null),
    (window.currentEditingLaborRow = null);
  const e = document.querySelector(".add-ingredient-section .btn-primary");
  e && ((e.textContent = "Add to Recipe"), (e.onclick = Cn));
  const o = document.querySelector(".add-labor-section .btn-primary");
  o && ((o.textContent = "Add Direct Labor"), (o.onclick = yn)),
    zn(),
    n || _n(),
    ct(),
    Wt("Recipe reset successfully");
}
function Ht() {
  setTimeout(() => {
    Nt();
  }, 500);
}
function Ot(e, t) {
  const o = Gt();
  let a = [],
    i = !1,
    r = 0;
  if (
    (o.forEach((n) => {
      let l = !1;
      n.rawMaterialItems &&
        n.rawMaterialItems.forEach((n) => {
          if (
            (n.type === t &&
              n.name === e.name &&
              ((n.unitCost = e.costPerUnit), (l = !0)),
            "sub-recipe" === n.type)
          ) {
            const t = o.find((e) => e.id === n.subRecipeId);
            t &&
              t.rawMaterialItems &&
              t.rawMaterialItems.forEach((t) => {
                t.name === e.name && ((t.unitCost = e.costPerUnit), (l = !0));
              });
          }
        }),
        n.directLaborItems &&
          n.directLaborItems.forEach((t) => {
            t.name === e.name && ((t.unitCost = e.costPerUnit), (l = !0));
          }),
        l &&
          ((n.totalCost = (function (e) {
            let t = 0;
            e.rawMaterialItems &&
              e.rawMaterialItems.forEach((e) => {
                t += e.quantity * e.unitCost;
              });
            e.directLaborItems &&
              e.directLaborItems.forEach((e) => {
                t += e.quantity * e.unitCost;
              });
            return parseFloat(t.toFixed(2));
          })(n)),
          (i = !0),
          r++),
        a.push(n);
    }),
    i &&
      (jt(a),
      Fn(),
      mn(),
      Kn(),
      Wt(`Automatically updated ${r} recipe(s) using "${e.name}"`),
      n))
  ) {
    const e = a.find((e) => e.id === n.id);
    e && ((n = e), Yn(), Gn());
  }
}
function zt(e, t) {
  let n = 100;
  if ("rawMaterial" === t) {
    const t = Yt().find((t) => t.name === e);
    t && t.yieldPercentage && (n = t.yieldPercentage);
  }
  return n;
}
function Wt(e, t = "info") {
  document.querySelectorAll(".global-notification").forEach((e) => e.remove());
  const n = document.createElement("div");
  if (
    ((n.className = `global-notification ${t}`),
    (n.innerHTML = `\n        <div class="notification-content">\n            <span class="notification-message">${e}</span>\n            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>\n        </div>\n    `),
    !document.getElementById("notification-styles"))
  ) {
    const e = document.createElement("style");
    (e.id = "notification-styles"),
      (e.textContent =
        "\n            .global-notification {\n                position: fixed;\n                top: 20px;\n                right: 20px;\n                background: var(--surface);\n                border: 1px solid var(--border);\n                border-radius: var(--radius-lg);\n                padding: var(--space-md);\n                box-shadow: var(--shadow-xl);\n                z-index: 10000;\n                animation: slideInRight 0.3s ease;\n                max-width: 400px;\n            }\n            \n            .global-notification.success {\n                border-left: 4px solid var(--success);\n            }\n            \n            .global-notification.info {\n                border-left: 4px solid var(--accent-blue);\n            }\n            \n            .global-notification.warning {\n                border-left: 4px solid var(--warning);\n            }\n            \n            .global-notification.error {\n                border-left: 4px solid var(--danger);\n            }\n            \n            .notification-content {\n                display: flex;\n                align-items: flex-start;\n                gap: var(--space-sm);\n            }\n            \n            .notification-message {\n                flex: 1;\n                font-size: 14px;\n                line-height: 1.4;\n            }\n            \n            .notification-close {\n                background: none;\n                border: none;\n                font-size: 18px;\n                cursor: pointer;\n                color: var(--text-secondary);\n                padding: 0;\n                width: 24px;\n                height: 24px;\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                border-radius: var(--radius-sm);\n            }\n            \n            .notification-close:hover {\n                background: var(--primary-light);\n                color: var(--text-primary);\n            }\n            \n            @keyframes slideInRight {\n                from {\n                    transform: translateX(100%);\n                    opacity: 0;\n                }\n                to {\n                    transform: translateX(0);\n                    opacity: 1;\n                }\n            }\n            \n            @keyframes slideOutRight {\n                from {\n                    transform: translateX(0);\n                    opacity: 1;\n                }\n                to {\n                    transform: translateX(100%);\n                    opacity: 0;\n                }\n            }\n        "),
      document.head.appendChild(e);
  }
  document.body.appendChild(n),
    setTimeout(() => {
      n.parentElement &&
        ((n.style.animation = "slideOutRight 0.3s ease"),
        setTimeout(() => n.remove(), 300));
    }, 5e3);
}
function Qt(e, t = "info") {
  try {
    const n = document.getElementById("cloudSyncStatus");
    if (!n) return;
    (n.textContent = e),
      n.classList.remove(
        "warning",
        "error",
        "sync-updating",
        "success",
        "info"
      ),
      ("warning" !== t && "error" !== t && "success" !== t && "info" !== t) ||
        n.classList.add(t),
      "sync" === t && n.classList.add("sync-updating");
  } catch (e) {
    console.warn("updateCloudSyncStatus failed:", e);
  }
}
function Yt() {
  return e.rawMaterials || [];
}
function Vt() {
  return e.directLabor || [];
}
function Gt() {
  return e.recipes || [];
}
function _t(t) {
  (e.rawMaterials = t), dt();
}
function Jt(t) {
  (e.directLabor = t), dt();
}
function jt(t) {
  (e.recipes = t), dt();
}
function Kt() {
  const e = document.getElementById("modalRawMaterialName").value.trim(),
    n = document.getElementById("modalRawMaterialCategory").value,
    o = parseFloat(document.getElementById("modalRawMaterialPrice").value),
    a = parseFloat(document.getElementById("modalRawMaterialQuantity").value),
    i = document.getElementById("modalRawMaterialUnit").value,
    r = parseFloat(document.getElementById("modalCostPerUnit").value),
    l = document.getElementById("modalCostUnit").value,
    s =
      parseFloat(document.getElementById("modalRawMaterialYield").value) || 100;
  if (!e) return void alert("Please enter a raw material name");
  if (!n) return void alert("Please select a category");
  if (isNaN(o) || o <= 0)
    return void alert("Please enter a valid purchase price");
  if (isNaN(a) || a <= 0)
    return void alert("Please enter a valid purchase quantity");
  if (isNaN(r) || r <= 0)
    return void alert("Please enter valid cost calculation details");
  const c = (c, d = null) => {
    const u = d || e,
      p = {
        id: "replace" === c ? t.id : Date.now(),
        name: u,
        category: n,
        price: parseFloat(o.toFixed(2)),
        quantity: parseFloat(a.toFixed(2)),
        unit: i,
        costPerUnit: parseFloat(r.toFixed(4)),
        costUnit: l,
        yieldPercentage: parseFloat(s.toFixed(1))
      },
      m = Yt();
    if ("replace" === c) {
      const e = m.findIndex((e) => e.id === t.id);
      -1 !== e &&
        ((m[e] = p), Wt("Raw material updated successfully!", "success"));
    } else m.push(p), Wt(`Raw material "${u}" saved successfully!`, "success");
    _t(m), en(), mn(), oo(), Ot(p, "rawMaterial");
  };
  p(e, "rawMaterial", t?.id, c) || c(t?.id ? "replace" : "new");
}
function Xt() {
  Kt();
}
function Zt(e) {
  if (confirm("Are you sure you want to delete this raw material?")) {
    _t(Yt().filter((t) => t.id !== e)),
      en(),
      mn(),
      n && Gn(),
      Wt("Raw material deleted successfully!", "success");
  }
}
function en() {
  const e = document.getElementById("rawMaterialsTable");
  let t = tn();
  (t = mo(t)),
    (e.innerHTML = t
      .map(
        (e) =>
          `\n                <tr>\n                    <td data-label="Raw Material">${
            e.name
          }</td>\n                    <td data-label="Category">${
            e.category
          }</td>\n                    <td data-label="Yield">${
            e.yieldPercentage || 100
          }%</td> \x3c!-- NEW: Display yield --\x3e\n                    <td data-label="Cost/Unit">${uo(
            e.costPerUnit
          )}/${
            e.costUnit
          }</td>\n                    <td data-label="Actions">\n                        <button class="btn-secondary small" onclick="openRawMaterialModal(${JSON.stringify(
            e
          ).replace(
            /"/g,
            "&quot;"
          )})">Edit</button>\n                        <button class="btn-danger small" onclick="deleteRawMaterial(${
            e.id
          })">Delete</button>\n                    </td>\n                </tr>\n            `
      )
      .join(""));
}
function tn() {
  const e = document.getElementById("rawMaterialSearch").value.toLowerCase();
  return Yt().filter(
    (t) =>
      t.name.toLowerCase().includes(e) || t.category.toLowerCase().includes(e)
  );
}
function nn() {
  const e =
      parseFloat(document.getElementById("modalRawMaterialPrice").value) || 0,
    t =
      parseFloat(document.getElementById("modalRawMaterialQuantity").value) ||
      1,
    n = document.getElementById("modalRawMaterialUnit").value,
    o = document.getElementById("modalCostUnit").value,
    i =
      parseFloat(document.getElementById("modalRawMaterialYield").value) || 100;
  let r = 0,
    l = [];
  if (e > 0 && t > 0) {
    const s = e / t;
    l.push(
      `Base cost per ${n}: ${e.toFixed(2)} ${tt} ÷ ${t.toFixed(
        2
      )} = ${s.toFixed(4)} ${tt}/${n}`
    );
    const c = s / (i / 100);
    if (
      (l.push(
        `Adjust for ${i}% yield: ${s.toFixed(
          4
        )} ${tt}/${n} ÷ (${i}/100) = ${c.toFixed(4)} ${tt}/${n}`
      ),
      n !== o)
    ) {
      const e = a[o] / a[n];
      (r = c * e),
        l.push(
          `Convert to ${o}: ${c.toFixed(4)} ${tt}/${n} × ${e.toFixed(
            6
          )} = ${r.toFixed(4)} ${tt}/${o}`
        );
    } else (r = c), l.push(`No conversion needed (already in ${o})`);
    l.push(
      `<strong>Final yield-adjusted cost: ${r.toFixed(4)} ${tt}/${o}</strong>`
    );
  }
  (document.getElementById("modalCostPerUnit").value = r.toFixed(4)),
    (function (e, t, n) {
      const o = document.getElementById("costCalculationDetails");
      if (e.length > 0) {
        let a = "<div><strong>Calculation Steps:</strong></div>";
        e.forEach((e) => {
          a += `<div style="margin: var(--space-xs) 0; padding-left: var(--space-md);">• ${e}</div>`;
        }),
          (a += `<div style="margin-top: var(--space-sm); font-weight: bold;">Final Cost: ${t.toFixed(
            4
          )} ${tt}/${n}</div>`),
          (o.innerHTML = a);
      } else o.textContent = "Enter purchase details to see calculation";
    })(l, r, o);
}
function on() {
  nn();
}
function an(e = null) {
  const n = document.getElementById("directLaborModal"),
    o = document.getElementById("directLaborModalTitle");
  e
    ? ((o.textContent = "Edit Direct Labor"),
      (function (e) {
        (document.getElementById("modalLaborName").value = e.name),
          (document.getElementById("modalShiftRate").value =
            e.shiftRate.toFixed(2)),
          (document.getElementById("modalShiftDuration").value =
            e.shiftDuration.toFixed(2)),
          (document.getElementById("modalTimeUnit").value = e.timeUnit),
          (document.getElementById("modalCostUnitLabor").value = e.costUnit),
          ln();
      })(e),
      (t = { type: "directLabor", id: e.id, data: e }))
    : ((o.textContent = "Add New Direct Labor"),
      document.getElementById("directLaborForm").reset(),
      ln(),
      (t = { type: null, id: null, data: null })),
    n.classList.remove("hidden");
}
function rn() {
  document.getElementById("directLaborModal").classList.add("hidden"),
    document.getElementById("directLaborForm").reset(),
    (t = { type: null, id: null, data: null });
}
function ln() {
  const e = parseFloat(document.getElementById("modalShiftRate").value) || 0,
    t = parseFloat(document.getElementById("modalShiftDuration").value) || 1,
    n = document.getElementById("modalTimeUnit").value,
    o = document.getElementById("modalCostUnitLabor").value;
  let i = 0,
    r = [];
  if (e > 0 && t > 0) {
    const l = e / t;
    if (
      (r.push(
        `Cost per ${n}: ${e.toFixed(2)} ${tt} ÷ ${t.toFixed(2)} = ${l.toFixed(
          4
        )} ${tt}/${n}`
      ),
      n !== o)
    ) {
      const e = a[o] / a[n];
      (i = l * e),
        r.push(
          `Convert to ${o}: ${l.toFixed(4)} ${tt}/${n} × ${e.toFixed(
            6
          )} = ${i.toFixed(4)} ${tt}/${o}`
        );
    } else (i = l), r.push(`No conversion needed (already in ${o})`);
  }
  (document.getElementById("modalCostPerUnitLabor").value = i.toFixed(4)),
    (function (e, t, n) {
      const o = document.getElementById("laborCostCalculationDetails");
      if (e.length > 0) {
        let a = "<div><strong>Calculation Steps:</strong></div>";
        e.forEach((e) => {
          a += `<div style="margin: var(--space-xs) 0; padding-left: var(--space-md);">• ${e}</div>`;
        }),
          (a += `<div style="margin-top: var(--space-sm); font-weight: bold;">Final Cost: ${t.toFixed(
            4
          )} ${tt}/${n}</div>`),
          (o.innerHTML = a);
      } else o.textContent = "Enter shift details to see calculation";
    })(r, i, o);
}
function sn() {
  const e = document.getElementById("modalLaborName").value.trim(),
    n = parseFloat(document.getElementById("modalShiftRate").value),
    o = parseFloat(document.getElementById("modalShiftDuration").value),
    i = document.getElementById("modalTimeUnit").value,
    r = document.getElementById("modalCostUnitLabor").value;
  if (!e) return void alert("Please enter a labor name");
  if (isNaN(n) || n <= 0) return void alert("Please enter a valid shift rate");
  if (isNaN(o) || o <= 0)
    return void alert("Please enter a valid shift duration");
  let l = 0;
  if (n > 0 && o > 0) {
    const e = n / o;
    if (i !== r) {
      l = e * (a[r] / a[i]);
    } else l = e;
  }
  const s = (a, s = null) => {
    const c = s || e,
      d = {
        id: "replace" === a ? t.id : Date.now(),
        name: c,
        shiftRate: parseFloat(n.toFixed(2)),
        shiftDuration: parseFloat(o.toFixed(2)),
        timeUnit: i,
        costPerUnit: parseFloat(l.toFixed(4)),
        costUnit: r
      },
      u = Vt();
    if ("replace" === a) {
      const e = u.findIndex((e) => e.id === t.id);
      -1 !== e &&
        ((u[e] = d), Wt("Direct labor updated successfully!", "success"));
    } else u.push(d), Wt(`Direct labor "${c}" saved successfully!`, "success");
    Jt(u), un(), mn(), In(), Rn(), rn(), Ot(d, "directLabor");
  };
  p(e, "directLabor", t?.id, s) || s(t?.id ? "replace" : "new");
}
function cn() {
  sn();
}
function dn(e) {
  if (confirm("Are you sure you want to delete this direct labor item?")) {
    Jt(Vt().filter((t) => t.id !== e)),
      un(),
      mn(),
      In(),
      Rn(),
      Wt("Direct labor deleted successfully!", "success");
  }
}
function un() {
  const e = document.getElementById("directLaborTable");
  let t = pn();
  (t = go(t)),
    (e.innerHTML = t
      .map(
        (e) =>
          `\n                <tr>\n                    <td data-label="Labor Name">${
            e.name
          }</td>\n                    <td data-label="Shift Rate">${uo(
            e.shiftRate
          )}/shift</td>\n                    <td data-label="Shift Duration">${
            e.shiftDuration
          } ${
            e.timeUnit
          }</td>\n                    <td data-label="Cost/Unit">${uo(
            e.costPerUnit
          )}/${
            e.costUnit
          }</td>\n                    <td data-label="Actions">\n                        <button class="btn-secondary small" onclick="openDirectLaborModal(${JSON.stringify(
            e
          ).replace(
            /"/g,
            "&quot;"
          )})">Edit</button>\n                        <button class="btn-danger small" onclick="deleteDirectLabor(${
            e.id
          })">Delete</button>\n                    </td>\n                </tr>\n            `
      )
      .join(""));
}
function pn() {
  const e = document.getElementById("directLaborSearch").value.toLowerCase();
  return Vt().filter((t) => t.name.toLowerCase().includes(e));
}
function mn() {
  const e = document.getElementById("unifiedItemSelect");
  if (!e) return;
  const t = e.querySelector('optgroup[label="Raw Materials"]'),
    n = e.querySelector('optgroup[label="Sub-Recipes"]');
  t && (t.innerHTML = ""), n && (n.innerHTML = "");
  mo(Yt()).forEach((e) => {
    const n = document.createElement("option");
    n.value = `rawMaterial-${e.id}`;
    const o = Number(e.costPerUnit),
      a = Number.isFinite(o) ? uo(o) : "",
      i = e.costUnit || "unit";
    (n.textContent = a ? `${e.name} (${a}/${i})` : `${e.name} (no cost)`),
      (n.dataset.yield = e.yieldPercentage || 100),
      t && t.appendChild(n);
  });
  fo(Gt().filter((e) => "sub" === e.type)).forEach((e) => {
    const t = document.createElement("option");
    t.value = `subrecipe-${e.id}`;
    const o = Number(e.costPerUnit),
      a = Number.isFinite(o) ? uo(o) : "",
      i = e.costUnit || e.outputUnit || "batch";
    (t.textContent = a ? `${e.name} (${a}/${i})` : `${e.name} (no cost)`),
      n && n.appendChild(t);
  });
}
function gn(e = "", t = "0", o = "g", a = "0.00", i = "rawMaterial", r = null) {
  if (!f) return;
  const l = document.createElement("tr"),
    s = "row-" + Date.now();
  "sub-recipe" === i && l.classList.add("sub-recipe-row"),
    (l.innerHTML = `\n            <td data-label="Item">\n                ${
      "sub-recipe" === i ? '<span class="sub-recipe-badge">SUB</span> ' : ""
    }\n                <input type="text" value="${po(
      e
    )}" placeholder="Item" readonly>\n            </td>\n            <td data-label="Qty"> \x3c!-- CHANGED: From "Qty/Time" to "Qty" --\x3e\n                <div class="quantity-input-group">\n                    <input type="number" value="${parseFloat(
      t
    ).toFixed(
      2
    )}" step="0.01" placeholder="Qty" readonly>\n                    <span class="quantity-unit">${o}</span>\n                </div>\n            </td>\n            <td class="unit-cost-cell" data-label="Unit Cost">\n                <span class="unit-currency">${tt}</span>\n                <input type="number" value="${parseFloat(
      a
    ).toFixed(
      2
    )}" step="0.01" style="width:60%" readonly>\n                <span class="unit-display">/${o}</span>\n            </td>\n            <td data-label="Total Cost">\n                <span class="unit-currency">${tt}</span>\n                <span class="total-value">0.00</span>\n                <span class="unit-suffix">/recipe</span>\n            </td>\n            <td data-label="Actions">\n                \x3c!-- ADDED: Edit button --\x3e\n                <button class="btn-secondary small edit-recipe-btn" onclick="editRecipeRow('${s}')">Edit</button>\n                <button class="btn-danger small delRow">🗑️</button>\n            </td>\n        `),
    (l.id = s);
  const c = l.children[1].querySelector("input"),
    d = l.children[2].querySelector("input"),
    u = l.children[3].querySelector(".total-value"),
    p = l.querySelector(".delRow");
  function m() {
    const e = parseFloat(c.value) || 0,
      t = parseFloat(d.value) || 0;
    (u.textContent = (e * t).toFixed(2)), zn(), dt(), n && Gn();
  }
  (l.dataset.type = i),
    r && (l.dataset.subRecipeId = r),
    [c, d].forEach((e) => e.addEventListener("input", m)),
    p.addEventListener("click", () => {
      l.remove(), zn(), dt(), n && Gn();
    }),
    f.appendChild(l),
    m(),
    dt();
}
function fn(e, t, o, a) {
  if (!y) return;
  const i = document.createElement("tr"),
    r = "labor-row-" + Date.now();
  i.classList.add("labor-row"),
    (i.innerHTML = `\n        <td data-label="Labor Item">\n            <input type="text" value="${po(
      e
    )}" placeholder="Labor item" readonly>\n        </td>\n        <td data-label="Time Required">\n            <div class="quantity-input-group">\n                <input type="number" value="${parseFloat(
      t
    ).toFixed(
      2
    )}" step="0.01" placeholder="Time" readonly>\n                <span class="quantity-unit">${o}</span>\n            </div>\n        </td>\n        <td data-label="Rate">\n            <div class="input-with-unit">\n                <input type="number" value="${parseFloat(
      a
    ).toFixed(
      2
    )}" step="0.01" placeholder="Rate" readonly>\n                <span class="unit-display-small">/${o}</span>\n            </div>\n        </td>\n        <td data-label="Total Cost">\n            <span class="unit-currency">${tt}</span>\n            <span class="total-value">0.00</span>\n        </td>\n        <td data-label="Actions">\n            \x3c!-- ADDED: Edit button --\x3e\n            <button class="btn-secondary small edit-labor-btn" onclick="editDirectLaborRow('${r}')">Edit</button>\n            <button class="btn-danger small delDirectLaborRow">🗑️</button>\n        </td>\n    `),
    (i.id = r);
  const l = i.children[1].querySelector("input"),
    s = i.children[2].querySelector("input"),
    c = i.children[3].querySelector(".total-value"),
    d = i.querySelector(".delDirectLaborRow");
  function u() {
    const e = parseFloat(l.value) || 0,
      t = parseFloat(s.value) || 0;
    (c.textContent = (e * t).toFixed(2)), zn(), dt(), n && Gn();
  }
  (i.dataset.laborId = e),
    l.addEventListener("input", u),
    d.addEventListener("click", () => {
      i.remove(), zn(), dt(), n && Gn();
    }),
    y.appendChild(i),
    u(),
    dt();
}
function yn() {
  const e = document.getElementById("directLaborSelect"),
    t = document.getElementById("timeRequirement");
  if (!e)
    return void alert(
      "Direct labor selection element is missing. Please refresh the page."
    );
  const n = e.value,
    o = parseFloat(t ? t.value : NaN);
  if ((console.log("Adding direct labor - ID:", n, "Time:", o), !n))
    return (
      alert("Please select a direct labor item from the dropdown list"),
      void (e && e.focus())
    );
  if (isNaN(o) || o <= 0)
    return (
      alert("Please enter a valid time requirement (greater than 0)"),
      void (t && t.focus())
    );
  const a = Vt().find((e) => e.id === parseInt(n, 10));
  if (!a)
    return (
      alert(
        "Selected direct labor item not found. It may have been deleted. Please reload or reselect the labor item."
      ),
      void In()
    );
  if (window.currentEditingLaborRow) {
    const e = document.getElementById(window.currentEditingLaborRow.rowId);
    e && e.remove(),
      fn(a.name, o, a.costUnit, a.costPerUnit),
      (window.currentEditingLaborRow = null);
    const t = document.querySelector(".add-labor-section .btn-primary");
    t && ((t.textContent = "Add Direct Labor"), (t.onclick = yn)),
      Wt(`Updated ${a.name} in recipe`, "success");
  } else
    fn(a.name, o, a.costUnit, a.costPerUnit),
      Wt(`Added ${a.name} to recipe`, "success");
  (e.value = ""), t && (t.value = "");
  const i = document.getElementById("selectedLaborRate"),
    r = document.getElementById("selectedLaborRateUnit"),
    l = document.getElementById("timeRequirementUnit");
  l && (l.textContent = "hours"),
    i && (i.value = ""),
    r && (r.textContent = "/hour"),
    zn();
}
function bn(e) {
  const t = document.getElementById(e);
  if (!t) return;
  const n = t.children[0].querySelector("input").value,
    o = parseFloat(t.children[1].querySelector("input").value) || 0,
    a =
      (t.children[1].querySelector(".quantity-unit").textContent,
      parseFloat(t.children[2].querySelector("input").value),
      t.dataset.type || "rawMaterial"),
    i = t.dataset.subRecipeId || null;
  (window.currentEditingRow = { rowId: e, type: a, subRecipeId: i }),
    t.remove(),
    (function (e, t, n, o, a) {
      if ("rawMaterial" === a) {
        const t = Yt().find((t) => t.name === e);
        t && ((_.value = `rawMaterial-${t.id}`), hn());
      } else if ("sub-recipe" === a) {
        const t = Gt().find((t) => t.name === e);
        t && ((_.value = `subrecipe-${t.id}`), hn());
      }
      J && (J.value = t);
    })(n, o, 0, 0, a);
  const r = document.querySelector(".add-ingredient-section .btn-primary");
  r && ((r.textContent = "Update Item"), (r.onclick = vn)), zn();
}
function vn() {
  if (!window.currentEditingRow) return void Cn();
  Cn();
  const e = document.querySelector(".add-ingredient-section .btn-primary");
  e && ((e.textContent = "Add to Recipe"), (e.onclick = Cn)),
    (window.currentEditingRow = null);
}
function hn() {
  const e = _.value;
  if (!e) return void (j && (j.textContent = "g"));
  const [t, n] = e.split("-"),
    o = parseInt(n);
  if ("rawMaterial" === t) {
    const e = Yt().find((e) => e.id === o);
    e && j && (j.textContent = e.costUnit);
  } else if ("subrecipe" === t) {
    const e = Gt().find((e) => e.id === o);
    e && j && (j.textContent = e.costUnit || e.outputUnit || "batch");
  }
}
function wn(e) {
  const t = document.getElementById(e);
  if (!t) return;
  const n = t.children[0].querySelector("input").value,
    o = parseFloat(t.children[1].querySelector("input").value) || 0;
  t.children[1].querySelector(".quantity-unit").textContent,
    parseFloat(t.children[2].querySelector("input").value);
  (window.currentEditingLaborRow = { rowId: e, laborName: n }),
    t.remove(),
    (function (e, t) {
      In();
      const n = Vt().find((t) => t.name === e);
      if (n && K) {
        K.value = n.id;
        const e = new Event("change", { bubbles: !0 });
        K.dispatchEvent(e), X && (X.value = t);
      } else X && (X.value = t);
    })(n, o);
  const a = document.querySelector(".add-labor-section .btn-primary");
  a && ((a.textContent = "Update Labor"), (a.onclick = xn)), zn();
}
function xn() {
  window.currentEditingLaborRow, yn();
}
function Cn() {
  const e = _.value,
    t = parseFloat(J.value);
  if (!e || !t)
    return void alert("Please select an item and enter quantity/time");
  const [n, o] = e.split("-"),
    a = parseInt(o);
  if ("rawMaterial" === n) {
    const e = Yt().find((e) => e.id === a);
    if (!e) return;
    const n = e.costUnit,
      o = e.costPerUnit;
    if (window.currentEditingRow) {
      gn(e.name, t.toFixed(2), n, o.toFixed(2), "rawMaterial"),
        (window.currentEditingRow = null);
      const a = document.querySelector(".add-ingredient-section .btn-primary");
      a && ((a.textContent = "Add to Recipe"), (a.onclick = Cn));
    } else gn(e.name, t.toFixed(2), n, o.toFixed(2), "rawMaterial");
  } else if ("subrecipe" === n) {
    const e = Gt().find((e) => e.id === a);
    if (!e) return;
    const n = e.costPerUnit || 0,
      o = e.costUnit || e.outputUnit || "batch";
    if (window.currentEditingRow) {
      gn(e.name, t.toFixed(2), o, n.toFixed(2), "sub-recipe", e.id),
        (window.currentEditingRow = null);
      const a = document.querySelector(".add-ingredient-section .btn-primary");
      a && ((a.textContent = "Add to Recipe"), (a.onclick = Cn));
    } else gn(e.name, t.toFixed(2), o, n.toFixed(2), "sub-recipe", e.id);
  }
  _ && (_.value = ""), J && (J.value = ""), j && (j.textContent = "g");
}
function En() {
  let e = 0,
    t = 0;
  return (
    f &&
      f.querySelectorAll("tr").forEach((t) => {
        const n = parseFloat(t.children[1].querySelector("input").value) || 0,
          o = parseFloat(t.children[2].querySelector("input").value) || 0;
        e += n * o;
      }),
    y &&
      y.querySelectorAll("tr").forEach((e) => {
        const n = parseFloat(e.children[1].querySelector("input").value) || 0,
          o = parseFloat(e.children[2].querySelector("input").value) || 0;
        t += n * o;
      }),
    parseFloat((e + t).toFixed(2))
  );
}
function Ln() {
  try {
    eo();
  } catch (e) {
    console.warn("Failed to update sub-recipe cost display before save:", e);
  }
  const e = document.getElementById("subRecipeNameDisplay").value.trim(),
    n = document.getElementById("subRecipeCategory").value,
    o = parseFloat(document.getElementById("subRecipeYieldQuantity").value),
    a = document.getElementById("subRecipeYieldUnit").value,
    i = parseFloat(En()) || 0,
    r = document.getElementById("subRecipeCostPerUnitField"),
    l = document.getElementById("subRecipeCostPerUnit"),
    s = document.getElementById("subRecipeCostUnitField"),
    c = document.getElementById("subRecipeCostUnit"),
    d = r ? r.value : "",
    u = l ? l.value : "",
    m = parseFloat(d || u || "");
  let g = Number.isFinite(m) ? m : NaN;
  const f = s ? s.value : "",
    y = c ? c.value : "",
    b = f || y || a || "unit";
  if (!e) return void alert("Please enter a sub-recipe name");
  if (isNaN(o) || o <= 0)
    return void alert("Please enter a valid yield quantity");
  if (!isFinite(g) || g <= 0) {
    if (!(o > 0)) {
      const e = document.getElementById("subRecipeValidationMessage");
      return (
        e &&
          (e.classList.remove("hidden"),
          (e.textContent =
            "Cannot compute cost per unit for sub-recipe. Please ensure total recipe cost and yield quantity are valid.")),
        void Qt("Sub-recipe validation error", "error")
      );
    }
    g = i / o;
    try {
      document.getElementById("subRecipeCostPerUnit") &&
        (document.getElementById("subRecipeCostPerUnit").value = g.toFixed(4)),
        document.getElementById("subRecipeCostPerUnitField") &&
          (document.getElementById("subRecipeCostPerUnitField").value =
            g.toFixed(4)),
        document.getElementById("subRecipeCostUnitField") &&
          (document.getElementById("subRecipeCostUnitField").value = b);
    } catch (e) {}
  }
  const v = ro(),
    h = lo(),
    w = (r, l = null) => {
      const s = l || e,
        c = {
          id: "replace" === r ? t.id : Date.now(),
          name: s,
          type: "sub",
          category: n,
          yieldQuantity: o,
          yieldUnit: a,
          costPerUnit: Number.isFinite(g) ? parseFloat(g.toFixed(4)) : 0,
          costUnit: b || "unit",
          rawMaterialItems: v,
          directLaborItems: h,
          totalCost: i
        },
        d = Gt();
      if ("replace" === r) {
        const e = d.findIndex((e) => e.id === t.id && "sub" === e.type);
        -1 !== e &&
          ((d[e] = c),
          Wt(`Sub-recipe "${s}" updated successfully!`, "success"));
      } else d.push(c), Wt(`Sub-recipe "${s}" saved successfully!`, "success");
      jt(d),
        Fn(),
        mn(),
        Kn(),
        Mn(),
        Ht(),
        (t = { type: null, id: null, data: null });
    };
  p(e, "subRecipe", t?.id, w) || w(t?.id ? "replace" : "new");
}
function Sn() {
  Ln();
}
function Pn(e) {
  const n = x.value.trim();
  if (!n) return alert("Please enter a recipe name"), void x.focus();
  const o = ro(),
    a = lo(),
    i = (i, r = null) => {
      const l = r || n,
        s = {
          id: "replace" === i ? t.id : Date.now(),
          name: l,
          type: e,
          rawMaterialItems: o,
          directLaborItems: a,
          totalCost: En(),
          servings: parseFloat(D ? D.value : 1) || 1,
          createdAt: new Date().toISOString()
        },
        c = Gt();
      if ("replace" === i) {
        const e = c.findIndex((e) => e.id === t.id);
        -1 !== e &&
          ((c[e] = s), Wt(`Recipe "${l}" updated successfully!`, "success"));
      } else c.push(s), Wt(`Recipe "${l}" saved successfully!`, "success");
      jt(c), Fn(), Kn(), (t = { type: null, id: null, data: null }), Ht();
    };
  p(n, "main" === e ? "mainRecipe" : "subRecipe", t?.id, i) ||
    i(t?.id ? "replace" : "new");
}
function $n(e) {
  if (!x.value.trim())
    return alert("Please enter a recipe name"), void x.focus();
  Pn(e);
}
function Rn() {
  const e = document.getElementById("directLaborSelect");
  if (!e) return void console.error("❌ Direct labor select element not found");
  console.log("🔧 Setting up direct labor select handler...");
  const t = e.cloneNode(!0);
  e.parentNode.replaceChild(t, e);
  const n = document.getElementById("directLaborSelect");
  (window.directLaborSelect = n),
    n.addEventListener("change", function () {
      console.log("🔄 Direct labor selection changed:", this.value),
        (function (e) {
          const t = e.options[e.selectedIndex];
          if (!t.value)
            return void (function () {
              Z && (Z.textContent = "hours");
              const e = document.getElementById("selectedLaborRate"),
                t = document.getElementById("selectedLaborRateUnit");
              e && ((e.value = ""), e.classList.remove("success", "error"));
              t && (t.textContent = "/hour");
              X && (X.value = "");
            })();
          console.log("📊 Selected labor option:", {
            value: t.value,
            rate: t.dataset.rate,
            unit: t.dataset.unit,
            name: t.dataset.laborName
          }),
            Z && (Z.textContent = t.dataset.unit || "hours");
          (function (e, t) {
            const n = document.getElementById("selectedLaborRate"),
              o = document.getElementById("selectedLaborRateUnit");
            if (!n)
              return void console.error(
                "❌ Labor rate display element not found"
              );
            if (e && !isNaN(parseFloat(e))) {
              const t = parseFloat(e).toFixed(2);
              (n.value = t),
                n.classList.remove("error"),
                n.classList.add("success"),
                console.log("✅ Updated labor rate display:", t);
            } else
              (n.value = ""),
                n.classList.remove("success"),
                console.warn("⚠️ Invalid rate value:", e);
            o && t && (o.textContent = "/" + t);
          })(t.dataset.rate, t.dataset.unit),
            X && setTimeout(() => X.focus(), 100);
        })(this);
    }),
    console.log("✅ Direct labor select handler attached successfully");
}
function In() {
  const e = document.getElementById("directLaborSelect");
  if (!e) return void console.error("❌ Direct labor select element not found");
  const t = e.value;
  e.innerHTML = '<option value="">Select direct labor...</option>';
  const n = Vt();
  if (0 === n.length) {
    const t = document.createElement("option");
    return (
      (t.value = ""),
      (t.textContent = "No direct labor items available"),
      (t.disabled = !0),
      e.appendChild(t),
      void (window.directLaborSelect = e)
    );
  }
  go(n).forEach((t) => {
    const n = document.createElement("option");
    (n.value = String(t.id)),
      (n.textContent = `${t.name} (${uo(t.costPerUnit)}/${t.costUnit})`),
      (n.dataset.unit = t.costUnit),
      (n.dataset.rate = t.costPerUnit),
      (n.dataset.laborName = t.name),
      (n.dataset.laborId = t.id),
      e.appendChild(n);
  }),
    t && (e.value = t),
    (window.directLaborSelect = e);
  const o = new Event("change", { bubbles: !0 });
  e.dispatchEvent(o),
    console.log("✅ Direct labor select populated successfully");
}
function Mn() {
  document.getElementById("subRecipeSaveModal").classList.add("hidden");
}
function Fn() {
  const e = Gt(),
    t = fo(e.filter((e) => "main" === e.type)),
    n = fo(e.filter((e) => "sub" === e.type));
  ce &&
    (ce.innerHTML = t
      .map(
        (e) =>
          `\n            <div class="recipe-item" onclick="loadRecipe(${
            e.id
          })">\n                <h4>${po(
            e.name
          )}</h4>\n                <p>Total Cost: ${uo(
            Number(e.totalCost) || 0
          )} • ${
            e.rawMaterialItems.length + e.directLaborItems.length
          } items • ${
            e.servings || 1
          } servings</p>\n                <div class="recipe-actions">\n                    <button class="btn-secondary small" onclick="editRecipe(${
            e.id
          }, event)">Edit</button>\n                    <button class="btn-danger small" onclick="deleteRecipe(${
            e.id
          }, event)">Delete</button>\n                </div>\n            </div>\n        `
      )
      .join("")),
    de &&
      (de.innerHTML = n
        .map(
          (e) =>
            `\n            <div class="recipe-item" onclick="loadSubRecipe(${
              e.id
            })">\n                <h4>${po(
              e.name
            )}</h4>\n                <p>Cost: ${
              Number.isFinite(Number(e.costPerUnit))
                ? `${uo(Number(e.costPerUnit))}/${e.costUnit || "unit"}`
                : "(no cost)"
            } • ${
              e.rawMaterialItems.length + e.directLaborItems.length
            } items</p>\n                <div class="recipe-actions">\n                    <button class="btn-secondary small" onclick="editSubRecipe(${
              e.id
            }, event)">Edit</button>\n                    <button class="btn-danger small" onclick="deleteRecipe(${
              e.id
            }, event)">Delete</button>\n                </div>\n            </div>\n        `
        )
        .join(""));
}
function kn(e) {
  const n = Gt().find((t) => t.id === e);
  if (!n) return;
  const o = l(n);
  f && (f.innerHTML = ""),
    y && (y.innerHTML = ""),
    x && (x.value = o.name),
    D && (D.value = o.servings || 1),
    o.rawMaterialItems.forEach((e) => {
      gn(
        e.name,
        e.quantity,
        e.unit,
        e.unitCost,
        e.type || "rawMaterial",
        e.subRecipeId || null
      );
    }),
    o.directLaborItems.forEach((e) => {
      const t = e.unitCost ?? e.rate ?? e.costPerUnit ?? 0,
        n = e.unit ?? e.timeUnit ?? "hours";
      fn(e.name, e.quantity, n, t);
    }),
    (t = { type: "mainRecipe", id: e, data: n }),
    it("recipes"),
    zn();
}
function Bn(e) {
  const n = Gt().find((t) => t.id === e && "sub" === t.type);
  if (!n) return;
  const o = l(n);
  f && (f.innerHTML = ""),
    y && (y.innerHTML = ""),
    x && (x.value = o.name),
    o.rawMaterialItems.forEach((e) => {
      gn(e.name, e.quantity, e.unit, e.unitCost, "rawMaterial");
    }),
    o.directLaborItems.forEach((e) => {
      const t = e.unitCost ?? e.rate ?? e.costPerUnit ?? 0,
        n = e.unit ?? e.timeUnit ?? "hours";
      fn(e.name, e.quantity, n, t);
    }),
    (t = { type: "subRecipe", id: e, data: n }),
    it("recipes"),
    zn();
}
function Un(e, n) {
  n && n.stopPropagation();
  const o = Gt().find((t) => t.id === e);
  o && (kn(e), (t = { type: "mainRecipe", id: e, data: o }));
}
function Tn(e, n) {
  n && n.stopPropagation();
  const o = Gt().find((t) => t.id === e && "sub" === t.type);
  o && (Bn(e), (t = { type: "subRecipe", id: e, data: o }));
}
function qn(e, o) {
  if (
    (o && o.stopPropagation(),
    !confirm("Are you sure you want to delete this recipe?"))
  )
    return;
  jt(Gt().filter((t) => t.id !== e)),
    Fn(),
    mn(),
    Kn(),
    t.id === e && (t = { type: null, id: null, data: null }),
    n && n.id === e && ((n = null), Ve && Ve.classList.add("hidden"), _n()),
    Wt("Recipe deleted successfully!", "success");
}
function Dn(e) {
  Hn(),
    t && "subRecipe" === t.type
      ? "replace" === e
        ? Ln()
        : "new" === e && ((t.id = null), Ln())
      : "replace" === e
      ? Pn("mainRecipe" === t.type ? "main" : "sub")
      : "new" === e &&
        ((t.id = null), Pn("mainRecipe" === t.type ? "main" : "sub"));
}
function An() {
  O && O.classList.add("hidden");
}
function Nn() {
  V && V.classList.add("hidden");
}
function Hn() {
  ue && ue.classList.add("hidden");
}
function On(e, n, o) {
  if (!pe || !me || !ue) return;
  const a = "main" === e ? "Main Recipe" : "Sub-Recipe";
  (pe.textContent = `Save ${a}`),
    (me.innerHTML = `\n        <p>A ${a.toLowerCase()} named "<strong>${po(
      o
    )}</strong>" already exists.</p>\n        <p>Would you like to replace the existing recipe or save this as a new recipe?</p>\n    `),
    (t = {
      type: "main" === e ? "mainRecipe" : "subRecipe",
      id: n,
      data: null
    }),
    ue.classList.remove("hidden");
}
function zn() {
  const e = parseFloat(D ? D.value : 1) || 1;
  let t = 0,
    o = 0;
  f &&
    f.querySelectorAll("tr").forEach((e) => {
      const n = parseFloat(e.children[1].querySelector("input").value) || 0,
        o = parseFloat(e.children[2].querySelector("input").value) || 0;
      t += n * o;
    }),
    y &&
      y.querySelectorAll("tr").forEach((e) => {
        const t = parseFloat(e.children[1].querySelector("input").value) || 0,
          n = parseFloat(e.children[2].querySelector("input").value) || 0;
        o += t * n;
      });
  const a = t + o;
  b && (b.textContent = `${tt}${t.toFixed(2)}`),
    v && (v.textContent = `${tt}${o.toFixed(2)}`),
    h && (h.textContent = `${tt}${a.toFixed(2)}`),
    n || Wn(t, o, a, e),
    n && Gn();
}
function Wn(e, t, n, o) {
  parseFloat(A ? A.value : 1);
  const a = parseFloat(U ? U.value : 0) || 0,
    i = parseFloat(T ? T.value : 0) || 0,
    r = parseFloat(q ? q.value : 0) || 0,
    l = (function (e, t, n) {
      const o = parseFloat(A ? A.value : 1) || 1,
        a = n > 0 ? (e / n) * o : 0,
        i = n > 0 ? (t / n) * o : 0;
      return {
        scaledRawMaterialsCost: a,
        scaledDirectLaborCost: i,
        scaledTotalCost: a + i,
        targetServings: o
      };
    })(e, t, o),
    s = l.scaledRawMaterialsCost,
    c = l.scaledDirectLaborCost,
    d = l.scaledTotalCost,
    u = l.targetServings,
    p = u > 0 ? d / u : 0,
    m = p * (1 + a / 100),
    g = m * (1 + (i + r) / 100),
    f = m > 0 ? (s / u / m) * 100 : 0,
    y = m > 0 ? (c / u / m) * 100 : 0,
    b = m > 0 ? (d / u / m) * 100 : 0,
    v = m > 0 ? 100 - b : 0,
    h = m * u,
    w = h - d;
  N && (N.textContent = u),
    S && (S.textContent = `${tt}${s.toFixed(2)}`),
    P && (P.textContent = `${tt}${c.toFixed(2)}`),
    $ && ($.textContent = `${tt}${d.toFixed(2)}`),
    R && (R.textContent = `${tt}${p.toFixed(2)}`),
    I && (I.textContent = `${tt}${g.toFixed(2)}`),
    M && (M.textContent = `${f.toFixed(1)}%`),
    F && (F.textContent = `${y.toFixed(1)}%`),
    k && (k.textContent = `${b.toFixed(1)}%`),
    B && (B.textContent = `${v.toFixed(1)}%`),
    Ke && (Ke.textContent = `${tt}${h.toFixed(2)}`),
    Xe && (Xe.textContent = `${tt}${w.toFixed(2)}`);
}
function Qn(e) {
  parseFloat(A ? A.value : 1);
  let t = e.rawMaterialItems.reduce((e, t) => e + t.quantity * t.unitCost, 0),
    n = e.directLaborItems.reduce((e, t) => e + t.quantity * t.unitCost, 0);
  Wn(t, n, 0, e.servings || 1);
}
function Yn() {
  n && Qn(n);
}
function Vn() {
  const e = Ye ? Ye.value : null;
  if (!e) return void alert("Please select a recipe to load");
  const t = Gt().find((t) => t.id === parseInt(e));
  if (!t) return;
  n = t;
  const o = t.servings || 1;
  A && (A.value = o),
    Ge && (Ge.textContent = t.name),
    _e && (_e.textContent = `${tt}${t.totalCost.toFixed(2)}`),
    Je && (Je.textContent = o),
    je &&
      (je.textContent = `${
        t.rawMaterialItems.length + t.directLaborItems.length
      } items`),
    Ve && Ve.classList.remove("hidden"),
    Qn(t),
    Gn(),
    Wt(
      `Automatically set Serving Scale to ${o} to match loaded recipe`,
      "info"
    );
}
function Gn() {
  n
    ? (function (e) {
        const t = parseFloat(A ? A.value : 1) || 1,
          n = e.servings || 1,
          o = n > 0 ? t / n : 0,
          a = e.rawMaterialItems || [],
          i = e.directLaborItems || [],
          r = yo([...a]),
          l = yo([...i]);
        Ne && (Ne.textContent = `${r.length} items`);
        let s = 0;
        De && (De.innerHTML = ""),
          r.forEach((e) => {
            const t = e.quantity * o,
              n = t * e.unitCost;
            if (((s += n), De)) {
              const o = document.createElement("tr");
              (o.innerHTML = `\n                <td>${po(e.name)}${
                "sub-recipe" === e.type
                  ? ' <span class="sub-recipe-badge">SUB</span>'
                  : ""
              }</td>\n                <td>${t.toFixed(2)} ${
                e.unit
              }</td> \x3c!-- SCALED quantity --\x3e\n                <td>${zt(
                e.name,
                e.type
              ).toFixed(
                1
              )}%</td> \x3c!-- Display yield from raw material --\x3e\n                <td>${tt}${parseFloat(
                e.unitCost
              ).toFixed(2)}/${
                e.unit
              }</td>\n                <td>${tt}${n.toFixed(
                2
              )}</td>\n            `),
                De.appendChild(o);
            }
          }),
          Oe && (Oe.textContent = `${tt}${s.toFixed(2)}`),
          We && (We.textContent = `${tt}${s.toFixed(2)}`),
          He && (He.textContent = `${l.length} items`);
        let c = 0;
        Ae && (Ae.innerHTML = ""),
          l.forEach((e) => {
            const t = e.quantity * o,
              n = t * e.unitCost;
            if (((c += n), Ae)) {
              const o = document.createElement("tr");
              (o.innerHTML = `\n                <td>${po(
                e.name
              )}</td>\n                <td>${t.toFixed(2)} ${
                e.unit
              }</td> \x3c!-- SCALED time --\x3e\n                <td>${tt}${parseFloat(
                e.unitCost
              ).toFixed(2)}/${
                e.unit
              }</td>\n                <td>${tt}${n.toFixed(
                2
              )}</td>\n            `),
                Ae.appendChild(o);
            }
          }),
          ze && (ze.textContent = `${tt}${c.toFixed(2)}`),
          Qe && (Qe.textContent = `${tt}${c.toFixed(2)}`);
      })(n)
    : _n();
}
function _n() {
  Ne &&
    ((Ne.textContent = "0 items"),
    He && (He.textContent = "0 items"),
    Oe && (Oe.textContent = `${tt}0.00`),
    ze && (ze.textContent = `${tt}0.00`),
    We && (We.textContent = `${tt}0.00`),
    Qe && (Qe.textContent = `${tt}0.00`),
    De && (De.innerHTML = ""),
    Ae && (Ae.innerHTML = ""));
}
function Jn() {
  try {
    if ((console.log("Generating print preview..."), !G))
      throw new Error("Print preview content element not found");
    let e, t, o;
    n
      ? ((e = n),
        (t = e.name || "Unnamed Recipe"),
        (o = e.servings || 1),
        console.log("Printing loaded recipe:", t))
      : ((t = x ? x.value.trim() : "Unnamed Recipe"),
        (o = (D && parseFloat(D.value)) || 1),
        console.log("Printing current recipe:", t));
    const a = (A && parseFloat(A.value)) || 1,
      i = (U && parseFloat(U.value)) || 0,
      r = (T && parseFloat(T.value)) || 0,
      l = (q && parseFloat(q.value)) || 0,
      s = document.body.classList.contains("dark-mode");
    console.log("Print parameters:", {
      recipeName: t,
      baseServings: o,
      servingScale: a,
      markup: i,
      tax: r,
      vat: l,
      isDark: s
    });
    let c = (function (e, t, n, o, a, i, r) {
      function l(e, t = 2) {
        try {
          const n = parseFloat(e);
          return isNaN(n) ? "0.00" : n.toFixed(t);
        } catch (t) {
          return console.error("Error in safeToFixed:", t, e), "0.00";
        }
      }
      function s(e) {
        return `${tt}${l(e)}`;
      }
      const c = n > 0 ? o / n : 0,
        d = o;
      let u = 0,
        p = [],
        m = 0,
        g = [];
      e
        ? ((p = e.rawMaterialItems || []),
          (g = e.directLaborItems || []),
          (u = p.reduce(
            (e, t) => e + (t.quantity || 0) * c * (t.unitCost || 0),
            0
          )),
          (m = g.reduce(
            (e, t) => e + (t.quantity || 0) * c * (t.unitCost || 0),
            0
          )))
        : (f &&
            f.querySelectorAll("tr").forEach((e) => {
              try {
                const t =
                    parseFloat(e.children[1].querySelector("input").value) || 0,
                  n =
                    parseFloat(e.children[2].querySelector("input").value) || 0,
                  o = e.children[0].querySelector("input").value,
                  a = e.dataset.type || "rawMaterial",
                  i =
                    e.children[1].querySelector(".quantity-unit")
                      ?.textContent || "g",
                  r = t * c,
                  l = r * n;
                (u += l),
                  p.push({
                    name: o || "Unnamed Item",
                    quantity: r,
                    unit: i,
                    yield: zt(o, a),
                    unitCost: n,
                    totalCost: l,
                    type: a
                  });
              } catch (e) {
                console.error("Error processing raw material row:", e);
              }
            }),
          y &&
            y.querySelectorAll("tr").forEach((e) => {
              try {
                const t =
                    parseFloat(e.children[1].querySelector("input").value) || 0,
                  n =
                    parseFloat(e.children[2].querySelector("input").value) || 0,
                  o = t * c,
                  a = o * n;
                (m += a),
                  g.push({
                    name:
                      e.children[0].querySelector("input").value ||
                      "Unnamed Labor",
                    timeRequired: o,
                    timeUnit:
                      e.children[1].querySelector(".quantity-unit")
                        ?.textContent || "hours",
                    rate: n,
                    totalCost: a
                  });
              } catch (e) {
                console.error("Error processing labor row:", e);
              }
            }));
      const b = u + m;
      if (d <= 0)
        return '\n            <div class="print-header">\n                <h2>Invalid Servings Configuration</h2>\n                <p>Target servings cannot be zero. Please check your serving scale settings.</p>\n            </div>\n        ';
      const v = b / d,
        h = v * (1 + (a || 0) / 100),
        w = h * (1 + ((i || 0) + (r || 0)) / 100),
        x = h > 0 ? (u / d / h) * 100 : 0,
        C = h > 0 ? (m / d / h) * 100 : 0,
        E = h > 0 ? (b / d / h) * 100 : 0,
        L = h > 0 ? 100 - E : 0,
        S = h * d,
        P = S - b;
      let $ = `\n        <div class="print-header">\n            <h1>${po(
        t
      )} - Costing Report</h1>\n            <p>Generated on ${new Date().toLocaleDateString()}</p>\n            <div class="scaling-info">\n                <strong>Scaling Information:</strong><br>\n                • Base Servings: ${n}<br>\n                • Serving Scale: ${o}x<br>\n                • Total Servings: ${d}<br>\n                • <em>All costs below are SCALED for analysis</em>\n            </div>\n            ${
        e
          ? '<p style="color: #666; font-style: italic;">Printed from Saved Recipe Analysis</p>'
          : ""
      }\n        </div>\n\n        <div class="print-section">\n            <h3>Serving Scale Analysis</h3>\n            <table class="cost-breakdown">\n                <tbody>\n                    <tr>\n                        <td>Base Servings:</td>\n                        <td>${n}</td>\n                    </tr>\n                    <tr>\n                        <td>Target Servings:</td>\n                        <td>${d}</td>\n                    </tr>\n                    <tr>\n                        <td>Scaling Factor:</td>\n                        <td>${l(
        c,
        2
      )}x</td>\n                    </tr>\n                </tbody>\n            </table>\n        </div>\n    `;
      p.length > 0 &&
        (($ +=
          '\n            <div class="print-section">\n                <h3>Raw Materials (Scaled)</h3>\n                <table class="cost-breakdown">\n                    <thead>\n                        <tr>\n                            <th>Item</th>\n                            <th>Quantity</th>\n                            <th>Yield %</th>\n                            <th>Unit Cost</th>\n                            <th>Total Cost</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n        '),
        p.forEach((e) => {
          $ += `\n                <tr>\n                    <td>${po(e.name)}${
            "sub-recipe" === e.type
              ? ' <span class="sub-recipe-badge">SUB</span>'
              : ""
          }</td>\n                    <td>${l(e.quantity)} ${
            e.unit
          }</td>\n                    <td>${l(
            e.yield,
            1
          )}%</td>\n                    <td>${s(e.unitCost)}/${
            e.unit
          }</td>\n                    <td>${s(
            e.totalCost
          )}</td>\n                </tr>\n            `;
        }),
        ($ += `\n                    </tbody>\n                    <tfoot>\n                        <tr class="summary-highlight">\n                            <td colspan="4">Raw Materials Subtotal</td>\n                            <td>${s(
          u
        )}</td>\n                        </tr>\n                    </tfoot>\n                </table>\n            </div>\n        `));
      g.length > 0 &&
        (($ +=
          '\n            <div class="print-section">\n                <h3>Direct Labor (Scaled)</h3>\n                <table class="cost-breakdown">\n                    <thead>\n                        <tr>\n                            <th>Labor Item</th>\n                            <th>Time Required</th>\n                            <th>Rate</th>\n                            <th>Total Cost</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n        '),
        g.forEach((e) => {
          $ += `\n                <tr>\n                    <td>${po(
            e.name
          )}</td>\n                    <td>${l(e.timeRequired)} ${
            e.timeUnit
          }</td>\n                    <td>${s(e.rate)}/${
            e.timeUnit
          }</td>\n                    <td>${s(
            e.totalCost
          )}</td>\n                </tr>\n            `;
        }),
        ($ += `\n                    </tbody>\n                    <tfoot>\n                        <tr class="summary-highlight">\n                            <td colspan="3">Direct Labor Subtotal</td>\n                            <td>${s(
          m
        )}</td>\n                        </tr>\n                    </tfoot>\n                </table>\n            </div>\n        `));
      return (
        ($ += `\n        <div class="print-section">\n            <h3>Cost Summary</h3>\n            <table class="cost-breakdown">\n                <tbody>\n                    <tr>\n                        <td>Raw Materials Cost:</td>\n                        <td>${s(
          u
        )}</td>\n                    </tr>\n                    <tr>\n                        <td>Direct Labor Cost:</td>\n                        <td>${s(
          m
        )}</td>\n                    </tr>\n                    <tr class="totals-row">\n                        <td><strong>Total Recipe Cost:</strong></td>\n                        <td><strong>${s(
          b
        )}</strong></td>\n                    </tr>\n                    <tr>\n                        <td>Target Servings:</td>\n                        <td>${d}</td>\n                    </tr>\n                    <tr>\n                        <td>Cost per Serving (Before Tax):</td>\n                        <td>${s(
          v
        )}</td>\n                    </tr>\n                    <tr>\n                        <td>Selling Price (After Tax):</td>\n                        <td>${s(
          w
        )}</td>\n                    </tr>\n                </tbody>\n            </table>\n        </div>\n\n        <div class="print-section">\n            <h3>Profit Analysis</h3>\n            <table class="cost-breakdown">\n                <tbody>\n                    <tr>\n                        <td>Food Cost %:</td>\n                        <td>${l(
          x,
          1
        )}%</td>\n                    </tr>\n                    <tr>\n                        <td>Labor Cost %:</td>\n                        <td>${l(
          C,
          1
        )}%</td>\n                    </tr>\n                    <tr>\n                        <td>Total Cost %:</td>\n                        <td>${l(
          E,
          1
        )}%</td>\n                    </tr>\n                    <tr class="summary-highlight">\n                        <td><strong>Gross Profit Margin %:</strong></td>\n                        <td><strong>${l(
          L,
          1
        )}%</strong></td>\n                    </tr>\n                </tbody>\n            </table>\n        </div>\n\n        <div class="print-section">\n            <h3>Production Analysis</h3>\n            <table class="cost-breakdown">\n                <tbody>\n                    <tr>\n                        <td>Serving Scale:</td>\n                        <td>${o}x</td>\n                    </tr>\n                    <tr>\n                        <td>Total Servings:</td>\n                        <td>${d}</td>\n                    </tr>\n                    <tr>\n                        <td>Total Revenue (Before Tax):</td>\n                        <td>${s(
          S
        )}</td>\n                    </tr>\n                    <tr>\n                        <td>Total Cost:</td>\n                        <td>${s(
          b
        )}</td>\n                    </tr>\n                    <tr class="summary-highlight">\n                        <td><strong>Total Profit:</strong></td>\n                        <td><strong>${s(
          P
        )}</strong></td>\n                    </tr>\n                </tbody>\n            </table>\n        </div>\n\n        <div class="print-footer">\n            <p>Generated by ProfitPerPlate - Know your profit in every plate</p>\n        </div>\n    `),
        $
      );
    })(e, t, o, a, i, r, l, s);
    (G.innerHTML = c),
      s ? G.classList.add("theme-dark") : G.classList.remove("theme-dark"),
      console.log("Print preview generated successfully");
  } catch (e) {
    console.error("Error in generatePrintPreview:", e);
    const t = G
      ? `<div class="print-header">\n                <h2>Error Generating Print Preview</h2>\n                <p>There was an error generating the print preview. Please try again.</p>\n                <p style="color: #666; font-size: 12px;">Error: ${e.message}</p>\n                <p style="color: #666; font-size: 12px;">Check the browser console for details.</p>\n            </div>`
      : "Print preview content element not available";
    G && (G.innerHTML = t);
  }
}
function jn() {
  Nn(),
    setTimeout(() => {
      const e = window.open("", "_blank"),
        t = G ? G.innerHTML : "";
      e.document.write(
        `\n            <!DOCTYPE html>\n            <html>\n            <head>\n                <title>Recipe Costing Report</title>\n                <style>\n                    body { font-family: Arial, sans-serif; padding: 20px; }\n                    .print-header { text-align: center; border-bottom: 2px solid #2D5A3D; padding-bottom: 10px; margin-bottom: 20px; }\n                    .print-section { margin-bottom: 20px; page-break-inside: avoid; }\n                    .print-section h3 { background: #f5f7fa; padding: 8px; margin: 0 0 10px 0; border-left: 4px solid #2D5A3D; }\n                    .cost-breakdown { width: 100%; border-collapse: collapse; margin: 10px 0; }\n                    .cost-breakdown th { background: #f5f7fa; font-weight: bold; padding: 8px; border: 1px solid #ddd; }\n                    .cost-breakdown td { padding: 8px; border: 1px solid #ddd; }\n                    .summary-highlight { background: #f5f7fa !important; font-weight: bold; }\n                    .totals-row { border-top: 2px solid #000 !important; font-weight: bold; }\n                    .scaling-info { background: #f0f8f0; padding: 10px; border-radius: 5px; margin: 10px 0; }\n                    .print-footer { margin-top: 30px; font-size: 10pt; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }\n                    @media print {\n                        body { margin: 0; padding: 15px; }\n                        .print-section { page-break-inside: avoid; }\n                    }\n                </style>\n            </head>\n            <body>\n                ${t}\n            </body>\n            </html>\n        `
      ),
        e.document.close(),
        setTimeout(() => {
          e.print(), e.close();
        }, 250);
    }, 100);
}
function Kn() {
  if (!Ye) return;
  Ye.innerHTML = '<option value="">Select a recipe to analyze...</option>';
  Gt()
    .filter((e) => "main" === e.type)
    .forEach((e) => {
      const t = document.createElement("option");
      (t.value = e.id),
        (t.textContent = `${e.name} (${uo(Number(e.totalCost) || 0)})`),
        Ye.appendChild(t);
    });
}
function Xn() {
  let e =
    '\n        <div style="margin-bottom: var(--space-xl);">\n            <p><strong>Welcome to ProfitPerPlate!</strong> This complete guide explains every field in simple terms with practical examples for beginners.</p>\n        </div>\n\n        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-xl);">\n            <div>\n                <h4 style="color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">Raw Materials & Recipe Fields</h4>\n    ';
  [
    "ingredientName",
    "ingredientCategory",
    "purchasePrice",
    "purchaseQuantity",
    "purchaseUnit",
    "costPerUnit",
    "selectItem",
    "quantity",
    "servings"
  ].forEach((t) => {
    const n = d[t];
    n &&
      (e += `\n                <div style="margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px dashed var(--border);">\n                    <strong>${n.title}</strong>\n                    <p style="margin: var(--space-sm) 0; font-size: 13px;">${n.content}</p>\n                    <div class="field-example">\n                        <strong>Example:</strong> ${n.example}\n                    </div>\n                </div>\n            `);
  }),
    (e +=
      '\n            </div>\n            <div>\n                <h4 style="color: var(--primary); border-bottom: 1px solid var(--border); padding-bottom: var(--space-sm);">Direct Labor & Business Fields</h4>\n    ');
  return (
    [
      "laborName",
      "shiftRate",
      "shiftDuration",
      "timeUnit",
      "costUnit",
      "markup",
      "tax",
      "vat",
      "servingScale",
      "subRecipeName",
      "subRecipeCategory",
      "subRecipeYieldQuantity",
      "yieldPercentage",
      "selectedLaborRate"
    ].forEach((t) => {
      const n = d[t];
      n &&
        (e += `\n                <div style="margin-bottom: var(--space-lg); padding-bottom: var(--space-lg); border-bottom: 1px dashed var(--border);">\n                    <strong>${n.title}</strong>\n                    <p style="margin: var(--space-sm) 0; font-size: 13px;">${n.content}</p>\n                    <div class="field-example">\n                        <strong>Example:</strong> ${n.example}\n                    </div>\n                </div>\n            `);
    }),
    (e +=
      '\n            </div>\n        </div>\n\n        <div style="margin-top: var(--space-xl); padding: var(--space-lg); background: var(--background); border-radius: var(--radius-lg);">\n            <h4 style="color: var(--primary); margin-top: 0;">Quick Tip for Beginners</h4>\n            <p>Start by adding your raw materials with their purchase details and direct labor items with shift details. Then create recipes by adding those items with the quantities or time required. Finally, set your desired markup and number of servings to see your profit per plate!</p>\n            <p><strong>Remember:</strong> Accurate costs for both materials and labor lead to accurate profit calculations. Don\'t forget to account for yield (waste) for raw materials.</p>\n        </div>\n    '),
    e
  );
}
function Zn(e, t) {
  t && (t.stopPropagation(), t.preventDefault());
  const n = d[e];
  n
    ? (z && (z.textContent = n.title + " - Field Definition"),
      W &&
        (W.innerHTML = `\n                <p><strong>${n.title}</strong> — ${n.content}</p>\n                <div class="field-example">\n                    <strong>Example:</strong> ${n.example}\n                </div>\n                <div style="margin-top: var(--space-lg); padding: var(--space-md); background: rgba(45, 90, 61, 0.05); border-radius: var(--radius-md);">\n                    <strong>💡 Tip:</strong> Look for the "?" buttons next to other fields for more explanations. \n                    Use the main "?" button in the header for a complete field guide.\n                </div>\n            `))
    : (z && (z.textContent = "Field Definitions"),
      W &&
        (W.innerHTML = `<p>Definition not found for "${e}". Please refer to the general help.</p>`)),
    O && O.classList.remove("hidden");
}
function eo() {
  if (!le) return;
  const e = parseFloat(En()) || 0,
    t = parseFloat(oe ? oe.value : 1) || 1,
    n = ae ? ae.value : r || "g",
    o = re ? re.value : n || "g";
  let i = 0;
  try {
    if (t > 0 && a[n] && a[o]) {
      i = (e / (t * a[n])) * a[o];
    } else i = t > 0 ? e / t : 0;
  } catch (e) {
    console.error("Error computing sub-recipe cost per unit:", e), (i = 0);
  }
  if (
    ((le.textContent = `${tt}${e.toFixed(2)}`),
    ie &&
      (isFinite(i)
        ? (ie.value = parseFloat(i).toFixed(4))
        : (ie.value = "0.0000")),
    se)
  ) {
    const e = isFinite(i) ? parseFloat(i).toFixed(4) : "0.0000";
    se.textContent = `${tt}${e} per ${o}`;
  }
  try {
    const e = document.getElementById("subRecipeCostPerUnitField"),
      t = document.getElementById("subRecipeCostUnitField");
    e && (e.value = isFinite(i) ? parseFloat(i).toFixed(4) : "0.0000"),
      t && (t.value = o || n || "unit");
  } catch (e) {
    console.warn("Could not update canonical sub-recipe hidden fields:", e);
  }
}
function to() {
  if (!ne) return;
  const e = ne.value;
  [ae, re].forEach((t) => {
    t &&
      ((t.innerHTML = ""),
      i[e].forEach((e) => {
        const n = document.createElement("option");
        (n.value = e), (n.textContent = e), t.appendChild(n);
      }));
  }),
    eo();
}
function no(e = null) {
  const n = document.getElementById("rawMaterialModal"),
    o = document.getElementById("rawMaterialModalTitle");
  ao(),
    e
      ? ((o.textContent = "Edit Raw Material"),
        (function (e) {
          (document.getElementById("modalRawMaterialName").value = e.name),
            (document.getElementById("modalRawMaterialCategory").value =
              e.category),
            ao(),
            (document.getElementById("modalRawMaterialPrice").value =
              e.price.toFixed(2)),
            (document.getElementById("modalRawMaterialQuantity").value =
              e.quantity.toFixed(2)),
            (document.getElementById("modalRawMaterialUnit").value = e.unit),
            (document.getElementById("modalCostPerUnit").value =
              e.costPerUnit.toFixed(4)),
            (document.getElementById("modalCostUnit").value = e.costUnit),
            (document.getElementById("modalRawMaterialYield").value =
              e.yieldPercentage || 100),
            nn();
        })(e),
        (t = { type: "rawMaterial", id: e.id, data: e }))
      : ((o.textContent = "Add New Raw Material"),
        document.getElementById("rawMaterialForm").reset(),
        nn(),
        (t = { type: null, id: null, data: null })),
    n.classList.remove("hidden");
}
function oo() {
  document.getElementById("rawMaterialModal").classList.add("hidden"),
    document.getElementById("rawMaterialForm").reset(),
    (t = { type: null, id: null, data: null });
}
function ao() {
  const e = document.getElementById("modalRawMaterialCategory").value,
    t = document.getElementById("modalRawMaterialUnit"),
    n = document.getElementById("modalCostUnit");
  t &&
    n &&
    ((t.innerHTML = ""),
    (n.innerHTML = ""),
    i[e].forEach((e) => {
      const o = document.createElement("option");
      (o.value = e), (o.textContent = e), t.appendChild(o);
      const a = document.createElement("option");
      (a.value = e), (a.textContent = e), n.appendChild(a);
    }),
    nn());
}
function io() {
  console.log("🔧 Opening sub-recipe save modal...");
  const e = document.getElementById("recipeName"),
    t = e ? e.value.trim() : "";
  if ((console.log("📝 Current recipe name:", t), !t)) {
    const t =
      "Please enter a recipe name in the 'Current Recipe' field before saving as sub-recipe";
    return (
      console.error("❌ Sub-recipe validation failed:", t),
      alert(t),
      void (
        e &&
        (e.focus(),
        e.classList.add("error"),
        setTimeout(() => e.classList.remove("error"), 2e3))
      )
    );
  }
  if (
    !(function () {
      let e = 0;
      f && (e += f.querySelectorAll("tr").length);
      y && (e += y.querySelectorAll("tr").length);
      return e > 0;
    })()
  )
    return void alert(
      "Please add some items to the recipe before saving as sub-recipe"
    );
  const n = document.getElementById("subRecipeNameDisplay");
  if (!n)
    return (
      console.error("❌ Sub-recipe name display element not found"),
      void alert(
        "Error: Could not initialize sub-recipe modal. Please refresh and try again."
      )
    );
  (n.value = t),
    console.log("✅ Set sub-recipe name in modal:", t),
    (function () {
      const e = {
        category: "weight",
        yieldQuantity: "1",
        yieldUnit: "g",
        costUnit: "g"
      };
      ne && (ne.value = e.category);
      oe && (oe.value = e.yieldQuantity);
      ae && (ae.value = e.yieldUnit);
      re && (re.value = e.costUnit);
    })(),
    to(),
    eo();
  const o = document.getElementById("subRecipeValidationMessage");
  o && (o.classList.add("hidden"), (o.textContent = ""));
  try {
    const e = document.getElementById("subRecipeCostPerUnitField"),
      t = document.getElementById("subRecipeCostUnitField");
    !e ||
      (e.value && "" !== e.value) ||
      (e.value = (parseFloat(En() / (parseFloat(oe.value) || 1)) || 0).toFixed(
        4
      )),
      !t ||
        (t.value && "" !== t.value) ||
        (t.value = re ? re.value : ae.value || "unit");
  } catch (e) {
    console.warn("While initializing sub-recipe hidden canonical fields:", e);
  }
  const a = document.getElementById("subRecipeSaveModal");
  a
    ? (a.classList.remove("hidden"),
      console.log("✅ Sub-recipe modal opened successfully"),
      Wt(`Ready to save "${t}" as sub-recipe`, "success"))
    : console.error("❌ Sub-recipe modal element not found");
}
function ro() {
  const e = [];
  return (
    f &&
      f.querySelectorAll("tr").forEach((t) => {
        const n = t.children[0].querySelector("input").value,
          o = parseFloat(t.children[1].querySelector("input").value) || 0,
          a = t.children[1].querySelector(".quantity-unit").textContent,
          i = parseFloat(t.children[2].querySelector("input").value) || 0,
          r = t.dataset.type || "rawMaterial",
          l = t.dataset.subRecipeId || null;
        ("rawMaterial" !== r && "sub-recipe" !== r) ||
          e.push({
            name: n,
            quantity: o,
            unit: a,
            unitCost: i,
            type: r,
            subRecipeId: l
          });
      }),
    e
  );
}
function lo() {
  const e = [];
  return (
    y &&
      y.querySelectorAll("tr").forEach((t) => {
        const n = t.children[0].querySelector("input").value,
          o = parseFloat(t.children[1].querySelector("input").value) || 0,
          a = t.children[1].querySelector(".quantity-unit").textContent,
          i = parseFloat(t.children[2].querySelector("input").value) || 0;
        e.push({ name: n, quantity: o, unit: a, unitCost: i });
      }),
    e
  );
}
function so(e, t) {
  const n = e.querySelector("svg");
  n &&
    (n.innerHTML = t
      ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
      : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>');
}
function co(e, t) {
  const n = document.getElementById(e);
  if (!n)
    return void console.error("❌ Password input not found for field:", e);
  const o = "password" === n.type;
  (n.type = o ? "text" : "password"),
    t && so(t, !o),
    console.log("✅ Password visibility toggled for field:", e);
}
function uo(e) {
  return `${tt}${parseFloat(e).toFixed(2)}`;
}
function po(e) {
  const t = document.createElement("div");
  return (t.textContent = e), t.innerHTML;
}
function mo(e) {
  return [...e].sort((e, t) => e.name.localeCompare(t.name));
}
function go(e) {
  return [...e].sort((e, t) => e.name.localeCompare(t.name));
}
function fo(e) {
  return [...e].sort((e, t) => e.name.localeCompare(t.name));
}
function yo(e) {
  return [...e].sort((e, t) => e.name.localeCompare(t.name));
}

// =============================================================================
// ENHANCED INITIALIZATION WITH DATA PROTECTION
// =============================================================================

async function normalInitialization() {
  console.log("🚀 Initializing ProfitPerPlate with comprehensive fixes...");
  try {
    !(function () {
      console.log(
        "🔧 Initializing DOM elements with enhanced error handling..."
      );
      try {
        (f = yt("recipeBody")),
          (y = yt("directLaborRecipeBody")),
          (b = yt("rawMaterialsTotal")),
          (v = yt("directLaborTotal")),
          (h = yt("grandTotal")),
          (w = yt("currencySelect")),
          (x = yt("recipeName")),
          (C = yt("resetRecipe")),
          (E = yt("saveMainRecipeBtn")),
          (L = yt("saveSubRecipeBtn")),
          (S = yt("summaryRawMaterialsCost")),
          (P = yt("summaryDirectLaborCost")),
          ($ = yt("summaryTotalCost")),
          (R = yt("summaryCostServing")),
          (I = yt("summarySellingPrice")),
          (M = yt("summaryFoodCost")),
          (F = yt("summaryLaborCostPercent")),
          (k = yt("summaryTotalCostPercent")),
          (B = yt("summaryGrossProfit")),
          (U = yt("markup")),
          (T = yt("tax")),
          (q = yt("vat")),
          (D = yt("servings")),
          (A = yt("servingScale")),
          (N = yt("summaryServingsDisplay")),
          (H = yt("helpBtn")),
          (O = yt("helpModal")),
          (z = yt("helpModalTitle")),
          (W = yt("helpModalContent")),
          (Q = yt("closeHelp")),
          (Y = yt("printBtn")),
          (V = yt("printPreviewModal")),
          (G = yt("printPreviewContent")),
          (_ = yt("unifiedItemSelect")),
          (J = yt("addIngredientQty")),
          (j = yt("addIngredientUnit")),
          (K = yt("directLaborSelect")),
          (X = yt("timeRequirement")),
          (Z = yt("timeRequirementUnit")),
          (ee = yt("subRecipeSaveModal")),
          (te = yt("subRecipeNameDisplay")),
          (ne = yt("subRecipeCategory")),
          (oe = yt("subRecipeYieldQuantity")),
          (ae = yt("subRecipeYieldUnit")),
          (ie = yt("subRecipeCostPerUnit")),
          (re = yt("subRecipeCostUnit")),
          (le = yt("currentRecipeCostDisplay")),
          (se = yt("costPerOutputUnit")),
          (ce = yt("mainRecipesList")),
          (de = yt("subRecipesList")),
          (ue = yt("editPromptModal")),
          (pe = yt("editPromptTitle")),
          (me = yt("editPromptMessage")),
          (ve = yt("authModal")),
          (he = yt("authModalTitle")),
          (we = yt("authForm")),
          (xe = yt("authEmail")),
          (Ce = yt("authPassword")),
          (Ee = yt("authSubmitBtn")),
          (Le = yt("authError")),
          (Se = yt("authSwitchBtn")),
          (Pe = yt("authSwitchText")),
          ($e = yt("forgotPasswordModal")),
          (Re = yt("forgotPasswordBtn")),
          (Ie = yt("forgotPasswordEmail")),
          (Me = yt("forgotPasswordError")),
          (Fe = yt("forgotPasswordSuccess")),
          (ke = yt("sendResetEmailBtn")),
          (Be = yt("togglePassword")),
          (Ue = yt("loginBtn")),
          (Te = yt("logoutBtn")),
          (qe = yt("signupBtn")),
          (De = yt("rawMaterialsPreviewBody")),
          (Ae = yt("directLaborPreviewBody")),
          (Ne = yt("rawMaterialsCount")),
          (He = yt("directLaborCount")),
          (Oe = yt("rawMaterialsPreviewTotal")),
          (ze = yt("directLaborPreviewTotal")),
          (We = yt("rawMaterialsPreviewSubtotal")),
          (Qe = yt("directLaborPreviewSubtotal")),
          (Ye = yt("summaryRecipeSelect")),
          (Ve = yt("loadedRecipeDisplay")),
          (Ge = yt("currentRecipeNameDisplay")),
          (_e = yt("loadedRecipeTotalCost")),
          (Je = yt("loadedRecipeServings")),
          (je = yt("loadedRecipeItemCount")),
          (Ke = yt("summaryBatchRevenue")),
          (Xe = yt("summaryBatchProfit")),
          (Ze = document.querySelectorAll(".sidebar-btn")),
          (et = document.querySelectorAll(".mobile-tabs .tab-btn")),
          console.log(
            `✅ DOM elements initialized - Sidebar: ${Ze.length}, Mobile: ${et.length}`
          );
      } catch (e) {
        console.error("💥 DOM element initialization failed:", e),
          setTimeout(() => {
            (Ze = document.querySelectorAll(".sidebar-btn")),
              (et = document.querySelectorAll(".mobile-tabs .tab-btn")),
              console.log(
                `🔄 Recovered navigation - Sidebar: ${Ze.length}, Mobile: ${et.length}`
              );
          }, 100);
      }
    })(),
      (function () {
        const e = localStorage.getItem("profitPerPlate_theme"),
          t =
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches,
          n = "dark" === e || (!e && t);
        document.body.classList.toggle("dark-mode", n);
        const o = document.querySelector("#darkModeToggle svg");
        o &&
          (o.innerHTML = n
            ? '<path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
            : '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>');
      })(),
      (function () {
        console.log("🔧 Setting up universal password toggles..."),
          document.addEventListener("click", function (e) {
            const t = e.target.closest(".password-toggle");
            t &&
              (e.preventDefault(),
              e.stopPropagation(),
              console.log("👁️ Password toggle clicked"),
              (function (e) {
                const t = e.closest(".password-input-group");
                if (!t)
                  return void console.error(
                    "❌ Password input group not found for toggle"
                  );
                const n = t.querySelector(
                  'input[type="password"], input[type="text"]'
                );
                if (!n)
                  return void console.error(
                    "❌ Password input not found in group"
                  );
                const o = "password" === n.type;
                (n.type = o ? "text" : "password"),
                  so(e, !o),
                  console.log("✅ Password visibility toggled to:", n.type);
              })(t));
          });
        const e = document.getElementById("togglePassword");
        e &&
          e.addEventListener("click", function (e) {
            e.preventDefault(),
              e.stopPropagation(),
              console.log("👁️ Auth password toggle clicked"),
              (function () {
                const e = document.getElementById("authPassword");
                if (!e)
                  return void console.error("❌ Auth password input not found");
                const t = "password" === e.type;
                e.type = t ? "text" : "password";
                const n = document.getElementById("togglePassword");
                n && so(n, !t);
                console.log("✅ Auth password visibility toggled");
              })();
          });
        console.log("✅ Universal password toggles setup completed");
      })(),
      (function () {
        const e = document.getElementById("unifiedEditPromptModal");
        e &&
          e.addEventListener("click", function (t) {
            t.target === e && g();
          }),
          document.addEventListener("keydown", function (t) {
            "Escape" === t.key && e && !e.classList.contains("hidden") && g();
          });
      })(),
      ot(),
      await window.supabaseClient.checkAuthState(),
      setupEnhancedAutoSave(),
      (function () {
        console.log("🔧 Setting up enhanced event listeners..."), It();
        const t = document.getElementById("darkModeToggle");
        t && t.addEventListener("click", ht);
        Rn(),
          w &&
            w.addEventListener("change", () => {
              (tt = w.value),
                (e.currency = tt),
                document
                  .querySelectorAll(".unit-currency")
                  .forEach((e) => (e.textContent = tt)),
                zn(),
                dt();
            });
        [U, T, q, D, x, A].forEach((e) => {
          e &&
            e.addEventListener("input", () => {
              zn(), dt(), n && Yn();
            });
        }),
          C && C.addEventListener("click", Nt);
        E &&
          E.addEventListener("click", function () {
            if (!x.value.trim())
              return (
                alert("Please enter a recipe name before saving"),
                void x.focus()
              );
            $n("main");
          });
        L &&
          L.addEventListener("click", function () {
            io();
          });
        const o = document.getElementById("saveRawMaterialBtn");
        o && o.addEventListener("click", Xt);
        const a = document.getElementById("saveDirectLaborBtn");
        a && a.addEventListener("click", cn);
        H &&
          H.addEventListener("click", (e) => {
            e.stopPropagation(),
              (z.textContent = "Complete Field Guide — ProfitPerPlate"),
              (W.innerHTML = Xn()),
              O.classList.remove("hidden");
          });
        Q && Q.addEventListener("click", An);
        O &&
          O.addEventListener("click", (e) => {
            e.target === O && An();
          });
        void (
          Y &&
          (Y.replaceWith(Y.cloneNode(!0)),
          (Y = document.getElementById("printBtn")),
          Y.addEventListener("click", function () {
            console.log("Print button clicked");
            const e = null !== n,
              t = (f && f.children.length > 0) || (y && y.children.length > 0);
            if (e || t)
              try {
                Jn(),
                  V
                    ? V.classList.remove("hidden")
                    : (console.error("Print preview modal not found"),
                      alert("Error: Print preview modal not available"));
              } catch (e) {
                console.error("Error generating print preview:", e),
                  alert(
                    "Error generating print preview. Please check the console for details."
                  );
              }
            else
              alert(
                "No recipe data available to print. Please either:\n\n1. Add items to your current recipe, OR\n2. Load a saved recipe in the Summary tab for analysis"
              );
          }),
          console.log("Print button setup completed"))
        ),
          void [
            { id: "rawMaterialModal", closeFn: oo },
            { id: "directLaborModal", closeFn: rn },
            { id: "printPreviewModal", closeFn: Nn },
            { id: "subRecipeSaveModal", closeFn: Mn },
            { id: "editPromptModal", closeFn: Hn },
            { id: "authModal", closeFn: kt },
            { id: "forgotPasswordModal", closeFn: xt },
            { id: "resetPasswordModal", closeFn: St },
            { id: "helpModal", closeFn: An },
            { id: "unifiedEditPromptModal", closeFn: g }
          ].forEach((e) => {
            const t = document.getElementById(e.id);
            t &&
              t.addEventListener("click", (t) => {
                t.target.id === e.id && e.closeFn();
              });
          }),
          _ && _.addEventListener("change", hn);
        A &&
          A.addEventListener("input", function () {
            parseFloat(this.value);
            zn(), dt(), n && Yn();
          });
        document.addEventListener("keydown", (e) => {
          "Escape" === e.key && Rt();
        }),
          console.log("✅ Enhanced event listeners setup completed");
      })(),
      await gt(),
      vt(),
      zn(),
      mn(),
      In(),
      to(),
      Kn(),
      W && (W.innerHTML = Xn()),
      _n(),
      await window.supabaseClient.handlePasswordReset(),
      At(),
      (function () {
        const e = document.querySelectorAll(".batch-profit-analysis label");
        e.length >= 2 &&
          ((e[0].textContent = "Total Revenue:"),
          (e[1].textContent = "Total Profit:"));
        const t = document.querySelector(".batch-profit-analysis:nth-child(3)");
        t && t.remove();
      })(),
      console.log("🔗 Exporting all global functions..."),
      (window.switchTab = it),
      (window.setupNavigationSystem = ot),
      (window.setupDirectNavigationListeners = at),
      (window.openAuthModal = Mt),
      (window.closeAuthModal = kt),
      (window.handleAuth = Ft),
      (window.handleLogout = qt),
      (window.toggleAuthMode = Tt),
      (window.openForgotPasswordModal = wt),
      (window.closeForgotPasswordModal = xt),
      (window.sendPasswordReset = Ct),
      (window.showResetPasswordModal = Lt),
      (window.closeResetPasswordModal = St),
      (window.togglePasswordVisibilityGeneric = co),
      (window.handlePasswordReset = Pt),
      (window.showResetPasswordError = $t),
      (window.closeAllModals = Rt),
      (window.openRawMaterialModal = no),
      (window.closeRawMaterialModal = oo),
      (window.saveRawMaterial = Kt),
      (window.deleteRawMaterial = Zt),
      (window.updateCostPerUnit = nn),
      (window.updateCostPerUnitValue = on),
      (window.updateUnitOptions = ao),
      (window.openDirectLaborModal = an),
      (window.closeDirectLaborModal = rn),
      (window.saveDirectLabor = sn),
      (window.deleteDirectLabor = dn),
      (window.updateLaborCostPerUnit = ln),
      (window.addItemToRecipe = Cn),
      (window.addDirectLaborToRecipe = yn),
      (window.editRecipeRow = bn),
      (window.editDirectLaborRow = wn),
      (window.updateRecipeRow = vn),
      (window.updateDirectLaborRow = xn),
      (window.saveRecipe = Pn),
      (window.deleteRecipe = qn),
      (window.editRecipe = Un),
      (window.editSubRecipe = Tn),
      (window.loadRecipe = kn),
      (window.loadSubRecipe = Bn),
      (window.openSubRecipeSaveModal = io),
      (window.closeSubRecipeSaveModal = Mn),
      (window.saveSubRecipe = Ln),
      (window.updateSubRecipeUnitOptions = to),
      (window.updateSubRecipeCostDisplay = eo),
      (window.loadRecipeForSummary = Vn),
      (window.recalc = zn),
      (window.printCostingReport = jn),
      (window.closePrintPreview = Nn),
      (window.generatePrintPreview = Jn),
      (window.showFieldHelp = Zn),
      (window.closeHelpModal = An),
      (window.handleEditPromptChoice = Dn),
      (window.renderRawMaterials = en),
      (window.renderDirectLabor = un),
      (window.filterRawMaterials = tn),
      (window.filterDirectLabor = pn),
      (window.saveRecipeWithDuplicateCheck = $n),
      (window.saveRawMaterialWithDuplicateCheck = Xt),
      (window.saveDirectLaborWithDuplicateCheck = cn),
      (window.saveSubRecipeWithDuplicateCheck = Sn),
      (window.showRecipeEditPrompt = On),
      (window.initializeAuth = It),
      (window.setupEnhancedAutoSave = setupEnhancedAutoSave),
      (window.loadRecipeStateWithFallback = gt),
      (window.loadUserDataFromLocalStorage = rt),
      (window.safeClearLocalData = lt),
      (window.normalizeRecipeData = l),
      (window.normalizeUserData = s),
      (window.prepareUserDataForSave = c),
      (window.handleUnifiedEditPromptChoice = m),
      (window.closeUnifiedEditPromptModal = g),
      
      // Export enhanced data protection functions
      (window.hasMeaningfulData = hasMeaningfulData),
      (window.attemptDataRecovery = attemptDataRecovery),
      (window.initializeWithDataProtection = initializeWithDataProtection),
      (window.setupEnhancedAutoSave = setupEnhancedAutoSave),
      (window.showDataOperationNotification = showDataOperationNotification),
      (window.updateDataStateIndicator = updateDataStateIndicator),
      
      console.log("✅ All global functions exported successfully"),
      console.log("🎉 ProfitPerPlate initialization completed successfully"),
      Wt(
        "Welcome to ProfitPerPlate! Your data is automatically saved.",
        "success"
      );
  } catch (e) {
    console.error("💥 Initialization failed:", e),
      Wt(
        "Initialization completed with minor issues. Some features may be limited.",
        "warning"
      );
  }
}

// Replace the existing DOMContentLoaded initialization
document.addEventListener('DOMContentLoaded', async function() {
  console.log("🚀 Initializing ProfitPerPlate with comprehensive data protection...");
  
  try {
    // Use enhanced initialization
    await initializeWithDataProtection();
    
    console.log("🎉 ProfitPerPlate initialization with data protection completed successfully");
    Wt("Welcome to ProfitPerPlate! Your data is protected with enhanced backup.", "success");
    
  } catch (e) {
    console.error("💥 Protected initialization failed:", e);
    // Fall back to original initialization
    await normalInitialization();
    Wt("Initialization completed with enhanced data protection.", "info");
  }
});