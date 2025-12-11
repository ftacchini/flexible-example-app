import "reflect-metadata";
import "jasmine";
import { container } from "tsyringe";
import * as fc from "fast-check";

/**
 * Property-based test for child container inheritance
 * **Property: Child container inheritance**
 * For any binding in parent container, it should be resolvable in child containers
 * **Validates: Requirements 3.2**
 */
describe("Child Container Inheritance Property Tests", () => {

    it("should resolve any parent binding in child containers", () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            fc.oneof(
                fc.string({ minLength: 1, maxLength: 50 }),
                fc.integer({ min: 1, max: 1000 }),
                fc.boolean(),
                fc.record({
                    id: fc.integer({ min: 1, max: 100 }),
                    name: fc.string({ minLength: 1, maxLength: 20 })
                })
            ),
            (tokenName, value) => {
                // Create parent container (using a child of global container for isolation)
                const parentContainer = container.createChildContainer();

                // Create a unique token for this test
                const token = Symbol(tokenName);

                // Register binding in parent container
                parentContainer.register(token, { useValue: value });

                // Create child container
                const childContainer = parentContainer.createChildContainer();

                // Verify child can resolve parent binding
                const resolvedValue = childContainer.resolve(token);

                // The resolved value should equal the original value
                expect(resolvedValue).toEqual(value);
            }
        ), { numRuns: 100 });
    });

    it("should resolve class bindings from parent in child containers", () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            (tokenName, className) => {
                // Create a simple test class
                class TestClass {
                    public readonly name: string;
                    constructor() {
                        this.name = className;
                    }
                }

                // Create parent container (using a child of global container for isolation)
                const parentContainer = container.createChildContainer();

                // Create a unique token for this test
                const token = Symbol(tokenName);

                // Register class binding in parent container
                parentContainer.register(token, { useClass: TestClass });

                // Create child container
                const childContainer = parentContainer.createChildContainer();

                // Verify child can resolve parent class binding
                const resolvedInstance = childContainer.resolve(token);

                // The resolved instance should be of the correct type
                expect(resolvedInstance).toBeInstanceOf(TestClass);
                expect((resolvedInstance as TestClass).name).toBe(className);
            }
        ), { numRuns: 100 });
    });

    it("should resolve factory bindings from parent in child containers", () => {
        fc.assert(fc.property(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
            fc.integer({ min: 1, max: 1000 }),
            (tokenName, factoryValue) => {
                // Create parent container (using a child of global container for isolation)
                const parentContainer = container.createChildContainer();

                // Create a unique token for this test
                const token = Symbol(tokenName);

                // Register factory binding in parent container
                parentContainer.register(token, {
                    useFactory: () => ({ value: factoryValue, created: true })
                });

                // Create child container
                const childContainer = parentContainer.createChildContainer();

                // Verify child can resolve parent factory binding
                const resolvedValue = childContainer.resolve(token);

                // The resolved value should match factory output
                expect(resolvedValue).toEqual({ value: factoryValue, created: true });
            }
        ), { numRuns: 100 });
    });
});