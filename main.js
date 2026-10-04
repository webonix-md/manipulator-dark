/* TONA — шаблон лендинга манипулятора. Без зависимостей. */
(function () {
  'use strict';

  var RO = document.documentElement.lang === 'ro';

  /* ---- НАСТРОЙКИ: грузовая диаграмма ----
     Диаграмму берите из паспорта крана клиента: [вылет, м, грузоподъёмность, кг] */
  var LOAD = [[2, 5000], [2.5, 5000], [3, 4600], [4, 3450], [5, 2750], [6, 2300], [7, 1950], [8, 1700], [9, 1500], [10, 1330], [11, 1200], [12, 1080], [13, 980], [14, 880], [15, 800]];

  var T = RO ? {
    m: 'm', t: 't', kg: 'kg',
    ok: 'Ridicăm', bad: 'Prea greu',
    okTxt: function (max) { return 'La această rază macaraua ridică până la ' + fmt(max) + ' kg — e loc de rezervă.'; },
    edge: function (max) { return 'Aproape de limită (max. ' + fmt(max) + ' kg). Sunați — alegem punctul de amplasare optim.'; },
    badTxt: function (max) { return 'La această rază — max. ' + fmt(max) + ' kg. Apropiem mașina sau împărțim marfa.'; },
    empty: 'Introduceți greutatea mărfii',
    axisX: 'raza, m', axisY: 'tone'
  } : {
    m: 'м', t: 'т', kg: 'кг',
    ok: 'Поднимем', bad: 'Тяжело',
    okTxt: function (max) { return 'На этом вылете кран держит до ' + fmt(max) + ' кг — запас есть.'; },
    edge: function (max) { return 'На пределе (макс. ' + fmt(max) + ' кг). Позвоните — подберём точку установки машины.'; },
    badTxt: function (max) { return 'На этом вылете — максимум ' + fmt(max) + ' кг. Подъедем ближе или разделим груз.'; },
    empty: 'Укажите вес груза',
    axisX: 'вылет, м', axisY: 'тонн'
  };

  function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

  /* ---- Меню ---- */
  var head = document.getElementById('head');
  var burger = document.getElementById('burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = head.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
    });
    head.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { head.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); });
    });
  }

  /* ---- Грузовая диаграмма ---- */
  function capAt(r) {
    if (r <= LOAD[0][0]) return LOAD[0][1];
    for (var i = 1; i < LOAD.length; i++) {
      if (r <= LOAD[i][0]) {
        var a = LOAD[i - 1], b = LOAD[i];
        return a[1] + (b[1] - a[1]) * (r - a[0]) / (b[0] - a[0]);
      }
    }
    return 0;
  }

  var svg = document.getElementById('chartSvg');
  var reach = document.getElementById('reach');
  var weight = document.getElementById('weight');
  var reachOut = document.getElementById('reachOut');
  var verdict = document.getElementById('verdict');

  if (svg && reach) {
    var NS = 'http://www.w3.org/2000/svg';
    var small = svg.getBoundingClientRect().width < 480;
    var W = small ? 360 : 560, H = small ? 250 : 300, L = 40, R = 12, TOP = 30, B = 40;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var X0 = 0, X1 = 16, Y1 = 6000;
    var x = function (v) { return L + (v - X0) / (X1 - X0) * (W - L - R); };
    var y = function (v) { return TOP + (1 - v / Y1) * (H - TOP - B); };
    var el = function (tag, attrs, parent) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(n);
      return n;
    };

    var grid = el('g', { 'class': 'grid' });
    var axis = el('g', { 'class': 'axis' });
    for (var gx = 0; gx <= 16; gx += small ? 4 : 2) {
      el('line', { x1: x(gx), x2: x(gx), y1: y(0), y2: y(Y1) }, grid);
      el('text', { x: x(gx), y: H - B + 18, 'text-anchor': 'middle' }, axis).textContent = gx;
    }
    for (var gy = 0; gy <= Y1; gy += 1000) {
      el('line', { x1: x(0), x2: x(X1), y1: y(gy), y2: y(gy) }, grid);
      el('text', { x: L - 8, y: y(gy) + 4, 'text-anchor': 'end' }, axis).textContent = gy / 1000;
    }
    el('text', { x: x(X1), y: H - 4, 'text-anchor': 'end' }, axis).textContent = T.axisX;
    el('text', { x: 4, y: 12 }, axis).textContent = T.axisY;

    var pts = LOAD.map(function (p) { return x(p[0]) + ',' + y(p[1]); });
    el('path', { 'class': 'area', d: 'M' + x(LOAD[0][0]) + ',' + y(0) + ' L' + pts.join(' L') + ' L' + x(LOAD[LOAD.length - 1][0]) + ',' + y(0) + 'Z' });
    el('polyline', { 'class': 'curve', points: pts.join(' ') });

    var mk = el('g', { 'class': 'marker' });
    var vLine = el('line', {}, mk);
    var hLine = el('line', {}, mk);
    var dot = el('circle', { r: 8 }, mk);

    var update = function () {
      var r = parseFloat(reach.value);
      var cap = capAt(r);
      reachOut.textContent = String(r).replace('.', ',') + ' ' + T.m;
      vLine.setAttribute('x1', x(r)); vLine.setAttribute('x2', x(r)); vLine.setAttribute('y1', y(0)); vLine.setAttribute('y2', y(cap));
      hLine.setAttribute('x1', x(0)); hLine.setAttribute('x2', x(r)); hLine.setAttribute('y1', y(cap)); hLine.setAttribute('y2', y(cap));
      dot.setAttribute('cx', x(r)); dot.setAttribute('cy', y(cap));

      var w = parseFloat(String(weight.value).replace(',', '.'));
      verdict.classList.remove('is-ok', 'is-bad');
      if (!w || w <= 0) { verdict.innerHTML = '<span>' + T.empty + '</span>'; return; }
      if (w <= cap * 0.9) {
        verdict.classList.add('is-ok');
        verdict.innerHTML = '<b>' + T.ok + '</b><span>' + T.okTxt(cap) + '</span>';
      } else if (w <= cap) {
        verdict.classList.add('is-ok');
        verdict.innerHTML = '<b>' + T.ok + '</b><span>' + T.edge(cap) + '</span>';
      } else {
        verdict.classList.add('is-bad');
        verdict.innerHTML = '<b>' + T.bad + '</b><span>' + T.badTxt(cap) + '</span>';
      }
    };
    reach.addEventListener('input', update);
    weight.addEventListener('input', update);
    update();
  }

  /* ---- Появление при прокрутке ---- */
  var items = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (n) { io.observe(n); });
  } else {
    items.forEach(function (n) { n.classList.add('in'); });
  }

  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
