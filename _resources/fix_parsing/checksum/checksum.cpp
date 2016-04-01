#include "../common.h"
#include <cstdio>
#include <immintrin.h>

/*
A baseline, cannonically correct FIX checksum calculation.
*/
__attribute__((always_inline))
inline int naiveChecksum(const char * const target, size_t targetLength) {
	unsigned int checksum = 0;
	for(size_t i = 0; i < targetLength; ++i) {
		checksum += (unsigned int) target[i];
	}
	return checksum % 256;
}

/*
An AVX2 checksum implementation using a series of VPHADDW instructions to add 
horizontally packed 16-bit integers in 256 bit YMM registers. Results are 
accumulated on each vector pass.
*/
__attribute__((always_inline))
inline int avxChecksumV1(const char * const target, size_t targetLength) {
	const __m256i zeroVec = _mm256_setzero_si256();
	unsigned int checksum = 0;		
	size_t offset = 0;

	if(targetLength >= 32) {
		for(; offset <= targetLength - 32; offset += 32) {
			__m256i vec = _mm256_loadu_si256(
				reinterpret_cast<const __m256i*>(target + offset));
	        __m256i lVec = _mm256_unpacklo_epi8(vec, zeroVec);
	        __m256i hVec = _mm256_unpackhi_epi8(vec, zeroVec);
			__m256i sum = _mm256_add_epi16(lVec, hVec);
			sum = _mm256_hadd_epi16(sum, sum);
			sum = _mm256_hadd_epi16(sum, sum);
			sum = _mm256_hadd_epi16(sum, sum);
			checksum += _mm256_extract_epi16(sum, 0) + 
				_mm256_extract_epi16(sum, 15);		
		}
	}

	for(; offset < targetLength; ++offset) {
    	checksum += (unsigned int) target[offset];
    }

	return checksum % 256;
}

/*
A modified version of avxChecksumV1 in which the sum is carried out, in 
parallel across 8 32-bit words on each vector pass. The results are folded 
together at the end to obtain the final checksum. Note that this implementation 
is not canonically correct w.r.t overflow behavior but no reasonable length 
FIX message will ever create a problem.
*/
__attribute__((always_inline))
inline int avxChecksumV2(const char * const target, size_t targetLength) {
    const __m256i zeroVec = _mm256_setzero_si256();
    const __m256i oneVec = _mm256_set1_epi16(1);
    __m256i accum = _mm256_setzero_si256();
    unsigned int checksum = 0;
    size_t offset = 0;

    if(targetLength >= 32) {
	    for(; offset <= targetLength - 32; offset += 32) {
	        __m256i vec = _mm256_loadu_si256(
	        	reinterpret_cast<const __m256i*>(target + offset));
	        __m256i vl = _mm256_unpacklo_epi8(vec, zeroVec);
	        __m256i vh = _mm256_unpackhi_epi8(vec, zeroVec);
	        // There's no "add and unpack" instruction but multiplying by 
	        // one has the same effect and gets us unpacking from 16-bits to 
	        // 32 bits for free.
	        accum = _mm256_add_epi32(accum, _mm256_madd_epi16(vl, oneVec));
	        accum = _mm256_add_epi32(accum, _mm256_madd_epi16(vh, oneVec));
	    }    	
    }

    for(; offset < targetLength; ++offset) {
    	checksum += (unsigned int) target[offset];
    }

    // We could accomplish the same thing with horizontal add instructions as 
    // we did above but shifts and vertical adds have much lower instruction 
    // latency.
	accum = _mm256_add_epi32(accum, _mm256_srli_si256(accum, 4));
	accum = _mm256_add_epi32(accum, _mm256_srli_si256(accum, 8));
    return (_mm256_extract_epi32(accum, 0) + _mm256_extract_epi32(accum, 4) + 
    	checksum) % 256;
}

void printRegistersForV3Iteration() {
	const __m256i v = _mm256_set_epi8(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 
		14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 
		32);
	const __m256i zeroVec = _mm256_setzero_si256();
    const __m256i oneVec = _mm256_set1_epi16(1);
    __m256i accum = _mm256_setzero_si256();
    __m256i vl = _mm256_unpacklo_epi8(v, zeroVec);
    __m256i vh = _mm256_unpackhi_epi8(v, zeroVec);
    printf("Low vector:\n");
    printEPI16Vector(vl);
    printf("High vector:\n");
    printEPI16Vector(vh);

    accum = _mm256_add_epi32(accum, _mm256_madd_epi16(vl, oneVec));
    printf("Add Low:\n");
    printEPI32Vector(accum);
    accum = _mm256_add_epi32(accum, _mm256_madd_epi16(vh, oneVec));
    printf("Add High:\n");
    printEPI32Vector(accum);
}

int main () {
	const int runCount = 10000000;

	printf("Benchmarking naive checksum...\n");
	runBenchmark(test_fix_msg, runCount, &naiveChecksum);

	printf("Benchmarking AVX checksum v1...\n");
	runBenchmark(test_fix_msg, runCount, &avxChecksumV1);

	printf("Benchmarking AVX checksum v2...\n");
	runBenchmark(test_fix_msg, runCount, &avxChecksumV2);

    return 0;
}
