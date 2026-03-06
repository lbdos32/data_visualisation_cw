export default class StackedBarChart {
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
        const keys = Object.keys(data[0]).filter(k => k !== "k");

        const stack = d3.stack()
            .keys(keys);

        const stackedData = stack(data);
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.k))
            .range([0, chartWidth])
            .padding(0.1);
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d =>
                keys.reduce((sum, key) => sum + d[key], 0)
            )])
            .nice()
            .range([chartHeight, 0]);
        const color = d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeCategory10);
        // stack group s
        const groups = this.chartGroup
            .selectAll("g.layer")
            .data(stackedData)
            .join("g")
            .attr("class", "layer")
            .attr("fill", d => color(d.key));
        //creating the actual bars
        groups.selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => xScale(d.data.k))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .attr("width", xScale.bandwidth());
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
        // chart titel
        this.svg.selectAll(".chart-title").remove();
        this.svg.append("text")
            .attr("class","chart-title")
            .attr("x", this.width / 2)
            .attr("y", this.margin.top / 2)
            .attr("text-anchor","middle")
            .attr("font-size","16px")
            .attr("font-weight","bold")
            .text(this.chartTitle);
    }
}