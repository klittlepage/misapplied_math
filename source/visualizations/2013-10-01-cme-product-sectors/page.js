+function ($) {
  'use strict';

  function cmeProductVis(targetSelector, dropdownSelector, baseTitleText,
                         titleSelector) {
    var target = $(targetSelector);
    var titleElement = $(titleSelector)[0];
    var w = target.width();
    var h = 600;
    var x = d3.scaleLinear().range([0, w]);
    var y = d3.scaleLinear().range([0, h]);
    var fader = function(color) { 
      return d3.interpolateRgb(color, "#fff")(0.2); }
    var color = d3.scaleOrdinal(d3.schemeCategory20.map(fader));
    var format = d3.format(",d");

    target.empty();

    var treemap = d3.treemap()
        .tile(d3.treemapResquarify)
        .round(false)
        .size([w, h])
        .padding(1);

    var svg = d3.select(targetSelector)
      .append("svg")
        .attr("height", h) 
        .attr("width", "100%");

    var tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .classed("visible-md, visible-lg", true);

    function renderTooltip(d) {
      return tooltip
        .style("top", (d3.event.pageY - 10) + "px")
        .style("left", (d3.event.pageX + 10) + "px")
        .html("<div class=\"cme-vis-chart-tooltip\">Full name: " + 
              d.data.full_name + 
              "<br>Sector: " + d.parent.parent.data.name + 
              "<br>Subsector: " + d.parent.data.name + 
              "<br>Volume: " + format(d.data.volume) + 
              "<br>Open Interest: " + format(d.data.open_interest) + "</div>");
    }

    function volume(d) {
      return d.volume;
    }

    function openInterest(d) {
      return d.open_interest;
    }

    function opacityFunction(d) {
      var dx = d.x1 - d.x0;
      var dy = d.y1 - d.y0;
      return dx > 15 && dy > 10 ? 1 : 0;
    }

    function zoomedOpacityFunction(d, kx, ky) {
      var dx = d.x1 - d.x0;
      var dy = d.y1 - d.y0;
      return kx * dx > dx ? (ky * dy > 10 ? 1 : 0) : 0;
    }

    function zoom(d, fillColor, opacityFunction) {
      var dx = (d.x1 - d.x0);
      var dy = (d.y1 - d.y0);
      var kx = w / dx;
      var ky = h / dy;
      x.domain([d.x0, d.x1]);
      y.domain([d.y0, d.y1]);

      var cell = svg.selectAll("g.cell");
      var t = cell.transition()
        .duration(750)
        .attr("transform", function(d) { 
          return "translate(" + x(d.x0) + "," + y(d.y0) + ")"; });
      t.select("rect")
        .attr("width", function(d) { return kx * dx - 1; })
        .attr("height", function(d) { return ky * dy - 1; })
        .attr("fill", fillColor);
      t.select("text")
        .attr("x", function(d) { return kx * (d.x1 - d.x0) / 2; })
        .attr("y", function(d) { return ky * (d.y1 - d.y0) / 2; })
        .style("opacity", function(d) { return opacityFunction(d, kx, ky) });
      d3.event.stopPropagation();
    }

    d3.json("/visualizations/cme-product-sectors/cme-product-sectors.json",
      function(data) {
        var root = d3.hierarchy(data)
          .eachBefore(function(d) { d.data.id = 
            (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
          .sum(volume)
          .sort(function(a, b) { return b.height - a.height || 
                                        b.value - a.value; });
        var currentNode = root;
        treemap(root);

        var cell = svg.selectAll("g")
          .data(root.leaves())
          .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function(d) { 
              return "translate(" + d.x0 + "," + d.y0 + ")"; })
            .on("mouseover", function(d) { 
              return tooltip.style("visibility", "visible") })
            .on("mouseout", function() { 
              return tooltip.style("visibility", "hidden"); })
            .on("mousemove", renderTooltip)
            .on("click", function(d) { 
              var targetNode;
              var fillColor;
              var opacity;
              if(currentNode == d.parent) {
                targetNode = root;
                fillColor = function(d) { return color(d.parent.data.id); }
                opacity = opacityFunction;
              } else {
                targetNode = d.parent;
                fillColor = function(d) { return color(d.data.id); }
                opacity = zoomedOpacityFunction;
              }
              currentNode = targetNode;
              zoom(targetNode, fillColor, opacity);
            });

        cell.append("rect")
            .attr("id", function(d) { return d.data.id; })
            .attr("width", function(d) { return d.x1 - d.x0; })
            .attr("height", function(d) { return d.y1 - d.y0; })
            .attr("fill", function(d) { return color(d.parent.data.id); });

        cell.append("text")
          .attr("clip-path", function(d) { 
            return "url(#clip-" + d.data.id + ")"; })
          .text(function(d) { return d.data.name; })
          .attr("dy", ".35em")
          .attr("text-anchor", "middle")
          .attr("x", function(d) { return (d.x1 - d.x0) / 2.; })
          .attr("y", function(d) { return (d.y1 - d.y0) / 2.; })
          .style("opacity", function(d) { return opacityFunction(d) });

        $(dropdownSelector).each(
          function(idx, elem) {
            elem.addEventListener("click", function() {
              var aggFunction;
              switch(elem.target) {
                case "volume":
                  aggFunction = volume;
                  titleElement.innerText = baseTitleText + ' Volume';
                  break;
                case "open-interest":
                  aggFunction = openInterest;
                  titleElement.innerText = baseTitleText + ' Open Interest';
                  break;
                default:
                  aggFunction = volume;
                  break;
              }
              treemap(root.sum(aggFunction));
              var t = cell.transition()
                  .duration(750)
                  .attr("transform", function(d) { 
                    return "translate(" + d.x0 + "," + d.y0 + ")"; })
              t.select("rect")
                .attr("width", function(d) { return d.x1 - d.x0; })
                .attr("height", function(d) { return d.y1 - d.y0; });
              t.select("text")
                .attr("x", function(d) { return (d.x1 - d.x0) / 2.; })
                .attr("y", function(d) { return (d.y1 - d.y0) / 2.; })
                .style("opacity", function(d) { return opacityFunction(d) });
            });
          }
        );

        titleElement.innerText = baseTitleText + ' Volume';
      }
    );
  }

  var targetSelector = '#cme-product-sectors-visualization';
  var dropdownSelector = '#cme-product-sectors-visualization-dropdown a';
  var titleSelector = '#cme-product-sectors-title';
  if($(targetSelector)) {
    var baseTitleText = $(titleSelector)[0].innerText;
    cmeProductVis(targetSelector, dropdownSelector, baseTitleText,
                  titleSelector);
    $(window).resize(function() { cmeProductVis(targetSelector,
                                                dropdownSelector,
                                                baseTitleText,
                                                titleSelector) });
  }
}(jQuery);
