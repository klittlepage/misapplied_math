---
layout: post
title: "Twelve Days 2013: Domain Specific Search and Sort"
date: 2013-12-15 17:30
comments: true
categories: ['CS']
keywords: "interpolation search radix sort fast integer sort domain specific search sort"
description: "Accelerated search and sort for algorithms for special use cases." 
---

## Day Four: Domain Specific Search and Sorting Algorithms

### TL/DR

In the most general case it's impossible to beat an average time complexity of $O(n\log(n))$ when sorting, or $O(log(n))$ when searching. However, for special (but common) use cases, we can do substantially better. [Radix sort](http://en.wikipedia.org/wiki/Radix_sort) can sort integers in $O(k\cdot n)$ time, where $k$ is the length of the integer in digits. [Interpolation search](http://en.wikipedia.org/wiki/Interpolation_search) will find a key in $O(\log\log(n))$ on average, assuming that the search data is uniformly distributed.

## Radix Sort

CS 101 usually covers the optimality of binary search, and by extension the log linear lower bound on sorting a list. However, this bound only applies to comparison sorts, and there are many ways to sort without direct comparison. Doing so isn't "cheating" from an information theoretic standpoint, just as the fact that the *average* $O(1)$ look-up time for a hash map isn't at odds with the $O(\log(n))$ lower bound on search. Hash maps have worst case $O(n)$ performance, so trading quick average look-ups for the $O(\log(n))$ bound provided by binary search doesn't change anything. The ability to "do better" given restrictions is a reoccurring theme in CS.

Radix sort works well for values with a limited number of digits -- note the $O(k\cdot n)$  part. The worst case performance for radix is the same as the average case making it pretty deterministic. Also note that we're not restricted to sorting numbers. ASCII maps English characters to integers in ascending order, so radix sort can be applied to text as well. You can probably find a similar mapping for just about any type of input that you would want to sort. It's a great alternative to traditional sort methods for many applications. However, there's always the break even point where $d > \log(n)$, after which traditional sort methods have the advantage.

## Interpolation Search

You really need to understand your data before applying interpolation search since the worst case scenario is $O(n)$ (and much worse than that in reality as you'll end up doing lots of unnecessary branching). However, if you know that your data is reasonably uniform, interpolation search is a great way to go. The intuition is simple. If you have an index that's uniformly distributed between $a$ and $b$ and you're looking for a value $x$, a good place to start is an interpolation: $a + x \frac{x - a}{b - a}$. Interpolation search does this repeatedly, subdividing intervals and interpolating again. We can apply the same principals to an arbitrary distribution; the uniform distribution was chosen as it leads to a simple, canonical implementation with provable bounds. Here's a  derivation of the [time complexity for interpolation search](http://www.cs.technion.ac.il/~itai/publications/Algorithms/p550-perl.pdf).
