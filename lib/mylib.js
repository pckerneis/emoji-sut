"use strict";
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
function validateContextDefinition(sentenceContext) {
    if (sentenceContext.pageObjects == null) {
        throw new Error('Missing pageObjects');
    }
    Object.keys(sentenceContext.pageObjects).forEach(function (name) {
        validateNodeDefinition(name, [name], sentenceContext.pageObjects[name]);
    });
    if (sentenceContext.parties == null) {
        throw new Error('Missing parties');
    }
}
function toPrettyPath(path) {
    return path.join(' ');
}
function validateNodeDefinition(name, path, nodeDef) {
    validateNodeName(name, path);
    if (typeof nodeDef === 'string') {
        return;
    }
    if (typeof nodeDef === 'function') {
        return;
    }
    if (nodeDef.selector == null) {
        throw new Error("Missing selector for node at path \"".concat(toPrettyPath(path), "\""));
    }
    if (nodeDef.children != null) {
        Object.keys(nodeDef.children).forEach(function (name) {
            validateNodeDefinition(name, __spreadArray(__spreadArray([], path, true), [name], false), nodeDef.children[name]);
        });
    }
}
function validateNodeName(name, path) {
    if (name.includes(' ')) {
        throw new Error("Node name \"".concat(name, "\" contains spaces at path \"").concat(toPrettyPath(path), "\""));
    }
    // We technically could allow any valid JS identifier, but the check
    // is quite complex
    if (!name.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
        throw new Error("Node name \"".concat(name, "\" contains invalid characters at path \"").concat(toPrettyPath(path), "\""));
    }
    // We could also check for JS reserved words here, but the error would be
    // quickly detected by the user anyway
    if (isReservedWord(name)) {
        throw new Error("Node name \"".concat(name, "\" is a reserved word at path \"").concat(toPrettyPath(path), "\""));
    }
}
function isReservedWord(name) {
    // Dirty and inefficient check, but it's good enough for now and doesn't
    // risk to be out of sync
    var isSentenceMethod = Object.getOwnPropertyNames(Sentence.prototype).includes(name);
    if (isSentenceMethod) {
        return true;
    }
    return ['selector', 'children'].includes(name);
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
// Returning `any` here because TS doesn't want me to be more specific
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
                var hierarchy = __spreadArray([], sentence.currentObjectPath, true);
                hierarchy.pop();
                var parent_1 = resolveNode(hierarchy, sentence.sentenceContext);
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
            if (name in target) {
                return target[name];
            }
            var prettyPath = toPrettyPath(sentence.currentObjectPath);
            throw new Error("Could not resolve \"".concat(name, "\". Current object path is \"").concat(prettyPath, "\"."));
        },
    });
}
function resolveNode(path, sentenceContext) {
    var node = null;
    for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
        var name_1 = path_1[_i];
        if (node == null) {
            node = sentenceContext.pageObjects[name_1];
        }
        else {
            node = node.children[name_1];
        }
    }
    return node;
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
        return __assign(__assign({}, treeDef), { path: path, children: treeDef.children
                ? Object.keys(treeDef.children).reduce(function (acc, name) {
                    acc[name] = transformToPageObjectNodeTree(treeDef.children[name], __spreadArray(__spreadArray([], path, true), [
                        name,
                    ], false));
                    return acc;
                }, {})
                : {} });
    }
}
var ActionKind;
(function (ActionKind) {
    ActionKind[ActionKind["click"] = 0] = "click";
    ActionKind[ActionKind["type"] = 1] = "type";
})(ActionKind || (ActionKind = {}));
var Sentence = /** @class */ (function () {
    function Sentence(sentenceContext, adapter) {
        var _this = this;
        this.adapter = adapter;
        this.currentObjectPath = [];
        this.selectorArgs = new Map();
        this.queuedAction = null;
        /**
         * Switches the current party to the given one.
         * @param party - The party to switch to. Can be either a string (party name) or a Party object.
         */
        this.as = function (party) {
            if (typeof party === 'string') {
                _this.currentParty = _this.findParty(party);
            }
            else {
                _this.currentParty = party;
            }
            // TODO
            // this.currentTarget = this.currentParty;
            _this.performQueuedAction();
            return proxify(_this);
        };
        this.sentenceContext = {
            parties: __assign({}, sentenceContext.parties),
            pageObjects: Object.keys(sentenceContext.pageObjects).reduce(function (acc, name) {
                var nodeDef = sentenceContext.pageObjects[name];
                acc[name] = transformToPageObjectNodeTree(nodeDef, [name]);
                return acc;
            }, {}),
        };
    }
    Object.defineProperty(Sentence.prototype, "currentObject", {
        /** Returns the currently selected PageObjectNode */
        get: function () {
            var currentObject = null;
            for (var _i = 0, _a = this.currentObjectPath; _i < _a.length; _i++) {
                var name_2 = _a[_i];
                if (currentObject == null) {
                    currentObject = this.sentenceContext.pageObjects[name_2];
                }
                else {
                    currentObject = currentObject.children[name_2];
                }
            }
            return currentObject;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Creates a new sentence with a given context and adapter
     * @param sentenceContext - The context of the sentence, defining the available Page Objects and the Parties
     * @param adapter - The adapter to use for interacting with the application
     */
    Sentence.given = function (sentenceContext, adapter) {
        validateContextDefinition(sentenceContext);
        var sentence = new Sentence(sentenceContext, adapter);
        return proxify(sentence);
    };
    Object.defineProperty(Sentence.prototype, "when", {
        /**
         * Syntax element usually used to mark a precondition or a user action.
         * If there's a queued action, it will be performed before the next action.
         */
        get: function () {
            this.performQueuedAction();
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "then", {
        /**
         * Syntax element usually used to mark an assertion.
         * If there's a queued action, it will be performed before the next action.
         */
        get: function () {
            this.performQueuedAction();
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "I", {
        /**
         * Set the current target to the current party.
         */
        get: function () {
            // TODO
            // this.currentTarget = this.currentParty;
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "it", {
        /** Set the current target to the current object. */
        get: function () {
            // TODO
            // this.currentTarget = this.currentObject;
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Sentence.prototype, "and", {
        /**
         * Syntax element to chain multiple actions or assertions.
         * If there's a queued action, it will be performed before the next action.
         */
        get: function () {
            this.performQueuedAction();
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Assertion to check if the current object is visible.
     */
    Sentence.prototype.isVisible = function () {
        return this.should('be.visible');
    };
    /**
     * Assertion to check if the current object is not visible.
     */
    Sentence.prototype.isNotVisible = function () {
        return this.should('not.be.visible');
    };
    /**
     * Assertion to check if the current object does not exist.
     */
    Sentence.prototype.doesNotExist = function () {
        return this.should('not.exist');
    };
    // TODO this should be a Cypress specific assertion
    Sentence.prototype.should = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        (_a = this.adapter.select(this.flattenSelectors())).should.apply(_a, args);
        return proxify(this);
    };
    /**
     * Assertion to check if the current object has a given text.
     * @param expectedText - The expected text
     */
    Sentence.prototype.hasText = function (expectedText) {
        return this.should('have.text', expectedText);
    };
    // Actions
    /**
     * Action to visit a given URL.
     * @param url
     */
    Sentence.prototype.visit = function (url) {
        this.adapter.visit(url);
        return proxify(this);
    };
    Object.defineProperty(Sentence.prototype, "typeInto", {
        /**
         * Queues an action to type into the current object.
         * Next fragments should be the target object (with `it` or a page object selector)
         * and the text to type (with `text`).
         */
        get: function () {
            this.queuedAction = {
                kind: ActionKind.type,
            };
            return proxify(this);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Action to click on the current object.
     */
    Sentence.prototype.clickOn = function () {
        this.queuedAction = { kind: ActionKind.click };
        return proxify(this);
    };
    // Action args
    /** Defines a text argument for actions such as `typeInto` */
    Sentence.prototype.text = function (text) {
        this.selectorArgs.set(this.currentObjectPath.join(), [text]);
        return proxify(this);
    };
    /** Defines an argument for actions by looking into the current party's attributes */
    Sentence.prototype.my = function (key) {
        if (!this.currentParty) {
            throw new Error("No party selected");
        }
        if (!Object.prototype.hasOwnProperty.call(this.currentParty, key)) {
            throw new Error("Party does not have attribute \"".concat(key, "\""));
        }
        this.selectorArgs.set(this.currentObjectPath.join(), [
            this.currentParty[key],
        ]);
        return proxify(this);
    };
    // Internal
    Sentence.prototype.findParty = function (name) {
        if (!this.sentenceContext.parties[name]) {
            throw new Error("Party \"".concat(name, "\" does not exist"));
        }
        return this.sentenceContext.parties[name];
    };
    Sentence.prototype.flattenSelectors = function () {
        var selectors = [];
        var path = [];
        var node = null;
        for (var _i = 0, _a = this.currentObjectPath; _i < _a.length; _i++) {
            var name_3 = _a[_i];
            path.push(name_3);
            if (node == null) {
                node = this.sentenceContext.pageObjects[name_3];
                selectors.push(this.flattenSelector(node.selector, path));
            }
            else {
                node = node.children[name_3];
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
    Sentence.prototype.performQueuedAction = function () {
        if (this.queuedAction == null) {
            return;
        }
        switch (this.queuedAction.kind) {
            case ActionKind.click:
                this.click();
                break;
            case ActionKind.type:
                var text = this.selectorArgs.get(this.currentObjectPath.join())[0];
                this.typeText(text);
                break;
        }
        this.queuedAction = null;
    };
    Sentence.prototype.click = function () {
        this.adapter.select(this.flattenSelectors()).click();
        return proxify(this);
    };
    Sentence.prototype.typeText = function (text) {
        this.adapter.select(this.flattenSelectors()).type(text);
        return proxify(this);
    };
    return Sentence;
}());
exports.default = Sentence;
