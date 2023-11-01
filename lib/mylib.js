"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
function hasChildren(object) {
    return object.children != null && typeof object.children === 'object';
}
function resolveSelector(child, sentence, path) {
    if (typeof child.selector === 'function') {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            sentence.selectorArgs.set(path.join(), args);
            return proxify(sentence);
        };
    }
    else {
        return proxify(sentence);
    }
}
// Returning `any` here because TS doen't want me to be more specific
function proxify(sentence) {
    return new Proxy(sentence, {
        get: function (target, name) {
            if (sentence.currentObject != null) {
                // Resolve from current object's children
                if (hasChildren(sentence.currentObject)) {
                    if (Object.prototype.hasOwnProperty.call(sentence.currentObject.children, name)) {
                        var child = sentence.currentObject.children[name];
                        var path = __spreadArray(__spreadArray([], sentence.currentObjectPath, true), [name], false);
                        sentence.currentObjectPath = path;
                        return resolveSelector(child, sentence, path);
                    }
                }
                // Resolve from current object's siblings
                console.log('\nResolve from current object\'s siblings', sentence.currentObjectPath, name);
                var hierarchy = __spreadArray([], sentence.currentObjectPath, true);
                hierarchy.pop();
                var parent_1 = sentence.resolveNode(hierarchy);
                console.log('hierarchy', hierarchy);
                console.log('parent', parent_1);
                if (parent_1 && hasChildren(parent_1)) {
                    if (Object.prototype.hasOwnProperty.call(parent_1.children, name)) {
                        var path = __spreadArray(__spreadArray([], hierarchy, true), [name], false);
                        sentence.currentObjectPath = path;
                        var sibling = parent_1.children[name];
                        return resolveSelector(sibling, sentence, path);
                    }
                }
            }
            // Resolve from root
            if (Object.prototype.hasOwnProperty.call(sentence.sentenceContext.pageObjects, name)) {
                var rootObject = sentence.sentenceContext.pageObjects[name];
                var path = [name];
                sentence.currentObjectPath = path;
                return resolveSelector(rootObject, sentence, path);
            }
            return target[name];
        },
    });
}
function transformToPageObjectNodeTree(treeDef, path) {
    if (typeof treeDef === 'string') {
        return {
            selector: treeDef,
            path: path,
        };
    }
    else if (typeof treeDef === 'function') {
        return {
            selector: treeDef,
            path: path,
        };
    }
    else {
        return __assign(__assign({}, treeDef), { path: path, children: treeDef.children ? Object.keys(treeDef.children).reduce(function (acc, name) {
                acc[name] = transformToPageObjectNodeTree(treeDef.children[name], __spreadArray(__spreadArray([], path, true), [name], false));
                return acc;
            }, {}) : {} });
    }
}
var Sentence = /** @class */ (function () {
    function Sentence(sentenceContext, adapter) {
        var _this = this;
        this.sentenceContext = sentenceContext;
        this.adapter = adapter;
        this.currentObjectPath = [];
        this.selectorArgs = new Map();
        this.as = function (party) {
            if (typeof party === 'string') {
                _this.currentParty = _this.findParty(party);
            }
            else {
                _this.currentParty = party;
            }
            // TODO
            // this.currentTarget = this.currentParty;
            return proxify(_this);
        };
        sentenceContext.pageObjects = Object.keys(sentenceContext.pageObjects).reduce(function (acc, name) {
            var nodeDef = sentenceContext.pageObjects[name];
            acc[name] = transformToPageObjectNodeTree(nodeDef, [name]);
            return acc;
        }, {});
    }
    Object.defineProperty(Sentence.prototype, "currentObject", {
        get: function () {
            var currentObject = null;
            for (var _i = 0, _a = this.currentObjectPath; _i < _a.length; _i++) {
                var name_1 = _a[_i];
                if (currentObject == null) {
                    currentObject = this.sentenceContext.pageObjects[name_1];
                }
                else {
                    currentObject = currentObject.children[name_1];
                }
            }
            return currentObject;
        },
        enumerable: false,
        configurable: true
    });
    Sentence.given = function (sentenceContext, adapter) {
        var sentence = new Sentence(sentenceContext, adapter);
        return proxify(sentence);
    };
    Object.defineProperty(Sentence.prototype, "when", {
        get: function () {
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "then", {
        get: function () {
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Sentence.prototype.findParty = function (name) {
        return this.sentenceContext.parties[name];
    };
    Object.defineProperty(Sentence.prototype, "I", {
        get: function () {
            // TODO
            // this.currentTarget = this.currentParty;
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "it", {
        get: function () {
            // TODO
            // this.currentTarget = this.currentObject;
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "and", {
        get: function () {
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Sentence.prototype.visit = function (url) {
        this.adapter.visit(url);
        return proxify(this);
    };
    Object.defineProperty(Sentence.prototype, "isVisible", {
        get: function () {
            return this.should('be.visible');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "isNotVisible", {
        get: function () {
            return this.should('not.be.visible');
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "doesNotExist", {
        get: function () {
            return this.should('not.exist');
        },
        enumerable: false,
        configurable: true
    });
    Sentence.prototype.should = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        (_a = this.adapter
            .select(this.flattenSelectors()))
            .should.apply(_a, args);
        return proxify(this);
    };
    Sentence.prototype.hasText = function (expectedText) {
        return this.should('have.text', expectedText);
    };
    Sentence.prototype.typeText = function (text) {
        this.adapter
            .select(this.flattenSelectors())
            .type(text);
        return proxify(this);
    };
    Sentence.prototype.click = function () {
        this.adapter
            .select(this.flattenSelectors())
            .click();
        return proxify(this);
    };
    Sentence.prototype.resolveNode = function (path) {
        var node = null;
        for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
            var name_2 = path_1[_i];
            if (node == null) {
                node = this.sentenceContext.pageObjects[name_2];
            }
            else {
                node = node.children[name_2];
            }
        }
        return node;
    };
    Sentence.prototype.flattenSelectors = function () {
        var selectors = [];
        var path = [];
        var node = null;
        console.log('\nflattenSelectors', this.currentObjectPath);
        for (var _i = 0, _a = this.currentObjectPath; _i < _a.length; _i++) {
            var name_3 = _a[_i];
            path.push(name_3);
            console.log('path', path);
            if (node == null) {
                node = this.sentenceContext.pageObjects[name_3];
                console.log('node', node);
                selectors.push(this.flattenSelector(node.selector, path));
            }
            else {
                node = node.children[name_3];
                console.log('node', node);
                selectors.push(this.flattenSelector(node.selector, path));
            }
        }
        return selectors;
    };
    Sentence.prototype.flattenSelector = function (selector, path) {
        if (typeof selector === 'function') {
            return selector.apply(void 0, this.selectorArgs.get(path.join()));
        }
        else {
            return selector;
        }
    };
    return Sentence;
}());
exports.default = Sentence;
