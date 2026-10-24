/* Math diagrams use only the prompt's givens, never the answer or explanation. */
(function (root) {
  const amount = '[0-9][0-9,]*(?:\\.[0-9]+)?';
  const quantityPattern = new RegExp(`(${amount})\\s*(square feet|square inches|square meters|square miles|square centimeters|US gallons|kilograms|milligrams|centimeters|inches|ounces|meters|feet|miles|pounds|gallons|cm²|km²|ft²|yd²|mi²|in²|m²|cm|km|ft|yd|mi|kg|mg|oz|lb|in\\.|m|g|L)(?![A-Za-z])`, 'g');
  const unitNames = {
    'square feet': 'ft²', 'square inches': 'in²', 'square meters': 'm²',
    'square miles': 'mi²', 'square centimeters': 'cm²',
    centimeters: 'cm', meters: 'm', inches: 'in.', feet: 'ft', yards: 'yd', miles: 'mi',
    kilograms: 'kg', milligrams: 'mg', grams: 'g', ounces: 'oz', pounds: 'lb',
    liters: 'L', gallons: 'US gal', 'US gallons': 'US gal',
  };
  const unit = value => unitNames[value] || value;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const quantities = text => [...text.matchAll(quantityPattern)].map(m => `${m[1]} ${unit(m[2])}`);
  const firstSentence = text => text.split(/\.\s/)[0];
  function shape(type, title, width = '', height = '', inside = '', extra = '') {
    return { type, title, width, height, inside, extra };
  }

  function geometry(text) {
    const qs = quantities(text);
    const triangle = /triangle|triangular/i.test(text);
    const square = /square has/i.test(text);
    const isShapeOnly = /perimeter|has area|covers|design has|figure is scaled/i.test(firstSentence(text)) && !/by|long|wide|sides|base|side length/.test(firstSentence(text));
    const type = triangle ? 'triangle' : square ? 'square' : isShapeOnly ? 'polygon' : 'rectangle';
    const scaling = /scal|enlarge|similar|copy|becomes|times as long/i.test(text);
    const target = /perimeter|trim|around its edge/.test(text.slice(text.lastIndexOf('.') + 1)) || /new perimeter/.test(text) ? 'Perimeter = ?' : /scale factor from/.test(text) ? 'Scale factor = ?' : /ratio/.test(text) ? 'Area ratio = ?' : 'Area = ?';
    const model = {heading: scaling ? 'Compare the two shapes' : 'Picture the shape', panels: [], note: 'Diagram is a sketch, not drawn to scale.'};
    let factor = text.match(/(?:scale factor (?:of )?|scaled by |scales? by |length scale factor of )([\d./]+)/)?.[1];
    if (!factor) factor = text.match(/(?:every side |sides )([\d.]+) times/)?.[1];
    if (factor) factor = factor.replace(/\.$/, '');
    if (factor) model.rate = `Length scale factor: ${factor}`;
    else if (scaling) model.rate = 'Find the relationship between the shapes';
    if (/Two similar figures have perimeters/.test(text)) {
      model.panels = [shape('polygon','Smaller figure','','',`Area: ${qs[2]}`,`Perimeter: ${qs[0]}`),shape('polygon','Larger figure','','','Area = ?',`Perimeter: ${qs[1]}`)];
    } else if (/rectangle becomes/.test(text)) {
      model.panels = [shape('rectangle','Original',qs[0],qs[1]),shape('rectangle','New',qs[2],qs[3],'Scale factor = ?')];
    } else if (/logo has a side/.test(text)) {
      model.panels = [shape('polygon','Original logo',qs[0]),shape('polygon','Enlarged copy',qs[1],'','Scale factor = ?')];
    } else if (triangle && /has sides/.test(text)) {
      model.panels = [shape('rightTriangle','Original triangle',qs[0],qs[1],'',qs[2]),shape('rightTriangle','Scaled triangle','?','?','Perimeter = ?','?')];
    } else if (/has area|covers|design has area/.test(text)) {
      model.panels = [shape(type,'Original','','',`Area: ${qs[0]}`),shape(type,'Scaled copy','','','Area = ?')];
    } else if (/has perimeter/.test(text)) {
      model.panels = [shape('polygon','Original','','',`Perimeter: ${qs[0]}`),shape('polygon','Scaled copy','','','Perimeter = ?')];
    } else if (/figure is scaled/.test(text)) {
      model.panels = [shape('polygon','Original','','','Original area'),shape('polygon','Scaled copy','','','New area = ?')];
    } else {
      model.panels = [shape(type, scaling ? 'Original' : triangle ? 'Triangle' : square ? 'Square' : 'Rectangle',qs[0],square ? qs[0] : qs[1],scaling ? '' : target)];
      if (scaling) model.panels.push(shape(type,'Scaled copy','?','?',target));
    }
    return model;
  }

  function scaleDrawing(text) {
    const qs = quantities(text);
    const model = {heading: 'From the drawing to the real object', panels: [], note: 'Sketches are not to scale. Use the stated drawing scale.'};
    const rate = text.match(/1 (cm|centimeter|inches|inch|in\.) (?:to represent|for|to) (\d+(?:\.\d+)?) (m|ft)/);
    const inchRate = text.match(/Each inch represents (\d+(?:\.\d+)?) ft/);
    if (rate) model.rate = `Scale: 1 ${unit(rate[1])} represents ${rate[2]} ${rate[3]}`;
    else if (inchRate) model.rate = `Scale: 1 inch represents ${inchRate[1]} ft`;
    else model.rate = 'Which scale matches?';
    if (/model tower|model boat|model monument|model arch/.test(text)) {
      const vertical = /high|tall/.test(text);
      model.panels = [shape('rectangle','Model',qs[vertical ? 1 : 0],qs[vertical ? 0 : 1]),shape('rectangle','Real object',qs[vertical ? 3 : 2],qs[vertical ? 2 : 3])];
    } else if (/path|straight trail/.test(text)) {
      model.panels = [shape('length','On the map',qs.at(-1)),shape('length','Actual path','? m')];
    } else if (/building is|workshop is/.test(text)) {
      model.panels = [shape('length','On the drawing','? in.'),shape('length','Actual building',qs[0])];
    } else if (/ratio/.test(text)) {
      model.panels = [shape('length','Drawing',qs[0]),shape('length','Actual distance',qs[1],'','? cm')];
      model.note = 'Express both lengths in the same unit before writing the ratio.';
    } else {
      const lot = text.match(/(?:in a|fits a) ([\d.]+) ft by ([\d.]+) ft/);
      const target = /cost/.test(text) ? 'Cost = ?' : /perimeter/.test(text) ? 'Perimeter = ?' : /area/.test(text) ? 'Area = ?' : 'Will it fit?';
      model.panels = [shape('rectangle','Drawing',qs[0],qs[1]),lot ? shape('rectangle','Available space',`${lot[1]} ft`,`${lot[2]} ft`,'Will it fit?') : shape('rectangle','Actual size','?','?',target)];
      const cost = text.match(/\$(\d+) per square meter/);
      if (cost) model.note = `Flooring: $${cost[1]} per m². Find the actual area first. Sketches are not to scale.`;
    }
    return model;
  }

  function money(text) {
    const model = {heading:'Picture the exchange',panels:[],note:'Practice exchange rate. Assume no fees.'};
    const given = text.match(/1 USD = ([\d.]+) (CAD|AUD|pesos|euros|British pounds|Brazilian reais|Swiss francs)/);
    const currencyLabels = {'British pounds':'GBP','Brazilian reais':'BRL','Swiss francs':'CHF',euros:'EUR',pesos:'pesos',yen:'yen'};
    const dollars = [...text.matchAll(/\$?([\d,]+(?:\.\d+)?) USD/g)].map(m=>m[1]);
    if (given) {
      const foreign = currencyLabels[given[2]] || given[2];
      model.rate = `1 USD = ${given[1]} ${foreign}`;
      const amount = text.match(/(?:costs|cost of an?|spend) \$?([\d.]+)(?:-euro| (?:euros|pesos|AUD|CAD))/)?.[1];
      if (/spend/.test(text)) {
        const spent = text.match(/spend ([\d.]+) (AUD|CAD)/);
        model.panels=[shape('money','Exchange',`${dollars[1]} USD`),shape('money','Money left','? USD')];
        model.note=`Spend ${spent[1]} ${spent[2]} after exchanging. Find what remains in USD.`;
      } else if (/USD per pound/.test(text)) {
        model.panels=[shape('money','One British pound','1 GBP'),shape('money','Equivalent value','? USD')];
      } else if (amount) {
        model.panels=[shape('money','Price',`${amount} ${foreign}`),shape('money','Equivalent price','? USD')];
        const compare = text.match(/compare with (\$?\d+(?:\.\d+)?(?: USD)?)/);
        if (compare) model.note=`Compare the converted price with ${compare[1]}.`;
      } else {
        model.panels=[shape('money','Exchange',`${dollars[1]} USD`),shape('money','You receive',`? ${foreign}`)];
      }
    } else {
      const exchange=text.match(/\$?([\d,]+(?:\.\d+)?) USD buys ([\d,]+(?:\.\d+)?) (euros|yen)/);
      if (!exchange) throw new Error(`Unrecognized currency prompt: ${text}`);
      const foreign=currencyLabels[exchange[3]];
      if (/yen/.test(text)) {
        model.rate=`Given: ${exchange[1]} USD buys ${exchange[2]} yen`;
        model.panels=[shape('money','New exchange',`${dollars.at(-1)} USD`),shape('money','You receive','? yen')];
      } else {
        model.rate='Find the value of 1 USD';
        model.panels=[shape('money','Given exchange',`${exchange[1]} USD`),shape('money','Given exchange',`${exchange[2]} ${foreign}`)];
        model.note='Exchange rate = ? euros per USD.';
      }
    }
    return model;
  }

  function measurement(text) {
    const qs=quantities(text);
    const given=qs[0];
    const area=/square|[²]/.test(text);
    const kind=area ? 'area' : /gallons|liters|\bL\b/.test(text) ? 'jug' : /mass|weigh|\bkg\b|\boz\b|\blb\b|grams/.test(text) ? 'mass' : 'length';
    const targetMatches=[...text.matchAll(/(?:in|to|many) (square centimeters|square inches|square feet|square meters|square miles|US gallons|kilograms|milligrams|centimeters|inches|meters|yards|miles|pounds|grams|liters|reais|mi²)/g)];
    const target=unit(targetMatches.at(-1)?.[1] || (kind==='mass'?'lb':kind==='area'?'mi²':'m'));
    const rate=text.match(/Use (.+?)(?:\.\s|$)/)?.[1] || text.match(/Using (.+?)(?:,|\.\s|$)/)?.[1];
    const model={heading:area ? 'Same area, different units' : 'Same measurement, different units',rate:rate ? `Given: ${rate}` : '',panels:[],note:area ? 'The grid represents area, not a count of unit squares. Sketches are not to scale.' : 'The object stays the same; only its unit changes. Sketches are not to scale.'};
    if (/exceeds the limit/.test(text)) {
      model.heading='Compare the packages with the limit';
      model.panels=[shape('mass','Maximum allowed',given),shape('mass','Each answer choice','? lb')];
      model.note='Convert the limit to pounds, then compare each bag or package.';
    } else if (area && /rectangular/.test(text)) {
      model.panels=[shape('rectangle','Given dimensions',qs[0],qs[1]),shape('area','Converted area',`? ${target}`)];
    } else {
      model.panels=[shape(kind,'Given measurement',given),shape(kind,'Equivalent measurement',`? ${target}`)];
    }
    return model;
  }

  function getModel(question) {
    if (!question || question.subject !== 'math') return null;
    // Intentionally pass no answer or alternatives to the diagram builders.
    const text=question.question;
    if(question.chapter===2) return geometry(text);
    if(question.chapter===3) return scaleDrawing(text);
    if(question.chapter===4) return money(text);
    if(question.chapter===5 || question.chapter===6) return measurement(text);
    return null;
  }

  function svg(panel) {
    const text=(x,y,value,cls='diagram-label')=>value ? `<text x="${x}" y="${y}" text-anchor="middle" class="${cls}">${escape(value)}</text>` : '';
    let drawing='';
    switch(panel.type) {
      case 'square':
        drawing=`<rect class="diagram-shape" x="75" y="48" width="140" height="140"/>${text(145,30,panel.width)}${text(145,121,panel.inside)}${text(145,218,panel.height)}`;
        break;
      case 'rightTriangle':
        drawing=`<path class="diagram-shape" d="M60 165 V48 L240 165 Z"/><path class="diagram-line" d="M60 150 H75 V165"/>${text(150,198,panel.width ? `Base: ${panel.width}`:'')}${text(145,28,panel.extra ? `Sloping side: ${panel.extra}`:'')}<text x="36" y="112" text-anchor="middle" transform="rotate(-90 36 112)" class="diagram-label">${escape(panel.height)}</text>${text(135,145,panel.inside)}`;
        break;
      case 'rectangle':
        drawing=`<rect class="diagram-shape" x="42" y="45" width="200" height="115" rx="2"/>${text(142,29,panel.width)}<path class="diagram-line" d="M258 45 V160 M253 45 H263 M253 160 H263"/><text x="282" y="106" text-anchor="middle" transform="rotate(-90 282 106)" class="diagram-label">${escape(panel.height)}</text>${text(142,110,panel.inside)}`;
        break;
      case 'triangle':
        drawing=`<path class="diagram-shape" d="M45 165 L145 48 L245 165 Z"/><path class="diagram-guide" d="M145 48 V165"/>${text(145,195,panel.width ? `Base: ${panel.width}`:'')}${text(145,30,panel.height ? `Height: ${panel.height}`:'')}${text(145,145,panel.inside)}${text(145,218,panel.extra ? `Third side: ${panel.extra}`:'')}`;
        break;
      case 'polygon':
        drawing=`<path class="diagram-shape" d="M145 45 L247 91 L211 170 L79 170 L43 91 Z"/>${text(145,29,panel.width ? `Side: ${panel.width}`:'')}${text(145,113,panel.inside)}${text(145,201,panel.extra)}`;
        break;
      case 'length':
        drawing=`<rect class="diagram-shape" x="25" y="80" width="240" height="55" rx="5"/>${Array.from({length:13},(_,i)=>`<path class="diagram-line" d="M${25+i*20} 81 v${i%3===0?22:12}"/>`).join('')}<path class="diagram-line" d="M25 160 H265 M25 152 V168 M265 152 V168"/>${text(145,62,panel.width)}${text(145,197,panel.inside)}`;
        break;
      case 'money':
        drawing=`<rect class="diagram-shape" x="30" y="55" width="230" height="130" rx="14"/><rect class="diagram-guide" x="43" y="68" width="204" height="104" rx="8"/><circle class="diagram-coin" cx="145" cy="120" r="32"/>${text(145,127,'¤','diagram-currency')}${text(145,32,panel.width)}`;
        break;
      case 'mass':
        drawing=`<path class="diagram-shape" d="M65 95 L83 48 H207 L225 95 V143 H65 Z"/><path class="diagram-guide" d="M145 48 V95 M65 95 H225"/><path class="diagram-line" d="M145 143 V160"/><rect class="diagram-shape" x="55" y="160" width="180" height="45" rx="12"/>${text(145,190,panel.width)}`;
        break;
      case 'jug':
        drawing=`<path class="diagram-shape" d="M75 42 H185 V186 H75 Z"/><path class="diagram-line" d="M185 65 H211 Q234 65 234 97 Q234 129 211 129 H185"/><path class="diagram-water" d="M76 107 Q103 95 130 107 T184 107 V185 H76 Z"/>${[65,85,105,125,145,165].map(y=>`<path class="diagram-line" d="M77 ${y} h18"/>`).join('')}${text(145,218,panel.width)}`;
        break;
      case 'area':
        drawing=`<rect class="diagram-shape" x="55" y="45" width="180" height="145"/>${[1,2,3,4].map(i=>`<path class="diagram-guide" d="M${55+i*36} 45 V190 M55 ${45+i*29} H235"/>`).join('')}<rect class="diagram-label-bg" x="65" y="96" width="160" height="42" rx="5"/>${text(145,124,panel.width)}`;
        break;
      default: throw new Error(`Unknown diagram type: ${panel.type}`);
    }
    const description=[panel.title,panel.width,panel.height,panel.inside,panel.extra].filter(Boolean).join('. ');
    return `<div class="math-diagram-panel"><h3>${escape(panel.title)}</h3><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 290 235" role="img" aria-label="${escape(description)}">${drawing}</svg></div>`;
  }
  function render(question) {
    const model=getModel(question);
    if(!model) return '';
    return `<div class="math-visual-heading">${escape(model.heading)}</div>${model.rate ? `<p class="math-visual-rate">${escape(model.rate)}</p>`:''}<div class="math-diagrams ${model.panels.length===1?'math-diagrams-single':''}">${model.panels.map(svg).join('<span class="math-diagram-arrow" aria-hidden="true">→</span>')}</div><figcaption>${escape(model.note)}</figcaption>`;
  }
  const api={getModel,render};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.MathVisuals=api;
})(typeof globalThis!=='undefined'?globalThis:this);
