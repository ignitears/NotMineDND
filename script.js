// --- Character Management State ---
let charList = JSON.parse(localStorage.getItem('dnd_char_list_master')) || ['Hero'];
let activeChar = localStorage.getItem('dnd_active_char_master') || charList[0];
let prefix = `dnd_v5_${activeChar}_`;

window.onload = function() {
    initTheme();
    loadActiveCharacter();
    renderCharList();
    setupTooltips();
};

// --- Tab Switching ---
const tabs = document.querySelectorAll('.tabs .tab');
const tabContents = document.querySelectorAll('.tab-content');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.add('active');
    });
});

// --- Profile Lore Drawer ---
function toggleDetails() {
    const details = document.getElementById('profile-details');
    const arrow = document.getElementById('arrow-icon');
    details.classList.toggle('open');
    if (arrow) arrow.style.transform = details.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
}

// --- Character Image Uploading ---
const imageInput = document.getElementById('image-input');
const charImage = document.getElementById('char-image');
const uploadText = document.getElementById('upload-text');
const clearImgBtn = document.getElementById('clear-img-btn');

imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            charImage.src = e.target.result;
            charImage.style.display = 'block';
            uploadText.style.display = 'none';
            clearImgBtn.style.display = 'block';
            localStorage.setItem(prefix + 'image', e.target.result);
        };
        reader.readAsDataURL(file);
    }
});

clearImgBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation(); // Prevents the file upload prompt from triggering
    charImage.src = '';
    charImage.style.display = 'none';
    uploadText.style.display = 'block';
    clearImgBtn.style.display = 'none';
    imageInput.value = '';
    localStorage.removeItem(prefix + 'image');
});


// --- Mathematical Engine (Not Mine DnD Formulas) ---
function calculateAll() {
    const weaponBase = parseFloat(document.getElementById('weapon-base').value) || 0;
    const spellBase = parseFloat(document.getElementById('spell-base').value) || 0;
    const d20 = parseFloat(document.getElementById('d20-roll').value) || 0;

    const str = parseFloat(document.getElementById('strength').value) || 0;
    const spd = parseFloat(document.getElementById('speed').value) || 0;
    const end = parseFloat(document.getElementById('endurance').value) || 0;
    const con = parseFloat(document.getElementById('constitution').value) || 0;

    const dex = parseFloat(document.getElementById('dexterity').value) || 0;
    const acc = parseFloat(document.getElementById('accuracy').value) || 0;
    const forc = parseFloat(document.getElementById('forecast').value) || 0;
    const qd = parseFloat(document.getElementById('quickdraw').value) || 0;

    const cast = parseFloat(document.getElementById('casting').value) || 0;
    const sens = parseFloat(document.getElementById('sensing').value) || 0;
    const ctrl = parseFloat(document.getElementById('control').value) || 0;
    const manaSup = parseFloat(document.getElementById('mana-supply').value) || 0;

    // Crit Status
    const critStatus = document.getElementById('crit-status');
    if (d20 === 20) {
        critStatus.innerText = "⭐ CRITICAL SUCCESS";
        critStatus.style.color = "var(--stamina-color)";
    } else if (d20 === 1) {
        critStatus.innerText = "💀 CRITICAL FAILURE";
        critStatus.style.color = "var(--danger)";
    } else {
        critStatus.innerText = "";
    }

    // Formulas
    const mult = d20 <= 1 ? 0.5 : d20 <= 9 ? 0.75 : d20 <= 11 ? 1 : d20 <= 15 ? 1.5 : d20 <= 19 ? 1.75 : 2;
    const damage = weaponBase * ((0.5 * str) + 1) * mult;
    const magicDmg = spellBase * ((0.5 * cast) + 1);
    const extraForecast = 10 * ((0.05 * forc) + 1) * d20;
    const dodgeScore = (10 * ((0.1 * dex) + 1) * d20) + extraForecast;
    const hitScore = (10 * ((0.1 * acc) + 1) * d20) + extraForecast;
    const manaCost = spellBase * ((100 - ctrl) / 100);

    // Vitals Base Values
    const baseHp = 100 * ((0.5 * con) + 1);
    const baseStamina = 100 * ((0.2 * end) + 1);
    const baseMana = 100 * ((0.2 * manaSup) + 1);

    // Vitals Bonus Integrations
    const bonusHp = parseFloat(document.getElementById('bonus-hp').value) || 0;
    const bonusPctHp = parseFloat(document.getElementById('bonus-pct-hp').value) || 0;
    
    const bonusStam = parseFloat(document.getElementById('bonus-stamina').value) || 0;
    const bonusPctStam = parseFloat(document.getElementById('bonus-pct-stamina').value) || 0;
    
    const bonusManaVal = parseFloat(document.getElementById('bonus-mana').value) || 0;
    const bonusPctMana = parseFloat(document.getElementById('bonus-pct-mana').value) || 0;

    // Scaled Maximum Vitals
    const maxHp = (baseHp + bonusHp) * (1 + (bonusPctHp / 100));
    const maxStamina = (baseStamina + bonusStam) * (1 + (bonusPctStam / 100));
    const maxMana = (baseMana + bonusManaVal) * (1 + (bonusPctMana / 100));

    const distance = 10 * ((0.2 * spd) + 1);
    const carryCap = 50 + (str * 5);
    const actions = 1 + Math.floor(dex / 20);
    const sensingRange = sens * 30;
    const initBonus = qd <= 20 ? 2 : qd <= 40 ? 4 : qd <= 60 ? 6 : qd <= 80 ? 8 : 10;

    // Write Values
    document.getElementById('max-hp-display').value = maxHp.toFixed(0);
    document.getElementById('max-stamina-display').value = maxStamina.toFixed(0);
    document.getElementById('max-mana-display').value = maxMana.toFixed(0);

    document.getElementById('res-damage').innerText = damage.toFixed(2);
    document.getElementById('res-magic').innerText = magicDmg.toFixed(2);
    document.getElementById('res-hit').innerText = hitScore.toFixed(2);
    document.getElementById('res-dodge').innerText = dodgeScore.toFixed(2);
    document.getElementById('res-cost').innerText = manaCost.toFixed(2);
    document.getElementById('res-forecast').innerText = extraForecast.toFixed(2);

    document.getElementById('res-actions').innerText = actions;
    document.getElementById('res-distance').innerText = distance.toFixed(1);
    document.getElementById('res-init').innerText = initBonus;
    document.getElementById('res-carry').innerText = carryCap;
    document.getElementById('res-sense').innerText = sensingRange;

    // Update Top-Border Visual Progress Bars
    updateVitalsVisuals(maxHp, maxStamina, maxMana);

    // Nerd Tab Breakdown
    document.getElementById('dm-math').innerHTML = `
        <p><strong>Physical Damage:</strong> ${weaponBase} * ((0.5 * ${str}) + 1) * ${mult} = ${damage.toFixed(2)}</p>
        <p><strong>Magic Damage:</strong> ${spellBase} * ((0.5 * ${cast}) + 1) = ${magicDmg.toFixed(2)}</p>
        <p><strong>Hit Score:</strong> [10 * ((0.1 * ${acc}) + 1) * ${d20}] + ${extraForecast.toFixed(2)} = ${hitScore.toFixed(2)}</p>
        <p><strong>Dodge Score:</strong> [10 * ((0.1 * ${dex}) + 1) * ${d20}] + ${extraForecast.toFixed(2)} = ${dodgeScore.toFixed(2)}</p>
        <p><strong>Max HP:</strong> (${baseHp.toFixed(2)} Base + ${bonusHp}) * ${1 + (bonusPctHp/100)} = ${maxHp.toFixed(2)}</p>
        <p><strong>Max Stamina:</strong> (${baseStamina.toFixed(2)} Base + ${bonusStam}) * ${1 + (bonusPctStam/100)} = ${maxStamina.toFixed(2)}</p>
        <p><strong>Max Mana:</strong> (${baseMana.toFixed(2)} Base + ${bonusManaVal}) * ${1 + (bonusPctMana/100)} = ${maxMana.toFixed(2)}</p>
        <p><strong>Mana Cost:</strong> ${spellBase} * ((100 - ${ctrl}) / 100) = ${manaCost.toFixed(2)}</p>
    `;
}

function updateVitalsVisuals(maxHp, maxStam, maxMana) {
    const curHp = parseFloat(document.getElementById('current-hp').value) || 0;
    const curStam = parseFloat(document.getElementById('current-stamina').value) || 0;
    const curMana = parseFloat(document.getElementById('current-mana').value) || 0;

    const hpPct = Math.min(Math.max((curHp / maxHp) * 100, 0), 100);
    const stamPct = Math.min(Math.max((curStam / maxStam) * 100, 0), 100);
    const manaPct = Math.min(Math.max((curMana / maxMana) * 100, 0), 100);

    document.getElementById('hp-box').style.setProperty('--hp-pct', `${hpPct}%`);
    document.getElementById('stamina-box').style.setProperty('--stam-pct', `${stamPct}%`);
    document.getElementById('mana-box').style.setProperty('--mana-pct', `${manaPct}%`);
}

// In-Page Dice Roller
function rollDice() {
    const rollInput = document.getElementById('d20-roll');
    const btn = document.getElementById('dice-btn');
    btn.disabled = true;

    let rolls = 0;
    const interval = setInterval(() => {
        rollInput.value = Math.floor(Math.random() * 20) + 1;
        rolls++;
        if (rolls > 12) {
            clearInterval(interval);
            const finalRoll = Math.floor(Math.random() * 20) + 1;
            rollInput.value = finalRoll;
            localStorage.setItem(prefix + 'd20-roll', finalRoll);
            btn.disabled = false;
            calculateAll();
        }
    }, 40);
}

// Rest Mechanics
function longRest() {
    const maxHp = parseFloat(document.getElementById('max-hp-display').value) || 100;
    const maxStam = parseFloat(document.getElementById('max-stamina-display').value) || 100;
    const maxMana = parseFloat(document.getElementById('max-mana-display').value) || 100;

    document.getElementById('current-hp').value = maxHp;
    document.getElementById('current-stamina').value = maxStam;
    document.getElementById('current-mana').value = maxMana;

    localStorage.setItem(prefix + 'current-hp', maxHp);
    localStorage.setItem(prefix + 'current-stamina', maxStam);
    localStorage.setItem(prefix + 'current-mana', maxMana);

    calculateAll();
}

function shortRest() {
    const maxHp = parseFloat(document.getElementById('max-hp-display').value) || 100;
    const maxStam = parseFloat(document.getElementById('max-stamina-display').value) || 100;
    const maxMana = parseFloat(document.getElementById('max-mana-display').value) || 100;

    const curHp = parseFloat(document.getElementById('current-hp').value) || 0;
    const curStam = parseFloat(document.getElementById('current-stamina').value) || 0;
    const curMana = parseFloat(document.getElementById('current-mana').value) || 0;

    const newHp = Math.min(maxHp, curHp + Math.floor(maxHp * 0.25));
    const newStam = Math.min(maxStam, curStam + Math.floor(maxStam * 0.25));
    const newMana = Math.min(maxMana, curMana + Math.floor(maxMana * 0.25));

    document.getElementById('current-hp').value = newHp;
    document.getElementById('current-stamina').value = newStam;
    document.getElementById('current-mana').value = newMana;

    localStorage.setItem(prefix + 'current-hp', newHp);
    localStorage.setItem(prefix + 'current-stamina', newStam);
    localStorage.setItem(prefix + 'current-mana', newMana);

    calculateAll();
}

// --- Basic Item Inventory Management ---
function addInventoryItem(saved = null) {
    const list = document.getElementById('inventory-list');
    const div = document.createElement('div');
    div.className = 'inventory-item';
    div.innerHTML = `
        <input type="text" class="inv-name" placeholder="Item Name..." value="${saved ? saved.name : ''}" oninput="saveInventory()">
        <input type="number" class="inv-qty" placeholder="Qty" value="${saved ? saved.qty : '1'}" oninput="saveInventory()">
        <button class="small-btn del" onclick="this.parentElement.remove(); saveInventory();">✕</button>
    `;
    list.appendChild(div);
    saveInventory();
}

function saveInventory() {
    const items = [];
    document.querySelectorAll('.inventory-item').forEach(item => {
        items.push({
            name: item.querySelector('.inv-name').value,
            qty: item.querySelector('.inv-qty').value
        });
    });
    localStorage.setItem(prefix + 'inventory', JSON.stringify(items));
}

function loadInventory() {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    const raw = localStorage.getItem(prefix + 'inventory');
    if (!raw) return;
    JSON.parse(raw).forEach(item => addInventoryItem(item));
}

// --- Inputs Data Hooking ---
function loadActiveCharacter() {
    prefix = `dnd_v5_${activeChar}_`;
    document.querySelectorAll('[data-save="true"]').forEach(input => {
        const val = localStorage.getItem(prefix + input.id);
        if (val !== null) input.value = val;
        input.oninput = () => {
            localStorage.setItem(prefix + input.id, input.value);
            if (input.id === 'name') document.getElementById('header-name').textContent = input.value || activeChar;
            calculateAll();
        };
    });

    const savedImage = localStorage.getItem(prefix + 'image');
    if (savedImage) {
        charImage.src = savedImage;
        charImage.style.display = 'block';
        uploadText.style.display = 'none';
        clearImgBtn.style.display = 'block';
    } else {
        charImage.src = '';
        charImage.style.display = 'none';
        uploadText.style.display = 'block';
        clearImgBtn.style.display = 'none';
    }

    document.getElementById('header-name').textContent = document.getElementById('name').value || activeChar;
    loadInventory();
    calculateAll();
}

// --- Side Drawer & Revamped Character Management ---
function toggleCharDrawer() {
    document.getElementById('char-drawer').classList.toggle('open');
}

function renderCharList() {
    const container = document.getElementById('char-list');
    container.innerHTML = '';

    charList.forEach(name => {
        const card = document.createElement('div');
        card.className = `char-card-item ${name === activeChar ? 'active' : ''}`;
        card.innerHTML = `
            <div class="char-card-top">
                <span onclick="switchCharacter('${name}')">${name}</span>
            </div>
            <div class="char-item-actions">
                <button class="small-btn" onclick="openRenamePrompt('${name}')">Rename</button>
                <button class="small-btn" onclick="exportSingleCharacter('${name}')">Export</button>
                ${charList.length > 1 ? `<button class="small-btn del" onclick="deleteCharacter('${name}')">Delete</button>` : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

function switchCharacter(name) {
    activeChar = name;
    localStorage.setItem('dnd_active_char_master', activeChar);
    loadActiveCharacter();
    renderCharList();
    toggleCharDrawer();
}

function openCreatePrompt() {
    showDialog({
        title: "New Character",
        text: "Enter name for the new profile:",
        showInput: true,
        callback: (ok, val) => {
            if (!ok || !val.trim() || charList.includes(val.trim())) return;
            const newName = val.trim();
            charList.push(newName);
            localStorage.setItem('dnd_char_list_master', JSON.stringify(charList));
            switchCharacter(newName);
        }
    });
}

function openRenamePrompt(oldName) {
    showDialog({
        title: `Rename ${oldName}`,
        text: "Enter new name:",
        showInput: true,
        callback: (ok, val) => {
            if (!ok || !val.trim() || charList.includes(val.trim())) return;
            const newName = val.trim();
            const index = charList.indexOf(oldName);
            charList[index] = newName;
            localStorage.setItem('dnd_char_list_master', JSON.stringify(charList));

            // Migrate localStorage entries
            const oldPfx = `dnd_v5_${oldName}_`;
            const newPfx = `dnd_v5_${newName}_`;
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(oldPfx)) {
                    localStorage.setItem(key.replace(oldPfx, newPfx), localStorage.getItem(key));
                    localStorage.removeItem(key);
                }
            });

            if (activeChar === oldName) activeChar = newName;
            localStorage.setItem('dnd_active_char_master', activeChar);
            loadActiveCharacter();
            renderCharList();
        }
    });
}

function deleteCharacter(name) {
    showDialog({
        title: "Delete Profile",
        text: `Permanently delete profile ${name}?`,
        showInput: false,
        callback: (ok) => {
            if (!ok) return;
            charList = charList.filter(c => c !== name);
            localStorage.setItem('dnd_char_list_master', JSON.stringify(charList));

            const delPfx = `dnd_v5_${name}_`;
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(delPfx)) localStorage.removeItem(key);
            });

            if (activeChar === name) activeChar = charList[0];
            localStorage.setItem('dnd_active_char_master', activeChar);
            loadActiveCharacter();
            renderCharList();
        }
    });
}

// Single Character Export
function exportSingleCharacter(name) {
    const singleData = {};
    const targetPfx = `dnd_v5_${name}_`;
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(targetPfx)) singleData[key] = localStorage.getItem(key);
    });

    const blob = new Blob([JSON.stringify({ name, data: singleData }, null, 2)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}_character.json`;
    a.click();
}

// Single Character Import
function importSingleCharacter(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (parsed.name && parsed.data) {
                if (!charList.includes(parsed.name)) charList.push(parsed.name);
                localStorage.setItem('dnd_char_list_master', JSON.stringify(charList));
                Object.keys(parsed.data).forEach(k => localStorage.setItem(k, parsed.data[k]));
                switchCharacter(parsed.name);
            }
        } catch (err) {
            alert("Invalid Character file.");
        }
    };
    reader.readAsText(file);
}

// Export All
function exportAllCharacters() {
    const allData = { charList, activeChar, store: {} };
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('dnd_v5_')) allData.store[key] = localStorage.getItem(key);
    });

    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `all_characters_backup.json`;
    a.click();
}

// --- Theme Logic (7 Specified Themes) ---
function initTheme() {
    const saved = localStorage.getItem('dnd_selected_theme') || 'default';
    setTheme(saved, getThemeLabel(saved));
}
function toggleThemeDropdown() {
    document.getElementById('theme-dropdown').classList.toggle('open');
}
function selectTheme(theme, label) {
    setTheme(theme, label);
    document.getElementById('theme-dropdown').classList.remove('open');
}
function setTheme(theme, label) {
    document.body.className = theme === 'default' ? '' : `theme-${theme}`;
    localStorage.setItem('dnd_selected_theme', theme);
    document.querySelector('#theme-dropdown .theme-toggle').textContent = label;
}
function getThemeLabel(theme) {
    const map = {
        'default': 'Default Dark',
        'default-light': 'Default Light',
        'proxy': 'Proxy Terminal',
        'playful-earth': 'Playful Earth',
        'cyber': 'Cyber Futuristic',
        'hallowed-mist': 'Hallowed Mist',
        'industrial': 'Industrial Grunge'
    };
    return map[theme] || 'Default Dark';
}

// Tooltips
function setupTooltips() {
    const tip = document.createElement('div');
    tip.className = 'custom-tooltip';
    document.body.appendChild(tip);

    document.addEventListener('mouseover', e => {
        const el = e.target.closest('[data-tooltip]');
        if (el) {
            tip.textContent = el.getAttribute('data-tooltip');
            tip.classList.add('show');
        }
    });
    document.addEventListener('mousemove', e => {
        if (tip.classList.contains('show')) {
            tip.style.left = e.pageX + 'px';
            tip.style.top = (e.pageY - 15) + 'px';
        }
    });
    document.addEventListener('mouseout', e => {
        if (e.target.closest('[data-tooltip]')) tip.classList.remove('show');
    });
}

// System Dialog (Replaces prompt/confirm)
let dialogCb = null;
function showDialog(opts) {
    document.getElementById('dialog-title').innerText = opts.title || "Alert";
    document.getElementById('dialog-text').innerText = opts.text || "";
    const input = document.getElementById('dialog-input');
    input.value = "";
    input.style.display = opts.showInput ? "block" : "none";
    document.getElementById('custom-dialog').classList.add('show');
    dialogCb = opts.callback;
}
document.getElementById('dialog-confirm-btn').onclick = () => {
    document.getElementById('custom-dialog').classList.remove('show');
    if (dialogCb) dialogCb(true, document.getElementById('dialog-input').value);
};
document.getElementById('dialog-cancel-btn').onclick = () => {
    document.getElementById('custom-dialog').classList.remove('show');
    if (dialogCb) dialogCb(false, null);
};