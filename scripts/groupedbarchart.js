export default class GroupedBarChart {
    constructor(container, width, height, chartTitle) {
        this.container = container;
        this.width = width;
        this.height = height;
        this.chartTitle = chartTitle;
        this.margin = { top: 60, right: 20, bottom: 150, left: 60 };
        this.svg = d3.select(container)
            .append("svg")
            .attr("width", width)
            .attr("height", height + this.margin.top + this.margin.bottom);
        this.chartGroup = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    }
    render(data) {
        const chartWidth = this.width - this.margin.left - this.margin.right;
        const chartHeight = this.height;
        this.chartGroup.selectAll("*").remove();
        // dataset keys - direct/reallocated
        const keys = Object.keys(data[0]).filter(k => k !== "k");
        // x scale
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.k))
            .range([0, chartWidth])
            .padding(0.2);
        // x for inside the group
        const xSubScale = d3.scaleBand()
            .domain(keys)
            .range([0, xScale.bandwidth()])
            .padding(0.05);
        // y scale
        const yScale = d3.scaleLinear()
            .domain([
                0,
                d3.max(data, d =>
                    d3.max(keys, key => d[key])
                )
            ])
            .nice()
            .range([chartHeight, 0]);
        // colour
        const color = d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeCategory10);
        // create group for each year
        const group = this.chartGroup
            .selectAll(".group")
            .data(data)
            .join("g")
            .attr("class", "group")
            .attr("transform", d => `translate(${xScale(d.k)},0)`);
        // actual bars
        group.selectAll("rect")
            .data(d => keys.map(key => ({
                key: key,
                value: d[key]
            })))
            .join("rect")
            .attr("x", d => xSubScale(d.key))
            .attr("y", d => yScale(d.value))
            .attr("width", xSubScale.bandwidth())
            .attr("height", d => chartHeight - yScale(d.value))
            .attr("fill", d => color(d.key));
        // x axis
        this.chartGroup.append("g")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("text-anchor","end")
            .attr("transform","rotate(-45)")
            .attr("font-size","10px");
        // y axis
        this.chartGroup.append("g")
            .call(d3.axisLeft(yScale));
    // removes previous title
        this.svg.selectAll(".chart-title").remove();
            // title
        this.svg.append("text")
            .attr("class","chart-title")
            .attr("x", this.width / 2)
            .attr("y", this.margin.top / 2)
            .attr("text-anchor","middle")
            .attr("font-size","16px")
            .attr("font-weight","bold")
            .text(this.chartTitle);
        // removes previous legend
        this.svg.selectAll(".legend").remove();
        // legend
        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.width - 300}, ${this.margin.top})`); //adjust position of legend on graph
        const legendItem = legend.selectAll(".legend-item")
            .data(keys)
            .join("g")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);
        legendItem.append("rect")
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", d => color(d));
        legendItem.append("text")
            .attr("x", 18)
            .attr("y", 10)
            .text(d => d);
    }
}