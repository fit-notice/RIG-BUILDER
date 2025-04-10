// --- Global State ---
const selectedParts = {
    cpu: null,
    motherboard: null,
    gpu: null,
    ram: [], // Changed to an array
    storage: [], // Changed to an array
    psu: null,
    case: null
};
const componentDataCache = {}; // Cache fetched data
let currentModalComponentType = null; // Track which modal is open
let currentModalDisplayedComponents = []; // Currently shown items in modal
const activeFilters = {}; // Store active filters per type
const currentSort = {}; // Store current sort per type

// --- Utility Functions ---
console.log("Debug log: Utilities defined"); // Keep initial logs for basic check

// --- NEW Helper Function ---
function markItemSelectedInModal(componentType, component, isSelected) {
    console.log(`[DEBUG] Marking item ${isSelected ? 'selected' : 'deselected'} in modal:`, component?.name);
    // Find the button corresponding to this component in the currently displayed modal list
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    // Find the specific button using the data attribute (more reliable than name)
    const buttons = modalBody.querySelectorAll(`button[data-component-json]`);
    buttons.forEach(button => {
        try {
            const buttonData = JSON.parse(button.dataset.componentJson);
            // Basic check: Match based on name (improve if names aren't unique)
            if (buttonData.name === component.name /* && other unique props */) {
                if (isSelected) {
                    button.textContent = 'Added ✔'; // Change text
                    button.classList.add('selected-in-modal'); // Add class for styling
                    button.disabled = true; // Disable button
                } else {
                    button.textContent = 'Select'; // Restore text
                    button.classList.remove('selected-in-modal'); // Remove class
                    button.disabled = false; // Re-enable button
                }
            }
        } catch(e) {
            console.error("[DEBUG] Error parsing button JSON during marking:", e);
        }
    });
}

function extractBrand(name) {
    if (!name) return 'Unknown';
    const nameLower = name.toLowerCase();
    // Added NVIDIA to the brand list
    const brands = ['AMD', 'Intel', 'NVIDIA', 'MSI', 'Gigabyte', 'Asus', 'ASRock', 'EVGA', 'Corsair', 'NZXT', 'Samsung', 'Kingston', 'Crucial', 'Western Digital', 'Seagate', 'G.Skill', 'Lian Li', 'be quiet!', 'Cooler Master', 'Fractal Design'];
    for (const brand of brands) {
        const brandLower = brand.toLowerCase();
        // More robust regex to catch brand names at start or surrounded by spaces/symbols
        const regex = new RegExp(`(?:^|\\s|[\\(\\)\\[\\]\\{\\}])(${brandLower})(?:$|\\s|[\\(\\)\\[\\]\\{\\}])`, 'i');
        if (regex.test(nameLower)) {
             // Prioritize specific product lines for common CPU/GPU brands
             if ((brand === 'AMD' && nameLower.includes('ryzen')) || (brand === 'Intel' && nameLower.includes('core'))) return brand;
             if ((brand === 'NVIDIA' && nameLower.includes('geforce')) || (brand === 'AMD' && nameLower.includes('radeon'))) return brand;
             return brand;
         }
    }
    // Fallback to the first word if no known brand is found
    return name.split(/[\s-]+/)[0] || 'Unknown';
}


function calculateRamSize(modules) {
    if (modules && Array.isArray(modules) && modules.length === 2 && typeof modules[0] === 'number' && typeof modules[1] === 'number') {
        return modules[0] * modules[1];
    }
    return null;
}

function getRamSpeed(speed) {
    // Assumes speed is like [channel_num, frequency] e.g., [2, 3200]
    return (speed && Array.isArray(speed) && speed.length >= 2 && typeof speed[1] === 'number') ?
        speed[1] : null;
}


function normalizeSocket(socketStr) {
     if (!socketStr) return '';
     let normalized = String(socketStr).toLowerCase().trim();
     // Remove common prefixes like LGA, AM, TR, sTRX
     normalized = normalized.replace(/^(lga|am|tr|strx)\s*/, '');
     // Remove spaces and hyphens
     normalized = normalized.replace(/[\s-]+/g, '');
     return normalized;
 }


 // Map efficiency ratings to sortable values
 const efficiencyMap = { 'bronze': 1, 'silver': 2, 'gold': 3, 'platinum': 4, 'titanium': 5 };
 function getEfficiencyValue(efficiencyStr) {
    if (!efficiencyStr) return 0;
    return efficiencyMap[efficiencyStr.toLowerCase()] || 0;
 }


// --- Modal Management & Component Display ---

function openModal(componentType) {
    console.log(`Debug log: openModal called for type: ${componentType}`);
    if (!componentType) { console.error("openModal: componentType missing"); return; }
    currentModalComponentType = componentType;

    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const filterPanelBody = document.getElementById('modal-filter-panel-body');
    const filterSortControls = document.getElementById('modal-filter-sort-controls');
    const modalContent = document.querySelector('#component-modal .modal-content');
    const searchInput = document.getElementById('modal-search-input');
    const modalElement = document.getElementById('component-modal');

    if (!modalTitle || !modalBody || !filterPanelBody || !filterSortControls || !modalContent || !searchInput || !modalElement) {
        console.error("Modal elements missing!");
        return;
    }

    modalTitle.textContent = `Select ${componentType.charAt(0).toUpperCase() + componentType.slice(1)}`;
    console.log("Debug log: Setting modal body to 'Loading...'");
    modalBody.innerHTML = '<div class="loading">Loading components...</div>'; // Display loading
    filterPanelBody.innerHTML = '<p>Filter options loading...</p>'; // Clear filters on open
    filterSortControls.innerHTML = ''; // Clear sort controls
    modalContent.classList.remove('filter-panel-open'); // Ensure filter panel is closed initially
    if(searchInput) searchInput.value = ''; // Clear search input

    activeFilters[componentType] = {}; // Clear filters for this type when opening
    currentSort[componentType] = { key: 'price', direction: 'desc', type: 'number' }; // Default sort

    modalElement.classList.add('show');
    console.log("Debug log: Calling fetchAndDisplayComponents");
    fetchAndDisplayComponents(componentType); // Start loading process
}

function closeModal() {
    console.log("Debug log: closeModal called");
    const modal = document.getElementById('component-modal');
    if (modal) modal.classList.remove('show');
    const modalContent = document.querySelector('#component-modal .modal-content');
    if (modalContent) modalContent.classList.remove('filter-panel-open'); // Ensure filter panel closes
    currentModalComponentType = null; // Reset tracker
}

function toggleFilterPanel() {
     console.log("Debug log: toggleFilterPanel called");
     const modalContent = document.querySelector('#component-modal .modal-content');
     if (modalContent) modalContent.classList.toggle('filter-panel-open');
 }

// Fetch data (from cache or API) and initiate display
function fetchAndDisplayComponents(componentType) {
    console.log(`Debug log: fetchAndDisplayComponents - Type: ${componentType}`);
    if (!componentType) return;

    const processAndDisplay = (components) => {
        console.log(`Debug log: processAndDisplay - Received ${components?.length} components for ${componentType}`);
        if (!Array.isArray(components)) {
            console.error("Invalid data format received:", components);
            throw new Error('Invalid data format: Expected an array.');
        }
        try {
            const processedComponents = components.map(comp => {
                if (!comp) return null; // Handle potential null items in array
                // Ensure price is a number, default to 0 if not
                const price = (typeof comp.price === 'number' && !isNaN(comp.price)) ? comp.price : 0;
                return {
                    ...comp,
                    price: price, // Use the sanitized price
                    brand: comp.brand || extractBrand(comp.name),
                    calculatedRamSize: componentType === 'ram' ? calculateRamSize(comp.modules) : null,
                    ramSpeedValue: componentType === 'ram' ? getRamSpeed(comp.speed) : null,
                    normalizedSocket: (componentType === 'cpu' || componentType === 'motherboard') ? normalizeSocket(comp.socket) : null,
                    // Explicitly check for non-null/non-empty graphics string for iGPU
                    has_igpu: componentType === 'cpu' ? (comp.graphics !== null && comp.graphics !== undefined && String(comp.graphics).trim() !== "") : null,
                    // Add storage capacity in GB for consistent filtering/sorting
                    storageCapacityGB: componentType === 'storage' ? (Number(comp.capacity) || 0) : null,
                    efficiencyValue: componentType === 'psu' ? getEfficiencyValue(comp.efficiency) : null
                }
            }).filter(comp => comp !== null); // Remove any null components resulting from errors

            console.log("Debug log: Component processing successful");
            componentDataCache[componentType] = processedComponents;
            prepareModalControls(componentType, processedComponents); // Setup controls
            applyFiltersAndSort(componentType); // Apply default sort/filter
        } catch (error) {
            console.error(`Error processing components for ${componentType}:`, error);
            const modalBody = document.getElementById('modal-body');
            if (modalBody) modalBody.innerHTML = `<p class="error">Error processing component data: ${error.message}</p>`;
        }
    };

    if (componentDataCache[componentType]) {
        console.log(`Debug log: Using cached data for ${componentType}`);
        try {
            processAndDisplay(componentDataCache[componentType]);
        } catch (error) {
             console.error(`Error processing cached components for ${componentType}:`, error);
             const modalBody = document.getElementById('modal-body');
             if (modalBody) modalBody.innerHTML = `<p class="error">Error processing cached data: ${error.message}</p>`;
        }
    } else {
        console.log(`Debug log: Fetching data for ${componentType} from API`);
        fetch(`/api/components/${componentType}`)
            .then(response => {
                console.log(`Debug log: Fetch response status for ${componentType}: ${response.status}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status} ${response.statusText || ''}`);
                }
                // Check content type before parsing
                 const contentType = response.headers.get("content-type");
                 if (contentType && contentType.indexOf("application/json") !== -1) {
                    return response.json();
                 } else {
                    throw new Error(`Received non-JSON response for ${componentType}`);
                 }
             })
            .then(processAndDisplay) // Process and display fetched data
            .catch(error => {
                console.error(`Error fetching or processing ${componentType}:`, error);
                const modalBody = document.getElementById('modal-body');
                 // Display the specific error caught
                 if(modalBody) modalBody.innerHTML = `<p class="error">Error loading ${componentType}: ${error.message || 'Unknown error'}</p>`;
            });
    }
}


function prepareModalControls(componentType, components) {
    console.log(`Debug log: prepareModalControls - Type: ${componentType}`);
    const filterSortControls = document.getElementById('modal-filter-sort-controls');
    const filterPanelBody = document.getElementById('modal-filter-panel-body');
    if (!filterSortControls || !filterPanelBody) { console.error("Filter/Sort elements missing"); return;}
    filterSortControls.innerHTML = ''; // Clear existing
    filterPanelBody.innerHTML = ''; // Clear existing

    // --- Sort Options ---
    const sortSelect = document.createElement('select');
    sortSelect.id = 'modal-sort-select';
    sortSelect.classList.add('toolbar-select');
    sortSelect.setAttribute('aria-label', 'Sort by');
    // Base sort options
    let sortOptions = [
        { key: 'price', label: 'Price: High to Low', direction: 'desc', type: 'number' },
        { key: 'price', label: 'Price: Low to High', direction: 'asc', type: 'number' },
        { key: 'name', label: 'Name: A to Z', direction: 'asc', type: 'string' },
        { key: 'name', label: 'Name: Z to A', direction: 'desc', type: 'string' }
    ];
    // Add type-specific sort options...
     if (componentType === 'gpu') {
         sortOptions.push(
             { key: 'memory', label: 'VRAM (High to Low)', direction: 'desc', type: 'number' },
             { key: 'boost_clock', label: 'Boost Clock (High to Low)', direction: 'desc', type: 'number' },
             { key: 'core_clock', label: 'Core Clock (High to Low)', direction: 'desc', type: 'number' }
         );
     }
     else if (componentType === 'cpu') {
         sortOptions.push(
             { key: 'core_count', label: 'Core Count (High to Low)', direction: 'desc', type: 'number' },
             { key: 'boost_clock', label: 'Boost Clock (High to Low)', direction: 'desc', type: 'number' },
             { key: 'core_clock', label: 'Core Clock (High to Low)', direction: 'desc', type: 'number' }
         );
     }
     else if (componentType === 'ram') {
         sortOptions.push(
             { key: 'ramSpeedValue', label: 'Speed (MHz, High to Low)', direction: 'desc', type: 'number' },
             { key: 'calculatedRamSize', label: 'Size (GB, High to Low)', direction: 'desc', type: 'number' },
             { key: 'cas_latency', label: 'CAS Latency (Low to High)', direction: 'asc', type: 'number' }
         );
     }
     else if (componentType === 'storage') {
         sortOptions.push(
             { key: 'storageCapacityGB', label: 'Size (GB, High to Low)', direction: 'desc', type: 'number' },
             { key: 'price_per_gb', label: 'Price/GB (Low to High)', direction: 'asc', type: 'number' }
         );
     }
     else if (componentType === 'psu') {
         sortOptions.push(
             { key: 'wattage', label: 'Wattage (High to Low)', direction: 'desc', type: 'number' },
             { key: 'efficiencyValue', label: 'Efficiency (Best First)', direction: 'desc', type: 'number' },
             { key: 'efficiencyValue', label: 'Efficiency (Worst First)', direction: 'asc', type: 'number' }
         );
     }

    // Setup sort select options
    currentSort[componentType] = currentSort[componentType] || { key: 'price', direction: 'desc', type: 'number' }; // Ensure default
    const currentSortForType = currentSort[componentType];
    sortOptions.forEach(opt => {
        const option = document.createElement('option');
        option.value = `${opt.key}|${opt.direction}|${opt.type}`;
        option.textContent = opt.label;
        if (currentSortForType.key === opt.key && currentSortForType.direction === opt.direction) {
            option.selected = true;
        }
        sortSelect.appendChild(option);
    });
    sortSelect.addEventListener('change', (e) => {
        const [key, direction, type] = e.target.value.split('|');
        currentSort[componentType] = { key, direction, type };
        applyFiltersAndSort(componentType);
    });

    // --- Filter Button ---
    const filterButton = document.createElement('button');
    filterButton.id = 'modal-filter-btn';
    filterButton.classList.add('toolbar-button');
    filterButton.innerHTML = '<i class="fas fa-filter"></i> Filters';
    filterButton.setAttribute('aria-label', 'Toggle Filters');
    filterButton.onclick = toggleFilterPanel;

    // Add controls to the toolbar
    filterSortControls.appendChild(filterButton);
    filterSortControls.appendChild(sortSelect);

    // --- Filter Panel Generation ---
    console.log("Debug log: Generating filter groups...");
    let filtersAdded = false;
    try {
        // Add Brand filter universally if available
        filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'brand', 'Brand') || filtersAdded;

        // Type-specific filters
        if (componentType === 'gpu') {
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'memory', 'VRAM (GB)') || filtersAdded;
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'pcie_type', 'PCIe Type') || filtersAdded;
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'color', 'Color') || filtersAdded;
        }
        else if (componentType === 'cpu') {
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'socket', 'Socket') || filtersAdded; // Use original socket string for filter display
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'core_count', 'Core Count') || filtersAdded;
            filtersAdded = generateBooleanFilterGroup(componentType, components, filterPanelBody, 'has_igpu', 'Integrated Graphics') || filtersAdded;
        }
        else if (componentType === 'motherboard') {
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'socket', 'Socket') || filtersAdded; // Use original socket string
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'form_factor', 'Form Factor') || filtersAdded;
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'memory_slots', 'Memory Slots') || filtersAdded;
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'supported_ddr', 'Supported DDR') || filtersAdded;
             filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'pcie_type', 'PCIe Type') || filtersAdded;
             filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'm2_slots', 'M.2 Slots') || filtersAdded;
        }
        else if (componentType === 'ram') {
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'ddr_version', 'DDR Type') || filtersAdded;
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'calculatedRamSize', 'Total Size (GB)') || filtersAdded;
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'ramSpeedValue', 'Speed (MHz)') || filtersAdded;
        }
        else if (componentType === 'storage') {
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'type', 'Type (SSD/HDD)') || filtersAdded;
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'storageCapacityGB', 'Capacity (GB)') || filtersAdded;
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'interface', 'Interface') || filtersAdded;
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'form_factor', 'Form Factor') || filtersAdded;
        }
        else if (componentType === 'psu') {
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'wattage', 'Wattage') || filtersAdded;
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'efficiency', 'Efficiency Rating') || filtersAdded;
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'modular', 'Modularity') || filtersAdded;
            filtersAdded = generateFilterGroup(componentType, components, filterPanelBody, 'type', 'Form Factor (Type)') || filtersAdded;
        }
        // Add Case filters later if needed...

        console.log(`Debug log: Filter generation complete. Filters added: ${filtersAdded}`);
        if (!filtersAdded && filterPanelBody.innerHTML === '') { // Check if still empty
            filterPanelBody.innerHTML = '<p>No filters available for this component type.</p>';
        }
    } catch (error) {
        console.error("Error during filter generation:", error);
        filterPanelBody.innerHTML = '<p class="error">Error generating filters.</p>';
    }
}

// Helper to generate standard checkbox filter group
function generateFilterGroup(componentType, components, parentElement, filterKey, filterLabel) {
    try {
        const values = components.map(c => {
             if (!c) return null; // Skip null components
             // Use calculated/processed values where appropriate for consistency
             if (filterKey === 'calculatedRamSize') return c.calculatedRamSize;
             if (filterKey === 'storageCapacityGB') return c.storageCapacityGB;
             if (filterKey === 'ramSpeedValue') return c.ramSpeedValue;
             return c[filterKey];
         });

        const valueCounts = values.reduce((acc, val) => {
             if (val !== null && val !== undefined && val !== "") {
                 const valStr = String(val);
                 acc[valStr] = (acc[valStr] || 0) + 1;
             }
             return acc;
         }, {});

         const uniqueValues = Object.keys(valueCounts).sort((a, b) => {
             const numA = parseFloat(a);
             const numB = parseFloat(b);
             if (!isNaN(numA) && !isNaN(numB)) return numA - numB; // Numeric sort
             return String(a).toLowerCase().localeCompare(String(b).toLowerCase()); // String sort
         });


        if (uniqueValues.length > 1) { // Only show filter if there's more than one option
            const groupDiv = document.createElement('div');
            groupDiv.classList.add('filter-group');
            const label = document.createElement('label');
            label.classList.add('filter-group-label');
            label.textContent = filterLabel;
            groupDiv.appendChild(label);

            uniqueValues.forEach(value => {
                const safeValueId = String(value).replace(/[^a-zA-Z0-9_-]/g, '-'); // Allow underscores and hyphens
                const checkboxId = `filter-${componentType}-${filterKey}-${safeValueId}`;
                const wrapper = document.createElement('div');
                wrapper.classList.add('filter-option');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = checkboxId;
                checkbox.value = value;
                checkbox.dataset.filterKey = filterKey; // Store the original key
                // Check against active filters for this type and key
                if (activeFilters[componentType]?.[filterKey]?.has(String(value))) {
                    checkbox.checked = true;
                }
                checkbox.addEventListener('change', () => {
                    updateActiveFilters(componentType);
                    applyFiltersAndSort(componentType);
                });

                const checkboxLabel = document.createElement('label');
                checkboxLabel.htmlFor = checkboxId;
                checkboxLabel.textContent = `${value} (${valueCounts[value]})`; // Show count

                wrapper.appendChild(checkbox);
                wrapper.appendChild(checkboxLabel);
                groupDiv.appendChild(wrapper);
            });
            parentElement.appendChild(groupDiv);
            return true; // Filters were added
        }
        return false; // No filters added (only one or zero options)
    } catch (error) {
        console.error(`Error generating filter group for ${filterKey}:`, error);
        return false;
    }
}

// Helper to generate boolean (Yes/No) filter group
function generateBooleanFilterGroup(componentType, components, parentElement, filterKey, filterLabel) {
    try {
        const hasTrue = components.some(c => c && c[filterKey] === true);
        const hasFalse = components.some(c => c && c[filterKey] === false);

        if (hasTrue || hasFalse) { // Show even if only one option exists (e.g., all have iGPU)
            const groupDiv = document.createElement('div');
            groupDiv.classList.add('filter-group');
            const label = document.createElement('label');
            label.classList.add('filter-group-label');
            label.textContent = filterLabel;
            groupDiv.appendChild(label);

            const options = [];
            if (hasTrue) options.push({label: 'Yes', value: 'true'});
            if (hasFalse) options.push({label: 'No', value: 'false'});

            options.forEach(opt => {
                const checkboxId = `filter-${componentType}-${filterKey}-${opt.value}`;
                const wrapper = document.createElement('div');
                wrapper.classList.add('filter-option');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = checkboxId;
                checkbox.value = opt.value; // Store 'true' or 'false' as string
                checkbox.dataset.filterKey = filterKey;
                if (activeFilters[componentType]?.[filterKey]?.has(opt.value)) {
                    checkbox.checked = true;
                }
                checkbox.addEventListener('change', () => {
                    updateActiveFilters(componentType);
                    applyFiltersAndSort(componentType);
                });

                const checkboxLabel = document.createElement('label');
                checkboxLabel.htmlFor = checkboxId;
                 // Show count for boolean options too
                 const count = components.filter(c => c && String(c[filterKey]) === opt.value).length;
                 checkboxLabel.textContent = `${opt.label} (${count})`;

                wrapper.appendChild(checkbox);
                wrapper.appendChild(checkboxLabel);
                groupDiv.appendChild(wrapper);
            });
            parentElement.appendChild(groupDiv);
            return true;
        }
        return false; // Neither true nor false found
    } catch (error) {
        console.error(`Error generating boolean filter group for ${filterKey}:`, error);
        return false;
    }
}


// Update active filters based on checkbox state
function updateActiveFilters(componentType) {
    console.log(`Debug log: updateActiveFilters - Type: ${componentType}`);
    if (!componentType) return;
    activeFilters[componentType] = {}; // Reset filters for this type
    const filterPanelBody = document.getElementById('modal-filter-panel-body');
    if (!filterPanelBody) { console.error("Filter panel body not found for update"); return; }

    filterPanelBody.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        const key = checkbox.dataset.filterKey;
        const value = checkbox.value;
        if (!key) return; // Skip if key is missing
        if (!activeFilters[componentType][key]) {
            activeFilters[componentType][key] = new Set(); // Initialize Set if needed
        }
        activeFilters[componentType][key].add(String(value)); // Add value as string
    });
    console.log("Updated active filters:", JSON.stringify(Object.fromEntries(Object.entries(activeFilters[componentType]).map(([k, v]) => [k, Array.from(v)]))));
}

// --- Reset Filters ---
function resetFilters(componentType) {
    console.log(`Debug log: resetFilters - Type: ${componentType}`);
    if (!componentType) return;
    activeFilters[componentType] = {}; // Clear active filter state

    const filterPanelBody = document.getElementById('modal-filter-panel-body');
    if(filterPanelBody) {
        filterPanelBody.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false; // Uncheck all boxes visually
        });
    }
    applyFiltersAndSort(componentType); // Re-apply (now empty) filters and default sort
}

// Apply current filters and sorting
// **CORRECTED** - applyFiltersAndSort function with safer search checks
function applyFiltersAndSort(componentType) {
    console.log(`Debug log: applyFiltersAndSort - Type: ${componentType}`);
    if (!componentType || !componentDataCache[componentType]) {
        console.warn("applyFiltersAndSort: Missing data/type for", componentType);
        const modalBody = document.getElementById('modal-body');
        if(modalBody) modalBody.innerHTML = '<p class="no-components">Could not load component data.</p>';
        return;
    }

    const allComponents = componentDataCache[componentType];
    const filters = activeFilters[componentType] || {};
    const sort = currentSort[componentType] || { key: 'price', direction: 'desc', type: 'number' }; // Default sort
    const searchInput = document.getElementById('modal-search-input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    console.log(`Debug log: Filtering with term "${searchTerm}" and filters:`, JSON.stringify(Object.fromEntries(Object.entries(filters).map(([k, v]) => [k, Array.from(v)]))));

    let filteredComponents = [];
    try {
        // 1. Filter
        filteredComponents = allComponents.filter(comp => {
             if (!comp) return false; // Skip if component data is somehow null/undefined

             // Search term check - check against name and other relevant fields
             let searchMatch = false;
             if (searchTerm) {
                 const nameMatch = typeof comp.name === 'string' && comp.name.toLowerCase().includes(searchTerm); // Safe name check
                 let otherMatch = false;

                 // Add type-specific fields to search (with type checks)
                 if (componentType === 'gpu' && typeof comp.chipset === 'string' && comp.chipset.toLowerCase().includes(searchTerm)) otherMatch = true;
                 if (componentType === 'cpu' && typeof comp.socket === 'string' && comp.socket.toLowerCase().includes(searchTerm)) otherMatch = true; // Example: search CPU socket
                 if (componentType === 'motherboard' && typeof comp.chipset === 'string' && comp.chipset.toLowerCase().includes(searchTerm)) otherMatch = true;

                 // **FIXED:** Safely check storage type and interface
                 if (componentType === 'storage') {
                     const interfaceMatch = typeof comp.interface === 'string' && comp.interface.toLowerCase().includes(searchTerm);
                     const typeMatch = typeof comp.type === 'string' && comp.type.toLowerCase().includes(searchTerm); // Check type is string first
                     if (interfaceMatch || typeMatch) otherMatch = true;
                 }
                 // **FIXED:** Safely check PSU type, efficiency, and modularity
                  if (componentType === 'psu') {
                      const efficiencyMatch = typeof comp.efficiency === 'string' && comp.efficiency.toLowerCase().includes(searchTerm);
                      const modularMatch = typeof comp.modular === 'string' && comp.modular.toLowerCase().includes(searchTerm);
                      const typeMatch = typeof comp.type === 'string' && comp.type.toLowerCase().includes(searchTerm); // Check type is string first
                      if (efficiencyMatch || modularMatch || typeMatch) otherMatch = true;
                  }
                  // Add case search checks if needed
                   if (componentType === 'case') {
                       const typeMatch = typeof comp.type === 'string' && comp.type.toLowerCase().includes(searchTerm);
                       const colorMatch = typeof comp.color === 'string' && comp.color.toLowerCase().includes(searchTerm);
                       if (typeMatch || colorMatch) otherMatch = true;
                   }


                 searchMatch = nameMatch || otherMatch;
                 if (!searchMatch) return false; // If search term exists and no match, filter out
             } else {
                 searchMatch = true; // No search term, so consider it a match for search purposes
             }

             // If it didn't match the search term, no need to check filters
             if (!searchMatch) return false;

            // Checkbox filters (this part should be okay as it converts to string)
            for (const key in filters) {
                const allowedValuesSet = filters[key]; // This is a Set
                if (allowedValuesSet && allowedValuesSet.size > 0) {
                    let compValue;
                    // Get the correct value from the component, using processed values where needed
                    if (key === 'has_igpu') compValue = String(comp.has_igpu); // Compare as string 'true'/'false'
                    else if (key === 'calculatedRamSize') compValue = String(comp.calculatedRamSize);
                    else if (key === 'storageCapacityGB') compValue = String(comp.storageCapacityGB);
                    else if (key === 'ramSpeedValue') compValue = String(comp.ramSpeedValue);
                    else compValue = comp[key] !== undefined && comp[key] !== null ? String(comp[key]) : ''; // Get original value as string

                    if (!allowedValuesSet.has(compValue)) {
                         return false; // Component value not in the allowed set for this filter key
                     }
                }
            }
            return true; // Passed search and all active filters
        });
        console.log(`Debug log: Found ${filteredComponents.length} components after filtering`);

        // 2. Sort (Sorting logic remains the same)
        filteredComponents.sort((a, b) => {
             const sortKey = sort.key || 'price';
             const sortDir = sort.direction || 'desc';
             const sortType = sort.type || 'number';

             let valA = a ? a[sortKey] : null;
             let valB = b ? b[sortKey] : null;

             // Use calculated values for sorting where applicable
              if (sortKey === 'calculatedRamSize') { valA = a?.calculatedRamSize; valB = b?.calculatedRamSize; }
              if (sortKey === 'ramSpeedValue') { valA = a?.ramSpeedValue; valB = b?.ramSpeedValue; }
              if (sortKey === 'storageCapacityGB') { valA = a?.storageCapacityGB; valB = b?.storageCapacityGB; }
              if (sortKey === 'efficiencyValue') { valA = a?.efficiencyValue; valB = b?.efficiencyValue; }

             const aIsNull = valA === null || valA === undefined || valA === '';
             const bIsNull = valB === null || valB === undefined || valB === '';

             if (aIsNull && bIsNull) return 0;
             if (aIsNull) return 1; // Nulls/empty go last
             if (bIsNull) return -1; // Nulls/empty go last

             let comparison = 0;
             if (sortType === 'number') {
                 const numA = parseFloat(valA);
                 const numB = parseFloat(valB);
                 if (!isNaN(numA) && !isNaN(numB)) {
                     comparison = numA - numB;
                 } else { // Fallback to string compare if not numbers
                      comparison = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
                 }
             } else { // String comparison
                 comparison = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
             }
             return sortDir === 'asc' ? comparison : comparison * -1; // Apply direction
         });
        console.log("Debug log: Sorting complete");

    } catch (error) {
        console.error(`Error during filtering/sorting for ${componentType}:`, error); // Add componentType to error log
        const modalBody = document.getElementById('modal-body');
        // Display a more informative error message in the modal
        if (modalBody) modalBody.innerHTML = `<p class="error">Error applying filters/sort: ${error.message}. Check console for details.</p>`;
        return; // Stop processing if an error occurs
    }

    currentModalDisplayedComponents = filteredComponents; // Store the filtered/sorted list
    displayComponentsInModal(filteredComponents, componentType); // Update UI table
}


// **CORRECTED** - displayComponentsInModal (Removed invalid comment)
function displayComponentsInModal(components, componentType) {
    console.log(`[DEBUG] displayComponentsInModal - Type: ${componentType}, Count: ${components?.length}`);
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) { console.error("Modal body not found"); return };

    if (!components) { modalBody.innerHTML = '<p class="no-components">No data to display.</p>'; return; }
    if (components.length === 0) { modalBody.innerHTML = '<p class="no-components">No components match filters/search.</p>'; return; }
    if (!componentType) { modalBody.innerHTML = '<p class="error">Error: Component type missing for display.</p>'; return; }

    let tableHTML = `<table class="component-table"><thead><tr><th>Name</th><th>Specs/Tags</th><th>Price</th><th>Actions</th></tr></thead><tbody>`;
    try {
        const currentSelections = (componentType === 'ram' || componentType === 'storage')
            ? selectedParts[componentType]
            : [];
         const selectedItemsMap = new Map();
         currentSelections.forEach(item => {
             if(item && typeof item.name === 'string' && item._uniqueId) {
                 selectedItemsMap.set(item.name, item);
             } else {
                  console.warn("[DEBUG] Skipping item in currentSelections for map creation (missing name or _uniqueId):", item);
             }
         });
         console.log(`[DEBUG] Items map for modal display ${componentType}:`, selectedItemsMap);

        components.forEach(component => {
            if (!component || typeof component.name !== 'string' || typeof component.price !== 'number') {
                 console.warn("[DEBUG] Skipping invalid component data in displayComponentsInModal loop:", component);
                 return;
            }

            // --- Generate Tags HTML ---
            let tagsHTML = '';
             if (componentType === 'cpu') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-socket">Socket ${component.socket || '?'}</span> <span class="tag tag-cores">${component.core_count || '?'} Cores</span> <span class="tag tag-speed">${component.core_clock || '?'} GHz</span>` + (component.boost_clock ? ` <span class="tag tag-boost">${component.boost_clock} GHz Boost</span>` : '') + ` <span class="tag tag-tdp">${component.tdp || '?'}W TDP</span>` + (component.has_igpu ? ` <span class="tag tag-igpu">iGPU: ${component.graphics || 'Yes'}</span>` : ''); }
             else if (componentType === 'motherboard') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-socket">Socket ${component.socket || '?'}</span> <span class="tag tag-form">${component.form_factor || '?'}</span> <span class="tag tag-ddr">${component.supported_ddr || '?'} (${component.memory_slots || '?'} slots)</span> <span class="tag tag-pcie">PCIe ${component.pcie_type || '?'}</span> <span class="tag tag-m2">${component.m2_slots || '0'} M.2</span>`; }
             else if (componentType === 'gpu') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-chipset">${component.chipset || '?'}</span> <span class="tag tag-memory">${component.memory || '?'} GB</span> <span class="tag tag-pcie">${component.pcie_type || '?'}</span> <span class="tag tag-speed">Core: ${component.core_clock || '?'} MHz</span>` + (component.boost_clock ? ` <span class="tag tag-boost">Boost: ${component.boost_clock} MHz</span>` : '') + (component.length ? ` <span class="tag tag-length">${component.length}mm Length</span>` : ''); }
             else if (componentType === 'ram') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-size">${component.calculatedRamSize ?? '?'} GB (${component.modules?.[0] || '?'}x${component.modules?.[1] || '?'}GB)</span> <span class="tag tag-ddr">${component.ddr_version || '?'}</span> <span class="tag tag-speed">${component.ramSpeedValue ?? '?'} MHz</span>` + (component.cas_latency ? ` <span class="tag tag-cas">CL${component.cas_latency}</span>` : ''); }
             else if (componentType === 'storage') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-size">${component.storageCapacityGB ?? '?'} GB</span> <span class="tag tag-type">${component.type || '?'}</span> <span class="tag tag-interface">${component.interface || '?'}</span> <span class="tag tag-form">${component.form_factor || '?'}</span>` + (component.cache ? ` <span class="tag tag-cache">${component.cache}MB Cache</span>` : ''); }
             else if (componentType === 'psu') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-wattage">${component.wattage || '?'}W</span> <span class="tag tag-efficiency">${component.efficiency || '?'} Rated</span> <span class="tag tag-modular">${component.modular || '?'} Modular</span> <span class="tag tag-form">${component.type || '?'}</span>`; }
             else if (componentType === 'case') { tagsHTML += `<span class="tag tag-brand">${component.brand || '?'}</span> <span class="tag tag-type">${component.type || '?'}</span> <span class="tag tag-color">Color: ${component.color || '?'}</span>` + (component.max_gpu_length ? ` <span class="tag tag-gpu-len">Max GPU: ${component.max_gpu_length}mm</span>` : ''); }
            // --- End Tag Generation ---

            let componentJsonString;
            let currentUniqueId = null;

            try {
                const selectedItemData = selectedItemsMap.get(component.name);
                if (selectedItemData) {
                     component._uniqueId = selectedItemData._uniqueId;
                     currentUniqueId = selectedItemData._uniqueId;
                } else {
                     delete component._uniqueId;
                }
                 componentJsonString = JSON.stringify(component).replace(/"/g, '&quot;').replace(/'/g, '&apos;');
            } catch (e) {
                console.error("[DEBUG] Stringify failed for component in displayComponentsInModal:", component, e);
                componentJsonString = '{}';
            }

            const nameDisplay = componentType === 'gpu' && component.chipset ? `${component.name} (${component.chipset})` : component.name;
            const isAlreadySelected = !!currentUniqueId;

            // Generate Action Cell HTML
            let actionCellHTML = '';
            if (isAlreadySelected && (componentType === 'ram' || componentType === 'storage')) {
                 const idToRemove = currentUniqueId;
                 if (idToRemove) {
                     actionCellHTML = `
                         <div class="multi-action-cell">
                              <span class="added-indicator">Added ✔</span>
                              <button class="remove-from-modal-btn" title="Remove this item" onclick="removePart('${componentType}', '${idToRemove}')">✕</button>
                         </div>`;
                 } else {
                      actionCellHTML = `<span class="added-indicator">Added ✔ (Error: ID missing)</span>`;
                 }
            } else {
                actionCellHTML = `<button class="select-btn" onclick="handleSelectComponentClick(this, '${componentType}')" data-component-json='${componentJsonString}'>Select</button>`;
            }

            // Add the table row
            tableHTML += `
                <tr>
                    <td>${nameDisplay || 'N/A'}</td>
                    <td><div class="spec-tags">${tagsHTML || 'N/A'}</div></td>
                    <td>$${component.price.toFixed(2)}</td>
                    <td>${actionCellHTML}</td> 
                </tr>`; // <-- Invalid comment removed from this line
        }); // End components.forEach loop

        tableHTML += `</tbody></table>`;
        modalBody.innerHTML = tableHTML;

    } catch (error) {
        console.error("Error generating modal table HTML:", error);
        modalBody.innerHTML = `<p class="error">Error displaying components: ${error.message}</p>`;
    }
} // <-- End of displayComponentsInModal function


function handleSelectComponentClick(buttonElement, componentType) {
    console.log(`[DEBUG] handleSelectComponentClick called for type: ${componentType}`); // Log entry
    try {
        if (!buttonElement) {
            throw new Error("Button element is missing.");
        }
        console.log("[DEBUG] Button Element:", buttonElement); // Log the button element itself

        const componentJsonData = buttonElement.dataset.componentJson;
        if (!componentJsonData) {
            console.error("[DEBUG] Data attribute 'data-component-json' is missing or empty on the button.");
            throw new Error("Select button missing component data attribute.");
        }
        console.log("[DEBUG] Raw component JSON data from attribute:", componentJsonData); // Log raw data

        // Attempt to parse the JSON data
        console.log("[DEBUG] Attempting to parse JSON...");
        const component = JSON.parse(componentJsonData);
        console.log("[DEBUG] JSON parsed successfully:", component); // Log parsed object

        if (!component || typeof component !== 'object') {
            console.error("[DEBUG] Parsed data is not a valid object:", component);
            throw new Error("Invalid component data format after parsing.");
        }

        // If parsing is successful, call selectComponent
        console.log(`[DEBUG] Calling selectComponent for ${componentType}...`);
        selectComponent(componentType, component);
        console.log(`[DEBUG] Returned from selectComponent for ${componentType}.`); // Log successful return

    } catch (e) {
        // Log the error with more detail, hoping it shows up this time
        console.error(`[DEBUG] --- ERROR in handleSelectComponentClick for ${componentType} ---`);
        console.error("[DEBUG] Error message:", e.message);
        console.error("[DEBUG] Error stack:", e.stack); // Log the stack trace if available
        console.error("[DEBUG] Button element that caused error:", buttonElement); // Log the element again
        // Show the alert as before
        alert(`An error occurred while selecting the component. Type: ${componentType}. Please check the browser's developer console for more details (look for '[DEBUG]' messages).`);
    }
}


// **MODIFIED** - updateBuildDisplay to add functional remove buttons for array items
function updateBuildDisplay(componentType, data) {
    if (!selectedParts.hasOwnProperty(componentType)) return;

    const slotElement = document.getElementById(`build-slot-${componentType}`);
    const detailsContainer = slotElement?.querySelector('.build-slot-details');

    if (!slotElement || !detailsContainer) { /* ... warn if elements missing ... */ return; }

    detailsContainer.innerHTML = ''; // Clear previous content
    const isMulti = Array.isArray(data);
    const items = isMulti ? data : (data ? [data] : []); // Ensure items is array

    // --- Generate HTML ---
    const typeLabel = document.createElement('div');
    typeLabel.className = 'build-slot-type';
    let labelText = componentType.charAt(0).toUpperCase() + componentType.slice(1);
    if ((componentType === 'ram' || componentType === 'storage') && items.length !== 1) { labelText += 's'; }
    typeLabel.textContent = labelText;
    detailsContainer.appendChild(typeLabel);

    if (items.length > 0) {
        slotElement.classList.add('filled');
        const itemListContainer = document.createElement('div');
        itemListContainer.className = 'multi-item-list';

        items.forEach((component, index) => {
            if (!component || !component._uniqueId) return; // Need component and ID

            const itemDiv = document.createElement('div');
            itemDiv.className = 'build-item-entry';
            // Store uniqueId on the div for easier access if needed later
            itemDiv.dataset.itemId = component._uniqueId;

            // Name
            const nameElement = document.createElement('div');
            nameElement.className = 'build-item-name';
            nameElement.textContent = component.name || 'Unknown Component';
            itemDiv.appendChild(nameElement);

            // Tags
            const tagsElement = document.createElement('div');
            tagsElement.className = 'build-item-tags';
            let tagsHTML = '';
            // ... (Keep your concise tag generation logic here) ...
             if (componentType === 'ram') { tagsHTML += `<span class="tag">${component.calculatedRamSize ?? '?'}GB</span> ...`; }
             else if (componentType === 'storage') { tagsHTML += `<span class="tag">${component.storageCapacityGB ?? '?'}GB</span> ...`; }
             else { /* ... tags for single items ... */ }
            tagsElement.innerHTML = tagsHTML;
            if(tagsHTML) itemDiv.appendChild(tagsElement);

            // Price
            const priceElement = document.createElement('div');
            priceElement.className = 'build-item-price';
            priceElement.textContent = `$${(typeof component.price === 'number' && !isNaN(component.price)) ? component.price.toFixed(2) : '0.00'}`;
            itemDiv.appendChild(priceElement);

            // **NEW: Functional Remove Button**
             if (isMulti) {
                 const removeBtn = document.createElement('button');
                 removeBtn.className = 'remove-item-btn'; // Class for styling
                 removeBtn.innerHTML = '<i class="fas fa-times"></i>'; // Use 'x' icon
                 removeBtn.title = `Remove ${component.name}`;
                 // Add onclick handler to call removePart with the unique ID
                 removeBtn.onclick = () => removePart(componentType, component._uniqueId);
                 itemDiv.appendChild(removeBtn);
             }

            // Add the item entry to the list or directly to details
            if (isMulti) {
                itemListContainer.appendChild(itemDiv);
            } else {
                detailsContainer.appendChild(nameElement);
                if(tagsHTML) detailsContainer.appendChild(tagsElement);
                detailsContainer.appendChild(priceElement);
                 // No remove button needed for single-select items here
            }
        });

        if (isMulti) { detailsContainer.appendChild(itemListContainer); }

    } else { // Handle Empty State
        slotElement.classList.remove('filled');
        const emptyText = document.createElement('div');
        emptyText.className = 'build-slot-name';
        emptyText.innerHTML = `<span class="placeholder">Empty</span>`;
        detailsContainer.appendChild(emptyText);
        const emptyPrice = document.createElement('div');
        emptyPrice.className = 'build-slot-price';
        emptyPrice.textContent = '$0.00';
        emptyPrice.style.opacity = '0.5';
        detailsContainer.appendChild(emptyPrice);
    }
}

// **MODIFIED** - selectComponent to add unique IDs for multi-select items
// **MODIFIED** - selectComponent with duplicate check and unique ID assignment
function selectComponent(componentType, component) {
    console.log(`[DEBUG] selectComponent called for type: ${componentType}`);
    console.log("[DEBUG] Component data received:", JSON.stringify(component));

    if (!selectedParts.hasOwnProperty(componentType)) {
        console.error(`[DEBUG] Invalid componentType '${componentType}' passed to selectComponent.`);
        return;
    }
    if (!component || typeof component !== 'object') {
        console.error(`[DEBUG] Invalid component data received in selectComponent:`, component);
        return;
    }

    try {
        let maxReached = false; // Flag to check if maximum parts reached

        // Handle multi-select types (RAM, Storage)
        if (componentType === 'ram' || componentType === 'storage') {
            console.log(`[DEBUG] Handling multi-select for ${componentType}`);
            const targetArray = selectedParts[componentType];

            // --- Add Checks for Limits ---
            if (componentType === 'ram') {
                const moboSlots = selectedParts.motherboard?.memory_slots || 0;
                if (moboSlots > 0 && targetArray.length >= moboSlots) {
                    alert(`Cannot add more RAM. Motherboard only has ${moboSlots} slots.`);
                    maxReached = true;
                }
            }
            if (componentType === 'storage') {
                const moboM2 = selectedParts.motherboard?.m2_slots || 0;
                const currentM2Count = targetArray.filter(item =>
                    (typeof item.interface === 'string' && item.interface.toLowerCase().includes('m.2')) ||
                    (typeof item.form_factor === 'string' && item.form_factor.toLowerCase().includes('m.2'))
                ).length;
                const isNewItemM2 = (typeof component.interface === 'string' && component.interface.toLowerCase().includes('m.2')) ||
                                   (typeof component.form_factor === 'string' && component.form_factor.toLowerCase().includes('m.2'));
                if (isNewItemM2 && moboM2 > 0 && currentM2Count >= moboM2) {
                     alert(`Cannot add more M.2 storage. Motherboard only has ${moboM2} M.2 slots.`);
                     maxReached = true;
                }
            }
            // --- End Checks ---

            // --- Prevent Duplicates Check ---
            // Check if an item with the same name is already selected
            const alreadySelected = targetArray.some(item => item.name === component.name);
            if (alreadySelected && !maxReached) {
                 // Decide if you want to allow adding identical items.
                 // For now, we alert and *don't* add another if name matches.
                 alert(`"${component.name}" is already in your build for ${componentType}. To add another identical module/drive, remove it first if needed, or manage quantities elsewhere.`);
                 // Re-ensure it's marked correctly in modal, even if not added again
                 markItemSelectedInModal(componentType, component, true);
                 return; // Stop function if duplicate name found
            }
            // --- End Duplicates Check ---


            if (!maxReached) {
                // Assign a unique ID ONLY IF it doesn't already have one (prevents re-assigning if logic changes)
                if (!component._uniqueId) {
                    component._uniqueId = `<span class="math-inline">\{componentType\}\-</span>{Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                    console.log(`[DEBUG] Assigning unique ID: ${component._uniqueId}`);
                }

                console.log(`[DEBUG] Adding component to ${componentType} array...`);
                targetArray.push(component);
                console.log(`[DEBUG] ${componentType} array updated:`, targetArray);

                updateBuildDisplay(componentType, targetArray);
                updateTotalPrice();
                checkCompatibility();
                markItemSelectedInModal(componentType, component, true); // Mark as added in modal

                 // Update main card buttons
                 const cardElement = document.getElementById(`${componentType}-card`);
                 if (cardElement) {
                     cardElement.querySelector('.add-btn')?.classList.add('hidden'); // Hide "Add/Manage"
                     cardElement.querySelector('.remove-btn')?.classList.remove('hidden'); // Show "Clear All"
                 }
            }

        } else { // Handle single-select types
            console.log(`[DEBUG] Handling single-select for ${componentType}`);
            selectedParts[componentType] = component;
            console.log(`[DEBUG] ${componentType} updated in selectedParts.`);

            // Update card display
            const selectedElement = document.getElementById(`selected-${componentType}`);
            const priceElement = document.getElementById(`${componentType}-price`);
            if (selectedElement) selectedElement.textContent = component.name;
            if (priceElement) priceElement.textContent = `$${(typeof component.price === 'number' && !isNaN(component.price)) ? component.price.toFixed(2) : '0.00'}`;

            // Toggle card buttons
            const cardElement = document.getElementById(`${componentType}-card`);
            if (cardElement) {
                cardElement.querySelector('.add-btn')?.classList.add('hidden');
                cardElement.querySelector('.remove-btn')?.classList.remove('hidden');
            }

            updateBuildDisplay(componentType, component);
            updateTotalPrice();
            checkCompatibility();
            closeModal(); // Close modal only for single-select
        }

        console.log(`[DEBUG] selectComponent finished processing for ${componentType}.`);

    } catch (e) {
        console.error(`[DEBUG] --- ERROR within selectComponent for ${componentType} ---`);
        console.error("[DEBUG] Error message:", e.message);
        console.error("[DEBUG] Error stack:", e.stack);
        console.error("[DEBUG] Component data during error:", component);
        alert(`An unexpected error occurred within selectComponent for ${componentType}. Check console.`);
    }
}

// **REWRITTEN** - removePart to handle single items and arrays (by unique ID or 'ALL')
function removePart(componentType, itemIdToRemove = null) {
    console.log(`[DEBUG] removePart called for type: ${componentType}, ID to remove: ${itemIdToRemove}`);

    if (!selectedParts.hasOwnProperty(componentType)) {
        console.error(`[DEBUG] Invalid componentType '${componentType}' passed to removePart.`);
        return;
    }

    let itemRemoved = false; // Flag to track if something was actually removed
    let removedItemData = null; // Store data of the removed item if needed (for modal update)

    // Handle multi-select types (RAM, Storage)
    if (componentType === 'ram' || componentType === 'storage') {
        const targetArray = selectedParts[componentType];
        console.log(`[DEBUG] Current ${componentType} array before removal:`, JSON.stringify(targetArray));

        if (itemIdToRemove === 'ALL') { // Clear All items
            if (targetArray.length > 0) {
                console.log(`[DEBUG] Clearing all items from ${componentType} array.`);
                selectedParts[componentType] = []; // Reset to empty array
                itemRemoved = true;
                 // We don't have a specific item data when clearing all
            }
        } else if (itemIdToRemove) { // Remove specific item by unique ID
            const itemIndex = targetArray.findIndex(item => item._uniqueId === itemIdToRemove);
            if (itemIndex !== -1) {
                console.log(`[DEBUG] Removing item with ID ${itemIdToRemove} at index ${itemIndex} from ${componentType}.`);
                removedItemData = targetArray[itemIndex]; // Get data before removing
                targetArray.splice(itemIndex, 1); // Remove the item from the array
                itemRemoved = true;
                console.log(`[DEBUG] ${componentType} array after removal:`, JSON.stringify(targetArray));
            } else {
                console.warn(`[DEBUG] Item with ID ${itemIdToRemove} not found in ${componentType} array.`);
            }
        } else {
            console.warn(`[DEBUG] No specific ID provided for removing from ${componentType}. Use 'ALL' or provide item ID.`);
        }

        // Update display for the array type
        if (itemRemoved) {
            updateBuildDisplay(componentType, selectedParts[componentType]); // Update display with the modified array

            // Update main card buttons if array is now empty after removal
             if (selectedParts[componentType].length === 0) {
                 const cardElement = document.getElementById(`${componentType}-card`);
                 if (cardElement) {
                     cardElement.querySelector('.add-btn')?.classList.remove('hidden'); // Show "Add/Manage"
                     cardElement.querySelector('.remove-btn')?.classList.add('hidden'); // Hide "Clear All"
                     // Also reset card name/price
                     const selectedElement = document.getElementById(`selected-${componentType}`);
                     const priceElement = document.getElementById(`${componentType}-price`);
                     if (selectedElement) selectedElement.innerHTML = `<span class="placeholder">Choose ${componentType.charAt(0).toUpperCase() + componentType.slice(1)}</span>`;
                     if (priceElement) priceElement.textContent = '$0.00';
                 }
             }
        }

        // If a specific item was removed, update its state in the modal
        if (removedItemData) {
             markItemSelectedInModal(componentType, removedItemData, false); // Mark as deselected
        } else if (itemIdToRemove === 'ALL') {
            // If 'Clear All' was used, potentially loop through all items that WERE in the array
            // and call markItemSelectedInModal(type, item, false) for each.
            // This requires storing the state before clearing or re-querying the modal.
            // For simplicity now, clearing all won't update individual modal buttons.
             console.log("[DEBUG] 'Clear All' used, modal buttons for individual items not updated automatically.");
             // Force modal refresh if open for this type? Could be disruptive.
             // if(currentModalComponentType === componentType) fetchAndDisplayComponents(componentType);
        }


    } else { // Handle single-select types (CPU, Mobo, GPU, PSU, Case)
        if (selectedParts[componentType] !== null) {
             console.log(`[DEBUG] Removing single item for ${componentType}.`);
             removedItemData = selectedParts[componentType]; // Store data before removing
             selectedParts[componentType] = null; // Clear from global state
             itemRemoved = true;

             // Reset the main component card display
             const selectedElement = document.getElementById(`selected-${componentType}`);
             const priceElement = document.getElementById(`${componentType}-price`);
             const typeCapitalized = componentType.charAt(0).toUpperCase() + componentType.slice(1);
             if (selectedElement) selectedElement.innerHTML = `<span class="placeholder">Choose a ${typeCapitalized}</span>`;
             if (priceElement) priceElement.textContent = '$0.00';

             // Toggle Add/Remove buttons on the card
             const cardElement = document.getElementById(`${componentType}-card`);
             if (cardElement) {
                 cardElement.querySelector('.add-btn')?.classList.remove('hidden');
                 cardElement.querySelector('.remove-btn')?.classList.add('hidden');
                 // Reset any PSU card warnings if PSU is removed
                 if (componentType === 'psu') {
                     cardElement.classList.remove('psu-capacity-warning', 'psu-capacity-error');
                 }
             }
             updateBuildDisplay(componentType, null); // Update the top build display grid
        } else {
             console.log(`[DEBUG] No single item to remove for ${componentType}.`);
        }
    }

    // If any item was removed (single or multi), update totals and compatibility
    if (itemRemoved) {
        console.log("[DEBUG] Item removed, updating total price and compatibility...");
        updateTotalPrice();
        checkCompatibility();
    }

    console.log(`[DEBUG] removePart finished for type: ${componentType}.`);
}


// --- Price, TDP, Compatibility ---

function updateTotalPrice() {
    let totalPrice = 0;
    for (const type in selectedParts) {
        // Ensure the part exists and price is a valid number
        if (selectedParts[type]?.price && typeof selectedParts[type].price === 'number' && !isNaN(selectedParts[type].price)) {
            totalPrice += selectedParts[type].price;
        }
    }
    const totalPriceElement = document.getElementById('total-price');
    if (totalPriceElement) totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
}


function calculateTotalTDP() {
    let totalTDP = 0;
    // Use TDP from selected parts, default to 0 if not present or invalid
    const cpuTDP = Number(selectedParts.cpu?.tdp) || 0;
    const gpuTDP = Number(selectedParts.gpu?.tdp) || 0; // GPUs sometimes list TDP, sometimes not. Assume 0 if missing.

    totalTDP = cpuTDP + gpuTDP;

    // Add a baseline wattage for other components if CPU or GPU is selected
    if (cpuTDP > 0 || gpuTDP > 0) {
        totalTDP += 50; // Estimate for Mobo, RAM, SSD, Fans etc.
    }

    const totalTDPElement = document.getElementById('total-tdp');
    if(totalTDPElement) totalTDPElement.textContent = `${totalTDP}W`;
    return totalTDP;
}


// **MODIFIED** - checkCompatibility function with PCIe, M.2, and PSU card class changes
// Function definition starts here
function checkCompatibility() {
    let isCompatible = true; // Assume compatible initially
    let issues = []; // Hard incompatibility issues (errors)
    let warnings = []; // Potential issues or recommendations (warnings)
    const compatibilityStatusElement = document.getElementById('compatibility-status');
    const psuWarningElement = document.getElementById('psu-warning'); // Sidebar PSU warning element
    const psuCardElement = document.getElementById('psu-card'); // Main PSU card element

    // Ensure UI elements exist
    if (!compatibilityStatusElement || !psuWarningElement) {
        console.error("Compatibility status or PSU warning element not found.");
        return; // Exit if elements are missing
    }

     // Reset previous states at the beginning of the function
     psuWarningElement.style.display = 'none'; // Hide sidebar warning initially
     psuWarningElement.textContent = '';
     psuWarningElement.style.backgroundColor = ''; // Reset color
     if (psuCardElement) {
         psuCardElement.classList.remove('psu-capacity-warning', 'psu-capacity-error'); // Reset card classes
     }
    console.log("[DEBUG] checkCompatibility started. Resetting warnings/classes."); // Debug Start


    /* 1. CPU Socket / Motherboard Socket Check */
    if (selectedParts.cpu && selectedParts.motherboard) {
        const cpuSocketNorm = selectedParts.cpu.normalizedSocket;
        const moboSocketNorm = selectedParts.motherboard.normalizedSocket;
        console.log(`[DEBUG] CPU Socket: ${cpuSocketNorm}, Mobo Socket: ${moboSocketNorm}`); // Debug Sockets

        if (cpuSocketNorm && moboSocketNorm && cpuSocketNorm !== moboSocketNorm) {
            isCompatible = false;
            issues.push(`CPU socket (${selectedParts.cpu.socket || '?'}) incompatible with Mobo socket (${selectedParts.motherboard.socket || '?'}).`);
        }
    }

    /* 2. RAM DDR Version / Motherboard DDR Support Check */
    if (selectedParts.ram && selectedParts.motherboard) {
        const ramDDR = selectedParts.ram.ddr_version;
        const moboDDR = selectedParts.motherboard.supported_ddr;
         console.log(`[DEBUG] RAM DDR: ${ramDDR}, Mobo DDR Support: ${moboDDR}`); // Debug DDR

        if (ramDDR && moboDDR && ramDDR !== moboDDR) {
            isCompatible = false;
            issues.push(`RAM type (${ramDDR}) incompatible with Motherboard supported type (${moboDDR}).`);
        }
    }

     /* 3. GPU PCIe / Motherboard PCIe Check */
     if (selectedParts.gpu && selectedParts.motherboard) {
         const gpuPcie = selectedParts.gpu.pcie_type;
         const moboPcie = selectedParts.motherboard.pcie_type;
          console.log(`[DEBUG] GPU PCIe: ${gpuPcie}, Mobo PCIe: ${moboPcie}`); // Debug PCIe

         if (gpuPcie && moboPcie && gpuPcie !== moboPcie) {
             const gpuVersionMatch = typeof gpuPcie === 'string' ? gpuPcie.match(/(\d+\.\d+)/) : null;
             const moboVersionMatch = typeof moboPcie === 'string' ? moboPcie.match(/(\d+\.\d+)/) : null;
             let warningMsg = `GPU (${gpuPcie || '?'}) and Motherboard (${moboPcie || '?'}) have different PCIe versions.`;

             if (gpuVersionMatch && moboVersionMatch) {
                 const gpuVersion = parseFloat(gpuVersionMatch[1]);
                 const moboVersion = parseFloat(moboVersionMatch[1]);
                 if (gpuVersion > moboVersion) {
                     warningMsg += ` GPU performance may be limited by the motherboard slot.`;
                 } else {
                      warningMsg += ` Motherboard slot supports higher speed than GPU (generally okay).`;
                 }
             }
             warnings.push(warningMsg);
         }
     }

     /* 4. SSD M.2 / Motherboard M.2 Slot Check */
      console.log("[DEBUG] Starting M.2 Check..."); // Debug M.2 start
      if (selectedParts.storage && selectedParts.motherboard) {
          // Check if interface/form_factor are strings before calling toLowerCase()
          const storageInterfaceRaw = selectedParts.storage.interface;
          const storageFormFactorRaw = selectedParts.storage.form_factor;

          console.log(`[DEBUG] Raw Storage Interface: ${storageInterfaceRaw} (Type: ${typeof storageInterfaceRaw})`);
          console.log(`[DEBUG] Raw Storage Form Factor: ${storageFormFactorRaw} (Type: ${typeof storageFormFactorRaw})`);

          // Safely convert to lowercase strings only if they are strings
          const storageInterface = (typeof storageInterfaceRaw === 'string') ? storageInterfaceRaw.toLowerCase() : '';
          const storageFormFactor = (typeof storageFormFactorRaw === 'string') ? storageFormFactorRaw.toLowerCase() : '';

          // Check if storage is M.2 type based on interface or form factor string containing "m.2"
          const isM2Storage = storageInterface.includes('m.2') || storageFormFactor.includes('m.2');
          const moboM2Slots = Number(selectedParts.motherboard.m2_slots) || 0;

          console.log(`[DEBUG] Is M.2 Storage: ${isM2Storage}, Mobo M.2 Slots: ${moboM2Slots}`); // Debug M.2 results

          if (isM2Storage && moboM2Slots <= 0) {
              isCompatible = false; // M.2 drive physically won't fit
              issues.push(`Selected M.2 Storage (${selectedParts.storage.name || '?'}) requires an M.2 slot, but the Motherboard (${selectedParts.motherboard.name || '?'}) reports ${moboM2Slots} M.2 slots.`);
          }
      } else {
          console.log("[DEBUG] Skipping M.2 Check (Storage or Motherboard not selected).");
      }


    /* 5. PSU Wattage Check */
    console.log("[DEBUG] Starting PSU Check..."); // Debug PSU start
    const totalTDP = calculateTotalTDP(); // Recalculate TDP estimate
    console.log(`[DEBUG] Calculated TDP: ${totalTDP}W`);
    if (selectedParts.psu && typeof selectedParts.psu.wattage === 'number') {
        const psuWattage = selectedParts.psu.wattage;
        const recommendedWattage = Math.ceil(Math.max(totalTDP + 100, totalTDP * 1.25) / 10) * 10; // Round up
        console.log(`[DEBUG] PSU Wattage: ${psuWattage}W, Recommended: ${recommendedWattage}W`);

        if (psuWattage < totalTDP && totalTDP > 0) { // TDP exceeds PSU rating
            isCompatible = false;
            const msg = `PSU wattage (${psuWattage}W) is BELOW estimated load (~${totalTDP}W). System may not boot or be unstable!`;
            issues.push(msg);
            psuWarningElement.textContent = msg;
            psuWarningElement.style.backgroundColor = 'var(--danger-color)';
            psuWarningElement.style.display = 'flex';
            if (psuCardElement) psuCardElement.classList.add('psu-capacity-error');
             console.log("[DEBUG] PSU Check Result: ERROR - Wattage too low.");

        } else if (psuWattage < recommendedWattage && totalTDP > 0) { // Wattage meets TDP but is below recommended headroom
             const msg = `PSU wattage (${psuWattage}W) may be low for load (~${totalTDP}W). Recommended: ~${recommendedWattage}W for stability/upgrades.`;
            warnings.push(msg);
            // Show warning in sidebar only if no error is present
            if (psuWarningElement.style.display === 'none') {
                psuWarningElement.textContent = `PSU Wattage (${psuWattage}W) might be cutting it close (~${totalTDP}W load)! Recommended: ~${recommendedWattage}W.`;
                psuWarningElement.style.backgroundColor = 'var(--warning-color)';
                psuWarningElement.style.display = 'flex';
            }
             if (psuCardElement) psuCardElement.classList.add('psu-capacity-warning');
             console.log("[DEBUG] PSU Check Result: WARNING - Wattage may be low.");
        } else {
             // Wattage is sufficient
             console.log("[DEBUG] PSU Check Result: OK.");
        }

    } else if (totalTDP > 0 && !selectedParts.psu) { // Parts selected but no PSU yet
        warnings.push(`PSU not selected. Estimated load is ~${totalTDP}W. Cannot verify wattage.`);
        console.log("[DEBUG] PSU Check Result: WARNING - PSU not selected.");
    } else {
         // No load or PSU already checked and OK
         console.log("[DEBUG] Skipping PSU Check (No load or PSU selected/checked).");
    }


    /* 6. Update Compatibility UI in Sidebar */
    console.log(`[DEBUG] Updating Compatibility UI. Issues: ${issues.length}, Warnings: ${warnings.length}`);
    compatibilityStatusElement.classList.remove('compatible', 'incompatible'); // Clear previous status class
    compatibilityStatusElement.innerHTML = ''; // Clear previous messages

    const allMessages = [...issues, ...warnings]; // Combine errors and warnings

    if (issues.length === 0 && warnings.length === 0) { // Case 1: No issues or warnings
        compatibilityStatusElement.classList.add('compatible');
        compatibilityStatusElement.innerHTML = `<div><i class="fas fa-check-circle"></i> No compatibility issues detected.</div>`;
    } else { // Case 2: Issues or warnings exist
        // Add 'incompatible' class if there are hard issues (errors), otherwise 'compatible' (for warnings only)
        compatibilityStatusElement.classList.add(issues.length > 0 ? 'incompatible' : 'compatible');

        const iconClass = issues.length > 0 ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'; // Triangle for errors, Circle for warnings
        const messageTitle = issues.length > 0 ? 'Compatibility Issues:' : 'Potential Issues/Warnings:';

        // This is the block you highlighted - it should be correct
        let html = `<div><i class="fas ${iconClass}"></i> ${messageTitle}</div><ul>`;
        allMessages.forEach(msg => {
            // Check if the message is in the issues array to determine class
            const isError = issues.includes(msg);
            html += `<li class="${isError ? 'issue-error' : 'issue-warning'}">${msg}</li>`;
        }); // <-- forEach loop ends here
        html += '</ul>';
        compatibilityStatusElement.innerHTML = html;

    } // <-- This brace closes the 'else' block for UI update

    console.log("[DEBUG] checkCompatibility finished."); // Debug End

} // <-- This is the FINAL closing brace for the checkCompatibility function


// --- Save Build ---
const saveBuildBtn = document.getElementById('save-build-btn');
if (saveBuildBtn) {
    saveBuildBtn.addEventListener('click', function() {
        let hasParts = false;
        for (const type in selectedParts) {
            if (selectedParts[type]) {
                hasParts = true;
                break;
            }
        }
        if (!hasParts) {
            alert('Please select at least one component before saving your build.');
            return;
        }

        // Get calculated values from UI
        const totalPriceValue = parseFloat(document.getElementById('total-price')?.textContent.replace('$', '') || '0');
        const totalTDPValue = parseInt(document.getElementById('total-tdp')?.textContent.replace('W', '') || '0');

        // Prepare build data object, filter out null parts
        const buildData = {
            components: Object.fromEntries(
                Object.entries(selectedParts).filter(([_, v]) => v !== null)
            ),
            totalPrice: isNaN(totalPriceValue) ? 0 : totalPriceValue,
            totalTDP: isNaN(totalTDPValue) ? 0 : totalTDPValue,
            date: new Date().toISOString() // Timestamp the save
        };

        try {
            // Retrieve existing saved builds from localStorage, or initialize empty array
            const savedBuilds = JSON.parse(localStorage.getItem('savedBuilds') || '[]');
            savedBuilds.push(buildData); // Add the new build
            // Save the updated array back to localStorage
            localStorage.setItem('savedBuilds', JSON.stringify(savedBuilds));
            alert('Build saved successfully!');
        } catch (error) {
            console.error("Error saving build to localStorage:", error);
            alert('Failed to save build. Error: ' + error.message);
        }
    });
} else {
    console.warn("Save build button not found.");
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    // Modal background click closes modal
    const modalElement = document.getElementById('component-modal');
    if (modalElement) {
        modalElement.addEventListener('click', (event) => {
            // Close only if the click is directly on the modal backdrop, not its content
            if (event.target === modalElement) {
                closeModal();
            }
        });
    }

    // Modal search input listener
    const searchInput = document.getElementById('modal-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            // Apply filter/sort whenever search term changes
            if (currentModalComponentType) {
                applyFiltersAndSort(currentModalComponentType);
            }
        });
    } else { console.warn("Modal search input not found"); }

     // Modal filter button listener
     const filterBtn = document.getElementById('modal-filter-btn'); // Button in toolbar
     if (filterBtn) {
         filterBtn.onclick = toggleFilterPanel;
     } else { console.warn("Modal filter toggle button not found"); }

     // Filter panel close button listener
     const closeFilterBtn = document.querySelector('.close-filter-panel-btn'); // Button in panel header
     if (closeFilterBtn) {
          closeFilterBtn.onclick = toggleFilterPanel;
     } else { console.warn("Filter panel close button not found"); }

     // Filter panel reset button listener
     const resetFilterBtn = document.getElementById('reset-filters-btn'); // Button in panel footer
     if (resetFilterBtn) {
         resetFilterBtn.onclick = () => {
             if (currentModalComponentType) {
                 resetFilters(currentModalComponentType);
             }
         };
     } else { console.warn("Filter panel reset button not found"); }


    // Initial Calculations and Function Exposure
    try {
        checkCompatibility(); // Run initial check on load (likely no parts selected)
        calculateTotalTDP(); // Run initial TDP calculation (likely 0W)
    } catch(e) { console.error("Error during initial checks:", e); }

    // Expose functions globally for inline HTML onclick handlers (alternative: add listeners here)
    window.openModal = openModal;
    window.closeModal = closeModal; // Make sure close is globally accessible if used in HTML
    window.removePart = removePart;
    window.handleSelectComponentClick = handleSelectComponentClick; // Expose safe wrapper
    window.toggleFilterPanel = toggleFilterPanel; // Expose filter panel toggle
     window.resetFilters = resetFilters; // Expose reset filters (if needed, though button handles it)

     console.log("Event listeners attached and initial checks run.");
});