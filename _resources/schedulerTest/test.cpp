#include <iostream>
#include <inttypes.h>
#include <cstdio>
#include <time.h>
#include <pthread.h>
#include <sched.h>

using namespace std;

 __attribute__((always_inline))
timespec diff(timespec start, timespec end);

 __attribute__((always_inline))
int64_t hash(int64_t a);

bool set_realtime_priority();
 
int main()
{
	/*
	if(!set_realtime_priority()) {
		cout << "Failed to set realtime priority. Exiting." << endl;
		return 1;
	}
	*/
	int runCount = 100000;
	timespec startTime, endTime, timeDelta;
	int64_t deltas[runCount];
	clock_gettime(CLOCK_PROCESS_CPUTIME_ID, &startTime);
	int64_t a = startTime.tv_nsec;	
	
	for (int i = 0; i < runCount; i++) {
		clock_gettime(CLOCK_PROCESS_CPUTIME_ID, &startTime);
		a = hash(a);
		clock_gettime(CLOCK_PROCESS_CPUTIME_ID, &endTime);
		timeDelta = diff(startTime, endTime);
		deltas[i] = 1000000000 * timeDelta.tv_sec + timeDelta.tv_nsec;
	}

	if(0 == a) {
		// Prevent optimization. The odds of our hash function producing 
		// 0 for a non zero input is extremely slim.
		return 1;
	}

	for (int i = 0; i < runCount; i++) {
		cout << deltas[i] << endl;
	}
	
	return 0;
}
 
timespec diff(timespec start, timespec end)
{
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

int64_t hash(int64_t a) {
    for(int i = 0; i < 64; ++i) {
        a -= (a << 6);
        a ^= (a >> 17);
        a -= (a << 9);
        a ^= (a << 4);
        a -= (a << 3);
        a ^= (a << 10);
        a ^= (a >> 15);
    }
    return a;
}

bool set_realtime_priority() {
    int ret;
    pthread_t current_thread = pthread_self();
	struct sched_param params;
	params.sched_priority = sched_get_priority_max(SCHED_FIFO);
 
	ret = pthread_setschedparam(current_thread, SCHED_FIFO, &params);
	if (ret != 0) {
	    return false;
	}

    int policy = 0;
    ret = pthread_getschedparam(current_thread, &policy, &params);
    if (ret != 0 || policy != SCHED_FIFO) {
        return false;
    }
 
    return true;
}
