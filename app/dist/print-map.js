// Janela "Mapa 2D": opções de camadas, modo temático e exportação em PNG.
import {createCartographer, PRINT_MODES, PRINT_THEMES} from './print-map-core.js?v=5';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const STORE = 'silvengard-print-v1';
const SIZES = [
  ['2400x1200', '2400 × 1200 · rascunho'],
  ['3200x1600', '3200 × 1600 · boa para tela e A4'],
  ['4800x2400', '4800 × 2400 · impressão'],
  ['6000x3000', '6000 × 3000 · pôster']
];

export function createPrintMap({D, toast, getEconomy, getProvince, cityName, stateName, mapName}) {
  const cartographer = createCartographer({D, cityName, stateName, getEconomy, getProvince, mapName});
  const defaults = {
    mode: 'terrain',
    theme: 'blue',
    cities: 'capitals',
    size: '3200x1600',
    title: `O MUNDO DE ${String(mapName || 'SILVANGAD').toUpperCase()}`,
    subtitle: 'ATLAS VIVO · EDIÇÃO DO MESTRE',
    pois: 'all',
    stateBorders: true,
    reliefStyle: 'shade',
    riverStyle: 'banks',
    labelInk: '#2b3335',
    labelInkCustom: false,
    stateLabels: true,
    riverLabels: true,
    rivers: true,
    vegetation: true,
    relief: true,
    roads: false,
    grid: true,
    compass: true,
    scale: true,
    legend: true,
    legendCorner: 'top-right',
    labelTone: 'dark',
    zoom: 1.06,
    unknownNorth: true
  };
  let opts = {...defaults};
  try { opts = {...defaults, ...(JSON.parse(localStorage.getItem(STORE) || 'null') || {})}; } catch {}
  if (!PRINT_MODES.some(([id]) => id === opts.mode)) opts.mode = 'terrain';
  if (!PRINT_THEMES.some(([id]) => id === opts.theme)) opts.theme = 'blue';
  if (opts.pois === true) opts.pois = 'all';
  if (opts.pois === false) opts.pois = 'none';
  if (!['all', 'natural', 'none'].includes(opts.pois)) opts.pois = 'all';
  if (!['soft', 'dark', 'black'].includes(opts.labelTone)) opts.labelTone = 'dark';
  if (!['top-right', 'bottom-left'].includes(opts.legendCorner)) opts.legendCorner = 'top-right';
  if (!['shade', 'glyphs', 'none'].includes(opts.reliefStyle)) opts.reliefStyle = opts.relief === false ? 'none' : 'shade';
  if (!['banks', 'simple', 'none'].includes(opts.riverStyle)) opts.riverStyle = opts.rivers === false ? 'none' : 'banks';

  let preview = null, previewDirty = true, timer = 0, busy = false;

  const dialog = document.createElement('dialog');
  dialog.className = 'printDialog';
  dialog.setAttribute('aria-label', 'Mapa 2D');
  dialog.innerHTML = `
    <div class="printHead">
      <div class="printHeadingText">
        <small>CARTOGRAFIA</small>
        <h2>Mapa 2D</h2>
      </div>
      <p class="printSub">Um mapa redesenhado a partir dos dados do mundo — contornos, relevo, vegetação, fronteiras e nomes. Não é uma captura da vista 3D.</p>
      <button type="button" class="printClose" title="Fechar" aria-label="Fechar">✕</button>
    </div>
    <div class="printBody">
      <form class="printOptions" onsubmit="return false">
        <label class="printField">Modo do mapa
          <select id="pmMode">${PRINT_MODES.map(([id, name]) => `<option value="${id}">${esc(name)}</option>`).join('')}</select>
        </label>
        <p class="printHint" id="pmHint"></p>
        <label class="printField">Tema do papel
          <select id="pmTheme">${PRINT_THEMES.map(([id, name]) => `<option value="${id}">${esc(name)}</option>`).join('')}</select>
        </label>
        <label class="printField">Nomes das cidades
          <select id="pmCities" title="Principais: capitais, portos principais, escolas de magia, fortalezas e cidades anãs, fortes (classe Forte) e as 30 mais populosas. Capitais nunca são omitidas.">
            <option value="capitals">Só as capitais</option>
            <option value="major">Capitais e principais</option>
            <option value="all">Todas as cidades</option>
            <option value="none">Nenhum nome</option>
          </select>
        </label>
        <label class="printField">Tom dos nomes
          <select id="pmTone">
            <option value="soft">Suave</option>
            <option value="dark">Escuro · recomendado</option>
            <option value="black">Contraste alto</option>
          </select>
        </label>
        <div class="printInkRow">
          <span>Cor dos nomes</span>
          <input type="color" id="pmInkColor" value="#2b3335" aria-label="Cor personalizada dos nomes">
          <label><input type="checkbox" id="pmInkCustom"> usar esta cor</label>
        </div>
        <label class="printField">Tamanho da exportação
          <select id="pmSize">${SIZES.map(([id, name]) => `<option value="${id}">${esc(name)}</option>`).join('')}</select>
        </label>
        <label class="printField">Enquadramento
          <select id="pmZoom">
            <option value="1">Mundo inteiro · 100%</option>
            <option value="1.06">Um pouco maior · 106%</option>
            <option value="1.12">Mais perto · 112%</option>
          </select>
        </label>
        <label class="printField">Pontos de interesse
          <select id="pmPois">
            <option value="all">Todos</option>
            <option value="natural">Só naturais · bosques, montanhas, lagos</option>
            <option value="none">Nenhum</option>
          </select>
        </label>

        <details open class="printGroup">
          <summary>Camadas</summary>
          <label class="printField printFieldInGroup">Relevo
            <select id="pmReliefStyle">
              <option value="shade">Sombreado · sombra natural</option>
              <option value="glyphs">Picos desenhados · antigo</option>
              <option value="none">Nenhum</option>
            </select>
          </label>
          <label class="printField printFieldInGroup">Rios e lagos
            <select id="pmRiverStyle">
              <option value="banks">Com margens</option>
              <option value="simple">Linha simples</option>
              <option value="none">Sem rios</option>
            </select>
          </label>
          <div class="printChecks">
            <label><input type="checkbox" data-opt="stateBorders"> Fronteiras dos estados</label>
            <label><input type="checkbox" data-opt="vegetation"> Vegetação</label>
            <label><input type="checkbox" data-opt="roads"> Estradas</label>
            <label><input type="checkbox" data-opt="stateLabels"> Nomes dos estados</label>
            <label><input type="checkbox" data-opt="riverLabels"> Nomes dos rios</label>
            <label><input type="checkbox" data-opt="unknownNorth"> Terras desconhecidas ao norte</label>
          </div>
        </details>

        <details class="printGroup">
          <summary>Acabamento</summary>
          <div class="printChecks">
            <label><input type="checkbox" data-opt="grid"> Grade e coordenadas</label>
            <label><input type="checkbox" data-opt="compass"> Rosa dos ventos</label>
            <label><input type="checkbox" data-opt="scale"> Escala</label>
            <label><input type="checkbox" data-opt="legend"> Legenda</label>
          </div>
          <label class="printField printFieldInGroup">Posição da legenda
            <select id="pmLegendCorner">
              <option value="top-right">Superior direita</option>
              <option value="bottom-left">Inferior esquerda</option>
            </select>
          </label>
        </details>

        <details class="printGroup">
          <summary>Título da carta</summary>
          <label class="printField printFieldInGroup">Título
            <input id="pmTitle" type="text" maxlength="70" autocomplete="off">
          </label>
          <label class="printField printFieldInGroup">Subtítulo
            <input id="pmSubtitle" type="text" maxlength="90" autocomplete="off">
          </label>
        </details>
      </form>
      <div class="printStage">
        <div class="printBusy" id="pmBusy"><div><span>Desenhando o mapa…</span><small>contornos, relevo, vegetação e nomes</small></div></div>
        <div class="printPreviewStack">
          <canvas id="pmPreview" aria-label="Prévia do mapa 2D"></canvas>
          <div class="printDetail">
            <div class="printDetailHead"><span>DETALHE</span><span>trecho central · leitura dos nomes</span></div>
            <canvas id="pmDetail" aria-label="Detalhe do mapa 2D"></canvas>
          </div>
        </div>
        <div class="printStageFoot">
          <span id="pmStats"></span>
          <button type="button" id="pmOpen">Ver em tamanho real ↗</button>
        </div>
      </div>
    </div>
    <div class="printFoot">
      <span class="printFootNote">O mapa é redesenhado do zero: contornos, relevo, vegetação, fronteiras e nomes.</span>
      <button type="button" id="pmRefresh">Atualizar prévia</button>
      <button type="button" id="pmDownload" class="printPrimary">Baixar PNG ↓</button>
    </div>`;
  document.body.append(dialog);

  const $ = sel => dialog.querySelector(sel);
  const modeSelect = $('#pmMode'), themeSelect = $('#pmTheme'), citySelect = $('#pmCities'), sizeSelect = $('#pmSize');
  const toneSelect = $('#pmTone'), zoomSelect = $('#pmZoom'), poisSelect = $('#pmPois'), legendSelect = $('#pmLegendCorner');
  const reliefSelect = $('#pmReliefStyle'), riverSelect = $('#pmRiverStyle');
  const inkColor = $('#pmInkColor'), inkCustom = $('#pmInkCustom');
  const titleInput = $('#pmTitle'), subtitleInput = $('#pmSubtitle');
  const hint = $('#pmHint'), stats = $('#pmStats'), busyEl = $('#pmBusy');
  const canvas = $('#pmPreview');
  const detail = $('#pmDetail');
  const downloadBtn = $('#pmDownload');
  const refreshBtn = $('#pmRefresh');

  function setBusy(value) {
    busy = value;
    busyEl.classList.toggle('on', value);
    downloadBtn.disabled = value;
    refreshBtn.disabled = value;
  }

  function drawDetail(rendered) {
    if (!detail) return;
    const cssWidth = Math.round(canvas.getBoundingClientRect().width) || 900;
    const cropW = Math.min(rendered.width - 24, Math.max(480, cssWidth));
    const cropH = Math.max(120, Math.round(cropW * 0.14));
    const sx = Math.max(0, Math.round((rendered.width - cropW) / 2));
    const sy = Math.max(0, Math.round((rendered.height - cropH) * 0.52));
    detail.width = cropW;
    detail.height = cropH;
    const dctx = detail.getContext('2d');
    dctx.drawImage(rendered, sx, sy, cropW, cropH, 0, 0, cropW, cropH);
    const info = dialog.querySelector('.printDetailHead span:last-child');
    if (info) info.textContent = `trecho central · ${Math.round((cssWidth / cropW) * 100)}% do tamanho real`;
  }

  function syncControls() {
    modeSelect.value = opts.mode;
    themeSelect.value = opts.theme;
    citySelect.value = opts.cities;
    sizeSelect.value = opts.size;
    toneSelect.value = opts.labelTone;
    zoomSelect.value = String(opts.zoom);
    poisSelect.value = opts.pois;
    legendSelect.value = opts.legendCorner;
    reliefSelect.value = opts.reliefStyle;
    riverSelect.value = opts.riverStyle;
    inkColor.value = opts.labelInk || '#2b3335';
    inkCustom.checked = !!opts.labelInkCustom;
    inkColor.disabled = !opts.labelInkCustom;
    titleInput.value = opts.title;
    subtitleInput.value = opts.subtitle;
    for (const input of dialog.querySelectorAll('[data-opt]')) input.checked = !!opts[input.dataset.opt];
    refreshAvailability();
    updateHint();
    updateStats();
  }

  function refreshAvailability() {
    let economyReady = false, provinceReady = false;
    try { economyReady = !!getEconomy?.(); } catch { economyReady = false; }
    try { provinceReady = !!getProvince?.(); } catch { provinceReady = false; }
    for (const option of modeSelect.options) {
      if (option.value === 'goods' || option.value === 'markets') option.disabled = !economyReady;
      if (option.value === 'provinces') option.disabled = !provinceReady;
    }
    if (modeSelect.selectedOptions[0]?.disabled) {
      opts.mode = 'terrain';
      modeSelect.value = 'terrain';
    }
  }

  function updateHint() {
    const row = PRINT_MODES.find(([id]) => id === opts.mode);
    hint.textContent = row ? row[2] : '';
  }

  function sizeValue() {
    const [w, h] = String(opts.size).split('x').map(Number);
    return {width: w || 3200, height: h || 1600};
  }

  function updateStats() {
    const {width, height} = sizeValue();
    stats.textContent = `${width} × ${height} px · ${(width / height).toFixed(2)}:1`;
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(opts)); } catch {}
  }

  function renderOptions() {
    const {width, height} = sizeValue();
    return {
      width, height,
      mode: opts.mode,
      theme: opts.theme,
      cities: opts.cities,
      title: opts.title,
      subtitle: opts.subtitle,
      labelTone: opts.labelTone,
      labelInk: opts.labelInkCustom ? opts.labelInk : '',
      legendCorner: opts.legendCorner,
      reliefStyle: opts.reliefStyle,
      riverStyle: opts.riverStyle,
      zoom: Number(opts.zoom) || 1,
      stateBorders: opts.stateBorders,
      pois: opts.pois,
      stateLabels: opts.stateLabels,
      riverLabels: opts.riverLabels,
      rivers: opts.rivers,
      vegetation: opts.vegetation,
      relief: opts.relief,
      roads: opts.roads,
      grid: opts.grid,
      compass: opts.compass,
      scale: opts.scale,
      legend: opts.legend,
      unknownNorth: opts.unknownNorth,
      seed: 20260101
    };
  }

  async function paint(canvasEl, options) {
    const rendered = cartographer.renderSheet(options);
    canvasEl.width = rendered.width;
    canvasEl.height = rendered.height;
    canvasEl.getContext('2d').drawImage(rendered, 0, 0);
    return rendered;
  }

  async function renderPreview() {
    if (busy) return;
    setBusy(true);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 20))));
    try {
      preview = await paint(canvas, {...renderOptions(), width: 1600, height: 800});
      drawDetail(preview);
      previewDirty = false;
      updateStats();
    } catch (error) {
      console.error(error);
      toast('Não foi possível desenhar o mapa: ' + error.message);
    } finally {
      setBusy(false);
    }
  }

  function schedulePreview(delay = 180) {
    previewDirty = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (busy) { schedulePreview(120); return; }
      renderPreview();
    }, delay);
  }

  function download() {
    if (busy) return;
    setBusy(true);
    setTimeout(async () => {
      try {
        const options = renderOptions();
        const rendered = cartographer.renderSheet(options);
        const blob = await new Promise(resolve => rendered.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('O navegador não conseguiu gerar o PNG.');
        const modeName = (PRINT_MODES.find(([id]) => id === opts.mode) || [, 'mapa'])[1];
        const slug = modeName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `mapa-silvangad-${slug}-${options.width}x${options.height}.png`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 5000);
        toast(`Mapa exportado · ${options.width} × ${options.height} px`);
        stats.textContent = `${options.width} × ${options.height} px · ${(blob.size / 1048576).toFixed(1)} MB`;
      } catch (error) {
        console.error(error);
        toast('Não foi possível exportar o mapa: ' + error.message);
      } finally {
        setBusy(false);
        if (previewDirty) renderPreview();
      }
    }, 40);
  }

  function openFullSize() {
    if (!preview) return;
    preview.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) toast('O navegador bloqueou a nova aba. Use “Baixar PNG”.');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }, 'image/png');
  }

  for (const select of [modeSelect, themeSelect, citySelect, sizeSelect, toneSelect, zoomSelect, poisSelect, legendSelect, reliefSelect, riverSelect]) {
    select.addEventListener('change', () => {
      opts.mode = modeSelect.value;
      opts.theme = themeSelect.value;
      opts.cities = citySelect.value;
      opts.size = sizeSelect.value;
      opts.labelTone = toneSelect.value;
      opts.zoom = Number(zoomSelect.value) || 1;
      opts.pois = poisSelect.value;
      opts.legendCorner = legendSelect.value;
      opts.reliefStyle = reliefSelect.value;
      opts.riverStyle = riverSelect.value;
      if (select === modeSelect) updateHint();
      updateStats();
      save();
      schedulePreview();
    });
  }
  inkCustom.addEventListener('change', () => {
    opts.labelInkCustom = inkCustom.checked;
    inkColor.disabled = !opts.labelInkCustom;
    save();
    schedulePreview();
  });
  inkColor.addEventListener('input', () => {
    opts.labelInk = inkColor.value;
    if (!opts.labelInkCustom) {
      opts.labelInkCustom = true;
      inkCustom.checked = true;
      inkColor.disabled = false;
    }
    save();
    schedulePreview(120);
  });
  for (const input of dialog.querySelectorAll('[data-opt]')) {
    input.addEventListener('change', () => {
      opts[input.dataset.opt] = input.checked;
      save();
      schedulePreview();
    });
  }
  for (const [input, key] of [[titleInput, 'title'], [subtitleInput, 'subtitle']]) {
    input.addEventListener('input', () => {
      opts[key] = input.value;
      save();
      schedulePreview(320);
    });
  }
  refreshBtn.addEventListener('click', renderPreview);
  downloadBtn.addEventListener('click', download);
  $('#pmOpen').addEventListener('click', openFullSize);
  $('.printClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { previewDirty = true; });

  syncControls();

  return {
    open(mode) {
      if (mode && PRINT_MODES.some(([id]) => id === mode)) opts.mode = mode;
      try { cartographer.invalidate(); } catch {}
      syncControls();
      if (!dialog.open) dialog.showModal();
      if (!preview || previewDirty) renderPreview();
      else setTimeout(() => { if (previewDirty) renderPreview(); }, 10);
      setTimeout(() => modeSelect.focus(), 30);
    },
    close() { dialog.close(); },
    get element() { return dialog; }
  };
}
