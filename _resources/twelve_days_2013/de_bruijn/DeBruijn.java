import java.util.Random;

/**
 * @author Kelly Littlepage (indigoShift LLC)
 */
public class DeBruijn {

    /***
     * Generate a De Bruijn Sequence using the recursive FKM algorithm as given
     * in http://www.1stworks.com/ref/RuskeyCombGen.pdf .
     *
     * @param k The number of (integer) symbols in the alphabet.
     * @param n The length of the words in the sequence.
     *
     * @return A De Bruijn sequence B(k, n).
     */
    private static String generateDeBruijnSequence(int k, int n) {
        final int[] a = new int[k * n];
        final StringBuilder sb = new StringBuilder();
        generateDeBruijnSequence(a, sb, 1, 1, k, n);
        return sb.toString();
    }

    private static void generateDeBruijnSequence(int[] a,
                                                 StringBuilder sequence,
                                                 int t,
                                                 int p,
                                                 int k,
                                                 int n) {
        if(t > n) {
            if(0 == n % p) {
                for(int j = 1; j <= p; ++j) {
                    sequence.append(a[j]);
                }
            }
        } else {
            a[t] = a[t - p];
            generateDeBruijnSequence(a, sequence, t + 1, p, k, n);
            for(int j = a[t - p] + 1; j < k; ++j) {
                a[t] = j;
                generateDeBruijnSequence(a, sequence, t + 1, t, k, n);
            }
        }
    }

    /***
     * Build the minimal perfect hash table required by the De Bruijn ffs
     * procedure. See http://supertech.csail.mit.edu/papers/debruijn.pdf.
     *
     * @param deBruijnConstant The De Bruijn number to use, as produced by
     * {@link DeBruijn#generateDeBruijnSequence(int, int)} with k = 2.
     * @param n The length of the integer word that will be used for lookup,
     * in bits. N must be a positive power of two.
     *
     * @return A minimal perfect hash table for use with the
     * {@link DeBruijn#ffs(int, int[], int)} function.
     */
    private static int[] buildDeBruijnHashTable(int deBruijnConstant, int n) {
        if(!isPositivePowerOfTwo(n)) {
            throw new IllegalArgumentException("n must be a positive power " +
                    "of two.");
        }
        // We know that n is a power of two so this (meta circular) hack will
        // give us lg(n).
        final int lgn = Integer.numberOfTrailingZeros(n);
        final int[] table = new int[n];
        for(int i = 0; i < n; ++i) {
            table[(deBruijnConstant << i) >>> (n - lgn)] = i;
        }
        return table;
    }

    /***
     * Tests that an integer is a positive, non-zero power of two.
     *
     * @param x The integer to test.
     * @return <code>true</code> if the integer is a power of two, and
     * <code>false otherwise</code>.
     */
    private static boolean isPositivePowerOfTwo(int x) {
        return x > 0 && ((x & -x) == x);
    }

    /***
     * A find-first-set bit procedure based off of De Bruijn minimal perfect
     * hashing. See http://supertech.csail.mit.edu/papers/debruijn.pdf.
     *
     * @param deBruijnConstant The De Bruijn constant used in the construction
     * of the deBruijnHashTable.
     * @param deBruijnHashTable A hash 32-bit integer hash table, as produced by
     * a call to {@link DeBruijn#buildDeBruijnHashTable(int, int)} with n = 32.
     * @param x The number for which the first set bit is desired.
     *
     * @return <code>32</code> if x == 0, and the position (in bits) of the
     * first (rightmost) set bit in the integer x. This function chooses to
     * return 32 in the event that no bit is set so that behavior is consistent
     * with {@link Integer.numberOfTrailingZeros()}.
     */
    private static int ffs(int deBruijnConstant,
                           int[] deBruijnHashTable, int x) {
        if(x == 0) {
            return 32;
        }
        x &= -x;
        x *= deBruijnConstant;
        x >>>= 27;
        return deBruijnHashTable[x];
    }

    private static void testHashing() {
        final int deBruijnConstant = Integer.valueOf(
                generateDeBruijnSequence(2, 5), 2);
        final int[] hashTable = buildDeBruijnHashTable(deBruijnConstant, 32);
        for(int i = Integer.MIN_VALUE; i < Integer.MAX_VALUE; ++i) {
            if(ffs(deBruijnConstant, hashTable,i) !=
                    Integer.numberOfTrailingZeros(i)) {
                throw new IllegalArgumentException(Integer.toString(i));
            }
        }
    }

    private static void benchmarkLookup(int runCount) {
        final Random random = new Random();
        final int[] targets = new int[runCount];
        for(int i = 0; i < runCount; ++i) {
            targets[i] = random.nextInt();
        }
        final int deBruijnConstant = Integer.valueOf(
                generateDeBruijnSequence(2, 5), 2);
        final int[] hashTable = buildDeBruijnHashTable(deBruijnConstant, 32);

        // Warm up
        for(int i = 0; i < 5; ++i) {
            timeLeadingZeros(targets);
            timeFFS(targets, hashTable, deBruijnConstant);
        }

        System.out.printf("Intrinsic: %.4fs\n",
                (double) timeLeadingZeros(targets) / Math.pow(10d, 9));
        System.out.printf("FFS: %.4fs\n",
                (double) timeFFS(targets, hashTable, deBruijnConstant) /
                        Math.pow(10d, 9));
    }

    private static int checksum;

    private static long timeLeadingZeros(int[] targets) {
        // Hash to prevent optimization
        int hash = 0;
        final long startTime = System.nanoTime();
        for(int i : targets) {
            hash += Integer.numberOfTrailingZeros(i);
        }
        final long endTime = System.nanoTime();
        checksum += hash;
        return endTime - startTime;
    }

    private static long timeFFS(int[] targets, int[] hashTable,
                                int deBruijnConstant) {
        // Hash to prevent optimization
        int hash = 0;
        final long startTime = System.nanoTime();
        for(int i : targets) {
            hash += ffs(deBruijnConstant, hashTable, i);
        }
        final long endTime = System.nanoTime();
        checksum += hash;
        return endTime - startTime;
    }

    public static void main(String[] args) {
        benchmarkLookup(100000000);
    }


}
