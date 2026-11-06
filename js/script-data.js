/* =========================================================
   TONGUES OF THE WORLD — film timeline (all times in seconds)
   Every on-screen element, camera move, map paint and caption
   lives here. js/film.js plays this data back deterministically,
   so any moment can be scrubbed to (index.html?t=123).
   ========================================================= */
(function () {
  const L = (lon, lat) => ({ ll: [lon, lat] });   // map-anchored point
  const S = (x, y) => ({ xy: [x, y] });            // screen point (1920×1080)

  const items = [], cams = [], paints = [], dims = [], skies = [], boxes = [], chapters = [];
  const add = o => (items.push(o), o);

  /* ---------- builders ---------- */
  const txt = (t, u, cls, html, p, o = {}) => add(Object.assign({ type: 'el', t, u, cls, html, p }, o));
  const pin = (t, u, ll, flag, label, o = {}) => add(Object.assign({ type: 'pin', t, u, p: L(...ll), flag, label, sfx: 'pop' }, o));
  const arr = (t, dur, u, from, to, color, o = {}) => add(Object.assign({ type: 'arrow', t, dur, u, from, to, color, sfx: 'whoosh' }, o));
  const fly = (t, dur, u, html, cls, from, to, o = {}) => add(Object.assign({ type: 'fly', t, dur, u, html, cls, from, to, sfx: 'pop' }, o));
  const word = (w, s) => w + (s ? '<small>' + s + '</small>' : '');
  const cam = (t, lon, lat, k, dur = 2.2) => cams.push({ t, to: [lon, lat, k], dur });
  const paint = (t, color, c) => paints.push({ t, color, c });
  const unpaint = (t, c) => paints.push({ t, clear: c || true });
  const dim = (t, on) => dims.push({ t, on });
  const sky = (t, a, b) => skies.push({ t, bg: `radial-gradient(ellipse at 50% 38%, ${a} 0%, ${b} 62%, #04050c 100%)` });
  const chapter = (t, u, n, title) => chapters.push({ t, u, n, title });
  const card = (kicker, title, list) =>
    `<h3><small>${kicker}</small>${title}</h3><ul>${list.map(x => `<li>${x}</li>`).join('')}</ul>`;
  const grave = (name, line) => `<div class="rip">R.I.P.</div><b>${name}</b><span>${line}</span>`;

  /* ---------- country groups (world-atlas 110m names) ---------- */
  const G = {
    pie: ['Ireland', 'United Kingdom', 'France', 'Spain', 'Portugal', 'Italy', 'Germany', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Denmark', 'Norway', 'Sweden', 'Iceland', 'Poland', 'Czechia', 'Slovakia', 'Slovenia', 'Croatia', 'Bosnia and Herz.', 'Serbia', 'Montenegro', 'Kosovo', 'Macedonia', 'North Macedonia', 'Albania', 'Greece', 'Bulgaria', 'Romania', 'Moldova', 'Ukraine', 'Belarus', 'Lithuania', 'Latvia', 'Russia', 'Armenia', 'Iran', 'Afghanistan', 'Tajikistan', 'Pakistan', 'India', 'Nepal', 'Bangladesh', 'Sri Lanka', 'Luxembourg'],
    bantu: ['Cameroon', 'Gabon', 'Congo', 'Dem. Rep. Congo', 'Eq. Guinea', 'Angola', 'Zambia', 'Tanzania', 'Kenya', 'Uganda', 'Rwanda', 'Burundi', 'Malawi', 'Mozambique', 'Zimbabwe', 'Botswana', 'South Africa', 'Lesotho', 'eSwatini', 'Namibia'],
    austro: ['Taiwan', 'Philippines', 'Indonesia', 'Malaysia', 'Brunei', 'Timor-Leste', 'Madagascar', 'New Zealand', 'Fiji', 'Vanuatu', 'Solomon Is.', 'New Caledonia'],
    rome1: ['Italy'],
    rome2: ['Spain', 'Portugal', 'France', 'Greece', 'Belgium', 'Switzerland', 'Austria', 'Slovenia', 'Croatia', 'Luxembourg'],
    rome3: ['Turkey', 'Egypt', 'Tunisia', 'Libya', 'Algeria', 'Morocco', 'United Kingdom', 'Bosnia and Herz.', 'Serbia', 'Montenegro', 'Albania', 'Macedonia', 'North Macedonia', 'Bulgaria', 'Romania', 'Syria', 'Lebanon', 'Israel', 'Palestine', 'Jordan', 'Cyprus', 'Kosovo', 'Hungary'],
    romance: ['Spain', 'Portugal', 'France', 'Italy', 'Romania', 'Moldova'],
    arabic: ['Saudi Arabia', 'Yemen', 'Oman', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Iraq', 'Syria', 'Jordan', 'Lebanon', 'Israel', 'Palestine', 'Egypt', 'Libya', 'Tunisia', 'Algeria', 'Morocco', 'W. Sahara', 'Mauritania', 'Sudan'],
    mongol1: ['Mongolia'],
    mongol2: ['China', 'Kazakhstan', 'Russia', 'Kyrgyzstan', 'Uzbekistan', 'Turkmenistan', 'Tajikistan'],
    mongol3: ['Iran', 'Iraq', 'Afghanistan', 'Pakistan', 'Ukraine', 'Belarus', 'Georgia', 'Armenia', 'Azerbaijan', 'North Korea', 'South Korea', 'Turkey', 'Syria', 'Moldova'],
    spanish: ['Spain', 'Mexico', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama', 'Cuba', 'Dominican Rep.', 'Puerto Rico', 'Colombia', 'Venezuela', 'Ecuador', 'Peru', 'Bolivia', 'Chile', 'Argentina', 'Paraguay', 'Uruguay', 'Philippines'],
    portuguese: ['Portugal', 'Brazil', 'Angola', 'Mozambique', 'Guinea-Bissau'],
    english: ['United Kingdom', 'Ireland', 'United States of America', 'Canada', 'Australia', 'New Zealand', 'India', 'Pakistan', 'Nigeria', 'Ghana', 'Sierra Leone', 'Kenya', 'Uganda', 'Tanzania', 'Zambia', 'Zimbabwe', 'Malawi', 'Botswana', 'South Africa', 'Jamaica', 'Bahamas', 'Guyana', 'Sudan', 'Egypt', 'Myanmar', 'Malaysia', 'Papua New Guinea'],
    french: ['France', 'Belgium', 'Senegal', 'Mali', 'Guinea', "Côte d'Ivoire", 'Burkina Faso', 'Niger', 'Chad', 'Central African Rep.', 'Cameroon', 'Gabon', 'Congo', 'Dem. Rep. Congo', 'Benin', 'Togo', 'Madagascar', 'Algeria', 'Morocco', 'Tunisia', 'Mauritania', 'Haiti', 'Vietnam', 'Laos', 'Cambodia', 'Djibouti', 'Syria', 'Lebanon'],
    russian: ['Russia', 'Belarus', 'Kazakhstan', 'Kyrgyzstan', 'Uzbekistan', 'Turkmenistan', 'Tajikistan']
  };

  const C = {
    gold: '#ffcf4a', pink: '#ff8fab', cyan: '#4ad8ff', red: '#ff4d6d', rome: '#d64533', romance: '#ff8a3d',
    arab: '#19c3a6', mongol: '#c98a4b', es: '#ffb020', pt: '#2ecc71', en: '#ff4d6d', fr: '#4a7dff', ru: '#b06cff'
  };

  /* ======================================================
     00 · COLD OPEN  0:00 – 0:22
     ====================================================== */
  sky(0, '#2a1d5e', '#120b2e');
  cam(0, 20, 10, 1, 0);
  dim(0, true);
  const greets = [
    ['Hola', 420, 300, ''], ['Bonjour', 1480, 290, 'p'], ['Privet', 300, 690, 'c'], ['Ni hao', 1610, 700, ''],
    ['Konnichiwa', 720, 190, 'c'], ['Jambo', 1230, 170, 'y'], ['Namaste', 600, 840, 'p'], ['Salaam', 190, 480, 'y'],
    ['Olá', 1740, 470, 'c'], ['Merhaba', 1190, 830, 'c'], ['Hallo', 800, 720, ''], ['Kia ora', 1180, 380, 'p'],
    ['Aloha', 700, 420, 'y'], ['Ciao', 1420, 560, 'y'], ['Sawasdee', 380, 140, 'p'], ['Hej', 1700, 140, ''], ['Annyeong', 1520, 880, 'p']
  ];
  txt(0.8, 8.3, 'bubble y', 'Hello', S(960, 540), { wrap: 'bob', sfx: 'pop' });
  greets.forEach(([w, x, y, c], i) => txt(1.6 + i * 0.32, 8.3, 'bubble ' + c, w, S(x, y), { sfx: 'pop' }));
  add({ type: 'counter', t: 8.6, u: 15, dur: 2.6, from: 0, to: 7000, cls: 'counter', p: S(960, 430), sfx: 'whoosh',
    fmt: v => Math.round(v).toLocaleString('en-US') + (v >= 6999 ? '+' : '') });
  txt(9.4, 15, 'small', 'languages spoken on Earth today', S(960, 610), { anim: 'rise' });
  txt(11, 15, 'note r', '…and every one of them got here somehow.', S(960, 740));
  dim(15.1, false);
  boxes.push({ t: 15.1, on: true }, { t: 21.8, on: false });
  txt(15.3, 21.6, 'big', 'Tongues of<br><i>the World</i>', S(960, 470), { anim: 'rise', sfx: 'whoosh' });
  txt(16.4, 21.6, 'small', 'How languages travelled — and what they took along', S(960, 720), { anim: 'rise' });

  /* ======================================================
     01 · WHERE IT ALL BEGAN  0:22 – 1:02
     ====================================================== */
  chapter(22, 61.6, '01', 'Where it all began');
  sky(22, '#1d3a6e', '#0b1630');
  pin(23, 36, [38, 8], '👣', 'East Africa · <em>~70,000 years ago</em>');
  const oa = [[[38, 8], [47, 29]], [[47, 29], [12, 47]], [[47, 29], [78, 22]], [[78, 22], [112, 30]], [[100, 12], [134, -24]],
    [[112, 34], [138, 50]], [[138, 50], [-172, 64]], [[-158, 62], [-105, 45]], [[-100, 40], [-62, -10]]];
  oa.forEach(([a, b], i) => arr(24.5 + i * 0.75, 1.2, 36, a, b, C.gold, { mover: '🚶' }));
  txt(31, 36, 'note r', 'First tourists. No luggage, no phrasebook.', S(1180, 190));

  cam(36, 45, 47, 2.6, 2.2);
  pin(37.6, 47, [42, 48], '🐎', 'Pontic Steppe · <em>~4000 BC</em>');
  txt(38.4, 47, 'mid', 'Proto-<i>Indo-European</i>', S(960, 200), { anim: 'rise' });
  cam(40.5, 48, 42, 1.5, 2);
  const pie = [['Germanic', [9, 54]], ['Celtic', [-4, 52]], ['Italic', [12, 43]], ['Greek', [22, 38.5]], ['Slavic', [32, 56]], ['Iranian', [53, 32]], ['Indic', [77, 24]]];
  pie.forEach(([n, to], i) => arr(41.6 + i * 0.45, 1.3, 47, [42, 48], to, C.gold, { mover: '🐎', label: n }));
  paint(45.2, '#e5a92a', G.pie);
  txt(44.8, 47, 'note l', 'Secret weapon: the horse. (And the wheel.)', S(960, 860));

  dim(47, true);
  txt(47.5, 61.6, 'word xl', word('*méh₂tēr', 'Proto-Indo-European · reconstructed'), S(960, 330), { sfx: 'ding' });
  const kids = [['máthair', 'Irish'], ['mater', 'Latin'], ['Mutter', 'German'], ['mḗtēr', 'Greek'], ['mat’', 'Russian'], ['mādar', 'Persian'], ['mātṛ', 'Sanskrit']];
  kids.forEach(([w, l], i) => {
    const x = 270 + i * 230, y = i % 2 ? 720 : 620, t0 = 48.6 + i * 0.45;
    arr(t0 - 0.3, 0.5, 61.6, S(960, 400), S(x, y - 50), C.gold, { bend: 0.08, sfx: null });
    txt(t0, 61.6, 'word ' + (i % 2 ? 'pink' : 'cyan'), word(w, l), S(x, y), { sfx: 'pop' });
  });
  txt(55, 61.6, 'note r', 'Same mom. Very different accents.', S(960, 850));
  dim(61.6, false);

  /* ======================================================
     02 · COWS, CANOES & CONFIDENCE  1:02 – 1:40
     ====================================================== */
  chapter(62, 99.6, '02', 'Cows, canoes & confidence');
  unpaint(62);
  sky(62, '#5a2d1e', '#22100a');
  cam(62, 22, -5, 2.5, 2.2);
  pin(63.8, 78, [11, 5], '🐄', 'Bantu homeland · <em>~3,000 years ago</em>');
  const bantu = [[[11, 5], [27, 0]], [[27, 0], [37, -5]], [[11, 5], [16, -11]], [[16, -11], [26, -19]], [[36, -6], [34, -18]], [[29, -19], [27, -29]]];
  bantu.forEach(([a, b], i) => arr(65 + i * 0.6, 1.2, 78, a, b, C.pink, { mover: i % 2 ? '⚒️' : '🐄' }));
  paint(69.5, C.pink, G.bantu);
  txt(70.5, 78, 'card pink', card('Bantu migrants', 'Packing list', ['🌾 farming', '⚒️ iron tools', '🐄 cattle', '🗣️ ~500 languages']), S(1500, 440), { sfx: 'pop' });
  txt(73.5, 78, 'note r', 'Swahili alone: ~200 million speakers', S(1480, 790));

  cam(78, 155, -5, 1.25, 2.6);
  sky(78, '#0f5566', '#062029');
  unpaint(78);
  pin(80, 99.6, [121, 23.5], '🛶', 'Taiwan · <em>~3000 BC</em>');
  const aus = [[81, 1, [121, 23], [122, 12]], [81.8, 1, [122, 12], [114, -1]], [82.6, 2.2, [114, -1], [47, -19]], [83.6, 1.1, [123, 10], [146, 14]],
    [84.4, 1.2, [142, -5], [178, -17]], [85.3, 1, [178, -17], [-172, -14]], [86.1, 1.6, [-172, -14], [-156, 20]], [86.9, 1.4, [-172, -14], [174, -40]], [87.7, 1.8, [-172, -14], [-109, -27]]];
  aus.forEach(([t, d, a, b]) => arr(t, d, 99.6, a, b, C.cyan, { mover: '⛵' }));
  pin(84.8, 99.6, [47, -19], '🌴', 'Madagascar');
  pin(87.7, 99.6, [-156, 20], '🌺', 'Hawaiʻi');
  pin(88.3, 99.6, [174, -40], '🥝', 'Aotearoa (NZ)');
  pin(89.5, 99.6, [-109, -27], '🗿', 'Rapa Nui');
  paint(89, C.cyan, G.austro);
  txt(90.5, 99.6, 'note r', 'No GPS. No compass. Just stars, waves & confidence.', S(960, 190));
  txt(93, 99.6, 'mid', '<i>1,200+</i> Austronesian languages', S(760, 840), { anim: 'rise' });

  /* ======================================================
     03 · EMPIRE MODE: ON  1:40 – 2:26
     ====================================================== */
  chapter(100, 145.6, '03', 'Empire mode: ON');
  unpaint(100);
  sky(100, '#4a1222', '#1b0710');
  cam(100, 16, 40, 2.7, 2.4);
  pin(101.8, 113, [12.5, 41.9], '🦅', 'Rome · <em>1st century AD</em>');
  [[-4, 40], [2, 47], [-1.5, 52.5], [24, 45.5], [31, 30.5], [36, 34]].forEach((to, i) =>
    arr(102.6 + i * 0.45, 1.1, 113, [12.5, 41.9], to, '#ff6a55', { mover: '🛡️' }));
  paint(103.2, C.rome, G.rome1); paint(104, C.rome, G.rome2); paint(104.8, C.rome, G.rome3);
  dim(106, true);
  txt(106.3, 113, 'card green', card('The goodies', 'Rome brought', ['🛣️ roads', '🚰 aqueducts', '🛁 public baths', '📜 Latin']), S(620, 490), { sfx: 'pop' });
  txt(107.6, 113, 'card red', card('The bill', 'Rome took', ['💰 taxes', '🌾 grain', '🫒 olive oil & wine', '🏺 …everything else']), S(1300, 490), { sfx: 'pop' });
  txt(110.2, 113, 'stamp', 'VENI · VIDI · VOCABULARY', S(960, 820), { wrap: 'stamped', sfx: 'stamp' });
  dim(113, false);
  unpaint(113);
  txt(113.3, 115.8, 'stamp', 'EMPIRE CLOSED · 476 AD', S(960, 250), { wrap: 'stamped', sfx: 'stamp' });
  paint(114.6, C.romance, G.romance);
  pin(115, 120, [-3.5, 40.5], 'es', 'Spanish');
  pin(115.5, 120, [-8.5, 39.5], 'pt', 'Portuguese', { off: [-40, 70] });
  pin(116, 120, [2.5, 46.8], 'fr', 'French');
  pin(116.5, 120, [12.8, 42.6], 'it', 'Italian');
  pin(117, 120, [25, 46], 'ro', 'Romanian');
  txt(117.5, 120, 'note r', 'Latin didn’t die. It just had kids.', S(960, 860));

  cam(120, 18, 28, 1.9, 2.2);
  unpaint(120);
  pin(121.2, 127, [44, 24], '🌙', 'Arabia · <em>7th century</em>');
  [[121.8, [44, 24], [37, 33.5]], [122.4, [44, 24], [44, 33]], [123, [36, 30], [31, 30]], [123.6, [31, 30], [14, 32]], [124.3, [14, 32], [-6, 33]], [125, [-6, 33], [-4, 39]]]
    .forEach(([t, a, b]) => arr(t, 1.1, 135, a, b, C.arab, { mover: '🐪' }));
  paint(126, C.arab, G.arabic.concat(['Spain', 'Portugal']));
  txt(127.2, 138, 'small', 'Europe’s new imports', S(960, 150));
  [['algebra', 'al-jabr'], ['algorithm', 'al-Khwārizmī'], ['alcohol', 'al-kuḥl'], ['coffee', 'qahwa'], ['sugar', 'sukkar'], ['zero', 'ṣifr']]
    .forEach(([w, s], i) => fly(127.6 + i * 0.55, 1.1, 138, word(w, s), 'word', L(42, 26), S(560 + (i % 3) * 400, i < 3 ? 260 : 385)));
  txt(132.5, 138, 'note l', 'Arguably the best trade deal Europe ever got.', S(960, 520));
  paint(136, C.romance, ['Spain', 'Portugal']);
  txt(135.8, 145.6, 'stamp sm', '1492', L(-4, 40), { wrap: 'stamped', sfx: 'stamp' });
  txt(139, 145.6, 'note r', 'Spanish kept ~4,000 Arabic words as souvenirs.', S(960, 820));

  /* ======================================================
     04 · THE ENGLISH REMIX  2:26 – 3:10
     ====================================================== */
  chapter(146, 189.6, '04', 'The English remix');
  unpaint(146);
  sky(146, '#22344a', '#0c141e');
  cam(146, 1, 54, 4.4, 2.4);
  paint(147.8, C.pt, ['United Kingdom', 'Ireland']);
  pin(148, 152.2, [-2.5, 53.5], '🍀', 'Celtic Britain');
  arr(149.5, 1.4, 158, [9.5, 55.8], [0, 53], C.gold, { mover: '⛵', label: 'Angles, Saxons & Jutes · 449 AD', labelAt: 'mid' });
  arr(150.1, 1.4, 158, [8, 53.6], [1, 52], C.gold, { mover: '⛵' });
  paint(151.6, C.gold, ['United Kingdom']);
  pin(152.4, 158, [-3.7, 52.3], '🐉', 'Welsh');
  pin(152.9, 158, [-5, 57.3], '🦌', 'Scottish Gaelic');
  pin(153.4, 158, [-8, 53], '☘️', 'Irish');
  txt(154.5, 158, 'note l', 'Celts: politely shoved to the edges.', S(520, 830));
  arr(158.2, 1.3, 166, [6, 61], [-1, 54.5], C.cyan, { mover: '🪓', label: 'Vikings · 793 AD', labelAt: 'mid' });
  arr(158.8, 1.3, 166, [7, 60], [-4.5, 58], C.cyan, { mover: '🪓' });
  txt(160.2, 166, 'small', 'Norse imports', S(400, 190));
  [['sky', 'Old Norse ský'], ['egg', 'Old Norse egg'], ['knife', 'Old Norse knífr'], ['window', 'vindauga · wind-eye'], ['they', 'Old Norse þeir'], ['Thursday', 'Thor’s day']]
    .forEach(([w, s], i) => fly(160.6 + i * 0.45, 1, 166, word(w, s), 'word cyan', L(8, 60), S(400, 270 + i * 98)));
  txt(163.5, 166, 'note r', 'Yes — even “they”.', S(1450, 250));
  pin(166, 168.4, [0, 49.2], 'fr', 'Normandy');
  arr(166.3, 1.2, 168.4, [0, 49.3], [-0.3, 51.6], C.fr, { mover: '👑', label: 'Normans · 1066', labelAt: 'mid' });
  dim(168, true);
  txt(168.4, 180, 'small', 'Raised by Saxon peasants', S(600, 270));
  txt(168.8, 180, 'small', 'Eaten by Norman lords', S(1320, 270));
  [['🐄 cow', 'Old English cū', 'beef', 'French bœuf'], ['🐖 pig', 'Old English picga', 'pork', 'French porc'],
    ['🐑 sheep', 'Old English scēap', 'mutton', 'French mouton'], ['🦌 deer', 'Old English dēor', 'venison', 'French venaison']]
    .forEach(([a, as, b, bs], i) => {
      const t0 = 169.5 + i * 1.45, y = 390 + i * 120;
      txt(t0, 180, 'word', word(a, as), S(600, y), { sfx: 'pop' });
      arr(t0 + 0.3, 0.5, 180, S(790, y), S(1120, y), C.gold, { bend: 0, mover: '🍽️', sfx: null });
      txt(t0 + 0.75, 180, 'word pink', word(b, bs), S(1320, y), { sfx: 'pop' });
    });
  txt(175.5, 180, 'note l', 'The peasants did the work. The lords got the fancy words.', S(960, 870));
  add({ type: 'bars', t: 180.3, u: 189.6, p: S(960, 440), title: 'Where English words come from', sub: 'SHARE OF VOCABULARY · APPROX.', max: 30, unit: '%',
    rows: [['Latin', 28, C.gold], ['French', 28, '#ff8fab'], ['Germanic', 25, '#7ee8ff'], ['Greek', 5, C.ru], ['Other', 14, '#9aa3b6']] });
  txt(185, 189.6, 'note r', 'A Germanic language in a French suit with Latin accessories.', S(960, 850));
  dim(189.6, false);

  /* ======================================================
     05 · THE MONGOL EXCEPTION  3:10 – 3:30
     ====================================================== */
  chapter(190, 209.6, '05', 'The Mongol exception');
  unpaint(190);
  sky(190, '#4a3a1e', '#1a130a');
  cam(190, 78, 45, 1.7, 2.2);
  pin(191.2, 198.5, [104, 47], '🏹', 'Mongolia · <em>1206</em>');
  paint(192, C.mongol, G.mongol1); paint(193, C.mongol, G.mongol2); paint(194.2, C.mongol, G.mongol3);
  [[52, 50], [32, 49], [44, 33.5], [116, 32], [127, 37.5]].forEach((to, i) => arr(192.2 + i * 0.45, 1.2, 198.5, [104, 47], to, '#ffd28a', { mover: '🐎' }));
  add({ type: 'counter', t: 195, u: 198.5, dur: 1.8, from: 0, to: 24, cls: 'counter s', p: S(960, 225), fmt: v => Math.round(v) + 'M km²' });
  txt(195.6, 198.5, 'small', 'the largest land empire in history', S(960, 345));
  dim(198.5, true);
  txt(199, 209.6, 'mid', 'Words the Mongol world left in <i>English</i>:', S(960, 330), { anim: 'rise' });
  txt(200.5, 202.9, 'emoji', '🥁', S(960, 560), { wrap: 'bob' });
  txt(203, 209.6, 'word xl pink', word('horde', 'via Turkic ordu — “camp, court”'), S(960, 560), { sfx: 'ding' });
  txt(204.5, 209.6, 'note r', 'Fitting.', S(1330, 450));
  txt(206, 209.6, 'note l', 'They mostly adopted the locals’ languages instead.', S(960, 800));
  dim(209.6, false);

  /* ======================================================
     06 · AGE OF SAIL & BAD MANNERS  3:30 – 4:35
     ====================================================== */
  chapter(210, 274.6, '06', 'Age of sail & bad manners');
  unpaint(210);
  sky(210, '#123a6b', '#071a33');
  cam(210, -35, 12, 1.35, 2.2);
  arr(211.6, 1.6, 234, [-46.5, 72], [-46.5, -58], '#ffffff', { head: false, dash: true, bend: 0.001 });
  pin(212.2, 217, [-46.5, 40], '📜', 'Treaty of Tordesillas · <em>1494</em>');
  txt(213, 234, 'tag', '<span style="color:#ffb020">◀ Spain’s half</span>', L(-68, 52), { sfx: 'pop' });
  txt(213.4, 234, 'tag', '<span style="color:#2ecc71">Portugal’s half ▶</span>', L(-25, 52), { sfx: 'pop' });
  txt(214, 217, 'note r', 'Two countries split the planet. Nobody asked the planet.', S(960, 175));
  [[217.4, [-6, 37], [-97, 20], C.es], [218.1, [-6, 37], [-76, -11], C.es], [218.8, [-6, 37], [-64, -34], C.es],
    [217.8, [-9, 38.7], [-46, -12], C.pt], [218.5, [-9, 38.7], [15, -12], C.pt], [219.2, [-9, 38.7], [36, -17], C.pt]]
    .forEach(([t, a, b, c]) => arr(t, 1.3, 234, a, b, c, { mover: '⛵' }));
  paint(219.8, C.es, G.spanish); paint(219.8, C.pt, G.portuguese);
  dim(221, true);
  txt(221.3, 234, 'card green', card('Delivered', 'They brought', ['🗣️ Spanish & Portuguese', '🐎 horses', '⛪ churches', '🦠 smallpox (oops)']), S(370, 470), { sfx: 'pop' });
  txt(222.6, 234, 'card red', card('Collected', 'They took', ['🥇 gold & silver', '🥔 potatoes', '🍅 tomatoes', '🍫 chocolate', '🌶️ chili']), S(1560, 470), { sfx: 'pop' });
  [['chocolate', 'Nahuatl xocolātl'], ['tomato', 'Nahuatl tomatl'], ['avocado', 'Nahuatl āhuacatl'], ['potato', 'Taíno batata'], ['canoe', 'Taíno canoa'], ['hurricane', 'Taíno hurakán']]
    .forEach(([w, s], i) => fly(225.5 + i * 0.5, 1.1, 234, word(w, s), 'word', L(-97, 20), S(770 + (i % 2) * 380, 330 + Math.floor(i / 2) * 150)));
  txt(231.2, 234, 'note l', 'Italy later sent the tomato back… as pizza. 🍕', S(960, 830));
  dim(234, false);
  unpaint(234.2);
  cam(234.2, 20, 18, 1.02, 2.4);
  pin(236.4, 249, [-0.1, 51.5], 'gb', 'British Empire', { off: [-70, -4] });
  [[-77, 39], [-105, 56], [-76, 18], [8, 9], [37, 0], [25, -29], [78, 22], [146, -30], [174, -41]]
    .forEach((to, i) => arr(237 + i * 0.35, 1.3, 249, [-2, 50], to, C.en, { mover: '⛵', sfx: i % 3 ? null : 'whoosh' }));
  pin(237.4, 249, [2.3, 48.8], 'fr', 'French Empire', { off: [62, 16] });
  [[-14, 14], [-3, 17], [-5, 7.5], [3, 30], [47, -19], [-71, 47], [106, 16], [-72, 19]]
    .forEach((to, i) => arr(237.8 + i * 0.35, 1.3, 249, [2, 47], to, C.fr, { mover: '⛵', sfx: i % 3 ? null : 'whoosh' }));
  pin(238.6, 249, [45, 56], 'ru', 'Russian Empire');
  arr(239, 1.3, 249, [40, 56], [92, 61], C.ru, { mover: '🛷' });
  arr(240.2, 1.2, 249, [92, 61], [132, 44], C.ru, { mover: '🛷' });
  arr(239.6, 1.2, 249, [40, 56], [68, 42], C.ru, { mover: '🛷' });
  paint(240.8, C.en, G.english); paint(240.8, C.fr, G.french); paint(240.8, C.ru, G.russian);
  paint(240.8, C.es, G.spanish); paint(240.8, C.pt, G.portuguese);
  txt(243.2, 249, 'note r', 'The sun never set on the British Empire…', S(760, 800));
  txt(245.6, 249, 'note l', '…because God didn’t trust them in the dark.', S(1160, 880));
  dim(249.2, true);
  txt(249.5, 262, 'mid', 'Brought home from <i>India</i>:', S(960, 250), { anim: 'rise' });
  [['shampoo', 'Hindi chāmpo · “press!”', 560, 420], ['pyjamas', 'Hindi pāy-jāma', 960, 420], ['jungle', 'Hindi jaṅgal', 1360, 420],
    ['bungalow', 'Hindi baṅglā', 760, 550], ['thug', 'Hindi ṭhag · “swindler”', 1160, 550]]
    .forEach(([w, s, x, y], i) => txt(250.4 + i * 0.55, 262, 'word', word(w, s), S(x, y), { sfx: 'pop' }));
  txt(254.6, 262, 'word xl pink', word('loot', 'Hindi lūṭ · “plunder”'), S(960, 715), { sfx: 'ding' });
  txt(256.5, 262, 'note r', 'They even took the word for taking stuff.', S(960, 860));
  dim(262, false);
  unpaint(262);
  cam(262, 147, -6, 3.6, 2.3);
  txt(263, 274.6, 'small', 'When languages collide, new ones are born', S(960, 175));
  pin(264.4, 274.6, [145.5, -6.3], 'pg', 'Papua New Guinea');
  paint(264.4, C.red, ['Papua New Guinea']);
  txt(265.3, 274.6, 'word', word('gras bilong fes', '= beard · “grass of the face”'), S(500, 360), { sfx: 'pop' });
  txt(266.6, 274.6, 'word cyan', word('haus sik', '= hospital · “sick house”'), S(1420, 360), { sfx: 'pop' });
  txt(268, 274.6, 'word pink', word('bagarap', '= broken · from “buggered up”'), S(500, 700), { sfx: 'pop' });
  txt(269.3, 274.6, 'word', word('Tok Pisin', '= “talk pidgin” · ~4M speakers'), S(1420, 700), { sfx: 'pop' });
  txt(271, 274.6, 'note r', 'Honestly? Better.', S(960, 860));

  /* ======================================================
     07 · LOST & FOUND  4:35 – 5:18
     ====================================================== */
  chapter(275, 317.6, '07', 'Lost & found');
  unpaint(275);
  sky(275, '#2b2350', '#0e0b1f');
  cam(275, -78, 10, 1.55, 2.3);
  txt(276, 288, 'mid', '<i>Still</i> here.', S(1350, 300), { anim: 'rise' });
  pin(277.2, 288, [-74, -13], '🦙', 'Quechua · <em>~8M</em>');
  pin(278.2, 288, [-57, -24], '🌿', 'Guaraní · <em>~6.5M</em>');
  pin(279.2, 288, [-101, 21], '🌽', 'Nahuatl · <em>~1.7M</em>');
  pin(280, 288, [-88, 15], '🛕', 'Maya · <em>~6M</em>', { off: [70, 55] });
  pin(280.8, 288, [-109, 36], '🏜️', 'Navajo · <em>~170K</em>');
  pin(281.6, 288, [-84, 35.5], '🌲', 'Cherokee · <em>~2K</em>');
  paint(277.2, '#b06cff', ['Peru', 'Bolivia', 'Paraguay', 'Guatemala']);
  dim(288, true);
  [['Sumerian', 'world’s first writing<br>† ~2000 BC'], ['Etruscan', 'Rome’s mystery neighbours<br>† ~1st c. AD'], ['Gaulish', 'Asterix’s mother tongue<br>† ~6th c. AD'], ['Tasmanian', 'silenced by colonisation<br>† ~1905']]
    .forEach(([n, l], i) => txt(288.4 + i * 0.8, 295, 'grave', grave(n, l), S(390 + i * 380, 480), { anim: 'rise', sfx: 'stamp' }));
  txt(292, 295, 'note r', '~40% of the world’s languages are endangered today.', S(960, 800));
  txt(295.3, 309, 'mid', 'The <i>comeback</i> kids', S(960, 250), { anim: 'rise', sfx: 'whoosh' });
  [['Hebrew', 'everyday again · ~9M'], ['Welsh', 'taught in every school'], ['Māori', 'official since 1987'], ['Hawaiian', '&lt;50 kids → thousands']]
    .forEach(([w, s], i) => txt(296 + i * 0.7, 309, 'word cyan', word(w, s), S(390 + i * 380, 480), { sfx: 'pop' }));
  txt(300.2, 309, 'stamp green', 'NOT DEAD YET', S(960, 720), { wrap: 'stamped', sfx: 'stamp' });
  txt(309.3, 317.6, 'mid', 'And <i>Latin</i>?', S(960, 230), { anim: 'rise' });
  txt(309.6, 317.6, 'emoji', '🏧', S(560, 520), { wrap: 'bob', sfx: 'pop' });
  txt(310.4, 317.6, 'bubble c', '“Inserito scidulam quaeso<br>ut faciundam cognoscas rationem.”', S(1160, 460), { sfx: 'pop' });
  txt(311.8, 317.6, 'small', 'Vatican City ATM · “Please insert your card”', S(1160, 610));
  txt(313.5, 317.6, 'note l', 'Latin: retired, but still handles the banking.', S(960, 810));

  /* ======================================================
     08 · THE SCOREBOARD  5:18 – 5:46
     ====================================================== */
  chapter(318, 345.6, '08', 'The scoreboard');
  sky(318, '#1d3a6e', '#0b1630');
  dim(318, true);
  unpaint(318);
  add({ type: 'bars', t: 318.4, u: 331, p: S(960, 460), title: 'The heavyweights', sub: 'TOTAL SPEAKERS · NATIVE + SECOND LANGUAGE · MILLIONS · APPROX.', max: 1500, unit: 'M', step: 0.3,
    rows: [['English', 1456, C.en], ['Mandarin', 1138, C.gold], ['Hindi', 610, C.romance], ['Spanish', 559, C.es], ['French', 310, C.fr], ['Arabic', 274, C.arab], ['Bengali', 273, C.pt], ['Portuguese', 264, '#7ee8ff'], ['Russian', 255, C.ru]] });
  txt(325.5, 331, 'note r', 'Native speakers? Mandarin #1, Spanish #2.', S(960, 870));
  dim(331, false);
  cam(331, 95, 5, 1.6, 2.3);
  txt(332.4, 345.6, 'mid', 'Papua New Guinea: <i>840</i> languages', S(960, 190), { anim: 'rise' });
  paint(333, C.red, ['Papua New Guinea']); paint(334.6, C.romance, ['Indonesia']); paint(335.6, C.es, ['Nigeria']); paint(336.6, C.gold, ['India']);
  pin(333, 345.6, [145, -6.5], 'pg', 'Papua New Guinea · <em>840</em>');
  pin(334.6, 345.6, [113, -1], 'id', 'Indonesia · <em>710</em>');
  pin(335.6, 345.6, [8, 9.5], 'ng', 'Nigeria · <em>520</em>');
  pin(336.6, 345.6, [79, 22], 'in', 'India · <em>450</em>');
  txt(338, 345.6, 'note l', '≈ one language for every 12,000 people', S(1370, 820));

  /* ======================================================
     09 · OUTRO  5:46 – 6:00
     ====================================================== */
  dim(345.8, true);
  unpaint(346);
  sky(346, '#2a1d5e', '#120b2e');
  cam(346, 20, 10, 1, 2);
  boxes.push({ t: 346, on: true });
  txt(346.6, 353, 'big', 'Every word<br>is a <i>souvenir</i>.', S(960, 450), { anim: 'rise', sfx: 'whoosh' });
  txt(349, 353, 'small', 'from someone’s journey', S(960, 690), { anim: 'rise' });
  [['Gracias', 420, 300, 'y'], ['Merci', 1480, 290, 'p'], ['Spasibo', 300, 690, 'c'], ['Asante', 1610, 700, ''], ['Arigatō', 720, 190, 'c'],
    ['Danke', 1230, 170, 'y'], ['Obrigado', 600, 830, 'p'], ['Shukran', 190, 480, 'y'], ['Grazie', 1740, 470, 'c'], ['Xièxie', 1250, 830, 'c'], ['Mahalo', 1560, 560, 'p'], ['Dhanyavaad', 380, 140, '']]
    .forEach(([w, x, y, c], i) => txt(353.2 + i * 0.16, 360.5, 'bubble ' + c, w, S(x, y), { sfx: 'pop' }));
  txt(355.4, 360.5, 'mid', 'Thanks for <i>watching</i>.', S(960, 490), { anim: 'rise' });
  txt(356.2, 360.5, 'small', 'Tongues of the World · a motion film', S(960, 600), { anim: 'rise' });

  /* ======================================================
     CAPTIONS = voice-over lines (see voiceover-script-en.md)
     ====================================================== */
  const captions = [
    [0.5, 8.4, 'Hello. Hola. Bonjour. Privet. Ni hao. Every day, humans say hello in thousands of different ways.'],
    [8.5, 15, 'Over seven thousand languages are spoken on Earth today — and every one of them got here somehow.'],
    [15.2, 21.8, 'This is the story of how words travelled the world: on foot, on horseback, by boat… and occasionally at sword-point.'],
    [22.5, 30, 'It starts in Africa. Around seventy thousand years ago, small groups of humans walked out — and just kept walking.'],
    [30, 36, 'We have no recordings of what they said. But it was probably “are we there yet?”'],
    [36.5, 46, 'Around 4000 BC, on the steppe north of the Black Sea, the Proto-Indo-Europeans tamed the horse — and their language rode it in every direction.'],
    [46, 54, 'Their descendants became over four hundred languages — from Irish to Hindi, from Russian to Portuguese.'],
    [54, 61.5, 'That’s why “mother” sounds suspiciously similar across half of Eurasia. Same mom — very different accents.'],
    [62.5, 70, 'Meanwhile in Africa, Bantu-speaking farmers set off from what is now Cameroon, carrying iron tools, crops and cattle.'],
    [70, 78, 'Over a couple of thousand years they spread across half a continent. Today some five hundred Bantu languages — Swahili among them — fill East and Southern Africa.'],
    [78.5, 86, 'On the other side of the world, the greatest sailors of the ancient world pushed off from Taiwan in outrigger canoes.'],
    [86, 93, 'Island by island, they reached Madagascar in the west and Easter Island in the east. No compass. No GPS. Just stars, waves and confidence.'],
    [93, 99.5, 'Their twelve hundred languages stretch across half the globe — so Malagasy and Hawaiian are, believe it or not, cousins.'],
    [100.5, 106, 'Then came the empires. And nothing spreads a language like an army with excellent road-building skills.'],
    [106, 113, 'Rome brought roads, aqueducts, public baths and Latin. In return it took taxes, grain, olive oil… and, frankly, everything else.'],
    [113, 120, 'When the empire fell, Latin didn’t die. It just had kids: Spanish, Portuguese, French, Italian and Romanian.'],
    [120.5, 127, 'In the seventh century, Arabic burst out of the Arabian Peninsula and within a hundred years stretched from Iraq to Spain.'],
    [127, 135, 'With it, Europe received algebra, algorithms, alcohol, coffee, sugar — and the idea of zero. Arguably the best trade deal Europe ever got.'],
    [135, 145.5, 'When Moorish rule in Spain ended in 1492, Spanish kept around four thousand Arabic words — as souvenirs.'],
    [146.5, 153, 'Now, a small rainy island. Around 449 AD, Angles, Saxons and Jutes sailed over from Germany and Denmark.'],
    [153, 158, 'They pushed the Celtic languages to the edges — Wales, Scotland, Ireland — and Old English was born.'],
    [158, 166, 'Then the Vikings arrived — raiding first, settling later — and left behind sky, egg, knife, window… and even the word “they”.'],
    [166, 172, 'In 1066 the Normans conquered England, and for three centuries the people in charge spoke French.'],
    [172, 180, 'So the Saxon peasant raised the cow, the pig and the sheep — but the Norman lord ate beef, pork and mutton.'],
    [180, 189.5, 'The result? Modern English: a Germanic language wearing a French suit with Latin accessories.'],
    [190.5, 197, 'And then there’s the Mongol exception. In the 1200s, Genghis Khan and his heirs built the largest land empire in history.'],
    [197, 203, 'So how many words did that colossal empire leave in English? Roughly… one.'],
    [203, 209.5, '“Horde.” Fitting. Instead of spreading their language, the Mongols mostly adopted the languages of the people they ruled.'],
    [210.5, 217, 'In 1494, Spain and Portugal sat down with a map and politely split the entire world between themselves. Nobody asked the world.'],
    [217, 224, 'Their ships carried Spanish and Portuguese across the Atlantic — along with horses, churches… and smallpox.'],
    [224, 231, 'They took gold, silver, potatoes, tomatoes and chocolate — and the words came too: chocolate and tomato are Aztec Nahuatl, canoe and hurricane are Taíno.'],
    [231, 236, 'Europe was so grateful that Italy eventually sent the tomato back… as pizza.'],
    [236, 243, 'Then Britain and France joined the race, planting flags — and grammar books — on every continent. Russia simply kept walking east until it hit the Pacific.'],
    [243, 249, 'People said the sun never set on the British Empire… because God didn’t trust them in the dark.'],
    [249, 256, 'From India, the British brought home tea, cotton, spices — and words: shampoo, pyjamas, jungle, bungalow, thug…'],
    [256, 262, '…and “loot”. They literally took the word for taking stuff.'],
    [262, 268, 'And when languages collide, brand-new ones are born. In Papua New Guinea, English mixed with local tongues to create Tok Pisin…'],
    [268, 274.5, '…where a beard is “gras bilong fes” — grass of the face — and a hospital is a “haus sik”. Honestly? Better.'],
    [275.5, 283, 'But this isn’t only a story about winners. Hundreds of the Americas’ original languages are still alive — Quechua alone has around eight million speakers.'],
    [283, 288, 'Guaraní is spoken by most of Paraguay, and Nahuatl — the language of the Aztecs — is still spoken in Mexico today.'],
    [288, 295, 'Others weren’t so lucky. Sumerian, Etruscan, Gaulish — gone. And roughly every few weeks, another language loses its last speaker.'],
    [295, 303, 'But languages can come back. Hebrew went from scripture to street talk. Welsh, Māori and Hawaiian are being taught to a whole new generation.'],
    [303, 309, 'In the 1980s, fewer than fifty children spoke Hawaiian. Today there are thousands.'],
    [309, 317.5, 'And Latin? Officially retired — but at the Vatican, the cash machines still ask you to insert your card in Latin.'],
    [318.5, 326, 'So where are we now? English leads in total speakers — about one and a half billion, most of whom learned it as a second language.'],
    [326, 331, 'On native speakers, Mandarin wins — with Spanish in second place.'],
    [331, 338, 'But the real language superpower is Papua New Guinea: about eight hundred and forty languages in one country — one for every twelve thousand people.'],
    [338, 345.5, 'Indonesia, Nigeria and India each have hundreds more. Diversity didn’t disappear — it’s just quieter than the headlines.'],
    [346.5, 353, 'So next time you order a coffee, eat a tomato or grab the shampoo, remember: every word is a souvenir from someone’s journey.'],
    [353.5, 359.5, 'Thank you. Gracias. Merci. Spasibo. Asante. Arigatō.']
  ].map(([t, u, text]) => ({ t, u, text }));

  window.FILM = { duration: 360, items, cams, paints, dims, skies, boxes, chapters, captions };
})();
