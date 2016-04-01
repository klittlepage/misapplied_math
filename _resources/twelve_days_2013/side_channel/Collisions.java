import java.math.BigInteger;
import java.util.*;

/**
 * @author Kelly Littlepage (indigoShift LLC)
 */
public class Collisions {

    private static final int[] permissibleCharacters;

    static {
        permissibleCharacters = new int[62];
        int i = 0;
        for(int v = '0'; v <= 'z'; ++v) {
            if(isPermissibleCharacter(v)) {
                permissibleCharacters[i++] = v;
            }
        }
    }

    private static List<String> generateCollisionsForString(String target,
            int[] validCharacters) {
        int n = validCharacters.length;
        final List<String> outputList = new ArrayList<String>();
        final int targetHash = target.hashCode();
        for(int k = 0; k <= target.length(); ++k) {
            generateCollisionsForString(targetHash, validCharacters, "", n, k,
                    outputList);
        }
        return outputList;
    }

    private static void generateCollisionsForString(int targetHash,
                                                    int[] set,
                                                    String prefix,
                                                    int n,
                                                    int k,
                                                    List<String> outputList) {
        if (k == 0) {
            if(prefix.hashCode() == targetHash) {
                outputList.add(prefix);
            }
            return;
        }
        for (int i = 0; i < n; ++i) {
            generateCollisionsForString(targetHash, set, prefix + (char) set[i],
                    n, k - 1, outputList);
        }
    }

    private static void benchmarkLoadedHashMap(int randomKeys,
                                               int stringLength,
                                               List<String> collisions,
                                               int samples) {
        // Generate a hash map with 50% load
        final Map<String, String> hashMap = new HashMap<String, String>(
                2 * randomKeys);
        final String[] randKeyArr = new String[randomKeys];
        final String[] collisionKeys = new String[randomKeys];
        final Random rand = new Random();

        // Load the map with random keys
        for(int i = 0; i < randomKeys; ++i) {
            final String randomString = (new BigInteger(stringLength * 8,
                    rand)).toString();
            randKeyArr[i] = randomString;
            hashMap.put(randomString, randomString);
        }

        // Load the map with our colliding keys
        for(String s : collisions) {
            hashMap.put(s, s);
        }
        for(int i = 0; i < randomKeys; ++i) {
            collisionKeys[i] = collisions.get(i % collisions.size());
        }

        // Warm up before benchmarking
        for(int i = 0; i < 5; ++i) {
            timeAccess(randKeyArr, hashMap, samples, rand);
            timeAccess(collisionKeys, hashMap, samples, rand);
        }

        for(int i = 0; i < 5; ++i) {
            System.out.printf("Iteration %d\n", i + 1);
            System.out.printf("Random keys: %.4fs\n",
                    timeAccess(randKeyArr, hashMap, samples, rand));
            System.out.printf("Collision keys: %.4fs\n",
                    timeAccess(collisionKeys, hashMap, samples, rand));
        }
    }

    private static double timeAccess(String[] keys, Map<String, String> map,
                                     int samples, Random random) {
        final long startTime = System.nanoTime();
        for(int i = 0; i < samples; ++i) {
            poisonCache(keys, map, random);
            // Pick a key at random to minimize cache effects in the benchmark
            final String key = keys[random.nextInt(keys.length)];
            map.get(key);
        }
        final long endTime = System.nanoTime();
        return (double) (endTime - startTime) / Math.pow(10d, 9);
    }

    // Preform some basic cache busing between iterations to make sure that our
    // benchmark isn't just showing cache effects (not that those aren't useful
    // in their own right)
    private static void poisonCache(String[] keys, Map<String, String> map,
                                    Random random) {
        for(int i = 0; i < 10; ++i) {
            map.get(keys[random.nextInt(keys.length - 1)]);
        }
    }

    public static void main(String[] args) {
        final List<String> collisions = generateCollisionsForString("world",
                permissibleCharacters);
        benchmarkLoadedHashMap(10000, 3, collisions, 100000);
    }

    private static boolean isPermissibleCharacter(int x) {
        return (x >= '0' && x <= '9') ||
                (x >= 'A' && x <= 'Z') ||
                (x >= 'a' && x <= 'z');
    }


}
