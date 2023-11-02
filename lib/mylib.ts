// TODO
//  - Split code into multiple files
//  - Add tests
//  - Better error reporting (e.g. state machine for expected fragments)
//  - Report dangling queued actions (add a "finisher" to be called in afterEach hooks)
//  - Add more actions
//  - Add more assertions
//  - Add more adapters
//  - Documentation
//  - Examples

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
  children: { [name: string]: T };
}

function hasChildren(object: any): object is Parent<any> {
  return object.children != null && typeof object.children === 'object';
}

type PageObjectNodeDef =
  | (Selectable & Partial<Parent<PageObjectNodeDef>>)
  | Selector;

interface WithPath {
  path: string[];
}

type PageObjectNode = Selectable & Partial<Parent<PageObjectNode>> & WithPath;

interface Party {
  [name: string]: any;
}

interface SentenceContext {
  pageObjects: { [name: string]: PageObjectNode };
  parties: { [name: string]: Party };
}

interface SentenceContextDef {
  pageObjects: { [name: string]: PageObjectNodeDef };
  parties: { [name: string]: Party };
}

interface PageObjectAccessors {
  [name: string]: ExtendedSentence;
}

type ExtendedSentence = Sentence & PageObjectAccessors;

function resolveSelector(
  child: Selectable & Partial<Parent<PageObjectNode>>,
  sentence: Sentence | ExtendedSentence,
  path: string[],
): Sentence | ExtendedSentence | Function {
  if (typeof child.selector === 'function') {
    return (...args) => {
      sentence.selectorArgs.set(path.join(), args);
      return proxify(sentence);
    };
  } else {
    return proxify(sentence);
  }
}

// Returning `any` here because TS doesn't want me to be more specific
function proxify(sentence: ExtendedSentence | Sentence): any {
  return new Proxy(sentence, {
    get: (target, name: string) => {
      if (sentence.currentObject != null) {
        // Resolve from current object's children
        if (hasChildren(sentence.currentObject)) {
          if (
            Object.prototype.hasOwnProperty.call(
              sentence.currentObject.children,
              name,
            )
          ) {
            const child = sentence.currentObject.children[name];
            const path = [...sentence.currentObjectPath, name];
            sentence.currentObjectPath = path;
            return resolveSelector(child, sentence, path);
          }
        }

        // Resolve from current object's siblings
        const hierarchy = [...sentence.currentObjectPath];
        hierarchy.pop();
        const parent = resolveNode(hierarchy, sentence.sentenceContext);

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
      if (
        Object.prototype.hasOwnProperty.call(
          sentence.sentenceContext.pageObjects,
          name,
        )
      ) {
        const rootObject = sentence.sentenceContext.pageObjects[name];
        const path = [name];
        sentence.currentObjectPath = path;
        return resolveSelector(rootObject, sentence, path);
      }

      if (name in target) {
        return target[name];
      }

      throw new Error(`Could not resolve "${name}". Current object path is "${sentence.currentObjectPath.join(' > ')}".`);
    },
  });
}

function resolveNode(
  path: string[],
  sentenceContext: SentenceContext,
): PageObjectNode {
  let node = null;

  for (const name of path) {
    if (node == null) {
      node = sentenceContext.pageObjects[name];
    } else {
      node = node.children[name];
    }
  }

  return node;
}

function transformToPageObjectNodeTree(
  treeDef: PageObjectNodeDef,
  path: string[],
): PageObjectNode {
  if (typeof treeDef === 'string') {
    return {
      selector: treeDef,
      path,
    };
  } else if (typeof treeDef === 'function') {
    return {
      selector: treeDef,
      path,
    };
  } else {
    return {
      ...treeDef,
      path,
      children: treeDef.children
        ? Object.keys(treeDef.children).reduce((acc, name) => {
            acc[name] = transformToPageObjectNodeTree(treeDef.children[name], [
              ...path,
              name,
            ]);
            return acc;
          }, {})
        : {},
    };
  }
}

enum ActionKind {
  click,
  type,
}

interface BaseAction {
  readonly kind: ActionKind;
}

interface ClickAction extends BaseAction {
  readonly kind: ActionKind.click;
}

interface TypeAction extends BaseAction {
  readonly kind: ActionKind.type;
}

type Action = TypeAction | ClickAction;

export default class Sentence {
  readonly sentenceContext: SentenceContext;
  currentParty: Party;
  currentObjectPath: string[] = [];
  selectorArgs: Map<string, any[]> = new Map();
  queuedAction: Action = null;

  /** Returns the currently selected PageObjectNode */
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

  constructor(
    sentenceContext: SentenceContextDef,
    public readonly adapter: Adapter,
  ) {
    this.sentenceContext = {
      parties: { ...sentenceContext.parties },
      pageObjects: Object.keys(sentenceContext.pageObjects).reduce(
        (acc, name) => {
          const nodeDef: PageObjectNodeDef = sentenceContext.pageObjects[name];
          acc[name] = transformToPageObjectNodeTree(nodeDef, [name]);
          return acc;
        },
        {},
      ),
    };
  }

  /**
   * Creates a new sentence with a given context and adapter
   * @param sentenceContext - The context of the sentence, defining the available Page Objects and the Parties
   * @param adapter - The adapter to use for interacting with the application
   */
  public static given(
    sentenceContext: SentenceContextDef,
    adapter: Adapter,
  ): ExtendedSentence {
    const sentence = new Sentence(sentenceContext, adapter);
    return proxify(sentence);
  }

  /**
   * Syntax element usually used to mark a precondition or a user action.
   * If there's a queued action, it will be performed before the next action.
   */
  get when(): ExtendedSentence {
    this.performQueuedAction();
    return proxify(this);
  }
  /**
   * Syntax element usually used to mark an assertion.
   * If there's a queued action, it will be performed before the next action.
   */
  get then(): ExtendedSentence {
    this.performQueuedAction();
    return proxify(this);
  }

  /**
   * Switches the current party to the given one.
   * @param party - The party to switch to. Can be either a string (party name) or a Party object.
   */
  as: (party: Party | string) => ExtendedSentence = (party: Party | string) => {
    if (typeof party === 'string') {
      this.currentParty = this.findParty(party);
    } else {
      this.currentParty = party;
    }

    // TODO
    // this.currentTarget = this.currentParty;
    this.performQueuedAction();
    return proxify(this);
  };

  /**
   * Set the current target to the current party.
   */
  get I(): ExtendedSentence {
    // TODO
    // this.currentTarget = this.currentParty;
    return proxify(this);
  }

  /** Set the current target to the current object. */
  get it(): ExtendedSentence {
    // TODO
    // this.currentTarget = this.currentObject;
    return proxify(this);
  }

  /**
   * Syntax element to chain multiple actions or assertions.
   * If there's a queued action, it will be performed before the next action.
   */
  get and(): ExtendedSentence {
    this.performQueuedAction();
    return proxify(this);
  }

  /**
   * Assertion to check if the current object is visible.
   */
  isVisible(): ExtendedSentence {
    return this.should('be.visible');
  }

  /**
   * Assertion to check if the current object is not visible.
   */
  isNotVisible(): ExtendedSentence {
    return this.should('not.be.visible');
  }

  /**
   * Assertion to check if the current object does not exist.
   */
  doesNotExist(): ExtendedSentence {
    return this.should('not.exist');
  }

  // TODO this should be a Cypress specific assertion
  should(...args): ExtendedSentence {
    this.adapter.select(this.flattenSelectors()).should(...args);
    return proxify(this);
  }

  /**
   * Assertion to check if the current object has a given text.
   * @param expectedText - The expected text
   */
  hasText(expectedText: string): ExtendedSentence {
    return this.should('have.text', expectedText);
  }

  // Actions

  /**
   * Action to visit a given URL.
   * @param url
   */
  visit(url: string): ExtendedSentence {
    this.adapter.visit(url);
    return proxify(this);
  }

  /**
   * Queues an action to type into the current object.
   * Next fragments should be the target object (with `it` or a page object selector)
   * and the text to type (with `text`).
   */
  get typeInto(): ExtendedSentence {
    this.queuedAction = {
      kind: ActionKind.type,
    };
    return proxify(this);
  }

  /**
   * Action to click on the current object.
   */
  clickOn(): ExtendedSentence {
    this.queuedAction = { kind: ActionKind.click };
    return proxify(this);
  }

  // Action args

  /** Defines a text argument for actions such as `typeInto` */
  text(text: string): ExtendedSentence {
    this.selectorArgs.set(this.currentObjectPath.join(), [text]);
    return proxify(this);
  }

  /** Defines an argument for actions by looking into the current party's attributes */
  my(key: string): ExtendedSentence {
    if (!this.currentParty) {
      throw new Error(`No party selected`);
    }

    if (!Object.prototype.hasOwnProperty.call(this.currentParty, key)) {
      throw new Error(`Party does not have attribute "${key}"`);
    }

    this.selectorArgs.set(this.currentObjectPath.join(), [
      this.currentParty[key],
    ]);
    return proxify(this);
  }

  // Internal

  private findParty(name: string): Party {
    if (!this.sentenceContext.parties[name]) {
      throw new Error(`Party "${name}" does not exist`);
    }

    return this.sentenceContext.parties[name];
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

  private performQueuedAction(): void {
    if (this.queuedAction == null) {
      return;
    }

    switch (this.queuedAction.kind) {
      case ActionKind.click:
        this.click();
        break;
      case ActionKind.type:
        const text = this.selectorArgs.get(this.currentObjectPath.join())[0];
        this.typeText(text);
        break;
    }
    this.queuedAction = null;
  }

  private click(): ExtendedSentence {
    this.adapter.select(this.flattenSelectors()).click();
    return proxify(this);
  }

  private typeText(text: string): ExtendedSentence {
    this.adapter.select(this.flattenSelectors()).type(text);
    return proxify(this);
  }
}
