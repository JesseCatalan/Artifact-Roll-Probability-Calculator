var artifact_mainstats = {
  '---': ['---'],
  'Flower of Life': ['HP'],
  'Plume of Death': ['ATK'],
  'Sands of Eon': ['HP%', 'ATK%', 'DEF%', 'Elemental Mastery', 'Energy Recharge%'],
  'Goblet of Eonothem': ['HP%', 'ATK%', 'DEF%', 'Elemental Mastery', 'DMG Bonus%'],
  'Circlet of Logos': ['HP%', 'ATK%', 'DEF%', 'Elemental Mastery', 'CRIT Rate%', 'CRIT DMG%', 'Healing Bonus%']
};

var artifact_substat_weights = {'---': 0, 'HP': 6, 'ATK': 6, 'DEF': 6, 'HP%': 4, 'ATK%': 4, 'DEF%': 4, 'Energy Recharge%': 4, 'Elemental Mastery': 4, 'CRIT Rate%': 3, 'CRIT DMG%': 3};

var selected_substats = [];

var desired_substats = [];

// populate mainstat dropdown dynamically
function populateMainstatDropdown(dropdown_value) {
  var mainstat_dropdown = document.getElementById('mainstat-dropdown');
  // clear options
  mainstat_dropdown.innerHTML = '';

  var options = artifact_mainstats[dropdown_value];
  if (options) {
    options.forEach(function(option) {
      var option_element = document.createElement('option');
      option_element.value = option;
      option_element.textContent = option;
      mainstat_dropdown.appendChild(option_element);
    });
  }

  // manually change the dropdown value
  mainstat_dropdown.value = options[0];
}

// populate substat dropdowns dynamically
function populateSubstatsDropdown(dropdown_value) {
  var filtered_options = Object.keys(artifact_substat_weights).filter(substat => (!selected_substats.includes(substat) && substat !== dropdown_value) || substat === '---');

  for (var i = 1; i <= 4; i++) {
    var substat_dropdown = document.getElementById('substat-dropdown' + i);

    // reset to default case
    if (dropdown_value === '---') {
      substat_dropdown.innerHTML = `<option value="---">---</option>`;
      substat_dropdown.value = '---';
      continue;
    }

    // save dropdown value before clearing options
    var substat_dropdown_value = substat_dropdown.value;

    // clear options, this resets the dropdown's value to the empty string
    substat_dropdown.innerHTML = '';

    // maintain currently selected value when mainstat/sibling dropdown_value's value changes
    if (dropdown_value !== substat_dropdown_value && substat_dropdown_value !== '---') {
      var option_element = document.createElement('option');
      option_element.value = substat_dropdown_value;
      option_element.textContent = substat_dropdown_value;
      substat_dropdown.appendChild(option_element);
      substat_dropdown.value = substat_dropdown_value;
    }

    // add remaining options
    filtered_options.forEach(function(option) {
      var option_element = document.createElement('option');
      option_element.value = option;
      option_element.textContent = option;
      substat_dropdown.appendChild(option_element);
    });

    // reset to default when mainstat dropdown_value changes
    if (dropdown_value === substat_dropdown_value || substat_dropdown_value === '---') {
      substat_dropdown.value = '---';
      var substat_0_roll_id = 'substat' + i + '+0';
      var substat_0_roll = document.getElementById(substat_0_roll_id);
      substat_0_roll.checked = true;
      // remove substat from filtered options programatically
      if (substat_dropdown_value !== '---') {
        substat_dropdown.dispatchEvent(new Event('change'));
        break; // not required but removes unnecessary work
      }
    }
  }
}

function extractDesiredSubstats() {
  desired_substats = []
  document.querySelectorAll('.desired-substat-toggle').forEach(function(toggle) {
    if (toggle.checked) {
      desired_substats.push(toggle.value);
    }
  });
}

function submit() {
  var rolls = validateInputs();
  if (Object.keys(rolls).length === 0 && rolls.constructor === Object) {
    console.log('Invalid Inputs');
    return;
  }

  var probabilities = calculateProbabilities(rolls.priority_substats, rolls.total_rolls, rolls.enhancement_rolls, rolls.priority_rolls);
  
  printProbabilityTable(probabilities);
}

function validateInputs() {
  // check for artifact and artifact mainstat
  if (document.getElementById('artifact-dropdown').value === '---' || document.getElementById('mainstat-dropdown').value === '---') {
    console.log('An artifact and mainstat must be selected');
    return {};
  }

  // check for at least three substats
  var substats = selected_substats.filter(function(substat) {
    return substat !== '---';
  });
  if (substats.length < 3) {
    console.log('Select at least three substats');
    return {};
  }

  // check individual rolls
  extractDesiredSubstats();
  var total_rolls = 0;
  var priority_rolls = 0;
  var priority_substats = 0;
  for (var i = 1; i <= 4; i++) {
    var rolls = document.querySelector('input[name="substat-' + i + '-rolls"]:checked').value;
    var substat = document.getElementById('substat-dropdown' + i);
    if (substat.value !== '---') {
      if (rolls === '0') {
        console.log('Valid substats should have at least one roll');
        return {};
      }
      total_rolls += parseInt(rolls, 10);
      if (desired_substats.includes(substat.value)) {
        priority_rolls += parseInt(rolls, 10);
        priority_substats += 1;
      }
    } else {
      if (rolls !== '0') {
        console.log('Invalid substats should have zero rolls');
        return {};
      }
    }
  }

  // check invalid roll distribution
  if (substats.length === 3 && total_rolls > 3) {
    console.log('Number of rolls requires another substat selection');
    return {};
  }

  // check total rolls
  var enhancement_rolls = parseInt(document.querySelector('input[name="enhancement-level-switch"]:checked').value, 10);
  if (total_rolls < 3 + enhancement_rolls || total_rolls > 4 + enhancement_rolls) {
    console.log('Invalid number of total rolls');
    return {};
  }

  return {
    priority_substats: priority_substats,
    total_rolls: total_rolls,
    enhancement_rolls: enhancement_rolls,
    priority_rolls: priority_rolls
  };
}

function calculateProbabilities(priority_substats, total_rolls, enhancement_rolls, priority_rolls) {
  // minimum = current number of priority rolls
  // maximum = current number of priority rolls + remaining enhancement rolls

  var probabilities = {}
  var stats = new Statistics([], {});

  if (total_rolls === 3) {
    console.log('TODO');
  } else {
    var odds = priority_substats/4;
    var remaining_rolls = 5 - enhancement_rolls;
    var distribution = stats.binomialCumulativeDistribution(remaining_rolls, odds);
    for (var i = 1; i <= remaining_rolls; i++) {
      var key = priority_rolls+i;
      probabilities[key] = 1 - distribution[i-1];
    }
  }

  return probabilities;
}

function printProbabilityTable(probabilities) {
  var table = document.getElementById('probability-table');

  // reset the table
  table.innerHTML = `
    <tr>
      <th class="rolls-column cell">Rolls</th>
      <th class="rolls-column cell">Probability</th>
    </tr>
  `;

  Object.keys(probabilities).forEach(function(n) {
    var row = table.insertRow();
    var roll_cell = row.insertCell();
    roll_cell.innerHTML = n;
    roll_cell.classList.add('rolls-column');
    roll_cell.classList.add('cell');
    var probability_cell = row.insertCell();
    probability_cell.classList.add('rolls-column');
    probability_cell.classList.add('cell');
    probability_cell.innerHTML = probabilities[n];
  });

  document.getElementById('table-container').style.display = 'block';
}

// event listeners
function artifactDropdownChange() {
  var artifact_dropdown = document.getElementById('artifact-dropdown');
  populateMainstatDropdown(artifact_dropdown.value);
  mainstatDropdownChange();
}

function mainstatDropdownChange() {
  var mainstat_dropdown = document.getElementById('mainstat-dropdown');
  populateSubstatsDropdown(mainstat_dropdown.value);
}

document.getElementById('artifact-dropdown').addEventListener('change', artifactDropdownChange);

document.getElementById('mainstat-dropdown').addEventListener('change', mainstatDropdownChange);

document.querySelectorAll('.substat-dropdown').forEach(function(dropdown) {
  dropdown.addEventListener('change', function() {
    selected_substats = Array.from(document.querySelectorAll('.substat-dropdown'))
    .map(function(dropdown) {
      return dropdown.value;
    })
    .filter(function(option) {
      return option !== '---';
    });
    var mainstat_dropdown = document.getElementById('mainstat-dropdown');
    populateSubstatsDropdown(mainstat_dropdown.value);
  });
});





