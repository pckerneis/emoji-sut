import {
  hasChildren,
  PageObjectNode,
  Parent,
  Selectable,
} from './page-objects';
import Sentence from './mylib';
import { toPrettyPath } from './path';
import { resolveNode } from './context';

export interface PageObjectAccessors {
  [name: string]: ExtendedSentence;
}

export type ExtendedSentence = Sentence & PageObjectAccessors;

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
export function proxify(sentence: ExtendedSentence | Sentence): any {
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

      const prettyPath = toPrettyPath(sentence.currentObjectPath);
      throw new Error(
        `Could not resolve "${name}". Current object path is "${prettyPath}".`,
      );
    },
  });
}
