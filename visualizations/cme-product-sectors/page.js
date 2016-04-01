var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .classed("visible-md, visible-lg", true);

function drawProductVis() {
  var w = $('#cme-products').width(),
  h = 600,
  x = d3.scale.linear().range([0, w]),
  y = d3.scale.linear().range([0, h]),
  color = d3.scale.category20c(),
  root,
  node;

  var treemap = d3.layout.treemap()
      .round(false)
      .size([w, h])
      .sticky(true)
      .value(function(d) { return d.volume; });

  $("#cme-products").empty()
  var svg = d3.select("#cme-products").append("div")
      .attr("class", "chart")
    .append("svg:svg")
      .attr("height", h) 
      .attr("width", "100%")
    .append("svg:g")
      .attr("transform", "translate(.5,.5)");

  d3.json("/visualizations/cme-product-sectors/cme-product-sectors.json", function(data) {
    outerData = data;
    node = root = data;

    var nodes = treemap.nodes(root)
        .filter(function(d) { return !d.children; });

    var cell = svg.selectAll("g")
        .data(nodes)
      .enter().append("svg:g")
        .attr("class", "cell")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .on("click", function(d) { return zoom(node == d.parent ? root : d.parent); })           
        .on("mouseover", function(d){ return tooltip.style("visibility", "visible") })
        .on("mousemove", function(d){ return tooltip
          .style("top", (d3.event.pageY - 10) + "px")
          .style("left", (d3.event.pageX + 10) + "px")
          .html("<div class=\"chart-tooltip\">Full name: " + d.full_name + 
            "<br>Sector: " + d.parent.parent.name + 
            "<br>Subsector: " + d.parent.name + 
            "<br>Volume: " + numberWithCommas(d.volume) + 
            "<br>Open Interest: " + numberWithCommas(d.open_interest) + "</div>"); }
        )
        .on("mouseout", function(){ return tooltip.style("visibility", "hidden"); });

    cell.append("svg:rect")
        .attr("width", function(d) { return d.dx - 1; })
        .attr("height", function(d) { return d.dy - 1; })
        .style("fill", function(d) { return color(d.parent.name); });

    cell.append("svg:text")
        .attr("x", function(d) { return d.dx / 2; })
        .attr("y", function(d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(function(d) { return d.name; })
        .style("opacity", function(d) { 
          d.w = this.getComputedTextLength(); 
          return d.dx > d.w ? (d.dy > 10 ? 1 : 0) : 0; 
        });

    d3.select(window).on("click", function() { zoom(root); });

    var dropdown_options = d3.selectAll(".dropdown-menu a")[0]
    for (var i = 0; i < dropdown_options.length; i++) {
      dropdown_options[i].addEventListener("click", function() {
        switch(this.target) {
          case "volume":
            f = volume;
            break;
          case "open-interest":
            f = openInterest;
            break;
          default:
            f = count;
            break;
        }
        treemap.value(f).nodes(root);
        zoom(node);
      });
    }

  });

  function zoom(d) {
    var kx = w / d.dx, ky = h / d.dy;
    x.domain([d.x, d.x + d.dx]);
    y.domain([d.y, d.y + d.dy]);

    var t = svg.selectAll("g.cell").transition()
        .duration(d3.event.altKey ? 7500 : 750)
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

    t.select("rect")
        .attr("width", function(d) { return kx * d.dx - 1; })
        .attr("height", function(d) { return ky * d.dy - 1; })

    t.select("text")
        .attr("x", function(d) { return kx * d.dx / 2; })
        .attr("y", function(d) { return ky * d.dy / 2; })
        .style("opacity", function(d) { return kx * d.dx > d.w ? (ky * d.dy > 10 ? 1 : 0) : 0; });

    node = d;
    d3.event.stopPropagation();
  }

}

function volume(d) {
  return d.volume;
}

function openInterest(d) {
  return d.open_interest;
}

function count(d) {
  return 1;
}

function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

drawProductVis();
window.onresize = drawProductVis;
