'use strict';

export default class Treemap {
  constructor(container, width, height) {
    this.container = container;
    this.width = width;
    this.height = height;

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
  }

  render(hierarchyData) {
    const treemapLayout = d3.treemap()
      .size([this.width, this.height])
      .padding(1);

    treemapLayout(hierarchyData);

    this.svg.selectAll('rect')
      .data(hierarchyData.leaves())
      .join('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', '#7ec8e3')
      .attr('stroke', '#fff');

    this.svg.selectAll('text')
      .data(hierarchyData.leaves())
      .join('text')
      .attr('x', d => d.x0 + 4)
      .attr('y', d => d.y0 + 14)
      .text(d => d.data.name)
      .attr('font-size', '10px')
      .attr('fill', '#000');
  }
}
