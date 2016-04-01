CC = g++
CFLAGS = -g -Wall -march=core-avx2 -O3 -funroll-loops -ftree-vectorizer-verbose=1

all:
	$(CC) $(CFLAGS) checksum.cpp -o checksum

clean:
	rm -rf checksum

