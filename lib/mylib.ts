interface Adapter {
  visit: (url: string) => void;
  select: (path: string[]) => TestElement;
}

interface TestElement {
  should: (...args) => void;
  type: (text: string) => void;
}

type Selector = string | ((...args) => string);

interface Selectable {
  selector: Selector;
}

interface Parent {
  children: {[name: string]: PageObject};
}

function hasChildren(object: any): object is Parent {
  return object.children != null;
}

type PageObject = Selectable & Partial<Parent>;

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

function proxify(sentence: Sentence) {
  return new Proxy(sentence, {
    get: (target: Sentence, name: string) => {
      if (sentence.currentObject != null && hasChildren(sentence.currentObject)) {
        if (sentence.currentObject.children != null) {
          if (Object.prototype.hasOwnProperty.call(sentence.currentObject.children, name)) {
            const child = sentence.currentObject.children[name];

            if (typeof child.selector === 'function') {
              return (...args) => {
                sentence.selectorArgs.set(child, args);
                sentence.currentObject = child;
                return proxify(sentence);
              };
            } else {
              sentence.currentObject = sentence.currentObject.children[name];
              return proxify(sentence);
            }
          }
        }
      }

      if (Object.prototype.hasOwnProperty.call(sentence.sentenceContext.pageObjects, name)) {
        sentence.currentObject = sentence.sentenceContext.pageObjects[name];
        return proxify(sentence);
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
    this.adapter
        .select(this.buildPath())
        .should('be.visible');
    return proxify(this);
  }

  should(...args): ExtendedSentence {
    this.adapter
        .select(this.buildPath())
        .should(...args);
    return proxify(this);
  }

  hasText(expectedText: string): ExtendedSentence {
    this.adapter
        .select(this.buildPath())
        .should('have.text', expectedText);
    return proxify(this);
  }

  typeText(text: string): ExtendedSentence {
    this.adapter
        .select(this.buildPath())
        .type(text);
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
