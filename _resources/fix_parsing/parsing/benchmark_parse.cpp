#include "../common.h"
#include <cstdio>
#include <cstring>
#include <nmmintrin.h>
#include <emmintrin.h>
#include <immintrin.h>
#include <inttypes.h>

/*
A simple implementation that loops over a character string, character by 
character, summing the total number of '=' and '\1' characters.
*/
__attribute__((always_inline))
inline int parseNaive(const char* const target, size_t targetLength) {
	int sohCount = 0;
	int eqCount = 0;

	for(size_t i = 0; i < targetLength; ++i) {
		const char c = target[i];
		if('=' == c) {
			++eqCount;
		} else if('\1' == c) {
			++sohCount;
		}
	}

	return sohCount + eqCount;
}

/*
An unrolled version of the naive implementation. This serves as a baseline 
comparison against vectorization by unrolling one the loop into a 16 bit stride. 
A good optimizing compiler will do this for us (albeit it will probably 
pick a different stride length to unroll by).
*/
__attribute__((always_inline))
inline int parseUnrolled(const char* const target, size_t targetLength) {
	int sohCount = 0;
	int eqCount = 0;
	size_t i = 0;

	if(targetLength >= 16) {
		for(; i <= targetLength - 16; i += 16) {
			if('=' == target[i]) {
				++eqCount;
			} else if('\1' == target[i]) {
				++sohCount;
			}
			if('=' == target[i + 1]) {
				++eqCount;
			} else if('\1' == target[i + 1]) {
				++sohCount;
			}
			if('=' == target[i + 2]) {
				++eqCount;
			} else if('\1' == target[i + 2]) {
				++sohCount;
			}
			if('=' == target[i + 3]) {
				++eqCount;
			} else if('\1' == target[i + 3]) {
				++sohCount;
			}
			if('=' == target[i + 4]) {
				++eqCount;
			} else if('\1' == target[i + 4]) {
				++sohCount;
			}
			if('=' == target[i + 5]) {
				++eqCount;
			} else if('\1' == target[i + 5]) {
				++sohCount;
			}
			if('=' == target[i + 6]) {
				++eqCount;
			} else if('\1' == target[i + 6]) {
				++sohCount;
			}
			if('=' == target[i + 7]) {
				++eqCount;
			} else if('\1' == target[i + 7]) {
				++sohCount;
			}
			if('=' == target[i + 8]) {
				++eqCount;
			} else if('\1' == target[i + 8]) {
				++sohCount;
			}
			if('=' == target[i + 9]) {
				++eqCount;
			} else if('\1' == target[i + 9]) {
				++sohCount;
			}
			if('=' == target[i + 10]) {
				++eqCount;
			} else if('\1' == target[i + 10]) {
				++sohCount;
			}
			if('=' == target[i + 11]) {
				++eqCount;
			} else if('\1' == target[i + 11]) {
				++sohCount;
			}
			if('=' == target[i + 12]) {
				++eqCount;
			} else if('\1' == target[i + 12]) {
				++sohCount;
			}
			if('=' == target[i + 13]) {
				++eqCount;
			} else if('\1' == target[i + 13]) {
				++sohCount;
			}
			if('=' == target[i + 14]) {
				++eqCount;
			} else if('\1' == target[i + 14]) {
				++sohCount;
			}
			if('=' == target[i + 15]) {
				++eqCount;
			} else if('\1' == target[i + 15]) {
				++sohCount;
			}
		}
	}

	for(; i < targetLength; ++i) {
		const char c = target[i];
		if('=' == c) {
			++eqCount;
		} else if('\1' == c) {
			++sohCount;
		}
	}

	return sohCount + eqCount;
}

const int mode = _SIDD_UBYTE_OPS | _SIDD_CMP_EQUAL_ANY | 
		_SIDD_LEAST_SIGNIFICANT;

/*
This implementation emits the pcmpistri instruction introduced in SSE 4.2 to 
search for a needle ('=' and '\1') in a haystack (the message). It offers a 
clean, vectorized solution at the cost of an expensive opcode. Each time a 
"needle" is found the search index is advanced past the given index.
*/
__attribute__((always_inline))
inline int parseSSE(const char* const target, size_t targetLength) {
	const __m128i pattern = _mm_set_epi8(0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 
		0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, '=', '\1');
	__m128i s;
	size_t strIdx = 0;
	int searchIdx = 0;
	int sohCount = 0;
	int eqCount = 0;

	if(targetLength >= 16) {
		while(strIdx <= targetLength - 16) {
			s = _mm_loadu_si128(reinterpret_cast<const __m128i*>(
				target + strIdx));
			searchIdx = _mm_cmpistri(pattern, s, mode);
			if(searchIdx < 16) {
				if('=' == target[strIdx + searchIdx]) {
					++eqCount;
				} else {
					++sohCount;
				}
			}
			strIdx += searchIdx + 1;
		}
	}

	for(; strIdx < targetLength; ++strIdx) {
		const char c = target[strIdx];
		if('=' == c) {
			++eqCount;
		} else if('\1' == c) {
			++sohCount;
		}
	}

	return sohCount + eqCount;
}

/*
A small modification of the parseSSE implementation in which a linear scan 
is used to finish scanning over the remaining 128 byte word whenever a match 
is found.
*/
__attribute__((always_inline))
inline int parseSSEHybrid(const char* const target, size_t targetLength) {
	const __m128i pattern = _mm_set_epi8(0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 
		0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, '=', '\1');
	union {
		__m128i v;
		char c[16];
	} s;
	size_t strIdx = 0;
	int searchIdx = 0;
	int sohCount = 0;
	int eqCount = 0;

	if(targetLength >= 16) {
		for(; strIdx <= targetLength - 16; strIdx += 16) {
			s.v = _mm_loadu_si128(reinterpret_cast<const __m128i*>(
				target + strIdx));
			searchIdx = _mm_cmpistri(pattern, s.v, mode);
			if(searchIdx < 16) {
				for(int i = searchIdx; i < 16; ++i) {
					const char c = s.c[i];
					if('=' == c) {
						++eqCount;
					} else if('\1' == c) {
						++sohCount;
					}				
				}
			}
		}
	}

	for(; strIdx < targetLength; ++strIdx) {
		const char c = target[strIdx];
		if('=' == c) {
			++eqCount;
		} else if('\1' == c) {
			++sohCount;
		}
	}

	return sohCount + eqCount;
}

/*
As we're looking for simple, single character needles we can use bitmasking to 
search in lieu of SSE 4.2 string comparison functions. This simple 
implementation splits a 256 bit AVX register into eight 32-bit words. Whenever 
a word is non-zero (any bits are set within the word) a linear scan identifies 
the position of the matching character within the 32-bit word. 
*/
__attribute__((always_inline))
inline int parseAVX(const char* const target, size_t targetLength) {
	__m256i soh = _mm256_set1_epi8(0x1);
	__m256i eq = _mm256_set1_epi8('=');
	size_t strIdx = 0;
	int sohCount = 0;
	int eqCount = 0;
	union {
		__m256i v;
		char c[32];
	} testVec;
	union {
		__m256i v;
		uint32_t l[8];
	} mask;

	if(targetLength >= 32) {
		for(; strIdx <= targetLength - 32; strIdx += 32) {
			testVec.v = _mm256_loadu_si256(reinterpret_cast<const __m256i*>(
				target + strIdx));		
			mask.v = _mm256_or_si256(
				_mm256_cmpeq_epi8(testVec.v, soh), 
					_mm256_cmpeq_epi8(testVec.v, eq));
			for(int i = 0; i < 8; ++i) {
				if(0 != mask.l[i]) {
					for(int j = 0; j < 4; ++j) {
						char c = testVec.c[4 * i + j];
						if('\1' == c) {
							++sohCount;
						} else if('=' == c) {
							++eqCount;
						}
					}
				}
			}
		}
	}

	for(; strIdx < targetLength; ++strIdx) {
		const char c = target[strIdx];
		if('=' == c) {
			++eqCount;
		} else if('\1' == c) {
			++sohCount;
		}
	}

	return (sohCount + eqCount) % 256;
}

int main () {
	const int runCount = 10000000;
	//const int runCount = 1;

	printf("Testing naive implementation...\n");
	runBenchmark(test_fix_msg, runCount, &parseNaive);

	printf("Testing unrolled implementation...\n");
	runBenchmark(test_fix_msg, runCount, &parseUnrolled);

	printf("Testing SSE...\n");
	runBenchmark(test_fix_msg, runCount, &parseSSE);

	printf("Testing SSE hybrid...\n");
	runBenchmark(test_fix_msg, runCount, &parseSSEHybrid);

	printf("Testing AVX...\n");
	runBenchmark(test_fix_msg, runCount, &parseAVX);
    
    return 0;
}
