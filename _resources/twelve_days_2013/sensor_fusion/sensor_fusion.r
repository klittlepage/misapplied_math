require(MASS)
require(dse)
require(reshape2)
require(ggplot2)

samples <- 1000
q <- 2
z0 <- 100
sigma1 <- .6
sigma2 <- .7
sigma3 <- .8
r12 <- .3
r13 <- .1
r23 <- .2
bias1 <- .1
bias2 <- -.2
bias3 <- 0
R <- matrix(nrow = 3, ncol = 3)
R <- rbind(c(sigma1^2, r12 * sigma1 * sigma2, r13 * sigma1 * sigma3), 
			c(r12 * sigma1 * sigma2, sigma2^2, r23 * sigma2 * sigma3), 
			c(r13 * sigma1 * sigma3, r23 * sigma2 * sigma3, sigma3^2))


path <- z0 + cumsum(rnorm(samples, mean = 0, sd = q))
observed <- path + mvrnorm(n = samples, c(bias1, bias2, bias3), R)

ss.model <- SS(F = as.matrix(1), Q = as.matrix(q^2), 
	H = as.matrix(c(1, 1, 1)), R = R, z0 = z0) 
smoothed.model <- smoother(ss.model, TSdata(output = observed))
state.est <- smoothed.model$smooth$state

rmsd <- function(actual, estimated) {
    sqrt(mean((actual - estimated)^2))
}

est.rmsd <- c(rmsd(path, state.est), 
	apply(observed, 2, function(x) rmsd(path, x)))

plot.points <- 50
state.df <- data.frame(cbind(path, state.est, observed)[1:plot.points, ])
names(state.df) <- c("Actual", "Kalman", "Sensor1", "Sensor2", "Sensor3")
state.df <- melt(state.df)
state.df <- data.frame(rep(1:plot.points, 5), state.df)
names(state.df) <- c("Index", "StateType", "Value")

ggplot(state.df, aes(x = Index, y = Value, color = StateType)) + 
	geom_line() + 
	theme(plot.background = element_rect(fill = '#F1F1F1'), 
	legend.background = element_rect(fill = '#F1F1F1')) +
	xlab("Index") + 
	ylab("Value") +
	ggtitle("Kalman Sensor Fusion")

ggsave("kalman_tracking.png", width = 7, height = 5.5, dpi = 140, 
	bg = "transparent")