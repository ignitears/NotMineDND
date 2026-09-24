let charList = JSON.parse(localStorage.getItem('dnd_char_list_master')) || ['Hero'];
let activeChar = localStorage.getItem('dnd_active_char_master') || charList[0];
let prefix = `dnd_v5_${activeChar}_`;
let justRolled = false;
let weaponsList = [];
let notesList = [];

window.onload = function() {
    initTheme();
    loadActiveCharacter();
    renderCharList();
    setupTooltips();
    attachInputAnimations();
    setupCustomDropdowns();
    
    document.getElementById('d20-roll').addEventListener('change', function() {
        justRolled = true;
        calculateAll();
    });
};

const tabs = document.querySelectorAll('.tabs .tab');
const tabContents = document.querySelectorAll('.tab-content');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.add('active');
        if(tab.dataset.target === 'tab-stats') calculateAll(); 
    });
});

function toggleDetails() {
    const details = document.getElementById('profile-details');
    const arrow = document.getElementById('arrow-icon');
    details.classList.toggle('open');
    if (arrow) arrow.style.transform = details.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function setupCustomDropdowns() {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown') && !e.target.closest('.theme-dropdown')) {
            document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
            document.getElementById('theme-dropdown')?.classList.remove('open');
        }
    });
}

function toggleCustomDropdown(id) {
    document.querySelectorAll('.custom-dropdown').forEach(d => { if (d.id !== id) d.classList.remove('open'); });
    document.getElementById(id).classList.toggle('open');
}

function selectCustomOption(dropdownId, value, text) {
    const dropdown = document.getElementById(dropdownId);
    dropdown.querySelector('.custom-toggle').innerText = text;
    const hiddenInputId = dropdownId.replace('-dropdown', '');
    document.getElementById(hiddenInputId).value = value;
    dropdown.classList.remove('open');
}

// External Folder File Scanner
function scanLocalFolder(event) {
    const files = event.target.files;
    const container = document.getElementById('external-links-list');
    container.innerHTML = '';
    
    let htmlFound = false;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.html')) {
            htmlFound = true;
            const fakeUrl = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = fakeUrl;
            a.target = "_blank";
            a.className = "action-btn";
            a.style.textDecoration = "none";
            a.style.display = "inline-block";
            a.style.marginBottom = "5px";
            a.innerText = `Launch ${file.name}`;
            container.appendChild(a);
        }
    }
    if (!htmlFound) {
        container.innerHTML = `<span style="color:var(--text-muted); font-size:13px;">No HTML files found in the selected folder.</span>`;
    }
}

// Global Profile Image Uploader
const imageInput = document.getElementById('image-input');
const charImage = document.getElementById('char-image');
const uploadText = document.getElementById('upload-text');
const clearImgBtn = document.getElementById('clear-img-btn');

if(imageInput) {
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
}

function clearImage(e) {
    e.preventDefault(); e.stopPropagation();
    charImage.src = ''; charImage.style.display = 'none';
    uploadText.style.display = 'block'; clearImgBtn.style.display = 'none';
    imageInput.value = ''; localStorage.removeItem(prefix + 'image');
}

function handleWpnImage(event, id) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const wpn = weaponsList.find(w => w.id === id);
            if (wpn) {
                wpn.img = e.target.result;
                saveWeaponsState();
                renderWeapons();
            }
        };
        reader.readAsDataURL(file);
    }
}

function clearWpnImage(id) {
    const wpn = weaponsList.find(w => w.id === id);
    if (wpn) {
        wpn.img = '';
        saveWeaponsState();
        renderWeapons();
    }
}

// Weapons Arsenal Management
function saveWeaponsState() {
    localStorage.setItem(prefix + 'weapons', JSON.stringify(weaponsList));
}

function addNewWeapon() {
    const newWpn = { id: Date.now(), name: 'New Weapon', phys: 10, mag: 10, lore: '', img: '', enchants: [], equipped: false };
    if (weaponsList.length === 0) newWpn.equipped = true;
    weaponsList.push(newWpn);
    saveWeaponsState();
    renderWeapons();
    calculateAll();
    showToast("Weapon Added to Arsenal!");
}

function deleteWeapon(id) {
    weaponsList = weaponsList.filter(w => w.id !== id);
    if (weaponsList.length > 0 && !weaponsList.some(w => w.equipped)) {
        weaponsList[0].equipped = true;
    }
    saveWeaponsState();
    renderWeapons();
    calculateAll();
}

function updateWeapon(id, field, value) {
    const wpn = weaponsList.find(w => w.id === id);
    if (wpn) {
        wpn[field] = value;
        saveWeaponsState();
        if (field === 'phys' || field === 'mag' || field === 'equipped') {
            calculateAll();
        }
    }
}

function toggleEquip(id) {
    weaponsList.forEach(w => w.equipped = (w.id === id));
    saveWeaponsState();
    renderWeapons(); 
    calculateAll();
}

function addWpnEnchant(wpnId) {
    const wpn = weaponsList.find(w => w.id === wpnId);
    if (wpn) {
        wpn.enchants.push({ name: '' });
        saveWeaponsState();
        renderWeapons();
    }
}

function updateWpnEnchant(wpnId, encIndex, value) {
    const wpn = weaponsList.find(w => w.id === wpnId);
    if (wpn && wpn.enchants[encIndex]) {
        wpn.enchants[encIndex].name = value;
        saveWeaponsState();
    }
}

function deleteWpnEnchant(wpnId, encIndex) {
    const wpn = weaponsList.find(w => w.id === wpnId);
    if (wpn) {
        wpn.enchants.splice(encIndex, 1);
        saveWeaponsState();
        renderWeapons();
    }
}

function renderWeapons() {
    const container = document.getElementById('weapons-container');
    if (!container) return;
    container.innerHTML = '';
    
    weaponsList.forEach((wpn, idx) => {
        const div = document.createElement('div');
        div.className = 'card animate-card';
        div.style.marginBottom = '20px';
        
        let imgHTML = '';
        if (wpn.img) {
            imgHTML = `
                <img id="wpn-img-el-${wpn.id}" src="${wpn.img}" style="display:block;">
                <button class="small-btn del" style="position:absolute; top:5px; right:5px; z-index:10; background:var(--card-bg); padding:6px;" onclick="clearWpnImage(${wpn.id}); event.preventDefault();">✕</button>
            `;
        } else {
            imgHTML = `<span style="color:var(--text-muted); font-size:13px;">Upload Image</span>`;
        }

        let enchantsHTML = wpn.enchants.map((enc, eIdx) => `
            <div class="inventory-item" style="margin-top: 5px;">
                <input type="text" placeholder="Enchant / Effect..." value="${enc.name}" oninput="updateWpnEnchant(${wpn.id}, ${eIdx}, this.value)">
                <button class="small-btn del" onclick="deleteWpnEnchant(${wpn.id}, ${eIdx})">✕</button>
            </div>
        `).join('');

        div.innerHTML = `
            <div class="card-header" style="margin-bottom: 15px; padding-bottom: 10px;">
                <div style="display:flex; align-items:center; gap: 10px; flex:1;">
                    <input type="radio" name="active_weapon" ${wpn.equipped ? 'checked' : ''} onchange="toggleEquip(${wpn.id})">
                    <input type="text" placeholder="Weapon Name" value="${wpn.name}" oninput="updateWeapon(${wpn.id}, 'name', this.value)" style="flex:1; font-weight:bold; font-size:16px;">
                </div>
                <button class="small-btn del" onclick="deleteWeapon(${wpn.id})" style="margin-left: 10px;">✕ Delete</button>
            </div>

            <div class="image-wrapper" style="position: relative; margin-bottom: 20px; display: flex; justify-content: center;">
                <label for="wpn-img-${wpn.id}" id="weapon-upload-box" class="weapon-img-box no-select">
                    ${imgHTML}
                </label>
                <input type="file" id="wpn-img-${wpn.id}" accept="image/*" style="display: none;" onchange="handleWpnImage(event, ${wpn.id})">
            </div>

            <div class="vertical-group">
                <label>Weapon Base Dmg:</label>
                <input type="number" class="flash-trigger" value="${wpn.phys}" oninput="updateWeapon(${wpn.id}, 'phys', parseFloat(this.value)||0)" style="width: 100%; text-align: left;">
            </div>
            <div class="vertical-group" style="margin-top: 10px;">
                <label>Base Spell Power:</label>
                <input type="number" class="flash-trigger" value="${wpn.mag}" oninput="updateWeapon(${wpn.id}, 'mag', parseFloat(this.value)||0)" style="width: 100%; text-align: left;">
            </div>

            <div class="vertical-group" style="margin-top: 15px;">
                <label>Weapon Details / Lore:</label>
                <textarea placeholder="Describe the weapon..." oninput="updateWeapon(${wpn.id}, 'lore', this.value)">${wpn.lore}</textarea>
            </div>

            <div class="card-header" style="margin-top: 20px; padding-bottom: 5px; border-bottom: none;">
                <h3 style="font-size: 13px; color: var(--text-muted);">Enchantments & Modifiers</h3>
                <button class="action-btn" style="padding: 4px 10px; font-size: 11px;" onclick="addWpnEnchant(${wpn.id})">+ Add Mod</button>
            </div>
            <div class="ability-list">
                ${enchantsHTML}
            </div>
        `;
        container.appendChild(div);
    });
}

// Whiteboard Notes Logic
function loadNotes() {
    const area = document.getElementById('whiteboard-area');
    if (!area) return;
    area.innerHTML = '';
    const raw = localStorage.getItem(prefix + 'notes');
    notesList = raw ? JSON.parse(raw) : [];
    notesList.forEach(note => renderStickyNote(note));
}

function saveNotes() {
    localStorage.setItem(prefix + 'notes', JSON.stringify(notesList));
}

function addStickyNote() {
    const newNote = { id: Date.now(), x: 20, y: 20, w: 180, h: 180, text: '' };
    notesList.push(newNote);
    saveNotes();
    renderStickyNote(newNote);
}

function deleteNote(id) {
    notesList = notesList.filter(n => n.id !== id);
    saveNotes();
    loadNotes();
}

function renderStickyNote(note) {
    const area = document.getElementById('whiteboard-area');
    const div = document.createElement('div');
    div.className = 'sticky-note';
    div.style.left = note.x + 'px';
    div.style.top = note.y + 'px';
    if (note.w) div.style.width = note.w + 'px';
    if (note.h) div.style.height = note.h + 'px';
    
    div.innerHTML = `
        <div class="sticky-header" onmousedown="dragNoteInit(event, this.parentElement, ${note.id})">
            <button class="small-btn del" style="padding: 2px 6px; background: rgba(239, 83, 80, 0.2); color: var(--danger); border: 1px solid var(--danger); cursor: pointer;" onmousedown="event.stopPropagation()" onclick="deleteNote(${note.id})">✕</button>
        </div>
        <textarea class="sticky-textarea" oninput="updateNoteText(${note.id}, this.value)">${note.text}</textarea>
    `;
    area.appendChild(div);

    // Automatically tracks outer box resizing and saves dimensions to localStorage
    let saveTimeout;
    const observer = new ResizeObserver(() => {
        if (div.offsetWidth !== note.w || div.offsetHeight !== note.h) {
            note.w = div.offsetWidth;
            note.h = div.offsetHeight;
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveNotes, 300);
        }
    });
    observer.observe(div);
}

function updateNoteText(id, text) {
    const note = notesList.find(n => n.id === id);
    if (note) { note.text = text; saveNotes(); }
}

function updateNoteSize(id, el) {
    const note = notesList.find(n => n.id === id);
    if (note) {
        // If the textarea was dragged, the browser added inline styles to it
        if (el.tagName === 'TEXTAREA' && (el.style.width || el.style.height)) {
            const parent = el.parentElement;
            const headerH = parent.querySelector('.sticky-header').offsetHeight || 24;
            
            // Transfer the new scaled size to the parent container
            parent.style.width = el.offsetWidth + 'px';
            parent.style.height = (el.offsetHeight + headerH) + 'px';
            
            // Reset the textarea so it conforms to the newly sized parent
            el.style.width = '';
            el.style.height = '';
            
            note.w = parent.offsetWidth;
            note.h = parent.offsetHeight;
        } else {
            // Fallback just in case
            note.w = el.offsetWidth || el.parentElement.offsetWidth;
            note.h = el.offsetHeight || el.parentElement.offsetHeight;
        }
        saveNotes();
    }
}

let dragSrc = null; let offX = 0; let offY = 0;
function dragNoteInit(e, el, id) {
    // Ignore drag if the user is clicking a button (like the '✕' delete button)
    if (e.target.closest('button')) return;
    
    dragSrc = { el, id };
    const rect = el.getBoundingClientRect();
    
    // Bring active note to the front
    document.querySelectorAll('.sticky-note').forEach(n => n.style.zIndex = '1');
    el.style.zIndex = '10';

    offX = e.clientX - rect.left;
    offY = e.clientY - rect.top;
    
    document.addEventListener('mousemove', onDragNote);
    document.addEventListener('mouseup', onStopDrag);
    e.preventDefault(); // Prevents text highlighting while dragging
}

function onDragNote(e) {
    if (!dragSrc) return;
    const parent = document.getElementById('whiteboard-area');
    const parentRect = parent.getBoundingClientRect();
    
    let x = e.clientX - parentRect.left + parent.scrollLeft - offX;
    let y = e.clientY - parentRect.top + parent.scrollTop - offY;
    
    // Constrain note to the whiteboard boundaries so it can't be lost
    const maxX = parent.scrollWidth - dragSrc.el.offsetWidth;
    const maxY = parent.scrollHeight - dragSrc.el.offsetHeight;
    
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));
    
    dragSrc.el.style.left = x + 'px';
    dragSrc.el.style.top = y + 'px';
}

function onStopDrag() {
    if (!dragSrc) return;
    document.removeEventListener('mousemove', onDragNote);
    document.removeEventListener('mouseup', onStopDrag);
    const note = notesList.find(n => n.id === dragSrc.id);
    if (note) {
        note.x = parseInt(dragSrc.el.style.left, 10);
        note.y = parseInt(dragSrc.el.style.top, 10);
        saveNotes();
    }
    dragSrc = null;
}

function attachInputAnimations() {
    document.querySelectorAll('.flash-trigger').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('input-flash');
            void input.offsetWidth; 
            input.classList.add('input-flash');
        });
    });
}

const animationRequests = {};
function animateValue(id, newValue, isInt = false, duration = 250) {
    const obj = document.getElementById(id);
    if (!obj) return;
    const start = parseFloat(obj.getAttribute('data-val')) || 0;
    if (start === newValue) {
        obj.innerText = isInt ? newValue : newValue.toFixed(2);
        return;
    }
    obj.setAttribute('data-val', newValue);
    if (animationRequests[id]) cancelAnimationFrame(animationRequests[id]);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = start + (newValue - start) * progress;
        obj.innerText = isInt ? Math.round(current) : current.toFixed(2);
        if (progress < 1) animationRequests[id] = requestAnimationFrame(step);
        else obj.innerText = isInt ? newValue : newValue.toFixed(2);
    };
    animationRequests[id] = requestAnimationFrame(step);
}

function triggerCritAnimations(val) {
    const critStatus = document.getElementById('crit-status');
    const diceBtn = document.getElementById('dice-btn');
    const flashOverlay = document.getElementById('screen-flash');
    
    if(!diceBtn || !flashOverlay) return;

    diceBtn.classList.remove('crit-success-anim', 'crit-fail-anim');
    document.body.classList.remove('body-shake');
    flashOverlay.className = '';
    
    void diceBtn.offsetWidth; 
    
    if (val === 20) {
        critStatus.innerText = "⭐ CRITICAL SUCCESS";
        critStatus.style.color = "var(--success)";
        diceBtn.classList.add('crit-success-anim');
        document.body.classList.add('body-shake');
        flashOverlay.className = 'screen-flash-success';
    } else if (val === 1) {
        critStatus.innerText = "💀 CRITICAL FAILURE";
        critStatus.style.color = "var(--danger)";
        diceBtn.classList.add('crit-fail-anim');
        document.body.classList.add('body-shake');
        flashOverlay.className = 'screen-flash-fail';
    } else {
        critStatus.innerText = "";
    }
    
    setTimeout(() => { 
        document.body.classList.remove('body-shake'); 
        flashOverlay.className = ''; 
    }, 600);
}

function calculateAll() {
    const activeWpn = weaponsList.find(w => w.equipped) || { name: 'Unarmed', phys: 0, mag: 0 };
    const weaponBase = parseFloat(activeWpn.phys) || 0;
    const spellBase = parseFloat(activeWpn.mag) || 0;
    
    const d20RollInput = document.getElementById('d20-roll');
    if(!d20RollInput) return; // Prevent calc errors on pages missing stats

    const rawD20 = parseFloat(d20RollInput.value) || 0;
    const modD20 = parseFloat(document.getElementById('d20-mod').value) || 0;
    const totalD20 = rawD20 + modD20;
    
    document.getElementById('display-total').innerText = totalD20;

    const str = parseFloat(document.getElementById('strength').value) || 0;
    const spd = parseFloat(document.getElementById('speed').value) || 0;
    const dex = parseFloat(document.getElementById('dexterity').value) || 0;
    const qd = parseFloat(document.getElementById('quickdraw').value) || 0;
    
    const end = parseFloat(document.getElementById('endurance').value) || 0;
    const wis = parseFloat(document.getElementById('wisdom').value) || 0;
    const adapt = parseFloat(document.getElementById('adaptation').value) || 0;
    const con = parseFloat(document.getElementById('constitution').value) || 0;

    const forc = parseFloat(document.getElementById('forecast').value) || 0;
    const cast = parseFloat(document.getElementById('casting').value) || 0;
    const ctrl = parseFloat(document.getElementById('control').value) || 0;
    const acc = parseFloat(document.getElementById('accuracy').value) || 0;

    const anal = parseFloat(document.getElementById('analysis').value) || 0;
    const learn = parseFloat(document.getElementById('learning').value) || 0;
    const sens = parseFloat(document.getElementById('sensing').value) || 0;
    const manaSup = parseFloat(document.getElementById('mana-supply').value) || 0;

    const critStatus = document.getElementById('crit-status');
    const diceBtn = document.getElementById('dice-btn');
    
    if (diceBtn && !diceBtn.classList.contains('rolling')) {
        if (rawD20 === 20) {
            critStatus.innerText = "⭐ CRITICAL SUCCESS";
            critStatus.style.color = "var(--success)";
            diceBtn.style.borderColor = "var(--success)";
            diceBtn.style.boxShadow = "0 0 40px var(--success), inset 0 0 10px var(--success)";
        } else if (rawD20 === 1) {
            critStatus.innerText = "💀 CRITICAL FAILURE";
            critStatus.style.color = "var(--danger)";
            diceBtn.style.borderColor = "var(--danger)";
            diceBtn.style.boxShadow = "0 0 40px var(--danger), inset 0 0 10px var(--danger)";
        } else {
            critStatus.innerText = "";
            diceBtn.style.borderColor = "";
            diceBtn.style.boxShadow = "";
        }
    }

    const evalRoll = totalD20;
    const mult = evalRoll <= 1 ? 0.5 : evalRoll <= 9 ? 0.75 : evalRoll <= 11 ? 1 : evalRoll <= 15 ? 1.5 : evalRoll <= 19 ? 1.75 : 2;
    
    const damage = weaponBase * ((0.5 * str) + 1) * mult;
    const magicDmg = spellBase * ((0.5 * cast) + 1) * mult; 
    const extraForecast = 10 * ((0.05 * forc) + 1) * evalRoll;
    const dodgeScore = (10 * ((0.1 * dex) + 1) * evalRoll) + extraForecast;
    const hitScore = (10 * ((0.1 * acc) + 1) * evalRoll) + extraForecast;
    const manaCost = spellBase * ((100 - ctrl) / 100);

    const baseHp = 100 * ((0.5 * con) + 1);
    const baseStamina = 100 * ((0.2 * end) + 1);
    const baseMana = 100 * ((0.2 * manaSup) + 1);

    const bonusHp = parseFloat(document.getElementById('bonus-hp').value) || 0;
    const bonusPctHp = parseFloat(document.getElementById('bonus-pct-hp').value) || 0;
    const bonusStam = parseFloat(document.getElementById('bonus-stamina').value) || 0;
    const bonusPctStam = parseFloat(document.getElementById('bonus-pct-stamina').value) || 0;
    const bonusManaVal = parseFloat(document.getElementById('bonus-mana').value) || 0;
    const bonusPctMana = parseFloat(document.getElementById('bonus-pct-mana').value) || 0;

    const maxHp = (baseHp + bonusHp) * (1 + (bonusPctHp / 100));
    const maxStamina = (baseStamina + bonusStam) * (1 + (bonusPctStam / 100));
    const maxMana = (baseMana + bonusManaVal) * (1 + (bonusPctMana / 100));

    const distance = 10 * ((0.2 * spd) + 1);
    const carryCap = 50 + (str * 5);
    const actions = 1 + Math.floor(dex / 20);
    const sensingRange = sens * 30;
    const initBonus = qd <= 20 ? 2 : qd <= 40 ? 4 : qd <= 60 ? 6 : qd <= 80 ? 8 : 10;

    const lockHp = document.getElementById('lock-hp').checked;
    const lockStam = document.getElementById('lock-stamina').checked;
    const lockMana = document.getElementById('lock-mana').checked;

    if (!lockHp) document.getElementById('max-hp-display').value = maxHp.toFixed(0);
    if (!lockStam) document.getElementById('max-stamina-display').value = maxStamina.toFixed(0);
    if (!lockMana) document.getElementById('max-mana-display').value = maxMana.toFixed(0);

    const finalMaxHp = parseFloat(document.getElementById('max-hp-display').value) || 1;
    const finalMaxStam = parseFloat(document.getElementById('max-stamina-display').value) || 1;
    const finalMaxMana = parseFloat(document.getElementById('max-mana-display').value) || 1;

    animateValue('res-damage', damage);
    animateValue('res-magic', magicDmg);
    animateValue('res-hit', hitScore);
    animateValue('res-dodge', dodgeScore);
    animateValue('res-cost', manaCost);
    animateValue('res-forecast', extraForecast);

    animateValue('res-actions', actions, true);
    animateValue('res-distance', distance);
    animateValue('res-init', initBonus, true);
    animateValue('res-carry', carryCap, true);
    animateValue('res-sense', sensingRange, true);

    updateVitalsVisuals(finalMaxHp, finalMaxStam, finalMaxMana);
    drawRadar(str, spd, dex, qd, end, wis, adapt, con, forc, cast, ctrl, acc, anal, learn, sens, manaSup);

    document.getElementById('dm-math').innerHTML = `
        <p><strong>Physical Damage (${activeWpn.name}):</strong> ${weaponBase} * ((0.5 * ${str}) + 1) * ${mult} = ${damage.toFixed(2)}</p>
        <p><strong>Magic Damage (${activeWpn.name}):</strong> ${spellBase} * ((0.5 * ${cast}) + 1) * ${mult} = ${magicDmg.toFixed(2)}</p>
        <p><strong>Hit Score:</strong> [10 * ((0.1 * ${acc}) + 1) * ${evalRoll}] + ${extraForecast.toFixed(2)} = ${hitScore.toFixed(2)}</p>
        <p><strong>Dodge Score:</strong> [10 * ((0.1 * ${dex}) + 1) * ${evalRoll}] + ${extraForecast.toFixed(2)} = ${dodgeScore.toFixed(2)}</p>
        <p><strong>Calculated HP:</strong> (${baseHp.toFixed(2)} Base + ${bonusHp}) * ${1 + (bonusPctHp/100)} = ${maxHp.toFixed(2)}</p>
        <p><strong>Calculated Stam:</strong> (${baseStamina.toFixed(2)} Base + ${bonusStam}) * ${1 + (bonusPctStam/100)} = ${maxStamina.toFixed(2)}</p>
        <p><strong>Calculated Mana:</strong> (${baseMana.toFixed(2)} Base + ${bonusManaVal}) * ${1 + (bonusPctMana/100)} = ${maxMana.toFixed(2)}</p>
    `;
}

function updateVitalsVisuals(maxHp, maxStam, maxMana) {
    const curHp = parseFloat(document.getElementById('current-hp').value) || 0;
    const curStam = parseFloat(document.getElementById('current-stamina').value) || 0;
    const curMana = parseFloat(document.getElementById('current-mana').value) || 0;

    const hpPct = Math.min(Math.max((curHp / maxHp) * 100, 0), 100);
    const stamPct = Math.min(Math.max((curStam / maxStam) * 100, 0), 100);
    const manaPct = Math.min(Math.max((curMana / maxMana) * 100, 0), 100);

    const hpBox = document.getElementById('hp-box');
    const stamBox = document.getElementById('stamina-box');
    const manaBox = document.getElementById('mana-box');

    if(hpBox) hpBox.style.setProperty('--hp-pct', `${hpPct}%`);
    if(stamBox) stamBox.style.setProperty('--stam-pct', `${stamPct}%`);
    if(manaBox) manaBox.style.setProperty('--mana-pct', `${manaPct}%`);
}

function drawRadar(str, spd, dex, qd, end, wis, adapt, con, forc, cast, ctrl, acc, anal, learn, sens, manaSup) {
    const canvas = document.getElementById('radar-chart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const textColor = getComputedStyle(document.body).getPropertyValue('--text-main').trim() || '#e0e0e0';
    const gridColor = getComputedStyle(document.body).getPropertyValue('--border-color').trim() || '#333';

    const drawDiamond = (cx, cy, radius, topV, rightV, bottomV, leftV, color, labelT, labelR, labelB, labelL) => {
        const scale = (val) => Math.min(Math.max(val, 0), 100) / 100 * radius;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - radius); ctx.lineTo(cx + radius, cy);
        ctx.lineTo(cx, cy + radius); ctx.lineTo(cx - radius, cy);
        ctx.closePath();
        ctx.strokeStyle = gridColor; ctx.lineWidth = 1.5; ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
        ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy - scale(topV));
        ctx.lineTo(cx + scale(rightV), cy);
        ctx.lineTo(cx, cy + scale(bottomV));
        ctx.lineTo(cx - scale(leftV), cy);
        ctx.closePath();
        ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
        
        ctx.fillStyle = color + '40';
        ctx.fill();

        ctx.fillStyle = textColor; ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "center";
        
        ctx.fillText(labelT, cx, cy - radius - 8);
        ctx.fillText(labelB, cx, cy + radius + 18);
        
        ctx.save();
        ctx.translate(cx + radius + 15, cy);
        ctx.rotate(Math.PI / 2);
        ctx.fillText(labelR, 0, 0);
        ctx.restore();
        
        ctx.save();
        ctx.translate(cx - radius - 15, cy);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(labelL, 0, 0);
        ctx.restore();
    };

    drawDiamond(110, 110, 80, str, spd, dex, qd, '#ff2a5f', 'Str.', 'Speed', 'Dexterity', 'Quickdraw');
    drawDiamond(350, 110, 80, end, wis, adapt, con, '#9c27b0', 'Endurance', 'Wisdom', 'Adaptation', 'Con.');
    drawDiamond(110, 350, 80, forc, cast, ctrl, acc, '#ff9800', 'Forecast', 'Casting', 'Control', 'Accuracy');
    drawDiamond(350, 350, 80, anal, learn, sens, manaSup, '#84cc16', 'Analysis', 'Learning', 'Sensing', 'Mana Supply');
}

function rollDice() {
    const rawInput = document.getElementById('d20-roll');
    const btn = document.getElementById('dice-btn');
    btn.disabled = true;
    btn.classList.add('rolling');
    document.getElementById('crit-status').innerText = "Rolling...";

    let rolls = 0;
    const interval = setInterval(() => {
        rawInput.value = Math.floor(Math.random() * 20) + 1;
        rolls++;
        calculateAll(); 
        if (rolls > 12) {
            clearInterval(interval);
            const finalRoll = Math.floor(Math.random() * 20) + 1;
            rawInput.value = finalRoll;
            localStorage.setItem(prefix + 'd20-roll', finalRoll);
            btn.disabled = false;
            btn.classList.remove('rolling');
            justRolled = true; 
            triggerCritAnimations(finalRoll);
            calculateAll();
        }
    }, 45);
}

function calculateApplier() {
    const type = document.getElementById('applier-type').value; 
    const val = parseFloat(document.getElementById('applier-val').value) || 0;
    const maxV = parseFloat(document.getElementById('applier-max').value) || 1;
    const curV = parseFloat(document.getElementById('applier-cur').value) || 0;

    let dmg = 0;
    if(type === 'max_pct') dmg = maxV * (val / 100);
    else if(type === 'cur_pct') dmg = curV * (val / 100);
    else if(type === 'flat') dmg = val;

    dmg = Math.round(dmg);
    const newCur = curV - dmg;
    
    document.getElementById('applier-result-dmg').innerText = dmg;
    document.getElementById('applier-result-cur').innerText = newCur;
}

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
    if(!list) return;
    list.innerHTML = '';
    const raw = localStorage.getItem(prefix + 'inventory');
    if (!raw) return;
    JSON.parse(raw).forEach(item => addInventoryItem(item));
}

function loadActiveCharacter() {
    prefix = `dnd_v5_${activeChar}_`;
    document.querySelectorAll('[data-save="true"]').forEach(input => {
        if (input.type === 'checkbox') {
            const val = localStorage.getItem(prefix + input.id);
            input.checked = val === 'true';
            if(input.parentElement.classList.contains('lock-toggle-btn')) {
                input.parentElement.classList.toggle('locked', input.checked);
            }
        } else {
            const val = localStorage.getItem(prefix + input.id);
            if (val !== null) input.value = val;
        }
        
        input.oninput = () => {
            if (input.type === 'checkbox') {
                localStorage.setItem(prefix + input.id, input.checked);
                if(input.parentElement.classList.contains('lock-toggle-btn')) {
                    input.parentElement.classList.toggle('locked', input.checked);
                }
            } else {
                localStorage.setItem(prefix + input.id, input.value);
            }
            
            if (input.id === 'name') document.getElementById('header-name').textContent = input.value || activeChar;
            calculateAll();
        };
    });

    const savedImage = localStorage.getItem(prefix + 'image');
    if (savedImage && charImage) {
        charImage.src = savedImage;
        charImage.style.display = 'block';
        uploadText.style.display = 'none';
        clearImgBtn.style.display = 'block';
    } else if (charImage) {
        charImage.src = '';
        charImage.style.display = 'none';
        uploadText.style.display = 'block';
        clearImgBtn.style.display = 'none';
    }

    const wpnData = localStorage.getItem(prefix + 'weapons');
    if (wpnData) {
        weaponsList = JSON.parse(wpnData);
    } else {
        const oldPhys = parseFloat(localStorage.getItem(prefix + 'weapon-base')) || 10;
        const oldMag = parseFloat(localStorage.getItem(prefix + 'spell-base')) || 10;
        const oldLore = localStorage.getItem(prefix + 'weapon-details') || '';
        const oldImg = localStorage.getItem(prefix + 'weapon_image') || '';
        let oldEncs = [];
        try { oldEncs = JSON.parse(localStorage.getItem(prefix + 'enchants') || '[]'); } catch(e){}

        weaponsList = [{
            id: Date.now(), name: 'Main Weapon', phys: oldPhys, mag: oldMag,
            lore: oldLore, img: oldImg, enchants: oldEncs, equipped: true
        }];
        saveWeaponsState();
    }
    renderWeapons();

    const nameInput = document.getElementById('name');
    if(nameInput) {
        document.getElementById('header-name').textContent = nameInput.value || activeChar;
    }
    loadInventory();
    loadNotes();
    
    const applierStatValEl = document.getElementById('applier-stat');
    if(applierStatValEl) {
        const applierStatVal = applierStatValEl.value;
        const statText = applierStatVal === 'hp' ? 'Health (HP)' : applierStatVal === 'stam' ? 'Stamina' : 'Mana';
        const customToggle = document.querySelector('#applier-stat-dropdown .custom-toggle');
        if(customToggle) customToggle.innerText = statText;
        
        const applierTypeVal = document.getElementById('applier-type').value;
        const typeText = applierTypeVal === 'max_pct' ? '% of Max' : applierTypeVal === 'cur_pct' ? '% of Current' : 'Flat Value';
        document.querySelector('#applier-type-dropdown .custom-toggle').innerText = typeText;
    }

    calculateAll();
}

function toggleCharDrawer() {
    const drawer = document.getElementById('char-drawer');
    if(drawer) drawer.classList.toggle('open');
}

function renderCharList() {
    const container = document.getElementById('char-list');
    if(!container) return;
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
                <button class="small-btn del" onclick="deleteCharacter('${name}')" ${charList.length <= 1 ? 'disabled style="opacity:0.5"' : ''}>Delete</button>
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
    if (charList.length <= 1) {
        showDialog({ title: "Alert", text: "You must keep at least one profile.", showInput: false });
        return;
    }
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

function importSingleCharacter(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            let importedName = null;

            if (parsed.name && parsed.data) {
                importedName = parsed.name;
                if (!charList.includes(importedName)) charList.push(importedName);
                Object.keys(parsed.data).forEach(k => localStorage.setItem(k, parsed.data[k]));
            }
            else if (typeof parsed === 'object' && !parsed.charList && Object.keys(parsed).some(k => parsed[k] && parsed[k].stats)) {
                for (const charName of Object.keys(parsed)) {
                    if (parsed[charName] && parsed[charName].stats) {
                        importedName = charName;
                        if (!charList.includes(charName)) charList.push(charName);
                        const pfx = `dnd_v5_${charName}_`;
                        
                        const stats = parsed[charName].stats;
                        Object.keys(stats).forEach(statId => {
                            localStorage.setItem(pfx + statId, stats[statId]);
                        });
                        localStorage.setItem(pfx + 'name', charName);

                        if (Array.isArray(parsed[charName].inventory)) {
                            const newInv = parsed[charName].inventory.map(item => ({
                                name: item.name || '',
                                qty: item.qty || 1
                            }));
                            localStorage.setItem(pfx + 'inventory', JSON.stringify(newInv));
                        }
                    }
                }
            }
            else if (parsed.charList && parsed.store) {
                parsed.charList.forEach(c => {
                    if (!charList.includes(c)) charList.push(c);
                });
                Object.keys(parsed.store).forEach(k => localStorage.setItem(k, parsed.store[k]));
                importedName = parsed.activeChar || parsed.charList[0];
            } else {
                throw new Error("Unrecognized format");
            }

            localStorage.setItem('dnd_char_list_master', JSON.stringify(charList));
            if (importedName) switchCharacter(importedName);
            showDialog({ title: "Import Complete", text: "Character data successfully loaded!" });
        } catch (err) {
            showDialog({ title: "Import Failed", text: "Invalid or unsupported character file." });
        }
        input.value = '';
    };
    reader.readAsText(file);
}

function exportAllCharacters() {
    const allData = { charList, activeChar, store: {} };
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('dnd_v5_')) allData.store[key] = localStorage.getItem(key);
    });

    const blob = new Blob([JSON.stringify({ allData }, null, 2)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `all_characters_backup.json`;
    a.click();
}

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
    setTimeout(calculateAll, 100); 
}

function getThemeLabel(theme) {
    const map = {
        'default': 'Default Dark', 'default-light': 'Default Light', 'apple': 'Apple Style', 'proxy': 'Proxy Terminal',
        'playful-earth': 'Playful Earth', 'cyber': 'Cyber Futuristic',
        'hallowed-mist': 'Hallowed Mist', 'industrial': 'Industrial Grunge'
    };
    return map[theme] || 'Default Dark';
}

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

document.getElementById('dialog-close-x')?.addEventListener('click', () => {
    document.getElementById('custom-dialog').classList.remove('show');
    if (dialogCb) dialogCb(false, null);
});

function clearCache() {
    showDialog({
        title: "Clear All Data",
        text: "Are you sure you want to clear all character profiles and local storage? This action cannot be undone.",
        showInput: false,
        callback: (ok) => {
            if (ok) {
                localStorage.clear();
                location.reload();
            }
        }
    });
}