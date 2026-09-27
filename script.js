let charList = JSON.parse(localStorage.getItem('dnd_char_list_master')) || ['Hero'];
let activeChar = localStorage.getItem('dnd_active_char_master') || charList[0];
let prefix = `dnd_v5_${activeChar}_`;
let justRolled = false;
let lastRollValue = -1; // Tracks roll changes to trigger animations properly
let weaponsList = [];
let notesList = [];

// --- UTILITY HELPERS ---
const getEl = (id) => document.getElementById(id);
const getNum = (id) => parseFloat(getEl(id)?.value) || 0;

function flashElement(el) {
    if (!el) return;
    el.classList.remove('input-flash');
    void el.offsetWidth;
    el.classList.add('input-flash');
}

window.onload = function () {
    initTheme();
    loadActiveCharacter();
    renderCharList();
    setupTooltips();
    attachInputAnimations();
    setupCustomDropdowns();

    getEl('d20-roll')?.addEventListener('change', function (e) {
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
        getEl(tab.dataset.target).classList.add('active');
        if (tab.dataset.target === 'tab-stats') calculateAll();
    });
});

function toggleDetails() {
    const details = getEl('profile-details');
    const arrow = getEl('arrow-icon');
    details.classList.toggle('open');
    if (arrow) arrow.style.transform = details.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
}

function showToast(msg) {
    const toast = getEl('toast');
    if (!toast) return;
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function setupCustomDropdowns() {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown') && !e.target.closest('.theme-dropdown')) {
            document.querySelectorAll('.custom-dropdown').forEach(d => d.classList.remove('open'));
            getEl('theme-dropdown')?.classList.remove('open');
        }
    });
}

function toggleCustomDropdown(id) {
    document.querySelectorAll('.custom-dropdown').forEach(d => { if (d.id !== id) d.classList.remove('open'); });
    getEl(id).classList.toggle('open');
}

function selectCustomOption(dropdownId, value, text) {
    const dropdown = getEl(dropdownId);
    dropdown.querySelector('.custom-toggle').innerText = text;
    const hiddenInputId = dropdownId.replace('-dropdown', '');
    getEl(hiddenInputId).value = value;
    dropdown.classList.remove('open');
    if (dropdownId.startsWith('applier')) calculateApplier();
}

function scanLocalFolder(event) {
    const files = event.target.files;
    const container = getEl('external-links-list');
    container.innerHTML = '';

    let htmlFound = false;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.html')) {
            htmlFound = true;
            const relativePath = file.webkitRelativePath || ('local/' + file.name);
            const a = document.createElement('a');
            a.href = encodeURI(relativePath);
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

const imageInput = getEl('image-input');
const charImage = getEl('char-image');
const uploadText = getEl('upload-text');
const clearImgBtn = getEl('clear-img-btn');

if (imageInput) {
    imageInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
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
        reader.onload = function (e) {
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
    const container = getEl('weapons-container');
    if (!container) return;
    container.innerHTML = '';

    weaponsList.forEach((wpn, idx) => {
        const div = document.createElement('div');
        const isActive = wpn.equipped;

        const activeStyle = isActive
            ? 'border: 2px solid var(--success); box-shadow: 0 0 25px rgba(0,255,115,0.15); transform: scale(1.02); z-index: 10;'
            : 'border: 1px solid var(--border-color); cursor: pointer; opacity: 0.75;';

        div.className = 'card animate-card';
        div.style.cssText = `position: relative; padding: 0; margin-bottom: 25px; display: flex; flex-direction: column; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); background: var(--card-bg); ${activeStyle}`;

        div.onclick = (e) => {
            if (!isActive && !['INPUT', 'TEXTAREA', 'BUTTON', 'LABEL'].includes(e.target.tagName)) {
                toggleEquip(wpn.id);
            }
        };

        let enchantsHTML = wpn.enchants.map((enc, eIdx) => `
            <div class="inventory-item" style="margin-top: 6px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px;">
                <input type="text" placeholder="Enchantment / Effect..." value="${enc.name}" oninput="updateWpnEnchant(${wpn.id}, ${eIdx}, this.value)" style="background: transparent; border: none; outline: none; box-shadow: none; font-size: 13px;">
                <button class="small-btn del" onclick="deleteWpnEnchant(${wpn.id}, ${eIdx}); event.stopPropagation();">✕</button>
            </div>
        `).join('');

        div.innerHTML = `
            <div style="position: relative; display: flex; width: 100%; min-height: 220px; border-radius: 12px 12px 0 0; overflow: hidden; background: var(--card-bg);">
                <div style="position: absolute; top: 0; left: 0; width: 45%; height: 100%; z-index: 1; pointer-events: none;">
                    ${wpn.img ? `<img src="${wpn.img}" style="width: 100%; height: 100%; object-fit: cover; object-position: center; transform: scale(1.2); transform-origin: top center; filter: brightness(0.9); -webkit-mask-image: linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%); mask-image: linear-gradient(to right, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%);">` : ''}
                </div>
                <div style="width: 45%; padding: 20px; display: flex; flex-direction: column; position: relative; z-index: 3;">
                    <input type="text" placeholder="Weapon Name" value="${wpn.name}" oninput="updateWeapon(${wpn.id}, 'name', this.value)" style="background: rgba(0,0,0,0.6); backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; font-weight: 800; font-size: 20px; color: #fff; text-shadow: 1px 1px 4px #000; width: 100%; padding: 12px;">
                    ${wpn.img ? `<button class="small-btn del" style="margin-top: 8px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 5px 10px; font-size: 11px; border-radius: 4px; cursor: pointer; width: fit-content; transition: 0.2s;" onmouseover="this.style.background='var(--danger)'; this.style.borderColor='var(--danger)';" onmouseout="this.style.background='rgba(0,0,0,0.6)'; this.style.borderColor='rgba(255,255,255,0.2)';" onclick="clearWpnImage(${wpn.id}); event.stopPropagation();">✕ Clear Img</button>` : ''}
                    <label for="wpn-img-${wpn.id}" style="flex: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; background: ${wpn.img ? 'transparent' : 'var(--card-bg-sub)'}; border: ${wpn.img ? 'none' : '2px dashed var(--border-color)'}; border-radius: 8px; margin-top: 10px; transition: 0.2s;">
                        ${wpn.img ? '' : '+ Upload Image'}
                    </label>
                    <input type="file" id="wpn-img-${wpn.id}" accept="image/*" style="display: none;" onchange="handleWpnImage(event, ${wpn.id})">
                </div>
                <div style="width: 55%; padding: 20px 20px 20px 0; display: flex; flex-direction: column; position: relative; z-index: 3;">
                    <div style="display: flex; justify-content: flex-end; margin-bottom: 15px;">
                        <button class="small-btn del" style="padding: 5px 12px; background: var(--card-bg-sub); border: 1px solid var(--border-color); color: var(--text-muted); border-radius: 4px; font-weight: bold; transition: 0.2s;" onmouseover="this.style.color='var(--danger)'; this.style.borderColor='var(--danger)';" onmouseout="this.style.color='var(--text-muted)'; this.style.borderColor='var(--border-color)';" onclick="confirmDeleteWeapon(${wpn.id}, '${wpn.name.replace(/'/g, "\\'")}'); event.stopPropagation();">✕ Delete</button>
                    </div>
                    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Base Dmg</label>
                            <input type="number" class="flash-trigger" value="${wpn.phys}" oninput="updateWeapon(${wpn.id}, 'phys', parseFloat(this.value)||0)" style="width: 100%; font-size: 34px; font-weight: 900; color: var(--hp-color); background: transparent; border: none; border-bottom: 3px solid var(--hp-color); padding: 0 0 5px 0; text-align: left; border-radius: 0;">
                        </div>
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Spell Power</label>
                            <input type="number" class="flash-trigger" value="${wpn.mag}" oninput="updateWeapon(${wpn.id}, 'mag', parseFloat(this.value)||0)" style="width: 100%; font-size: 34px; font-weight: 900; color: var(--mana-color); background: transparent; border: none; border-bottom: 3px solid var(--mana-color); padding: 0 0 5px 0; text-align: left; border-radius: 0;">
                        </div>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <label style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 900; letter-spacing: 1px; margin-bottom: 8px;">Lore & Details</label>
                        <textarea placeholder="Describe the weapon..." oninput="updateWeapon(${wpn.id}, 'lore', this.value)" style="width: 100%; min-height: 70px; resize: vertical; background: var(--card-bg-sub); border: 1px solid var(--border-color); border-radius: 6px; color: var(--text-main); padding: 10px;"></textarea>
                    </div>
                </div>
            </div>
            <div style="position: relative; z-index: 4; padding: 15px 20px 20px 20px; border-top: 1px solid var(--border-color); background: var(--card-bg-sub); border-radius: 0 0 12px 12px;">
                <div style="display: flex; align-items: center; margin-bottom: 10px; gap: 8px;">
                    <h4 style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; margin: 0; font-weight: 800; letter-spacing: 1px;">Modifiers</h4>
                    <button style="background: transparent; border: none; color: var(--accent); font-size: 18px; font-weight: bold; cursor: pointer; padding: 0 5px; line-height: 1;" onmouseover="this.style.color='var(--text-main)'" onmouseout="this.style.color='var(--accent)'" onclick="addWpnEnchant(${wpn.id}); event.stopPropagation();" title="Add Modifier">+</button>
                </div>
                <div class="ability-list" style="gap: 5px;">
                    ${enchantsHTML}
                </div>
            </div>
            ${isActive ? '<div style="position: absolute; bottom: 0; right: 0; background: var(--success); color: #000; font-size: 14px; font-weight: 900; padding: 8px 30px; border-top-left-radius: 12px; border-bottom-right-radius: 12px; z-index: 5; letter-spacing: 2px; box-shadow: -2px -2px 10px rgba(0,0,0,0.2);">EQUIPPED</div>' : ''}
        `;
        container.appendChild(div);
    });
}

function confirmDeleteWeapon(id, name) {
    showDialog({
        title: "Delete Weapon",
        text: `Are you sure you want to delete "${name}"?`,
        showInput: false,
        callback: (ok) => {
            if (ok) deleteWeapon(id);
        }
    });
}

function loadNotes() {
    const area = getEl('whiteboard-area');
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
    const area = getEl('whiteboard-area');
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
        if (el.tagName === 'TEXTAREA' && (el.style.width || el.style.height)) {
            const parent = el.parentElement;
            const headerH = parent.querySelector('.sticky-header').offsetHeight || 24;
            parent.style.width = el.offsetWidth + 'px';
            parent.style.height = (el.offsetHeight + headerH) + 'px';
            el.style.width = '';
            el.style.height = '';
            note.w = parent.offsetWidth;
            note.h = parent.offsetHeight;
        } else {
            note.w = el.offsetWidth || el.parentElement.offsetWidth;
            note.h = el.offsetHeight || el.parentElement.offsetHeight;
        }
        saveNotes();
    }
}

let dragSrc = null; let offX = 0; let offY = 0;
function dragNoteInit(e, el, id) {
    if (e.target.closest('button')) return;
    dragSrc = { el, id };
    const rect = el.getBoundingClientRect();
    document.querySelectorAll('.sticky-note').forEach(n => n.style.zIndex = '1');
    el.style.zIndex = '10';
    offX = e.clientX - rect.left;
    offY = e.clientY - rect.top;
    document.addEventListener('mousemove', onDragNote);
    document.addEventListener('mouseup', onStopDrag);
    e.preventDefault();
}

function onDragNote(e) {
    if (!dragSrc) return;
    const parent = getEl('whiteboard-area');
    const parentRect = parent.getBoundingClientRect();
    let x = e.clientX - parentRect.left + parent.scrollLeft - offX;
    let y = e.clientY - parentRect.top + parent.scrollTop - offY;
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
        input.addEventListener('input', () => flashElement(input));
    });
}

const animationRequests = {};
function animateValue(id, newValue, isInt = false, duration = 250) {
    const obj = getEl(id);
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

function triggerCritAnimations(val, skipAnimation = false) {
    const critStatus = getEl('crit-status');
    const diceBtn = getEl('dice-btn');
    const flashOverlay = getEl('screen-flash');

    if (!diceBtn || !flashOverlay || !critStatus) return;

    diceBtn.classList.remove('crit-success-anim', 'crit-fail-anim');
    diceBtn.style.borderColor = "";
    diceBtn.style.boxShadow = "";
    critStatus.classList.remove('show-success', 'show-fail');
    document.body.classList.remove('body-shake');
    flashOverlay.className = '';
    critStatus.innerHTML = "";

    void diceBtn.offsetWidth;

    if (val === 20) {
        critStatus.innerHTML = "<span>CRITICAL</span><span>SUCCESS</span>";
        critStatus.classList.add('show-success');
        diceBtn.classList.add('crit-success-anim');
        if (skipAnimation) { critStatus.style.animation = "none"; diceBtn.classList.remove('crit-success-anim'); }
        else { critStatus.style.animation = ""; document.body.classList.add('body-shake'); flashOverlay.className = 'screen-flash-success'; }
    } else if (val === 1) {
        critStatus.innerHTML = "<span>CRITICAL</span><span>FAILURE</span>";
        critStatus.classList.add('show-fail');
        diceBtn.classList.add('crit-fail-anim');
        if (skipAnimation) { critStatus.style.animation = "none"; diceBtn.classList.remove('crit-fail-anim'); }
        else { critStatus.style.animation = ""; document.body.classList.add('body-shake'); flashOverlay.className = 'screen-flash-fail'; }
    } else {
        return;
    }

    if (!skipAnimation) {
        setTimeout(() => {
            document.body.classList.remove('body-shake');
            flashOverlay.className = '';
        }, 600);
    }
}

function calculateAll() {
    const activeWpn = weaponsList.find(w => w.equipped) || { name: 'Unarmed', phys: 0, mag: 0 };
    const weaponBase = parseFloat(activeWpn.phys) || 0;
    const spellBase = parseFloat(activeWpn.mag) || 0;

    const d20RollInput = getEl('d20-roll');
    if (!d20RollInput) return;

    const rawD20 = getNum('d20-roll');
    const modD20 = getNum('d20-mod');
    const totalD20 = rawD20 + modD20;

    getEl('display-total').innerText = totalD20;

    const str = getNum('strength'), spd = getNum('speed'), dex = getNum('dexterity'), qd = getNum('quickdraw');
    const end = getNum('endurance'), wis = getNum('wisdom'), adapt = getNum('adaptation'), con = getNum('constitution');
    const forc = getNum('forecast'), cast = getNum('casting'), ctrl = getNum('control'), acc = getNum('accuracy');
    const anal = getNum('analysis'), learn = getNum('learning'), sens = getNum('sensing'), manaSup = getNum('mana-supply');

    const diceBtn = getEl('dice-btn');
    if (diceBtn && !diceBtn.classList.contains('rolling') && rawD20 !== lastRollValue) {
        const isInitialLoad = (lastRollValue === -1);
        lastRollValue = rawD20;
        triggerCritAnimations(rawD20, isInitialLoad);
    }

    const evalRoll = totalD20;
    const mult = evalRoll <= 1 ? 0.5 : evalRoll <= 9 ? 0.75 : evalRoll <= 11 ? 1 : evalRoll <= 15 ? 1.5 : evalRoll <= 19 ? 1.75 : 2;

    const damage = weaponBase * ((0.5 * str) + 1) * mult;
    const magicDmg = spellBase * ((0.5 * cast) + 1) * mult;
    const extraForecast = 10 * ((0.05 * forc) + 1) * evalRoll;
    const dodgeScore = (10 * ((0.1 * dex) + 1) * evalRoll) + extraForecast;
    const hitScore = (10 * ((0.1 * acc) + 1) * evalRoll) + extraForecast;
    const manaCost = spellBase * ((100 - ctrl) / 100);

    const calcMax = (base, bonusId, pctId, lockId, displayId) => {
        const max = (base + getNum(bonusId)) * (1 + (getNum(pctId) / 100));
        if (!getEl(lockId).checked) getEl(displayId).value = max.toFixed(0);
        return getNum(displayId) || 1;
    };

    const finalMaxHp = calcMax(100 * ((0.5 * con) + 1), 'bonus-hp', 'bonus-pct-hp', 'lock-hp', 'max-hp-display');
    const finalMaxStam = calcMax(100 * ((0.2 * end) + 1), 'bonus-stamina', 'bonus-pct-stamina', 'lock-stamina', 'max-stamina-display');
    const finalMaxMana = calcMax(100 * ((0.2 * manaSup) + 1), 'bonus-mana', 'bonus-pct-mana', 'lock-mana', 'max-mana-display');

    const distance = 10 * ((0.2 * spd) + 1);
    const carryCap = 50 + (str * 5);
    const actions = 1 + Math.floor(dex / 20);
    const sensingRange = sens * 30;
    const initBonus = qd <= 20 ? 2 : qd <= 40 ? 4 : qd <= 60 ? 6 : qd <= 80 ? 8 : 10;

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

    const dmMath = getEl('dm-math');
    if (dmMath) {
        dmMath.innerHTML = `
            <p><strong>Physical Damage (${activeWpn.name}):</strong> ${weaponBase} * ((0.5 * ${str}) + 1) * ${mult} = ${damage.toFixed(2)}</p>
            <p><strong>Magic Damage (${activeWpn.name}):</strong> ${spellBase} * ((0.5 * ${cast}) + 1) * ${mult} = ${magicDmg.toFixed(2)}</p>
            <p><strong>Hit Score:</strong> [10 * ((0.1 * ${acc}) + 1) * ${evalRoll}] + ${extraForecast.toFixed(2)} = ${hitScore.toFixed(2)}</p>
            <p><strong>Dodge Score:</strong> [10 * ((0.1 * ${dex}) + 1) * ${evalRoll}] + ${extraForecast.toFixed(2)} = ${dodgeScore.toFixed(2)}</p>
            <p><strong>Calculated HP:</strong> (${(100 * ((0.5 * con) + 1)).toFixed(2)} Base + ${getNum('bonus-hp')}) * ${1 + (getNum('bonus-pct-hp') / 100)} = ${finalMaxHp.toFixed(2)}</p>
            <p><strong>Calculated Stam:</strong> (${(100 * ((0.2 * end) + 1)).toFixed(2)} Base + ${getNum('bonus-stamina')}) * ${1 + (getNum('bonus-pct-stamina') / 100)} = ${finalMaxStam.toFixed(2)}</p>
            <p><strong>Calculated Mana:</strong> (${(100 * ((0.2 * manaSup) + 1)).toFixed(2)} Base + ${getNum('bonus-mana')}) * ${1 + (getNum('bonus-pct-mana') / 100)} = ${finalMaxMana.toFixed(2)}</p>
        `;
    }
}

function updateVitalsVisuals(maxHp, maxStam, maxMana) {
    const curHp = getNum('current-hp');
    const curStam = getNum('current-stamina');
    const curMana = getNum('current-mana');

    const hpPct = Math.min(Math.max((curHp / maxHp) * 100, 0), 100);
    const stamPct = Math.min(Math.max((curStam / maxStam) * 100, 0), 100);
    const manaPct = Math.min(Math.max((curMana / maxMana) * 100, 0), 100);

    getEl('hp-box')?.style.setProperty('--hp-pct', `${hpPct}%`);
    getEl('stamina-box')?.style.setProperty('--stam-pct', `${stamPct}%`);
    getEl('mana-box')?.style.setProperty('--mana-pct', `${manaPct}%`);
}

function drawRadar(str, spd, dex, qd, end, wis, adapt, con, forc, cast, ctrl, acc, anal, learn, sens, manaSup) {
    const canvas = getEl('radar-chart');
    if (!canvas) return;
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

    drawDiamond(110, 110, 80, str, spd, end, con, '#ff2a5f', 'Strength', 'Speed', 'Endurance', 'Constitution');
    drawDiamond(350, 110, 80, dex, acc, forc, qd, '#9c27b0', 'Dexterity', 'Accuracy', 'Forecast', 'Quickdraw');
    drawDiamond(110, 350, 80, learn, anal, wis, adapt, '#ff9800', 'Learning', 'Analysis', 'Wisdom', 'Adaptation');
    drawDiamond(350, 350, 80, cast, sens, ctrl, manaSup, '#84cc16', 'Casting', 'Sensing', 'Control', 'Mana Supply');
}

function rollDice() {
    const rawInput = getEl('d20-roll');
    const btn = getEl('dice-btn');
    const critStatus = getEl('crit-status');

    if (btn.classList.contains('rolling')) return;

    btn.disabled = true;
    btn.classList.add('rolling');
    critStatus.classList.remove('show-success', 'show-fail');
    critStatus.innerHTML = "";

    let rolls = 0;
    const interval = setInterval(() => {
        rolls++;
        if (rolls > 12) {
            clearInterval(interval);
            const finalRoll = Math.floor(Math.random() * 20) + 1;
            rawInput.value = finalRoll;
            localStorage.setItem(prefix + 'd20-roll', finalRoll);
            btn.disabled = false;
            btn.classList.remove('rolling');
            justRolled = true;
            lastRollValue = finalRoll;
            triggerCritAnimations(finalRoll);
            calculateAll();
        } else {
            rawInput.value = Math.floor(Math.random() * 20) + 1;
            try { calculateAll(); } catch (e) { console.error(e); }
        }
    }, 45);
}

function calculateApplier() {
    const type = getEl('applier-type').value;
    const val = getNum('applier-val');
    const stat = getEl('applier-stat').value;
    const isDamage = getEl('applier-mode').value === 'damage';

    const suffix = stat === 'hp' ? 'hp' : stat === 'stam' ? 'stamina' : 'mana';
    const maxV = getNum(`max-${suffix}-display`) || 1;
    const curV = getNum(`current-${suffix}`);

    const amt = Math.round(type === 'max_pct' ? maxV * (val / 100) : type === 'cur_pct' ? curV * (val / 100) : val);
    const newCur = isDamage ? Math.max(0, curV - amt) : Math.min(maxV, curV + amt);

    const amtDisplay = getEl('applier-result-amt');
    amtDisplay.style.color = isDamage ? 'var(--danger)' : 'var(--success)';
    amtDisplay.innerText = (isDamage ? '-' : '+') + amt;

    getEl('applier-result-cur').innerText = newCur;
    getEl('applier-result-max').innerText = maxV;

    // --- NEW: Update the Preview Progress Bar UI ---
    const previewFill = getEl('applier-preview-fill');
    const previewTitle = getEl('applier-preview-title');

    if (previewFill && previewTitle) {
        const pct = Math.min(Math.max((newCur / maxV) * 100, 0), 100);
        previewFill.style.width = `${pct}%`;

        let colorVar = 'var(--hp-color)';
        let titleText = 'HP';

        if (stat === 'stam') {
            colorVar = 'var(--stamina-color)';
            titleText = 'STAMINA';
        } else if (stat === 'mana') {
            colorVar = 'var(--mana-color)';
            titleText = 'MANA';
        }

        previewFill.style.background = colorVar;
        previewTitle.style.color = colorVar;
        previewTitle.innerText = titleText;
    }
}

function toggleApplierMode() {
    const btn = getEl('applier-mode-toggle');
    const modeInput = getEl('applier-mode');

    if (modeInput.value === 'damage') {
        modeInput.value = 'heal';
        btn.innerHTML = 'HEAL / REGEN';
        btn.style.background = 'var(--success)';
        btn.style.color = '#000';
    } else {
        modeInput.value = 'damage';
        btn.innerHTML = 'DAMAGE / DRAIN';
        btn.style.background = 'var(--danger)';
        btn.style.color = '#fff';
    }
    calculateApplier();
}

function applyApplierToSelf() {
    calculateApplier();

    const stat = getEl('applier-stat').value;
    const newCur = parseFloat(getEl('applier-result-cur').innerText);
    const amtStr = getEl('applier-result-amt').innerText;

    const map = {
        hp: ['current-hp', 'HP'],
        stam: ['current-stamina', 'Stamina'],
        mana: ['current-mana', 'Mana']
    };
    const [inputId, statName] = map[stat];

    const targetInput = getEl(inputId);
    targetInput.value = newCur;

    flashElement(targetInput);
    localStorage.setItem(prefix + inputId, newCur);
    calculateAll();

    showToast(`${amtStr.startsWith('+') ? 'Restored' : 'Dealt'} ${amtStr.replace(/[-+]/, '')} to ${statName}!`);
}

function doRest(pct) {
    const maxHp = getNum('max-hp-display') || 100;
    const maxStam = getNum('max-stamina-display') || 100;
    const maxMana = getNum('max-mana-display') || 100;

    const newHp = Math.min(maxHp, getNum('current-hp') + Math.floor(maxHp * pct));
    const newStam = Math.min(maxStam, getNum('current-stamina') + Math.floor(maxStam * pct));
    const newMana = Math.min(maxMana, getNum('current-mana') + Math.floor(maxMana * pct));

    applyRestVisuals(newHp, newStam, newMana);
    showToast(pct === 1 ? "Long Rest: Fully Restored!" : `Short Rest: ${pct * 100}% Restored!`);
}

function longRest() { doRest(1); }
function shortRest() { doRest(0.25); }

function applyRestVisuals(hp, stam, mana) {
    const inputs = [getEl('current-hp'), getEl('current-stamina'), getEl('current-mana')];
    [hp, stam, mana].forEach((val, i) => {
        if (inputs[i]) {
            inputs[i].value = val;
            flashElement(inputs[i]);
            localStorage.setItem(prefix + inputs[i].id, val);
        }
    });
    calculateAll();
}

// --- INVENTORY BACKPACK & TAGS SYSTEM ---

let activeTagFilter = null;

function renderDialogSuggestions(query, suggestions) {
    const suggContainer = getEl('dialog-suggestions');
    if (!suggContainer) return;
    suggContainer.innerHTML = '';
    
    const lowerQuery = query.toLowerCase();
    const filtered = suggestions.filter(s => s.toLowerCase().includes(lowerQuery));
    
    // Only show top 10 suggestions to prevent dialog overflow
    filtered.slice(0, 10).forEach(s => { 
        const btn = document.createElement('button');
        btn.className = 'small-btn';
        btn.style.margin = "2px";
        btn.innerText = s;
        btn.onclick = () => { 
            getEl('dialog-input').value = s; 
            getEl('dialog-input').focus();
            renderDialogSuggestions(s, suggestions); // Update filter based on selection
        };
        suggContainer.appendChild(btn);
    });
}

// --- UPDATED ITEM & TAGGING SYSTEM ---
function promptAddItem() {
    // Collect all existing item names to offer as autocomplete suggestions
    const existingItems = new Set();
    document.querySelectorAll('.inv-name').forEach(input => {
        if(input.value.trim()) existingItems.add(input.value.trim());
    });

    showDialog({
        title: "Add Item",
        text: "Enter the item name:",
        showInput: true,
        suggestions: Array.from(existingItems),
        callback: (ok, val) => {
            if (ok && val.trim()) {
                const itemName = val.trim();
                let found = false;
                
                // Stack items if the name matches an existing inventory slot
                document.querySelectorAll('.inventory-item').forEach(itemDiv => {
                    const nameInput = itemDiv.querySelector('.inv-name');
                    if (nameInput.value.trim().toLowerCase() === itemName.toLowerCase()) {
                        const qtyInput = itemDiv.querySelector('.inv-qty');
                        qtyInput.value = (parseInt(qtyInput.value) || 0) + 1;
                        flashElement(qtyInput);
                        found = true;
                    }
                });

                // If not found, create a new row
                if (!found) {
                    renderInventoryItem({ name: itemName, qty: 1, tags: [] });
                }
                
                saveInventory();
                filterInventory();
            }
        }
    });
}

function renderInventoryItem(saved) {
    const list = getEl('inventory-list');
    const div = document.createElement('div');
    div.className = 'inventory-item';
    div.style.flexDirection = 'column';
    div.style.alignItems = 'stretch';
    
    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.gap = '10px';
    topRow.style.alignItems = 'center';
    topRow.innerHTML = `
        <input type="text" class="inv-name" placeholder="Item Name..." value="${saved ? saved.name : ''}" oninput="saveInventory(); filterInventory();">
        <div class="qty-control-group" style="display: flex; align-items: center; gap: 2px;">
            <button class="small-btn" onclick="adjustItemQty(this, -1)">-</button>
            <input type="number" class="inv-qty" placeholder="Qty" value="${saved ? saved.qty : '1'}" oninput="saveInventory()" style="width: 50px;">
            <button class="small-btn" onclick="adjustItemQty(this, 1)">+</button>
        </div>
        <button class="small-btn" onclick="addTagPrompt(this)" title="Add Tag">🏷️</button>
        <button class="small-btn del" onclick="confirmDeleteInventoryItem(this)">✕</button>
    `;
    
    const tagsRow = document.createElement('div');
    tagsRow.className = 'item-tags-row';
    tagsRow.style.display = 'flex';
    tagsRow.style.flexWrap = 'wrap';
    
    if (saved && saved.tags) {
        saved.tags.forEach(t => appendTagToRow(tagsRow, t));
    }

    div.appendChild(topRow);
    div.appendChild(tagsRow);
    list.appendChild(div);
}



function confirmDeleteInventoryItem(btn) {
    const itemRow = btn.closest('.inventory-item');
    const itemName = itemRow.querySelector('.inv-name').value || "this item";
    
    showDialog({
        title: "Delete Item",
        text: `Are you sure you want to delete "${itemName}" from your backpack?`,
        showInput: false,
        callback: (ok) => {
            if (ok) {
                itemRow.remove();
                saveInventory();
                filterInventory();
            }
        }
    });
}

function adjustItemQty(btn, amount) {
    const qtyInput = btn.closest('.inventory-item').querySelector('.inv-qty');
    const currentVal = parseInt(qtyInput.value) || 0;
    const newVal = Math.max(1, currentVal + amount);    
    qtyInput.value = newVal;
    flashElement(qtyInput);
    saveInventory();
}

function adjustCoin(type, amount) {
    const coinInputId = `coin-${type}`;
    const coinInput = getEl(coinInputId);
    if (!coinInput) return;
    
    const currentVal = parseInt(coinInput.value) || 0;
    const newVal = Math.max(0, currentVal + amount);
    
    coinInput.value = newVal;
    flashElement(coinInput);
    localStorage.setItem(prefix + coinInputId, newVal);
}

function saveInventory() {
    const items = [];
    document.querySelectorAll('.inventory-item').forEach(item => {
        const tags = [];
        item.querySelectorAll('.item-tag-text').forEach(t => tags.push(t.innerText));
        items.push({
            name: item.querySelector('.inv-name').value,
            qty: item.querySelector('.inv-qty').value,
            tags: tags
        });
    });
    localStorage.setItem(prefix + 'inventory', JSON.stringify(items));
    updateTagFilters();
}

function loadInventory() {
    const list = getEl('inventory-list');
    if (!list) return;
    list.innerHTML = '';
    const raw = localStorage.getItem(prefix + 'inventory');
    if (!raw) return;
    JSON.parse(raw).forEach(item => renderInventoryItem(item));
    updateTagFilters();
}

function addTagPrompt(btn) {
    const allTags = new Set();
    document.querySelectorAll('.item-tag-text').forEach(t => allTags.add(t.innerText));
    
    showDialog({
        title: "Add Tag",
        text: "Search or enter a new tag:",
        showInput: true,
        suggestions: Array.from(allTags),
        callback: (ok, val) => {
            if (ok && val.trim()) {
                const tagsRow = btn.closest('.inventory-item').querySelector('.item-tags-row');
                
                // Prevent duplicate tags on the same item
                const existingItemTags = Array.from(tagsRow.querySelectorAll('.item-tag-text')).map(t => t.innerText.toLowerCase());
                if (existingItemTags.includes(val.trim().toLowerCase())) {
                    showToast("Tag already exists on this item.");
                    return;
                }

                appendTagToRow(tagsRow, val.trim());
                saveInventory();
                filterInventory();
            }
        }
    });
}

function appendTagToRow(row, tagText) {
    const span = document.createElement('span');
    span.className = 'item-tag';
    span.innerHTML = `<span class="item-tag-text">${tagText}</span> <span class="del-tag" onclick="this.parentElement.remove(); saveInventory(); filterInventory();">✕</span>`;
    row.appendChild(span);
}

function toggleInvTags() {
    const panel = getEl('inv-tags-panel');
    const arrow = getEl('inv-tag-arrow');
    panel.classList.toggle('open');
    if (arrow) arrow.style.transform = panel.classList.contains('open') ? 'rotate(180deg)' : 'rotate(0deg)';
}

function updateTagFilters() {
    const container = getEl('inv-tags-list');
    if (!container) return;
    container.innerHTML = '';

    const allTags = new Set();
    document.querySelectorAll('.item-tag-text').forEach(t => allTags.add(t.innerText.toLowerCase()));

    if (allTags.size === 0) {
        container.innerHTML = `<span style="color:var(--text-muted); font-size:12px;">No tags created yet.</span>`;
        return;
    }

    allTags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = `filter-tag ${activeTagFilter === tag ? 'active' : ''}`;
        btn.innerText = tag;
        btn.onclick = () => {
            activeTagFilter = activeTagFilter === tag ? null : tag;
            updateTagFilters();
            filterInventory();
        };
        container.appendChild(btn);
    });
}

function filterInventory() {
    const searchInput = getEl('inv-search');
    const query = (searchInput?.value || '').toLowerCase();
    const clearBtn = getEl('clear-search-btn');

    if (clearBtn) clearBtn.style.display = query.length > 0 ? 'block' : 'none';

    document.querySelectorAll('.inventory-item').forEach(item => {
        const name = item.querySelector('.inv-name').value.toLowerCase();
        const tags = Array.from(item.querySelectorAll('.item-tag-text')).map(t => t.innerText.toLowerCase());

        const matchesSearch = name.includes(query) || tags.some(t => t.includes(query));
        const matchesTag = activeTagFilter ? tags.includes(activeTagFilter) : true;

        item.style.display = (matchesSearch && matchesTag) ? 'flex' : 'none';
    });
}

function clearSearch() {
    const searchInput = getEl('inv-search');
    if (searchInput) {
        searchInput.value = '';
        filterInventory();
    }
}

function loadActiveCharacter() {
    prefix = `dnd_v5_${activeChar}_`;
    document.querySelectorAll('[data-save="true"]').forEach(input => {
        if (input.type === 'checkbox') {
            const val = localStorage.getItem(prefix + input.id);
            input.checked = val === 'true';
            if (input.parentElement.classList.contains('lock-toggle-btn')) {
                input.parentElement.classList.toggle('locked', input.checked);
            }
        } else {
            const val = localStorage.getItem(prefix + input.id);
            if (val !== null) input.value = val;
        }

        input.oninput = () => {
            if (input.type === 'checkbox') {
                localStorage.setItem(prefix + input.id, input.checked);
                if (input.parentElement.classList.contains('lock-toggle-btn')) {
                    input.parentElement.classList.toggle('locked', input.checked);
                }
            } else {
                localStorage.setItem(prefix + input.id, input.value);
            }

            if (input.id === 'name') getEl('header-name').textContent = input.value || activeChar;
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
        const oldPhys = getNum('weapon-base') || 10;
        const oldMag = getNum('spell-base') || 10;
        const oldLore = localStorage.getItem(prefix + 'weapon-details') || '';
        const oldImg = localStorage.getItem(prefix + 'weapon_image') || '';
        let oldEncs = [];
        try { oldEncs = JSON.parse(localStorage.getItem(prefix + 'enchants') || '[]'); } catch (e) { }

        weaponsList = [{
            id: Date.now(), name: 'Main Weapon', phys: oldPhys, mag: oldMag,
            lore: oldLore, img: oldImg, enchants: oldEncs, equipped: true
        }];
        saveWeaponsState();
    }
    renderWeapons();

    const nameInput = getEl('name');
    if (nameInput) {
        getEl('header-name').textContent = nameInput.value || activeChar;
    }
    loadInventory();
    loadNotes();

    const applierStatValEl = getEl('applier-stat');
    if (applierStatValEl) {
        const applierStatVal = applierStatValEl.value;
        const statText = applierStatVal === 'hp' ? 'Health (HP)' : applierStatVal === 'stam' ? 'Stamina' : 'Mana';
        const customToggle = document.querySelector('#applier-stat-dropdown .custom-toggle');
        if (customToggle) customToggle.innerText = statText;

        const applierTypeVal = getEl('applier-type').value;
        const typeText = applierTypeVal === 'max_pct' ? '% of Max' : applierTypeVal === 'cur_pct' ? '% of Current' : 'Flat Value';
        document.querySelector('#applier-type-dropdown .custom-toggle').innerText = typeText;
    }

    calculateAll();
}

function toggleCharDrawer() {
    const drawer = getEl('char-drawer');
    if (drawer) drawer.classList.toggle('open');
}

function renderCharList() {
    const container = getEl('char-list');
    if (!container) return;
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
    reader.onload = function (e) {
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
    getEl('theme-dropdown').classList.toggle('open');
}

function selectTheme(theme, label) {
    setTheme(theme, label);
    getEl('theme-dropdown').classList.remove('open');
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
    getEl('dialog-title').innerText = opts.title || "Alert";
    getEl('dialog-text').innerText = opts.text || "";
    const input = getEl('dialog-input');
    input.value = "";
    input.style.display = opts.showInput ? "block" : "none";
    
    const suggContainer = getEl('dialog-suggestions');
    if (suggContainer) suggContainer.innerHTML = '';

    // Attach live-search filtering for suggestions if they are provided
    if (opts.showInput && opts.suggestions) {
        input.oninput = () => renderDialogSuggestions(input.value, opts.suggestions);
        renderDialogSuggestions('', opts.suggestions);
    } else {
        input.oninput = null;
    }

    getEl('custom-dialog').classList.add('show');
    dialogCb = opts.callback;
}

getEl('dialog-confirm-btn').onclick = () => {
    getEl('custom-dialog').classList.remove('show');
    if (dialogCb) dialogCb(true, getEl('dialog-input').value);
};

getEl('dialog-cancel-btn').onclick = () => {
    getEl('custom-dialog').classList.remove('show');
    if (dialogCb) dialogCb(false, null);
};

getEl('dialog-close-x')?.addEventListener('click', () => {
    getEl('custom-dialog').classList.remove('show');
    if (dialogCb) dialogCb(false, null);
});

getEl('dialog-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        getEl('dialog-confirm-btn').click();
    }
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

// --- INVENTORY COIN SYSTEM ---

function toggleTransactionPanel() {
    const panel = getEl('transaction-panel');
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
}

function handleTransaction(action) {
    const amt = parseInt(getEl('trans-amt').value);
    const type = getEl('trans-type').value;
    const typeDropdown = getEl('trans-type');
    const typeName = typeDropdown.options[typeDropdown.selectedIndex].text;

    if (!amt || amt <= 0) {
        showToast("Please enter a valid amount.");
        return;
    }

    const coinInputId = `coin-${type}`;
    const coinInput = getEl(coinInputId);
    const currentCoins = parseInt(coinInput.value) || 0;

    let warningText = `Confirm Transaction: ${action === 'add' ? 'Add' : 'Spend'} ${amt} ${typeName}?`;

    if (action === 'spend' && (currentCoins - amt) < 0) {
        warningText = `⚠️ Insufficient Funds! This will drop your ${typeName} below zero. Proceed anyway?`;
    }

    showDialog({
        title: "Quick Transaction",
        text: warningText,
        showInput: false,
        callback: (ok) => {
            if (ok) {
                const newVal = action === 'add' ? currentCoins + amt : currentCoins - amt;
                coinInput.value = newVal;
                localStorage.setItem(prefix + coinInputId, newVal);
                flashElement(coinInput);
                showToast("Transaction successful!");
                getEl('trans-amt').value = 0;
            }
        }
    });
}