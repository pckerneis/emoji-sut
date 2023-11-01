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

interface Parent {
  children: {[name: string]: PageObject};
}

function hasChildren(object: any): object is Parent {
  return object.children != null && typeof object.children === 'object';
}

type PageObject = Selectable & Partial<Parent>;
// TODO : type PageObject = (Selectable & Partial<Parent>) | Selector;

interface Party {
  select: () => void;
}

interface SentenceContext {
  pageObjects: {[name: string]: PageObject};
  parties: Party[];
}

interface PageObjectAccessors {
  [name: string]: ExtendedSentence;
}

type ExtendedSentence = Sentence & PageObjectAccessors;

function resolveSelector(child: Selectable & Partial<Parent>, sentence: Sentence | ExtendedSentence): Sentence | ExtendedSentence | Function {
  if (typeof child.selector === 'function') {
    return (...args) => {
      sentence.selectorArgs.set(child, args);
      sentence.currentObject = child;
      return proxify(sentence);
    };
  } else {
    sentence.currentObject = child;
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
            return resolveSelector(child, sentence);
          }
        }

        // Resolve from current object's siblings
        const hierarchy = sentence.hierarchyByObject.get(sentence.currentObject);
        const parent = hierarchy[hierarchy.length - 2];

        if (parent && hasChildren(parent)) {
          if (Object.prototype.hasOwnProperty.call(parent.children, name)) {
            const sibling = parent.children[name];
            return resolveSelector(sibling, sentence);
          }
        }
      }

      // Resolve from root
      if (Object.prototype.hasOwnProperty.call(sentence.sentenceContext.pageObjects, name)) {
        const rootObject = sentence.sentenceContext.pageObjects[name];
        return resolveSelector(rootObject, sentence);
      }

      return target[name];
    },
  });
}

export default class Sentence {
  currentParty: Party;
  currentObject: PageObject;
  hierarchyByObject: Map<PageObject, PageObject[]> = new Map();
  selectorArgs: Map<PageObject, any[]> = new Map();

  constructor(public readonly sentenceContext: SentenceContext,
              public readonly adapter: Adapter) {
    Object.keys(sentenceContext.pageObjects).forEach((name) => {
      const pageObject = sentenceContext.pageObjects[name];
      this.hierarchyByObject.set(pageObject, [pageObject]);

      if (hasChildren(pageObject)) {
        this.visitChildren(pageObject, [pageObject]);
      }
    });
  }

  private visitChildren(parent: Parent, path: PageObject[]) {
    Object.keys(parent.children).forEach((name) => {
      const child = parent.children[name];
      this.hierarchyByObject.set(child, [...path, child]);

      if (hasChildren(child)) {
        this.visitChildren(child, [...path, child]);
      }
    });
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
        .select(this.buildPath())
        .should(...args);
    return proxify(this);
  }

  hasText(expectedText: string): ExtendedSentence {
    return this.should('have.text', expectedText);
  }

  typeText(text: string): ExtendedSentence {
    this.adapter
        .select(this.buildPath())
        .type(text);
    return proxify(this);
  }

  click(): ExtendedSentence {
    this.adapter
        .select(this.buildPath())
        .click();
    return proxify(this);
  }

  private buildPath(): string[] {
    return this.hierarchyByObject.get(this.currentObject).map((object) => {
      if (typeof object.selector === 'function') {
        return object.selector(...this.selectorArgs.get(object));
      } else {
        return object.selector;
      }
    });
  }
}
