let allVerbs = [];
let filteredVerbs = [];
let currentTheme = 'dark';

const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const verbsTableBody = document.getElementById('verbsTableBody');
const verbCount = document.getElementById('verbCount');
const noResults = document.getElementById('noResults');
const verbsSection = document.querySelector('.verbs-section');

document.addEventListener('DOMContentLoaded', async () => {
    initializeTheme();
    setupEventListeners();
    setupMobileOptimizations();
    await loadVerbs();
    displayVerbs(allVerbs);
});

function setupMobileOptimizations() {
    if (isMobileDevice()) {
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        document.body.classList.add('mobile-device');
        
        document.addEventListener('touchstart', () => {}, { passive: true });
        document.addEventListener('touchmove', () => {}, { passive: true });
    }
    
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            window.scrollTo(0, 0);
            displayVerbs(filteredVerbs, searchInput.value.toLowerCase().trim());
        }, 100);
    });
    
    window.addEventListener('resize', debounce(() => {
        displayVerbs(filteredVerbs, searchInput.value.toLowerCase().trim());
    }, 250));
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    currentTheme = savedTheme;
    
    if (currentTheme === 'light') {
        document.body.classList.remove('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

function toggleTheme() {
    if (currentTheme === 'dark') {
        currentTheme = 'light';
        document.body.classList.remove('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        currentTheme = 'dark';
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    localStorage.setItem('theme', currentTheme);
}

function setupEventListeners() {
    themeToggle.addEventListener('click', toggleTheme);
    
    searchInput.addEventListener('input', debouncedSearch);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            clearSearchInput();
        }
        if (e.key === 'Enter') {
            searchInput.blur();
        }
    });
    
    clearSearch.addEventListener('click', clearSearchInput);
    clearSearch.addEventListener('touchstart', (e) => {
        e.preventDefault();
        clearSearchInput();
    }, { passive: false });
    
    if (isMobileDevice()) {
        let startX = 0;
        let startY = 0;
        
        const tableContainer = document.querySelector('.table-container');
        
        tableContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        tableContainer.addEventListener('touchmove', (e) => {
            if (!startX || !startY) return;
            
            const diffX = startX - e.touches[0].clientX;
            const diffY = startY - e.touches[0].clientY;
            
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
                tableContainer.style.cursor = 'grabbing';
            }
        }, { passive: true });
        
        tableContainer.addEventListener('touchend', () => {
            startX = 0;
            startY = 0;
            tableContainer.style.cursor = 'default';
        }, { passive: true });
        
        searchInput.addEventListener('focus', () => {
            setTimeout(() => {
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
        
        if ('vibrate' in navigator) {
            themeToggle.addEventListener('click', () => {
                navigator.vibrate(50);
            });
            
            clearSearch.addEventListener('click', () => {
                navigator.vibrate(30);
            });
        }
    }
}

async function loadVerbs() {
    try {
        const response = await fetch('verbs.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allVerbs = await response.json();
        filteredVerbs = [...allVerbs];
        console.log(`Loaded ${allVerbs.length} irregular verbs`);
    } catch (error) {
        console.error('Error loading verbs:', error);
        showError('Failed to load irregular verbs. Please check if verbs.json file exists.');
    }
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm) {
        clearSearch.classList.add('visible');
    } else {
        clearSearch.classList.remove('visible');
    }
    
    if (searchTerm === '') {
        filteredVerbs = [...allVerbs];
    } else {
        filteredVerbs = allVerbs.filter(verb => {
            return verb.v1.toLowerCase().includes(searchTerm) ||
                   verb.v2.toLowerCase().includes(searchTerm) ||
                   verb.v3.toLowerCase().includes(searchTerm) ||
                   verb.translation.toLowerCase().includes(searchTerm);
        });
    }
    
    displayVerbs(filteredVerbs, searchTerm);
    updateVerbCount(filteredVerbs.length);
}

function clearSearchInput() {
    searchInput.value = '';
    clearSearch.classList.remove('visible');
    filteredVerbs = [...allVerbs];
    displayVerbs(filteredVerbs);
    updateVerbCount(filteredVerbs.length);
    searchInput.focus();
}

function displayVerbs(verbs, searchTerm = '') {
    if (verbs.length === 0) {
        showNoResults();
        return;
    }
    
    hideNoResults();
    
    verbsTableBody.innerHTML = '';
    
    verbs.forEach((verb, index) => {
        const row = createVerbRow(verb, searchTerm, index);
        verbsTableBody.appendChild(row);
    });
}

function createVerbRow(verb, searchTerm = '', index = 0) {
    const row = document.createElement('tr');
    
    const highlightText = (text, term) => {
        if (!term) return text;
        const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    };
    
    const shouldHideTranslation = window.innerWidth < 450;
    
    if (shouldHideTranslation) {
        row.innerHTML = `
            <td class="verb-cell verb-infinitive">${highlightText(verb.v1, searchTerm)}</td>
            <td class="verb-cell verb-past">${highlightText(verb.v2, searchTerm)}</td>
            <td class="verb-cell verb-participle">${highlightText(verb.v3, searchTerm)}</td>
        `;
    } else {
        row.innerHTML = `
            <td class="verb-cell verb-infinitive">${highlightText(verb.v1, searchTerm)}</td>
            <td class="verb-cell verb-past">${highlightText(verb.v2, searchTerm)}</td>
            <td class="verb-cell verb-participle">${highlightText(verb.v3, searchTerm)}</td>
            <td class="verb-cell verb-translation">${highlightText(verb.translation, searchTerm)}</td>
        `;
    }
    
    return row;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateVerbCount(count) {
    verbCount.textContent = count;
}

function showNoResults() {
    noResults.style.display = 'flex';
    verbsSection.style.display = 'none';
}

function hideNoResults() {
    noResults.style.display = 'none';
    verbsSection.style.display = 'block';
}

function showError(message) {
    verbsTableBody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 2rem; color: var(--danger-color);">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                <strong>Error:</strong> ${message}
            </td>
        </tr>
    `;
}

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTheme();
    }
});

let placeholderIndex = 0;
const placeholders = [
    'Search for irregular verbs...',
    'Try "go", "went", "gone"...',
    'Search by translation...',
    'Find "быть", "иметь", "делать"...',
    'Type any verb form...'
];

function animatePlaceholder() {
    if (document.activeElement !== searchInput && searchInput.value === '') {
        searchInput.placeholder = placeholders[placeholderIndex];
        placeholderIndex = (placeholderIndex + 1) % placeholders.length;
    }
}

setInterval(animatePlaceholder, 3000);

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedSearch = debounce(handleSearch, 150);

function smoothScrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

document.querySelector('.title').addEventListener('click', smoothScrollToTop);

const originalDisplayVerbs = displayVerbs;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        console.log('Service Worker support detected');
    });
}

function trackSearchPattern(searchTerm) {
    if (searchTerm && searchTerm.length > 2) {
        const searches = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        searches.push({
            term: searchTerm,
            timestamp: Date.now(),
            results: filteredVerbs.length
        });
        
        if (searches.length > 50) {
            searches.splice(0, searches.length - 50);
        }
        
        localStorage.setItem('searchHistory', JSON.stringify(searches));
    }
}

const originalHandleSearch = handleSearch;
handleSearch = function(e) {
    originalHandleSearch(e);
    const searchTerm = e.target.value.toLowerCase().trim();
    if (searchTerm) {
        trackSearchPattern(searchTerm);
    }
};

console.log(`
🎉 Irregular Verbs Dictionary loaded successfully!
📚 ${allVerbs.length || 200} verbs available
🔍 Search functionality ready
🎨 Theme switching enabled
⌨️  Keyboard shortcuts:
   • Ctrl/Cmd + K: Focus search
   • Ctrl/Cmd + Shift + T: Toggle theme
   • Escape: Clear search
`);

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadVerbs,
        handleSearch,
        toggleTheme,
        displayVerbs,
        clearSearchInput
    };
}