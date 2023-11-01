interface Adapter {
  visit: (url: string) => void;
  select: (path: string[]) => TestElement;
}

interface TestElement {
  should: (...args) => void;
  type: (text: string) => void;
  click(): void;
}

type Selector = string | ((...args) => string);

interface Selectable {
  selector: Selector;
}

interface Parent<T> {
  children: {[name: string]: T};
}

function hasChildren(object: any): object is Parent<any> {
  return object.children != null && typeof object.children === 'object';
}

type PageObjectNodeDef = Selectable & Partial<Parent<PageObjectNodeDef>> | Selector;

interface WithPath {
  path: string[];
}

type PageObjectNode = Selectable & Partial<Parent<PageObjectNode>> & WithPath;

interface Party {
  select: () => void;
}

interface SentenceContext {
  pageObjects: {[name: string]: PageObjectNode};
  parties: Party[];
}

interface PageObjectAccessors {
  [name: string]: ExtendedSentence;
}

type ExtendedSentence = Sentence & PageObjectAccessors;

function resolveSelector(child: Selectable & Partial<Parent<PageObjectNode>>,
                         sentence: Sentence | ExtendedSentence,
                         path: string[]): Sentence | ExtendedSentence | Function {
  if (typeof child.selector === 'function') {
    return (...args) => {
      sentence.selectorArgs.set(path.join(), args);
      return proxify(sentence);
    };
  } else {
    return proxify(sentence);
  }
}

// Returning `any` here because TS doen't want me to be more specific
function proxify(sentence: ExtendedSentence | Sentence): any {
  return new Proxy(sentence, {
    get: (target, name: string) => {
      if (sentence.currentObject != null) {
        // Resolve from current object's children
        if (hasChildren(sentence.currentObject)) {
          if (Object.prototype.hasOwnProperty.call(sentence.currentObject.children, name)) {
            const child = sentence.currentObject.children[name];
            const path = [...sentence.currentObjectPath, name];
            sentence.currentObjectPath = path;
            return resolveSelector(child, sentence, path);
          }
        }

        // Resolve from current object's siblings
        const hierarchy = [...sentence.currentObjectPath];
        hierarchy.pop();
        const parent = sentence.resolveNode(hierarchy);

        if (parent && hasChildren(parent)) {
          if (Object.prototype.hasOwnProperty.call(parent.children, name)) {
            const path = [...hierarchy, name];
            sentence.currentObjectPath = path;
            const sibling = parent.children[name];
            return resolveSelector(sibling, sentence, path);
          }
        }
      }

      // Resolve from root
      if (Object.prototype.hasOwnProperty.call(sentence.sentenceContext.pageObjects, name)) {
        const rootObject = sentence.sentenceContext.pageObjects[name];
        const path = [name];
        sentence.currentObjectPath = path;
        return resolveSelector(rootObject, sentence, path);
      }

      return target[name];
    },
  });
}

function transformToPageObjectNodeTree(treeDef: PageObjectNodeDef, path: string[]): PageObjectNode {
  if (typeof treeDef === 'string') {
    return {
      selector: treeDef,
      path,
    };
  } else if (typeof treeDef === 'function') {
    return {
      selector: treeDef,
      path,
    }
  } else {
    return {
      ...treeDef,
      path,
      children: treeDef.children ? Object.keys(treeDef.children).reduce((acc, name) => {
        acc[name] = transformToPageObjectNodeTree(treeDef.children[name], [...path, name]);
        return acc;
      }, {}) : {},
    };
  }
}

export default class Sentence {
  currentParty: Party;
  currentObjectPath: string[] = [];
  selectorArgs: Map<string, any[]> = new Map();

  get currentObject(): PageObjectNode {
    let currentObject = null;

    for (const name of this.currentObjectPath) {
      if (currentObject == null) {
        currentObject = this.sentenceContext.pageObjects[name];
      } else {
        currentObject = currentObject.children[name];
      }
    }

    return currentObject;
  }

  constructor(public readonly sentenceContext: SentenceContext,
              public readonly adapter: Adapter) {
    sentenceContext.pageObjects = Object.keys(sentenceContext.pageObjects).reduce((acc, name) => {
      const nodeDef: PageObjectNodeDef = sentenceContext.pageObjects[name];
      acc[name] = transformToPageObjectNodeTree(nodeDef, [name]);
      return acc;
    }, {});
  }
  public static given(sentenceContext: SentenceContext,
                      adapter: Adapter): ExtendedSentence {
    const sentence = new Sentence(sentenceContext, adapter);
    return proxify(sentence);
  }

  get when(): ExtendedSentence {
    return proxify(this);
  }

  get then(): ExtendedSentence {
    return proxify(this);
  }

  as: (party: Party | string) => ExtendedSentence = (party: Party | string) => {
    if (typeof party === 'string') {
      this.currentParty = this.findParty(party);
    } else {
      this.currentParty = party;
    }

    // TODO
    // this.currentTarget = this.currentParty;
    return proxify(this);
  }

  private findParty(name: string): Party {
    return this.sentenceContext.parties[name];
  }

  get I(): ExtendedSentence {
    // TODO
    // this.currentTarget = this.currentParty;
    return proxify(this);
  }

  get it(): ExtendedSentence {
    // TODO
    // this.currentTarget = this.currentObject;
    return proxify(this);
  }

  get and(): ExtendedSentence {
    return proxify(this);
  }

  visit(url: string): ExtendedSentence {
    this.adapter.visit(url);
    return proxify(this);
  }

  get isVisible(): ExtendedSentence {
    return this.should('be.visible');
  }

  get isNotVisible(): ExtendedSentence {
    return this.should('not.be.visible');
  }

  get doesNotExist(): ExtendedSentence {
    return this.should('not.exist');
  }

  should(...args): ExtendedSentence {
    this.adapter
        .select(this.flattenSelectors())
        .should(...args);
    return proxify(this);
  }

  hasText(expectedText: string): ExtendedSentence {
    return this.should('have.text', expectedText);
  }

  typeText(text: string): ExtendedSentence {
    this.adapter
        .select(this.flattenSelectors())
        .type(text);
    return proxify(this);
  }

  click(): ExtendedSentence {
    this.adapter
        .select(this.flattenSelectors())
        .click();
    return proxify(this);
  }

  resolveNode(path: string[]): PageObjectNode {
    let node = null;

    for (const name of path) {
      if (node == null) {
        node = this.sentenceContext.pageObjects[name];
      } else {
        node = node.children[name];
      }
    }

    return node;
  }

  private flattenSelectors(): string[] {
    const selectors: string[] = [];
    const path = [];

    let node = null;

    for (const name of this.currentObjectPath) {
      path.push(name);

      if (node == null) {
        node = this.sentenceContext.pageObjects[name];
        selectors.push(this.flattenSelector(node.selector, path));
      } else {
        node = node.children[name];
        selectors.push(this.flattenSelector(node.selector, path));
      }
    }

    return selectors;
  }

  private flattenSelector(selector: Selector, path: string[]): string {
    if (typeof selector === 'function') {
      return selector(...this.selectorArgs.get(path.join()));
    } else {
      return selector;
    }
  }
}
