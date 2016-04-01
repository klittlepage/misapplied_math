---
layout: post
title: "Hacking an NFL Survivor Pool for Fun and Profit"
date: 2013-08-12 17:57
comments: true
categories: [Statistics, Optimization, 'Sports Betting', R]
keywords: "NFL survival pool, data science, statistics, optimization, sports betting"
description: Quantitative sports betting via optimization
---

## The Game

A few years ago my office started an NFL survivor pool as a fun way to kick off the 2011 season. The premise is simple: every week you pick a team to win their game. You can't pick a team on a bye week, and once you pick a team you  can't pick the same team again for the rest of the season. If the team you pick loses their match then you're out, and the last man standing takes all. If multiple players make it to the post season then the game restarts for the survivors, and if multiple players survive the Super Bowl, the prize pool is chopped.

The strategies used varied from the highly quant to the decidedly not quant -- "I hate the Patriots" -- approach. There's a lot of richness in this problem, and it's easy to go down the rabbit hole with opponent modeling and views on what you're trying to optimize. However, taking the simplified approach that you're only trying to maximize your probability of surviving to the end, or to a specific game, there's a slick way to optimize your lineup. Since we're getting ready to kick off the 2013 season...it's time to get those bets in.

## The Problem

Let $C$ be an $n \times m$ matrix in which each row represents a team, each column represents a game week, and the probability of team $i$ winning their game on week $j$ is $x_{ij}$. The probability of surviving until game $l$ is given by:

$$
\Phi = \prod_{k = 1}^l{C_{f(k), k}}
$$

Where $f(k)$ is a mapping from game weeks to teams. We want to maximize $\Phi$ over the set of all possible mappings $f$ that satisfy our constraints. To simplify the problem we require that $n = m$ (we can always do this by adding "dummy" game weeks or teams to the cost matrix) and by taking the log of both sides. Now we're working with sums instead of products and we can view $f$ as a bijection $f: T \mapsto G$ where $T$ is the set of all teams and $G$ is the set of all games. The cost function becomes $C: T \times G \mapsto \mathbb{R}$ and our optimization problem becomes:

$$
\underset{f}{\operatorname{argmax}} \Phi(C, f) = \sum_{i} C_{i,f(i)}
$$

where $f \in S_n$, the set of all permutations on $n$ objects. This is the classic [assignment problem](http://en.wikipedia.org/wiki/Assignment_problem) in which we wish to minimize the cost of assigning agents to tasks. It's easy to express this as a linear programming problem, and doing so yields:

$$
x_{ij} = \begin{cases}
            1 & \text{if team } i \text{ is assigned to week } j \\ 
            0 & \text{otherwise}
         \end{cases}

\\

\underset{\mathbb{x}}{\operatorname{argmin}} \sum_i^n{\sum_j^n{c_{ij}x_{ij}}}
$$

Subject to:

$$
\begin{align}
\sum_{i = 1}^n{x_{ij}} = 1 & (j = 1 \ldots n) \\
\sum_{j = 1}^n{x_{ij}} = 1 & (i = 1 \ldots n) \\
x_{ij} \geq 0 & (i = 1 \ldots n, \; j = 1 \ldots n)
\end{align}
$$

Where $c_{ij}$ is the cost of assigning team $i$ to week $j$. This smells like the [Travelling Salesman Problem (TSP)](http://en.wikipedia.org/wiki/Travelling_salesman_problem) which doesn't bode well for us, and since we're considering all $f \in S_n$ we know that there are $n!$ candidate solutions. 

Now comes the cool part. Solutions to TSP require that the salesman travels via a single connected tour through the cities whereas the formulation above allows for disjoint subtours. Enforcing the "single tour constraint" on the linear programming formulation of TSP requires a number of constraints that's exponential in the problem size, ergo the [NP-Hard](http://en.wikipedia.org/wiki/NP-hard) part. We don't have such a constraint, and the problem is solved in $\operatorname{O}(n^3)$ time using the [Hungarian Method](http://en.wikipedia.org/wiki/Hungarian_algorithm).

Once you have your solution your expected survival time is:

$$
\begin{align}
\mathbb{E} &= 0 \cdot (1 - p_1) + 1 \cdot p_1(1 - p_2) + 2 \cdot p_1p_2(1 - p_3) + \ldots + n \cdot p_1p_2 \ldots p_n \\
&= p_1 + p_1p_2 + \ldots + p_1\ldots p_n \\
&= \sum_{i = 1}^n\prod_{k = 1}^ip_i
\end{align}
$$

## The Solution

I based my win probability matrix on Vegas moneylines. This works under the premise that win probabilities can be implied directly from the Vegas book - not a fantastic assumption, especially for the NFL, which will be the topic of another post. I added a few parameter bumps based on my own views to keep things interesting. The code, using R and the [clue library](http://cran.r-project.org/web/packages/clue/index.html), was dead simple:

{% codeblock title:assign_teams.R lang:r %}

require(clue)

assignment <- as.vector(solve_LSAP(t(win.prob), maximum = TRUE))
assignment.prob <- diag(win.prob[assignment, ])
survival.prob <- prod(assignment.prob)
exp.survival.time <- sum(cumprod(assignment.prob))
survivor.picks <- row.names(win.prob)[assignment]

summary <- "Summary:\n\n"
summary <- paste(summary, sprintf("Terminal survival probability: %.2f\n", 
		survival.prob), sep = "")
summary <- paste(summary, sprintf("Expected survival time: %.2f games\n\n", 
		exp.survival.time), sep = "")
summary <- paste(summary, "Survival pool lineup:\n\n", sep = "")
for(i in 1:length(survivor.picks))
{
    summary <- paste(summary, sprintf("Game %d: %s (%.2f)\n", i, 
			survivor.picks[i], assignment.prob[i]), sep = "")
}
cat(summary)

{% endcodeblock %}

The code given assumes that you have a matrix called **win.prob** with row and column names, that each row represents a team, that each column represents a game, and that there are more teams than games (you'll need to get rid of the transpose otherwise - clue can handle rectangular problems as long as $n \leq m$).

## Improvements

In reality, maximizing expected survival time is probably the way to go. The "probability of surviving until the end" approach completely overlooks the fact that you just need to outlast your other opponents - not close out the season in style.

However, the probability approach has a cool solution, and maximizing expected survival time is a constrained non-linear (albeit polynomial) integer programing problem. Yikes. In practice that's what I did and I might write about it later but the result was much ado about nothing. After lots of work, the schedules were very similar and only resulted in a marginal increase in expected survival time. Even the greedy solution gets you most of the way there; for my matrix of probabilities the difference between the greedy solution and the optimal one was relatively small.

It's interesting to think about one scenario in which you *do* want to maximize the probability of surviving to game $n$ as we did above in lieu of expected survival time. Weekly picks are public, and if inclined you could feed said historical picks from other players into your optimizer and calculate your opponent's expected survival time. Finding the max expected survival time over all of your opponents gives you the number of games that you need to last.

## Conclusion

Buying into the pool definitely wasn't a high Sharpe bet. A huge chunk of the office was wiped out by a game two upset, and I got knocked out within a game of my expected survival time. Almost everyone was out by mid season. Good times all around.
