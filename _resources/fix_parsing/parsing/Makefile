CC = g++
CFLAGS = -g -Wall -march=core-avx2 -O3 -funroll-loops -ftree-vectorizer-verbose=1

all:
	$(CC) $(CFLAGS) benchmark_parse.cpp -o benchmark_parse

clean:
	rm -rf benchmark_parse

