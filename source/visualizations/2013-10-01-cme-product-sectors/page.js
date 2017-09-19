/* eslint-env browser */

import $ from 'jquery';
import * as d3 from 'd3';

(() => {
  function cmeProductVis(
    targetSelector, dropdownSelector, baseTitleText,
    titleSelector
  ) {
    const target = $(targetSelector);
    const titleElement = $(titleSelector)[0];
    const w = target.width();
    const h = 600;
    const x = d3.scaleLinear().range([0, w]);
    const y = d3.scaleLinear().range([0, h]);
    const colorFunc = d3.scaleOrdinal(d3.schemeCategory20.map(color =>
      d3.interpolateRgb(color, '#fff')(0.2)));
    const format = d3.format(',d');

    target.empty();

    const treemap = d3.treemap()
      .tile(d3.treemapResquarify)
      .round(false)
      .size([w, h])
      .padding(1);

    const svg = d3.select(targetSelector)
      .append('svg')
      .attr('height', h)
      .attr('width', '100%');

    const tooltip = d3.select('body')
      .append('div')
      .style('position', 'absolute')
      .style('z-index', '10')
      .style('visibility', 'hidden')
      .classed('visible-md, visible-lg', true);

    function renderTooltip(d) {
      return tooltip
        .style('top', `${d3.event.pageY - 10}px`)
        .style('left', `${d3.event.pageX + 10}px`)
        .html(`<div class="cme-vis-chart-tooltip">Full name: ${
          d.data.full_name
        }<br>Sector: ${d.parent.parent.data.name
        }<br>Subsector: ${d.parent.data.name
        }<br>Volume: ${format(d.data.volume)
        }<br>Open Interest: ${format(d.data.open_interest)}</div>`);
    }

    function volume(d) {
      return d.volume;
    }

    function openInterest(d) {
      return d.open_interest;
    }

    function opacityFunction(d) {
      const dx = d.x1 - d.x0;
      const dy = d.y1 - d.y0;
      return dx > 15 && dy > 10 ? 1 : 0;
    }

    function zoomedOpacityFunction(d, kx, ky) {
      const dx = d.x1 - d.x0;
      const dy = d.y1 - d.y0;
      if ((kx * dx) > dx) {
        return (ky * dy > 10 ? 1 : 0);
      }
      return 0;
    }

    function zoom(d, fillColor, opacity) {
      const dx = (d.x1 - d.x0);
      const dy = (d.y1 - d.y0);
      const kx = w / dx;
      const ky = h / dy;
      x.domain([d.x0, d.x1]);
      y.domain([d.y0, d.y1]);

      const cell = svg.selectAll('g.cell');
      const t = cell.transition()
        .duration(750)
        .attr('transform', z => `translate(${x(z.x0)},${y(z.y0)})`);
      t.select('rect')
        .attr('width', () => (kx * dx) - 1)
        .attr('height', () => (ky * dy) - 1)
        .attr('fill', fillColor);
      t.select('text')
        .attr('x', z => kx * ((z.x1 - z.x0) / 2))
        .attr('y', z => ky * ((z.y1 - z.y0) / 2))
        .style('opacity', z => opacity(z, kx, ky));
      d3.event.stopPropagation();
    }

    d3.json(
      '/visualizations/cme-product-sectors/cme-product-sectors.json',
      (data) => {
        const root = d3.hierarchy(data)
          .eachBefore((d) => {
            /* eslint-disable no-param-reassign */
            d.data.id =
            (d.parent ? `${d.parent.data.id}.` : '') + d.data.name;
            /* eslint-enable no-param-reassign */
          })
          .sum(volume)
          .sort((a, b) => b.height - a.height ||
                                        b.value - a.value);
        let currentNode = root;
        treemap(root);

        const cell = svg.selectAll('g')
          .data(root.leaves())
          .enter().append('g')
          .attr('class', 'cell')
          .attr('transform', d => `translate(${d.x0},${d.y0})`)
          .on('mouseover', () => tooltip.style('visibility', 'visible'))
          .on('mouseout', () => tooltip.style('visibility', 'hidden'))
          .on('mousemove', renderTooltip)
          .on('click', (d) => {
            let targetNode;
            let fillColor;
            let opacity;
            if (currentNode === d.parent) {
              targetNode = root;
              fillColor = z => colorFunc(z.parent.data.id);
              opacity = opacityFunction;
            } else {
              targetNode = d.parent;
              fillColor = z => colorFunc(z.data.id);
              opacity = zoomedOpacityFunction;
            }
            currentNode = targetNode;
            zoom(targetNode, fillColor, opacity);
          });

        cell.append('rect')
          .attr('id', d => d.data.id)
          .attr('width', d => d.x1 - d.x0)
          .attr('height', d => d.y1 - d.y0)
          .attr('fill', d => colorFunc(d.parent.data.id));

        cell.append('text')
          .attr('clip-path', d => `url(#clip-${d.data.id})`)
          .text(d => d.data.name)
          .attr('dy', '.35em')
          .attr('text-anchor', 'middle')
          .attr('x', d => (d.x1 - d.x0) / 2.0)
          .attr('y', d => (d.y1 - d.y0) / 2.0)
          .style('opacity', d => opacityFunction(d));

        $(dropdownSelector).each((idx, elem) => {
          elem.addEventListener('click', () => {
            let aggFunction;
            switch (elem.target) {
              case 'volume':
                aggFunction = volume;
                titleElement.innerText = `${baseTitleText} Volume`;
                break;
              case 'open-interest':
                aggFunction = openInterest;
                titleElement.innerText = `${baseTitleText} Open Interest`;
                break;
              default:
                aggFunction = volume;
                break;
            }
            treemap(root.sum(aggFunction));
            const t = cell.transition()
              .duration(750)
              .attr('transform', d => `translate(${d.x0},${d.y0})`);
            t.select('rect')
              .attr('width', d => d.x1 - d.x0)
              .attr('height', d => d.y1 - d.y0);
            t.select('text')
              .attr('x', d => (d.x1 - d.x0) / 2.0)
              .attr('y', d => (d.y1 - d.y0) / 2.0)
              .style('opacity', d => opacityFunction(d));
          });
        });

        titleElement.innerText = `${baseTitleText} Volume`;
      }
    );
  }

  const targetSelector = '.cme-product-sectors-visualization';
  const dropdownSelector = '#cme-product-sectors-visualization-dropdown a';
  const titleSelector = '#cme-product-sectors-title';
  if ($(targetSelector)) {
    const baseTitleText = $(titleSelector)[0].innerText;
    cmeProductVis(
      targetSelector, dropdownSelector, baseTitleText,
      titleSelector
    );
    $(window).resize(() => {
      cmeProductVis(
        targetSelector,
        dropdownSelector,
        baseTitleText,
        titleSelector
      );
    });
  }
})();
