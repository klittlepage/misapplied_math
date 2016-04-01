---
layout: post
title: "Why I Always Hit The Crosswalk Button"
date: 2015-01-21 00:53
comments: true
categories: [CS, Math, 'Game Theory']
keywords: "Volunteer's Dilemma, Kitty Genovese, game theory, Nash Equilibrium, self interested actors"
description: An examination of Kitty Genovese and the Volunteer's Dilemma, with applications
---

There's a major crosswalk bisecting one of the busiest street in Chicago; I stop there on a near daily basis as said crosswalk also leads to the best running trail downtown. On sunny weekends, crowds grow fifty pedestrians large before the light turns red, alleviating the congestion. It's a great place to people watch, especially if you're interested in crowd dynamics or game theory. The size of the crowd aside, a few things make this particular crosswalk special:

- Cross traffic is sparse, and in the absence of a car, the light will never turn without a pedestrian hitting the walk button.
- The crowds are large enough to form human traffic jams at times. When this happens, there's ambiguity as to who arrived first, and who should hit the button.
- It's a tourist heavy spot, so most pedestrians aren't aware of how long the wait is, or the aforementioned rules of the game.

Having studied it casually for a year, I feel justified in my habit of always hitting the crosswalk button.

The Volunteer's Dilemma refers to a broad set of game theoretic problems applicable to everything from wireless network design to employee incentive packages. When a stranger murdered Kitty Genovese outside of her Brooklyn apartment while thirty seven bystanders watched without so much as calling the police, the Volunteer's Dilemma went mainstream. Economists demonstrated an unintuitive result: the size of the crowd worked to her detriment, and not to her favor.

Assume that individuals witnessing a crime will act independently and call the police with probability $p$. For Kitty, the probability of no one calling, $(1 - p)^{37}$ (a minuscule quantity even for depressingly small values of $p$) isn't congruous with the outcome. Instead, assume that an individual will always call the cops if they know with certainty that no one else will. However, no one wants to deal with paperwork at 3am. Given the option, witnesses will bank on another member of the group rising to the occasion. It's a simple but intuitive model of how self motivated agents act in a group.

To make this notion concrete, consider the following payout scheme. Each witness has the option of calling the police. If no one calls, all players receive a payout of $0$. If at least one player calls, all players who didn't call receive a payout of $1$, and those who did receive a payout of $\frac{1}{2}$. It's easy to see that there are no pure-strategy Nash Equilibrium (NE) for this game. However, we can find a mixed-strategy NE quite easily.

Players will randomize iif the payout from each of $k$ actions is equal. We denote the probability of an individual calling in the mixed-strategy NE as $p^*$. Thus:

$$

\begin{align}
&U(\text{call}) = U(\text{don't call}) = 1 * P(\text{at least one other person calls}) = \frac{1}{2} \\
&P(\text{at least one other person calls}) = 1 - (1-p)^{n - 1} \\
&p^* = 1 - \left(\frac{1}{2}\right)^{\frac{1}{n - 1}}
\end{align}

$$

It follows immediately that the probability of no one calling is $(1-p^*)^n = \left(\frac{1}{2}\right)^\frac{n}{n - 1}$. That function is monotonically increasing in $n$, asymptotically approaching a max of $\frac{1}{2}$. As $n$ increases, the marginal importance of any one player is diminished. The above holds as NE requires that it's impossible for a player to alter their strategy in a manner that ensures a uniformly superior outcome. Given that all players know the equilibrium probability, they're happy to use a weighted coin as the basis of their decision -- there's no way to outperform. When $n = 2$, our equilibrium probability is $\frac{1}{2}$. In the case of Kitty, where $n = 37$, $p \approx .02$, and the probability of no one calling is $\approx .49$.

As is commonplace in game theory, the equilibrium for a [repeated play](http://en.wikipedia.org/wiki/Repeated_game) game looks quite different. In fact, it's relatively easy to show that a strategy in which all $n$ players take turns volunteering is both utility maximizing and a NE. So there you have it, the age old adage ``play nice with others'' has a mathematical justification, as long as your play group stays the same.
