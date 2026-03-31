function updateInputs() {
    const type = document.getElementById('calc-type').value;
    const groups = ['group-x', 'group-y', 'group-a', 'group-d'];
    groups.forEach(id => document.getElementById(id).style.display = 'none');
    document.getElementById('result-box').style.display = 'none';

    if (type) document.getElementById('group-x').style.display = 'block';

    switch(type) {
        case 'damage':
            document.getElementById('label-x').innerText = "Strength Point (x):";
            document.getElementById('group-a').style.display = 'block';
            document.getElementById('label-a').innerText = "Weapon Base Damage (a):";
            document.getElementById('group-d').style.display = 'block';
            break;
        case 'forecast':
            document.getElementById('label-x').innerText = "Forecast Point (x):";
            document.getElementById('group-d').style.display = 'block';
            break;
        case 'dodge':
        case 'accuracy':
            document.getElementById('label-x').innerText = "Stat Point (x):";
            document.getElementById('group-y').style.display = 'block';
            document.getElementById('group-d').style.display = 'block';
            break;
        case 'magic_damage':
            document.getElementById('label-x').innerText = "Casting Point (x):";
            document.getElementById('group-a').style.display = 'block';
            break;
        case 'mana_cost':
            document.getElementById('label-x').innerText = "Control Point (x):";
            document.getElementById('group-a').style.display = 'block';
            break;
        default:
            document.getElementById('label-x').innerText = "Stat Point (x):";
    }
}

function calculate() {
    const type = document.getElementById('calc-type').value;
    const x = parseFloat(document.getElementById('input-x').value) || 0;
    const y = parseFloat(document.getElementById('input-y').value) || 0;
    const a = parseFloat(document.getElementById('input-a').value) || 0;
    const d = parseFloat(document.getElementById('input-d').value) || 0;

    let result = 0;
    let suffix = "";

    switch(type) {
        case 'damage':
            let mult = d === 1 ? 0.5 : d <= 9 ? 0.75 : d <= 11 ? 1 : d <= 15 ? 1.5 : d <= 19 ? 1.75 : 2;
            result = a * ((0.5 * x) + 1) * mult;
            suffix = " Damage";
            break;
        case 'distance': result = 10 * ((0.2 * x) + 1); suffix = " Meters"; break;
        case 'stamina': result = 100 * ((0.2 * x) + 1); suffix = " Stamina"; break;
        case 'maxhp': result = 100 * ((0.5 * x) + 1); suffix = " HP"; break;
        case 'forecast': result = 10 * ((0.05 * x) + 1) * d; suffix = " Extra Points"; break;
        case 'dodge':
        case 'accuracy':
            result = (10 * ((0.1 * x) + 1) * d) + (10 * ((0.05 * y) + 1) * d);
            suffix = type === 'dodge' ? " Dodge Score" : " Hit Score";
            break;
        case 'magic_damage': result = a * ((0.5 * x) + 1); suffix = " Magic Damage"; break;
        case 'mana_cost': result = a * ((100 - x) / 100); suffix = " Mana Needed"; break;
        case 'mana_tank': result = 100 * ((0.2 * x) + 1); suffix = " Max Mana"; break;
    }

    document.getElementById('output-value').innerText = result.toFixed(2).replace(/\.00$/, '') + suffix;
    document.getElementById('result-box').style.display = 'block';
}
