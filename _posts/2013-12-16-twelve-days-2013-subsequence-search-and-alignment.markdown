---
layout: post
title: "Twelve Days 2013: Subsequence Search and Alignment"
date: 2013-12-16 18:33
comments: true
categories: ['CS', 'Data Science']
keywords: "dynamic programming Smith–Waterman sequence alignment similarity score BLAST tail recursion egg drop problem"
description: "Applications of dynamic programming to computationally difficult problems, with DNA sequence alignment as a motivator."
---

## Day Five: Smith–Waterman for Subsequence Search and Alignment

### TL/DR

[Dynamic programming](http://en.wikipedia.org/wiki/Dynamic_programming) offers a time/space trade-off that makes certain types of computationally intractable algorithms tractable. For optimization, if you can pose your problem as a [Bellman equation](http://en.wikipedia.org/wiki/Bellman_equation), you're in luck. One of the most famous applications of the Bellman Principle of Optimality, [sequence alignment](http://en.wikipedia.org/wiki/Sequence_alignment), has its roots in bioinformatics. However, the algorithm is equally useful for a host of alignment and similarity scoring tasks. The [Biostrings](http://www.bioconductor.org/packages/2.14/bioc/html/Biostrings.html) package for R implements fast global and local sequence alignment algorithms that can be used for many things outside of biology. 

## Time vs. Space

It's hard to overstate the importance of dynamic programming -- lots of very important problems wouldn't have computationally tractable solutions without it. At its heart dynamic programming relies on state memorization to accelerate a computation. A trivial example is the computation of the Fibonacci sequence using a recursive method versus an iterative one. Doing so recursively will generate a call graph that takes the shape of a binary tree, having a number of leafs exponential in $n$. Each value is defined recursively by the two previous ones so it's easy to visualize why this happens. We can linearize the call graph by allocating a little stack space and explicitly storing the two previous values, after which the iterative computation is very simple. Similarly, we could write the function in [tail recursive form](http://en.wikipedia.org/wiki/Tail_call), after which a tail call optimizing compiler would generate an equivalent loop.

In general, dynamic programming relies on finding a representation of the original problem such that subsequent outputs can be computed iteratively by reusing existing state. It's a classic example of a [space-time complexity trade-off](http://en.wikipedia.org/wiki/Space%E2%80%93time_tradeoff). The Bellman principle of optimality gives the conditions under which a solution found via recursive solutions to sub-problems constitutes a global optimum.

## A Motivating Example

Sequence alignment is an important task in bioinformatics and has a wide range of uses. From an evolutionary standpoint, identifying how well conserved a particular subsequence is across generations can help identify shared lineage. The study of [single nucleotide polymorphisms (SNPs)](http://en.wikipedia.org/wiki/Single_nucleotide_polymorphism) between individuals in a population helps us understand differences in susceptibility to disease. In proteomics, studying the extent to which a subsequence is conserved can identify regions of significance (we understand very little about [protein folding](http://en.wikipedia.org/wiki/Protein_folding), so looking for regions that nature tells us are important is a good first pass). All of these tasks are underpinned by a need for local or global sequence alignment.

Alignments are computed relative to some scoring function that penalizes mismatches and gaps while rewarding proper alignment. Imagine two sequences: "ABBBD" and "ABCD". We want to transform the two strings via insertions and deletions until they line up: "ABBBD" -> "A - - CD" or "ABBBD" -> "A-BBD" and "ABCD" -> "ABB-D" are both possibilities. How you choose to transform your sequence depends on your scoring function.

In global alignment, two sequences of similar length are aligned such that, after applying the optimal transformations, the two strings match in entirity. In local alignment, we're only interested in *regions* of high similarity. The two tasks are fundamentally at odds with each other, but both admit solutions via dynamic programming. We'll focus on local alignment.

## The Smith-Waterman Algorithm

For biological applications we're usually speaking in terms of the five [nucleobases](http://en.wikipedia.org/wiki/Nucleobase) when it comes to DNA/RNA (the famous T, C, A, and G that make up DNA, and the U that replaces T in RNA), or the 22 protein-building amino acids. This restriction is completely arbitrary and we can use this technique to match any sequence that we want (geometric, spacial, or otherwise) provided that we can come up with a scoring metric to compare two individual points in the sequence.

The wikipedia article [here](http://en.wikipedia.org/wiki/Smith%E2%80%93Waterman_algorithm) does a good job describing the actual algorithm. For any implementation we only need to decide on a weighting scheme that defines $w(a, -),\ w(-, b)\text{ and } w(a, b)$. This gives us a lot of flexibility. The wikipedia example used a simple scheme in which:

$$

\begin{align}

w(a, b | a = b) &= w(\text{match}) = 2 \\
w(a, b | a \neq b) &= w(\text{mismatch}) = -1 \\
w(a, -) &= -1 \\ 
w(-, b) &= -1 \\
\end{align}

$$

but we're free to experiment and do as we please. Weights need not be symmetric and we could easily penalize mutation more or less than a gap.

The example goes on to construct the $H$ matrix, which is defined recursively using the three values to its immediate left, top, and top left corner (the edges $(1, j)$ and $(i, 1)$ are defined as zero). We can fill the matrix in starting at $(2, 2)$ and working our way our way from top left to bottom right. By construction it's easy to see that if we didn't "memorize" these values we would have to calculate each matrix value recursively, leading to a call graph shaped like a ternary tree.

Assuming that we want the actual alignment and not just an alignment score, we find the sequence of insertions/deletions/mutations necessary to generate the optimal score via a backtracking algorithm. We start at the matrix max and move backward to the largest adjacent value (the cell who's value was used when computing the current cell's value). We repeat this procedure for as long as there are adjacent cells with non-zero values. Wikipedia doesn't address this, but assuming that the gap and mismatch penalties are symmetric, to avoid duplicate alignments we should chose a consistent direction to move in when ties occur. As an example, two sequences TAG and TCG will generate structurally identical alignments TAG -> T-G and TCG -> T-G with the same alignment score.

This procedure differs from global alignment in that we don't always start at the bottom right corner -- it's possible to start anywhere in the matrix. Also note that we can find the $k$ best alignments by backtracking from the $k$ highest scoring locations -- starting from the max only gives us the "optimal" alignment.

## Implementation

As noted before [Biostrings](http://www.bioconductor.org/packages/2.14/bioc/html/Biostrings.html) in R has lots of sequence alginment goodies. A quick search will reveal tools for just about any language that you want (including the fast, commerical grade ones implemented in C/C++ to leverage SSE and graphics cards).
