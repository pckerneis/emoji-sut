/**
 * @type Adapter
 */
const cyAdapter = {
  visit: (url) => {
    cy.visit(url);
  },
  select: (path) => {
    cy.log(`selecting ${path}`);
    const [root, ...rest] = path;
    return rest.reduce((acc, curr) => acc.find(curr), cy.get(root));
  },
};

exports.default = cyAdapter;