/**
 * Service Factory Pattern
 * 
 * This factory eliminates the repetitive singleton boilerplate pattern
 * used across multiple services in the codebase.
 * 
 * Usage:
 *   const someService = ServiceFactory.create(SomeService);
 *   const anotherService = ServiceFactory.create(AnotherService);
 */

export class ServiceFactory {
  private static services = new Map<string, any>();
  private static serviceConstructors = new Map<string, new () => any>();

  /**
   * Create or get an instance of a service
   * @param ServiceClass The service class to instantiate
   * @returns The singleton instance of the service
   */
  static create<T>(ServiceClass: new () => T): T {
    const key = ServiceClass.name;
    
    if (!this.services.has(key)) {
      // Store the constructor for potential cleanup
      this.serviceConstructors.set(key, ServiceClass);
      
      // Create the instance
      const instance = new ServiceClass();
      this.services.set(key, instance);
      
      console.log(`🔧 ServiceFactory: Created instance of ${key}`);
    }
    
    return this.services.get(key);
  }

  /**
   * Get an existing service instance without creating a new one
   * @param ServiceClass The service class
   * @returns The existing instance or null if not created
   */
  static get<T>(ServiceClass: new () => T): T | null {
    const key = ServiceClass.name;
    return this.services.get(key) || null;
  }

  /**
   * Check if a service instance exists
   * @param ServiceClass The service class
   * @returns True if the service instance exists
   */
  static has<T>(ServiceClass: new () => T): boolean {
    const key = ServiceClass.name;
    return this.services.has(key);
  }

  /**
   * Destroy a service instance
   * @param ServiceClass The service class
   */
  static destroy<T>(ServiceClass: new () => T): void {
    const key = ServiceClass.name;
    
    if (this.services.has(key)) {
      const instance = this.services.get(key);
      
      // Call cleanup method if it exists
      if (typeof instance.cleanup === 'function') {
        instance.cleanup();
      }
      
      this.services.delete(key);
      this.serviceConstructors.delete(key);
      
      console.log(`🗑️ ServiceFactory: Destroyed instance of ${key}`);
    }
  }

  /**
   * Destroy all service instances
   */
  static destroyAll(): void {
    const serviceNames = Array.from(this.services.keys());
    
    for (const serviceName of serviceNames) {
      const instance = this.services.get(serviceName);
      
      // Call cleanup method if it exists
      if (typeof instance.cleanup === 'function') {
        instance.cleanup();
      }
    }
    
    this.services.clear();
    this.serviceConstructors.clear();
    
    console.log(`🗑️ ServiceFactory: Destroyed all service instances`);
  }

  /**
   * Get all registered service names
   * @returns Array of service names
   */
  static getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get service instance count
   * @returns Number of active service instances
   */
  static getInstanceCount(): number {
    return this.services.size;
  }
}

/**
 * Decorator for automatic service registration
 * This can be used to mark classes that should be managed by the ServiceFactory
 */
export function Service(target: any) {
  // Store the original constructor
  const originalConstructor = target;
  
  // Return a new constructor that uses the ServiceFactory
  return class extends originalConstructor {
    static getInstance() {
      return ServiceFactory.create(originalConstructor);
    }
  };
}

/**
 * Base service class that provides common functionality
 */
export abstract class BaseService {
  protected serviceName: string;
  
  constructor() {
    this.serviceName = this.constructor.name;
  }
  
  /**
   * Cleanup method that can be overridden by services
   */
  cleanup(): void {
    console.log(`🧹 ${this.serviceName}: Cleanup called`);
  }
  
  /**
   * Get the service name
   */
  getServiceName(): string {
    return this.serviceName;
  }
}
