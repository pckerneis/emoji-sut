export type Selector = string | ((...args) => string);

export interface Selectable {
  selector: Selector;
}

export interface Parent<T> {
  children: { [name: string]: T };
}

export function hasChildren(object: any): object is Parent<any> {
  return object.children != null && typeof object.children === 'object';
}

export type PageObjectNodeDef =
  | (Selectable & Partial<Parent<PageObjectNodeDef>>)
  | Selector;

interface WithPath {
  path: string[];
}

export type PageObjectNode = Selectable &
  Partial<Parent<PageObjectNode>> &
  WithPath;

export function transformToPageObjectNodeTree(
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
    const children = treeDef.children;
    return {
      ...treeDef,
      path,
      children: children
        ? Object.keys(children).reduce((acc, name) => {
            acc[name] = transformToPageObjectNodeTree(children[name], [
              ...path,
              name,
            ]);
            return acc;
          }, {})
        : {},
    };
  }
}
