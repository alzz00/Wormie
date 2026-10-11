// Görsel temalar. Renk sırası tüm temalarda aynı: 0 kırmızı, 1 turuncu, 2 sarı, 3 yeşil, 4 mavi, 5 mor, 6 pembe, 7 turkuaz.
export const TEMALAR = {
  teraryum: {
    ad: 'Teraryum',
    font: "'Bungee', system-ui, sans-serif",
    fontLink: 'Bungee',
    css: {
      '--zemin': '#0e1712', '--zemin2': '#172a1f', '--yazi': '#eaf6dc', '--soluk': '#86a38e',
      '--vurgu': '#c6f04e', '--vurgu-yazi': '#13210f', '--kart': '#1a2c22', '--kenar': '#2c4434',
      '--golge': '0 6px 0 #070d09',
    },
    arka: 'radial-gradient(120% 70% at 50% 0%, #21402c 0%, #0e1712 60%)',
    tahta: '#24382b', tahtaUst: '#2b4333', cerceve: '#0d1a12', cerceveUst: '#3a5a45',
    izgara: 'rgba(200,255,200,0.06)', duvar: '#5d6f5f', duvarUst: '#7e9180',
    agiz: '#050906', kontur: null, desen: 'benek', parlama: 0.5, golge: 'rgba(0,0,0,0.45)',
    renkler: ['#ff4d5e', '#ff9a2e', '#ffd93b', '#5ee05a', '#3d8bff', '#b45cff', '#ff6fc8', '#2ee6d6'],
  },
  seramik: {
    ad: 'Seramik',
    font: "'Fraunces', Georgia, serif",
    fontLink: 'Fraunces:opsz,wght@9..144,600;9..144,800',
    css: {
      '--zemin': '#efe5d3', '--zemin2': '#e5d6bd', '--yazi': '#3b2a1e', '--soluk': '#8c7660',
      '--vurgu': '#c8553d', '--vurgu-yazi': '#fff8ee', '--kart': '#f8f1e4', '--kenar': '#d9c6a7',
      '--golge': '0 5px 0 #c9b391',
    },
    arka: 'radial-gradient(circle at 20% 15%, rgba(200,85,61,0.10) 0 18%, transparent 19%), radial-gradient(circle at 85% 80%, rgba(95,140,120,0.12) 0 22%, transparent 23%), #efe5d3',
    tahta: '#f7efe0', tahtaUst: '#fbf6ec', cerceve: '#c8a77e', cerceveUst: '#dcc19c',
    izgara: 'rgba(120,90,60,0.10)', duvar: '#b9a48a', duvarUst: '#d3c2ab',
    agiz: '#2e2218', kontur: null, desen: 'serpinti', parlama: 0.28, golge: 'rgba(90,60,30,0.25)',
    renkler: ['#d9534f', '#e98a3b', '#e8c33f', '#7fae5b', '#4f7fc0', '#8c6bb8', '#df7fa0', '#4fb0a6'],
  },
  cizgi: {
    ad: 'Çizgi Roman',
    font: "'Bangers', 'Impact', sans-serif",
    fontLink: 'Bangers',
    css: {
      '--zemin': '#ffd23f', '--zemin2': '#ffc21a', '--yazi': '#141414', '--soluk': '#5b4a12',
      '--vurgu': '#ff3b6b', '--vurgu-yazi': '#ffffff', '--kart': '#ffffff', '--kenar': '#141414',
      '--golge': '4px 4px 0 #141414',
    },
    arka: 'radial-gradient(#e8a800 1.6px, transparent 1.8px) 0 0/14px 14px, #ffd23f',
    tahta: '#fffaf0', tahtaUst: '#ffffff', cerceve: '#141414', cerceveUst: '#141414',
    izgara: 'rgba(20,20,20,0.10)', duvar: '#8a8a8a', duvarUst: '#b5b5b5',
    agiz: '#141414', kontur: '#141414', desen: 'serit', parlama: 0.55, golge: 'rgba(20,20,20,0.9)',
    renkler: ['#ff3b3b', '#ff8a00', '#ffe600', '#29d45a', '#2f7bff', '#9b4dff', '#ff5fc1', '#00d1c1'],
  },
};

export const VARSAYILAN_TEMA = 'teraryum';
