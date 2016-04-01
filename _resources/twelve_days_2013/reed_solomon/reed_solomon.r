m.vec <- c(2, 3, 4)
r.vec <- c(2, 2, 6, 5, 3, 5, 3)

polyval <- function(c, x) {
	n <- length(c)
	y <- x*0+c[1];
	for (i in 2:n) {
		y <- c[i] +x*y
	}
	return(y)
}

p.vec <- polyval(rev(m.vec), 0:6) %% 7

delta <- function(x, n) {
	if(n == 0) {
		return(x)
	}
	delta <- function(x) {
		len <- length(x)
		if(len > 1) {
			return(x[2:len] - x[1:(len - 1)])
		} else {
			return(0)
		}
	}
	for(i in 1:n) {
		x <- delta(x)
	}
	return(x)
}

rj.vec <- function(r, j) {
	len <- length(r)
	(0:(len - 1))^j * r
}

a0 <- rj.vec(r.vec, 0)
a1 <- rj.vec(r.vec, 1)
a2 <- rj.vec(r.vec, 2)

b <- cbind(delta(a0, 5), delta(a1, 5), delta(a2, 5)) %% 7

e.coef <- c(1, 1, 1)
qi.seq <- (polyval(e.coef, 0:6) * r.vec) %% 7

diff.vec <- unlist(lapply(apply(as.matrix(0:4), 1, 
	function(x) delta(qi.seq, x)), function(x) x[[1]])) %% 7