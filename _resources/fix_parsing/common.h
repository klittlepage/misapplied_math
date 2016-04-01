#ifndef COMMON_H
#define COMMON_H

#include <immintrin.h>
#include <inttypes.h>
#include <time.h>
#include <cstdio>
#include <cstring>

const char test_fix_msg[] = 
"1128=9\1 9=166\1 35=X\1 49=ABC\1 34=6190018\1 52=20100607144854295\1 \
75=20100607\1 268=1\1 279=0\1 22=8\1 48=6640\1 83=3917925\1 107=ASDF\1 269=2\1 \
270=106425\1 271=1\1 273=144854000\1 451=-175\1 1020=959598\1 5797=2\1 \
10=168\1\0";

void printEPI8Vector128(__m128i vec) {
	const uint8_t *v = reinterpret_cast<uint8_t*>(&vec);
	for(int i = 0; i < 16; ++i) {
		printf("Index %i: %i\n", i, v[i]);
	}
}

void printEPI8Vector256(__m256i vec) {
	const uint8_t *v = reinterpret_cast<uint8_t*>(&vec);
	for(int i = 0; i < 32; ++i) {
		printf("Index %i: %i\n", i, v[i]);
	}
}

void printEPI16Vector(__m256i vec) {
	printf("Index 0: %i\n", _mm256_extract_epi16(vec, 0));
	printf("Index 1: %i\n", _mm256_extract_epi16(vec, 1));
	printf("Index 2: %i\n", _mm256_extract_epi16(vec, 2));
	printf("Index 3: %i\n", _mm256_extract_epi16(vec, 3));
	printf("Index 4: %i\n", _mm256_extract_epi16(vec, 4));
	printf("Index 5: %i\n", _mm256_extract_epi16(vec, 5));
	printf("Index 6: %i\n", _mm256_extract_epi16(vec, 6));
	printf("Index 7: %i\n", _mm256_extract_epi16(vec, 7));
	printf("Index 8: %i\n", _mm256_extract_epi16(vec, 8));
	printf("Index 9: %i\n", _mm256_extract_epi16(vec, 9));
	printf("Index 10: %i\n", _mm256_extract_epi16(vec, 10));
	printf("Index 11: %i\n", _mm256_extract_epi16(vec, 11));
	printf("Index 12: %i\n", _mm256_extract_epi16(vec, 12));
	printf("Index 13: %i\n", _mm256_extract_epi16(vec, 13));
	printf("Index 14: %i\n", _mm256_extract_epi16(vec, 14));
	printf("Index 15: %i\n", _mm256_extract_epi16(vec, 15));
}

void printEPI32Vector(__m256i vec) {
	printf("Index 0: %i\n", _mm256_extract_epi32(vec, 0));
	printf("Index 1: %i\n", _mm256_extract_epi32(vec, 1));
	printf("Index 2: %i\n", _mm256_extract_epi32(vec, 2));
	printf("Index 3: %i\n", _mm256_extract_epi32(vec, 3));
	printf("Index 4: %i\n", _mm256_extract_epi32(vec, 4));
	printf("Index 5: %i\n", _mm256_extract_epi32(vec, 5));
	printf("Index 6: %i\n", _mm256_extract_epi32(vec, 6));
	printf("Index 7: %i\n", _mm256_extract_epi32(vec, 7));
}

timespec diff(timespec start, timespec end) {
	timespec t;
	if ((end.tv_nsec - start.tv_nsec) < 0) {
		t.tv_sec = end.tv_sec - start.tv_sec - 1;
		t.tv_nsec = 1000000000 + end.tv_nsec - start.tv_nsec;
	} else {
		t.tv_sec = end.tv_sec - start.tv_sec;
		t.tv_nsec = end.tv_nsec - start.tv_nsec;
	}
	return t;
}

void printSummary(timespec delta, int messages, long long tagSum) {
	double elapsedTime = delta.tv_sec + (double) delta.tv_nsec / 1000000000;
	double msgSec = (double) messages / elapsedTime;
	printf("Elapsed time: %lld.%.9ld, %i msg/sec, %i nsec/msg. \
Tag Sum: %lld.\n", (long long) delta.tv_sec, delta.tv_nsec, 
			(int) msgSec, (int) (1000000000 / msgSec), tagSum);
}

void runBenchmark(const char * const target, const int runCount, 
					int(*parseFn)(const char * const, size_t)) {
	const size_t testStringLength = strlen(target);
	timespec startTime, endTime;
	
	long long tagSum = 0;
	clock_gettime(CLOCK_PROCESS_CPUTIME_ID, &startTime);

	for(int i = 0; i < runCount; ++i) {
		tagSum += parseFn(target, testStringLength);
	}

	clock_gettime(CLOCK_PROCESS_CPUTIME_ID, &endTime);
    printSummary(diff(startTime, endTime), runCount, tagSum);
}

#endif
