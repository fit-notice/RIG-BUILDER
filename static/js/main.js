// --- Global State ---
const selectedParts = {
    cpu: null,
    motherboard: null,
    gpu: null,
    ram: [],
    storage: [],
    psu: null,
    case: null
};
const componentDataCache = {};
let currentModalComponentType = null;
let currentModalDisplayedComponents = [];
const activeFilters = {};
const currentSort = {};

// --- Translations Object (Ensuring keys match index.html for component cards precisely) ---
const translations = {
    en: {
        // Sidebar
        pcBuilder: "PC Builder",
        savedBuilds: "Saved Builds",
        settings: "Settings",
        // Build Summary
        buildSummaryTitle: "Build Summary",
        estimatedTDP: "Estimated TDP:",
        psuWattageWarning: "PSU wattage might be insufficient!",
        compatibilityStatusDefault: "No compatibility issues detected.",
        saveBuildBtn: "Save Build",
        // Main Content Header
        mainTitle: "Create Your Custom PC",
        // Section Titles
        currentBuildTitle: "Current Build",
        selectComponentsTitle: "Select Components",
        // Component Card Types (for <div class="component-type">)
        componentTypeCpu: "CPU",
        componentTypeMotherboard: "Motherboard",
        componentTypeGpu: "GPU",
        componentTypeRam: "RAM",
        componentTypeStorage: "Storage",
        componentTypePsu: "Power Supply",
        componentTypeCase: "Case",
        // Component Card Placeholders (for <span class="placeholder"> within component-name div)
        chooseCpu: "Choose a CPU",
        chooseMotherboard: "Choose a Motherboard",
        chooseGpu: "Choose a GPU",
        chooseRam: "Choose RAM",
        chooseStorage: "Choose Storage",
        choosePsu: "Choose a PSU",
        chooseCase: "Choose a Case",
        // Buttons
        addBtn: "Add",
        removeBtn: "Remove",
        manageBtn: "Manage",
        clearAllBtn: "Clear All",
        // Modal
        modalSelectComponentDefault: "Select Component",
        modalSearchPlaceholder: "Search components...",
        modalFiltersButton: " Filters",
        modalFiltersTitle: "Filters",
        modalFiltersLoading: "Filter options loading...",
        modalResetFiltersBtn: "Reset Filters",
        modalLoadingComponents: "Loading components...",
        modalErrorLoading: "Error loading components",
        modalNoComponentsMatch: "No components match filters/search.",
        modalNoDataToDisplay: "No data to display.",
        modalSelectButton: "Select",
        modalAddedButton: "Added ✔",
        modalNoFiltersAvailable: "No filters available for this component type.",
        // Settings Page
        settingsPageTitle: "Settings",
        appearanceTitle: "Appearance",
        darkModeLabel: "Dark Mode",
        languageTitle: "Language",
        selectLanguageLabel: "Select Language",
        backToBuilder: "Back to Builder",
        // Placeholders
        emptySlotPlaceholder: "Empty",
        // Compatibility (Examples)
        compIssueCPUvsMoboSocket: "CPU socket ({cpuSocket}) incompatible with Mobo socket ({moboSocket}).",
        compWarnRAMSlots: "Using {ramCount} RAM modules, but motherboard has {moboSlots} slots.",
        compIssueRAMvsMoboDDR: "RAM module '{ramName}' ({ramDDR}) incompatible with Mobo DDR type ({moboDDR}).",
    },
    ar: {
        // Sidebar
        pcBuilder: "منشئ الكمبيوتر",
        savedBuilds: "التجميعات المحفوظة",
        settings: "الإعدادات",
        // Build Summary
        buildSummaryTitle: "ملخص التجميعة",
        estimatedTDP: "استهلاك الطاقة المقدر:",
        psuWattageWarning: "قد تكون قدرة مزود الطاقة غير كافية!",
        compatibilityStatusDefault: "لم يتم اكتشاف مشاكل توافق.",
        saveBuildBtn: "حفظ التجميعة",
        // Main Content Header
        mainTitle: "أنشئ جهاز الكمبيوتر المخصص لك",
        // Section Titles
        currentBuildTitle: "التجميعة الحالية",
        selectComponentsTitle: "اختر القطع",
        // Component Card Types
        componentTypeCpu: "المعالج",
        componentTypeMotherboard: "اللوحة الأم",
        componentTypeGpu: "بطاقة الرسوميات",
        componentTypeRam: "الذاكرة العشوائية",
        componentTypeStorage: "وحدة التخزين",
        componentTypePsu: "مزود الطاقة",
        componentTypeCase: "صندوق الحاسب",
        // Component Card Placeholders
        chooseCpu: "اختر معالجًا",
        chooseMotherboard: "اختر لوحة أم",
        chooseGpu: "اختر بطاقة رسوميات",
        chooseRam: "اختر ذاكرة عشوائية",
        chooseStorage: "اختر وحدة تخزين",
        choosePsu: "اختر مزود طاقة",
        chooseCase: "اختر صندوق الحاسب",
        // Buttons
        addBtn: "إضافة",
        removeBtn: "إزالة",
        manageBtn: "إدارة",
        clearAllBtn: "مسح الكل",
        // Plurals for build slot types
        componentTypeCpuPlural: "المعالجات",
        componentTypeRamPlural: "الذواكر العشوائية",
        componentTypeGpuPlural: "بطاقات الرسوميات",
        componentTypeStoragePlural: "وحدات التخزين",
        componentTypePsuPlural: "مزودات الطاقة",
        componentTypeCasePlural: "صناديق الحاسب",
        componentTypeMotherboardPlural: "اللوحات الأم",
        // Modal
        modalSelectComponentDefault: "اختر قطعة",
        modalSearchPlaceholder: "ابحث عن القطع...",
        modalFiltersButton: " الفلاتر",
        modalFiltersTitle: "الفلاتر",
        modalFiltersLoading: "جاري تحميل خيارات الفلترة...",
        modalResetFiltersBtn: "إعادة تعيين الفلاتر",
        modalLoadingComponents: "جاري تحميل القطع...",
        modalErrorLoading: "خطأ في تحميل القطع",
        modalNoComponentsMatch: "لا توجد قطع تطابق الفلاتر/البحث.",
        modalNoDataToDisplay: "لا توجد بيانات لعرضها.",
        modalSelectButton: "اختر",
        modalAddedButton: "تمت الإضافة ✔",
        modalNoFiltersAvailable: "لا توجد فلاتر متاحة لهذا النوع من القطع.",
        // Settings Page
        settingsPageTitle: "الإعدادات",
        appearanceTitle: "المظهر",
        darkModeLabel: "الوضع الداكن",
        languageTitle: "اللغة",
        selectLanguageLabel: "اختر اللغة",
        backToBuilder: "العودة إلى المنشئ",
        // Placeholders
        emptySlotPlaceholder: "فارغ",
        // Compatibility (Examples)
        compIssueCPUvsMoboSocket: "مقبس المعالج ({cpuSocket}) غير متوافق مع مقبس اللوحة الأم ({moboSocket}).",
        compWarnRAMSlots: "يتم استخدام {ramCount} وحدات ذاكرة، ولكن اللوحة الأم بها {moboSlots} فتحات فقط.",
        compIssueRAMvsMoboDDR: "وحدة الذاكرة '{ramName}' ({ramDDR}) غير متوافقة مع نوع DDR المدعوم من اللوحة الأم ({moboDDR}).",
    }
};
let currentLanguage = localStorage.getItem('language') || 'en';

// --- Function to apply translations (Revised for component card titles/placeholders) ---
function applyTranslations(lang = null) {
    const languageToApply = lang || currentLanguage;
    const RLT_LANGUAGES = ['ar'];

    if (!translations[languageToApply]) {
        console.warn(`Language ${languageToApply} not found in translations. Defaulting to English.`);
        currentLanguage = 'en';
    } else {
        currentLanguage = languageToApply;
    }
    localStorage.setItem('language', currentLanguage);

    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = RLT_LANGUAGES.includes(currentLanguage) ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-translate-key]').forEach(element => {
        const key = element.dataset.translateKey;
        const translationSet = translations[currentLanguage] || translations['en'];
        const translation = translationSet[key];

        if (translation !== undefined) {
            if (element.tagName === 'INPUT' && (element.type === 'search' || element.type === 'text')) {
                element.placeholder = translation;
            } else if (element.tagName === 'BUTTON' || element.classList.contains('menu-item')) {
                const textSpan = element.querySelector('span:not(.subtitle):not(.placeholder):not(.summary-value):not(.component-name)');
                if (textSpan) {
                    textSpan.textContent = translation;
                } else if (element.textContent.trim() && !element.querySelector('i')) {
                    element.textContent = translation;
                }
            } else if (element.classList.contains('placeholder') && element.parentElement.classList.contains('component-name')) {
                // Specific handling for placeholders like "Choose a CPU"
                element.textContent = translation;
            } else if (element.classList.contains('component-type')) {
                // Specific handling for component type titles like "CPU", "Motherboard" on cards
                element.textContent = translation;
            } else {
                element.textContent = translation;
            }
        } else {
            // console.warn(`Translation key '${key}' not found for lang '${currentLanguage}'. Element:`, element);
        }
    });

    const modalTitleEl = document.getElementById('modal-title-text');
    if (modalTitleEl) {
        let titleText = (translations[currentLanguage] || translations.en).modalSelectComponentDefault;
        if (currentModalComponentType) {
            const componentTypeKey = `componentType${currentModalComponentType.charAt(0).toUpperCase() + currentModalComponentType.slice(1)}`;
            const translatedComponentType = (translations[currentLanguage] || translations.en)[componentTypeKey] || currentModalComponentType;
            titleText = `${(translations[currentLanguage] || translations.en).modalSelectComponentDefault} (${translatedComponentType})`;
        }
        modalTitleEl.textContent = titleText;
    }

    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => {
        el.textContent = (translations[currentLanguage] || translations.en).modalLoadingComponents;
    });
    const filterPanelLoading = document.querySelector('#modal-filter-panel-body > p[data-translate-key="modalFiltersLoading"]');
    if (filterPanelLoading) {
        filterPanelLoading.textContent = (translations[currentLanguage] || translations.en).modalFiltersLoading;
    }
    const searchInput = document.getElementById('modal-search-input');
    if (searchInput) {
      searchInput.placeholder = (translations[currentLanguage] || translations.en).modalSearchPlaceholder;
    }
     document.querySelectorAll('.select-btn').forEach(btn => {
        if(!btn.classList.contains('selected-in-modal')) {
            btn.textContent = (translations[currentLanguage] || translations.en).modalSelectButton;
        }
     });
     document.querySelectorAll('.added-indicator').forEach(span => {
        span.textContent = (translations[currentLanguage] || translations.en).modalAddedButton;
     });

    Object.keys(selectedParts).forEach(type => {
        const detailsContainer = document.querySelector(`#build-slot-${type} .build-slot-details`);
        if (detailsContainer) {
            const typeLabelDiv = detailsContainer.querySelector('.build-slot-type');
            if (typeLabelDiv) {
                const baseKey = `componentType${type.charAt(0).toUpperCase() + type.slice(1)}`;
                let labelText = (translations[currentLanguage] || translations.en)[baseKey] || type.charAt(0).toUpperCase() + type.slice(1);
                const itemsToDisplay = Array.isArray(selectedParts[type]) ? selectedParts[type] : (selectedParts[type] ? [selectedParts[type]] : []);
                if (Array.isArray(selectedParts[type]) && itemsToDisplay.length !== 1) {
                    if (currentLanguage === 'ar') {
                        const pluralKeyAr = `${baseKey}Plural`;
                        labelText = (translations.ar)[pluralKeyAr] || labelText;
                    } else {
                        if (labelText !== "RAM" && !labelText.endsWith('s') && !labelText.endsWith('ال')) {
                            labelText += 's';
                        }
                    }
                }
                typeLabelDiv.textContent = labelText;
            }
        }
    });
}
window.applyTranslationsGlobal = applyTranslations;


// --- Utility Functions (existing) ---
function markItemSelectedInModal(componentType, component, isSelected) {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;
    const buttons = modalBody.querySelectorAll(`button[data-component-json]`);
    const addedText = (translations[currentLanguage] || translations.en).modalAddedButton;
    const selectText = (translations[currentLanguage] || translations.en).modalSelectButton;
    buttons.forEach(button => {
        try {
            const buttonData = JSON.parse(button.dataset.componentJson);
            if (buttonData.name === component.name) {
                if (isSelected) {
                    button.textContent = addedText; button.classList.add('selected-in-modal'); button.disabled = true;
                } else {
                    button.textContent = selectText; button.classList.remove('selected-in-modal'); button.disabled = false;
                }
            }
        } catch(e) { console.error("[DEBUG] Error parsing button JSON during marking:", e); }
    });
}

function extractBrand(name) {
    if (!name) return 'Unknown';
    const nameLower = name.toLowerCase();
    const brands = ['AMD', 'Intel', 'NVIDIA', 'MSI', 'Gigabyte', 'Asus', 'ASRock', 'EVGA', 'Corsair', 'NZXT', 'Samsung', 'Kingston', 'Crucial', 'Western Digital', 'Seagate', 'G.Skill', 'Lian Li', 'be quiet!', 'Cooler Master', 'Fractal Design', 'Phanteks', 'Thermaltake', 'Silverstone', 'Streacom', 'Kolink', 'Geometric Future'];
    for (const brand of brands) { const brandLower = brand.toLowerCase(); const regex = new RegExp(`(?:^|\\s|[\\(\\)\\[\\]\\{\\}])(${brandLower})(?:$|\\s|[\\(\\)\\[\\]\\{\\}])`, 'i'); if (regex.test(nameLower)) { if ((brand === 'AMD' && nameLower.includes('ryzen')) || (brand === 'Intel' && nameLower.includes('core'))) return brand; if ((brand === 'NVIDIA' && nameLower.includes('geforce')) || (brand === 'AMD' && nameLower.includes('radeon'))) return brand; return brand; } }
    return name.split(/[\s-]+/)[0] || 'Unknown';
}
function calculateRamSize(modules) {
    if (modules && Array.isArray(modules) && modules.length === 2 && typeof modules[0] === 'number' && typeof modules[1] === 'number') { return modules[0] * modules[1]; } return null;
}
function getRamSpeed(speed) {
    return (speed && Array.isArray(speed) && speed.length >= 2 && typeof speed[1] === 'number') ? speed[1] : null;
}
function normalizeSocket(socketStr) {
     if (!socketStr) return ''; let normalized = String(socketStr).toLowerCase().trim(); normalized = normalized.replace(/^(lga|am|tr|strx)\s*/, ''); normalized = normalized.replace(/[\s-]+/g, ''); return normalized;
 }
const efficiencyMap = { 'bronze': 1, 'silver': 2, 'gold': 3, 'platinum': 4, 'titanium': 5 };
function getEfficiencyValue(efficiencyStr) {
    if (!efficiencyStr) return 0; return efficiencyMap[String(efficiencyStr).toLowerCase()] || 0;
 }
function inferSupportedMoboFormFactors(caseFormFactor) {
    if (!caseFormFactor || typeof caseFormFactor !== 'string') return []; const mainFactor = caseFormFactor.toUpperCase(); let supported = new Set(); if (mainFactor.includes("E-ATX")) supported.add("E-ATX").add("ATX").add("Micro-ATX").add("Mini-ITX"); else if (mainFactor.includes("ATX")) supported.add("ATX").add("Micro-ATX").add("Mini-ITX"); else if (mainFactor.includes("MICRO-ATX") || mainFactor.includes("MATX")) supported.add("Micro-ATX").add("Mini-ITX"); else if (mainFactor.includes("MINI-ITX") || mainFactor.includes("ITX")) supported.add("Mini-ITX"); else if (mainFactor.includes("MINI-DTX") || mainFactor.includes("DTX")) supported.add("Mini-DTX").add("Mini-ITX"); else supported.add(caseFormFactor); return Array.from(supported);
}
function normalizeFormFactor(ffString) {
    if (!ffString || typeof ffString !== 'string') return ''; return ffString.toLowerCase().replace(/[\s-]+/g, '');
}

// --- Modal Management & Component Display ---
function openModal(componentType) {
    console.log(`Debug log: openModal called for type: ${componentType}`);
    if (!componentType) { console.error("openModal: componentType missing"); return; }
    currentModalComponentType = componentType;
    const modalTitleEl = document.getElementById('modal-title-text');
    const modalBody = document.getElementById('modal-body');
    const filterPanelBody = document.getElementById('modal-filter-panel-body');
    const filterSortControls = document.getElementById('modal-filter-sort-controls');
    const modalContent = document.querySelector('#component-modal .modal-content');
    const searchInput = document.getElementById('modal-search-input');
    const modalElement = document.getElementById('component-modal');
    if (!modalTitleEl || !modalBody || !filterPanelBody || !filterSortControls || !modalContent || !searchInput || !modalElement) { console.error("Modal elements missing!"); return; }
    applyTranslations();
    modalBody.innerHTML = `<div class="loading">${(translations[currentLanguage] || translations.en).modalLoadingComponents}</div>`;
    const filterPanelLoadingP = filterPanelBody.querySelector('p[data-translate-key="modalFiltersLoading"], p.filter-options-loading');
    if (filterPanelLoadingP) { filterPanelLoadingP.textContent = (translations[currentLanguage] || translations.en).modalFiltersLoading; filterPanelLoadingP.dataset.translateKey="modalFiltersLoading"; }
    else { filterPanelBody.innerHTML = `<p data-translate-key="modalFiltersLoading">${(translations[currentLanguage] || translations.en).modalFiltersLoading}</p>`; }
    filterSortControls.innerHTML = ''; modalContent.classList.remove('filter-panel-open'); if(searchInput) searchInput.value = '';
    if (!activeFilters[componentType]) activeFilters[componentType] = {};
    if (!currentSort[componentType]) currentSort[componentType] = { key: 'name', direction: 'asc', type: 'string' };
    modalElement.classList.add('show'); modalElement.setAttribute('aria-hidden', 'false');
    fetchAndDisplayComponents(componentType);
}

function closeModal() {
    console.log("Debug log: closeModal called"); const modal = document.getElementById('component-modal'); if (modal) { modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true'); } const modalContent = document.querySelector('#component-modal .modal-content'); if (modalContent) modalContent.classList.remove('filter-panel-open'); currentModalComponentType = null;
}
function toggleFilterPanel() {
     console.log("Debug log: toggleFilterPanel called"); const modalContent = document.querySelector('#component-modal .modal-content'); if (modalContent) modalContent.classList.toggle('filter-panel-open');
}

function fetchAndDisplayComponents(componentType) {
    console.log(`Debug log: fetchAndDisplayComponents - Type: ${componentType}`); if (!componentType) return;
    const processAndDisplay = (components) => {
        if (!Array.isArray(components)) { console.error("Invalid data format received:", components); if(document.getElementById('modal-body')) document.getElementById('modal-body').innerHTML = `<p class="error">${(translations[currentLanguage] || translations.en).modalErrorLoading}</p>`; return; }
        try {
            const processedComponents = components.map(comp => { if (!comp) return null; let processed = { ...comp, brand: comp.brand || extractBrand(comp.name) }; if (componentType === 'ram') { processed.calculatedRamSize = calculateRamSize(comp.modules); processed.ramSpeedValue = getRamSpeed(comp.speed); } else if (componentType === 'cpu' || componentType === 'motherboard') { processed.normalizedSocket = normalizeSocket(comp.socket); } if (componentType === 'cpu') { processed.has_igpu = (comp.graphics !== null && comp.graphics !== undefined && String(comp.graphics).trim() !== ""); } else if (componentType === 'storage') { processed.storageCapacityGB = (Number(comp.capacity) || 0); } else if (componentType === 'psu') { processed.efficiencyValue = getEfficiencyValue(comp.efficiency); } else if (componentType === 'case') { processed.type = comp.form_factor || 'Unknown Form Factor'; processed.max_gpu_length_num = parseInt(comp.max_gpu_length) || 0; processed.supported_mobo_form_factors = inferSupportedMoboFormFactors(comp.form_factor); processed.has_rgb = comp.has_rgb === true; processed.has_tempered_glass = comp.has_tempered_glass === true; processed.psu_form_factor_supported_by_case = comp.psu_form_factor || null; } delete processed.price; return processed; }).filter(comp => comp !== null);
            componentDataCache[componentType] = processedComponents; prepareModalControls(componentType, processedComponents); applyFiltersAndSort(componentType);
        } catch (error) { console.error(`Error processing components for ${componentType}:`, error); const modalBody = document.getElementById('modal-body'); if (modalBody) modalBody.innerHTML = `<p class="error">Error processing component data: ${error.message}</p>`; }
    };
    if (componentDataCache[componentType]) { processAndDisplay(componentDataCache[componentType]); }
    else { fetch(`/api/components/${componentType}`).then(response => { if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`); const ct = response.headers.get("content-type"); if (ct && ct.includes("application/json")) return response.json(); throw new Error(`Received non-JSON response for ${componentType}`); }).then(data => processAndDisplay(Array.isArray(data) ? data : [])).catch(error => { console.error(`Error fetching or processing ${componentType}:`, error); const mb = document.getElementById('modal-body'); if(mb) mb.innerHTML = `<p class="error">${(translations[currentLanguage] || translations.en).modalErrorLoading}: ${error.message}</p>`; }); }
}

function prepareModalControls(componentType, components) {
    const filterSortControls = document.getElementById('modal-filter-sort-controls'); const filterPanelBody = document.getElementById('modal-filter-panel-body'); if (!filterSortControls || !filterPanelBody) { console.error("Filter/Sort elements missing"); return;} filterSortControls.innerHTML = ''; filterPanelBody.innerHTML = '';
    const sortSelect = document.createElement('select'); sortSelect.id = 'modal-sort-select'; sortSelect.classList.add('toolbar-select'); sortSelect.setAttribute('aria-label', 'Sort by');
    let sortOptions = [ { key: 'name', label: 'Name: A to Z', direction: 'asc', type: 'string' }, { key: 'name', label: 'Name: Z to A', direction: 'desc', type: 'string' } ];
    if (componentType === 'gpu') { sortOptions.push( { key: 'memory', label: 'VRAM (High to Low)', direction: 'desc', type: 'number' }, { key: 'boost_clock', label: 'Boost Clock (High to Low)', direction: 'desc', type: 'number' } ); } else if (componentType === 'cpu') { sortOptions.push( { key: 'core_count', label: 'Core Count (High to Low)', direction: 'desc', type: 'number' }, { key: 'boost_clock', label: 'Boost Clock (High to Low)', direction: 'desc', type: 'number' } ); } else if (componentType === 'ram') { sortOptions.push( { key: 'ramSpeedValue', label: 'Speed (MHz, High to Low)', direction: 'desc', type: 'number' }, { key: 'calculatedRamSize', label: 'Size (GB, High to Low)', direction: 'desc', type: 'number' } ); } else if (componentType === 'storage') { sortOptions.push( { key: 'storageCapacityGB', label: 'Size (GB, High to Low)', direction: 'desc', type: 'number' } ); } else if (componentType === 'psu') { sortOptions.push( { key: 'wattage', label: 'Wattage (High to Low)', direction: 'desc', type: 'number' }, { key: 'efficiencyValue', label: 'Efficiency (Best First)', direction: 'desc', type: 'number' } ); } else if (componentType === 'case') { sortOptions.push( { key: 'max_gpu_length_num', label: 'Max GPU Length (High to Low)', direction: 'desc', type: 'number'}, { key: 'type', label: 'Case Form Factor (A to Z)', direction: 'asc', type: 'string'} ); }
    const currentSortForType = currentSort[componentType] || { key: 'name', direction: 'asc', type: 'string' }; if (!sortOptions.some(opt => opt.key === currentSortForType.key && opt.direction === currentSortForType.direction)) { currentSort[componentType] = { key: 'name', direction: 'asc', type: 'string' }; }
    sortOptions.forEach(opt => { const option = document.createElement('option'); option.value = `${opt.key}|${opt.direction}|${opt.type}`; option.textContent = opt.label; if (currentSort[componentType].key === opt.key && currentSort[componentType].direction === opt.direction) option.selected = true; sortSelect.appendChild(option); });
    sortSelect.addEventListener('change', (e) => { const [key, direction, type] = e.target.value.split('|'); currentSort[componentType] = { key, direction, type }; applyFiltersAndSort(componentType); });
    const filterButton = document.createElement('button'); filterButton.id = 'modal-filter-btn'; filterButton.classList.add('toolbar-button'); filterButton.dataset.translateKey = 'modalFiltersButton';
    const filterIcon = document.createElement('i'); filterIcon.className = 'fas fa-filter'; filterButton.appendChild(filterIcon); const filterTextSpan = document.createElement('span'); filterButton.appendChild(filterTextSpan); filterButton.setAttribute('aria-label', 'Toggle Filters'); filterButton.onclick = toggleFilterPanel;
    filterSortControls.appendChild(filterButton); filterSortControls.appendChild(sortSelect);
    let filtersAdded = false;
    try {
        filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'brand', 'Brand') || filtersAdded;
        if (componentType === 'gpu') { filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'memory', 'VRAM (GB)') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'pcie_type', 'PCIe Type') || filtersAdded; } 
        else if (componentType === 'cpu') { filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'socket', 'Socket') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'core_count', 'Core Count') || filtersAdded; filtersAdded = generateBooleanFilterGroup(componentType, components, filterPanelBody, 'has_igpu', 'Integrated Graphics') || filtersAdded; } 
        else if (componentType === 'motherboard') { filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'socket', 'Socket') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'form_factor', 'Form Factor') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'supported_ddr', 'Supported DDR') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'pcie_type', 'Main PCIe Slot') || filtersAdded; } 
        else if (componentType === 'ram') { filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'ddr_version', 'DDR Type') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'calculatedRamSize', 'Total Size (GB)') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'ramSpeedValue', 'Speed (MHz)') || filtersAdded; } 
        else if (componentType === 'storage') { filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'type', 'Type (SSD/HDD)') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'storageCapacityGB', 'Capacity (GB)') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'interface', 'Interface') || filtersAdded; } 
        else if (componentType === 'psu') { filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'wattage', 'Wattage') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'efficiency', 'Efficiency Rating') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'modular', 'Modularity') || filtersAdded; } 
        else if (componentType === 'case') { filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'type', 'Case Form Factor') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'color', 'Color') || filtersAdded; filtersAdded = generateBooleanFilterGroup(componentType, components, filterPanelBody, 'has_rgb', 'RGB Lighting') || filtersAdded; filtersAdded = generateBooleanFilterGroup(componentType, components, filterPanelBody, 'has_tempered_glass', 'Tempered Glass Panel') || filtersAdded; filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'psu_form_factor_supported_by_case', 'PSU Form Factor Support') || filtersAdded; const allMoboFormFactors = new Set(); components.forEach(c => { if (c && Array.isArray(c.supported_mobo_form_factors)) { c.supported_mobo_form_factors.forEach(ff => allMoboFormFactors.add(String(ff))); } }); if (allMoboFormFactors.size > 1) { const groupDiv = document.createElement('div'); groupDiv.classList.add('filter-group'); const label = document.createElement('label'); label.classList.add('filter-group-label'); label.textContent = 'Motherboard Form Factor Support (Inferred)'; groupDiv.appendChild(label); Array.from(allMoboFormFactors).sort().forEach(value => { const checkboxId = `filter-${componentType}-supported_mobo_form_factors_individual-${value.replace(/[^a-zA-Z0-9_-]/g, '-')}`; const wrapper = document.createElement('div'); wrapper.classList.add('filter-option'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = checkboxId; checkbox.value = value; checkbox.dataset.filterKey = 'supported_mobo_form_factors_individual'; if (activeFilters[componentType]?.['supported_mobo_form_factors_individual']?.has(value)) checkbox.checked = true; checkbox.addEventListener('change', () => { updateActiveFilters(componentType); applyFiltersAndSort(componentType); }); const checkboxLabel = document.createElement('label'); checkboxLabel.htmlFor = checkboxId; const count = components.filter(c => c.supported_mobo_form_factors && c.supported_mobo_form_factors.includes(value)).length; checkboxLabel.textContent = `${value} (${count})`; wrapper.appendChild(checkbox); wrapper.appendChild(checkboxLabel); groupDiv.appendChild(wrapper); }); filterPanelBody.appendChild(groupDiv); filtersAdded = true; } }
        const initialFilterPanelP = filterPanelBody.querySelector('p[data-translate-key="modalFiltersLoading"]');
        if (!filtersAdded && initialFilterPanelP) { initialFilterPanelP.textContent = (translations[currentLanguage] || translations.en).modalNoFiltersAvailable; initialFilterPanelP.removeAttribute('data-translate-key'); }
        else if (!filtersAdded && filterPanelBody.innerHTML === '') { filterPanelBody.innerHTML = `<p>${(translations[currentLanguage] || translations.en).modalNoFiltersAvailable}</p>`;}
        applyTranslations();
    } catch (error) { console.error("Error during filter generation:", error); filterPanelBody.innerHTML = '<p class="error">Error generating filters.</p>'; }
}

function generateFilterGroup(componentType, components, parentElement, filterKey, filterLabel) { /* ... (Keep existing) ... */
    try { const values = components.map(c => { if (!c) return null; if (filterKey === 'calculatedRamSize') return c.calculatedRamSize; if (filterKey === 'storageCapacityGB') return c.storageCapacityGB; if (filterKey === 'ramSpeedValue') return c.ramSpeedValue; if (filterKey === 'psu_form_factor_supported_by_case') return c.psu_form_factor_supported_by_case; return c[filterKey]; }).filter(val => val !== null && val !== undefined && String(val).trim() !== ""); const valueCounts = values.reduce((acc, val) => { const valStr = String(val); acc[valStr] = (acc[valStr] || 0) + 1; return acc; }, {}); const uniqueValues = Object.keys(valueCounts).sort((a, b) => { const numA = parseFloat(a); const numB = parseFloat(b); if (!isNaN(numA) && !isNaN(numB)) return numA - numB; return String(a).toLowerCase().localeCompare(String(b).toLowerCase()); }); if (uniqueValues.length > 1) { const groupDiv = document.createElement('div'); groupDiv.classList.add('filter-group'); const label = document.createElement('label'); label.classList.add('filter-group-label'); label.textContent = filterLabel; groupDiv.appendChild(label); uniqueValues.forEach(value => { const safeValueId = String(value).replace(/[^a-zA-Z0-9_-]/g, '-'); const checkboxId = `filter-${componentType}-${filterKey}-${safeValueId}`; const wrapper = document.createElement('div'); wrapper.classList.add('filter-option'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = checkboxId; checkbox.value = value; checkbox.dataset.filterKey = filterKey; if (activeFilters[componentType]?.[filterKey]?.has(String(value))) checkbox.checked = true; checkbox.addEventListener('change', () => { updateActiveFilters(componentType); applyFiltersAndSort(componentType); }); const checkboxLabel = document.createElement('label'); checkboxLabel.htmlFor = checkboxId; checkboxLabel.textContent = `${value} (${valueCounts[value]})`; wrapper.appendChild(checkbox); wrapper.appendChild(checkboxLabel); groupDiv.appendChild(wrapper); }); parentElement.appendChild(groupDiv); return true; } return false; } catch (error) { console.error(`Error generating filter group for ${filterKey}:`, error); return false; }
}
function generateBooleanFilterGroup(componentType, components, parentElement, filterKey, filterLabel) { /* ... (Keep existing) ... */
    try { const hasTrue = components.some(c => c && c[filterKey] === true); const hasFalse = components.some(c => c && c[filterKey] === false); if (hasTrue && hasFalse) { const groupDiv = document.createElement('div'); groupDiv.classList.add('filter-group'); const label = document.createElement('label'); label.classList.add('filter-group-label'); label.textContent = filterLabel; groupDiv.appendChild(label); const options = [{label: 'Yes', value: 'true'}, {label: 'No', value: 'false'}]; options.forEach(opt => { const count = components.filter(c => c && String(c[filterKey]) === opt.value).length; if (count === 0) return; const checkboxId = `filter-${componentType}-${filterKey}-${opt.value}`; const wrapper = document.createElement('div'); wrapper.classList.add('filter-option'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = checkboxId; checkbox.value = opt.value; checkbox.dataset.filterKey = filterKey; if (activeFilters[componentType]?.[filterKey]?.has(opt.value)) checkbox.checked = true; checkbox.addEventListener('change', () => { updateActiveFilters(componentType); applyFiltersAndSort(componentType); }); const checkboxLabel = document.createElement('label'); checkboxLabel.htmlFor = checkboxId; checkboxLabel.textContent = `${opt.label} (${count})`; wrapper.appendChild(checkbox); wrapper.appendChild(checkboxLabel); groupDiv.appendChild(wrapper); }); parentElement.appendChild(groupDiv); return true; } return false; } catch (error) { console.error(`Error generating boolean filter group for ${filterKey}:`, error); return false; }
}
function updateActiveFilters(componentType) { /* ... (Keep existing) ... */
    if (!componentType) return; activeFilters[componentType] = {}; const filterPanelBody = document.getElementById('modal-filter-panel-body'); if (!filterPanelBody) return; filterPanelBody.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => { const key = checkbox.dataset.filterKey; const value = checkbox.value; if (!key) return; if (!activeFilters[componentType][key]) activeFilters[componentType][key] = new Set(); activeFilters[componentType][key].add(String(value)); });
}
function resetFilters(componentType) { /* ... (Keep existing) ... */
    if (!componentType) return; activeFilters[componentType] = {}; const filterPanelBody = document.getElementById('modal-filter-panel-body'); if(filterPanelBody) filterPanelBody.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false); applyFiltersAndSort(componentType);
}
function applyFiltersAndSort(componentType) {
    if (!componentType || !componentDataCache[componentType]) {
        const modalBody = document.getElementById('modal-body');
        if(modalBody) modalBody.innerHTML = `<p class="no-components">${(translations[currentLanguage] || translations.en).modalErrorLoading}</p>`;
        return;
    }

    const allComponents = componentDataCache[componentType];
    const filters = activeFilters[componentType] || {};
    const defaultSortOption = { key: 'name', direction: 'asc', type: 'string' };
    let sort = currentSort[componentType] || defaultSortOption;
    if (sort.key === 'price') { // Fallback if persisted sort was by price
        sort = defaultSortOption;
        currentSort[componentType] = defaultSortOption;
    }

    const searchInput = document.getElementById('modal-search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let filteredComponents = [];
    try {
        filteredComponents = allComponents.filter(comp => {
             if (!comp) return false;
             let searchMatch = true;
             if (searchTerm) {
                 searchMatch = false;
                 const nameMatch = typeof comp.name === 'string' && comp.name.toLowerCase().includes(searchTerm);
                 let otherMatch = false;
                 if (componentType === 'gpu' && typeof comp.chipset === 'string' && comp.chipset.toLowerCase().includes(searchTerm)) otherMatch = true;
                 else if (componentType === 'cpu' && typeof comp.socket === 'string' && comp.socket.toLowerCase().includes(searchTerm)) otherMatch = true;
                 else if (componentType === 'motherboard' && typeof comp.chipset === 'string' && comp.chipset.toLowerCase().includes(searchTerm)) otherMatch = true;
                 else if (componentType === 'storage' && ((typeof comp.interface === 'string' && comp.interface.toLowerCase().includes(searchTerm)) || (typeof comp.type === 'string' && comp.type.toLowerCase().includes(searchTerm)))) otherMatch = true;
                 else if (componentType === 'psu' && ((typeof comp.efficiency === 'string' && comp.efficiency.toLowerCase().includes(searchTerm)) || (typeof comp.modular === 'string' && comp.modular.toLowerCase().includes(searchTerm)) || (typeof comp.type === 'string' && comp.type.toLowerCase().includes(searchTerm)))) otherMatch = true;
                 else if (componentType === 'case' && ((typeof comp.type === 'string' && comp.type.toLowerCase().includes(searchTerm)) || (typeof comp.color === 'string' && comp.color.toLowerCase().includes(searchTerm)) || (comp.psu_form_factor_supported_by_case && typeof comp.psu_form_factor_supported_by_case === 'string' && comp.psu_form_factor_supported_by_case.toLowerCase().includes(searchTerm)))) otherMatch = true;
                 searchMatch = nameMatch || otherMatch;
             }
             if (!searchMatch) return false;

            for (const key in filters) {
                const allowedValuesSet = filters[key];
                if (allowedValuesSet && allowedValuesSet.size > 0) {
                    let compValue;
                    if (key === 'has_igpu' || (componentType === 'case' && (key === 'has_rgb' || key === 'has_tempered_glass'))) {
                        compValue = String(comp[key]);
                    }
                    else if (key === 'calculatedRamSize') compValue = String(comp.calculatedRamSize);
                    else if (key === 'storageCapacityGB') compValue = String(comp.storageCapacityGB);
                    else if (key === 'ramSpeedValue') compValue = String(comp.ramSpeedValue);
                    else if (key === 'supported_mobo_form_factors_individual') {
                        if (!comp.supported_mobo_form_factors || !comp.supported_mobo_form_factors.some(ff => allowedValuesSet.has(String(ff)))) return false;
                        continue;
                    }
                    else compValue = comp[key] !== undefined && comp[key] !== null ? String(comp[key]) : '';
                    if (!allowedValuesSet.has(compValue)) return false;
                }
            }
            return true;
        });

        filteredComponents.sort((a, b) => {
             const sortKey = sort.key;
             const sortDir = sort.direction;
             const sortType = sort.type;
             let valA = a ? a[sortKey] : null;
             let valB = b ? b[sortKey] : null;
              if (sortKey === 'calculatedRamSize') { valA = a?.calculatedRamSize; valB = b?.calculatedRamSize; }
              else if (sortKey === 'ramSpeedValue') { valA = a?.ramSpeedValue; valB = b?.ramSpeedValue; }
              else if (sortKey === 'storageCapacityGB') { valA = a?.storageCapacityGB; valB = b?.storageCapacityGB; }
              else if (sortKey === 'efficiencyValue') { valA = a?.efficiencyValue; valB = b?.efficiencyValue; }
              else if (sortKey === 'max_gpu_length_num') { valA = a?.max_gpu_length_num; valB = b?.max_gpu_length_num; }
             const aIsNull = valA === null || valA === undefined || valA === '';
             const bIsNull = valB === null || valB === undefined || valB === '';
             if (aIsNull && bIsNull) return 0;
             if (aIsNull) return 1;
             if (bIsNull) return -1;
             let comparison = 0;
             if (sortType === 'number') {
                 const numA = parseFloat(valA);
                 const numB = parseFloat(valB);
                 if (!isNaN(numA) && !isNaN(numB)) comparison = numA - numB;
                 else comparison = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
             } else {
                 comparison = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
             }
             return sortDir === 'asc' ? comparison : comparison * -1;
         });
    } catch (error) {
        console.error(`Error during filtering/sorting for ${componentType}:`, error);
        const modalBody = document.getElementById('modal-body');
        if (modalBody) modalBody.innerHTML = `<p class="error">Error applying filters/sort: ${error.message}.</p>`;
        return;
    }
    currentModalDisplayedComponents = filteredComponents;
    displayComponentsInModal(filteredComponents, componentType);
}

function displayComponentsInModal(components, componentType) {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    if (!components) { modalBody.innerHTML = `<p class="no-components">${(translations[currentLanguage] || translations.en).modalNoDataToDisplay}</p>`; return; }
    if (components.length === 0) { modalBody.innerHTML = `<p class="no-components">${(translations[currentLanguage] || translations.en).modalNoComponentsMatch}</p>`; return; }
    if (!componentType) { modalBody.innerHTML = `<p class="error">Error: Component type missing.</p>`; return; }

    let tableHTML = `<table class="component-table"><thead><tr><th>Name</th><th>Specs/Tags</th><th>Actions</th></tr></thead><tbody>`;
    try {
        components.forEach(component => {
            if (!component || typeof component.name !== 'string') return;
            let tagsHTML = '';
             if (componentType === 'cpu') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-socket">Socket ${component.socket || '?'}</span> <span class="tag tag-cores">${component.core_count || '?'} Cores</span> <span class="tag tag-speed">${component.core_clock || '?'} GHz</span>` + (component.boost_clock ? ` <span class="tag tag-boost">${component.boost_clock} GHz Boost</span>` : '') + ` <span class="tag tag-tdp">${component.tdp || '?'}W TDP</span>` + (component.has_igpu ? ` <span class="tag tag-igpu">iGPU: Yes</span>` : ''); }
             else if (componentType === 'motherboard') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-socket">Socket ${component.socket || '?'}</span> <span class="tag tag-form">${component.form_factor || '?'}</span> <span class="tag tag-ddr">${component.supported_ddr || '?'} (${component.memory_slots || '?'} slots)</span> <span class="tag tag-pcie">PCIe ${component.pcie_type || '?'}</span> <span class="tag tag-m2">${component.m2_slots || '0'} M.2</span>`; }
             else if (componentType === 'gpu') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-chipset">${component.chipset || '?'}</span> <span class="tag tag-memory">${component.memory || '?'} GB</span> <span class="tag tag-pcie">${component.pcie_type || '?'}</span> <span class="tag tag-speed">Core: ${component.core_clock || '?'} MHz</span>` + (component.boost_clock ? ` <span class="tag tag-boost">Boost: ${component.boost_clock} MHz</span>` : '') + (component.length ? ` <span class="tag tag-length">${component.length}mm Length</span>` : ''); }
             else if (componentType === 'ram') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-size">${component.calculatedRamSize ?? '?'} GB (${component.modules?.[0] || '?'}x${component.modules?.[1] || '?'}GB)</span> <span class="tag tag-ddr">${component.ddr_version || '?'}</span> <span class="tag tag-speed">${component.ramSpeedValue ?? '?'} MHz</span>` + (component.cas_latency ? ` <span class="tag tag-cas">CL${component.cas_latency}</span>` : ''); }
             else if (componentType === 'storage') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-size">${component.storageCapacityGB ?? '?'} GB</span> <span class="tag tag-type">${component.type || '?'}</span> <span class="tag tag-interface">${component.interface || '?'}</span> <span class="tag tag-form">${component.form_factor || '?'}</span>` + (component.cache ? ` <span class="tag tag-cache">${component.cache}MB Cache</span>` : ''); }
             else if (componentType === 'psu') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-wattage">${component.wattage || '?'}W</span> <span class="tag tag-efficiency">${component.efficiency || '?'} Rated</span> <span class="tag tag-modular">${component.modular || '?'}</span> <span class="tag tag-form">${component.type || '?'} (Type)</span>`; }
             else if (componentType === 'case') {
                tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-type">${component.type || '?'}</span> <span class="tag tag-color">${component.color || '?'}</span>`;
                if (component.max_gpu_length_num) tagsHTML += ` <span class="tag tag-length">Max GPU: ${component.max_gpu_length_num}mm</span>`;
                if (component.psu_form_factor_supported_by_case) tagsHTML += ` <span class="tag tag-form">PSU: ${component.psu_form_factor_supported_by_case}</span>`;
                if (component.has_rgb) tagsHTML += ` <span class="tag tag-feature">RGB</span>`;
                if (component.has_tempered_glass) tagsHTML += ` <span class="tag tag-feature">TG Panel</span>`;
             }
            let componentJsonString;
            let isAlreadySelectedInBuild = false;
            let uniqueIdForRemoval = null;
            if (componentType === 'ram' || componentType === 'storage') {
                const existingItem = selectedParts[componentType].find(item => item.name === component.name);
                if (existingItem && existingItem._uniqueId) {
                    isAlreadySelectedInBuild = true;
                    uniqueIdForRemoval = existingItem._uniqueId;
                    component._uniqueId = existingItem._uniqueId;
                } else {
                    delete component._uniqueId;
                }
            }
            try {
                const componentForButton = {...component};
                delete componentForButton.price;
                componentJsonString = JSON.stringify(componentForButton).replace(/"/g, '&quot;').replace(/'/g, '&apos;');
            } catch (e) { componentJsonString = '{}'; }

            const nameDisplay = component.name || 'N/A';
            let actionCellHTML = '';
            const addedText = (translations[currentLanguage] || translations.en).modalAddedButton;
            const selectText = (translations[currentLanguage] || translations.en).modalSelectButton;

            if (isAlreadySelectedInBuild && uniqueIdForRemoval) {
                 actionCellHTML = `<div class="multi-action-cell"><span class="added-indicator">${addedText}</span><button class="remove-from-modal-btn" title="Remove this item from build" onclick="removePart('${componentType}', '${uniqueIdForRemoval}')">✕</button></div>`;
            } else {
                actionCellHTML = `<button class="select-btn" onclick="handleSelectComponentClick(this, '${componentType}')" data-component-json='${componentJsonString}'>${selectText}</button>`;
            }
            tableHTML += `<tr><td>${nameDisplay}</td><td><div class="spec-tags">${tagsHTML || 'N/A'}</div></td><td>${actionCellHTML}</td></tr>`;
        });
        tableHTML += `</tbody></table>`;
        modalBody.innerHTML = tableHTML;
    } catch (error) {
        console.error("Error generating modal table HTML:", error);
        modalBody.innerHTML = `<p class="error">Error displaying components: ${error.message}</p>`;
    }
}

function handleSelectComponentClick(buttonElement, componentType) {
    try {
        if (!buttonElement) throw new Error("Button element missing.");
        const componentJsonData = buttonElement.dataset.componentJson;
        if (!componentJsonData) throw new Error("Select button missing component data.");
        const component = JSON.parse(componentJsonData);
        if (!component || typeof component !== 'object') throw new Error("Invalid component data format.");
        selectComponent(componentType, component);
    } catch (e) {
        console.error(`[DEBUG] ERROR in handleSelectComponentClick for ${componentType}: ${e.message}`, e.stack, buttonElement);
        alert(`Error selecting ${componentType}. Check console.`);
    }
}

function updateBuildDisplay(componentTypeToUpdate, _data) {
    Object.keys(selectedParts).forEach(componentType => {
        const slotElement = document.getElementById(`build-slot-${componentType}`);
        const detailsContainer = slotElement?.querySelector('.build-slot-details');
        if (!slotElement || !detailsContainer) return;
        detailsContainer.innerHTML = '';
        const currentPartOrParts = selectedParts[componentType];
        const isMulti = Array.isArray(currentPartOrParts);
        const itemsToDisplay = isMulti ? currentPartOrParts : (currentPartOrParts ? [currentPartOrParts] : []);

        const typeLabelDiv = document.createElement('div');
        typeLabelDiv.className = 'build-slot-type';
        const baseKey = `componentType${componentType.charAt(0).toUpperCase() + componentType.slice(1)}`;
        let labelText = (translations[currentLanguage] || translations.en)[baseKey] || componentType.charAt(0).toUpperCase() + componentType.slice(1);
        if (isMulti && itemsToDisplay.length !== 1) {
            if (currentLanguage === 'ar') {
                const pluralKeyAr = `${baseKey}Plural`;
                labelText = (translations.ar)[pluralKeyAr] || labelText;
            } else {
                if (labelText !== "RAM" && !labelText.endsWith('s') && !labelText.endsWith('ال')) {
                    labelText += 's';
                }
            }
        }
        typeLabelDiv.textContent = labelText;
        detailsContainer.appendChild(typeLabelDiv);

        if (itemsToDisplay.length > 0) {
            slotElement.classList.add('filled');
            const itemListContainer = document.createElement('div');
            itemListContainer.className = 'multi-item-list';
            itemsToDisplay.forEach((component) => {
                if (!component) return;
                const itemDiv = document.createElement('div');
                itemDiv.className = 'build-item-entry';
                if (component._uniqueId) itemDiv.dataset.itemId = component._uniqueId;
                const nameElement = document.createElement('div');
                nameElement.className = 'build-slot-name';
                nameElement.textContent = component.name || 'Unknown';
                itemDiv.appendChild(nameElement);
                const tagsElement = document.createElement('div');
                tagsElement.className = 'build-item-tags build-slot-tags';
                let tagsHTML = '';
                if (componentType === 'cpu') { tagsHTML += `<span class="tag tag-cores">${component.core_count || '?'}C</span> <span class="tag tag-speed">${component.core_clock || '?'}GHz</span>` + (component.has_igpu ? ` <span class="tag tag-igpu">iGPU</span>` : ''); }
                else if (componentType === 'motherboard') { tagsHTML += `<span class="tag tag-socket">${component.socket || '?'}</span> <span class="tag tag-form">${component.form_factor || '?'}</span> <span class="tag tag-ddr">${component.supported_ddr || '?'}</span>`; }
                else if (componentType === 'gpu') { tagsHTML += `<span class="tag tag-memory">${component.memory || '?'}GB</span> <span class="tag tag-pcie">${component.pcie_type || '?'}</span>`; }
                else if (componentType === 'ram') { tagsHTML += `<span class="tag tag-size">${component.calculatedRamSize ?? '?'}GB</span> <span class="tag tag-speed">${component.ramSpeedValue ?? '?'}MHz</span> <span class="tag tag-ddr">${component.ddr_version || '?'}</span>`; }
                else if (componentType === 'storage') { tagsHTML += `<span class="tag tag-size">${component.storageCapacityGB ?? '?'}GB</span> <span class="tag tag-type">${component.type || '?'}</span>`; }
                else if (componentType === 'psu') { tagsHTML += `<span class="tag tag-wattage">${component.wattage || '?'}W</span> <span class="tag tag-efficiency">${component.efficiency || '?'}</span>`; }
                else if (componentType === 'case') {
                    tagsHTML += `<span class="tag tag-type">${component.type || '?'}</span>`;
                    if(component.color) tagsHTML += ` <span class="tag tag-color">${component.color}</span>`;
                    if(component.has_rgb) tagsHTML += ` <span class="tag tag-feature">RGB</span>`;
                }
                tagsElement.innerHTML = tagsHTML;
                if(tagsHTML) itemDiv.appendChild(tagsElement);
                if (isMulti && component._uniqueId) {
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-item-btn';
                    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                    removeBtn.title = `Remove ${component.name}`;
                    removeBtn.onclick = () => removePart(componentType, component._uniqueId);
                    itemDiv.appendChild(removeBtn);
                }
                if (isMulti) itemListContainer.appendChild(itemDiv);
                else detailsContainer.appendChild(itemDiv);
            });
            if (isMulti) detailsContainer.appendChild(itemListContainer);
        } else {
            slotElement.classList.remove('filled');
            const emptyName = document.createElement('div');
            emptyName.className = 'build-slot-name';
            emptyName.innerHTML = `<span class="placeholder" data-translate-key="emptySlotPlaceholder">${(translations[currentLanguage] || translations.en).emptySlotPlaceholder}</span>`;
            detailsContainer.appendChild(emptyName);
            const emptyTags = document.createElement('div');
            emptyTags.className = 'build-item-tags build-slot-tags';
            emptyTags.innerHTML = '&nbsp;';
            detailsContainer.appendChild(emptyTags);
        }
    });
    checkCompatibility();
}

function selectComponent(componentType, component) {
    if (!selectedParts.hasOwnProperty(componentType) || !component || typeof component !== 'object') return;
    console.log(`[DEBUG] selectComponent called for type: ${componentType}`, component);
    try {
        let maxReached = false;
        if (componentType === 'ram' || componentType === 'storage') {
            const targetArray = selectedParts[componentType];
            if (componentType === 'ram') {
                const moboSlots = selectedParts.motherboard?.memory_slots || 0;
                if (moboSlots > 0 && targetArray.length >= moboSlots) { alert(`Cannot add more RAM. Motherboard only has ${moboSlots} slots.`); maxReached = true; }
            } else if (componentType === 'storage') {
                const moboM2 = selectedParts.motherboard?.m2_slots || 0;
                const currentM2Count = targetArray.filter(item => (String(item.interface || '').toLowerCase().includes('m.2') || String(item.form_factor || '').toLowerCase().includes('m.2'))).length;
                const isNewItemM2 = (String(component.interface || '').toLowerCase().includes('m.2') || String(component.form_factor || '').toLowerCase().includes('m.2'));
                if (isNewItemM2 && moboM2 > 0 && currentM2Count >= moboM2) { alert(`Cannot add more M.2 storage. Motherboard has ${moboM2} M.2 slots, all are filled.`); maxReached = true; }
            }
            const alreadySelected = targetArray.some(item => item.name === component.name);
            if (alreadySelected && !maxReached) { alert(`"${component.name}" is already in your ${componentType} list.`); markItemSelectedInModal(componentType, component, true); return; }
            if (!maxReached) {
                if (!component._uniqueId) component._uniqueId = `${componentType}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                targetArray.push(component);
                markItemSelectedInModal(componentType, component, true);
                const cardElement = document.getElementById(`${componentType}-card`);
                if (cardElement) {
                    const removeBtn = cardElement.querySelector('.remove-btn');
                    if (removeBtn) removeBtn.classList.remove('hidden');
                    const nameEl = document.getElementById(`selected-${componentType}`);
                    if (nameEl) nameEl.textContent = `${targetArray.length} item(s) selected`;
                }
            }
        } else {
            selectedParts[componentType] = component;
            const selectedElement = document.getElementById(`selected-${componentType}`);
            if (selectedElement) selectedElement.textContent = component.name;
            const cardElement = document.getElementById(`${componentType}-card`);
            if (cardElement) {
                const addBtn = cardElement.querySelector('.add-btn');
                const removeBtn = cardElement.querySelector('.remove-btn');
                if (addBtn) addBtn.classList.add('hidden');
                if (removeBtn) removeBtn.classList.remove('hidden');
            }
            closeModal();
        }
        updateBuildDisplay(componentType, selectedParts[componentType]);
    } catch (e) {
        console.error(`[DEBUG] ERROR in selectComponent for ${componentType}: ${e.message}`, e.stack, component);
        alert(`Error selecting ${componentType}. Check console.`);
    }
}

function removePart(componentType, itemIdToRemove = null) {
    if (!selectedParts.hasOwnProperty(componentType)) return;
    console.log(`[DEBUG] removePart called for type: ${componentType}, ID: ${itemIdToRemove}`);
    let itemRemoved = false;
    let removedItemDataForModalUpdate = null;
    if (componentType === 'ram' || componentType === 'storage') {
        const targetArray = selectedParts[componentType];
        if (itemIdToRemove === 'ALL') {
            if (targetArray.length > 0) {
                if (currentModalComponentType === componentType) targetArray.forEach(item => markItemSelectedInModal(componentType, item, false));
                selectedParts[componentType] = []; itemRemoved = true;
            }
        } else if (itemIdToRemove) {
            const itemIndex = targetArray.findIndex(item => item._uniqueId === itemIdToRemove);
            if (itemIndex !== -1) { removedItemDataForModalUpdate = targetArray.splice(itemIndex, 1)[0]; itemRemoved = true; }
        }
        const cardElement = document.getElementById(`${componentType}-card`);
        const nameEl = document.getElementById(`selected-${componentType}`);
        if (cardElement && nameEl) {
            const removeBtnAll = cardElement.querySelector('.remove-btn');
            if (selectedParts[componentType].length === 0) {
                if (removeBtnAll) removeBtnAll.classList.add('hidden');
                const placeholderKey = `choose${componentType.charAt(0).toUpperCase() + componentType.slice(1)}`;
                nameEl.innerHTML = `<span class="placeholder" data-translate-key="${placeholderKey}">${(translations[currentLanguage] || translations.en)[placeholderKey] || `Choose ${componentType.charAt(0).toUpperCase() + componentType.slice(1)}`}</span>`;
            } else {
                if (removeBtnAll) removeBtnAll.classList.remove('hidden');
                nameEl.textContent = `${selectedParts[componentType].length} item(s) selected`;
            }
        }
        if (removedItemDataForModalUpdate) markItemSelectedInModal(componentType, removedItemDataForModalUpdate, false);
    } else {
        if (selectedParts[componentType] !== null) {
            selectedParts[componentType] = null; itemRemoved = true;
            const selectedElement = document.getElementById(`selected-${componentType}`);
            const typeCap = componentType === 'case' ? 'Case' : componentType.charAt(0).toUpperCase() + componentType.slice(1);
            const placeholderKey = `choose${typeCap}`;
            if (selectedElement) selectedElement.innerHTML = `<span class="placeholder" data-translate-key="${placeholderKey}">${(translations[currentLanguage] || translations.en)[placeholderKey] || `Choose a ${typeCap}`}</span>`;
            const cardElement = document.getElementById(`${componentType}-card`);
            if (cardElement) {
                const addBtn = cardElement.querySelector('.add-btn'); const removeBtn = cardElement.querySelector('.remove-btn');
                if (addBtn) addBtn.classList.remove('hidden'); if (removeBtn) removeBtn.classList.add('hidden');
                if (componentType === 'psu') cardElement.classList.remove('psu-capacity-warning', 'psu-capacity-error');
            }
        }
    }
    if (itemRemoved) updateBuildDisplay(componentType, selectedParts[componentType]);
}

function calculateTotalTDP() {
    let totalTDP = (Number(selectedParts.cpu?.tdp) || 0) + (Number(selectedParts.gpu?.tdp) || 0);
    if (totalTDP > 0) totalTDP += 50;
    document.getElementById('total-tdp').textContent = `${totalTDP}W`;
    return totalTDP;
}

function checkCompatibility() {
    let issues = []; let warnings = [];
    const ui = { status: document.getElementById('compatibility-status'), psuWarn: document.getElementById('psu-warning'), psuCard: document.getElementById('psu-card')};
    if (!ui.status || !ui.psuWarn) { console.error("Compatibility UI elements missing."); return; }
    ui.psuWarn.style.display = 'none'; ui.psuWarn.className = 'psu-warning';
    if (ui.psuCard) ui.psuCard.classList.remove('psu-capacity-warning', 'psu-capacity-error');
    const { cpu, motherboard, gpu, ram, storage, psu, case: pcCase } = selectedParts;

    if (cpu && motherboard && cpu.normalizedSocket && motherboard.normalizedSocket && cpu.normalizedSocket !== motherboard.normalizedSocket) issues.push(`CPU socket (${cpu.socket || '?'}) incompatible with Mobo socket (${motherboard.socket || '?'}).`);
    if (ram.length > 0 && motherboard) {
        const moboDDR = motherboard.supported_ddr; const moboSlots = parseInt(motherboard.memory_slots) || 0;
        if (ram.length > moboSlots && moboSlots > 0) warnings.push(`Using ${ram.length} RAM modules, but motherboard has ${moboSlots} slots.`);
        if (moboDDR) ram.forEach(r => { if (r.ddr_version && r.ddr_version !== moboDDR) issues.push(`RAM module '${r.name}' (${r.ddr_version}) incompatible with Mobo DDR type (${moboDDR}).`); });
    }
    if (gpu && motherboard && gpu.pcie_type && motherboard.pcie_type) {
        const getVer = s => parseFloat(String(s || '').match(/(\d+\.?\d*)/)?.[0]) || 0;
        const gpuVer = getVer(gpu.pcie_type); const moboVer = getVer(motherboard.pcie_type);
        if (gpuVer > 0 && moboVer > 0 && gpuVer !== moboVer ) { let msg = `GPU PCIe (${gpu.pcie_type || '?'}) & Mobo PCIe (${motherboard.pcie_type || '?'}) mismatch.`; if (gpuVer > moboVer) msg += ` GPU may be bottlenecked.`; else msg += ` System will run at GPU's ${gpu.pcie_type || '?'} speed.`; warnings.push(msg); }
    }
    if (motherboard) {
        const moboM2Slots = parseInt(motherboard.m2_slots) || 0;
        const m2Drives = storage.filter(s => (String(s.interface || '').toLowerCase().includes('m.2') || String(s.form_factor || '').toLowerCase().includes('m.2')));
        if (m2Drives.length > moboM2Slots && moboM2Slots > 0) issues.push(`Using ${m2Drives.length} M.2 drives, but motherboard only has ${moboM2Slots} M.2 slot(s).`);
        else if (m2Drives.length > 0 && moboM2Slots === 0) issues.push(`M.2 drive(s) selected, but motherboard has no M.2 slots.`);
    }
    if (pcCase && motherboard) {
        const moboFormFactorRaw = motherboard.form_factor; const normalizedMoboFF = normalizeFormFactor(moboFormFactorRaw);
        if (normalizedMoboFF && Array.isArray(pcCase.supported_mobo_form_factors) && pcCase.supported_mobo_form_factors.length > 0) {
            const isSupported = pcCase.supported_mobo_form_factors.some(sff => normalizeFormFactor(sff) === normalizedMoboFF );
            if (!isSupported) issues.push(`Mobo form factor (${moboFormFactorRaw || '?'}) not supported by Case '${pcCase.name || '?'}' (supports: ${pcCase.supported_mobo_form_factors.join(', ')}).`);
        } else if (normalizedMoboFF && (!Array.isArray(pcCase.supported_mobo_form_factors) || pcCase.supported_mobo_form_factors.length === 0)) { warnings.push(`Could not determine specific motherboard form factor support for Case '${pcCase.name || '?'}'. Please verify compatibility manually.`); }
    }
    if (pcCase && gpu && pcCase.max_gpu_length_num > 0) { const gpuLen = parseInt(gpu.length) || 0; if (gpuLen > 0 && gpuLen > pcCase.max_gpu_length_num) issues.push(`GPU (${gpu.name || '?'} - ${gpuLen}mm) too long for Case '${pcCase.name || '?'}' (max: ${pcCase.max_gpu_length_num}mm).`); }
    if (pcCase && psu && psu.type && pcCase.psu_form_factor_supported_by_case) {
        const normalizedPsuType = normalizeFormFactor(psu.type); const normalizedCasePsuSupport = normalizeFormFactor(pcCase.psu_form_factor_supported_by_case);
        if (normalizedPsuType && normalizedCasePsuSupport && normalizedPsuType !== normalizedCasePsuSupport) warnings.push(`PSU form factor (${psu.type || '?'}) may not match Case's supported PSU form factor (${pcCase.psu_form_factor_supported_by_case || '?'}). Check manually.`);
    }
    const totalTDP = calculateTotalTDP();
    if (psu && psu.wattage) {
        const psuWattage = parseInt(psu.wattage) || 0; const recWatt = Math.ceil(Math.max(totalTDP + 100, totalTDP * 1.35) / 10) * 10;
        const psuWarnTextEl = ui.psuWarn.querySelector('span');
        const psuWarningTextKey = 'psuWattageWarning';
        let psuMsg = (translations[currentLanguage] || translations.en)[psuWarningTextKey] || "PSU wattage might be insufficient!";
        if (psuWattage < totalTDP && totalTDP > 0) {
            let specificMsg = psuMsg + ` (${psuWattage}W < ~${totalTDP}W)`; issues.push(specificMsg);
            if (psuWarnTextEl) psuWarnTextEl.textContent = specificMsg; else ui.psuWarn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>${specificMsg}</span>`; // Ensure span if not there
            ui.psuWarn.className = 'psu-warning psu-error'; ui.psuWarn.style.display = 'flex';
            if (ui.psuCard) ui.psuCard.classList.add('psu-capacity-error');
        } else if (psuWattage < recWatt && totalTDP > 0) {
            let specificMsg = psuMsg + ` Recommended: ~${recWatt}W (PSU: ${psuWattage}W, Load: ~${totalTDP}W)`; warnings.push(specificMsg);
            if (ui.psuWarn.style.display === 'none') { if (psuWarnTextEl) psuWarnTextEl.textContent = specificMsg; else ui.psuWarn.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>${specificMsg}</span>`; ui.psuWarn.className = 'psu-warning psu-warn'; ui.psuWarn.style.display = 'flex'; }
            if (ui.psuCard) ui.psuCard.classList.add('psu-capacity-warning');
        }
    } else if (totalTDP > 0 && !psu) warnings.push(`PSU not selected. Estimated load ~${totalTDP}W.`);

    ui.status.classList.remove('compatible', 'incompatible', 'has-warnings'); ui.status.innerHTML = '';
    const defaultCompatTextKey = 'compatibilityStatusDefault';
    if (issues.length === 0 && warnings.length === 0) {
        ui.status.classList.add('compatible');
        ui.status.innerHTML = `<div><i class="fas fa-check-circle"></i> <span data-translate-key="${defaultCompatTextKey}">${(translations[currentLanguage] || translations.en)[defaultCompatTextKey]}</span></div>`;
    } else {
        let html = '';
        if (issues.length > 0) {
            ui.status.classList.add('incompatible');
            html += `<div><i class="fas fa-exclamation-triangle"></i> <span data-translate-key="compatibilityIssuesTitle">Compatibility Issues:</span></div><ul>${issues.map(i => `<li class="issue-error">${i}</li>`).join('')}</ul>`;
        }
        if (warnings.length > 0) {
            if (issues.length === 0) ui.status.classList.add('compatible');
            ui.status.classList.add('has-warnings');
            html += `<div class="${issues.length > 0 ? 'warning-header' : ''}"><i class="fas fa-exclamation-circle"></i> <span data-translate-key="potentialIssuesTitle">Potential Issues/Warnings:</span></div><ul>${warnings.map(w => `<li class="issue-warning">${w}</li>`).join('')}</ul>`;
        }
        ui.status.innerHTML = html;
        applyTranslations();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    function applyInitialSettings() {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        currentLanguage = localStorage.getItem('language') || 'en';
        // Initial translation call happens here
    }
    applyInitialSettings(); // Apply theme first

    Object.keys(selectedParts).forEach(type => updateBuildDisplay(type, null));

    document.getElementById('component-modal')?.addEventListener('click', e => e.target.id === 'component-modal' && closeModal());
    document.getElementById('modal-search-input')?.addEventListener('input', () => currentModalComponentType && applyFiltersAndSort(currentModalComponentType));
    
    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => currentModalComponentType && resetFilters(currentModalComponentType));
    }

    const saveBuildButton = document.getElementById('save-build-btn');
    if (saveBuildButton) {
        saveBuildButton.addEventListener('click', () => {
            if (!Object.values(selectedParts).some(p => p && (!Array.isArray(p) || p.length > 0))) { alert('Select at least one component to save.'); return; }
            const build = {
                components: Object.fromEntries(
                    Object.entries(selectedParts).map(([key, value]) => {
                        if (Array.isArray(value)) return [key, value.map(item => { const { price, ...rest } = item; return rest; })];
                        if (value && typeof value === 'object') { const { price, ...rest } = value; return [key, rest]; }
                        return [key, value];
                    }).filter(([,v])=> v && (!Array.isArray(v) || v.length > 0))
                ),
                totalTDP: parseInt(document.getElementById('total-tdp').textContent.replace('W', '') || 0),
                date: new Date().toISOString()
            };
            try {
                const builds = JSON.parse(localStorage.getItem('savedBuilds') || '[]');
                builds.push(build);
                localStorage.setItem('savedBuilds', JSON.stringify(builds));
                alert('Build saved!');
            } catch (e) { alert('Failed to save build: ' + e.message); }
        });
    }

    calculateTotalTDP();
    // Call applyTranslations AFTER the initial UI state is set up by updateBuildDisplay calls.
    applyTranslations(currentLanguage); // This ensures all static text and initial dynamic text is translated.
    checkCompatibility(); // Call after initial translations to use translated default messages.


    window.openModal = openModal;
    window.closeModal = closeModal;
    window.removePart = removePart;
    window.handleSelectComponentClick = handleSelectComponentClick;
    window.toggleFilterPanel = toggleFilterPanel;

    console.log("App initialized. Price functionality removed. Language and theme settings applied.");
});