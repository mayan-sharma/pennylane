export class BaseStorage<T> {
  protected storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  protected safeGet(): T[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading from localStorage (${this.storageKey}):`, error);
      return [];
    }
  }

  protected safeSave(data: T[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving to localStorage (${this.storageKey}):`, error);
    }
  }

  getAll(): T[] {
    return this.safeGet();
  }

  add(item: T): void {
    const items = this.safeGet();
    items.push(item);
    this.safeSave(items);
  }

  update(id: string, updatedItem: T & { id: string }): void {
    const items = this.safeGet();
    const index = items.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      items[index] = updatedItem;
      this.safeSave(items);
    }
  }

  delete(id: string): void {
    const items = this.safeGet();
    const filteredItems = items.filter((item: any) => item.id !== id);
    this.safeSave(filteredItems);
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  findById(id: string): T | undefined {
    const items = this.safeGet();
    return items.find((item: any) => item.id === id);
  }

  findByField(field: keyof T, value: any): T[] {
    const items = this.safeGet();
    return items.filter((item: any) => item[field] === value);
  }

  exists(id: string): boolean {
    return !!this.findById(id);
  }

  count(): number {
    return this.safeGet().length;
  }

  bulkAdd(items: T[]): void {
    const existing = this.safeGet();
    existing.push(...items);
    this.safeSave(existing);
  }

  bulkDelete(ids: string[]): void {
    const items = this.safeGet();
    const filteredItems = items.filter((item: any) => !ids.includes(item.id));
    this.safeSave(filteredItems);
  }

  bulkUpdate(updates: { id: string; data: Partial<T> }[]): void {
    const items = this.safeGet();
    
    updates.forEach(({ id, data }) => {
      const index = items.findIndex((item: any) => item.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...data };
      }
    });
    
    this.safeSave(items);
  }
}