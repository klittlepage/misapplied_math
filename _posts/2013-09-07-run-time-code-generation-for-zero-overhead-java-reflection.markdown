---
layout: post
title: "Run Time Code Generation for Zero Overhead Java Reflection"
date: 2013-09-07 17:49
comments: true
categories: ['CS', 'HFT', 'Java']
keywords: "javassist, java, code generation, reflection, java reflection benchmark, HFT, low latency, factory pattern"
description: "Benchmarking run time code generation using javassist against reflection"
---

## Towards a Generic Factory

Architecting almost any large system requires loads of boilerplate code.
Unfortunately, in the low latency space the adage that with powerful hardware 
a programmer's time outweights the program's efficiency doesn't hold.

Reflective capabilities and metaprogramming constructs are a godsend when it
comes to programmer productivity. Rails and many other frameworks leverage them
extensively to decouple implementation details from business logic and perform
complex tasks such as persistence and transactions transparently. 
Though rife with potential for abusing anti patterns and creating
maintenance nightmares, reflection proves extremely useful when used tastefully.

One such application is for a generic factory method returning instances of a
given type -- a trivial task repeated in codebases the world over. In java the
pattern looks something like:

{% codeblock title:Factory.java lang:java %}

public interface Factory<T> {

    T create();


}

{% endcodeblock %}

{% codeblock title:GenericFatory.java lang:java %}

public class GenericFatory<T> implements Factory<T> {

    private final Constructor<T> ctor;

    public GenericFatory(Class<T> clazz) {
        try {
            ctor = clazz.getConstructor();
        } catch (Exception e) {
            throw new IllegalArgumentException("Unable to retrieve a zero " +
                    "argument constructor for the given type.", e);
        }
    }

    @Override
    public T create() {
        try {
            return ctor.newInstance();
        } catch (Exception e) {
            throw new IllegalStateException("Unable to reflectively " +
                    "instantiate a new instance.", e);
        }
    }


}

{% endcodeblock %}

## The Problem

The above looks like a great solution to the boilerplate alternative of creating 
a factory for every type that you might need a factory for. For a messaging 
layer where instances of a message type are instantiated based on a type ID in 
the message's serialized form, littering your code base with factories that 
look like:

{% codeblock title:WidgetFactory.java lang:java %}

public class WidgetMessageFactory implements Factory<WidgetMessage> {

    @Override
    public WidgetMessage create() {
        return new WidgetMessage();
    }


}

{% endcodeblock %}

for every message type isn't an appealing proposition from either a maintenance
or a readability standpoint. However, that's exactly what you would do for
latency critical applications, as reflection comes at a price. Reflection in
modern java has little overhead once JIT kicks in; most of the articles floating
around calling reflection "expensive" while discussing a 10x to 100x performance
overhead pertain to the dark days before reflection underwent heavy
optimization. That said, there's almost always some inefficiency in the form of
indirection and extra instructions. When performance really matters, even a few
percent worth of "convenience" overhead on a hot path isn't acceptable, so we're
back to square one. Automated source code generation as part of the build
process eases the pain of typing boilerplate for problems like this but fails to
address code base clutter and maintainability concerns.

## Run Time Code Generation

Can we have our metaprogramming cake and eat it too? In java (and most VM based
languages) the answer is yes. As java loads classes dynamically at run time we
can generate a class on the fly, instantiate an instance of our new type, and
proceed with business as usual. There's no overhead assuming that the generated
class contains bytecode similar to what **javac** would generate. Class loaders
are agnostic to their source; at the end of the day, all classes are read as a
stream of bytes. Generating a class on the fly and loading it isn't cheap, but
for use cases where this happens once as part of an initialization procedure, 
code generation offers gains.

Short of dealing with the java class file format directly several fantastic
libraries exist to do the heavy lifting.  On the lowest level
[BECL](http://commons.apache.org/proper/commons-bcel/) and
[ASM](http://asm.ow2.org/) allow for fine grained control over code generation
while [javassist](http://www.csg.ci.i.u-tokyo.ac.jp/~chiba/javassist/) and
[cglib](http://cglib.sourceforge.net/) work with heavy layers of abstraction. I
chose javassist for this example as the task at hand doesn't require anything
fancy and javassist's ability to process embedded snippets of java keeps
things simple. That said, documentation on javassist is a little lean.

{% codeblock title:FactoryGenerator.java lang:java %}

package codegen;

import javassist.ClassPool;
import javassist.CtClass;
import javassist.CtConstructor;
import javassist.CtMethod;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Creates an object factory for a given {@link Class} type using runtime code
 * generation. The factory object returned will invoke the given type's zero
 * argument constructor to return a new instance.
 *
 * @author Kelly Littlepage
 */
public class FactoryGenerator {

    /***
     * Used to guarantee the uniqueness of generated class names.
     */
    private static final AtomicInteger COUNTER = new AtomicInteger();

    /***
     * The class pool to use for all generated classes
     */
    private static final ClassPool CLASS_POOL = ClassPool.getDefault();

    private static final CtClass[] NO_ARGS = {};

    /***
     * Cache generated factories for future use.
     */
    private static final ConcurrentHashMap<Class<?>, Factory<?>>
            CLASS_FACTORY_MAP = new ConcurrentHashMap<>();

    /***
     * Gets or creates an instance of {@link Factory} for the given type.
     *
     *
     * @param clazz The {@link Class} of the object that the generated
     * {@link Factory} should return upon a call to {@link Factory#create()}.
     *
     * @return An instance of {@link Factory} for the given {@link Class}.
     */
    public static <T> Factory getFactory(Class<T> clazz) {
        Factory factory = CLASS_FACTORY_MAP.get(clazz);
        // We may end up recreating a factory if two threads call this method
        // at the same time. Doing so isn't an issue - we just end up
        // doing a little extra work for the corner case while providing lock
        // free reads under most circumstances.
        if(null == factory) {
            factory = createFactory(clazz);
            // Let the first write win
            final Factory previousFactory = CLASS_FACTORY_MAP.
                    putIfAbsent(clazz, factory);
            factory = null == previousFactory ? factory : previousFactory;
        }
        return factory;
    }

    @SuppressWarnings("unchecked")
    private static <T> Factory<T> createFactory(Class<T> clazz) {
        try {
            // Check that the class has a default zero argument constructor
            clazz.getConstructor();
        } catch (Exception e) {
            throw new IllegalArgumentException("No default constructor for " +
                    "the given class.");
        }
        try {
            final CtClass factoryClazz = CLASS_POOL.makeClass(
                    nameForType(clazz));

            factoryClazz.addInterface(
                    CLASS_POOL.get(Factory.class.getCanonicalName()));

            // Add a default, zero argument constructor to the generated class.
            final CtConstructor cons = new CtConstructor(NO_ARGS, factoryClazz);
            cons.setBody(";");
            factoryClazz.addConstructor(cons);

            // Implement the Factory#create() method. Note that the return type
            // is Object. Due to erasure the JVM doesn't take into account type
            // parameters at runtime, so the erasure signature of
            // Factory#create() returns Object.
            final CtMethod factoryMethod = CtMethod.make(
                    "public Object create() { return new " +
                            clazz.getCanonicalName() + "(); }", factoryClazz);
            factoryClazz.addMethod(factoryMethod);

            final Class<?> generated = factoryClazz.toClass();

            // Free the generated CtClass object from the pool. This will will
            // reduce our memory footprint as we won't be reusing the instance
            // in the future.
            factoryClazz.detach();
            return (Factory<T>) generated.newInstance();
        } catch (Exception e) {
            throw new RuntimeException(
                    "Unable to generate a proxy factory.", e);
        }
    }

    /***
     * Generate a unique name for the given class type.
     *
     * @param clazz The {@link Class} to generate a name for.
     *
     * @return A unique name for the given class type.
     */
    private static String nameForType(Class<?> clazz) {
        final StringBuilder sb = new StringBuilder(Factory.class.
                getCanonicalName());
        sb.append("$impl_");
        sb.append(clazz.getCanonicalName());
        sb.append("_");
        sb.append(COUNTER.getAndIncrement());
        return sb.toString();
    }

    private FactoryGenerator() {
        throw new IllegalAccessError("Uninstantiable class.");
    }


}


{% endcodeblock %}

The magic happens in the **#createFactory()** - the rest is 
boilerplate to generate unique class names and cache factories for future use 
if another factory is requested for the same type.

The generated code (with a little help from **javap**) looks like:

{% codeblock title:FactoryGenerator.java lang:java %}

public class codegen.Factory$impl_codegen.Main.TestClass_0 implements codegen.Factory {
  public codegen.Factory$impl_codegen.Main.TestClass_0();
    Code:
       0: aload_0       
       1: invokespecial #12                 // Method java/lang/Object."<init>":()V
       4: return        

  public java.lang.Object create();
    Code:
       0: new           #16                 // class codegen/Main$TestClass
       3: dup           
       4: invokespecial #17                 // Method codegen/Main$TestClass."<init>":()V
       7: areturn       
}

{% endcodeblock %}

This is exactly what we would expect - four instructions in which an object 
is allocated, initialized, and returned. Let's look at what javac produces for 
a factory generated at compile time:

{% codeblock title:FactoryGenerator.java lang:java %}

Compiled from "TestClassFactory.java"
public class codegen.TestClassFactory implements codegen.Factory<codegen.TestClass> {
  public codegen.TestClassFactory();
    Code:
       0: aload_0       
       1: invokespecial #1                  // Method java/lang/Object."<init>":()V
       4: return        

  public codegen.TestClass create();
    Code:
       0: new           #2                  // class codegen/TestClass
       3: dup           
       4: invokespecial #3                  // Method codegen/TestClass."<init>":()V
       7: areturn       

  public java.lang.Object create();
    Code:
       0: aload_0       
       1: invokevirtual #4                  // Method create:()Lcodegen/TestClass;
       4: areturn       
}


{% endcodeblock %}

This code looks strange - two methods with the same signature and different
return types, as writing a class with such method declarations is illegal under
the [Java 7 Language Specification
(JLS)](http://docs.oracle.com/javase/specs/jls/se7/jls7.pdf). However, the
[Java 7 VM Spec (JVMS)](http://docs.oracle.com/javase/specs/jvms/se7/jvms7.pdf)
contains no such restriction. Section 4.3.4 discusses signatures and the 
class file format for encoding information on generic and parameterized types. 
The JVM doesn't use this information, and as noted in the last paragraph:

> Oracle's Java Virtual Machine implementation does not check the well-formedness of the
> signatures described in this subsection during loading or linking. Instead, these checks are
> deferred until the signatures are used by reflective methods, as specified in the API of
> Class and members of java.lang.reflect. Future versions of a Java Virtual Machine
> implementation may be required to perform some or all of these checks during loading or
> linking.

Given the above, javac is free to do as it pleases, provided that input complies
with the JLS. Having two methods with the same return type doesn't hurt anything
provided that the compiler is smart enough to figure out the appropriate call
site bindings and that the reflective capabilities of the runtime can handle
the identical signatures (which they do, by preferring the method with the
stronger return type when methods are queried for by name).

There's some history here as generics were added with the goal of backward
compatibility and as few changes to the runtime as possible. As such javac
generates both methods and decides which method to call at compile time based
upon available type information. It might be tempting to code generate the
specific type but doing so will get you an AbstractMethodError at run time. The
JVM doesn't know anything about our generic type so when referenced by
interface it looks for a method on our generated class with the signature
**create()Ljava/lang/Object**.

## Results

How well are we rewarded for the extra effort? Running a benchmark timing
100,000,000 calls to Factory#create() yielded:

+ **Direct instantiation**: Elapsed time: 10.50, ops/sec: 9,523,435.70
+ **Code Generation**: Elapsed time: 10.44, ops/sec: 9,579,994.46
+ **Reflection**: Elapsed time: 11.46, ops/sec: 8,726,687.95

Each benchmark was run in isolation on a warmed up JVM pinned to a single core
on the Linux 3.10 kernel. Even with the aforementioned there's still enough
randomness to a microbenchmark that code generation comes out on top of direct
instantiation -- in reality there's zero difference. However, code generation
enjoys a stable 10% edge over reflection. The two takeaways are that: 1)
reflection on modern java is pretty solid and 2) if you really care, code
generation clears the pathway to clean architecture with zero performance 
compromises.
