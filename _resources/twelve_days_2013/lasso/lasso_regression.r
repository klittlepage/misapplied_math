require(lars)
data(diabetes)

# Compute MSEs for a range of coefficient penalties expressed as a fraction 
# of the final L1 norm on the interval [0, 1].
cv.res <- cv.lars(diabetes$x, diabetes$y, type = "lasso", 
	mode = "fraction", plot = FALSE)

# Choose an "optimal" value one standard deviation away from the 
# minimum MSE.
opt.frac <- min(cv.res$cv) + sd(cv.res$cv)
opt.frac <- cv.res$index[which(cv.res$cv < opt.frac)[1]]

# Compute the LARS path
lasso.path <- lars(diabetes$x, diabetes$y, type = "lasso")

# Compute a fit given the LARS path that we precomputed, and our optimal 
# fraction of the final L1 norm
lasso.fit <- predict.lars(lasso.path, type = "coefficients", 
	mode = "fraction", s = opt.frac)

# Extract the final vector of regression coefficients
coef(lasso.fit)
