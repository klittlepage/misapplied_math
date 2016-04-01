require(ggplot2)

plot_distribution <- function(df) {
	ggplot(df, aes(x = Time)) + 
	geom_density(alpha = .3) +
	theme(plot.background = element_rect(fill = '#F1F1F1'), 
		legend.background = element_rect(fill = '#F1F1F1')) +
	ylab("Frequency") +
	ggtitle("Distribution of Hash Function Execution Times")
}

data <- read.csv("/home/bahamutzero/schedulerTest/out.txt", header = FALSE)
# data <- read.csv("/home/bahamutzero/results.csv", header = FALSE)
data <- as.vector(data$V1)

mean <- mean(data)
sigma <- sd(data)

df <- data.frame(Time = data)
plot_distribution(df)
ggsave("exec_times_full_dist.png", width = 7, height = 5.5, dpi = 140)

filtered <- data[data < median(data) + 1000 & data > median(data) - 1000]
df <- data.frame(Time = filtered)
plot_distribution(df)
ggsave("exec_times_zoomed_dist.png", width = 7, height = 5.5, dpi = 140)

ggplot(df, aes(Time)) + stat_ecdf() +
	theme(plot.background = element_rect(fill = '#F1F1F1'), 
		legend.background = element_rect(fill = '#F1F1F1')) +
	ggtitle("Empirical Cumulative Distribution of Hash Function Execution Times")
ggsave("ecdf_exec_times.png", width = 7, height = 5.5, dpi = 140)

sigma.vec <- c(1:6, 10, 20, 50, 100)

str <- paste("", sprintf("- Mean: %.2f", mean(data)), sep = "\n")
str <- paste(str, sprintf("- Median: %.2f", median(data)), sep = "\n")
str <- paste(str, sprintf("- SD: %.2f", sd(data)), sep = "\n")
str <- paste(str, sprintf("- Min: %.2f", min(data)), sep = "\n")
str <- paste(str, sprintf("- Max: %.2f", max(data)), sep = "\n")
for(i in sigma.vec)
{
	str <- paste(str, sprintf("- Number of iterations > $\\mu + %d\\sigma$: %d", i, 
		sum(data > mean + i * sigma)), sep = "\n")
}
cat(str)
