const STORAGE_KEY = 'vasco-analise-2026-v1';

const basePlayers = [
  ['Léo Jardim', 'Goleiro', 1, 'https://media.vasco.com.br/static/2023/04/11-Copia-2.png'],
  ['Carlos Cuesta', 'Zagueiro', 46, ''],
  ['Robert Renan', 'Zagueiro', 30, 'https://media.vasco.com.br/static/2025/08/29.png'],
  ['Saldivia', 'Zagueiro', 4, 'https://media.vasco.com.br/static/2026/01/35-Copia-2.png'],
  ['Lucas Freitas', 'Zagueiro', 43, 'https://media.vasco.com.br/static/2025/09/4.png'],
  ['Paulo Henrique', 'Lateral Direito', 96, 'https://media.vasco.com.br/static/2023/04/13-Copia-2.png'],
  ['Puma Rodriguez', 'Lateral Direito', 2, 'https://media.vasco.com.br/static/2023/04/19-Copia-2.png'],
  ['Cuiabano', 'Lateral Esquerdo', 66, 'https://media.vasco.com.br/static/2026/02/Site-Elenco-2026-1.png'],
  ['Lucas Piton', 'Lateral Esquerdo', 6, 'https://media.vasco.com.br/static/2024/04/15-Copia-2.png'],
  ['Cauan Barros', 'Volante', 88, 'https://media.vasco.com.br/static/2025/08/2.png'],
  ['Thiago Mendes', 'Volante', 23, 'https://media.vasco.com.br/static/2025/07/27.png'],
  ['Tchê Tchê', 'Volante', 3, 'https://media.vasco.com.br/static/2025/01/14.png'],
  ['Jair', 'Volante', 8, 'https://media.vasco.com.br/static/2023/04/10-Copia-2.png'],
  ['Hugo Moura', 'Volante', 25, 'https://media.vasco.com.br/static/2024/04/26-Copia-2.png'],
  ['Mateus Carvalho', 'Volante', 85, 'https://media.vasco.com.br/static/2023/04/Site-Elenco-6.png'],
  ['Johan Rojas', 'Meia', 29, 'https://media.vasco.com.br/static/2026/01/36-Copia.png'],
  ['Guilherme Estrella', 'Meia', 14, 'https://media.vasco.com.br/static/2024/07/3-Copia-2.png'],
  ['JP', 'Meia', 98, 'https://media.vasco.com.br/static/2023/09/32-Copia-2.png'],
  ['Coutinho', 'Meia', 10, 'https://media.vasco.com.br/static/2024/07/3-Copia-2.png'],
  ['Matheus França', 'Atacante', 9, 'https://media.vasco.com.br/static/2025/08/9.png'],
  ['Andrés Gómez', 'Atacante', 11, 'https://media.vasco.com.br/static/2025/08/5.png'],
  ['Nuno Moreira', 'Atacante', 17, 'https://media.vasco.com.br/static/2025/03/18.png'],
  ['Marino', 'Atacante', 18, 'https://media.vasco.com.br/static/2026/02/Site-Elenco-5.png'],
  ['Brenner', 'Atacante', 20, 'https://media.vasco.com.br/static/2026/02/Site-Elenco-6.png'],
  ['Claudio Spinelli', 'Atacante', 77, 'https://media.vasco.com.br/static/2026/02/Site-Elenco-2026.png'],
  ['David', 'Atacante', 7, 'https://media.vasco.com.br/static/2024/04/17-Copia-2.png'],
  ['Adson', 'Atacante', 28, 'https://media.vasco.com.br/static/2024/04/1-Copia-2.png']
].map(([name, position, shirt, photo]) => ({ name, position, shirt, photo }));

const defaultSocio = {
  'Socio Dinamite': 100,
  'Socio 5 estrelas': 75,
  'Socio 4 estrelas': 70,
  'Socio 3 estrelas': 65,
  'Socio 2 estrelas': 60,
  'Camisas Negras': 30
};

const multipliers = {
  'Campeonato Carioca': 1,
  'Copa Sulamericana': 3,
  'Copa do Brasil': 6,
  'Brasileirão': 9
};

const pointRules = {
  goal: 5,
  assist: 2.5,
  yellow: -1.5,
  secondYellow: -1.5,
  red: -3,
  cleanSheet: 6,
  penaltySave: 10,
  ownGoal: -5,
  missedPenalty: -7
};

const state = loadState();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { matches: [], players: basePlayers, socioPrices: defaultSocio };
  }
  const parsed = JSON.parse(raw);
  return {
    matches: parsed.matches || [],
    players: parsed.players?.length ? parsed.players : basePlayers,
    socioPrices: parsed.socioPrices || defaultSocio
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function parseMinute(raw) {
  const value = String(raw || '').trim();
  if (/^\d+$/.test(value)) return { valid: true, minute: Number(value), label: value };
  if (/^(45|90)\+\d+$/.test(value)) {
    const [base, extra] = value.split('+').map(Number);
    return { valid: true, minute: base + extra, label: `${base}+${extra}` };
  }
  return { valid: false, minute: 0, label: value };
}

function parseLines(text, mapper) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(mapper)
    .filter(Boolean);
}

function buildMatchFromForm() {
  const get = (id) => document.getElementById(id).value;
  const goals = parseLines(get('goals'), (line) => {
    const [minute, player, type, assistPlayer, assistType, ownGoal, missedPenalty] = line.split('|').map((p) => p?.trim());
    const m = parseMinute(minute);
    if (!m.valid || !player) return null;
    return {
      minute: m.label,
      minuteValue: m.minute,
      player,
      type: type || 'Normal',
      assistPlayer: assistPlayer || '',
      assistType: assistType || '',
      ownGoal: (ownGoal || '').toLowerCase() === 'sim',
      missedPenalty: (missedPenalty || '').toLowerCase() === 'sim'
    };
  });

  const cards = parseLines(get('cards'), (line) => {
    const [minute, player, type] = line.split('|').map((p) => p?.trim());
    const m = parseMinute(minute);
    if (!m.valid || !player) return null;
    return { minute: m.label, minuteValue: m.minute, player, type: (type || '').toLowerCase() };
  });

  const lineup = parseLines(get('lineup'), (line) => {
    const [player, position] = line.split('|').map((p) => p?.trim());
    if (!player) return null;
    return { player, position: position || '' };
  });

  const substitutions = parseLines(get('substitutions'), (line) => {
    const [minute, outPlayer, inPlayer] = line.split('|').map((p) => p?.trim());
    const m = parseMinute(minute);
    if (!m.valid || !outPlayer || !inPlayer) return null;
    return { minute: m.label, minuteValue: m.minute, outPlayer, inPlayer };
  });

  const penaltySaves = parseLines(get('penaltySaves'), (line) => {
    const [minute, player] = line.split('|').map((p) => p?.trim());
    const m = parseMinute(minute);
    if (!m.valid || !player) return null;
    return { minute: m.label, minuteValue: m.minute, player };
  });

  return {
    id: get('match-id') || crypto.randomUUID(),
    date: get('date'),
    time: get('time'),
    round: get('round'),
    phase: get('phase'),
    competition: get('competition'),
    opponent: get('opponent'),
    stadium: get('stadium'),
    referee: get('referee'),
    uniform: get('uniform'),
    isHome: get('isHome') === 'true',
    homeBySale: get('homeBySale') === 'true',
    goalsFor: Number(get('goalsFor') || 0),
    goalsAgainst: Number(get('goalsAgainst') || 0),
    extraTime: get('extraTime') === 'true',
    penalties: get('penalties') === 'true',
    attendancePresent: Number(get('attendancePresent') || 0),
    attendancePaid: Number(get('attendancePaid') || 0),
    revenue: Number(get('revenue') || 0),
    ticketFull: Number(get('ticketFull') || 0),
    ticketHalf: Number(get('ticketHalf') || 0),
    goals,
    cards,
    lineup,
    substitutions,
    penaltySaves
  };
}

function resetForm() {
  document.getElementById('match-form').reset();
  document.getElementById('match-id').value = '';
}

function renderMatches() {
  const list = document.getElementById('matches-list');
  if (!state.matches.length) {
    list.innerHTML = '<p>Nenhuma partida cadastrada.</p>';
    return;
  }
  list.innerHTML = state.matches
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    .map((m) => `
      <article class="match-card">
        <strong>${m.date} ${m.time} - Vasco ${m.goalsFor} x ${m.goalsAgainst} ${m.opponent}</strong>
        <div>${m.competition} • ${m.phase} • ${m.round} • ${m.stadium || 'Sem estádio'}</div>
        <div>Árbitro: ${m.referee || '-'} | Uniforme: ${m.uniform || '-'} | Público: ${m.attendancePresent || 0}</div>
        <div class="match-actions">
          <button onclick="editMatch('${m.id}')">Editar</button>
          <button class="danger" onclick="deleteMatch('${m.id}')">Excluir</button>
        </div>
      </article>
    `)
    .join('');
}

window.editMatch = (id) => {
  const m = state.matches.find((item) => item.id === id);
  if (!m) return;
  const set = (id, value) => { document.getElementById(id).value = value ?? ''; };
  set('match-id', m.id); set('date', m.date); set('time', m.time); set('round', m.round); set('phase', m.phase);
  set('competition', m.competition); set('opponent', m.opponent); set('stadium', m.stadium); set('referee', m.referee);
  set('uniform', m.uniform); set('isHome', String(m.isHome)); set('homeBySale', String(m.homeBySale));
  set('goalsFor', m.goalsFor); set('goalsAgainst', m.goalsAgainst); set('extraTime', String(m.extraTime)); set('penalties', String(m.penalties));
  set('attendancePresent', m.attendancePresent); set('attendancePaid', m.attendancePaid); set('revenue', m.revenue);
  set('ticketFull', m.ticketFull); set('ticketHalf', m.ticketHalf);
  set('lineup', m.lineup.map((l) => `${l.player} | ${l.position}`).join('\n'));
  set('substitutions', m.substitutions.map((s) => `${s.minute} | ${s.outPlayer} | ${s.inPlayer}`).join('\n'));
  set('goals', m.goals.map((g) => `${g.minute} | ${g.player} | ${g.type} | ${g.assistPlayer || ''} | ${g.assistType || ''} | ${g.ownGoal ? 'sim' : 'não'} | ${g.missedPenalty ? 'sim' : 'não'}`).join('\n'));
  set('cards', m.cards.map((c) => `${c.minute} | ${c.player} | ${c.type}`).join('\n'));
  set('penaltySaves', m.penaltySaves.map((p) => `${p.minute} | ${p.player}`).join('\n'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteMatch = (id) => {
  state.matches = state.matches.filter((m) => m.id !== id);
  saveState();
  renderAll();
};

function safeDiv(a, b) { return b ? (a / b) : 0; }

function calculateAllStats() {
  const team = {
    games: state.matches.length, wins: 0, draws: 0, losses: 0,
    goalsFor: 0, goalsAgainst: 0
  };
  const home = { games: 0, paidTotal: 0, presentTotal: 0, revenueTotal: 0, ticketAvgTotal: 0 };
  const players = {};
  const partners = {};

  const ensure = (name) => {
    if (!players[name]) {
      players[name] = {
        goals: 0, assists: 0, yellow: 0, secondYellow: 0, red: 0, ownGoals: 0, missedPenalty: 0,
        penaltySave: 0, cleanSheet: 0, points: 0
      };
    }
    return players[name];
  };

  for (const m of state.matches) {
    team.goalsFor += m.goalsFor;
    team.goalsAgainst += m.goalsAgainst;
    if (m.goalsFor > m.goalsAgainst) team.wins += 1;
    else if (m.goalsFor === m.goalsAgainst) team.draws += 1;
    else team.losses += 1;

    if (m.isHome || m.homeBySale) {
      home.games += 1;
      home.paidTotal += m.attendancePaid || 0;
      home.presentTotal += m.attendancePresent || 0;
      home.revenueTotal += m.revenue || 0;
      const avgTicket = safeDiv((m.revenue || 0), (m.attendancePaid || 0));
      home.ticketAvgTotal += avgTicket;
    }

    const mult = multipliers[m.competition] || 1;

    for (const g of m.goals) {
      const p = ensure(g.player);
      p.goals += 1;
      p.points += pointRules.goal * mult;
      if (g.ownGoal) { p.ownGoals += 1; p.points += pointRules.ownGoal * mult; }
      if (g.missedPenalty) { p.missedPenalty += 1; p.points += pointRules.missedPenalty * mult; }
      if (g.assistPlayer) {
        const a = ensure(g.assistPlayer);
        a.assists += 1;
        a.points += pointRules.assist * mult;
        const key = [g.player, g.assistPlayer].sort().join(' + ');
        partners[key] = (partners[key] || 0) + 1;
      }
    }

    for (const c of m.cards) {
      const p = ensure(c.player);
      if (c.type === 'amarelo') { p.yellow += 1; p.points += pointRules.yellow * mult; }
      if (c.type === 'segundo amarelo') { p.secondYellow += 1; p.red += 1; p.points += (pointRules.secondYellow + pointRules.red) * mult; }
      if (c.type === 'vermelho') { p.red += 1; p.points += pointRules.red * mult; }
    }

    for (const ps of m.penaltySaves) {
      const p = ensure(ps.player);
      p.penaltySave += 1;
      p.points += pointRules.penaltySave * mult;
    }

    if (m.goalsAgainst === 0) {
      const startMinutes = {};
      const endMinutes = {};
      m.lineup.forEach((l) => {
        startMinutes[l.player] = 0;
        endMinutes[l.player] = 90;
      });
      m.substitutions.forEach((s) => {
        endMinutes[s.outPlayer] = s.minuteValue;
        startMinutes[s.inPlayer] = s.minuteValue;
        endMinutes[s.inPlayer] = 90;
      });
      m.lineup.forEach((l) => {
        const isDef = ['Goleiro', 'Zagueiro', 'Lateral Direito', 'Lateral Esquerdo'].includes(l.position);
        const minutesPlayed = (endMinutes[l.player] ?? 90) - (startMinutes[l.player] ?? 0);
        if (isDef && minutesPlayed >= 60) {
          const p = ensure(l.player);
          p.cleanSheet += 1;
          p.points += pointRules.cleanSheet * mult;
        }
      });
    }
  }

  return {
    team,
    teamAvg: {
      goalsFor: safeDiv(team.goalsFor, team.games).toFixed(2),
      goalsAgainst: safeDiv(team.goalsAgainst, team.games).toFixed(2),
      wins: safeDiv(team.wins, team.games).toFixed(2),
      draws: safeDiv(team.draws, team.games).toFixed(2),
      losses: safeDiv(team.losses, team.games).toFixed(2)
    },
    home: {
      ...home,
      paidAvg: safeDiv(home.paidTotal, home.games).toFixed(0),
      presentAvg: safeDiv(home.presentTotal, home.games).toFixed(0),
      revenueAvg: safeDiv(home.revenueTotal, home.games).toFixed(2),
      ticketAvg: safeDiv(home.ticketAvgTotal, home.games).toFixed(2)
    },
    players,
    partners
  };
}

function toRank(mapper, take = 10) {
  return Object.entries(mapper)
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([name, value]) => `<li>${name}: <strong>${Number(value).toFixed(2).replace('.00', '')}</strong></li>`)
    .join('') || '<li>Sem dados</li>';
}

function renderStats() {
  const stats = calculateAllStats();
  document.getElementById('team-stats').innerHTML = `
    <div class="stat"><span>Jogos</span><strong>${stats.team.games}</strong></div>
    <div class="stat"><span>Vitórias</span><strong>${stats.team.wins}</strong></div>
    <div class="stat"><span>Empates</span><strong>${stats.team.draws}</strong></div>
    <div class="stat"><span>Derrotas</span><strong>${stats.team.losses}</strong></div>
    <div class="stat"><span>Gols Pró</span><strong>${stats.team.goalsFor}</strong></div>
    <div class="stat"><span>Gols Contra</span><strong>${stats.team.goalsAgainst}</strong></div>
    <div class="stat"><span>Média Gols Pró</span><strong>${stats.teamAvg.goalsFor}</strong></div>
    <div class="stat"><span>Média Gols Contra</span><strong>${stats.teamAvg.goalsAgainst}</strong></div>
  `;

  document.getElementById('home-stats').innerHTML = `
    <div class="stat"><span>Jogos em casa</span><strong>${stats.home.games}</strong></div>
    <div class="stat"><span>Público pagante total</span><strong>${stats.home.paidTotal}</strong></div>
    <div class="stat"><span>Público pagante médio</span><strong>${stats.home.paidAvg}</strong></div>
    <div class="stat"><span>Público presente total</span><strong>${stats.home.presentTotal}</strong></div>
    <div class="stat"><span>Público presente médio</span><strong>${stats.home.presentAvg}</strong></div>
    <div class="stat"><span>Renda total</span><strong>R$ ${stats.home.revenueTotal.toFixed(2)}</strong></div>
    <div class="stat"><span>Renda média</span><strong>R$ ${stats.home.revenueAvg}</strong></div>
    <div class="stat"><span>Ingresso médio</span><strong>R$ ${stats.home.ticketAvg}</strong></div>
  `;

  const playerEntries = Object.entries(stats.players);
  const mapGoals = Object.fromEntries(playerEntries.map(([n, s]) => [n, s.goals]));
  const mapAssists = Object.fromEntries(playerEntries.map(([n, s]) => [n, s.assists]));
  const mapContrib = Object.fromEntries(playerEntries.map(([n, s]) => [n, s.goals + s.assists]));
  const mapCards = Object.fromEntries(playerEntries.map(([n, s]) => [n, s.yellow + s.secondYellow + s.red]));
  const mapPoints = Object.fromEntries(playerEntries.map(([n, s]) => [n, s.points]));

  document.getElementById('top-goals').innerHTML = toRank(mapGoals);
  document.getElementById('top-assists').innerHTML = toRank(mapAssists);
  document.getElementById('top-contrib').innerHTML = toRank(mapContrib);
  document.getElementById('top-cards').innerHTML = toRank(mapCards);
  document.getElementById('top-partners').innerHTML = toRank(stats.partners);
  document.getElementById('top-points').innerHTML = toRank(mapPoints);

  renderPlayerGroups(stats.players);
}

function renderPlayerGroups(playerStats) {
  const groups = {};
  state.players.forEach((p) => {
    if (!groups[p.position]) groups[p.position] = [];
    groups[p.position].push(p);
  });
  const wrapper = document.getElementById('roster-groups');
  wrapper.innerHTML = Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([position, players]) => `
      <div class="group">
        <strong>${position}</strong>
        <div>
          ${players.map((p) => `
            <span class="player-chip">
              <img src="${p.photo || 'https://via.placeholder.com/24'}" alt="${p.name}">
              <button onclick="showPlayer('${p.name.replace(/'/g, "\\'")}')">${p.name} #${p.shirt || '-'}</button>
            </span>
          `).join('')}
        </div>
      </div>
    `).join('');

  window.showPlayer = (name) => {
    const p = state.players.find((pl) => pl.name === name);
    const s = playerStats[name] || { goals: 0, assists: 0, yellow: 0, secondYellow: 0, red: 0, ownGoals: 0, missedPenalty: 0, cleanSheet: 0, penaltySave: 0, points: 0 };
    document.getElementById('player-detail').innerHTML = `
      <h3>${p.name}</h3>
      <p><strong>Posição:</strong> ${p.position} | <strong>Camisa:</strong> ${p.shirt || '-'}</p>
      ${p.photo ? `<img src="${p.photo}" alt="${p.name}" style="width:90px;border-radius:8px;background:#fff">` : ''}
      <p>Gols: ${s.goals} | Assistências: ${s.assists} | Participações: ${s.goals + s.assists}</p>
      <p>Cartões: ${(s.yellow + s.secondYellow + s.red)} (Am: ${s.yellow}, 2ºAm: ${s.secondYellow}, V: ${s.red})</p>
      <p>Clean Sheets: ${s.cleanSheet} | Pênaltis defendidos: ${s.penaltySave}</p>
      <p>Gol contra: ${s.ownGoals} | Pênalti perdido: ${s.missedPenalty}</p>
      <p><strong>Pontos:</strong> ${s.points.toFixed(2)}</p>
    `;
  };
}

function renderSocio() {
  const root = document.getElementById('socio-prices');
  root.innerHTML = Object.entries(state.socioPrices)
    .map(([category, discount]) => `
      <label>${category} (% desconto)
        <input type="number" min="0" max="100" value="${discount}" onchange="updateSocio('${category.replace(/'/g, "\\'")}', this.value)">
      </label>
    `).join('');

  window.updateSocio = (category, value) => {
    state.socioPrices[category] = Number(value);
    saveState();
  };
}

function importRoster() {
  const text = document.getElementById('roster-import').value;
  const imported = parseLines(text, (line) => {
    const [name, position, shirt, photo] = line.split(',').map((p) => p?.trim());
    if (!name || !position) return null;
    return { name, position, shirt: Number(shirt || 0), photo: photo || '' };
  });
  if (!imported.length) return;
  const byName = new Map(state.players.map((p) => [p.name, p]));
  imported.forEach((p) => byName.set(p.name, p));
  state.players = Array.from(byName.values());
  saveState();
  renderAll();
}

function renderAll() {
  renderMatches();
  renderStats();
  renderSocio();
}

document.getElementById('match-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const match = buildMatchFromForm();
  const idx = state.matches.findIndex((m) => m.id === match.id);
  if (idx >= 0) state.matches[idx] = match;
  else state.matches.push(match);
  saveState();
  resetForm();
  renderAll();
});

document.getElementById('cancel-edit').addEventListener('click', resetForm);
document.getElementById('import-roster').addEventListener('click', importRoster);

renderAll();
