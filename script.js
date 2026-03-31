window.onload = function() {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        const savedValue = localStorage.getItem(input.id);
        if (savedValue !== null) {
            input.value = savedValue;
        }
        // Auto-save and auto-calculate on any change
        input.addEventListener('input', () => {
            localStorage.setItem(input.id, input.value);
            calculateAll();
        });
    });
    calculateAll();
};

function rollDice() {
    const result = Math.floor(Math.random() * 20) + 1;
    document.getElementById('d20-roll').value = result;
    localStorage.setItem('d20-roll', result);
    calculateAll();
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

    // Multiplier
    let mult = 1;
    if (d20 <= 1) mult = 0.5;
    else if (d20 <= 9) mult = 0.75;
    else if (d20 <= 11) mult = 1;
    else if (d20 <= 15) mult = 1.5;
    else if (d20 <= 19) mult = 1.75;
    else mult = 2;

    // Combat & Magic Math
    const damage = weaponBase * ((0.5 * str) + 1) * mult;
    const magicDmg = spellBase * ((0.5 * cast) + 1);
    const extraForecast = 10 * ((0.05 * forc) + 1) * d20;
    const dodgeScore = (10 * ((0.1 * dex) + 1) * d20) + extraForecast;
    const hitScore = (10 * ((0.1 * acc) + 1) * d20) + extraForecast;
    const manaCost = spellBase * ((100 - ctrl) / 100);

    // Tanks & Vitals
    const stamina = 100 * ((0.2 * end) + 1);
    const hp = 100 * ((0.5 * con) + 1);
    const maxMana = 100 * ((0.2 * manaSup) + 1);

    // Utility Math
    const distance = 10 * ((0.2 * spd) + 1);
    const carryCap = 50 + (str * 5);
    const actions = 1 + Math.floor(dex / 20);
    const sensingRange = sens * 30;
    
    // Initiative Bracket
    let initBonus = 2;
    if (qd <= 20) initBonus = 2;
    else if (qd <= 40) initBonus = 4;
    else if (qd <= 60) initBonus = 6;
    else if (qd <= 80) initBonus = 8;
    else initBonus = 10;

    // Update Live Tracker Max Values
    document.getElementById('max-hp-display').innerText = hp.toFixed(2).replace(/\.00$/, '');
    document.getElementById('max-stamina-display').innerText = stamina.toFixed(2).replace(/\.00$/, '');
    document.getElementById('max-mana-display').innerText = maxMana.toFixed(2).replace(/\.00$/, '');

    // Update Results Box
    document.getElementById('res-damage').innerText = damage.toFixed(2);
    document.getElementById('res-magic').innerText = magicDmg.toFixed(2);
    document.getElementById('res-hit').innerText = hitScore.toFixed(2);
    document.getElementById('res-dodge').innerText = dodgeScore.toFixed(2);
    document.getElementById('res-cost').innerText = manaCost.toFixed(2);
    document.getElementById('res-forecast').innerText = extraForecast.toFixed(2);

    document.getElementById('res-actions').innerText = actions;
    document.getElementById('res-distance').innerText = distance.toFixed(2);
    document.getElementById('res-init').innerText = initBonus;
    document.getElementById('res-carry').innerText = carryCap;
    document.getElementById('res-sense').innerText = sensingRange;
    // Update DM Math Breakdown
    document.getElementById('dm-math').innerHTML = `
        <p><strong>Physical Damage:</strong> ${weaponBase} * ((0.5 * ${str}) + 1) * ${mult} = ${damage.toFixed(2)}</p>
        <p><strong>Magic Damage:</strong> ${spellBase} * ((0.5 * ${cast}) + 1) = ${magicDmg.toFixed(2)}</p>
        <p><strong>Hit Score:</strong> [10 * ((0.1 * ${acc}) + 1) * ${d20}] + ${extraForecast.toFixed(2)} = ${hitScore.toFixed(2)}</p>
        <p><strong>Dodge Score:</strong> [10 * ((0.1 * ${dex}) + 1) * ${d20}] + ${extraForecast.toFixed(2)} = ${dodgeScore.toFixed(2)}</p>
        <p><strong>Max HP:</strong> 100 * ((0.5 * ${con}) + 1) = ${hp.toFixed(2)}</p>
        <p><strong>Stamina:</strong> 100 * ((0.2 * ${end}) + 1) = ${stamina.toFixed(2)}</p>
        <p><strong>Max Mana:</strong> 100 * ((0.2 * ${manaSup}) + 1) = ${maxMana.toFixed(2)}</p>
        <p><strong>Mana Cost:</strong> ${spellBase} * ((100 - ${ctrl}) / 100) = ${manaCost.toFixed(2)}</p>
    `;
}
