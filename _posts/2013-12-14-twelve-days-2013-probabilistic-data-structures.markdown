---
layout: post
title: "Twelve Days 2013: Probabilistic Data Structures"
date: 2013-12-14 19:31
comments: true
categories: ['CS', 'Data Science']
keywords: "probabilistic data structures skip list bloom filter locality-sensitive hashing random matrix approximation"
description: "Applications of probabilistic data structures for queries, estimation, and efficient data processing"
---

## Day Three: Probabilistic Data Structures and Algorithms

### TL/DR

Probabilistic data structures can deal with data sets too large to handle by conventional means, or offer massive speedups at the cost of some uncertainty. [Skip lists](http://en.wikipedia.org/wiki/Skip_list) make for nice lock-free priority queues (useful in schedulers and online sorting algorithms), [Bloom filters](http://en.wikipedia.org/wiki/Bloom_filter) are well suited for set membership queries over data sets of arbitrary size, and [locality-sensitive hashing](http://en.wikipedia.org/wiki/Locality_sensitive_hashing) provides quick approximate nearest neighbor queries and dimensionality reduction. [Probabilistic matrix algorithms](http://arxiv.org/pdf/0909.4061.pdf) can speed up matrix math by several orders of magnitude with tight error bounds.


## Case One: Probabilistic Matrix Math

Matrix decomposition and factorization techniques such as [SVD](http://en.wikipedia.org/wiki/Singular_value_decomposition) and QR play an important role in many problems, from optimization and online control to machine learning. The new kid on the block, [rank-revealing QR factorization](http://en.wikipedia.org/wiki/RRQR_factorization) provides a very efficient means of estimating matrix rank. All three benefit from quite recent work on [probabilistic matrix algorithms](http://arxiv.org/pdf/0909.4061.pdf). It's possible to significantly improve both parallelism and computational complexity while giving up very little in terms of accuracy. The paper above presents a method for reducing the complexity of finding the top $k$ components of an SVD from $O(mnk)$ to $O(mnlog(k))$ while admitting a natural parallel implementation. Two side notes:

1. [Joel Tropp](http://users.cms.caltech.edu/~jtropp/), one of the authors of the paper above and a former prof of mine, is a great guy to follow for this. He's a very good writer and his areas of expertise are quite interesting/relevant to data science: [sparse approximation](http://en.wikipedia.org/wiki/Sparse_approximation), [compressed sensing](http://en.wikipedia.org/wiki/Compressed_sensing), and randomized algorithms.
2. [Spectral theory and random matrices](http://en.wikipedia.org/wiki/Random_matrix) are pretty fascinating fields (especially with regard to questions such as detecting spurious correlation and reasoning about the distribution of eigenvalues).


## Case Two: Skip lists

In many cases skip lists are a nice drop in replacement for balanced trees when concurrent access is needed. Their basic operations (search, insert, and delete) all have all of the same big $O$ performance characteristics but their structure makes concurrent programming much simpler. They avoid the rebalancing issues that come up in alternatives such as red-black trees (rebalancing is also what makes efficient concurrent implementations difficult), and they're pretty cache friendly. As a bonus, range queries, k-th largest, and proximity queries are all $O(\log(n))$.

## Case Three: Bloom Filters

Bloom filters provide space efficient set membership queries. They work by using $k$ hash functions to determine $k$ indices in a boolean array. When an item is inserted, each of those $k$ positions is set to true. To query an item, end each of the $k$ positions is checked. If all of the positions are set to true, the item is *possibly* in the set, but if any one of them is false, it's definitely not. This works well provided that the array doesn't become saturated with true values, and that the $k$ hash functions are independent/do a good job distributing the key space over the hash space uniformly. They're also simple enough to prove bounds on, which is useful for parameter selection.

## Case Four: Locality-Sensitive Hashing

Nearest neighbor queries (where distance can be computed under an arbitrary metric function -- not necessarily a spacial one) are both very useful, and very hard to do efficiently for high dimensional spaces. In practice, for 30+ dimensions, the search time for exact algorithms such as [K-D trees](http://en.wikipedia.org/wiki/K-d_tree) is worse than linear search when you take into account cache effects/branch misprediction that comes about from a real world implementation.

Locality-sensitive hashing does the opposite of what most hash functions try to do in that it aims to maximize the probability of a collision for keys in close proximity. It's an example of [dimensionality reduction](http://en.wikipedia.org/wiki/Dimensionality_reduction) and as such gets used and abused for unsupervised machine learning. For queries, I've seen it perform poorly on some geometric/spacial queries and extremely well on others, so your mileage may vary.
