export default class Barchart {
    constructor(container, width, height, chartTitle) {
        this.container = container;
        this.width = width;
        this.height = height;
        this.chartTitle = chartTitle;

        this.margin = { top: 60, right: 20, bottom: 150, left: 60 };

        this.svg = d3.select(container)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        // Group for the chart content (shifted by top/left margins)
        this.chartGroup = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
    }

    render(data) {
        this.data = data;

        const chartWidth = this.width - this.margin.left - this.margin.right;
        const chartHeight = this.height;

        // X scale (categorical)
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.k))
            .range([0, chartWidth])
            .padding(0.1);

        // Y scale (linear)
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.v)])
            .range([chartHeight, 0]);  // SVG y=0 at top

        // Clear previous content
        this.chartGroup.selectAll("*").remove();

        // Bars
        this.chartGroup.selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", d => xScale(d.k))
            .attr("y", d => yScale(d.v))
            .attr("width", xScale.bandwidth())
            .attr("height", d => chartHeight - yScale(d.v))
            .attr("fill", "steelblue");

        // X-axis
        const xAxis = d3.axisBottom(xScale);
        this.chartGroup.append("g")
            .attr("transform", `translate(0, ${chartHeight})`)
            .call(xAxis)
            .selectAll("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-45)")
            .attr("font-size", "10px");

        // Y-axis
        const yAxis = d3.axisLeft(yScale);
        this.chartGroup.append("g")
            .call(yAxis);

        // Chart title
        this.svg.append("text")
            .attr("x", this.width / 2)
            .attr("y", this.margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(this.chartTitle);
    }
}