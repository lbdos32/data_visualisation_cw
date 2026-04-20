'use strict';
export class Treemap {
  constructor(selector, width, height, categories, colors) {
    this.selector = selector;
    this.width = width;
    this.height = height;
    this.categories = categories;
    this.colors = colors;
    this.container = d3.select(selector);
  }

  // Utility to parse numbers safely
  parseVal(v) {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  buildRoot(yearRow) {
    return {
      name: 'All',
      children: Object.entries(this.categories).map(([cat, sources]) => ({
        name: cat,
        children: sources.map(s => ({
          name: s,
          value: this.parseVal(yearRow[s])
        })).filter(d => d.value > 0),
        value: sources.reduce((a, s) => a + this.parseVal(yearRow[s]), 0)
      })).filter(d => d.value > 0)
    };
  }

  render(yearRow) {
    const fullRoot = this.buildRoot(yearRow);
    const total = fullRoot.children.reduce((a, c) => a + c.value, 0);

    // Update Total Display if element exists
    const totalValEl = document.getElementById('total-val');
    if (totalValEl) totalValEl.textContent = total.toFixed(2);

    this.container.html(''); // Clear previous
    const svg = this.container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('viewBox', `0 0 ${this.width} ${this.height}`);

    const backBtn = document.getElementById('back-btn');
    const crumb = document.getElementById('breadcrumb');

    const drawTop = () => {
      if (backBtn) backBtn.style.display = 'none';
      if (crumb) crumb.innerHTML = 'All categories';

      svg.selectAll('*').remove();
      const hier = d3.hierarchy(fullRoot).sum(d => d.value).sort((a, b) => b.value - a.value);
      d3.treemap().size([this.width, this.height]).padding(3)(hier);

      const cells = svg.selectAll('.tm-cell')
        .data(hier.children)
        .join('g').attr('class', 'tm-cell')
        .attr('transform', d => `translate(${d.x0},${d.y0})`)
        .on('click', (e, d) => drawCat(d.data.name));

      cells.append('rect')
        .attr('width', d => Math.max(0, d.x1 - d.x0))
        .attr('height', d => Math.max(0, d.y1 - d.y0))
        .attr('rx', 4)
        .attr('fill', d => this.colors[d.data.name]?.fill || '#ccc')
        .attr('stroke', d => this.colors[d.data.name]?.stroke || '#999');

      this.addLabels(cells, total, true);
    };

    const drawCat = (catName) => {
      if (backBtn) backBtn.style.display = 'flex';
      if (crumb) crumb.innerHTML = `All categories › ${catName}`;

      const catData = fullRoot.children.find(c => c.name === catName);
      const catTotal = catData.value;

      svg.selectAll('*').remove();
      const hier = d3.hierarchy({ name: catName, children: catData.children })
        .sum(d => d.value).sort((a, b) => b.value - a.value);

      d3.treemap().size([this.width, this.height]).padding(3)(hier);

      const base = this.colors[catName] || { fill: '#ccc', stroke: '#999', text: '#333' };
      const cells = svg.selectAll('.tm-cell')
        .data(hier.children)
        .join('g').attr('class', 'tm-cell')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);

      cells.append('rect')
        .attr('width', d => Math.max(0, d.x1 - d.x0))
        .attr('height', d => Math.max(0, d.y1 - d.y0))
        .attr('rx', 4)
        .attr('fill', base.fill)
        .attr('stroke', base.stroke);

      this.addLabels(cells, catTotal, false, base.text);
    };

    if (backBtn) backBtn.onclick = drawTop;
    drawTop();
  }

  addLabels(cells, totalValue, isTopLevel, customColor) {
    cells.each(function(d) {
      const cw = d.x1 - d.x0, ch = d.y1 - d.y0;
      if (cw < 40 || ch < 25) return;
      const g = d3.select(this);
      const labelColor = customColor || '#333';

      g.append('text')
        .attr('x', 5).attr('y', 18)
        .attr('font-size', '12px').attr('fill', labelColor)
        .text(d.data.name);
    });
  }
}