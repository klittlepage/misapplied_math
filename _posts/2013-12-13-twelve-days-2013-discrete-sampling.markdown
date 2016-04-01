---
layout: post
title: "Twelve Days 2013: Discrete Sampling"
date: 2013-12-13 15:29
comments: true
categories: ['CS', 'Statistics']
keywords: "table method alias method random sampling discrete distribution"
description: "Efficient methods for sampling from a discrete distribution and generating random variables."
---

## Day Two: Discrete Random Variable Generation and The Table Method

### TL/DR

There's an efficient algorithm for generating random numbers over a discrete distribution. The details are found in this [paper](http://www.jstatsoft.org/v11/i03/paper), along with sample code.

## Explanation

Generating random variables over a discrete distribution is a common operation. Many resampling methods in computational statistics rely on it, as do many types of simulations. Operating systems such as linux use various sources of entropy to generate uniform random numbers over a closed interval. There are well known techniques such as the [ziggurat algorithm](http://en.wikipedia.org/wiki/Ziggurat_algorithm) which can generate random numbers under an arbitrary distribution, and it's reasonably efficient for most continuous distributions. However, it's hard to implement efficiently for discrete distributions as it uses [rejection sampling](http://en.wikipedia.org/wiki/Rejection_sampling) which wastes random numbers (which aren't cheap to generate in the first place), and it has some pathologically bad cases.

## A First Pass

If our uniform distribution is small and known ahead of time we could hard code conditionals and operate on a single random uniform value. That's hard to beat performance wise. However, if we need to do this for a distribution with lots of discrete categories, or one that's not known ahead of time, the if-then-else approach won't work. One alternative is as follows:

{% codeblock title:DiscreteRandom.java lang:java %}

private static int discreteRandom(double[] weights) {
    double total = 0;
    for(int i = 0; i < weights.length; ++i) {
        total += weights[i];
    }
    final Random gen = new Random();
    double rand = total * gen.nextDouble();
    for(int i = 0; i < weights.length; ++i) {
        if(rand < weights[i]) {
            return i;
        }
        rand -= weights[i];
    }
    return weights.length - 1;
}

{% endcodeblock %}

As you can see this is linear in the number of weights, and pathologically bad for certain distributions. We could do slightly better by sorting the weights ahead of time. Taking it one step further we can precompute a cumulative sum of the weights and do a binary search. That might or might not pay dividends depending on the length of the weight array among other factors (binary search has very bad cache performance).

## A Better Approach

If we can pay the setup cost ahead of time and reuse our random generator, a better approach is to use a lookup table. In that case we would generate a large table of entries using a technique like the one above, and sample from the table using a random integer generator. However, we would need a table big enough to avoid resampling errors, and like binary search, this comes at the cost of poor cache performance (not to mention the memory overhead).

## The Compromise

The paper linked in the TL/DR section, [Fast Generation of Discrete Random Variables](http://www.jstatsoft.org/v11/i03/paper) compares several table based hybrid methods. They're the best you'll do for general use cases. There's another technique called the [alias method](http://en.wikipedia.org/wiki/Alias_method) which can offer better cache locality at the cost of having some edge cases where it performs very poorly. Once again, if your distribution is small enough, hard coded conditionals are the way to go. You can even use source code generation to create them automatically, or [run time code generation]({% post_url 2013-09-07-run-time-code-generation-for-zero-overhead-java-reflection %}) to do so on the fly.
