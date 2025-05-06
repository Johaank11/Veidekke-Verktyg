// Globala variabler
// Using Supabase client from the variable defined in index.html
// const supabaseUrl = 'https://tmxnvvzasvozysxighcf.supabase.co';
// const supabaseKey = window.SUPABASE_KEY;
// const supabase = window.supabase; // Fixed: Using the global supabase client instead of supabaseClient.createClient

// Använd supabaseClient som definieras i index.html
const supabase = supabaseClient;

let workplaces = [];
let tools = [];
let selectedSubcategory = null;
let currentUserEmail = null; // Variable to store current user's email

// Sorteringsvariabler
let currentSortColumn = 'name';
let currentSortDirection = 'asc';
let workplaceSortColumn = 'name';
let workplaceSortDirection = 'asc';

// Function to get current user's email
async function getCurrentUser() {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error getting session:', error);
            return null;
        }
        
        if (data && data.session && data.session.user) {
            currentUserEmail = data.session.user.email;
            console.log('Current user email:', currentUserEmail);
            return data.session.user;
        } else {
            console.log('No user session found');
            return null;
        }
    } catch (err) {
        console.error('Error in getCurrentUser:', err);
        return null;
    }
}

// Hjälpfunktion för att uppdatera body-klassen när dropdown-menyer är öppna/stängda
function updateBodyClass() {
    const hasOpenDropdown = document.querySelector('.category-tab.show-dropdown') !== null;
    if (hasOpenDropdown) {
        document.body.classList.add('has-open-dropdown');
    } else {
        document.body.classList.remove('has-open-dropdown');
    }
}

// DOM-element
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const closeButtons = document.querySelectorAll('.close');
const workplaceModal = document.getElementById('workplace-modal');
const toolModal = document.getElementById('tool-modal');
const addWorkplaceBtn = document.getElementById('add-workplace-btn');
const addToolBtn = document.getElementById('add-tool-btn');
const workplaceForm = document.getElementById('workplace-form');
const toolForm = document.getElementById('tool-form');
const workplaceFilter = document.getElementById('workplace-filter');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchWorkplaceInput = document.getElementById('search-workplace-input');
const searchWorkplaceBtn = document.getElementById('search-workplace-btn');
const commentModal = document.getElementById('comment-modal');

// Funktion för att visa kommentarmodal
function showCommentModal(toolName, comment) {
    document.getElementById('comment-tool-name').textContent = toolName;
    document.getElementById('comment-text').textContent = comment;
    commentModal.style.display = 'block';
}

// Stäng kommentarmodal
function closeCommentModal() {
    commentModal.style.display = 'none';
}

// Funktion för att hämta data från Supabase
async function fetchDataFromSupabase() {
    try {
        // Hämta arbetsplatser
        let { data: workplacesData, error: workplacesError } = await supabase
            .from('workplaces')
            .select('*');
        
        if (workplacesError) throw workplacesError;
        workplaces = workplacesData;
        
        // Debug: Logga arbetsplatser
        console.log('Loaded workplaces:', workplaces);
        
        // Debug: Log ID formats and types
        if (workplaces.length > 0) {
            console.log('Sample workplace ID format:', workplaces[0].id, 'type:', typeof workplaces[0].id);
            workplaces.forEach(wp => {
                console.log(`Workplace: ${wp.name}, ID: ${wp.id}, ID type: ${typeof wp.id}`);
            });
        }
        
        // Hämta verktyg
        let { data: toolsData, error: toolsError } = await supabase
            .from('tools')
            .select('*');
        
        if (toolsError) throw toolsError;
        tools = toolsData;
        
        // Debug: Logga verktyg
        console.log('Loaded tools:', tools);
        
        // Debug: Kontrollera matchning mellan verktyg och arbetsplatser
        tools.forEach(tool => {
            const workplace = workplaces.find(wp => String(wp.id) === String(tool.workplaceId));
            console.log(`Tool ${tool.name} has workplaceId ${tool.workplaceId}, found matching workplace: ${workplace ? 'YES' : 'NO'}`);
            if (workplace) {
                console.log(`Matching workplace: ${workplace.name}, responsible: ${workplace.responsible}`);
            }
        });
        
        // Add this code temporarily to update all tools
        tools.forEach(async (tool) => {
            const workplace = workplaces.find(wp => String(wp.id) === String(tool.workplaceId));
            if (workplace && workplace.responsible) {
                await supabase
                    .from('tools')
                    .update({ responsible: workplace.responsible })
                    .eq('id', tool.id);
            }
        });
        
        // Rendera data
        renderWorkplaces();
        renderTools();
        updateWorkplaceSelects();
    } catch (error) {
        console.error('Error fetching data:', error);
        // Visa ett felmeddelande för användaren
        alert('Ett fel uppstod när data skulle hämtas från databasen. Vänligen försök igen senare.');
        
        // Initiera tomma arrays om inget kan hämtas
        workplaces = [];
        tools = [];
        renderWorkplaces();
        renderTools();
        updateWorkplaceSelects();
    }
}

// Funktion för att rendera arbetsplatser
function renderWorkplaces() {
    const workplacesList = document.getElementById('workplaces-list');
    const searchTerm = searchWorkplaceInput.value.toLowerCase();
    
    // Filtrera arbetsplatser baserat på sökterm
    const filteredWorkplaces = workplaces.filter(workplace => 
        workplace.name.toLowerCase().includes(searchTerm) ||
        workplace.address.toLowerCase().includes(searchTerm) ||
        workplace.responsible.toLowerCase().includes(searchTerm)
    );
    
    // Sortera arbetsplatser
    filteredWorkplaces.sort((a, b) => {
        let valueA = a[workplaceSortColumn];
        let valueB = b[workplaceSortColumn];
        
        if (typeof valueA === 'string') valueA = valueA.toLowerCase();
        if (typeof valueB === 'string') valueB = valueB.toLowerCase();
        
        if (valueA < valueB) return workplaceSortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return workplaceSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Rensa listan
    workplacesList.innerHTML = '';
    
    // Lägg till arbetsplatser i listan
    filteredWorkplaces.forEach(workplace => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${workplace.name}</td>
            <td>${workplace.address}</td>
            <td>${workplace.responsible}</td>
            <td class="action-buttons">
                <button class="btn btn-small edit-workplace" data-id="${workplace.id}">Redigera</button>
                <button class="btn btn-small btn-danger delete-workplace" data-id="${workplace.id}">Ta bort</button>
            </td>
        `;
        
        workplacesList.appendChild(row);
    });
    
    // Lägg till händelselyssnare för redigera/ta bort
    document.querySelectorAll('.edit-workplace').forEach(btn => {
        btn.addEventListener('click', () => editWorkplace(btn.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.delete-workplace').forEach(btn => {
        btn.addEventListener('click', () => deleteWorkplace(btn.getAttribute('data-id')));
    });
    
    // Uppdatera arbetsplatsfilter
    updateWorkplaceSelects();
}

// Uppdatera arbetsplatsval i verktygsformuläret och filter
function updateWorkplaceSelects() {
    const toolWorkplaceSelect = document.getElementById('tool-workplace');
    const filterSelect = document.getElementById('workplace-filter');
    
    // Spara nuvarande val
    const currentToolWorkplace = toolWorkplaceSelect.value;
    const currentFilter = filterSelect.value;
    
    // Rensa val
    toolWorkplaceSelect.innerHTML = '<option value="">Välj arbetsplats</option>';
    filterSelect.innerHTML = '<option value="all">Alla arbetsplatser</option>';
    
    // Lägg till arbetsplatser i val
    workplaces.forEach(workplace => {
        const toolOption = document.createElement('option');
        toolOption.value = workplace.id;
        toolOption.textContent = workplace.name;
        toolWorkplaceSelect.appendChild(toolOption);
        
        const filterOption = document.createElement('option');
        filterOption.value = workplace.id;
        filterOption.textContent = workplace.name;
        filterSelect.appendChild(filterOption);
    });
    
    // Återställ tidigare val om möjligt
    if (currentToolWorkplace && [...toolWorkplaceSelect.options].some(opt => opt.value === currentToolWorkplace)) {
        toolWorkplaceSelect.value = currentToolWorkplace;
    }
    
    if (currentFilter && [...filterSelect.options].some(opt => opt.value === currentFilter)) {
        filterSelect.value = currentFilter;
    }
}

// Funktion för att rendera verktyg
function renderTools() {
    const toolsList = document.getElementById('tools-list');
    const searchTerm = searchInput.value.toLowerCase();
    const workplaceId = workplaceFilter.value;
    
    // Debug: Check workplaces array before rendering
    console.log('Rendering tools, current workplaces array:', workplaces);
    console.log('Workplaces array length:', workplaces.length);
    
    if (!workplaces || workplaces.length === 0) {
        console.error('Warning: No workplaces available when rendering tools!');
    }
    
    // Filtrera verktyg baserat på sökterm och arbetsplats
    let filteredTools = tools;
    
    if (workplaceId !== 'all') {
        filteredTools = filteredTools.filter(tool => tool.workplaceId === workplaceId);
    }
    
    filteredTools = filteredTools.filter(tool => 
        tool.name.toLowerCase().includes(searchTerm) ||
        (tool.responsible && tool.responsible.toLowerCase().includes(searchTerm))
    );
    
    // Sortera verktyg
    filteredTools.sort((a, b) => {
        let valueA, valueB;
        
        if (currentSortColumn === 'workplace') {
            const workplaceA = workplaces.find(wp => String(wp.id) === String(a.workplaceId));
            const workplaceB = workplaces.find(wp => String(wp.id) === String(b.workplaceId));
            
            valueA = workplaceA ? workplaceA.name.toLowerCase() : '';
            valueB = workplaceB ? workplaceB.name.toLowerCase() : '';
        } else if (currentSortColumn === 'updated') {
            valueA = new Date(a.updated || 0);
            valueB = new Date(b.updated || 0);
        } else {
            valueA = a[currentSortColumn];
            valueB = b[currentSortColumn];
            
            if (typeof valueA === 'string') valueA = valueA.toLowerCase();
            if (typeof valueB === 'string') valueB = valueB.toLowerCase();
        }
        
        if (valueA < valueB) return currentSortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Rensa listan
    toolsList.innerHTML = '';
    
    // Lägg till verktyg i listan
    filteredTools.forEach(tool => {
        // Debug: Type checking for workplaceId 
        console.log(`Tool ${tool.name} workplaceId type: ${typeof tool.workplaceId}, value: ${tool.workplaceId}`);
        
        // Modified: Use string comparison to avoid type issues
        const workplace = workplaces.find(wp => String(wp.id) === String(tool.workplaceId));
        
        console.log(`Rendering tool ${tool.name} with workplaceId ${tool.workplaceId}`);
        console.log(`Found matching workplace: ${workplace ? workplace.name : 'NONE'}`);
        if (workplace) {
            console.log(`Workplace details: ID=${workplace.id}, name=${workplace.name}, responsible=${workplace.responsible}`);
        }
        
        const workplaceName = workplace ? workplace.name : 'Okänd arbetsplats';
        
        // Bestäm status-klass och nästa status
        let statusClass, statusText, nextStatus;
        switch(tool.status) {
            case 'available':
                statusClass = 'status-available';
                statusText = 'Tillgänglig';
                nextStatus = 'borrowed';
                break;
            case 'borrowed':
                statusClass = 'status-borrowed';
                statusText = 'Används';
                nextStatus = 'broken';
                break;
            case 'broken':
                statusClass = 'status-broken';
                statusText = 'Trasig';
                nextStatus = 'available';
                break;
            default:
                statusClass = 'status-available';
                statusText = 'Tillgänglig';
                nextStatus = 'borrowed';
        }
        
        // Formatera datum
        const date = tool.updated ? new Date(tool.updated) : new Date();
        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="tool-name-container ${tool.comment ? 'has-comment' : ''}">
                    <span class="tool-name">${tool.name}</span>
                    ${tool.comment ? '<span class="comment-star" style="color: red; margin-left: 4px;">★</span>' : ''}
                </div>
            </td>
            <td class="workplace-cell">
                <div>${workplaceName}</div>
                <div class="workplace-select">
                    ${workplaces.map(wp => `
                        <div class="workplace-option" data-tool-id="${tool.id}" data-workplace-id="${wp.id}">
                            ${wp.name}
                        </div>
                    `).join('')}
                </div>
            </td>
            <td><span class="status ${statusClass}" data-tool-id="${tool.id}" data-next-status="${nextStatus}">${statusText}</span></td>
            <td>${tool.responsible || '-'}</td>
            <td>${formattedDate}</td>
            <td class="action-buttons">
                <button class="btn btn-small edit-tool" data-id="${tool.id}">Redigera</button>
                <button class="btn btn-small btn-danger delete-tool" data-id="${tool.id}">Ta bort</button>
            </td>
        `;
        
        toolsList.appendChild(row);
        
        // Add click event listener to show comments
        if (tool.comment) {
            const nameContainer = row.querySelector('.tool-name-container');
            nameContainer.addEventListener('click', () => {
                showCommentModal(tool.name, tool.comment);
            });
            nameContainer.style.cursor = 'pointer';
        }
    });
    
    // Lägg till händelselyssnare för arbetsplatsval
    document.querySelectorAll('.workplace-cell').forEach(cell => {
        cell.addEventListener('click', (e) => {
            // Stäng alla andra öppna workplace-selects
            document.querySelectorAll('.workplace-cell.active').forEach(activeCell => {
                if (activeCell !== cell) {
                    activeCell.classList.remove('active');
                }
            });
            
            // Stäng alla öppna kategori-dropdowns
            document.querySelectorAll('.category-tab.show-dropdown').forEach(tab => {
                tab.classList.remove('show-dropdown');
            });
            
            // Växla aktiv-status för den klickade cellen
            cell.classList.toggle('active');
            
            // Positionera dropdown-menyn ovanför den klickade arbetsplatsen
            if (cell.classList.contains('active')) {
                const dropdown = cell.querySelector('.workplace-select');
                
                // Återställ alla tidigare stilar
                dropdown.style.position = 'absolute';
                dropdown.style.left = '0';
                dropdown.style.right = 'auto';
                dropdown.style.transform = 'none';
                
                // Placera dropdown ovanför cellen istället för under
                dropdown.style.top = -dropdown.offsetHeight + 'px';
                dropdown.style.bottom = 'auto';
                
                // Kontrollera om dropdown-menyn skulle gå utanför skärmen till höger
                const cellRect = cell.getBoundingClientRect();
                const dropdownWidth = 200; // Bredden på dropdown-menyn enligt CSS
                
                if (cellRect.left + dropdownWidth > window.innerWidth) {
                    dropdown.style.left = 'auto';
                    dropdown.style.right = '0';
                }
            }
            
            e.stopPropagation();
        });
    });
    
    document.querySelectorAll('.workplace-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const toolId = option.getAttribute('data-tool-id');
            const newWorkplaceId = option.getAttribute('data-workplace-id');
            quickUpdateWorkplace(toolId, newWorkplaceId);
            e.stopPropagation();
        });
    });
    
    // Förbättrad hantering av klick utanför workplace-select
    document.addEventListener('click', (e) => {
        // Kontrollera om klicket var på en workplace-cell eller dess barn
        let clickedOnWorkplaceCell = false;
        let target = e.target;
        
        while (target && target !== document) {
            if (target.classList && (target.classList.contains('workplace-cell') || target.classList.contains('workplace-select') || target.classList.contains('workplace-option'))) {
                clickedOnWorkplaceCell = true;
                break;
            }
            target = target.parentNode;
        }
        
        // Om klicket inte var på en workplace-cell eller dess barn, stäng alla aktiva workplace-cells
        if (!clickedOnWorkplaceCell) {
            document.querySelectorAll('.workplace-cell.active').forEach(cell => {
                cell.classList.remove('active');
            });
        }
    });
    
    // Lägg till händelselyssnare för status-klick
    document.querySelectorAll('.status').forEach(statusElement => {
        statusElement.addEventListener('click', () => {
            const toolId = statusElement.getAttribute('data-tool-id');
            const nextStatus = statusElement.getAttribute('data-next-status');
            quickUpdateStatus(toolId, nextStatus);
        });
    });
    
    // Lägg till händelselyssnare för redigera/ta bort
    document.querySelectorAll('.edit-tool').forEach(btn => {
        btn.addEventListener('click', () => editTool(btn.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.delete-tool').forEach(btn => {
        btn.addEventListener('click', () => deleteTool(btn.getAttribute('data-id')));
    });
}

// Byt mellan flikar
function switchTab(tabName) {
    tabs.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    tabContents.forEach(content => {
        if (content.id === `${tabName}-tab`) {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    });
}

// Uppdatera sorteringspilar
function updateSortIndicators(tableId, column, direction) {
    const table = document.getElementById(tableId);
    const headers = table.querySelectorAll('th[data-sort]');
    
    headers.forEach(header => {
        const headerColumn = header.getAttribute('data-sort');
        const baseText = header.textContent.split(' ')[0]; // Ta bara första delen av texten (utan pilar)
        if (headerColumn === column) {
            header.textContent = `${baseText} ${direction === 'asc' ? '↑' : '↓'}`;
        } else {
            header.textContent = `${baseText} ↕`;
        }
    });
}

// Initialisera appen
async function init() {
    // Check and get current user first
    await getCurrentUser();
    
    // Hämta data från Supabase
    await fetchDataFromSupabase();
    
    console.log('Initialiserar app och lägger till händelselyssnare');
    
    // Lägg till händelselyssnare för underkategorier direkt vid initialisering
    document.querySelectorAll('.category-tab').forEach(tab => {
        console.log('Initialiserar kategori:', tab.getAttribute('data-category'));
        
        const subcategoryItems = tab.querySelectorAll('.subcategory-item');
        console.log('Antal underkategorier vid initialisering:', subcategoryItems.length, 'för kategori:', tab.getAttribute('data-category'));
        
        subcategoryItems.forEach(item => {
            item.addEventListener('click', (e) => {
                console.log('Klick på underkategori:', item.textContent);
                e.stopPropagation();
                
                const category = item.getAttribute('data-category');
                const subcategory = item.getAttribute('data-subcategory');
                const subcategoryText = item.textContent;
                
                // Avmarkera alla underkategorier i ALLA huvudkategorier
                document.querySelectorAll('.subcategory-item').forEach(subItem => {
                    subItem.classList.remove('active');
                });
                
                // Ta bort alla selected-subcategory-element från alla huvudkategorier
                document.querySelectorAll('.selected-subcategory').forEach(element => {
                    element.remove();
                });
                
                // Markera den valda underkategorin
                item.classList.add('active');
                selectedSubcategory = item;
                console.log('Vald underkategori:', subcategoryText, 'i kategori:', category);
                
                // Uppdatera aktiv kategori
                document.querySelectorAll('.category-tab').forEach(tab => {
                    if (tab.getAttribute('data-category') === category) {
                        tab.classList.add('active');
                        
                        // Skapa eller uppdatera den valda underkategorin som visas ovanför listan
                        let selectedSubcategoryElement = tab.querySelector('.selected-subcategory');
                        if (!selectedSubcategoryElement) {
                            selectedSubcategoryElement = document.createElement('div');
                            selectedSubcategoryElement.className = 'selected-subcategory';
                            const dropdown = tab.querySelector('.subcategory-dropdown');
                            tab.insertBefore(selectedSubcategoryElement, dropdown);
                        }
                        selectedSubcategoryElement.textContent = subcategoryText;
                        selectedSubcategoryElement.setAttribute('data-subcategory', subcategory);
                        
                        // Säkerställ att alla underkategorier har rätt färg
                        const allSubcategoryItems = tab.querySelectorAll('.subcategory-item');
                        allSubcategoryItems.forEach(subItem => {
                            if (subItem.classList.contains('active')) {
                                subItem.style.color = 'white';
                            } else {
                                subItem.style.color = 'var(--dark-color)';
                            }
                        });
                        
                        // Stäng dropdown-menyn efter val av underkategori
                        tab.classList.remove('show-dropdown');
                        updateBodyClass();
                    } else {
                        tab.classList.remove('active');
                        tab.classList.remove('show-dropdown');
                    }
                });
                
                filterToolsByCategory(category, subcategory);
            });
        });
    });
    
    // Lägg till händelselyssnare
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModals);
    });
    
    addWorkplaceBtn.addEventListener('click', () => {
        document.getElementById('workplace-modal-title').textContent = 'Lägg till arbetsplats';
        document.getElementById('workplace-id').value = '';
        document.getElementById('workplace-name').value = '';
        document.getElementById('workplace-address').value = '';
        document.getElementById('workplace-responsible').value = '';
        
        // Stäng alla öppna dropdown-menyer
        document.querySelectorAll('.category-tab.show-dropdown').forEach(tab => {
            tab.classList.remove('show-dropdown');
        });
        document.querySelectorAll('.workplace-cell.active').forEach(cell => {
            cell.classList.remove('active');
        });
        
        workplaceModal.style.display = 'block';
    });
    
    addToolBtn.addEventListener('click', () => {
        // Kontrollera om det finns arbetsplatser
        if (workplaces.length === 0) {
            alert('Du måste lägga till minst en arbetsplats innan du kan lägga till enheter.');
            return;
        }
        
        document.getElementById('tool-modal-title').textContent = 'Lägg till enhet';
        document.getElementById('tool-id').value = '';
        document.getElementById('tool-name').value = '';
        document.getElementById('tool-category').value = 'byggmaskiner';
        // Uppdatera underkategorier baserat på standardvald kategori
        updateSubcategories('byggmaskiner');
        document.getElementById('tool-status').value = 'available';
        
        // Stäng alla öppna dropdown-menyer
        document.querySelectorAll('.category-tab.show-dropdown').forEach(tab => {
            tab.classList.remove('show-dropdown');
        });
        document.querySelectorAll('.workplace-cell.active').forEach(cell => {
            cell.classList.remove('active');
        });
        
        toolModal.style.display = 'block';
    });
    
    // Lägg till händelselyssnare för kategoriändring i formuläret
    document.getElementById('tool-category').addEventListener('change', function() {
        updateSubcategories(this.value);
    });
    
    workplaceForm.addEventListener('submit', saveWorkplace);
    toolForm.addEventListener('submit', saveTool);
    
    workplaceFilter.addEventListener('change', renderTools);
    
    searchBtn.addEventListener('click', () => {
        renderTools();
    });
    
    searchWorkplaceBtn.addEventListener('click', () => {
        renderWorkplaces();
    });
    
    // Lägg till händelselyssnare för Enter-tangenten i sökfälten
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            renderTools();
        }
    });
    
    searchWorkplaceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            renderWorkplaces();
        }
    });
    
    // Sortering för verktyg
    document.querySelectorAll('#tools-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc';
            }
            renderTools();
            updateSortIndicators('tools-table', currentSortColumn, currentSortDirection);
        });
    });
    
    // Sortering för arbetsplatser
    document.querySelectorAll('#workplaces-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            if (workplaceSortColumn === column) {
                workplaceSortDirection = workplaceSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                workplaceSortColumn = column;
                workplaceSortDirection = 'asc';
            }
            renderWorkplaces();
            updateSortIndicators('workplaces-table', workplaceSortColumn, workplaceSortDirection);
        });
    });
    
    // Förbättra hanteringen av dropdown-menyn
    document.addEventListener('DOMContentLoaded', function() {
        // Förbättra hanteringen av klick på kategori-flikar
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Om vi klickar på en underkategori, hantera det separat
                if (e.target.classList.contains('subcategory-item')) {
                    e.stopPropagation();
                    return;
                }
                
                // Stäng alla andra dropdowns
                document.querySelectorAll('.category-tab').forEach(t => {
                    if (t !== tab) {
                        t.classList.remove('show-dropdown');
                    }
                });
                
                // Stäng alla aktiva arbetsplats-celler
                document.querySelectorAll('.workplace-cell.active').forEach(cell => {
                    cell.classList.remove('active');
                });
                
                // Om det finns en dropdown, visa/dölj den
                if (tab.querySelector('.subcategory-dropdown')) {
                    // Växla dropdown-menyn vid klick på huvudkategorin
                    tab.classList.toggle('show-dropdown');
                    
                    // Logga för att verifiera att klassen läggs till korrekt
                    console.log('Dropdown synlig:', tab.classList.contains('show-dropdown'), 'för kategori:', tab.getAttribute('data-category'));
                    
                    // Om dropdown just öppnades, säkerställ att alla underkategorier är synliga
                    if (tab.classList.contains('show-dropdown')) {
                        const dropdown = tab.querySelector('.subcategory-dropdown');
                        const items = dropdown.querySelectorAll('.subcategory-item');
                        
                        // Logga för att kontrollera att underkategori-elementen hittas
                        console.log('Antal underkategorier hittade:', items.length);
                        
                        // Återställ alla underkategorier
                        items.forEach(item => {
                            // Återställ synlighet och styling med !important för att överskugga eventuell CSS
                            item.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; color: var(--dark-color) !important;';
                            console.log('Återställer underkategori:', item.textContent);
                            
                            // Behåll active-status men säkerställ att övriga klasser är korrekta
                            const isActive = item.classList.contains('active');
                            if (!isActive) {
                                item.className = 'subcategory-item';
                            } else {
                                item.style.color = 'white !important';
                            }
                        });
                        
                        // Verifiera att dropdown-menyn är synlig genom att kontrollera dess display-egenskap
                        const computedStyle = window.getComputedStyle(dropdown);
                        console.log('Dropdown display-egenskap:', computedStyle.display);
                        
                        // Om dropdown-menyn inte är synlig, tvinga den att visas
                        if (computedStyle.display === 'none') {
                            console.log('Tvingar dropdown att visas');
                            dropdown.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important;';
                        }
                        
                        // Uppdatera body-klassen
                        updateBodyClass();
                        
                        e.stopPropagation();
                        return;
                    } else {
                        // Uppdatera body-klassen när dropdown stängs
                        updateBodyClass();
                    }
                }
                
                // Uppdatera aktiv kategori och filtrera
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const category = tab.getAttribute('data-category');
                
                // Återställ vald underkategori om vi byter till en annan huvudkategori
                if (selectedSubcategory && selectedSubcategory.getAttribute('data-category') !== category) {
                    selectedSubcategory = null;
                    
                    // Ta bort alla selected-subcategory-element från alla huvudkategorier
                    document.querySelectorAll('.selected-subcategory').forEach(element => {
                        element.remove();
                    });
                }
                
                // Filtrera baserat på kategori och eventuellt vald underkategori
                if (selectedSubcategory && selectedSubcategory.getAttribute('data-category') === category) {
                    filterToolsByCategory(category, selectedSubcategory.getAttribute('data-subcategory'));
                } else {
                    filterToolsByCategory(category);
                }
            });
        });
        
        // Förbättra hanteringen av klick på underkategorier
        document.querySelectorAll('.subcategory-item').forEach(item => {
            item.addEventListener('click', (e) => {
                console.log('Klick på underkategori:', item.textContent);
                e.stopPropagation();
                
                const category = item.getAttribute('data-category');
                const subcategory = item.getAttribute('data-subcategory');
                const subcategoryText = item.textContent;
                
                // Avmarkera alla underkategorier i ALLA huvudkategorier
                document.querySelectorAll('.subcategory-item').forEach(subItem => {
                    subItem.classList.remove('active');
                });
                
                // Ta bort alla selected-subcategory-element från alla huvudkategorier
                document.querySelectorAll('.selected-subcategory').forEach(element => {
                    element.remove();
                });
                
                // Markera den valda underkategorin
                item.classList.add('active');
                selectedSubcategory = item;
                console.log('Vald underkategori:', subcategoryText, 'i kategori:', category);
                
                // Uppdatera aktiv kategori
                document.querySelectorAll('.category-tab').forEach(tab => {
                    if (tab.getAttribute('data-category') === category) {
                        tab.classList.add('active');
                        
                        // Skapa eller uppdatera den valda underkategorin som visas ovanför listan
                        let selectedSubcategoryElement = tab.querySelector('.selected-subcategory');
                        if (!selectedSubcategoryElement) {
                            selectedSubcategoryElement = document.createElement('div');
                            selectedSubcategoryElement.className = 'selected-subcategory';
                            const dropdown = tab.querySelector('.subcategory-dropdown');
                            tab.insertBefore(selectedSubcategoryElement, dropdown);
                        }
                        selectedSubcategoryElement.textContent = subcategoryText;
                        selectedSubcategoryElement.setAttribute('data-subcategory', subcategory);
                        
                        // Säkerställ att alla underkategorier har rätt färg
                        const allSubcategoryItems = tab.querySelectorAll('.subcategory-item');
                        allSubcategoryItems.forEach(subItem => {
                            if (subItem.classList.contains('active')) {
                                subItem.style.color = 'white';
                            } else {
                                subItem.style.color = 'var(--dark-color)';
                            }
                        });
                        
                        // Stäng dropdown-menyn efter val av underkategori
                        tab.classList.remove('show-dropdown');
                        updateBodyClass();
                    } else {
                        tab.classList.remove('active');
                        tab.classList.remove('show-dropdown');
                    }
                });
                
                filterToolsByCategory(category, subcategory);
            });
        });
        
        // Förbättra stängning av dropdowns när man klickar utanför
        document.addEventListener('click', (e) => {
            // Kontrollera om klicket var på en kategori-flik eller dess barn
            let clickedOnCategoryTab = false;
            let target = e.target;
            
            while (target && target !== document) {
                if (target.classList && target.classList.contains('category-tab')) {
                    clickedOnCategoryTab = true;
                    break;
                }
                target = target.parentNode;
            }
            
            // Om klicket inte var på en kategori-flik, stäng alla dropdowns
            if (!clickedOnCategoryTab) {
                document.querySelectorAll('.category-tab.show-dropdown').forEach(tab => {
                    tab.classList.remove('show-dropdown');
                });
                updateBodyClass();
            }
        });
    });
    
    // Stäng modaler när man klickar utanför
    window.addEventListener('click', (e) => {
        if (e.target === workplaceModal || e.target === toolModal) {
            closeModals();
        }
    });
    
    // After your supabase initialization in script.js
    let currentUserEmail = null;
    
    // Add this function to get the current user
}

// Funktion för att stänga modaler (utan body-scrolllocking för att förhindra frysning)
function closeModals() {
    workplaceModal.style.display = 'none';
    toolModal.style.display = 'none';
    
    // Säkerställ att alla dropdown-menyer är stängda när modalen stängs
    document.querySelectorAll('.category-tab.show-dropdown').forEach(tab => {
        tab.classList.remove('show-dropdown');
    });
    document.querySelectorAll('.workplace-cell.active').forEach(cell => {
        cell.classList.remove('active');
    });
}

// Spara arbetsplats
async function saveWorkplace(e) {
    e.preventDefault();
    
    const id = document.getElementById('workplace-id').value;
    const name = document.getElementById('workplace-name').value;
    const address = document.getElementById('workplace-address').value;
    const responsible = document.getElementById('workplace-responsible').value;
    
    // Validera formuläret
    if (!name || !address || !responsible) {
        alert('Alla fält måste fyllas i');
        return;
    }
    
    try {
        if (id) {
            // Uppdatera befintlig arbetsplats
            const { error } = await supabase
                .from('workplaces')
                .update({ name, address, responsible })
                .eq('id', id);
                
            if (error) throw error;
            
            // Uppdatera lokal array
            const index = workplaces.findIndex(wp => wp.id === id);
            if (index !== -1) {
                workplaces[index].name = name;
                workplaces[index].address = address;
                workplaces[index].responsible = responsible;
            }
        } else {
            // Lägg till ny arbetsplats
            const newWorkplace = {
                id: Date.now().toString(),
                name,
                address,
                responsible
            };
            
            const { error } = await supabase
                .from('workplaces')
                .insert([newWorkplace]);
                
            if (error) throw error;
            
            // Lägg till i lokal array
            workplaces.push(newWorkplace);
        }
        
        closeModals();
        renderWorkplaces();
        updateWorkplaceSelects();
    } catch (error) {
        console.error('Error saving workplace:', error);
        alert('Ett fel uppstod när arbetsplatsen skulle sparas. Försök igen.');
    }
}

// Spara verktyg
async function saveTool(e) {
    e.preventDefault();
    
    const id = document.getElementById('tool-id').value;
    const name = document.getElementById('tool-name').value;
    const workplaceId = document.getElementById('tool-workplace').value;
    const status = document.getElementById('tool-status').value;
    const category = document.getElementById('tool-category').value;
    const subcategory = document.getElementById('tool-subcategory').value;
    const comment = document.getElementById('tool-comment').value;
    
    // Validera formuläret
    if (!name || !workplaceId || !status || !category) {
        alert('Alla obligatoriska fält måste fyllas i');
        return;
    }
    
    // Hämta ansvarig person från vald arbetsplats
    const workplace = workplaces.find(wp => String(wp.id) === String(workplaceId));
    const responsible = workplace ? workplace.responsible : '';
    
    try {
        if (id) {
            // Detta är en uppdatering - hämta gamla verktyget
            const oldTool = tools.find(t => t.id === id);
            if (!oldTool) throw new Error('Verktyget kunde inte hittas');
            
            // Uppdatera verktyget i Supabase
            const { error } = await supabase
                .from('tools')
                .update({ 
                    name, workplaceId, status, responsible, 
                    category, subcategory, comment, 
                    updated: new Date().toISOString() 
                })
                .eq('id', id);
                
            if (error) throw error;
            
            // Identifiera ändringar
            const changes = {};
            if (oldTool.name !== name) changes.name = { old: oldTool.name, new: name };
            if (oldTool.workplaceId !== workplaceId) {
                changes.workplace = {
                    old: workplaces.find(wp => String(wp.id) === String(oldTool.workplaceId))?.name || 'Okänd',
                    new: workplace?.name || 'Okänd'
                };
            }
            if (oldTool.status !== status) changes.status = { old: oldTool.status, new: status };
            if (oldTool.category !== category) changes.category = { old: oldTool.category, new: category };
            if (oldTool.subcategory !== subcategory) changes.subcategory = { old: oldTool.subcategory, new: subcategory };
            if (oldTool.comment !== comment) changes.comment = { old: oldTool.comment, new: comment };
            
            // Logga om det finns ändringar
            if (Object.keys(changes).length > 0) {
                const logEntry = {
                    action: 'update',
                    type: 'tool',
                    target_id: name,
                    user_email: currentUserEmail || 'unknown',
                    details: {
                        id: id,
                        changes: changes,
                        timestamp: new Date().toISOString()
                    }
                };
                
                await supabase.from('logbook').insert([logEntry]);
            }
        } else {
            // Lägg till nytt verktyg
            const newTool = {
                id: Date.now().toString(),
                name,
                workplaceId,
                status,
                responsible,
                category,
                subcategory,
                comment,
                updated: new Date().toISOString()
            };
            
            const { error } = await supabase
                .from('tools')
                .insert([newTool]);
                
            if (error) throw error;
            
            // Logga skapandet av nytt verktyg i logbook
            const logEntry = {
                action: 'create',
                type: 'tool',
                target_id: name,
                user_email: currentUserEmail || 'unknown',
                details: newTool
            };
            
            const { error: logError } = await supabase
                .from('logbook')
                .insert([logEntry]);
                
            if (logError) {
                console.error('Error logging tool creation:', logError);
                // Fortsätt programmet även om loggningen misslyckas
            }
            
            // Lägg till i lokal array
            tools.push(newTool);
        }
        
        closeModals();
        renderTools();
    } catch (error) {
        console.error('Error saving tool:', error);
        alert('Ett fel uppstod när enheten skulle sparas. Försök igen.');
    }
}

// Lägg till händelselyssnare för att uppdatera ansvarig person när arbetsplats väljs
document.getElementById('tool-workplace').addEventListener('change', function() {
    const workplaceId = this.value;
    const workplace = workplaces.find(wp => wp.id === workplaceId);
    // Vi behöver inte längre uppdatera något fält här eftersom ansvarig person-fältet har tagits bort
});

// Redigera arbetsplats
function editWorkplace(id) {
    const workplace = workplaces.find(wp => String(wp.id) === String(id));
    if (workplace) {
        document.getElementById('workplace-modal-title').textContent = 'Redigera arbetsplats';
        document.getElementById('workplace-id').value = workplace.id;
        document.getElementById('workplace-name').value = workplace.name;
        document.getElementById('workplace-address').value = workplace.address;
        document.getElementById('workplace-responsible').value = workplace.responsible || '';
        workplaceModal.style.display = 'block';
    }
}

// Ta bort arbetsplats
async function deleteWorkplace(id) {
    if (confirm('Är du säker på att du vill ta bort denna arbetsplats? Alla verktyg kopplade till arbetsplatsen kommer också att tas bort.')) {
        try {
            // Ta bort alla verktyg kopplade till arbetsplatsen från Supabase
            const { error: toolsError } = await supabase
                .from('tools')
                .delete()
                .eq('workplaceId', id);
                
            if (toolsError) throw toolsError;
            
            // Ta bort arbetsplatsen från Supabase
            const { error: workplaceError } = await supabase
                .from('workplaces')
                .delete()
                .eq('id', id);
                
            if (workplaceError) throw workplaceError;
            
            // Uppdatera lokala arrays
            tools = tools.filter(tool => tool.workplaceId !== id);
            workplaces = workplaces.filter(wp => wp.id !== id);
            
            renderWorkplaces();
            renderTools();
            updateWorkplaceSelects();
        } catch (error) {
            console.error('Error deleting workplace:', error);
            alert('Ett fel uppstod när arbetsplatsen skulle tas bort. Försök igen.');
        }
    }
}

// Redigera verktyg
function editTool(id) {
    const tool = tools.find(t => t.id === id);
    if (tool) {
        document.getElementById('tool-modal-title').textContent = 'Redigera enhet';
        document.getElementById('tool-id').value = tool.id;
        document.getElementById('tool-name').value = tool.name;
        document.getElementById('tool-workplace').value = tool.workplaceId;
        document.getElementById('tool-status').value = tool.status;
        document.getElementById('tool-comment').value = tool.comment || '';
        
        // Sätt kategori om den finns, annars använd standardvärde
        if (tool.category) {
            document.getElementById('tool-category').value = tool.category;
            // Uppdatera underkategorier baserat på vald kategori
            updateSubcategories(tool.category);
            
            // Sätt underkategori om den finns
            if (tool.subcategory) {
                document.getElementById('tool-subcategory').value = tool.subcategory;
            }
        }
        
        toolModal.style.display = 'block';
    }
}

// Ta bort verktyg
async function deleteTool(id) {
    if (confirm('Är du säker på att du vill ta bort detta verktyg?')) {
        try {
            // Hitta verktyget innan det tas bort
            const tool = tools.find(t => t.id === id);
            if (!tool) throw new Error('Verktyget kunde inte hittas');
            
            // Ta bort verktyget från Supabase
            const { error } = await supabase
                .from('tools')
                .delete()
                .eq('id', id);
                
            if (error) throw error;
            
            // Logga borttagningen
            const logEntry = {
                action: 'delete',
                type: 'tool',
                target_id: tool.name,
                user_email: currentUserEmail || 'unknown',
                details: {
                    id: tool.id,
                    name: tool.name,
                    workplace: workplaces.find(wp => String(wp.id) === String(tool.workplaceId))?.name || 'Okänd',
                    status: tool.status,
                    category: tool.category,
                    subcategory: tool.subcategory,
                    comment: tool.comment,
                    timestamp: new Date().toISOString()
                }
            };
            
            await supabase.from('logbook').insert([logEntry]);
            
            // Uppdatera UI och loggbok
            tools = tools.filter(tool => tool.id !== id);
            renderTools();
            if (document.getElementById('logbook-tab').style.display !== 'none') {
                fetchLogbook();
            }
        } catch (error) {
            console.error('Error deleting tool:', error);
            alert('Ett fel uppstod när enheten skulle tas bort.');
        }
    }
}

// Hjälpfunktion för att återställa kategori och underkategori
function restoreCategoryAndSubcategory(category, subcategory) {
    if (category) {
        // Hitta och aktivera rätt kategori
        const categoryTab = document.querySelector(`.category-tab[data-category="${category}"]`);
        if (categoryTab) {
            document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
            categoryTab.classList.add('active');
            
            // Om det fanns en vald underkategori, återställ den också
            if (subcategory) {
                const subcategoryItem = categoryTab.querySelector(`.subcategory-item[data-subcategory="${subcategory}"]`);
                if (subcategoryItem) {
                    document.querySelectorAll('.subcategory-item').forEach(item => item.classList.remove('active'));
                    subcategoryItem.classList.add('active');
                    selectedSubcategory = subcategoryItem;
                    
                    // Återskapa selected-subcategory-elementet
                    let selectedSubcategoryElement = categoryTab.querySelector('.selected-subcategory');
                    if (!selectedSubcategoryElement) {
                        selectedSubcategoryElement = document.createElement('div');
                        selectedSubcategoryElement.className = 'selected-subcategory';
                        const dropdown = categoryTab.querySelector('.subcategory-dropdown');
                        categoryTab.insertBefore(selectedSubcategoryElement, dropdown);
                    }
                    selectedSubcategoryElement.textContent = subcategoryItem.textContent;
                    selectedSubcategoryElement.setAttribute('data-subcategory', subcategory);
                }
            }
            
            // Filtrera verktygen igen baserat på kategori och underkategori
            filterToolsByCategory(category, subcategory);
        }
    }
}

// Snabb uppdatering av status
async function quickUpdateStatus(toolId, newStatus) {
    const toolIndex = tools.findIndex(tool => tool.id === toolId);
    if (toolIndex !== -1) {
        // Spara nuvarande kategori och underkategori
        const currentCategory = document.querySelector('.category-tab.active')?.getAttribute('data-category');
        const currentSubcategory = document.querySelector('.subcategory-item.active')?.getAttribute('data-subcategory');
        
        const tool = tools[toolIndex];
        const oldStatus = tool.status;
        
        try {
            // Uppdatera verktygets status i Supabase
            const { error } = await supabase
                .from('tools')
                .update({ 
                    status: newStatus,
                    updated: new Date().toISOString() 
                })
                .eq('id', toolId);
                
            if (error) throw error;
            
            // Logga statusändringen i loggboken
            const logEntry = {
                action: 'update',
                type: 'tool',
                target_id: tool.name,
                user_email: currentUserEmail || 'unknown',
                details: {
                    id: tool.id,
                    oldStatus: oldStatus,
                    newStatus: newStatus,
                    timestamp: new Date().toISOString()
                }
            };
            
            const { error: logError } = await supabase
                .from('logbook')
                .insert([logEntry]);
                
            if (logError) {
                console.error('Error logging status update:', logError);
                // Fortsätt programmet även om loggningen misslyckas
            }
            
            // Uppdatera lokal array
            tools[toolIndex].status = newStatus;
            tools[toolIndex].updated = new Date().toISOString();
            
            // Rendera verktygen igen
            renderTools();
            
            // Uppdatera loggboken om den visas
            if (document.getElementById('logbook-tab').style.display !== 'none') {
                fetchLogbook();
            }
            
            // Återställ kategori och underkategori efter rendering
            restoreCategoryAndSubcategory(currentCategory, currentSubcategory);
        } catch (error) {
            console.error('Error updating tool status:', error);
            alert('Ett fel uppstod när status skulle uppdateras. Försök igen.');
        }
    }
}

// Quick update workplace function
async function quickUpdateWorkplace(toolId, newWorkplaceId) {
    // Convert IDs to strings for consistent comparison
    const toolIndex = tools.findIndex(tool => String(tool.id) === String(toolId));
    const newWorkplace = workplaces.find(wp => String(wp.id) === String(newWorkplaceId));
    
    if (toolIndex !== -1 && newWorkplace) {
        // Spara nuvarande kategori och underkategori
        const currentCategory = document.querySelector('.category-tab.active')?.getAttribute('data-category');
        const currentSubcategory = document.querySelector('.subcategory-item.active')?.getAttribute('data-subcategory');
        
        const tool = tools[toolIndex];
        const oldWorkplaceId = tool.workplaceId;
        const oldWorkplace = workplaces.find(wp => String(wp.id) === String(oldWorkplaceId));
        
        try {
            // Uppdatera verktygets arbetsplats i Supabase
            const { error } = await supabase
                .from('tools')
                .update({ 
                    workplaceId: newWorkplaceId,
                    responsible: newWorkplace.responsible,
                    updated: new Date().toISOString() 
                })
                .eq('id', toolId);
                
            if (error) throw error;
            
            // Logga arbetsplatsändringen i loggboken
            const logEntry = {
                action: 'update',
                type: 'tool',
                target_id: tool.name,
                user_email: currentUserEmail || 'unknown',
                details: {
                    id: tool.id,
                    oldWorkplace: oldWorkplace ? oldWorkplace.name : 'Okänd',
                    newWorkplace: newWorkplace.name,
                    oldWorkplaceId: oldWorkplaceId,
                    newWorkplaceId: newWorkplaceId,
                    timestamp: new Date().toISOString()
                }
            };
            
            const { error: logError } = await supabase
                .from('logbook')
                .insert([logEntry]);
                
            if (logError) {
                console.error('Error logging workplace update:', logError);
                // Fortsätt programmet även om loggningen misslyckas
            }
            
            // Uppdatera lokal array
            tools[toolIndex].workplaceId = newWorkplaceId;
            tools[toolIndex].responsible = newWorkplace.responsible;
            tools[toolIndex].updated = new Date().toISOString();
            
            // Rendera verktygen igen
            renderTools();
            
            // Uppdatera loggboken om den visas
            if (document.getElementById('logbook-tab').style.display !== 'none') {
                fetchLogbook();
            }
            
            // Återställ kategori och underkategori efter rendering
            restoreCategoryAndSubcategory(currentCategory, currentSubcategory);
        } catch (error) {
            console.error('Error updating tool workplace:', error);
            alert('Ett fel uppstod när arbetsplats skulle uppdateras. Försök igen.');
        }
    }
}

// Lägg till funktion för kategorifiltrering
function filterToolsByCategory(category, subcategory) {
    console.log(`DEBUG: Filtering tools by category: ${category}, subcategory: ${subcategory || 'none'}`);
    console.log(`DEBUG: Total tools in array: ${tools.length}`);
    
    // Special debug for lift/gips issue
    if (category === 'lift' && subcategory === 'gips') {
        console.log('DEBUG: SPECIAL CASE - Looking for lift/gips tools');
        tools.forEach(tool => {
            if (tool.category === 'lift') {
                console.log(`DEBUG: LIFT TOOL: ${tool.name}, subcategory: '${tool.subcategory || 'none'}'`);
                // Check for exact string comparison
                console.log(`DEBUG: Subcategory comparison: '${tool.subcategory}' === 'gips' : ${tool.subcategory === 'gips'}`);
                // Check for character codes to detect hidden characters
                if (tool.subcategory) {
                    console.log(`DEBUG: Character codes for subcategory: ${Array.from(tool.subcategory).map(c => c.charCodeAt(0)).join(', ')}`);
                    console.log(`DEBUG: Character codes for 'gips': ${Array.from('gips').map(c => c.charCodeAt(0)).join(', ')}`);
                }
            }
        });
    }
    
    const rows = document.querySelectorAll('#tools-list tr');
    console.log(`DEBUG: Total rows in DOM: ${rows.length}`);
    
    if (category === 'all') {
        console.log('DEBUG: Showing all tools');
        rows.forEach(row => row.style.display = '');
        return;
    }
    
    // Log tools data to understand what's happening
    tools.forEach(tool => {
        console.log(`DEBUG: Tool ${tool.name}, category: ${tool.category || 'none'}, subcategory: ${tool.subcategory || 'none'}`);
    });
    
    let visibleCount = 0;
    let hiddenCount = 0;
    
    rows.forEach(row => {
        const toolNameElement = row.querySelector('.tool-name');
        const editButton = row.querySelector('.edit-tool');
        
        if (!toolNameElement || !editButton) {
            console.log('DEBUG: Row is missing required elements');
            row.style.display = 'none';
            hiddenCount++;
            return;
        }
        
        const toolId = editButton.getAttribute('data-id');
        const toolName = toolNameElement.textContent;
        const tool = tools.find(t => String(t.id) === String(toolId));
        
        if (!tool) {
            console.log(`DEBUG: Could not find tool with ID: ${toolId}, name: ${toolName}`);
            row.style.display = 'none';
            hiddenCount++;
            return;
        }
        
        let shouldShow = false;
        
        // Log detailed info about the current tool and filtering
        console.log(`DEBUG: Processing tool: ${tool.name}`);
        console.log(`DEBUG: Tool category: ${tool.category || 'none'}, Selected category: ${category}`);
        if (subcategory) {
            console.log(`DEBUG: Tool subcategory: ${tool.subcategory || 'none'}, Selected subcategory: ${subcategory}`);
        }
        
        // Special check for lift/gips issue
        if (category === 'lift' && subcategory === 'gips' && tool.category === 'lift') {
            console.log(`DEBUG: LIFT/GIPS CHECK - Tool: ${tool.name}`);
            console.log(`DEBUG: Tool subcategory type: ${typeof tool.subcategory}`);
            if (tool.subcategory) {
                console.log(`DEBUG: Subcategory length: ${tool.subcategory.length}`);
                console.log(`DEBUG: Trimmed comparison: '${tool.subcategory.trim()}' === 'gips' : ${tool.subcategory.trim() === 'gips'}`);
            }
        }
        
        // Om verktyget har en kategori, använd den
        if (tool.category) {
            if (subcategory) {
                // When subcategory is selected, match must be exact
                // Try with trim and case insensitive comparison to handle possible data issues
                shouldShow = (
                    tool.category.toLowerCase() === category.toLowerCase() && 
                    (tool.subcategory && tool.subcategory.trim().toLowerCase() === subcategory.toLowerCase())
                );
                console.log(`DEBUG: Category match: ${tool.category === category}, subcategory match: ${tool.subcategory === subcategory}`);
                console.log(`DEBUG: Case insensitive match: ${shouldShow}`);
            } else {
                // When only category is selected, only match on category
                shouldShow = (tool.category.toLowerCase() === category.toLowerCase());
                console.log(`DEBUG: Category only match: ${shouldShow}`);
            }
        } 
        // Fallback till den gamla metoden med nyckelord endast om verktyget inte har en kategori
        else {
            console.log(`DEBUG: Using keyword matching for tool: ${tool.name}`);
            const toolNameLower = tool.name.toLowerCase();
            
            if (subcategory) {
                shouldShow = toolNameLower.includes(subcategory.toLowerCase());
                console.log(`DEBUG: Subcategory keyword match: ${shouldShow}`);
            } else {
                switch(category) {
                    case 'bodar':
                        shouldShow = toolNameLower.includes('bod') || 
                                  toolNameLower.includes('kontor') || 
                                  toolNameLower.includes('toalett') ||
                                  toolNameLower.includes('wc');
                        break;
                    case 'byggmaskiner':
                        shouldShow = toolNameLower.includes('maskin') || 
                                  toolNameLower.includes('såg') || 
                                  toolNameLower.includes('borr') ||
                                  toolNameLower.includes('slip') ||
                                  toolNameLower.includes('spikpistol');
                        break;
                    case 'el':
                        shouldShow = toolNameLower.includes('el') || 
                                  toolNameLower.includes('klimat') || 
                                  toolNameLower.includes('fläkt') ||
                                  toolNameLower.includes('värmare');
                        break;
                    case 'skalskydd':
                        shouldShow = toolNameLower.includes('lås') || 
                                  toolNameLower.includes('larm') || 
                                  toolNameLower.includes('kamera') ||
                                  toolNameLower.includes('grind') ||
                                  toolNameLower.includes('staket') ||
                                  toolNameLower.includes('säkerhet') ||
                                  toolNameLower.includes('bevakning');
                        break;
                    case 'lift':
                        shouldShow = toolNameLower.includes('lift') || 
                                  toolNameLower.includes('hiss') || 
                                  toolNameLower.includes('plattform') ||
                                  toolNameLower.includes('lyft');
                        break;
                    case 'jarnvaror':
                        shouldShow = toolNameLower.includes('järn') || 
                                  toolNameLower.includes('stål') || 
                                  toolNameLower.includes('metall') ||
                                  toolNameLower.includes('spik') ||
                                  toolNameLower.includes('skruv');
                        break;
                    default:
                        shouldShow = false;
                }
                console.log(`DEBUG: Category keyword match for ${category}: ${shouldShow}`);
            }
        }
        
        // Final decision
        console.log(`DEBUG: Final decision for ${tool.name}: ${shouldShow ? 'SHOW' : 'HIDE'}`);
        row.style.display = shouldShow ? '' : 'none';
        
        if (shouldShow) {
            visibleCount++;
        } else {
            hiddenCount++;
        }
    });
    
    console.log(`DEBUG: Final counts - Visible: ${visibleCount}, Hidden: ${hiddenCount}, Total: ${visibleCount + hiddenCount}`);
}

// Funktion för att uppdatera underkategorier baserat på vald kategori
function updateSubcategories(category) {
    const subcategorySelect = document.getElementById('tool-subcategory');
    subcategorySelect.innerHTML = '<option value="">Välj underkategori</option>';
    
    let subcategories = [];
    
    switch(category) {
        case 'bodar':
            subcategories = [
                { value: 'pentry', text: 'Pentry/kök' },
                { value: 'omkladning', text: 'Omklädningsrum' },
                { value: 'kontor', text: 'Kontorsmaterial' },
                { value: 'toalett', text: 'Toalettmaterial' }
            ];
            break;
        case 'byggmaskiner':
            subcategories = [
                { value: 'sagar', text: 'Sågar' },
                { value: 'skruv', text: 'Skruvverktyg' },
                { value: 'svets', text: 'Svetsutrustning' },
                { value: 'fras', text: 'Fräs och sliputrustning' },
                { value: 'kap', text: 'Kap och bockningsverktyg' },
                { value: 'betong', text: 'Betong och murbruksutrustning' },
                { value: 'rengoring', text: 'Rengörningsutrustning' },
                { value: 'bilning', text: 'Bilningsmaskiner' },
                { value: 'pumpar', text: 'Pumpar' },
                { value: 'mat', text: 'Mät och kontrollinstrument' },
                { value: 'spikpistoler', text: 'Spikpistoler' }
            ];
            break;
        case 'el':
            subcategories = [
                { value: 'elcentral', text: 'Elcentral' },
                { value: 'kablar', text: 'Kablar och kabelhantering' },
                { value: 'belysning', text: 'Belysning' },
                { value: 'transformator', text: 'Transformatorer' },
                { value: 'ventilation', text: 'Ventilation och kyla' },
                { value: 'avfuktning', text: 'Avfuktning' },
                { value: 'varme', text: 'Byggvärme' },
                { value: 'elverk', text: 'Elverk' }
            ];
            break;
        case 'skalskydd':
            subcategories = [
                { value: 'trafik', text: 'Trafikmaterial' },
                { value: 'staket', text: 'Staket' },
                { value: 'forsta', text: 'Första hjälpen' },
                { value: 'overvakning', text: 'Övervakning' },
                { value: 'id06', text: 'ID06' },
                { value: 'fallselar', text: 'Fallselar' },
                { value: 'skydd', text: 'Personliga skyddskläder' }
            ];
            break;
        case 'lift':
            subcategories = [
                { value: 'slingor', text: 'Slingor' },
                { value: 'vagnar', text: 'Vagnar' },
                { value: 'gips', text: 'Gipsverktyg' },
                { value: 'spannband', text: 'Spännband' }
            ];
            break;
        case 'jarnvaror':
            subcategories = [
                { value: 'handverktyg', text: 'Handverktyg' },
                { value: 'borr', text: 'Borr/mejsel' },
                { value: 'sagklingor', text: 'Sågklingor' },
                { value: 'blad', text: 'Stick/tigersågblad' },
                { value: 'skruv', text: 'Skruv' },
                { value: 'spik', text: 'Spik' },
                { value: 'ovrigt', text: 'Övrigt' }
            ];
            break;
    }
    
    subcategories.forEach(subcategory => {
        const option = document.createElement('option');
        option.value = subcategory.value;
        option.textContent = subcategory.text;
        subcategorySelect.appendChild(option);
    });
}

// Lägg till CSS-regler för att säkerställa att underkategorier alltid är synliga
const fixDropdownStyle = document.createElement('style');
fixDropdownStyle.textContent = `
    /* Åsidosätt eventuella problematiska CSS-regler */
    .subcategory-item.active {
        background-color: var(--primary-color) !important;
        color: white !important;
        padding-left: 1.25rem !important;
        order: 0 !important; /* Återställ order-egenskapen */
    }
    
    .category-tab.show-dropdown .subcategory-dropdown {
        display: block !important;
    }
    
    .category-tab.show-dropdown .subcategory-item {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
    }
`;
document.head.appendChild(fixDropdownStyle);

// Funktion för att återställa färger på underkategorier
function resetSubcategoryColors() {
    document.querySelectorAll('.subcategory-item').forEach(item => {
        if (item.classList.contains('active')) {
            item.style.color = 'white';
        } else {
            item.style.color = 'var(--dark-color)';
        }
    });
}

// Lägg till händelselyssnare för att återställa färger när dropdown-menyn öppnas
document.querySelectorAll('.category-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        if (this.classList.contains('show-dropdown')) {
            setTimeout(resetSubcategoryColors, 50);
        }
    });
});

// Starta applikationen
init();

// Add this at the end of the file after init()
setTimeout(function() {
    // Re-attach click handlers to category tabs after a delay
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function(e) {
            // Don't process clicks on subcategory items
            if (e.target.classList.contains('subcategory-item')) return;
            
            // Special handling for "Alla kategorier"
            const category = this.getAttribute('data-category');
            if (category === 'all') {
                // Clear any selected subcategory
                selectedSubcategory = null;
                // Remove all selected-subcategory elements
                document.querySelectorAll('.selected-subcategory').forEach(element => {
                    element.remove();
                });
                // Deactivate all subcategories
                document.querySelectorAll('.subcategory-item').forEach(item => {
                    item.classList.remove('active');
                });
            }
            
            // Remove active class from all categories except this one
            document.querySelectorAll('.category-tab').forEach(otherTab => {
                if (otherTab !== this) {
                    otherTab.classList.remove('active');
                }
            });
            
            // Close all other dropdowns first
            document.querySelectorAll('.category-tab').forEach(otherTab => {
                if (otherTab !== this && otherTab.classList.contains('show-dropdown')) {
                    otherTab.classList.remove('show-dropdown');
                    const otherDropdown = otherTab.querySelector('.subcategory-dropdown');
                    if (otherDropdown) {
                        otherDropdown.setAttribute('style', 'display: none !important;');
                    }
                }
            });
            
            // Toggle dropdown visibility with inline styles for maximum override
            const dropdown = tab.querySelector('.subcategory-dropdown');
            if (dropdown) {
                // Toggle show-dropdown class
                tab.classList.toggle('show-dropdown');
                
                if (tab.classList.contains('show-dropdown')) {
                    // Force visibility with inline styles
                    dropdown.setAttribute('style', 
                        'display: block !important; ' +
                        'visibility: visible !important; ' +
                        'opacity: 1 !important; ' + 
                        'position: absolute !important; ' +
                        'z-index: 99999 !important;');
                } else {
                    dropdown.setAttribute('style', 'display: none !important;');
                }
            }
            
            // Make sure this category is active
            this.classList.add('active');
            
            e.stopPropagation();
            
            // Update filtering when "Alla kategorier" is clicked
            if (category === 'all') {
                filterToolsByCategory('all');
            }
        });
    });
    
    // Handle subcategory clicks to close dropdown and set active category
    document.querySelectorAll('.subcategory-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Remove active class from all subcategories
            document.querySelectorAll('.subcategory-item').forEach(subItem => {
                subItem.classList.remove('active');
            });
            
            // Add active class to this subcategory
            this.classList.add('active');
            
            // Get parent category tab and close its dropdown
            const parentTab = this.closest('.category-tab');
            if (parentTab) {
                // Remove active class from all categories
                document.querySelectorAll('.category-tab').forEach(tab => {
                    tab.classList.remove('active');
                });
                
                // Add active class to parent category
                parentTab.classList.add('active');
                
                // Close dropdown
                parentTab.classList.remove('show-dropdown');
                const dropdown = parentTab.querySelector('.subcategory-dropdown');
                if (dropdown) {
                    dropdown.setAttribute('style', 'display: none !important;');
                }
            }
        });
    });
    
    // Handle clicks outside categories to close dropdowns
    document.addEventListener('click', function(e) {
        // Check if click was on a category tab or its children
        if (!e.target.closest('.category-tab')) {
            // Close all dropdowns
            document.querySelectorAll('.category-tab.show-dropdown').forEach(tab => {
                tab.classList.remove('show-dropdown');
                const dropdown = tab.querySelector('.subcategory-dropdown');
                if (dropdown) {
                    dropdown.setAttribute('style', 'display: none !important;');
                }
            });
        }
    });
}, 1000);

// Funktion för att hämta loggbok från Supabase
async function fetchLogbook() {
    try {
        const { data: logbookData, error } = await supabase
            .from('logbook')
            .select('*')
            .order('timestamp', { ascending: false });
            
        if (error) throw error;
        
        // Spara loggbok i global variabel
        window.logbook = logbookData;
        
        // Rendera loggbok
        renderLogbook();
    } catch (error) {
        console.error('Error fetching logbook:', error);
        alert('Ett fel uppstod när loggboken skulle hämtas. Försök igen.');
    }
}

// Funktion för att rendera loggbok
function renderLogbook() {
    const logbookList = document.getElementById('logbook-list');
    const searchTerm = document.getElementById('search-log-input').value.toLowerCase();
    const typeFilter = document.getElementById('log-type-filter').value;
    const actionFilter = document.getElementById('log-action-filter').value;
    
    // Rensa listan
    logbookList.innerHTML = '';
    
    // Filtrera loggbok baserat på sökterm och filter
    let filteredLogbook = window.logbook || [];
    
    if (typeFilter !== 'all') {
        filteredLogbook = filteredLogbook.filter(entry => entry.type === typeFilter);
    }
    
    if (actionFilter !== 'all') {
        filteredLogbook = filteredLogbook.filter(entry => entry.action === actionFilter);
    }
    
    if (searchTerm) {
        filteredLogbook = filteredLogbook.filter(entry => 
            entry.target_id.toLowerCase().includes(searchTerm) ||
            (entry.details && JSON.stringify(entry.details).toLowerCase().includes(searchTerm)) ||
            (entry.user_email && entry.user_email.toLowerCase().includes(searchTerm))
        );
    }
    
    // Lägg till loggposter i listan
    filteredLogbook.forEach(entry => {
        const row = document.createElement('tr');
        
        // Formatera tidpunkt
        const timestamp = new Date(entry.timestamp);
        const formattedDate = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')} ${String(timestamp.getHours()).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}`;
        
        // Översätt åtgärd till svenska
        let actionText = '';
        switch(entry.action) {
            case 'create': actionText = 'Skapad'; break;
            case 'update': actionText = 'Uppdaterad'; break;
            case 'delete': actionText = 'Borttagen'; break;
            default: actionText = entry.action;
        }
        
        // Översätt typ till svenska
        let typeText = '';
        switch(entry.type) {
            case 'tool': typeText = 'Verktyg'; break;
            case 'workplace': typeText = 'Arbetsplats'; break;
            default: typeText = entry.type;
        }
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${actionText}</td>
            <td>${typeText}</td>
            <td>${entry.target_id}</td>
            <td>${entry.user_email || 'Okänd'}</td>
            <td>
                <button class="btn btn-small view-details" data-id="${entry.id}">Visa detaljer</button>
            </td>
        `;
        
        logbookList.appendChild(row);
    });
    
    // Lägg till händelselyssnare för detaljknappar
    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', () => showLogDetails(btn.getAttribute('data-id')));
    });
}

// Funktion för att visa loggdetaljer
function showLogDetails(id) {
    const entry = window.logbook.find(e => e.id === id);
    if (!entry) return;
    
    const logDetailsModal = document.getElementById('log-details-modal');
    
    document.getElementById('log-id').textContent = entry.id;
    document.getElementById('log-timestamp').textContent = new Date(entry.timestamp).toLocaleString('sv-SE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const actionTranslations = {
        'create': 'Skapad',
        'update': 'Uppdaterad',
        'delete': 'Borttagen'
    };
    document.getElementById('log-action').textContent = actionTranslations[entry.action] || entry.action;
    
    const typeTranslations = {
        'tool': 'Verktyg',
        'workplace': 'Arbetsplats'
    };
    document.getElementById('log-type').textContent = typeTranslations[entry.type] || entry.type;
    
    // Visa objektnamn om det finns, annars visa ID
    document.getElementById('log-object').textContent = entry.target_id;
    
    // Visa användarens e-post om det finns
    document.getElementById('log-user').textContent = entry.user_email || 'Okänd';
    
    // Formatera JSON-data snyggt
    if (entry.details) {
        const formattedJson = JSON.stringify(entry.details, null, 2)
            .replace(/[{]/g, '{\n  ')
            .replace(/[}]/g, '\n}')
            .replace(/,/g, ',\n  ');
        document.getElementById('log-details-json').textContent = formattedJson;
        document.getElementById('log-details-json').parentElement.style.display = 'block';
    } else {
        document.getElementById('log-details-json').parentElement.style.display = 'none';
    }
    
    // Visa modal
    logDetailsModal.style.display = 'block';
}

// Lägg till händelselyssnare för loggbok
document.addEventListener('DOMContentLoaded', function() {
    // Hämta loggbok när sidan laddas
    fetchLogbook();
    
    // Lägg till händelselyssnare för sökning och filtrering
    document.getElementById('search-log-btn').addEventListener('click', renderLogbook);
    document.getElementById('search-log-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            renderLogbook();
        }
    });
    
    document.getElementById('log-type-filter').addEventListener('change', renderLogbook);
    document.getElementById('log-action-filter').addEventListener('change', renderLogbook);
    
    // Lägg till händelselyssnare för sortering
    document.querySelectorAll('#logbook-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.getAttribute('data-sort');
            const currentDirection = th.getAttribute('data-direction') || 'asc';
            const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
            
            // Uppdatera sorteringsriktning
            document.querySelectorAll('#logbook-table th[data-sort]').forEach(header => {
                header.setAttribute('data-direction', '');
                header.textContent = header.textContent.replace(' ↑', '').replace(' ↓', '');
            });
            
            th.setAttribute('data-direction', newDirection);
            th.textContent += newDirection === 'asc' ? ' ↑' : ' ↓';
            
            // Sortera loggbok
            if (window.logbook) {
                window.logbook.sort((a, b) => {
                    let valueA = a[column];
                    let valueB = b[column];
                    
                    // Handle null or undefined values
                    if (valueA === null || valueA === undefined) valueA = '';
                    if (valueB === null || valueB === undefined) valueB = '';
                    
                    // Hantera tidstämpel
                    if (column === 'timestamp') {
                        valueA = new Date(valueA);
                        valueB = new Date(valueB);
                    } else if (typeof valueA === 'string' && typeof valueB === 'string') {
                        // Case-insensitive string comparison for text columns
                        valueA = valueA.toLowerCase();
                        valueB = valueB.toLowerCase();
                    }
                    
                    // Jämför värden
                    if (valueA < valueB) return newDirection === 'asc' ? -1 : 1;
                    if (valueA > valueB) return newDirection === 'asc' ? 1 : -1;
                    return 0;
                });
                
                renderLogbook();
            }
        });
    });
    
    // Lägg till händelselyssnare för att stänga loggdetaljer-modal
    document.querySelector('#log-details-modal .close').addEventListener('click', () => {
        document.getElementById('log-details-modal').style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        const logDetailsModal = document.getElementById('log-details-modal');
        if (e.target === logDetailsModal) {
            logDetailsModal.style.display = 'none';
        }
    });
});

// Add event listener to close the comment modal
document.addEventListener('DOMContentLoaded', function() {
    // Close comment modal when X button is clicked
    const commentCloseBtn = document.querySelector('#comment-modal .close');
    if (commentCloseBtn) {
        commentCloseBtn.addEventListener('click', closeCommentModal);
    }
    
    // Close comment modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === commentModal) {
            closeCommentModal();
        }
    });
    
    // ... existing DOMContentLoaded code ...
});

