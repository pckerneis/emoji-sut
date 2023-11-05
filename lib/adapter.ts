export interface Adapter {
  visit: (url: string) => void;
  select: (path: string[]) => TestElement;
}

export interface TestElement {
  should: (...args) => void;
  type: (text: string) => void;
  click(): void;
}
