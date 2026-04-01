let currentInventory = [];
let currentCharacter = null; 

window.onload = function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('theme-toggle').innerText = '🌙 Dark Mode';
    }

    renderCharacters(); 

    const inputs = document.querySelectorAll('.dashboard input[type="number"]');
    inputs.forEach(input => {
        const savedValue = localStorage.getItem(input.id);
        if (savedValue !== null) input.value = savedValue;
        input.addEventListener('input', () => {
            localStorage.setItem(input.id, input.value);
            calculateAll();
        });
    });
    
    const savedInv = localStorage.getItem('current_inventory');
    if (savedInv) currentInventory = JSON.parse(savedInv);
    
    renderInventory();
    calculateAll();
};

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    document.getElementById('theme-toggle').innerText = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
}

function rollDice() {
    const btn = document.getElementById('dice-button');
    const input = document.getElementById('d20-roll');
    
    btn.disabled = true;
    btn.classList.add('rolling');

    let rolls = 0;
    const rollInterval = setInterval(() => {
        input.value = Math.floor(Math.random() * 20) + 1;
        rolls++;
        
        if (rolls > 16) {
            clearInterval(rollInterval);
            const finalResult = Math.floor(Math.random() * 20) + 1;
            input.value = finalResult;
            localStorage.setItem('d20-roll', finalResult);
            
            btn.disabled = false;
            btn.classList.remove('rolling');
            calculateAll();
        }
    }, 50); 
}

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
    const ctrl = parseFloat(document.getElementById('control').value) || 0;
    const manaSup = parseFloat(document.getElementById('mana-supply').value) || 0;
    const sens = parseFloat(document.getElementById('sensing').value) || 0;

    const resBox = document.getElementById('result-box');
    const critStatus = document.getElementById('crit-status');
    
    resBox.classList.remove('crit-success', 'crit-fail');
    critStatus.innerText = "";
    
    if (d20 === 20) {
        resBox.classList.add('crit-success');
        critStatus.innerText = " ⭐ CRITICAL SUCCESS!";
        critStatus.style.color = "var(--color-yellow)";
    } else if (d20 === 1) {
        resBox.classList.add('crit-fail');
        critStatus.innerText = " 💀 CRITICAL FAILURE!";
        critStatus.style.color = "var(--color-red)";
    }

    let mult = d20 <= 1 ? 0.5 : d20 <= 9 ? 0.75 : d20 <= 11 ? 1 : d20 <= 15 ? 1.5 : d20 <= 19 ? 1.75 : 2;

    const damage = weaponBase * ((0.5 * str) + 1) * mult;
    const magicDmg = spellBase * ((0.5 * cast) + 1);
    const extraForecast = 10 * ((0.05 * forc) + 1) * d20;
    const dodgeScore = (10 * ((0.1 * dex) + 1) * d20) + extraForecast;
    const hitScore = (10 * ((0.1 * acc) + 1) * d20) + extraForecast;
    const manaCost = spellBase * ((100 - ctrl) / 100);

    const stamina = 100 * ((0.2 * end) + 1);
    const hp = 100 * ((0.5 * con) + 1);
    const maxMana = 100 * ((0.2 * manaSup) + 1);

    const distance = 10 * ((0.2 * spd) + 1);
    const carryCap = 50 + (str * 5);
    const actions = 1 + Math.floor(dex / 20);
    const sensingRange = sens * 30;
    
    let initBonus = qd <= 20 ? 2 : qd <= 40 ? 4 : qd <= 60 ? 6 : qd <= 80 ? 8 : 10;

    // Inventory Weight Logic
    const totalWeight = currentInventory.reduce((sum, item) => sum + (item.weight * item.qty), 0);
    const packBtn = document.querySelector('.pack-btn');
    const carrySpan = document.getElementById('res-carry');
    
    document.getElementById('weight-preview').innerText = totalWeight.toFixed(1);
    
    let encumbranceText = "";
    if (totalWeight > carryCap) {
        packBtn.classList.add('overweight');
        carrySpan.classList.add('text-red');
        carrySpan.innerText = `${totalWeight.toFixed(1)} / ${carryCap} (OVERBURDENED)`;
        encumbranceText = `<p class="text-red"><strong>Encumbrance Warning:</strong> Carrying ${totalWeight.toFixed(1)}kg (Exceeds ${carryCap}kg max). Speed/Dodge penalties apply!</p>`;
    } else {
        packBtn.classList.remove('overweight');
        carrySpan.classList.remove('text-red');
        carrySpan.innerText = `${totalWeight.toFixed(1)} / ${carryCap}`;
    }

    document.getElementById('max-hp-display').innerText = hp.toFixed(2).replace(/\.00$/, '');
    document.getElementById('max-stamina-display').innerText = stamina.toFixed(2).replace(/\.00$/, '');
    document.getElementById('max-mana-display').innerText = maxMana.toFixed(2).replace(/\.00$/, '');

    document.getElementById('res-damage').innerText = damage.toFixed(2);
    document.getElementById('res-magic').innerText = magicDmg.toFixed(2);
    document.getElementById('res-hit').innerText = hitScore.toFixed(2);
    document.getElementById('res-dodge').innerText = dodgeScore.toFixed(2);
    document.getElementById('res-cost').innerText = manaCost.toFixed(2);
    document.getElementById('res-forecast').innerText = extraForecast.toFixed(2);

    document.getElementById('res-actions').innerText = actions;
    document.getElementById('res-distance').innerText = distance.toFixed(2);
    document.getElementById('res-init').innerText = initBonus;
    document.getElementById('res-sense').innerText = sensingRange;

    document.getElementById('dm-math').innerHTML = `
        ${encumbranceText}
        <p><strong>Physical Damage:</strong> ${weaponBase} * ((0.5 * ${str}) + 1) * ${mult} = ${damage.toFixed(2)}</p>
        <p><strong>Magic Damage:</strong> ${spellBase} * ((0.5 * ${cast}) + 1) = ${magicDmg.toFixed(2)}</p>
        <p><strong>Hit Score:</strong> [10 * ((0.1 * ${acc}) + 1) * ${d20}] + ${extraForecast.toFixed(2)} = ${hitScore.toFixed(2)}</p>
        <p><strong>Dodge Score:</strong> [10 * ((0.1 * ${dex}) + 1) * ${d20}] + ${extraForecast.toFixed(2)} = ${dodgeScore.toFixed(2)}</p>
        <p><strong>Max HP:</strong> 100 * ((0.5 * ${con}) + 1) = ${hp.toFixed(2)}</p>
        <p><strong>Stamina:</strong> 100 * ((0.2 * ${end}) + 1) = ${stamina.toFixed(2)}</p>
        <p><strong>Max Mana:</strong> 100 * ((0.2 * ${manaSup}) + 1) = ${maxMana.toFixed(2)}</p>
        <p><strong>Mana Cost:</strong> ${spellBase} * ((100 - ${ctrl}) / 100) = ${manaCost.toFixed(2)}</p>
        <p><strong>Base Carry Cap:</strong> 50 + (${str} * 5) = ${carryCap}kg</p>
    `;

    autoSave();
}

/* --- Inventory Logic --- */
function toggleInventory() {
    document.getElementById('inventory-sidebar').classList.toggle('open');
}

function addInventoryItem() {
    const name = document.getElementById('item-name').value.trim();
    const weight = parseFloat(document.getElementById('item-weight').value) || 0;
    const qty = parseInt(document.getElementById('item-qty').value) || 1;

    if (!name) return showToast("Please enter an item name!");

    const existingItem = currentInventory.find(item => 
        item.name.toLowerCase() === name.toLowerCase() && item.weight === weight
    );

    if (existingItem) {
        existingItem.qty += qty;
    } else {
        currentInventory.push({ id: Date.now(), name, weight, qty });
    }
    
    document.getElementById('item-name').value = '';
    document.getElementById('item-weight').value = '';
    document.getElementById('item-qty').value = '1';
    
    saveInventoryLocally();
    renderInventory();
    calculateAll(); 
}

function incrementItem(id) {
    const item = currentInventory.find(i => i.id === id);
    if (item) {
        item.qty++;
        saveInventoryLocally();
        renderInventory();
        calculateAll();
    }
}

function decrementItem(id) {
    const item = currentInventory.find(i => i.id === id);
    if (item) {
        item.qty--;
        if (item.qty <= 0) {
            removeInventoryItem(id);
        } else {
            saveInventoryLocally();
            renderInventory();
            calculateAll();
        }
    }
}

function removeInventoryItem(id) {
    currentInventory = currentInventory.filter(item => item.id !== id);
    saveInventoryLocally();
    renderInventory();
    calculateAll(); 
}

function saveInventoryLocally() {
    localStorage.setItem('current_inventory', JSON.stringify(currentInventory));
}

function renderInventory() {
    const list = document.getElementById('inventory-list');
    list.innerHTML = '';
    
    currentInventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'inv-item';
        div.innerHTML = `
            <div class="inv-details">
                <span class="inv-name">${item.name}</span>
                <span class="inv-stats">${item.weight}kg x ${item.qty} = ${(item.weight * item.qty).toFixed(1)}kg</span>
            </div>
            <div class="inv-actions">
                <button class="qty-btn" onclick="decrementItem(${item.id})">-</button>
                <button class="qty-btn" onclick="incrementItem(${item.id})">+</button>
                <button class="del-item-btn" onclick="removeInventoryItem(${item.id})">✖</button>
            </div>
        `;
        list.appendChild(div);
    });
}

/* --- Character Management Logic --- */
function autoSave() {
    if (!currentCharacter) return; 
    
    const charData = { stats: {}, inventory: currentInventory };
    document.querySelectorAll('.dashboard input[type="number"]').forEach(input => {
        charData.stats[input.id] = input.value;
    });

    let characters = JSON.parse(localStorage.getItem('dnd_characters') || '{}');
    characters[currentCharacter] = charData;
    localStorage.setItem('dnd_characters', JSON.stringify(characters));
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

function showToast(message, isSuccess = false) {
    const toast = document.getElementById('toast-notification');
    toast.innerText = message;
    isSuccess ? toast.classList.add('success') : toast.classList.remove('success');
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function saveCharacter() {
    const nameInput = document.getElementById('char-name-input');
    const name = nameInput.value.trim();
    if (!name) return showToast("Please enter a character name!");

    currentCharacter = name;
    autoSave();
    
    nameInput.value = '';
    renderCharacters();
    showToast(`${name} saved & active!`, true);
}

function renderCharacters() {
    const container = document.getElementById('char-cards-container');
    container.innerHTML = '';
    const characters = JSON.parse(localStorage.getItem('dnd_characters') || '{}');

    for (const name in characters) {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.innerHTML = `
            <h4>${name}</h4>
            <div class="char-actions">
                <button class="btn-load" onclick="loadCharacter('${name}')">Load</button>
                <button class="btn-delete" onclick="deleteCharacter('${name}')">Delete</button>
            </div>
        `;
        container.appendChild(card);
    }
}

function loadCharacter(name) {
    const characters = JSON.parse(localStorage.getItem('dnd_characters') || '{}');
    if (!characters[name]) return;

    currentCharacter = name; 

    const charData = characters[name].stats ? characters[name].stats : characters[name];
    
    for (const id in charData) {
        const input = document.getElementById(id);
        if (input) {
            input.value = charData[id];
            localStorage.setItem(id, charData[id]); 
        }
    }
    
    currentInventory = characters[name].inventory || [];
    saveInventoryLocally();
    
    renderInventory();
    calculateAll();
    toggleSidebar(); 
    showToast(`${name} loaded!`, true);
}

let charToDelete = null;
function deleteCharacter(name) {
    charToDelete = name;
    document.getElementById('delete-modal-text').innerText = `Are you sure you want to delete ${name}?`;
    document.getElementById('delete-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    charToDelete = null;
}

function confirmDelete() {
    if (!charToDelete) return;
    let characters = JSON.parse(localStorage.getItem('dnd_characters') || '{}');
    delete characters[charToDelete];
    localStorage.setItem('dnd_characters', JSON.stringify(characters));
    
    if (currentCharacter === charToDelete) {
        currentCharacter = null;
    }
    
    renderCharacters();
    showToast(`${charToDelete} deleted!`, true);
    closeModal();
}

/* --- Long Rest & Data Management --- */
function longRest() {
    const con = parseFloat(document.getElementById('constitution').value) || 0;
    const end = parseFloat(document.getElementById('endurance').value) || 0;
    const manaSup = parseFloat(document.getElementById('mana-supply').value) || 0;

    const newHp = (100 * ((0.5 * con) + 1)).toFixed(0);
    const newStamina = (100 * ((0.2 * end) + 1)).toFixed(0);
    const newMana = (100 * ((0.2 * manaSup) + 1)).toFixed(0);

    document.getElementById('current-hp').value = newHp;
    document.getElementById('current-stamina').value = newStamina;
    document.getElementById('current-mana').value = newMana;
    
    localStorage.setItem('current-hp', newHp);
    localStorage.setItem('current-stamina', newStamina);
    localStorage.setItem('current-mana', newMana);
    
    calculateAll();
    showToast("Fully Rested!", true);
}

function exportData() {
    const dataStr = localStorage.getItem('dnd_characters') || '{}';
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "rpg_console_save.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data Exported!", true);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            const current = JSON.parse(localStorage.getItem('dnd_characters') || '{}');
            localStorage.setItem('dnd_characters', JSON.stringify({ ...current, ...imported }));
            renderCharacters();
            showToast("Data Imported!", true);
        } catch (err) {
            showToast("Invalid Save File!");
        }
    };
    reader.readAsText(file);
    event.target.value = ''; 
}
/* --- Clear Cache Logic --- */
function clearCache() {
    document.getElementById('clear-cache-modal').classList.remove('hidden');
}

function closeClearCacheModal() {
    document.getElementById('clear-cache-modal').classList.add('hidden');
}

function confirmClearCache() {
    // 1. Save the important data first
    const savedCharacters = localStorage.getItem('dnd_characters');
    const savedTheme = localStorage.getItem('theme');

    // 2. Wipe the browser's temporary storage (the current inputs)
    localStorage.clear();

    // 3. Put the important data back safely
    if (savedCharacters) localStorage.setItem('dnd_characters', savedCharacters);
    if (savedTheme) localStorage.setItem('theme', savedTheme);

    // 4. Refresh to show the clean board
    location.reload(); 
}