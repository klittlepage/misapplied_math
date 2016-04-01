makePlot <- function(df, title) {
	ggplot(data = df, aes(x = reorder(Type, -NSM, sum), y = NSM, fill = Type)) + 
    geom_bar(stat="identity") + 
    coord_flip() + 
    theme(plot.background = element_rect(fill = '#F1F1F1'), 
  		legend.background = element_rect(fill = '#F1F1F1')) +
    ylab("Nanoseconds/Msg") +
	xlab("Type") + 
	ggtitle(title)	
}

makePlot(df, "Time Spent Parsing: Nanoseconds/Message")
ggsave("parsing-nanos-msg.png", width = 7, height = 5.5, dpi = 140, 
	bg = "transparent")

makePlot(df, "Time Spent Checksumming: Nanoseconds/Message")
ggsave("checksum-nanos-msg.png", width = 7, height = 5.5, dpi = 140, 
	bg = "transparent")
