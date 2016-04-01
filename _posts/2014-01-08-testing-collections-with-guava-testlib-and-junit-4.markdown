---
layout: post
title: "Testing Collections With Guava-Testlib and JUnit 4"
date: 2014-01-08 08:18
comments: true
categories: ['CS']
keywords: "guava-testlib JUnit 4 java collections unit testing"
description: "Using guava-testlib with JUnit 4"
---

## Testing Custom Java Collections

Over the years I've built up a suite of unit tests for various types of java collections. When I started doing so, I didn't know of any good off-the-shelf means of generic collections testing. The JDK itself has some unit/regression tests, but not as many as you would think, and that aside they rely on a custom build system/testing framework.

I've used [google-guava](https://code.google.com/p/guava-libraries/) in a few projects but recently discovered their *not so well advertised* test support library: [guava-testlib](https://code.google.com/p/guava-libraries/source/browse/guava-testlib/). I tried it out out on my most recent project (a custom random access list with $O(1)$ [deque](http://en.wikipedia.org/wiki/Double-ended_queue) operations) and I'm very impressed with the test coverage and flexibility. The documentation is sparse but once you get it working you'll have a test suite with hundreds to thousands of unit tests generated for your list, map, or set. Guava-testlib also generates tests for the non-standard collections in google-guava.

The library relies on [JUnit](http://junit.org/), and most of what I found online detailing its use pertains to JUnit 3. There was a substantial API break between JUnit 3 and JUnit 4, as JUnit 3 relies on naming conventions and inheritance whereas JUnit 4 uses less intrusive annotations. I struggled for a bit trying to figure out how to get things working without resorting to the old JUnit 3 APIs. I arrived at something that works, but it's still a little dirty as it indirectly relies on a magic static method named *suite()* from the JUnit 3 days.

{% codeblock title:ArrayListTest.java lang:java %}

package com.indigo.collections;

import com.google.common.collect.testing.*;
import com.google.common.collect.testing.features.CollectionFeature;
import com.google.common.collect.testing.features.CollectionSize;
import com.google.common.collect.testing.features.ListFeature;
import junit.framework.TestSuite;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.Suite;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Your test class must be annotated with {@link RunWith} to specify that it's a
 * test suite and not a single test.
 */
@RunWith(Suite.class)
/**
 * We need to use static inner classes as JUnit only allows for empty "holder"
 * suite classes.
 */
@Suite.SuiteClasses({
        ArrayListTest.GuavaTests.class,
        ArrayListTest.AdditionalTests.class,
})
public class ArrayListTest {

    /**
     * Add your additional test cases here.
     */
    public static class AdditionalTests {

        @Test
        public void testFoo() {

        }

    }

    /**
     * This class will generate the guava test suite. It needs a public static
     * magic method called {@link GuavaTests#suite()} to do so.
     */
    public static class GuavaTests {

        /**
         * The method responsible for returning the {@link TestSuite} generated
         * by one of the {@link FeatureSpecificTestSuiteBuilder} classes.
         * This method must be public static method with no arguments named
         * "suite()".
         *
         * @return An instance of {@link TestSuite} for collection testing.
         */
        public static TestSuite suite() {
            /**
             * guava-testlib has a host of test suite builders available,
             * all descending from {@link FeatureSpecificTestSuiteBuilder}.
             * The
             * {@link FeatureSpecificTestSuiteBuilder#usingGenerator(Object)}
             * is the main entry point in that collections are tested by
             * implementing {@link TestCollectionGenerator} and providing an
             * instance of the interface to the test suite builder via the
             * #usingGenerator(Object) method. Most of suite builder classes
             * provide a convenience method such as
             * {@link ListTestSuiteBuilder.using()} that streamline the process
             * of creating a builder.
             *
             */
            return ListTestSuiteBuilder
                    // The create method is called with an array of elements
                    // that should populate the collection.
                    .using(new TestStringListGenerator() {

                        @Override
                        protected List<String> create(String[] elements) {
                            return new ArrayList<>(Arrays.asList(elements));
                        }


                    })
                    // You can optionally give a name to your test suite. This
                    // name is used by JUnit and other tools during report
                    // generation.
                    .named("ArrayList tests")
                    // Guava has a host of "features" in the
                    // com.google.common.collect.testing.features package. Use
                    // them to specify how the collection should behave, and
                    // what operations are supported.
                    .withFeatures(
                            ListFeature.GENERAL_PURPOSE,
                            ListFeature.SUPPORTS_ADD_WITH_INDEX,
                            ListFeature.SUPPORTS_REMOVE_WITH_INDEX,
                            ListFeature.SUPPORTS_SET,
                            CollectionFeature.SUPPORTS_ADD,
                            CollectionFeature.SUPPORTS_REMOVE,
                            CollectionFeature.SUPPORTS_ITERATOR_REMOVE,
                            CollectionFeature.ALLOWS_NULL_VALUES,
                            CollectionFeature.GENERAL_PURPOSE,
                            CollectionSize.ANY
                    ).createTestSuite();
        }


    }


}


{% endcodeblock %}
